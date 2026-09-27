import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import App from '../App.jsx';
import AuthProvider from '../context/AuthProvider.jsx';

/** Render the full app (with auth) at a given URL. */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

/**
 * Replace global fetch with a fake API. `routes` maps "METHOD /path" to
 * { status, body } or a function (requestInit) => { status, body }.
 */
export function mockApi(routes) {
  const fetchMock = vi.fn(async (url, init = {}) => {
    const path = new URL(url).pathname.replace(/^\/api/, '');
    const key = `${init.method ?? 'GET'} ${path}`;
    const route = routes[key];
    if (!route) throw new Error(`Unmocked request: ${key}`);
    const { status = 200, body = {} } = typeof route === 'function' ? route(init) : route;
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const demoUser = {
  id: 'u1',
  name: 'Priya Deshmukh',
  email: 'priya@example.com',
  phone: '9876543210',
  createdAt: '2026-09-01T10:00:00.000Z',
};
