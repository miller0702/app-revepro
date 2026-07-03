import Constants from 'expo-constants';
import { developmentConfig } from './development';
import { productionConfig } from './production';
import type { EgwEnv, MobileConfig } from './types';

export type { EgwEnv, MobileConfig };

function resolveEnv(): EgwEnv {
  const fromExtra = Constants.expoConfig?.extra?.egwEnv as EgwEnv | undefined;
  if (fromExtra === 'production' || fromExtra === 'development') return fromExtra;
  return process.env.EGW_ENV === 'production' ? 'production' : 'development';
}

export function getEgwEnv(): EgwEnv {
  return resolveEnv();
}

export function getConfig(): MobileConfig {
  return getEgwEnv() === 'production' ? productionConfig : developmentConfig;
}
