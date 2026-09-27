import { api } from './api.js';

export const listingsService = {
  /** `params` is a URLSearchParams (or plain object) of search filters. */
  search: (params) => api.get(`/listings?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/listings/${encodeURIComponent(id)}`),
};
