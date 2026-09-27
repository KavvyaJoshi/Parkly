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

export async function getBooking(req, res) {
  const { id } = req.params;
  const booking = mongoose.isValidObjectId(id)
    ? await Booking.findById(id)
        .populate({ path: 'space', populate: { path: 'owner', select: 'name phone createdAt' } })
        .populate('driver', 'name phone')
    : null;

  // Only the driver and the space owner can see a booking.
  const canView = booking && (booking.driver._id.equals(req.user._id) || booking.owner.equals(req.user._id));
  if (!canView || !booking.space) throw new AppError('Booking not found', 404);

  res.json({ success: true, booking: serializeBooking(booking, req.user) });
}
