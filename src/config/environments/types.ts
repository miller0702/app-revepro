export type EgwEnv = 'development' | 'production';

export interface MobileConfig {
  env: EgwEnv;
  apiUrl: string;
  appName: string;
  appTagline: string;
  /** Si es true, la app redirige a la pantalla de mantenimiento. */
  maintenanceMode: boolean;
}
