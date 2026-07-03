import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useBrandingStore, isMaintenanceMode } from '../src/stores/brandingStore';
import { AppLoadingScreen } from '../src/components/ui/AppLoadingScreen';

export default function Index() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const publicSettings = useBrandingStore((s) => s.settings);
  const maintenanceMode = isMaintenanceMode(publicSettings);

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  if (maintenanceMode) {
    return <Redirect href="/(system)/maintenance" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/feed" />;
  }

  return <Redirect href="/(auth)/login" />;
}
