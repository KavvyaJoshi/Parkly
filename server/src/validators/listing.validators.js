import { z } from 'zod';
import {
  AMENITIES,
  PRICE_LIMITS,
  SEARCH_DEFAULTS,
  SERVICE_AREA,
  SPACE_TYPES,
  VEHICLE_SIZES,
} from '../constants/listing.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Use 24-hour HH:MM time' });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Use YYYY-MM-DD date' });
const outsidePune = `Parkly is currently available in ${SERVICE_AREA.name} only`;

const availability = z
  .object({
    is24x7: z.boolean().default(false),
    days: z
      .array(z.number().int().min(0).max(6))
      .min(1, { error: 'Choose at least one day' })
      .transform((days) => [...new Set(days)].sort()),
    startTime: time.default('08:00'),
    endTime: time.default('20:00'),
  })
  .refine((a) => a.is24x7 || a.startTime < a.endTime, {
    error: 'Closing time must be after opening time',
    path: ['endTime'],
  });

const listingFields = {
  title: z.string().trim().min(5, { error: 'Title must be at least 5 characters' }).max(100),
  description: z.string().trim().max(1000).default(''),
  spaceType: z.enum(SPACE_TYPES, { error: 'Choose a valid space type' }),
  vehicleSize: z.enum(VEHICLE_SIZES, { error: 'Choose the largest vehicle that fits' }),
  address: z.object({
    line1: z.string().trim().min(5, { error: 'Enter the street address' }).max(200),
    area: z.string().trim().min(2, { error: 'Enter the area or locality' }).max(60),
    landmark: z.string().trim().max(100).optional(),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, { error: 'Enter a valid 6-digit PIN code' }),
  }),
  location: z.object({
    lat: z.number().min(SERVICE_AREA.minLat, { error: outsidePune }).max(SERVICE_AREA.maxLat, { error: outsidePune }),
    lng: z.number().min(SERVICE_AREA.minLng, { error: outsidePune }).max(SERVICE_AREA.maxLng, { error: outsidePune }),
  }),
  pricePerHour: z
    .number({ error: 'Enter an hourly price' })
    .int({ error: 'Use a whole number of rupees' })
    .min(PRICE_LIMITS.min, { error: `Minimum price is ₹${PRICE_LIMITS.min}/hr` })
    .max(PRICE_LIMITS.max, { error: `Maximum price is ₹${PRICE_LIMITS.max}/hr` }),
  amenities: z
    .array(z.enum(AMENITIES))
    .default([])
    .transform((items) => [...new Set(items)]),
  rules: z.array(z.string().trim().min(1).max(200)).max(10, { error: 'Add up to 10 rules' }).default([]),
  availability: availability.default({ is24x7: false, days: [0, 1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '20:00' }),
  isPublished: z.boolean().default(false),
};

export const createListingSchema = z.object(listingFields);

// Updates may send any subset of fields; defaults are not applied so untouched fields stay as they are.
export const updateListingSchema = z
  .object({
    title: listingFields.title,
    description: z.string().trim().max(1000),
    spaceType: listingFields.spaceType,
    vehicleSize: listingFields.vehicleSize,
    address: listingFields.address,
    location: listingFields.location,
    pricePerHour: listingFields.pricePerHour,
    amenities: listingFields.amenities,
    rules: z.array(z.string().trim().min(1).max(200)).max(10, { error: 'Add up to 10 rules' }),
    availability,
    isPublished: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: 'Nothing to update' });

const csv = (allowed) =>
  z
    .string()
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(z.enum(allowed, { error: `Allowed values: ${allowed.join(', ')}` })));

export const searchQuerySchema = z
  .object({
    location: z.string().trim().max(100).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().min(0.5).max(SEARCH_DEFAULTS.maxRadiusKm).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    amenities: csv(AMENITIES).optional(),
    vehicleSize: z.enum(VEHICLE_SIZES).optional(),
    spaceType: csv(SPACE_TYPES).optional(),
    is24x7: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    date: date.optional(),
    time: time.optional(),
    duration: z.coerce.number().int().min(1).max(24).optional(),
    sort: z.enum(['relevance', 'price_asc', 'price_desc', 'distance', 'newest']).default('relevance'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(SEARCH_DEFAULTS.maxLimit).default(SEARCH_DEFAULTS.limit),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    error: 'Provide both lat and lng',
    path: ['lat'],
  })
  .refine((q) => !q.time || q.date, { error: 'A date is required when a time is given', path: ['date'] });
