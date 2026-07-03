/** Rutas de pantallas de sistema (accesibles sin autenticación). */
export const systemRoutes = {
  maintenance: '/(system)/maintenance',
  offline: '/(system)/offline',
  unavailable: '/(system)/unavailable',
  notFound: '/+not-found',
} as const;
