import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getConfig } from '../config/environments';
import { setAccessTokenCache } from '../lib/accessTokenCache';

const { apiUrl } = getConfig();

export type RefreshResult =
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'network' };

let refreshInFlight: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) {
    return { ok: false, reason: 'missing' };
  }

  try {
    const { data } = await axios.post(`${apiUrl}/auth/refresh`, { refreshToken });
    const tokens = data.data ?? data;
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    setAccessTokenCache(tokens.accessToken);
    return {
      ok: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      return { ok: false, reason: 'network' };
    }
    return { ok: false, reason: 'invalid' };
  }
}

/** Serializa renovaciones para evitar invalidar el refresh token por carreras concurrentes. */
export async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function isAuthHttpError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return !error.response;
}

export function shouldClearSessionAfterRefreshFailure(result: Extract<RefreshResult, { ok: false }>): boolean {
  return result.reason === 'invalid' || result.reason === 'missing';
}
