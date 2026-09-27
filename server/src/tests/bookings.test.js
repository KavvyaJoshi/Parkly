import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createApp } from '../app.js';
import { Booking } from '../models/Booking.js';
import { createUser, listingPayload } from './helpers/factories.js';

const app = createApp();

/** The next date (YYYY-MM-DD, IST) that falls on `weekday` (0 = Sunday), at least 1 day ahead. */
function nextWeekday(weekday) {
  const ist = new Date(Date.now() + 330 * 60 * 1000);
  for (let i = 1; i <= 8; i += 1) {
    const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + i));
    if (d.getUTCDay() === weekday) return d.toISOString().slice(0, 10);
  }
  throw new Error('unreachable');
}

const MONDAY = nextWeekday(1);
const SUNDAY = nextWeekday(0);

let host;
let driver;
let space;

const book = (overrides = {}, auth = driver.auth) =>
  request(app)
    .post('/api/bookings')
    .set('Authorization', auth)
    .send({ spaceId: space.id, date: MONDAY, time: '10:00', duration: 2, vehicleNumber: 'MH 12 AB 1234', ...overrides });

beforeEach(async () => {
  host = await createUser({ name: 'Anjali Patwardhan', phone: '9822012345' });
  driver = await createUser({ name: 'Rahul Mehta', phone: '9765012345' });
  // Open Mon–Fri 09:00–19:00 at ₹40/hr.
  const res = await request(app)
    .post('/api/listings')
    .set('Authorization', host.auth)
    .send(listingPayload({ address: { line1: 'Sai Vihar Society, Lane 5', area: 'Baner', pincode: '411045' } }));
  space = res.body.listing;
});

describe('POST /api/bookings', () => {
  it('creates a confirmed booking with a price snapshot, IST times and the exact address', async () => {
    const res = await book();

    expect(res.status).toBe(201);
    const { booking } = res.body;
    expect(booking).toMatchObject({
      status: 'confirmed',
      hours: 2,
      pricePerHour: 40,
      totalPrice: 80,
      vehicleNumber: 'MH12AB1234',
      viewerRole: 'driver',
      host: { name: 'Anjali Patwardhan', phone: '9822012345' },
    });
    expect(booking.reference).toMatch(/^PK-[A-Z2-9]{6}$/);
    // 10:00 IST is 04:30 UTC.
    expect(booking.startTime).toBe(`${MONDAY}T04:30:00.000Z`);
    expect(booking.endTime).toBe(`${MONDAY}T06:30:00.000Z`);
    expect(booking.space.address.line1).toBe('Sai Vihar Society, Lane 5');
    expect(booking).not.toHaveProperty('driver');
  });

  it('requires login', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.status).toBe(401);
  });

  it('keeps the booked price if the owner later changes it', async () => {
    const { body } = await book();
    await request(app).patch(`/api/listings/${space.id}`).set('Authorization', host.auth).send({ pricePerHour: 90 });

    const res = await request(app).get(`/api/bookings/${body.booking.id}`).set('Authorization', driver.auth);
    expect(res.body.booking.totalPrice).toBe(80);
  });

  it('rejects overlapping bookings but allows back-to-back ones', async () => {
    expect((await book()).status).toBe(201); // 10:00–12:00

    const overlap = await book({ time: '11:30', duration: 1 }, (await createUser()).auth);
    expect(overlap.status).toBe(409);
    expect(overlap.body.message).toMatch(/just been booked/i);

    const backToBack = await book({ time: '12:00', duration: 1 }, (await createUser()).auth);
    expect(backToBack.status).toBe(201);
  });

  it('lets only one of two simultaneous requests for the same slot succeed', async () => {
    const other = await createUser();
    const results = await Promise.all([book(), book({}, other.auth)]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await Booking.countDocuments({ status: 'confirmed' })).toBe(1);
  });

  it('frees the slot when a booking is cancelled', async () => {
    const { body } = await book();
    await Booking.updateOne({ _id: body.booking.id }, { status: 'cancelled' });

    expect((await book({}, (await createUser()).auth)).status).toBe(201);
  });

  it('rejects slots outside opening hours', async () => {
    const lateEvening = await book({ time: '18:00', duration: 2 });
    const sunday = await book({ date: SUNDAY });

    expect(lateEvening.status).toBe(400);
    expect(sunday.status).toBe(400);
    expect(sunday.body.message).toMatch(/isn’t open/i);
  });

  it('rejects past times and bookings too far ahead', async () => {
    const past = await book({ date: '2020-01-06' });
    const farAhead = await book({ date: '2099-01-05' });

    expect(past.status).toBe(400);
    expect(past.body.message).toMatch(/already passed/i);
    expect(farAhead.status).toBe(400);
  });

  it('validates the time, duration and vehicle number', async () => {
    const res = await book({ time: '10:15', duration: 0, vehicleNumber: 'ABC' });

    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['time', 'duration', 'vehicleNumber']),
    );
  });

  it('accepts Bharat-series plates', async () => {
    expect((await book({ vehicleNumber: '22 BH 1234 AA' })).status).toBe(201);
  });

  it('does not allow booking your own space', async () => {
    const res = await book({}, host.auth);
    expect(res.status).toBe(403);
  });

  it('does not allow booking an unpublished space', async () => {
    await request(app).patch(`/api/listings/${space.id}`).set('Authorization', host.auth).send({ isPublished: false });
    expect((await book()).status).toBe(404);
  });
});

