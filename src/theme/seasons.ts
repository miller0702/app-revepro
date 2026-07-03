import type { ThemeColors } from '../theme/colors';

export type SeasonTheme = 'none' | 'christmas' | 'easter' | 'advent' | 'pentecost';

export const SEASON_LABELS: Record<SeasonTheme, string> = {
  none: 'Sin temporada',
  christmas: 'Navidad',
  easter: 'Pascua',
  advent: 'Adviento',
  pentecost: 'Pentecostés',
};

/** Ajustes de color por temporada (sobre la paleta base + branding). */
export function applySeasonalColors(base: ThemeColors, season: SeasonTheme, isDark: boolean): ThemeColors {
  if (season === 'none') return base;

  switch (season) {
    case 'christmas':
      return {
        ...base,
        primary: isDark ? '#e8c547' : '#c41e3a',
        primaryDark: isDark ? '#c9a227' : '#8b1528',
        accent: isDark ? '#6b8f61' : '#1b5e20',
        accentSoft: isDark ? '#1a2e18' : '#e8f5e9',
        gradient: isDark ? ['#c41e3a', '#1b5e20'] : ['#c41e3a', '#2e7d32'] as ThemeColors['gradient'],
      };
    case 'easter':
      return {
        ...base,
        primary: isDark ? '#d4b8ff' : '#7c4dff',
        primaryDark: isDark ? '#b794f6' : '#5e35b1',
        accent: isDark ? '#ffd6e8' : '#ec407a',
        accentSoft: isDark ? '#2d1f3a' : '#f3e5f5',
        gradient: ['#7c4dff', '#ec407a'] as ThemeColors['gradient'],
      };
    case 'advent':
      return {
        ...base,
        primary: isDark ? '#b39ddb' : '#4527a0',
        primaryDark: isDark ? '#9575cd' : '#311b92',
        accent: isDark ? '#90caf9' : '#1565c0',
        accentSoft: isDark ? '#1a1830' : '#e8eaf6',
        gradient: ['#4527a0', '#1565c0'] as ThemeColors['gradient'],
      };
    case 'pentecost':
      return {
        ...base,
        primary: isDark ? '#ffab91' : '#e65100',
        primaryDark: isDark ? '#ff8a65' : '#bf360c',
        accent: isDark ? '#fff59d' : '#f9a825',
        accentSoft: isDark ? '#3a2418' : '#fff8e1',
        gradient: ['#e65100', '#f9a825'] as ThemeColors['gradient'],
      };
    default:
      return base;
  }
}
