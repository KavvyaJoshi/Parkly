import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { createApp } from '../app.js';
import { createUser, listingPayload } from './helpers/factories.js';

const app = createApp();

const createListing = (auth, overrides) =>
  request(app).post('/api/listings').set('Authorization', auth).send(listingPayload(overrides));

const search = (query) => request(app).get('/api/listings').query(query);

describe('POST /api/listings', () => {
  it('requires login', async () => {
    const res = await request(app).post('/api/listings').send(listingPayload());
    expect(res.status).toBe(401);
  });

  it('creates a listing owned by the current user', async () => {
    const { user, auth } = await createUser();
    const res = await createListing(auth);

    expect(res.status).toBe(201);
    expect(res.body.listing).toMatchObject({
      title: 'Covered parking near Baner Road',
      owner: user._id.toString(),
      location: { lat: 18.56, lng: 73.787 },
      address: { area: 'Baner', city: 'Pune', pincode: '411045' },
      pricePerHour: 40,
      isPublished: true,
      isDemo: false,
    });
  });

  it('defaults to an unpublished draft', async () => {
    const { auth } = await createUser();
    const { isPublished: _omit, ...payload } = listingPayload();
    const res = await request(app).post('/api/listings').set('Authorization', auth).send(payload);

    expect(res.status).toBe(201);
    expect(res.body.listing.isPublished).toBe(false);
  });

  it('rejects locations outside Pune', async () => {
    const { auth } = await createUser();
    const res = await createListing(auth, { location: { lat: 19.076, lng: 72.8777 } }); // Mumbai

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch(/pune only/i);
  });

  it('validates price, PIN code, amenities and opening hours', async () => {
    const { auth } = await createUser();
    const res = await createListing(auth, {
      pricePerHour: 5,
      address: { line1: 'Lane 5, Baner Road', area: 'Baner', pincode: '12345' },
      amenities: ['helipad'],
      availability: { is24x7: false, days: [1], startTime: '20:00', endTime: '09:00' },
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['pricePerHour', 'address.pincode', 'amenities.0', 'availability.endTime']),
    );
  });
});

describe('owner management', () => {
  it('lets the owner update and unpublish a listing', async () => {
    const { auth } = await createUser();
    const { body } = await createListing(auth);

    const res = await request(app)
      .patch(`/api/listings/${body.listing.id}`)
      .set('Authorization', auth)
      .send({ pricePerHour: 55, isPublished: false });

    expect(res.status).toBe(200);
    expect(res.body.listing).toMatchObject({ pricePerHour: 55, isPublished: false });
    expect(res.body.listing.title).toBe('Covered parking near Baner Road');
  });

  it('forbids editing or deleting someone else’s listing', async () => {
    const owner = await createUser();
    const other = await createUser();
    const { body } = await createListing(owner.auth);

    const patch = await request(app)
      .patch(`/api/listings/${body.listing.id}`)
      .set('Authorization', other.auth)
      .send({ pricePerHour: 10 });
    const del = await request(app).delete(`/api/listings/${body.listing.id}`).set('Authorization', other.auth);

    expect(patch.status).toBe(403);
    expect(del.status).toBe(403);
  });

  it('lets the owner delete a listing', async () => {
    const { auth } = await createUser();
    const { body } = await createListing(auth);

    const res = await request(app).delete(`/api/listings/${body.listing.id}`).set('Authorization', auth);
    expect(res.status).toBe(200);

    const after = await request(app).get(`/api/listings/${body.listing.id}`).set('Authorization', auth);
    expect(after.status).toBe(404);
  });

  it('lists all of my listings, including drafts', async () => {
    const me = await createUser();
    const other = await createUser();
    await createListing(me.auth, { isPublished: false });
    await createListing(me.auth, { title: 'My second space in Baner' });
    await createListing(other.auth);

    const res = await request(app).get('/api/listings/mine').set('Authorization', me.auth);

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(2);
  });
});

