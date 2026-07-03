import type { ThemeColors } from '../theme/colors';
import type { PublicAppSettings } from '../api/platform';

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function applyBrandingColors(
  base: ThemeColors,
  branding: PublicAppSettings,
  isDark: boolean,
): ThemeColors {
  return {
    ...base,
    primary: pick(isDark ? branding.colorPrimaryDark : branding.colorPrimaryLight, base.primary),
    primaryDark: pick(isDark ? branding.colorPrimaryDark : branding.colorPrimaryLight, base.primaryDark),
    accent: pick(isDark ? branding.colorAccentDark : branding.colorAccentLight, base.accent),
    background: pick(isDark ? branding.colorBackgroundDark : branding.colorBackgroundLight, base.background),
    gradient: [
      pick(branding.colorPrimaryLight, base.gradient[0]),
      pick(branding.colorPrimaryDark ?? branding.colorPrimaryLight, base.gradient[1]),
    ] as ThemeColors['gradient'],
  };
}
