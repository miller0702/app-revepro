import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useGoalsStore } from '../stores/goalsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { warmAccessTokenCache } from '../lib/accessTokenCache';
import { loadPublicSettings } from '../offline/publicSettings';
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
