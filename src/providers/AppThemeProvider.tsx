import { useEffect } from 'react';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';
import { buildNavigationTheme } from '../theme/navigationTheme';
import { syncRootBackground } from '../utils/syncAppChrome';
import { resolveThemeFromSetting } from '../theme/splash';
import { useSettingsStore } from '../stores/settingsStore';
import { useColorScheme } from 'react-native';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  const navigationTheme = buildNavigationTheme(colors, isDark);
  const systemScheme = useColorScheme();
  const themeSetting = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const resolved = resolveThemeFromSetting(themeSetting, systemScheme);
    void syncRootBackground(resolved);
  }, [themeSetting, systemScheme]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </NavigationThemeProvider>
  );
}
