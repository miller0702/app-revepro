import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SystemPage } from '../../src/components/ui/SystemPage';
import { useBrandingStore } from '../../src/stores/brandingStore';
import { useTheme } from '../../src/hooks/useTheme';
import { loadPublicSettings } from '../../src/offline/publicSettings';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { appName } = useTheme();
  const [retrying, setRetrying] = useState(false);
  const settings = useBrandingStore((s) => s.settings);

  const defaultMessage = `${appName} está en mantenimiento temporal. Vuelve a intentarlo en unos minutos. Gracias por tu paciencia.`;
  const message = settings?.maintenanceMessage?.trim() || defaultMessage;

  const retry = async () => {
    setRetrying(true);
    try {
      await loadPublicSettings(true);
      const latest = useBrandingStore.getState().settings;
      if (latest?.maintenanceMode !== 'true') {
        router.replace('/feed');
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SystemPage
      icon="maintenance"
      code="MANTENIMIENTO"
      title="Estamos mejorando la app"
      message={message}
      primaryAction={{
        label: retrying ? 'Comprobando…' : 'Reintentar',
        onPress: () => void retry(),
      }}
    />
  );
}
