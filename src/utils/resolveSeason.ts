import type { PublicAppSettings } from '../api/platform';
import type { SeasonTheme } from '../theme/seasons';

const VALID_SEASONS = new Set<SeasonTheme>(['none', 'christmas', 'easter', 'advent', 'pentecost']);

function parseSeason(value?: string): SeasonTheme {
  const key = (value ?? 'none').trim() as SeasonTheme;
  return VALID_SEASONS.has(key) ? key : 'none';
}

/** Temporada automática por calendario (zona local del dispositivo). */
export function detectSeasonByDate(date = new Date()): SeasonTheme {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 12 || (month === 1 && day <= 6)) return 'christmas';
  if (month === 11 && day >= 27) return 'advent';
  if (month === 3 && day >= 15 && day <= 31) return 'easter';
  if (month === 4 && day <= 25) return 'easter';
  if (month === 5 && day >= 15 && day <= 31) return 'pentecost';
  if (month === 6 && day <= 10) return 'pentecost';

  return 'none';
}

export function resolveActiveSeason(settings: PublicAppSettings | null): SeasonTheme {
  if (!settings) return 'none';

  const auto = settings.seasonAutoMode === 'true';
  if (auto) return detectSeasonByDate();

  return parseSeason(settings.seasonTheme);
}

export function getSeasonLabel(settings: PublicAppSettings | null): string | null {
  const season = resolveActiveSeason(settings);
  if (season === 'none') return null;
  const labels: Record<SeasonTheme, string> = {
    none: '',
    christmas: 'Navidad',
    easter: 'Pascua',
    advent: 'Adviento',
    pentecost: 'Pentecostés',
  };
  return labels[season];
}
