import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { demoUser, mockApi, renderApp } from './renderWithRouter.jsx';
import { makeBooking } from './fixtures.js';
import { getBookingPhase } from '../utils/bookingStatus.js';

const HOUR = 3_600_000;
const iso = (offsetHours) => new Date(Date.now() + offsetHours * HOUR).toISOString();
const counts = { upcoming: 2, past: 1, cancelled: 0 };

function loggedIn(routes) {
  localStorage.setItem('parkly.token', 'token');
  return mockApi({ 'GET /auth/me': { body: { success: true, user: demoUser } }, ...routes });
}

const upcomingBookings = [
  makeBooking({ id: 'b1', reference: 'PK-NOWNOW', startTime: iso(-1), endTime: iso(1) }),
  makeBooking({ id: 'b2', reference: 'PK-LATERR', startTime: iso(24), endTime: iso(26) }),
];

describe('My bookings page', () => {
  it('lists upcoming bookings with status badges and tab counts', async () => {
    loggedIn({
      'GET /bookings/mine': () => ({ body: { success: true, type: 'upcoming', counts, bookings: upcomingBookings } }),
    });
    renderApp('/bookings');

    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('In progress')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Upcoming')).toBeInTheDocument();
    expect(within(cards[1]).getByRole('link')).toHaveAttribute('href', '/bookings/b2');

    const tabs = screen.getByRole('navigation', { name: /booking filters/i });
    expect(within(tabs).getByRole('link', { name: /upcoming 2/i })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: /past 1/i })).toBeInTheDocument();
  });

  it('switches tabs and shows an empty state', async () => {
    const user = userEvent.setup();
    const fetchMock = loggedIn({
      'GET /bookings/mine': () => {
        const type = new URL(fetchMock.mock.calls.at(-1)[0]).searchParams.get('type');
        return {
          body: { success: true, type, counts, bookings: type === 'upcoming' ? upcomingBookings : [] },
        };
      },
    });
    renderApp('/bookings');
    await screen.findAllByRole('article');

    await user.click(screen.getByRole('link', { name: /cancelled 0/i }));

    expect(await screen.findByRole('heading', { name: /no cancelled bookings/i })).toBeInTheDocument();
  });
});

describe('Cancelling a booking', () => {
  it('asks for confirmation, then cancels and updates the page', async () => {
    const user = userEvent.setup();
    const booking = makeBooking({ startTime: iso(24), endTime: iso(26), canCancel: true });
    const fetchMock = loggedIn({
      'GET /bookings/b1': { body: { success: true, booking } },
      'PATCH /bookings/b1/cancel': {
        body: {
          success: true,
          booking: { ...booking, status: 'cancelled', canCancel: false, cancelledBy: 'driver' },
        },
      },
    });
    renderApp('/bookings/b1');

    await user.click(await screen.findByRole('button', { name: /cancel booking/i }));
    const dialog = screen.getByRole('alertdialog', { name: /cancel this booking/i });
    expect(within(dialog).getByRole('button', { name: /keep booking/i })).toHaveFocus();

    // Escape closes without cancelling.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);

    await user.click(screen.getByRole('button', { name: /cancel booking/i }));
    await user.click(screen.getByRole('button', { name: /yes, cancel booking/i }));

    expect(await screen.findByText(/booking cancelled/i)).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
  });

  it('does not offer cancelling once a booking has started', async () => {
    loggedIn({
      'GET /bookings/b1': {
        body: { success: true, booking: makeBooking({ startTime: iso(-1), endTime: iso(1), canCancel: false }) },
      },
    });
    renderApp('/bookings/b1');

    expect(await screen.findByText('In progress')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
  });
});

describe('getBookingPhase', () => {
  it('derives the phase from status and times', () => {
    const now = new Date('2030-01-07T06:00:00Z');
    const at = (s, e, status = 'confirmed') => getBookingPhase({ status, startTime: s, endTime: e }, now);

    expect(at('2030-01-07T07:00:00Z', '2030-01-07T08:00:00Z')).toBe('upcoming');
    expect(at('2030-01-07T05:00:00Z', '2030-01-07T07:00:00Z')).toBe('in_progress');
    expect(at('2030-01-07T03:00:00Z', '2030-01-07T05:00:00Z')).toBe('completed');
    expect(at('2030-01-07T07:00:00Z', '2030-01-07T08:00:00Z', 'cancelled')).toBe('cancelled');
  });
});
