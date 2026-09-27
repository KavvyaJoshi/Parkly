import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { demoUser, mockApi, renderApp } from './renderWithRouter.jsx';
import { makeListing } from './fixtures.js';
import { formatBookingRange, isValidVehicleNumber } from '../utils/bookingTime.js';

// 2030-01-07 is a Monday; the fixture space is open Mon–Sat 08:00–20:00.
const SLOT = 'date=2030-01-07&time=10:00&duration=2';
const text = (el) => el.textContent.replace(/\s+/g, ' ');

function makeBooking(overrides = {}) {
  return {
    id: 'b1',
    reference: 'PK-7FK2QX',
    status: 'confirmed',
    startTime: '2030-01-07T04:30:00.000Z',
    endTime: '2030-01-07T06:30:00.000Z',
    hours: 2,
    pricePerHour: 40,
    totalPrice: 80,
    vehicleNumber: 'MH12AB1234',
    isDemo: true,
    viewerRole: 'driver',
    space: makeListing({
      isExactLocation: true,
      address: { line1: 'Sai Vihar Society, Lane 5', area: 'Baner', pincode: '411045', landmark: 'Near Balewadi High Street' },
      location: { lat: 18.5611, lng: 73.7902 },
    }),
    host: { name: 'Anjali Patwardhan', phone: '9822012345' },
    ...overrides,
  };
}

function loggedIn(routes) {
  localStorage.setItem('parkly.token', 'token');
  return mockApi({ 'GET /auth/me': { body: { success: true, user: demoUser } }, ...routes });
}

describe('Booking flow', () => {
  it('links "Book now" to checkout with the chosen slot', async () => {
    loggedIn({ 'GET /listings/l1': { body: { success: true, listing: makeListing() } } });
    renderApp(`/listings/l1?${SLOT}`);

    expect(await screen.findByRole('link', { name: 'Book now' })).toHaveAttribute(
      'href',
      '/book/l1?date=2030-01-07&time=10%3A00&duration=2',
    );
  });

  it('explains that bookings start on the hour or half-hour', async () => {
    loggedIn({ 'GET /listings/l1': { body: { success: true, listing: makeListing() } } });
    renderApp('/listings/l1?date=2030-01-07&time=10:15&duration=2');

    expect(await screen.findByText(/on the hour or half-hour/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book now' })).toBeDisabled();
  });

  it('checks the vehicle number, books, and shows the confirmation', async () => {
    const user = userEvent.setup();
    const fetchMock = loggedIn({
      'GET /listings/l1': { body: { success: true, listing: makeListing() } },
      'POST /bookings': { status: 201, body: { success: true, booking: makeBooking() } },
      'GET /bookings/b1': { body: { success: true, booking: makeBooking() } },
    });
    renderApp(`/book/l1?${SLOT}`);

    expect(await screen.findByRole('heading', { name: /confirm your booking/i })).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: /confirm booking · ₹80/i });

    await user.type(screen.getByLabelText(/vehicle registration number/i), 'abc');
    await user.click(confirm);
    expect(screen.getByText(/enter a valid vehicle number/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);

    await user.clear(screen.getByLabelText(/vehicle registration number/i));
    await user.type(screen.getByLabelText(/vehicle registration number/i), 'mh 12 ab 1234');
    await user.click(confirm);

    expect(await screen.findByRole('heading', { name: /your parking is booked/i })).toBeInTheDocument();
    expect(screen.getAllByText('PK-7FK2QX').length).toBeGreaterThan(0);

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({
      spaceId: 'l1',
      date: '2030-01-07',
      time: '10:00',
      duration: 2,
      vehicleNumber: 'MH12AB1234',
    });
    expect(localStorage.getItem('parkly.vehicleNumber')).toBe('MH12AB1234');
  });

  it('explains when the slot was taken in the meantime', async () => {
    const user = userEvent.setup();
    loggedIn({
      'GET /listings/l1': { body: { success: true, listing: makeListing() } },
      'POST /bookings': {
        status: 409,
        body: { success: false, message: 'Sorry, this space has just been booked for part of that time.' },
      },
    });
    renderApp(`/book/l1?${SLOT}`);

    await user.type(await screen.findByLabelText(/vehicle registration number/i), 'MH12AB1234');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText(/just been booked/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /choose another time/i })).toBeInTheDocument();
  });

  it('shows the booking with exact address, directions and host contact', async () => {
    loggedIn({ 'GET /bookings/b1': { body: { success: true, booking: makeBooking() } } });
    renderApp('/bookings/b1');

    expect(await screen.findByRole('heading', { name: /booking pk-7fk2qx/i })).toBeInTheDocument();
    expect(screen.getByText('Sai Vihar Society, Lane 5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get directions/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=18.5611,73.7902',
    );
    expect(screen.getByRole('link', { name: /\+91 9822012345/ })).toHaveAttribute('href', 'tel:+919822012345');
    expect(text(screen.getByText(/10:00 AM/))).toMatch(/10:00 AM – 12:00 PM/);
    expect(screen.getByText(/no payment was taken/i)).toBeInTheDocument();
  });
});

describe('booking helpers', () => {
  it('formats booking times in Pune time', () => {
    const range = formatBookingRange('2030-01-07T04:30:00.000Z', '2030-01-07T06:30:00.000Z').replace(/\s+/g, ' ');
    expect(range).toMatch(/7 Jan,? 2030/);
    expect(range).toMatch(/10:00 AM – 12:00 PM/);
  });

  it('validates Indian vehicle numbers', () => {
    expect(isValidVehicleNumber('MH 12 AB 1234')).toBe(true);
    expect(isValidVehicleNumber('dl-3c-af-0001')).toBe(true);
    expect(isValidVehicleNumber('22 BH 1234 AA')).toBe(true);
    expect(isValidVehicleNumber('ABC123')).toBe(false);
  });
});
