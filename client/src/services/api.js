import { tokenStorage } from './tokenStorage.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/** Error thrown for any failed API call. `fieldErrors` maps field name -> message. */
export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = Object.fromEntries(errors.map((e) => [e.field, e.message]));
  }
}

let onUnauthorized = null;

// --- Slow-request tracking -------------------------------------------------
// The free API host sleeps when idle and takes up to a minute to wake. Anything
// can subscribe to learn when requests have been pending for a while.
export const SLOW_REQUEST_MS = 4000;
let slowCount = 0;
const slowListeners = new Set();

/** Subscribe to "requests are slow" changes. Returns an unsubscribe function. */
export function onSlowRequestsChange(listener) {
  slowListeners.add(listener);
  return () => slowListeners.delete(listener);
}

function trackSlow() {
  let isSlow = false;
  const timer = setTimeout(() => {
    isSlow = true;
    slowCount += 1;
    if (slowCount === 1) slowListeners.forEach((listener) => listener(true));
  }, SLOW_REQUEST_MS);

  return () => {
    clearTimeout(timer);
    if (!isSlow) return;
    slowCount -= 1;
    if (slowCount === 0) slowListeners.forEach((listener) => listener(false));
  };
}

/** Register a callback for when an authenticated request is rejected (expired session). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const token = auth ? tokenStorage.get() : null;
  const isFormData = body instanceof FormData;
  const headers = { Accept: 'application/json' };
  // For FormData (file uploads) the browser sets the multipart Content-Type and boundary itself.
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  let data;
  const doneTracking = trackSlow();
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
    data = await response.json().catch(() => ({}));
  } catch {
    throw new ApiError('Can’t reach Parkly right now. Check your connection and try again.', 0);
  } finally {
    doneTracking();
  }

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(data.message || 'Something went wrong. Please try again.', response.status, data.errors);
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
