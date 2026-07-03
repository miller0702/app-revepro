import * as SystemUI from 'expo-system-ui';
import type { ResolvedTheme } from '../theme/splash';
import { palette } from '../theme/colors';

export async function syncRootBackground(theme: ResolvedTheme, colorOverride?: string) {
  await SystemUI.setBackgroundColorAsync(colorOverride ?? palette[theme].background);
}
