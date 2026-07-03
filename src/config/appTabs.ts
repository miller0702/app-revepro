/** Orden canónico de pestañas inferiores (fallback si hay empates en sortOrder). */
export const APP_TAB_CODES = [
  'feed',
  'library',
  'audio',
  'videos',
  'favorites',
  'profile',
] as const;

export type AppTabCode = (typeof APP_TAB_CODES)[number];

export function compareAppTabOrder(a: string, b: string): number {
  const indexA = APP_TAB_CODES.indexOf(a as AppTabCode);
  const indexB = APP_TAB_CODES.indexOf(b as AppTabCode);
  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
}
