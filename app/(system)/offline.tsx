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
        router.replace('/feed');
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
      message="Comprueba tu conexión Wi‑Fi o datos móviles. Puedes seguir leyendo contenido que ya descargaste cuando vuelvas a estar en línea."
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
