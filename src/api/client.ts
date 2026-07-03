import axios from 'axios';
import { getConfig } from '../config/environments';
import { refreshAccessToken } from './tokenRefresh';
import { getAccessTokenCache, warmAccessTokenCache } from '../lib/accessTokenCache';

const { apiUrl } = getConfig();

async function clearSessionAfterAuthFailure() {
  const { useAuthStore } = await import('../stores/authStore');
  await useAuthStore.getState().clearSession();
}

export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 25_000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = getAccessTokenCache() ?? (await warmAccessTokenCache());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed.ok) {
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return apiClient(original);
      }
      if (refreshed.reason === 'invalid' || refreshed.reason === 'missing') {
        await clearSessionAfterAuthFailure();
      }
    }

    return Promise.reject(error);
  },
);
