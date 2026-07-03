import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  useBrandingStore,
  isMaintenanceMode,
  isServiceUnavailableMode,
} from '../stores/brandingStore';
import { useSystemStore } from '../stores/systemStore';
import { loadPublicSettings } from '../offline/publicSettings';
import { systemRoutes } from '../navigation/systemRoutes';
import { probeApiReachable } from '../utils/connectivity';

function isSystemSegment(segments: string[], page: 'offline' | 'unavailable' | 'maintenance') {
  return segments[0] === '(system)' && segments[1] === page;
}

/** Redirige a pantallas de emergencia según ajustes del admin (y conectividad local). */
export function SystemGate() {
  const router = useRouter();
  const segments = useSegments();
  const isOffline = useSystemStore((s) => s.isOffline);
  const setOffline = useSystemStore((s) => s.setOffline);
  const publicSettings = useBrandingStore((s) => s.settings);
  const maintenanceMode = isMaintenanceMode(publicSettings);
  const serviceUnavailable = isServiceUnavailableMode(publicSettings);

  useEffect(() => {
    let mounted = true;

    const syncConnectivity = async () => {
      const reachable = await probeApiReachable();
      if (mounted) setOffline(!reachable);
    };

    void syncConnectivity();
    const interval = setInterval(syncConnectivity, 12000);

    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void syncConnectivity();
        void loadPublicSettings(true);
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      appSub.remove();
    };
  }, [setOffline]);

  useEffect(() => {
    const segs = segments as string[];
    const onMaintenance = isSystemSegment(segs, 'maintenance');
    const onOffline = isSystemSegment(segs, 'offline');
    const onUnavailable = isSystemSegment(segs, 'unavailable');
    const onSystem = segs[0] === '(system)' || segs[0] === '+not-found';

    if (maintenanceMode && !onMaintenance) {
      router.replace(systemRoutes.maintenance);
      return;
    }

    if (maintenanceMode) return;

    if (serviceUnavailable && !onUnavailable) {
      router.replace(systemRoutes.unavailable);
      return;
    }

    if (serviceUnavailable) return;

    if (isOffline && !onOffline && !onSystem) {
      router.replace(systemRoutes.offline);
      return;
    }

    if (!isOffline && onOffline) {
      router.replace('/feed');
    }
  }, [isOffline, maintenanceMode, serviceUnavailable, segments, router]);

  useEffect(() => {
    if (!serviceUnavailable) return;
    const timer = setInterval(() => {
      void loadPublicSettings(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [serviceUnavailable]);

  return null;
}
