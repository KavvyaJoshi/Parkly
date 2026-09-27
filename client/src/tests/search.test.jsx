import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockApi, renderApp } from './renderWithRouter.jsx';
import { makeListing, searchResponse } from './fixtures.js';

const lastQuery = (fetchMock) => new URL(fetchMock.mock.calls.at(-1)[0]).searchParams;

describe('Search page', () => {
  it('shows results for the URL query with price for the chosen duration', async () => {
    const fetchMock = mockApi({
      'GET /listings': { body: searchResponse([makeListing(), makeListing({ id: 'l2', title: 'Driveway off Baner Road', pricePerHour: 30, isDemo: false, distanceMeters: 1600 })]) },
    });
    renderApp('/search?location=Baner&date=2030-01-07&time=10:00&duration=3');

    expect(await screen.findByRole('heading', { name: '2 parking spaces near Baner' })).toBeInTheDocument();
    expect(lastQuery(fetchMock).get('location')).toBe('Baner');
    expect(lastQuery(fetchMock).get('duration')).toBe('3');

    const cards = screen.getAllByRole('article');
    expect(within(cards[0]).getByText('₹120 for 3 hours')).toBeInTheDocument();
    expect(within(cards[0]).getByText(/450 m away/)).toBeInTheDocument();
    expect(within(cards[0]).getByText('Demo')).toBeInTheDocument();
    expect(within(cards[1]).getByText(/1\.6 km away/)).toBeInTheDocument();
    expect(within(cards[1]).queryByText('Demo')).not.toBeInTheDocument();

    // Details link keeps the chosen slot.
    expect(within(cards[0]).getByRole('link')).toHaveAttribute(
      'href',
      '/listings/l1?date=2030-01-07&time=10%3A00&duration=3',
    );
  });

  it('updates the query when filters and sorting change', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({ 'GET /listings': { body: searchResponse([makeListing()]) } });
    renderApp('/search?location=Baner');
    await screen.findByRole('heading', { level: 1, name: /near baner/i });

    const filters = screen.getByRole('complementary', { name: /search filters/i });
    await user.click(within(filters).getByLabelText('EV charging'));
    await screen.findByRole('heading', { level: 1, name: /near baner/i });
    expect(lastQuery(fetchMock).get('amenities')).toBe('ev_charging');

    await user.click(within(filters).getByLabelText('SUV'));
    await user.selectOptions(within(filters).getByLabelText(/maximum price/i), '50');
    await user.selectOptions(screen.getByLabelText(/sort by/i), 'price_asc');

    const query = lastQuery(fetchMock);
    expect(query.get('vehicleSize')).toBe('suv');
    expect(query.get('maxPrice')).toBe('50');
    expect(query.get('sort')).toBe('price_asc');
    expect(query.get('amenities')).toBe('ev_charging');
    expect(query.get('location')).toBe('Baner');
  });

  it('shows an empty state that can clear filters', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      'GET /listings': () => ({ body: searchResponse([]) }),
    });
    renderApp('/search?location=Baner&amenities=ev_charging');

    expect(await screen.findByRole('heading', { name: /no parking spaces match/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /clear filters/i })[0]);

    expect(lastQuery(fetchMock).get('amenities')).toBeNull();
    expect(lastQuery(fetchMock).get('location')).toBe('Baner');
  });

  it('shows an error with a retry button', async () => {
    const user = userEvent.setup();
    let calls = 0;
    mockApi({
      'GET /listings': () => {
        calls += 1;
        return calls === 1
          ? { status: 500, body: { success: false, message: 'Something went wrong' } }
          : { body: searchResponse([makeListing()]) };
      },
    });
    renderApp('/search');

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findAllByRole('article')).toHaveLength(1);
  });

  it('paginates', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      'GET /listings': {
        body: searchResponse([makeListing()], { pagination: { page: 1, limit: 12, total: 30, totalPages: 3 } }),
      },
    });
    renderApp('/search?location=Baner');
    await screen.findByRole('heading', { name: /30 parking spaces/i });

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(lastQuery(fetchMock).get('page')).toBe('2');
  });
});
