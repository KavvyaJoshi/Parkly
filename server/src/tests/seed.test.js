import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../app.js';
import { ParkingSpace } from '../models/ParkingSpace.js';
import { User } from '../models/User.js';
import { PUNE_AREAS } from '../data/puneAreas.js';
import { seedDemoData } from '../seed/seedDemoData.js';
import { createUser, listingPayload } from './helpers/factories.js';

const app = createApp();

describe('demo seed data', () => {
  it('creates valid, published, demo-labelled listings in every Pune area', async () => {
    const result = await seedDemoData();

    expect(result).toEqual({ hosts: 5, listings: 30 });
    const spaces = await ParkingSpace.find();
    expect(spaces.every((s) => s.isDemo && s.isPublished)).toBe(true);

    for (const area of PUNE_AREAS) {
      const res = await request(app).get('/api/listings').query({ location: area.name });
      expect(res.body.pagination.total, area.name).toBeGreaterThanOrEqual(3);
    }
  });

  it('is safe to re-run and never touches real users or listings', async () => {
    const { auth } = await createUser();
    await request(app).post('/api/listings').set('Authorization', auth).send(listingPayload());

    await seedDemoData();
    await seedDemoData();

    expect(await ParkingSpace.countDocuments({ isDemo: true })).toBe(30);
    expect(await ParkingSpace.countDocuments({ isDemo: false })).toBe(1);
    expect(await User.countDocuments({ isDemo: true })).toBe(5);
    expect(await User.countDocuments({ isDemo: false })).toBe(1);
  });
});
