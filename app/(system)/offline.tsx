import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SystemPage } from '../../src/components/ui/SystemPage';
import { probeApiReachable } from '../../src/utils/connectivity';
import { useSystemStore } from '../../src/stores/systemStore';

export default function OfflineScreen() {
  const router = useRouter();
  const setOffline = useSystemStore((s) => s.setOffline);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      const reachable = await probeApiReachable();
      setOffline(!reachable);
      if (reachable) {
        router.replace('/downloads');
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SystemPage
      icon="offline"
      code="SIN CONEXIÓN"
      title="No hay internet"
      message="Puedes seguir con tus libros descargados y el centro de estudios (progreso y subrayados guardados en el dispositivo). El resto de la app requiere conexión."
      primaryAction={{
        label: 'Mis descargas',
        onPress: () => router.replace('/downloads'),
      }}
      secondaryAction={{
        label: 'Centro de estudios',
        onPress: () => router.replace('/study-center'),
      }}
      extraActions={[
        {
          label: retrying ? 'Comprobando…' : 'Reintentar conexión',
          onPress: () => void retry(),
          variant: 'ghost',
        },
      ]}
    />
  );
}
