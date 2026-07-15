/** Rutas accesibles sin API (contenido local / centro de estudios). */
export function isOfflineAllowedSegments(segments: readonly string[]): boolean {
  if (segments[0] === '(system)' || segments[0] === '+not-found') return true;

  const path = segments.filter((s) => !s.startsWith('('));
  const root = path[0];
  if (!root) return false;

  return (
    root === 'downloads' ||
    root === 'study-center' ||
    root === 'book' ||
    root === 'reader'
  );
}
