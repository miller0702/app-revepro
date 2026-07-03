import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';

/** Expo Go no aplica splash personalizado; muestra icono azul + nombre del proyecto. */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function configureNativeSplash(): void {
  if (isExpoGo()) {
    void SplashScreen.hideAsync().catch(() => {});
    return;
  }
  void SplashScreen.preventAutoHideAsync().catch(() => {});
}

export async function hideNativeSplash(): Promise<void> {
  await SplashScreen.hideAsync().catch(() => {});
}
