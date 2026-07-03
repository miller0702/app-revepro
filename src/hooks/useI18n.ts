import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { translate, type AppLocale } from '../i18n';

export function useI18n() {
  const locale = useSettingsStore((s) => s.locale);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return { locale, t };
}

export function useSetLocale() {
  return useSettingsStore((s) => s.setLocale);
}

export type { AppLocale };
