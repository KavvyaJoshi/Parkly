import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { demoUser, mockApi, renderApp } from './renderWithRouter.jsx';

const TOKEN_KEY = 'parkly.token';

async function fillLogin(user, email, password) {
  await user.type(screen.getByLabelText(/^email/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
  await user.click(screen.getByRole('button', { name: /^log in$/i }));
}

describe('Login', () => {
  it('logs in, stores the token and opens the account page', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      'POST /auth/login': { body: { success: true, token: 'jwt-123', user: demoUser } },
    });
    renderApp('/login');

    await fillLogin(user, 'priya@example.com', 'secret123');

    expect(await screen.findByRole('heading', { name: demoUser.name })).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-123');

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ email: 'priya@example.com', password: 'secret123' });
  });

  it('shows the server message for wrong credentials', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /auth/login': { status: 401, body: { success: false, message: 'Incorrect email or password' } },
    });
    renderApp('/login');

    await fillLogin(user, 'priya@example.com', 'wrongpass1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('validates on the client before calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({});
    renderApp('/login');

    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a friendly message when the API is unreachable', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /auth/login': () => {
        throw new TypeError('Failed to fetch');
      },
    });
    renderApp('/login');

    await fillLogin(user, 'priya@example.com', 'secret123');

    expect(await screen.findByRole('alert')).toHaveTextContent(/can’t reach parkly/i);
  });
});

describe('Signup', () => {
  it('requires a password with a letter and a number', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({});
    renderApp('/signup');

    await user.type(screen.getByLabelText(/full name/i), 'Priya Deshmukh');
    await user.type(screen.getByLabelText(/^email/i), 'priya@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'onlyletters');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/at least one letter and one number/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a normalised phone number and logs the user in', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      'POST /auth/register': { status: 201, body: { success: true, token: 'jwt-new', user: demoUser } },
    });
    renderApp('/signup');

    await user.type(screen.getByLabelText(/full name/i), 'Priya Deshmukh');
    await user.type(screen.getByLabelText(/^email/i), 'priya@example.com');
    await user.type(screen.getByLabelText(/mobile number/i), '+91 98765 43210');
    await user.type(screen.getByLabelText(/^password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('heading', { name: demoUser.name })).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({ phone: '9876543210', email: 'priya@example.com' });
  });

  it('shows server-side field errors next to the right field', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /auth/register': {
        status: 400,
        body: {
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Enter a valid email address' }],
        },
      },
    });
    renderApp('/signup');

    await user.type(screen.getByLabelText(/full name/i), 'Priya Deshmukh');
    await user.type(screen.getByLabelText(/^email/i), 'priya@example.co');
    await user.type(screen.getByLabelText(/^password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Protected routes and sessions', () => {
  it('sends logged-out users to login, then back to where they were going', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /auth/login': { body: { success: true, token: 'jwt-123', user: demoUser } },
    });
    renderApp('/account');

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/please log in to continue/i);

    await fillLogin(user, 'priya@example.com', 'secret123');

    expect(await screen.findByRole('heading', { name: demoUser.name })).toBeInTheDocument();
  });

  it('restores a saved session on page load', async () => {
    localStorage.setItem(TOKEN_KEY, 'saved-token');
    const fetchMock = mockApi({ 'GET /auth/me': { body: { success: true, user: demoUser } } });
    renderApp('/');

    const nav = screen.getByRole('navigation', { name: /main/i });
    expect(await within(nav).findByRole('button', { name: /priya/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer saved-token');
  });

  it('clears an expired session', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token');
    mockApi({ 'GET /auth/me': { status: 401, body: { success: false, message: 'Session expired' } } });
    renderApp('/');

    const nav = screen.getByRole('navigation', { name: /main/i });
    expect(await within(nav).findByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('logs out from the account page back to the homepage', async () => {
    const user = userEvent.setup();
    localStorage.setItem(TOKEN_KEY, 'saved-token');
    mockApi({ 'GET /auth/me': { body: { success: true, user: demoUser } } });
    renderApp('/account');

    await user.click(await screen.findByRole('button', { name: /log out/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /book a parking spot/i })).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('redirects logged-in users away from the login page', async () => {
    localStorage.setItem(TOKEN_KEY, 'saved-token');
    mockApi({ 'GET /auth/me': { body: { success: true, user: demoUser } } });
    renderApp('/login');

    expect(await screen.findByRole('heading', { name: demoUser.name })).toBeInTheDocument();
  });
});
