import { api } from './api.js';

export const authService = {
  register: (details) => api.post('/auth/register', details, { auth: false }),
  login: (credentials) => api.post('/auth/login', credentials, { auth: false }),
  getMe: () => api.get('/auth/me'),
};
