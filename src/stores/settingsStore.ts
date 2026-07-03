import { create } from 'zustand';
import { getNumber, getString, setNumber, setString } from '../storage/localStorage';
import { clampFontSize, FONT_SIZE_DEFAULT } from '../config/fontScale';
import { normalizeLocale, type AppLocale } from '../i18n';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  locale: AppLocale;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: number) => void;
  setLocale: (locale: AppLocale) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  fontSize: FONT_SIZE_DEFAULT,
  locale: 'es',

  setTheme: (theme) => {
    void setString('theme', theme);
    set({ theme });
  },

  setFontSize: (fontSize) => {
    const next = clampFontSize(fontSize);
    void setNumber('fontSize', next);
    set({ fontSize: next });
  },

  setLocale: (locale) => {
    void setString('locale', locale);
    set({ locale });
  },

  hydrate: async () => {
    const [theme, fontSize, locale] = await Promise.all([
      getString('theme'),
      getNumber('fontSize'),
      getString('locale'),
    ]);
    set({
      theme: (theme as SettingsState['theme']) ?? 'system',
      fontSize: clampFontSize(fontSize ?? FONT_SIZE_DEFAULT),
      locale: normalizeLocale(locale),
    });
  },
}));
