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

  // Photos
  uploadPhotos: (id, files) => {
    const form = new FormData();
    files.forEach((file) => form.append('photos', file));
    return api.post(`/listings/${encodeURIComponent(id)}/photos`, form);
  },
  deletePhoto: (id, photoId) =>
    api.delete(`/listings/${encodeURIComponent(id)}/photos/${encodeURIComponent(photoId)}`),
  reorderPhotos: (id, photoIds) => api.put(`/listings/${encodeURIComponent(id)}/photos/order`, { photoIds }),
};
