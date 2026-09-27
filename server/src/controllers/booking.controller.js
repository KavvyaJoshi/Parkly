import mongoose from 'mongoose';

import { Booking, generateReference } from '../models/Booking.js';
import { ParkingSpace, serializeSpace } from '../models/ParkingSpace.js';
import { AppError } from '../utils/AppError.js';
import { fitsSchedule } from '../utils/schedule.js';
import { istToDate, slotStarts } from '../utils/time.js';

const HOUR_MS = 60 * 60 * 1000;
const MAX_ADVANCE_DAYS = 60;
const START_GRACE_MS = 5 * 60 * 1000;

/** API shape of a booking, tailored to whether the viewer is the driver or the space owner. */
export function serializeBooking(booking, viewer) {
  const space = booking.space;
  const isOwnerView = viewer && booking.owner.equals(viewer._id);
  const host = space.owner;

  return {
    id: booking._id.toString(),
    reference: booking.reference,
    status: booking.status,
    startTime: booking.startTime,
    endTime: booking.endTime,
    hours: booking.hours,
    pricePerHour: booking.pricePerHour,
    totalPrice: booking.totalPrice,
    vehicleNumber: booking.vehicleNumber,
    isDemo: booking.isDemo,
    viewerRole: isOwnerView ? 'owner' : 'driver',
    // The exact address is shared while the booking is active.
    space: serializeSpace(space, { exact: booking.status === 'confirmed' }),
    host: host?.name ? { name: host.name, phone: host.phone } : undefined,
    ...(isOwnerView && booking.driver?.name
      ? { driver: { name: booking.driver.name, phone: booking.driver.phone } }
      : {}),
    cancelledAt: booking.cancelledAt,
    cancelledBy: booking.cancelledBy,
    canCancel: booking.status === 'confirmed' && booking.startTime > new Date(),
    createdAt: booking.createdAt,
  };
}

const isDuplicateKey = (err, field) => err?.code === 11000 && Object.hasOwn(err.keyPattern ?? {}, field);

export async function createBooking(req, res) {
  const { spaceId, date, time, duration, vehicleNumber } = req.body;

  const space = await ParkingSpace.findById(spaceId).populate('owner', 'name phone createdAt');
  if (!space || !space.isPublished) {
    throw new AppError('This parking space isn’t available for booking', 404);
  }
  if (space.owner._id.equals(req.user._id)) {
    throw new AppError('You can’t book your own parking space', 403);
  }

  const startTime = istToDate(date, time);
  const endTime = new Date(startTime.getTime() + duration * HOUR_MS);
  const now = Date.now();

  if (startTime.getTime() < now - START_GRACE_MS) {
    throw new AppError('That start time has already passed', 400);
  }
  if (startTime.getTime() > now + MAX_ADVANCE_DAYS * 24 * HOUR_MS) {
    throw new AppError(`Bookings can be made up to ${MAX_ADVANCE_DAYS} days ahead`, 400);
  }
  if (!fitsSchedule(space.availability, { date, time, duration })) {
    throw new AppError('This space isn’t open for the whole of that time', 400);
  }

  const fields = {
    space: space._id,
    driver: req.user._id,
    owner: space.owner._id,
    startTime,
    endTime,
    hours: duration,
    pricePerHour: space.pricePerHour,
    totalPrice: space.pricePerHour * duration,
    vehicleNumber,
    slots: slotStarts(startTime, endTime),
    isDemo: space.isDemo,
  };

  let booking;
  for (let attempt = 0; !booking; attempt += 1) {
    try {
      booking = await Booking.create({ ...fields, reference: generateReference() });
    } catch (err) {
      if (isDuplicateKey(err, 'slots')) {
        throw new AppError('Sorry, this space has just been booked for part of that time. Try another time or space.', 409);
      }
      // Reference collisions are astronomically rare; retry with a new one.
      if (!isDuplicateKey(err, 'reference') || attempt >= 2) throw err;
    }
  }

  booking.space = space;
  res.status(201).json({ success: true, booking: serializeBooking(booking, req.user) });
}

const SPACE_WITH_HOST = { path: 'space', populate: { path: 'owner', select: 'name phone createdAt' } };

/** Load a booking the current user is part of (as driver or space owner), or 404. */
async function findVisibleBooking(id, user) {
  const booking = mongoose.isValidObjectId(id)
    ? await Booking.findById(id).populate(SPACE_WITH_HOST).populate('driver', 'name phone')
    : null;

  const canView = booking && (booking.driver._id.equals(user._id) || booking.owner.equals(user._id));
  if (!canView || !booking.space) throw new AppError('Booking not found', 404);
  return booking;
}

export async function getBooking(req, res) {
  const booking = await findVisibleBooking(req.params.id, req.user);
  res.json({ success: true, booking: serializeBooking(booking, req.user) });
}

const MY_BOOKING_VIEWS = {
  upcoming: { filter: (now) => ({ status: 'confirmed', endTime: { $gt: now } }), sort: { startTime: 1 } },
  past: { filter: (now) => ({ status: 'confirmed', endTime: { $lte: now } }), sort: { startTime: -1 } },
  cancelled: { filter: () => ({ status: 'cancelled' }), sort: { cancelledAt: -1 } },
};

/** The current user's bookings as a driver, split into upcoming (incl. in progress), past and cancelled. */
export async function getMyBookings(req, res) {
  const type = MY_BOOKING_VIEWS[req.query.type] ? req.query.type : 'upcoming';
  const now = new Date();
  const mine = { driver: req.user._id };

  const [bookings, ...counts] = await Promise.all([
    Booking.find({ ...mine, ...MY_BOOKING_VIEWS[type].filter(now) })
      .sort(MY_BOOKING_VIEWS[type].sort)
      .limit(100)
      .populate(SPACE_WITH_HOST),
    ...Object.values(MY_BOOKING_VIEWS).map((view) => Booking.countDocuments({ ...mine, ...view.filter(now) })),
  ]);

  res.json({
    success: true,
    type,
    counts: Object.fromEntries(Object.keys(MY_BOOKING_VIEWS).map((key, i) => [key, counts[i]])),
    // Bookings whose space was since deleted can't be shown meaningfully.
    bookings: bookings.filter((b) => b.space).map((b) => serializeBooking(b, req.user)),
  });
}

/** Cancel a booking before it starts. Either the driver or the space owner may cancel. */
export async function cancelBooking(req, res) {
  const booking = await findVisibleBooking(req.params.id, req.user);

  if (booking.status === 'cancelled') {
    throw new AppError('This booking is already cancelled', 409);
  }
  if (booking.startTime <= new Date()) {
    throw new AppError('This booking has already started, so it can’t be cancelled', 400);
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = booking.owner.equals(req.user._id) ? 'owner' : 'driver';
  await booking.save();

  res.json({ success: true, booking: serializeBooking(booking, req.user) });
}
