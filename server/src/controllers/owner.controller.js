import { Booking } from '../models/Booking.js';
import { ParkingSpace } from '../models/ParkingSpace.js';

const IST_OFFSET_MS = 330 * 60 * 1000;

/** Start of the current calendar month in India, as a UTC Date. */
function startOfIstMonth(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET_MS);
}

const sumIf = (condition) => ({ $sum: { $cond: [condition, '$totalPrice', 0] } });
const countIf = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });

/**
 * Owner dashboard numbers. "Earned" is the value of completed bookings; online
 * payouts don't exist yet, so this is booking value rather than money received.
 */
export async function getOwnerSummary(req, res) {
  const now = new Date();
  const monthStart = startOfIstMonth(now);
  const completed = { $lte: ['$endTime', now] };
  const upcoming = { $gt: ['$endTime', now] };

  const [perSpace, spaces] = await Promise.all([
    Booking.aggregate([
      { $match: { owner: req.user._id, status: 'confirmed' } },
      {
        $group: {
          _id: '$space',
          earned: sumIf(completed),
          completedCount: countIf(completed),
          upcomingValue: sumIf(upcoming),
          upcomingCount: countIf(upcoming),
          earnedThisMonth: sumIf({ $and: [completed, { $gte: ['$endTime', monthStart] }] }),
        },
      },
    ]),
    ParkingSpace.find({ owner: req.user._id }).select('title isPublished pricePerHour address.area isDemo photos spaceType').sort({ createdAt: -1 }),
  ]);

  const statsBySpace = new Map(perSpace.map((row) => [row._id.toString(), row]));
  const total = (key) => perSpace.reduce((sum, row) => sum + row[key], 0);

  res.json({
    success: true,
    summary: {
      earned: total('earned'),
      earnedThisMonth: total('earnedThisMonth'),
      completedBookings: total('completedCount'),
      upcomingValue: total('upcomingValue'),
      upcomingBookings: total('upcomingCount'),
      listings: spaces.length,
      publishedListings: spaces.filter((s) => s.isPublished).length,
    },
    listings: spaces.map((space) => {
      const stats = statsBySpace.get(space._id.toString());
      return {
        id: space._id.toString(),
        title: space.title,
        area: space.address.area,
        spaceType: space.spaceType,
        photos: space.photos,
        pricePerHour: space.pricePerHour,
        isPublished: space.isPublished,
        completedBookings: stats?.completedCount ?? 0,
        upcomingBookings: stats?.upcomingCount ?? 0,
        earned: stats?.earned ?? 0,
      };
    }),
  });
}
