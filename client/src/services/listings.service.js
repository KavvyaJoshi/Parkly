import { api } from './api.js';

export const listingsService = {
  /** `params` is a URLSearchParams (or plain object) of search filters. */
  search: (params) => api.get(`/listings?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/listings/${encodeURIComponent(id)}`),

  // Host (owner) actions
  mine: () => api.get('/listings/mine'),
  create: (listing) => api.post('/listings', listing),
  update: (id, changes) => api.patch(`/listings/${encodeURIComponent(id)}`, changes),
  remove: (id) => api.delete(`/listings/${encodeURIComponent(id)}`),
};
