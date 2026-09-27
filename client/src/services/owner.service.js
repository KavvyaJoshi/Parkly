import { api } from './api.js';

export const ownerService = {
  summary: () => api.get('/owner/summary'),
  /** type: 'upcoming' | 'past' | 'cancelled' */
  bookings: (type) => api.get(`/owner/bookings?type=${encodeURIComponent(type)}`),
};
