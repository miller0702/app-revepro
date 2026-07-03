import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { useBrandingStore } from '../stores/brandingStore';
import { palette } from '../theme/colors';
import { scaleFontSize } from '../config/fontScale';
import { applyBrandingColors } from '../utils/applyBrandingColors';
import { applySeasonalColors } from '../theme/seasons';
import { resolveActiveSeason } from '../utils/resolveSeason';
import { getConfig } from '../config/environments';

export function useTheme() {
  const scheme = useColorScheme();
  const themeSetting = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const branding = useBrandingStore((s) => s.settings);
  const systemTheme = scheme === 'dark' ? 'dark' : 'light';
  const resolved = themeSetting === 'system' ? systemTheme : themeSetting;

  const scaleFont = (baseSize: number) => scaleFontSize(baseSize, fontSize);

  const baseColors = palette[resolved];
  const branded = branding ? applyBrandingColors(baseColors, branding, resolved === 'dark') : baseColors;
  const season = resolveActiveSeason(branding);
  const colors = applySeasonalColors(branded, season, resolved === 'dark');

  const config = getConfig();

  return {
    colors,
    isDark: resolved === 'dark',
    fontSize,
    scaleFont,
    season,
    appName: branding?.appName?.trim() || config.appName,
    appTagline: branding?.appTagline?.trim() || config.appTagline,
  };
}
