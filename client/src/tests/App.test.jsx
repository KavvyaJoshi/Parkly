import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderApp } from './renderWithRouter.jsx';

describe('App routing', () => {
  it('renders the landing page with its main sections', () => {
    renderApp('/');

    expect(screen.getByRole('heading', { level: 1, name: /book a parking spot/i })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: /search for parking/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /three steps/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find parking across the city/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /empty parking spot/i })).toBeInTheDocument();
  });

  it('lists popular Pune areas linking to search', () => {
    renderApp('/');

    const baner = screen.getByRole('link', { name: /baner/i });
    expect(baner).toHaveAttribute('href', '/search?location=Baner');
  });

  it('renders a 404 page for unknown routes', () => {
    renderApp('/this-page-does-not-exist');

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
