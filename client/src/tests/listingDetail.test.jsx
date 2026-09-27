import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { demoUser, mockApi, renderApp } from './renderWithRouter.jsx';
import { makeListing } from './fixtures.js';

describe('Listing details page', () => {
  it('shows the listing, demo notice, amenities, rules and host', async () => {
    mockApi({ 'GET /listings/l1': { body: { success: true, listing: makeListing() } } });
    renderApp('/listings/l1');

    expect(await screen.findByRole('heading', { level: 1, name: /covered society parking/i })).toBeInTheDocument();
    expect(screen.getByText(/demo listing\./i)).toBeInTheDocument();
    expect(screen.getByText('Fits up to an SUV')).toBeInTheDocument();
    expect(screen.getByText('Mon–Sat, 8:00 AM – 8:00 PM')).toBeInTheDocument();
    expect(screen.getByText('EV charging')).toBeInTheDocument();
    expect(screen.getByText('Show your booking to the security guard')).toBeInTheDocument();
    expect(screen.getByText('Anjali Patwardhan')).toBeInTheDocument();
    expect(screen.getByText(/exact address is shared once your booking is confirmed/i)).toBeInTheDocument();
  });

  it('prices the slot from the URL and flags times the space is closed', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /listings/l1': { body: { success: true, listing: makeListing() } } });
    // 2030-01-07 is a Monday; the space is open 08:00–20:00 Mon–Sat.
    renderApp('/listings/l1?date=2030-01-07&time=10:00&duration=3');

    expect(await screen.findByText('Open for your selected time')).toBeInTheDocument();
    expect(screen.getByText('₹40 × 3 hours')).toBeInTheDocument();
    expect(screen.getAllByText('₹120')).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText(/duration/i), '12');
    expect(screen.getByText(/not available at this time/i)).toBeInTheDocument();
    expect(screen.getAllByText('₹480')).toHaveLength(2);
  });

  it('asks logged-out users to log in to book', async () => {
    mockApi({ 'GET /listings/l1': { body: { success: true, listing: makeListing() } } });
    renderApp('/listings/l1');

    expect(await screen.findByRole('link', { name: /log in to book/i })).toHaveAttribute('href', '/login');
  });

  it('recognises the owner viewing their own listing', async () => {
    localStorage.setItem('parkly.token', 'token');
    mockApi({
      'GET /auth/me': { body: { success: true, user: { ...demoUser, id: 'host1' } } },
      'GET /listings/l1': {
        body: {
          success: true,
          listing: makeListing({ isExactLocation: true, address: { line1: 'Sai Vihar Society, Lane 5', area: 'Baner', pincode: '411045' } }),
        },
      },
    });
    renderApp('/listings/l1');

    expect(await screen.findByText('This is your listing.')).toBeInTheDocument();
    expect(screen.getByText('Sai Vihar Society, Lane 5')).toBeInTheDocument();
  });

  it('shows a friendly page for missing listings', async () => {
    mockApi({ 'GET /listings/missing': { status: 404, body: { success: false, message: 'Parking space not found' } } });
    renderApp('/listings/missing');

    expect(await screen.findByRole('heading', { name: /isn’t available/i })).toBeInTheDocument();
  });
});
