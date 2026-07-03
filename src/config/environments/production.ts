import type { MobileConfig } from './types';

const DEFAULT_PROD_API =
  'https://api-resvepro-app-1046799880752.us-west1.run.app/api/v1';

export const productionConfig: MobileConfig = {
  env: 'production',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_PROD_API,
  appName: 'RESVEPRO',
  appTagline: 'Restaurando Verdades Proféticas',
  maintenanceMode: false,
};