describe('GET /api/bookings/:id', () => {
  it('is visible to the driver and the owner (who also sees driver contact details)', async () => {
    const { body } = await book();
    const url = `/api/bookings/${body.booking.id}`;

    const asOwner = await request(app).get(url).set('Authorization', host.auth);
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.booking).toMatchObject({
      viewerRole: 'owner',
      driver: { name: 'Rahul Mehta', phone: '9765012345' },
    });

    const asDriver = await request(app).get(url).set('Authorization', driver.auth);
    expect(asDriver.body.booking.viewerRole).toBe('driver');
  });

  it('is hidden from everyone else', async () => {
    const { body } = await book();
    const stranger = await createUser();

    const res = await request(app).get(`/api/bookings/${body.booking.id}`).set('Authorization', stranger.auth);
    expect(res.status).toBe(404);
  });
});

/** Insert a booking directly (bypassing API checks) to simulate past or in-progress bookings. */
async function insertBooking({ startOffsetHours, hours = 2, status = 'confirmed', driverUser = driver.user }) {
  const start = new Date(Math.floor(Date.now() / 1_800_000) * 1_800_000 + startOffsetHours * 3_600_000);
  const end = new Date(start.getTime() + hours * 3_600_000);
  const slots = [];
  for (let t = start.getTime(); t < end.getTime(); t += 1_800_000) slots.push(new Date(t));
  return Booking.create({
    reference: `PK-T${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    space: space.id,
    driver: driverUser._id,
    owner: host.user._id,
    startTime: start,
    endTime: end,
    hours,
    pricePerHour: 40,
    totalPrice: 40 * hours,
    vehicleNumber: 'MH12AB1234',
    status,
    slots,
    ...(status === 'cancelled' && { cancelledAt: new Date(), cancelledBy: 'driver' }),
  });
}

describe('GET /api/bookings/mine', () => {
  it('splits my bookings into upcoming (incl. in progress), past and cancelled', async () => {
    await insertBooking({ startOffsetHours: -48 }); // past
    await insertBooking({ startOffsetHours: -1 }); // in progress
    await insertBooking({ startOffsetHours: 24 }); // upcoming
    await insertBooking({ startOffsetHours: 48, status: 'cancelled' });
    await insertBooking({ startOffsetHours: 72, driverUser: (await createUser()).user }); // someone else's

    const get = (type) => request(app).get('/api/bookings/mine').query({ type }).set('Authorization', driver.auth);
    const upcoming = await get('upcoming');

    expect(upcoming.status).toBe(200);
    expect(upcoming.body.counts).toEqual({ upcoming: 2, past: 1, cancelled: 1 });
    // Soonest first: the in-progress booking comes before tomorrow's.
    const [first, second] = upcoming.body.bookings;
    expect(new Date(first.startTime) < new Date(second.startTime)).toBe(true);

    expect((await get('past')).body.bookings).toHaveLength(1);
    expect((await get('cancelled')).body.bookings[0].status).toBe('cancelled');
  });

  it('requires login', async () => {
    expect((await request(app).get('/api/bookings/mine')).status).toBe(401);
  });
});

describe('PATCH /api/bookings/:id/cancel', () => {
  const cancel = (id, auth = driver.auth) =>
    request(app).patch(`/api/bookings/${id}/cancel`).set('Authorization', auth);

  it('lets the driver cancel before it starts, hiding the exact address and freeing the slot', async () => {
    const { body } = await book();
    expect(body.booking.canCancel).toBe(true);

    const res = await cancel(body.booking.id);

    expect(res.status).toBe(200);
    expect(res.body.booking).toMatchObject({ status: 'cancelled', cancelledBy: 'driver', canCancel: false });
    expect(res.body.booking.space.address).not.toHaveProperty('line1');
    expect((await book({}, (await createUser()).auth)).status).toBe(201);
  });

  it('lets the space owner cancel', async () => {
    const { body } = await book();
    const res = await cancel(body.booking.id, host.auth);

    expect(res.status).toBe(200);
    expect(res.body.booking.cancelledBy).toBe('owner');
  });

  it('refuses to cancel a booking that has started', async () => {
    const started = await insertBooking({ startOffsetHours: -1 });
    const res = await cancel(started._id.toString());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already started/i);
  });

  it('refuses to cancel twice', async () => {
    const { body } = await book();
    await cancel(body.booking.id);
    expect((await cancel(body.booking.id)).status).toBe(409);
  });

  it('hides other people’s bookings', async () => {
    const { body } = await book();
    const stranger = await createUser();
    expect((await cancel(body.booking.id, stranger.auth)).status).toBe(404);
  });
});

describe('bookings and listings', () => {
  it('hides booked spaces from search for overlapping slots only', async () => {
    await book(); // 10:00–12:00

    const overlapping = await request(app)
      .get('/api/listings')
      .query({ location: 'Baner', date: MONDAY, time: '11:00', duration: 2 });
    const later = await request(app)
      .get('/api/listings')
      .query({ location: 'Baner', date: MONDAY, time: '12:00', duration: 2 });

    expect(overlapping.body.pagination.total).toBe(0);
    expect(later.body.pagination.total).toBe(1);
  });

  it('blocks deleting a listing with upcoming bookings', async () => {
    await book();
    const res = await request(app).delete(`/api/listings/${space.id}`).set('Authorization', host.auth);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/unpublish/i);
  });
});
