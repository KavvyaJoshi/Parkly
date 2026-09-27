import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { demoUser, mockApi, renderApp } from './renderWithRouter.jsx';
import { makeListing } from './fixtures.js';
import { imageUrl, validatePhotoFiles } from '../utils/images.js';

const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1/parkly/listings/l1';
const photo = (n) => ({ id: `p${n}`, url: `${CLOUD}/p${n}.jpg` });
const jpeg = (name, size = 1000) => new File([new Uint8Array(size)], name, { type: 'image/jpeg' });

const me = { ...demoUser, id: 'host1' };
const myListing = (overrides) =>
  makeListing({
    isDemo: false,
    isExactLocation: true,
    owner: { id: 'host1', name: me.name, memberSince: me.createdAt },
    address: { line1: 'Sai Vihar Society, Lane 5', area: 'Baner', pincode: '411045' },
    ...overrides,
  });

function asHost(routes) {
  localStorage.setItem('parkly.token', 'token');
  return mockApi({ 'GET /auth/me': { body: { success: true, user: me } }, ...routes });
}

const calls = (fetchMock, method, path) =>
  fetchMock.mock.calls.filter(([url, init]) => init?.method === method && new URL(url).pathname.endsWith(path));

describe('image helpers', () => {
  it('requests resized, auto-format images from Cloudinary', () => {
    expect(imageUrl(`${CLOUD}/p1.jpg`, 'thumb')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_240,h_180,q_auto,f_auto/v1/parkly/listings/l1/p1.jpg',
    );
    expect(imageUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });

  it('validates count, type and size before uploading', () => {
    expect(validatePhotoFiles([jpeg('a.jpg')], 0)).toBe('');
    expect(validatePhotoFiles([jpeg('a.jpg'), jpeg('b.jpg')], 7)).toMatch(/add 1 more photo/);
    expect(validatePhotoFiles([new File(['x'], 'doc.pdf', { type: 'application/pdf' })])).toMatch(/isn’t a supported image/);
    expect(validatePhotoFiles([jpeg('big.jpg', 6 * 1024 * 1024)])).toMatch(/larger than 5 MB/);
  });
});

describe('Listing photo gallery', () => {
  it('shows the cover large and switches photos from thumbnails', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /listings/l1': { body: { success: true, listing: makeListing({ photos: [photo(1), photo(2), photo(3)] }) } } });
    renderApp('/listings/l1');

    const main = await screen.findByAltText(/photo 1 of 3/i);
    expect(main.getAttribute('src')).toContain('w_1600');

    await user.click(screen.getByRole('button', { name: 'Show photo 3' }));
    expect(screen.getByAltText(/photo 3 of 3/i).getAttribute('src')).toContain('p3.jpg');
    expect(screen.getByRole('button', { name: 'Show photo 3' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Host photo manager', () => {
  it('uploads, sets a cover and deletes photos on an existing listing', async () => {
    const user = userEvent.setup();
    const fetchMock = asHost({
      'GET /listings/l1': { body: { success: true, listing: myListing({ photos: [photo(1)] }) } },
      'POST /listings/l1/photos': { status: 201, body: { success: true, listing: myListing({ photos: [photo(1), photo(2)] }) } },
      'PUT /listings/l1/photos/order': { body: { success: true, listing: myListing({ photos: [photo(2), photo(1)] }) } },
      'DELETE /listings/l1/photos/p1': { body: { success: true, listing: myListing({ photos: [photo(2)] }) } },
    });
    renderApp('/host/listings/l1/edit');

    const section = await screen.findByRole('region', { name: /photos/i });
    expect(within(section).getByText('1 of 8 photos', { exact: false })).toBeInTheDocument();

    await user.upload(within(section).getByLabelText(/add photos/i), jpeg('entrance.jpg'));
    expect(await within(section).findByAltText('Photo 2')).toBeInTheDocument();
    const [, uploadInit] = calls(fetchMock, 'POST', '/photos')[0];
    expect(uploadInit.body).toBeInstanceOf(FormData);
    expect(uploadInit.body.getAll('photos')[0].name).toBe('entrance.jpg');
    expect(uploadInit.headers['Content-Type']).toBeUndefined();

    await user.click(within(section).getByRole('button', { name: 'Make photo 2 the cover' }));
    await within(section).findByText('Cover photo updated.');
    expect(JSON.parse(calls(fetchMock, 'PUT', '/order')[0][1].body)).toEqual({ photoIds: ['p2', 'p1'] });

    await user.click(within(section).getByRole('button', { name: 'Delete photo 2' }));
    await within(section).findByText('Photo removed.');
    expect(within(section).queryByAltText('Photo 2')).not.toBeInTheDocument();
  });

  it('blocks unsupported files before uploading', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const fetchMock = asHost({ 'GET /listings/l1': { body: { success: true, listing: myListing({ photos: [] }) } } });
    renderApp('/host/listings/l1/edit');

    const section = await screen.findByRole('region', { name: /photos/i });
    await user.upload(within(section).getByLabelText(/add photos/i), new File(['x'], 'notes.pdf', { type: 'application/pdf' }));

    expect(await within(section).findByText(/isn’t a supported image/i)).toBeInTheDocument();
    expect(calls(fetchMock, 'POST', '/photos')).toHaveLength(0);
  });
});

describe('Creating a listing with photos', () => {
  async function fillRequired(user) {
    await user.type(await screen.findByLabelText(/^title/i), 'Covered garage near Westend Mall');
    await user.type(screen.getByLabelText(/street address/i), 'Garage 3, Parihar Chowk');
  }

  it('uploads chosen photos right after creating the listing', async () => {
    const user = userEvent.setup();
    const fetchMock = asHost({
      'POST /listings': { status: 201, body: { success: true, listing: myListing({ id: 'new1' }) } },
      'POST /listings/new1/photos': { status: 201, body: { success: true, listing: myListing({ id: 'new1', photos: [photo(1)] }) } },
      'GET /listings/mine': { body: { success: true, listings: [] } },
    });
    renderApp('/host/listings/new');

    await fillRequired(user);
    await user.upload(screen.getByLabelText(/add photos/i), [jpeg('a.jpg'), jpeg('b.jpg')]);
    expect(screen.getByAltText('Selected photo 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove photo 2' }));
    await user.click(screen.getByRole('button', { name: /publish listing/i }));

    expect(await screen.findByText(/your space is live/i)).toBeInTheDocument();
    const [, init] = calls(fetchMock, 'POST', '/new1/photos')[0];
    expect(init.body.getAll('photos').map((f) => f.name)).toEqual(['a.jpg']);
  });

  it('keeps the listing and explains when photo upload fails', async () => {
    const user = userEvent.setup();
    asHost({
      'POST /listings': { status: 201, body: { success: true, listing: myListing({ id: 'new1' }) } },
      'POST /listings/new1/photos': { status: 503, body: { success: false, message: 'Photo uploads aren’t set up on this server yet' } },
      'GET /listings/new1': { body: { success: true, listing: myListing({ id: 'new1', photos: [] }) } },
    });
    renderApp('/host/listings/new');

    await fillRequired(user);
    await user.upload(screen.getByLabelText(/add photos/i), jpeg('a.jpg'));
    await user.click(screen.getByRole('button', { name: /publish listing/i }));

    expect(await screen.findByText(/your listing was saved, but the photos couldn’t be uploaded/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /edit listing/i })).toBeInTheDocument();
  });
});
