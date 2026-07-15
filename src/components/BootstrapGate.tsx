import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useGoalsStore } from '../stores/goalsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { warmAccessTokenCache } from '../lib/accessTokenCache';
import { loadPublicSettings } from '../offline/publicSettings';
import { processDownloadQueue } from '../offline/downloadWorker';
import { syncWithServer } from '../offline/syncService';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { hideNativeSplash } from '../utils/splash';
import { SPLASH_BACKGROUND } from '../theme/splash';
import { syncRootBackground } from '../utils/syncAppChrome';

export function BootstrapGate({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void syncRootBackground('dark', SPLASH_BACKGROUND);
    void hideNativeSplash();
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
      // En segundo plano: completar descargas y sync de subrayados/progreso.
      void processDownloadQueue().catch(() => undefined);
      void syncWithServer().catch(() => undefined);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!authReady) {
    return <AppLoadingScreen />;
  }

  return <>{children}</>;
}
