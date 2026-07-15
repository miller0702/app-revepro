/** Tamaño de página del feed principal (balance memoria / UX). */
export const FEED_PAGE_SIZE = 20;

/** Cuántos ítems antes del final se dispara la siguiente página. */
export const FEED_PREFETCH_AHEAD = 5;

/** Publicaciones del perfil por página (menor que el feed global). */
export const PROFILE_POSTS_PAGE_SIZE = 10;

/** Tiempo antes de considerar datos obsoletos (ms). */
export const FEED_STALE_MS = 60_000;

/** Retención en caché de React Query (ms). */
export const FEED_GC_MS = 5 * 60_000;

/** Intervalo para traer publicaciones nuevas sin recargar todo el feed (ms). */
export const FEED_SINCE_POLL_MS = 90_000;

/** Props recomendadas para FlatList de publicaciones. */
export const FLAT_LIST_PERF = {
  initialNumToRender: 6,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  // En Android provoca cortes de toque (long-press) y parpadeos en celdas.
  removeClippedSubviews: false,
  updateCellsBatchingPeriod: 50,
} as const;
