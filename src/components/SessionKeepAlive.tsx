import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../stores/authStore';

/** Renueva tokens al volver a la app y de forma periódica (access JWT ~15m). */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

export function SessionKeepAlive() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const refreshIfAuthenticated = () => {
      const { isAuthenticated, refreshSessionIfNeeded } = useAuthStore.getState();
      if (isAuthenticated) {
        void refreshSessionIfNeeded();
      }
    };

    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(refreshIfAuthenticated, REFRESH_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshIfAuthenticated();
        startInterval();
        return;
      }
      stopInterval();
    });

    if (AppState.currentState === 'active') {
      refreshIfAuthenticated();
      startInterval();
    }

    return () => {
      subscription.remove();
      stopInterval();
    };
  }, []);

  return null;
}
