import { platformApi } from '../api/platform';
import { useBrandingStore } from '../stores/brandingStore';

const STALE_MS = 5 * 60 * 1000;
let lastFetch = 0;
let inflight: Promise<void> | null = null;

export async function loadPublicSettings(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastFetch < STALE_MS && useBrandingStore.getState().settings) {
    return;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await platformApi.getPublicSettings();
      useBrandingStore.getState().setSettings(res.data.data);
      lastFetch = Date.now();
    } catch {
      // Sin red: conservar cache o defaults de build
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
