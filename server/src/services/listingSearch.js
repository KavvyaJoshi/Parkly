import { ParkingSpace, serializeSpace } from '../models/ParkingSpace.js';
import { SEARCH_DEFAULTS, VEHICLE_SIZES } from '../constants/listing.js';
import { findArea } from '../data/puneAreas.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Match spaces whose weekly schedule covers the requested slot.
 * (Whether the slot is already booked is checked separately once bookings exist.)
 */
function scheduleFilter({ date, time, duration = 1 }) {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const alwaysOpen = { 'availability.is24x7': true };
  if (!time) {
    return { $or: [alwaysOpen, { 'availability.days': weekday }] };
  }

  const start = toMinutes(time);
  const end = start + duration * 60;
  // Slots running past midnight can only be served by 24x7 spaces.
  if (end >= 24 * 60) return alwaysOpen;

  return {
    $or: [
      alwaysOpen,
      {
        'availability.days': weekday,
        'availability.startTime': { $lte: toHHMM(start) },
        'availability.endTime': { $gte: toHHMM(end) },
      },
    ],
  };
}

const SORTS = {
  price_asc: { pricePerHour: 1, _id: 1 },
  price_desc: { pricePerHour: -1, _id: 1 },
  distance: { distance: 1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
};

/** Run a public search over published spaces. Returns listings, pagination and the search centre. */
export async function searchListings(query) {
  const filters = [{ isPublished: true }];

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filters.push({
      pricePerHour: {
        ...(query.minPrice !== undefined && { $gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
      },
    });
  }
  if (query.amenities?.length) filters.push({ amenities: { $all: query.amenities } });
  if (query.spaceType?.length) filters.push({ spaceType: { $in: query.spaceType } });
  if (query.is24x7) filters.push({ 'availability.is24x7': true });
  if (query.vehicleSize) {
    // A space fits the requested vehicle if it is rated for that size or larger.
    const fits = VEHICLE_SIZES.slice(VEHICLE_SIZES.indexOf(query.vehicleSize));
    filters.push({ vehicleSize: { $in: fits } });
  }
  const schedule = scheduleFilter(query);
  if (schedule) filters.push(schedule);

  // Work out where to search around: explicit coordinates, or a known Pune area name.
  let center = null;
  if (query.lat !== undefined) {
    center = { lat: query.lat, lng: query.lng, label: query.location || 'Your location' };
  } else if (query.location) {
    const area = findArea(query.location);
    if (area) {
      center = { lat: area.lat, lng: area.lng, label: area.name };
    } else {
      // Unknown place: fall back to matching the text against the listing's address.
      const pattern = new RegExp(escapeRegex(query.location), 'i');
      filters.push({
        $or: [
          { 'address.area': pattern },
          { 'address.line1': pattern },
          { 'address.landmark': pattern },
          { 'address.pincode': pattern },
          { title: pattern },
        ],
      });
    }
  }

  const match = { $and: filters };
  const pipeline = center
    ? [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [center.lng, center.lat] },
            distanceField: 'distance',
            maxDistance: (query.radius ?? SEARCH_DEFAULTS.radiusKm) * 1000,
            query: match,
            spherical: true,
          },
        },
      ]
    : [{ $match: match }];

  let sortKey = query.sort;
  if (sortKey === 'relevance') sortKey = center ? 'distance' : 'newest';
  if (sortKey === 'distance' && !center) sortKey = 'newest';

  const skip = (query.page - 1) * query.limit;
  pipeline.push({
    $facet: {
      results: [{ $sort: SORTS[sortKey] }, { $skip: skip }, { $limit: query.limit }],
      total: [{ $count: 'count' }],
    },
  });

  const [{ results, total }] = await ParkingSpace.aggregate(pipeline);
  const totalCount = total[0]?.count ?? 0;

  return {
    listings: results.map(serializeSpace),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit),
    },
    center,
    sort: sortKey,
  };
}
