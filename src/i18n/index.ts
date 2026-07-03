import es from './locales/es.json';
import en from './locales/en.json';

export type AppLocale = 'es' | 'en';

export const SUPPORTED_LOCALES: AppLocale[] = ['es', 'en'];

const catalogs: Record<AppLocale, Record<string, unknown>> = { es, en };

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : undefined;
}

export function translate(locale: AppLocale, key: string): string {
  return getNested(catalogs[locale], key) ?? getNested(catalogs.es, key) ?? key;
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value === 'en') return 'en';
  return 'es';
}
