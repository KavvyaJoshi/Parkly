import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { demoUser, mockApi, renderApp } from './renderWithRouter.jsx';
import { makeBooking, makeListing } from './fixtures.js';

const me = { ...demoUser, id: 'host1' };
const myListing = (overrides) =>
  makeListing({
    isDemo: false,
    isExactLocation: true,
    owner: { id: 'host1', name: me.name, memberSince: me.createdAt },
    address: { line1: 'Sai Vihar Society, Lane 5', area: 'Baner', pincode: '411045', landmark: 'Near Balewadi High Street' },
    ...overrides,
  });

function asHost(routes) {
  localStorage.setItem('parkly.token', 'token');
  return mockApi({ 'GET /auth/me': { body: { success: true, user: me } }, ...routes });
}

const requestsTo = (fetchMock, method) => fetchMock.mock.calls.filter(([, init]) => init?.method === method);

describe('Host overview', () => {
  it('invites new hosts to list their first space', async () => {
    asHost({
      'GET /owner/summary': {
        body: { success: true, summary: { earned: 0, earnedThisMonth: 0, completedBookings: 0, upcomingValue: 0, upcomingBookings: 0, listings: 0, publishedListings: 0 }, listings: [] },
      },
      'GET /owner/bookings': { body: { success: true, type: 'upcoming', counts: {}, bookings: [] } },
    });
    renderApp('/host');

    expect(await screen.findByRole('heading', { name: /list your first parking space/i })).toBeInTheDocument();
  });

  it('shows earnings tiles and per-listing performance', async () => {
    asHost({
      'GET /owner/summary': {
        body: {
          success: true,
          summary: { earned: 12500, earnedThisMonth: 3200, completedBookings: 41, upcomingValue: 960, upcomingBookings: 6, listings: 2, publishedListings: 1 },
          listings: [
            { id: 'l1', title: 'Covered slot in Baner', area: 'Baner', pricePerHour: 40, isPublished: true, upcomingBookings: 6, completedBookings: 41, earned: 12500 },
            { id: 'l2', title: 'Garage in Aundh', area: 'Aundh', pricePerHour: 55, isPublished: false, upcomingBookings: 0, completedBookings: 0, earned: 0 },
          ],
        },
      },
      'GET /owner/bookings': { body: { success: true, type: 'upcoming', counts: {}, bookings: [] } },
    });
    renderApp('/host');

    expect(await screen.findByText('₹12,500', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('From 41 completed bookings')).toBeInTheDocument();
    expect(screen.getByText('₹960 booked')).toBeInTheDocument();
    expect(screen.getByText('of 2 listings')).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Covered slot in Baner')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Draft')).toBeInTheDocument();
  });
});

