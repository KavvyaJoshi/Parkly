import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

import { createApp } from '../app.js';
import { imageStorage } from '../services/imageStorage.js';
import { createUser, listingPayload } from './helpers/factories.js';

// Replace Cloudinary with an in-memory fake: tests must never touch a real account.
vi.mock('../services/imageStorage.js', () => {
  let counter = 0;
  return {
    imageStorage: {
      isConfigured: vi.fn(() => true),
      upload: vi.fn(async (buffer, { folder }) => {
        counter += 1;
        return { url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/p${counter}.jpg`, publicId: `${folder}/p${counter}` };
      }),
      destroy: vi.fn(async () => {}),
    },
  };
});

const app = createApp();
// A tiny valid JPEG header is enough: the fake storage never decodes it.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

let owner;
let listing;

const upload = (count = 1, { auth = owner.auth, type = 'image/jpeg', name = 'spot.jpg', size } = {}) => {
  let req = request(app).post(`/api/listings/${listing.id}/photos`).set('Authorization', auth);
  for (let i = 0; i < count; i += 1) {
    req = req.attach('photos', size ? Buffer.alloc(size) : JPEG, { filename: `${i}-${name}`, contentType: type });
  }
  return req;
};

beforeEach(async () => {
  vi.clearAllMocks();
  imageStorage.isConfigured.mockReturnValue(true);
  owner = await createUser();
  listing = (await request(app).post('/api/listings').set('Authorization', owner.auth).send(listingPayload())).body.listing;
});

describe('POST /api/listings/:id/photos', () => {
  it('uploads photos to storage and adds them to the listing', async () => {
    const res = await upload(2);

    expect(res.status).toBe(201);
    expect(res.body.listing.photos).toHaveLength(2);
    expect(res.body.listing.photos[0]).toEqual({ id: expect.any(String), url: expect.stringContaining('res.cloudinary.com') });
    expect(res.body.listing.photos[0]).not.toHaveProperty('publicId');
    expect(imageStorage.upload).toHaveBeenCalledWith(expect.any(Buffer), { folder: `parkly/listings/${listing.id}` });

    // Photos appear in public search results too.
    const search = await request(app).get('/api/listings').query({ location: 'Baner' });
    expect(search.body.listings[0].photos).toHaveLength(2);
  });

  it('only lets the owner upload', async () => {
    const stranger = await createUser();
    const res = await upload(1, { auth: stranger.auth });

    expect(res.status).toBe(403);
    expect(imageStorage.upload).not.toHaveBeenCalled();
  });

  it('rejects non-image files and oversized images', async () => {
    const pdf = await upload(1, { type: 'application/pdf', name: 'doc.pdf' });
    expect(pdf.status).toBe(400);
    expect(pdf.body.message).toMatch(/jpg, png, webp or heic/i);

    const huge = await upload(1, { size: 6 * 1024 * 1024 });
    expect(huge.status).toBe(400);
    expect(huge.body.message).toMatch(/under 5 mb/i);
  });

  it('caps a listing at 8 photos', async () => {
    await upload(6);
    const res = await upload(3);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/add 2 more photos/i);
  });

  it('requires at least one file', async () => {
    const res = await request(app).post(`/api/listings/${listing.id}/photos`).set('Authorization', owner.auth);
    expect(res.status).toBe(400);
  });

  it('explains when uploads are not configured', async () => {
    imageStorage.isConfigured.mockReturnValue(false);
    const res = await upload(1);

    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/aren’t set up/i);
  });

  it('cleans up already-uploaded photos if one fails', async () => {
    imageStorage.upload
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/a.jpg', publicId: 'a' })
      .mockRejectedValueOnce(new Error('network down'));

    const res = await upload(2);

    expect(res.status).toBe(502);
    expect(imageStorage.destroy).toHaveBeenCalledWith('a');
    const after = await request(app).get(`/api/listings/${listing.id}`).set('Authorization', owner.auth);
    expect(after.body.listing.photos).toHaveLength(0);
  });
});

describe('managing photos', () => {
  it('deletes a photo from the listing and storage', async () => {
    const { body } = await upload(2);
    const [first, second] = body.listing.photos;

    const res = await request(app)
      .delete(`/api/listings/${listing.id}/photos/${first.id}`)
      .set('Authorization', owner.auth);

    expect(res.status).toBe(200);
    expect(res.body.listing.photos.map((p) => p.id)).toEqual([second.id]);
    expect(imageStorage.destroy).toHaveBeenCalledWith(expect.stringContaining(`parkly/listings/${listing.id}/`));
  });

  it('reorders photos so the chosen one becomes the cover', async () => {
    const { body } = await upload(3);
    const ids = body.listing.photos.map((p) => p.id);
    const newOrder = [ids[2], ids[0], ids[1]];

    const res = await request(app)
      .put(`/api/listings/${listing.id}/photos/order`)
      .set('Authorization', owner.auth)
      .send({ photoIds: newOrder });

    expect(res.status).toBe(200);
    expect(res.body.listing.photos.map((p) => p.id)).toEqual(newOrder);
  });

  it('rejects an order that drops or duplicates photos', async () => {
    const { body } = await upload(2);
    const [a] = body.listing.photos.map((p) => p.id);

    const res = await request(app)
      .put(`/api/listings/${listing.id}/photos/order`)
      .set('Authorization', owner.auth)
      .send({ photoIds: [a, a] });

    expect(res.status).toBe(400);
  });

  it('removes photos from storage when the listing is deleted', async () => {
    await upload(2);
    await request(app).delete(`/api/listings/${listing.id}`).set('Authorization', owner.auth);

    expect(imageStorage.destroy).toHaveBeenCalledTimes(2);
  });
});