describe('GET /api/listings/:id', () => {
  it('returns a published listing with public owner info only', async () => {
    const { user, auth } = await createUser({ name: 'Anjali Patwardhan' });
    const { body } = await createListing(auth);

    const res = await request(app).get(`/api/listings/${body.listing.id}`);

    expect(res.status).toBe(200);
    expect(res.body.listing.owner).toEqual({
      id: user._id.toString(),
      name: 'Anjali Patwardhan',
      memberSince: expect.any(String),
    });
    expect(JSON.stringify(res.body)).not.toContain(user.email);
  });

  it('hides unpublished listings from everyone except the owner', async () => {
    const owner = await createUser();
    const other = await createUser();
    const { body } = await createListing(owner.auth, { isPublished: false });
    const url = `/api/listings/${body.listing.id}`;

    expect((await request(app).get(url)).status).toBe(404);
    expect((await request(app).get(url).set('Authorization', other.auth)).status).toBe(404);
    expect((await request(app).get(url).set('Authorization', owner.auth)).status).toBe(200);
  });

  it('hides the street address and exact position from the public, but not the owner', async () => {
    const { auth } = await createUser();
    const { body } = await createListing(auth, { location: { lat: 18.561234, lng: 73.787654 } });
    const url = `/api/listings/${body.listing.id}`;

    const publicView = (await request(app).get(url)).body.listing;
    expect(publicView.address).not.toHaveProperty('line1');
    expect(publicView.location).toEqual({ lat: 18.561, lng: 73.788 });
    expect(publicView.isExactLocation).toBe(false);

    const searchView = (await search({ location: 'Baner' })).body.listings[0];
    expect(searchView.address).not.toHaveProperty('line1');

    const ownerView = (await request(app).get(url).set('Authorization', auth)).body.listing;
    expect(ownerView.address.line1).toBe('Lane 5, Baner Road');
    expect(ownerView.location).toEqual({ lat: 18.561234, lng: 73.787654 });
  });

  it('returns 404 for malformed ids', async () => {
    const res = await request(app).get('/api/listings/not-an-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/listings (search)', () => {
  beforeEach(async () => {
    const { auth } = await createUser();
    // Baner (near the area centre)
    await createListing(auth, { title: 'Baner cheap sedan spot', pricePerHour: 30 });
    await createListing(auth, {
      title: 'Baner covered SUV garage',
      spaceType: 'garage',
      vehicleSize: 'suv',
      pricePerHour: 60,
      amenities: ['covered', 'ev_charging'],
      location: { lat: 18.562, lng: 73.79 },
      availability: { is24x7: true, days: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' },
    });
    // Hadapsar (far from Baner)
    await createListing(auth, {
      title: 'Hadapsar driveway',
      spaceType: 'driveway',
      address: { line1: 'Amanora Road', area: 'Hadapsar', landmark: 'Amanora Mall', pincode: '411028' },
      location: { lat: 18.509, lng: 73.926 },
      pricePerHour: 25,
    });
    // Unpublished draft in Baner — must never appear
    await createListing(auth, { title: 'Baner hidden draft', isPublished: false });
  });

  it('finds published spaces near a known area, nearest first, with distances', async () => {
    const res = await search({ location: 'baner' });

    expect(res.status).toBe(200);
    expect(res.body.center).toMatchObject({ label: 'Baner' });
    const titles = res.body.listings.map((l) => l.title);
    expect(titles).toEqual(['Baner cheap sedan spot', 'Baner covered SUV garage']);
    expect(res.body.listings[0].distanceMeters).toEqual(expect.any(Number));
    expect(res.body.pagination.total).toBe(2);
  });

  it('falls back to text search for unknown places', async () => {
    const res = await search({ location: 'amanora' });

    expect(res.body.center).toBeNull();
    expect(res.body.listings.map((l) => l.title)).toEqual(['Hadapsar driveway']);
  });

  it('filters by price range', async () => {
    const res = await search({ minPrice: 26, maxPrice: 40 });
    expect(res.body.listings.map((l) => l.title)).toEqual(['Baner cheap sedan spot']);
  });

  it('requires all selected amenities', async () => {
    const res = await search({ amenities: 'covered,ev_charging' });
    expect(res.body.listings.map((l) => l.title)).toEqual(['Baner covered SUV garage']);
  });

  it('only returns spaces big enough for the vehicle', async () => {
    const res = await search({ vehicleSize: 'suv' });
    expect(res.body.listings.map((l) => l.title)).toEqual(['Baner covered SUV garage']);
  });

  it('filters by space type', async () => {
    const res = await search({ spaceType: 'driveway,garage', sort: 'price_asc' });
    expect(res.body.listings.map((l) => l.title)).toEqual(['Hadapsar driveway', 'Baner covered SUV garage']);
  });

  it('matches opening hours for the requested slot', async () => {
    // 2026-10-05 is a Monday. Weekday spaces are open 09:00–19:00.
    const withinHours = await search({ date: '2026-10-05', time: '10:00', duration: 3, sort: 'price_asc' });
    expect(withinHours.body.pagination.total).toBe(3);

    const lateEvening = await search({ date: '2026-10-05', time: '18:00', duration: 2 });
    expect(lateEvening.body.listings.map((l) => l.title)).toEqual(['Baner covered SUV garage']);

    // 2026-10-04 is a Sunday: only the 24x7 space is open.
    const sunday = await search({ date: '2026-10-04', time: '11:00', duration: 1 });
    expect(sunday.body.listings.map((l) => l.title)).toEqual(['Baner covered SUV garage']);

    const overnight = await search({ date: '2026-10-05', time: '22:00', duration: 4 });
    expect(overnight.body.listings.map((l) => l.title)).toEqual(['Baner covered SUV garage']);
  });

  it('sorts by price and paginates', async () => {
    const page1 = await search({ sort: 'price_desc', limit: 2, page: 1 });
    const page2 = await search({ sort: 'price_desc', limit: 2, page: 2 });

    expect(page1.body.listings.map((l) => l.pricePerHour)).toEqual([60, 30]);
    expect(page2.body.listings.map((l) => l.pricePerHour)).toEqual([25]);
    expect(page1.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects invalid query parameters', async () => {
    const res = await search({ vehicleSize: 'truck', sort: 'random' });

    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['vehicleSize', 'sort']));
  });
});
