import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';

/** Expo Go no aplica el splash nativo del proyecto; muestra el de Expo. */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Debe llamarse en el scope global (antes de montar React), no dentro de un efecto.
 * Evita que el splash nativo se oculte solo; lo controlamos con `hideNativeSplash`.
 */
export function configureNativeSplash(): void {
  if (isExpoGo()) {
    void SplashScreen.hideAsync().catch(() => {});
    return;
  }

  void SplashScreen.preventAutoHideAsync().catch(() => {});
  SplashScreen.setOptions({
    duration: 400,
    fade: true,
  });
}

/** Oculta el splash nativo cuando la app ya tiene UI lista. */
export async function hideNativeSplash(): Promise<void> {
  await SplashScreen.hideAsync().catch(() => {});
}
