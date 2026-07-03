import { create } from 'zustand';
import type { PublicAppSettings } from '../api/platform';

interface BrandingState {
  settings: PublicAppSettings | null;
  setSettings: (settings: PublicAppSettings) => void;
}

export const useBrandingStore = create<BrandingState>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
}));

export function useAppBranding() {
  const settings = useBrandingStore((s) => s.settings);
  return settings;
}

/** Solo activo si el admin lo habilita en Configuración → General. */
export function isMaintenanceMode(settings: PublicAppSettings | null): boolean {
  return settings?.maintenanceMode === 'true';
}

/** Pantalla de servicio no disponible — controlada desde el admin. */
export function isServiceUnavailableMode(settings: PublicAppSettings | null): boolean {
  return settings?.serviceUnavailableMode === 'true';
}
