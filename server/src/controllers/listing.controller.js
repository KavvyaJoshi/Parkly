import mongoose from 'mongoose';

import { Booking } from '../models/Booking.js';
import { ParkingSpace, serializeSpace } from '../models/ParkingSpace.js';
import { searchListings } from '../services/listingSearch.js';
import { AppError } from '../utils/AppError.js';

const OWNER_FIELDS = 'name createdAt';

/** Convert API input ({ location: { lat, lng } }) into the stored GeoJSON shape. */
function toDocumentFields(body) {
  const { location, address, ...rest } = body;
  return {
    ...rest,
    ...(address && { address: { ...address, city: 'Pune' } }),
    ...(location && { location: { type: 'Point', coordinates: [location.lng, location.lat] } }),
  };
}

async function findOwnedSpace(id, user) {
  const space = mongoose.isValidObjectId(id) ? await ParkingSpace.findById(id) : null;
  if (!space) throw new AppError('Parking space not found', 404);
  if (!space.owner.equals(user._id)) {
    throw new AppError('You can only manage your own parking spaces', 403);
  }
  return space;
}

export async function search(req, res) {
  const result = await searchListings(req.validatedQuery);
  res.json({ success: true, ...result });
}

export async function getListing(req, res) {
  const { id } = req.params;
  const space = mongoose.isValidObjectId(id)
    ? await ParkingSpace.findById(id).populate('owner', OWNER_FIELDS)
    : null;

  // Unpublished spaces are only visible to their owner.
  const isOwner = space && req.user && space.owner._id.equals(req.user._id);
  if (!space || (!space.isPublished && !isOwner)) {
    throw new AppError('Parking space not found', 404);
  }

  res.json({ success: true, listing: serializeSpace(space, { exact: Boolean(isOwner) }) });
}

export async function getMyListings(req, res) {
  const spaces = await ParkingSpace.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, listings: spaces.map((s) => serializeSpace(s, { exact: true })) });
}

export async function createListing(req, res) {
  const space = await ParkingSpace.create({ ...toDocumentFields(req.body), owner: req.user._id });
  res.status(201).json({ success: true, listing: serializeSpace(space, { exact: true }) });
}

export async function updateListing(req, res) {
  const space = await findOwnedSpace(req.params.id, req.user);
  space.set(toDocumentFields(req.body));
  await space.save();
  res.json({ success: true, listing: serializeSpace(space, { exact: true }) });
}

export async function deleteListing(req, res) {
  const space = await findOwnedSpace(req.params.id, req.user);

  const hasUpcomingBookings = await Booking.exists({
    space: space._id,
    status: 'confirmed',
    endTime: { $gt: new Date() },
  });
  if (hasUpcomingBookings) {
    throw new AppError(
      'This space has upcoming bookings, so it can’t be deleted. Unpublish it to stop new bookings instead.',
      409,
    );
  }

  await space.deleteOne();
  res.json({ success: true, message: 'Parking space deleted' });
}