describe('Host listings', () => {
  it('unpublishes a listing', async () => {
    const user = userEvent.setup();
    const listing = myListing();
    const fetchMock = asHost({
      'GET /listings/mine': { body: { success: true, listings: [listing] } },
      'PATCH /listings/l1': { body: { success: true, listing: { ...listing, isPublished: false } } },
    });
    renderApp('/host/listings');

    await user.click(await screen.findByRole('button', { name: /unpublish/i }));

    expect(await screen.findByText(/is now hidden from search/i)).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(JSON.parse(requestsTo(fetchMock, 'PATCH')[0][1].body)).toEqual({ isPublished: false });
  });

  it('confirms before deleting and explains when it is blocked', async () => {
    const user = userEvent.setup();
    asHost({
      'GET /listings/mine': { body: { success: true, listings: [myListing()] } },
      'DELETE /listings/l1': {
        status: 409,
        body: { success: false, message: 'This space has upcoming bookings, so it can’t be deleted.' },
      },
    });
    renderApp('/host/listings');

    await user.click(await screen.findByRole('button', { name: /^delete$/i }));
    const dialog = screen.getByRole('alertdialog', { name: /delete this listing/i });
    await user.click(within(dialog).getByRole('button', { name: /delete listing/i }));

    expect(await screen.findByText(/has upcoming bookings/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Covered society parking near Baner–Balewadi High Street' })).toBeInTheDocument();
  });

  it('removes a deleted listing from the page', async () => {
    const user = userEvent.setup();
    asHost({
      'GET /listings/mine': { body: { success: true, listings: [myListing()] } },
      'DELETE /listings/l1': { body: { success: true, message: 'Parking space deleted' } },
    });
    renderApp('/host/listings');

    await user.click(await screen.findByRole('button', { name: /^delete$/i }));
    await user.click(screen.getByRole('button', { name: /delete listing/i }));

    expect(await screen.findByText(/was deleted/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /haven’t listed a space yet/i })).toBeInTheDocument();
  });
});

describe('Listing form', () => {
  it('validates, then publishes a new listing with the area pin', async () => {
    const user = userEvent.setup();
    const fetchMock = asHost({
      'POST /listings': { status: 201, body: { success: true, listing: myListing() } },
      'GET /listings/mine': { body: { success: true, listings: [myListing()] } },
    });
    renderApp('/host/listings/new');

    await user.click(await screen.findByRole('button', { name: /publish listing/i }));
    expect(screen.getByText(/please fix the highlighted fields/i)).toBeInTheDocument();
    expect(screen.getByText(/title of at least 5 characters/i)).toBeInTheDocument();
    expect(requestsTo(fetchMock, 'POST')).toHaveLength(0);

    await user.type(screen.getByLabelText(/^title/i), 'Covered garage near Westend Mall');
    await user.selectOptions(screen.getByLabelText(/^area/i), 'Aundh');
    await user.type(screen.getByLabelText(/street address/i), 'Garage 3, Parihar Chowk');
    await user.click(screen.getByRole('radio', { name: /^garage/i }));
    await user.click(screen.getByLabelText('SUV'));
    await user.click(screen.getByLabelText('EV charging'));
    await user.clear(screen.getByLabelText(/price per hour/i));
    await user.type(screen.getByLabelText(/price per hour/i), '55');
    await user.type(screen.getByLabelText(/house rules/i), 'Call on arrival{enter}No overnight parking');
    await user.click(screen.getByRole('button', { name: /publish listing/i }));

    expect(await screen.findByText(/your space is live/i)).toBeInTheDocument();
    const payload = JSON.parse(requestsTo(fetchMock, 'POST')[0][1].body);
    expect(payload).toMatchObject({
      title: 'Covered garage near Westend Mall',
      spaceType: 'garage',
      vehicleSize: 'suv',
      pricePerHour: 55,
      amenities: ['ev_charging'],
      rules: ['Call on arrival', 'No overnight parking'],
      isPublished: true,
      // Choosing Aundh moved the default pin and PIN code to Aundh.
      address: { area: 'Aundh', pincode: '411007', line1: 'Garage 3, Parihar Chowk' },
      location: { lat: 18.558, lng: 73.8075 },
      availability: { is24x7: false, days: [1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '20:00' },
    });
  });

  it('can save a draft', async () => {
    const user = userEvent.setup();
    const fetchMock = asHost({
      'POST /listings': { status: 201, body: { success: true, listing: myListing({ isPublished: false }) } },
      'GET /listings/mine': { body: { success: true, listings: [] } },
    });
    renderApp('/host/listings/new');

    await user.type(await screen.findByLabelText(/^title/i), 'Driveway near DP Road');
    await user.type(screen.getByLabelText(/street address/i), 'Bungalow 5, DP Road');
    await user.click(screen.getByRole('button', { name: /save as draft/i }));

    expect(await screen.findByText(/saved as a draft/i)).toBeInTheDocument();
    expect(JSON.parse(requestsTo(fetchMock, 'POST')[0][1].body).isPublished).toBe(false);
  });

  it('pre-fills the edit form and saves changes', async () => {
    const user = userEvent.setup();
    const fetchMock = asHost({
      'GET /listings/l1': { body: { success: true, listing: myListing() } },
      'PATCH /listings/l1': { body: { success: true, listing: myListing({ pricePerHour: 45 }) } },
      'GET /listings/mine': { body: { success: true, listings: [myListing({ pricePerHour: 45 })] } },
    });
    renderApp('/host/listings/l1/edit');

    expect(await screen.findByLabelText(/street address/i)).toHaveValue('Sai Vihar Society, Lane 5');
    await user.clear(screen.getByLabelText(/price per hour/i));
    await user.type(screen.getByLabelText(/price per hour/i), '45');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText(/your changes were saved/i)).toBeInTheDocument();
    expect(JSON.parse(requestsTo(fetchMock, 'PATCH')[0][1].body)).toMatchObject({ pricePerHour: 45 });
  });

  it('sends logged-out visitors from "List your space" to login', async () => {
    mockApi({});
    renderApp('/list-your-space');

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});

describe('Host bookings', () => {
  it('shows bookings on my spaces with the driver’s name', async () => {
    asHost({
      'GET /owner/bookings': {
        body: {
          success: true,
          type: 'upcoming',
          counts: { upcoming: 1, past: 0, cancelled: 0 },
          bookings: [
            makeBooking({
              viewerRole: 'owner',
              startTime: new Date(Date.now() + 86_400_000).toISOString(),
              endTime: new Date(Date.now() + 93_600_000).toISOString(),
              driver: { name: 'Rahul Mehta', phone: '9765012345' },
            }),
          ],
        },
      },
    });
    renderApp('/host/bookings');

    const card = await screen.findByRole('article');
    expect(within(card).getByText(/rahul mehta/i)).toBeInTheDocument();
  });
});
