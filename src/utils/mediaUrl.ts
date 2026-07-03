import { getConfig } from '../config/environments';

/** Convierte rutas relativas de media (`/api/v1/media/...`) en URL absoluta. */
export function resolveApiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const { apiUrl } = getConfig();
  const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
