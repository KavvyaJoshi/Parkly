import mongoose from 'mongoose';
import { AMENITIES, PRICE_LIMITS, SPACE_TYPES, VEHICLE_SIZES } from '../constants/listing.js';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String, // Cloudinary id, used to delete the image later
  },
  { _id: false },
);

const availabilitySchema = new mongoose.Schema(
  {
    is24x7: { type: Boolean, default: false },
    // Days of the week the space is open: 0 = Sunday ... 6 = Saturday.
    days: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    // Daily window in 24h "HH:MM". Ignored when is24x7 is true.
    startTime: { type: String, match: TIME_RE, default: '08:00' },
    endTime: { type: String, match: TIME_RE, default: '20:00' },
  },
  { _id: false },
);

const parkingSpaceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    spaceType: { type: String, enum: SPACE_TYPES, required: true },
    vehicleSize: { type: String, enum: VEHICLE_SIZES, required: true },
    address: {
      line1: { type: String, required: true, trim: true, maxlength: 200 },
      area: { type: String, required: true, trim: true, maxlength: 60 },
      landmark: { type: String, trim: true, maxlength: 100 },
      city: { type: String, default: 'Pune', trim: true },
      pincode: { type: String, required: true, match: /^[1-9]\d{5}$/ },
    },
    // GeoJSON point: coordinates are [longitude, latitude].
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    pricePerHour: { type: Number, required: true, min: PRICE_LIMITS.min, max: PRICE_LIMITS.max },
    amenities: { type: [{ type: String, enum: AMENITIES }], default: [] },
    rules: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    photos: { type: [photoSchema], default: [] },
    availability: { type: availabilitySchema, default: () => ({}) },
    isPublished: { type: Boolean, default: false, index: true },
    // Demo listings are seeded sample data and are labelled as such in the UI.
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

parkingSpaceSchema.index({ location: '2dsphere' });
parkingSpaceSchema.index({ isPublished: 1, pricePerHour: 1 });

// ~100 m precision for public map positions.
const approx = (n) => Math.round(n * 1000) / 1000;

/**
 * Convert a document (or a plain aggregate result) into the API shape.
 * By default this is the public view: the street address is hidden and the map
 * position is approximate. Pass { exact: true } for the owner (and, later, drivers
 * with a confirmed booking).
 */
export function serializeSpace(doc, { exact = false } = {}) {
  const space = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const [lng, lat] = space.location.coordinates;
  const owner = space.owner;
  const { line1, ...publicAddress } = space.address;

  return {
    id: space._id.toString(),
    title: space.title,
    description: space.description,
    spaceType: space.spaceType,
    vehicleSize: space.vehicleSize,
    address: exact ? { line1, ...publicAddress } : publicAddress,
    location: exact ? { lat, lng } : { lat: approx(lat), lng: approx(lng) },
    isExactLocation: exact,
    pricePerHour: space.pricePerHour,
    amenities: space.amenities,
    rules: space.rules,
    photos: space.photos,
    availability: space.availability,
    isPublished: space.isPublished,
    isDemo: space.isDemo,
    owner:
      owner && typeof owner === 'object' && owner.name
        ? { id: owner._id.toString(), name: owner.name, memberSince: owner.createdAt }
        : owner?.toString(),
    ...(space.distance !== undefined ? { distanceMeters: Math.round(space.distance) } : {}),
    createdAt: space.createdAt,
    updatedAt: space.updatedAt,
  };
}

export const ParkingSpace = mongoose.model('ParkingSpace', parkingSpaceSchema);
