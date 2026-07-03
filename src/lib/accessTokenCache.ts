import * as SecureStore from 'expo-secure-store';

/** Token en memoria para evitar lecturas repetidas de SecureStore por cada avatar/imagen. */
let cachedAccessToken: string | null = null;

export function setAccessTokenCache(token: string | null): void {
  cachedAccessToken = token;
}

export function getAccessTokenCache(): string | null {
  return cachedAccessToken;
}

export async function warmAccessTokenCache(): Promise<string | null> {
  if (cachedAccessToken) return cachedAccessToken;
  const token = await SecureStore.getItemAsync('accessToken');
  cachedAccessToken = token;
  return token;
}

export function getAuthImageHeaders(): Record<string, string> | undefined {
  if (!cachedAccessToken) return undefined;
  return { Authorization: `Bearer ${cachedAccessToken}` };
}
