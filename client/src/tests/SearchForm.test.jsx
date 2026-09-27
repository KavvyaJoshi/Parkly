import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';

import SearchForm from '../components/search/SearchForm.jsx';

function CurrentUrl() {
  const { pathname, search } = useLocation();
  return <p data-testid="url">{pathname + search}</p>;
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SearchForm />} />
        <Route path="/search" element={<CurrentUrl />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SearchForm', () => {
  it('shows an error when location is empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /find parking/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/enter an area/i);
  });

  it('navigates to search results with the query in the URL', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/where are you going/i), 'Baner');
    await user.selectOptions(screen.getByLabelText(/duration/i), '4');
    await user.click(screen.getByRole('button', { name: /find parking/i }));

    const url = new URL(screen.getByTestId('url').textContent, 'http://localhost');
    expect(url.pathname).toBe('/search');
    expect(url.searchParams.get('location')).toBe('Baner');
    expect(url.searchParams.get('duration')).toBe('4');
    expect(url.searchParams.get('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(url.searchParams.get('time')).toMatch(/^\d{2}:\d{2}$/);
  });
});
