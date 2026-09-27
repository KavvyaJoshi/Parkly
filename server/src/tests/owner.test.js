import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createApp } from '../app.js';
import { Booking } from '../models/Booking.js';
import { createUser, listingPayload } from './helpers/factories.js';

const app = createApp();
const HALF_HOUR = 1_800_000;
const HOUR = 3_600_000;

let host;
let driver;
let spaceA;
let spaceB;
let refCounter = 0;

/** Insert a booking directly so we can create past/in-progress ones. */
function insertBooking(space, { startOffsetHours, hours = 2, pricePerHour = 40, status = 'confirmed' }) {
  const start = new Date(Math.floor(Date.now() / HALF_HOUR) * HALF_HOUR + startOffsetHours * HOUR);
  const end = new Date(start.getTime() + hours * HOUR);
  const slots = [];
  for (let t = start.getTime(); t < end.getTime(); t += HALF_HOUR) slots.push(new Date(t));
  refCounter += 1;
  return Booking.create({
    reference: `PK-OWN${String(refCounter).padStart(3, '0')}`,
    space: space.id,
    driver: driver.user._id,
    owner: host.user._id,
    startTime: start,
    endTime: end,
    hours,
    pricePerHour,
    totalPrice: pricePerHour * hours,
    vehicleNumber: 'MH12AB1234',
    status,
    slots,
  });
}

const get = (path, auth = host.auth) => request(app).get(path).set('Authorization', auth);

beforeEach(async () => {
  host = await createUser({ name: 'Anjali Patwardhan' });
  driver = await createUser({ name: 'Rahul Mehta', phone: '9765012345' });
  const create = (overrides) =>
    request(app).post('/api/listings').set('Authorization', host.auth).send(listingPayload(overrides));
  spaceA = (await create({ title: 'Covered slot A in Baner' })).body.listing;
  spaceB = (await create({ title: 'Draft slot B in Baner', isPublished: false })).body.listing;
});

describe('GET /api/owner/summary', () => {
  it('totals earned (completed) and upcoming booking value, per listing and overall', async () => {
    await insertBooking(spaceA, { startOffsetHours: -3, hours: 2 }); // completed: ₹80
    await insertBooking(spaceA, { startOffsetHours: -30 * 24, hours: 1 }); // completed ~a month ago: ₹40
    await insertBooking(spaceA, { startOffsetHours: 24, hours: 3 }); // upcoming: ₹120
    await insertBooking(spaceA, { startOffsetHours: 48, hours: 2, status: 'cancelled' }); // ignored
    await insertBooking(spaceB, { startOffsetHours: -1, hours: 2, pricePerHour: 50 }); // in progress: upcoming ₹100

    const res = await get('/api/owner/summary');

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({
      earned: 120,
      completedBookings: 2,
      upcomingValue: 220,
      upcomingBookings: 2,
      listings: 2,
      publishedListings: 1,
    });
    // The ₹80 booking ended today, so it always counts this month; the older one may or may not.
    expect(res.body.summary.earnedThisMonth).toBeGreaterThanOrEqual(80);

    const a = res.body.listings.find((l) => l.id === spaceA.id);
    const b = res.body.listings.find((l) => l.id === spaceB.id);
    expect(a).toMatchObject({ earned: 120, completedBookings: 2, upcomingBookings: 1, isPublished: true });
    expect(b).toMatchObject({ earned: 0, completedBookings: 0, upcomingBookings: 1, isPublished: false });
  });

  it('is empty for a brand-new host', async () => {
    const newbie = await createUser();
    const res = await get('/api/owner/summary', newbie.auth);

    expect(res.body.summary).toMatchObject({ earned: 0, upcomingValue: 0, listings: 0 });
    expect(res.body.listings).toEqual([]);
  });

  it('never includes other hosts’ bookings', async () => {
    await insertBooking(spaceA, { startOffsetHours: -3 });
    const otherHost = await createUser();

    const res = await get('/api/owner/summary', otherHost.auth);
    expect(res.body.summary.earned).toBe(0);
  });
});

describe('GET /api/owner/bookings', () => {
  it('lists bookings on my spaces with driver details', async () => {
    await insertBooking(spaceA, { startOffsetHours: 24 });
    await insertBooking(spaceB, { startOffsetHours: 30 });
    await insertBooking(spaceA, { startOffsetHours: -5 });

    const res = await get('/api/owner/bookings?type=upcoming');

    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual({ upcoming: 2, past: 1, cancelled: 0 });
    expect(res.body.bookings[0]).toMatchObject({
      viewerRole: 'owner',
      driver: { name: 'Rahul Mehta', phone: '9765012345' },
    });
  });

  it('can filter to one space', async () => {
    await insertBooking(spaceA, { startOffsetHours: 24 });
    await insertBooking(spaceB, { startOffsetHours: 30 });

    const res = await get(`/api/owner/bookings?type=upcoming&space=${spaceB.id}`);
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].space.id).toBe(spaceB.id);
  });

  it('shows nothing to drivers who are not hosts', async () => {
    await insertBooking(spaceA, { startOffsetHours: 24 });
    const res = await get('/api/owner/bookings', driver.auth);
    expect(res.body.bookings).toEqual([]);
  });
});
