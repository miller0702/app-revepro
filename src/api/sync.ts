import { apiClient } from './client';

export const syncApi = {
  getState: (since?: string) => apiClient.get('/sync/state', { params: { since } }),
  push: (payload: { bookmarks?: unknown[]; progress?: unknown[] }) =>
    apiClient.post('/sync/push', payload),
};
