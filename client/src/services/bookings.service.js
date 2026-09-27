import { api } from './api.js';

export const bookingsService = {
  create: (details) => api.post('/bookings', details),
  getById: (id) => api.get(`/bookings/${encodeURIComponent(id)}`),
};
