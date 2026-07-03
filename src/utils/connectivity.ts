import { getConfig } from '../config/environments';

/** Comprueba si la API responde (settings públicos). */
export async function probeApiReachable(): Promise<boolean> {
  const { apiUrl } = getConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${apiUrl}/settings/public`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
