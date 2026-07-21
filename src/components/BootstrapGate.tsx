import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useGoalsStore } from '../stores/goalsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { warmAccessTokenCache } from '../lib/accessTokenCache';
import { loadPublicSettings } from '../offline/publicSettings';
import { processDownloadQueue } from '../offline/downloadWorker';
import { syncWithServer } from '../offline/syncService';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { hideNativeSplash, isExpoGo } from '../utils/splash';
import { SPLASH_BACKGROUND } from '../theme/splash';
import { syncRootBackground } from '../utils/syncAppChrome';

/**
 * Mantiene el splash nativo visible hasta hidratar sesión/ajustes.
 * En builds nativos (preview/prod) el splash de expo-splash-screen cubre la espera.
 * En Expo Go se usa AppLoadingScreen como equivalente visual.
 */
export function BootstrapGate({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const useJsSplash = isExpoGo();

  useEffect(() => {
    void syncRootBackground('dark', SPLASH_BACKGROUND);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await Promise.all([
        useAuthStore.getState().restoreSession(),
        useSettingsStore.getState().hydrate(),
        useGoalsStore.getState().hydrate(),
        loadPublicSettings(true),
      ]);
      await warmAccessTokenCache();
      if (mounted) setAuthReady(true);
      void processDownloadQueue().catch(() => undefined);
      void syncWithServer().catch(() => undefined);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    void hideNativeSplash();
  }, [authReady]);

  if (!authReady) {
    if (useJsSplash) {
      return <AppLoadingScreen />;
    }
    // El splash nativo sigue encima; fondo alineado por si hay un frame sin cover.
    return <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }} />;
  }

  return <>{children}</>;
}
