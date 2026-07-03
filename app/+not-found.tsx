import { useRouter } from 'expo-router';
import { SystemPage } from '../src/components/ui/SystemPage';
import { useAuthStore } from '../src/stores/authStore';

export default function NotFoundScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const goHome = () => {
    if (isAuthenticated) {
      router.replace('/feed');
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SystemPage
      icon="not-found"
      code="404"
      title="Página no encontrada"
      message="La ruta que buscas no existe o fue movida. Revisa el enlace o vuelve al inicio."
      primaryAction={{ label: 'Ir al inicio', onPress: goHome }}
      secondaryAction={{
        label: 'Volver',
        onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            goHome();
          }
        },
      }}
    />
  );
}
