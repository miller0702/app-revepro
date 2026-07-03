import type { MobileConfig } from './types';

export const productionConfig: MobileConfig = {
  env: 'production',
  apiUrl: 'https://api.tu-dominio.com/api/v1',
  appName: 'RESVEPRO',
  appTagline: 'Restaurando Verdades Proféticas',
  maintenanceMode: false,
};
