import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SystemPage } from '../../src/components/ui/SystemPage';
import { useBrandingStore } from '../../src/stores/brandingStore';
import { loadPublicSettings } from '../../src/offline/publicSettings';

export default function UnavailableScreen() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const settings = useBrandingStore((s) => s.settings);

  const defaultMessage =
    'El servidor no responde en este momento. Nuestro equipo ya está trabajando para restablecer el servicio.';
  const message = settings?.unavailableMessage?.trim() || defaultMessage;

  const retry = async () => {
    setRetrying(true);
    try {
      await loadPublicSettings(true);
      const latest = useBrandingStore.getState().settings;
      if (latest?.serviceUnavailableMode !== 'true') {
        router.replace('/feed');
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SystemPage
      icon="unavailable"
      code="NO DISPONIBLE"
      title="Servicio no disponible"
      message={message}
      primaryAction={{
        label: retrying ? 'Comprobando…' : 'Reintentar',
        onPress: () => void retry(),
      }}
      secondaryAction={{
        label: 'Ir al inicio',
        onPress: () => router.replace('/feed'),
      }}
    />
  );
}
