import type { MobileConfig } from './types';

/** IP de tu Mac en la red local. Debe coincidir con la de Metro (exp://…). */
const DEV_LAN_IP = '192.168.1.5';

export const developmentConfig: MobileConfig = {
  env: 'development',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_LAN_IP}:8000/api/v1`,
  appName: 'RESVEPRO',
  appTagline: 'Restaurando Verdades Proféticas',
  maintenanceMode: false,
};
