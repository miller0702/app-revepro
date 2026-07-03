import { useColorScheme } from 'react-native';
import { palette } from './colors';

export type ResolvedTheme = 'light' | 'dark';

/** Fondo del logo en assets (negro). El splash siempre usa este fondo para verse correcto. */
export const SPLASH_BACKGROUND = '#0c0f14';

export const SPLASH_PRIMARY = palette.dark.primary;

export function resolveThemeFromSetting(
  themeSetting: 'light' | 'dark' | 'system',
  systemScheme: ReturnType<typeof useColorScheme>,
): ResolvedTheme {
  if (themeSetting === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return themeSetting;
}

export function getSplashColors(_resolved?: ResolvedTheme) {
  return {
    background: SPLASH_BACKGROUND,
    primary: SPLASH_PRIMARY,
  };
}
