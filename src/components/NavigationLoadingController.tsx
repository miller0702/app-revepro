import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { useIsFetching } from '@tanstack/react-query';
import { NavigationLoadingOverlay } from './ui/NavigationLoadingOverlay';

const MIN_VISIBLE_MS = 320;

function isInitialFetch(query: { state: { fetchStatus: string; data: unknown } }) {
  return query.state.fetchStatus === 'fetching' && query.state.data === undefined;
}

/**
 * Overlay global al cambiar de pantalla. No interfiere con pull-to-refresh
 * (esas peticiones ya tienen datos en caché).
 */
export function NavigationLoadingController() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialFetchCount = useIsFetching({
    predicate: (query) => isInitialFetch(query),
  });

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setVisible(true);
    shownAtRef.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;

    if (initialFetchCount > 0) return;

    const elapsed = Date.now() - shownAtRef.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, delay);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, initialFetchCount, pathname]);

  return <NavigationLoadingOverlay visible={visible} />;
}
