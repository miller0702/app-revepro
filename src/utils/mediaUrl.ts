import { getConfig } from '../config/environments';

/** Convierte rutas relativas de media (`/api/v1/media/...`) en URL absoluta. */
export function resolveApiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const { apiUrl } = getConfig();
  const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/** True si la URL apunta a nuestra API (requiere JWT para /media/.../content). */
export function isApiHostedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/api/v1/media/')) return true;

  try {
    const { apiUrl } = getConfig();
    const apiOrigin = new URL(apiUrl).origin;
    const absolute = resolveApiMediaUrl(url);
    if (!absolute) return false;
    const parsed = new URL(absolute);
    return parsed.origin === apiOrigin && parsed.pathname.includes('/api/v1/media/');
  } catch {
    return false;
  }
}
