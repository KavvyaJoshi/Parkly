import { api } from './api.js';

export const bookingsService = {
  create: (details) => api.post('/bookings', details),
  getById: (id) => api.get(`/bookings/${encodeURIComponent(id)}`),
  /** type: 'upcoming' | 'past' | 'cancelled' */
  mine: (type) => api.get(`/bookings/mine?type=${encodeURIComponent(type)}`),
  cancel: (id) => api.patch(`/bookings/${encodeURIComponent(id)}/cancel`),
};
