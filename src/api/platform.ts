import { apiClient } from './client';

export interface AppSection {
  id: string;
  code: string;
  tabTitle: string;
  headerGreeting?: string | null;
  headerTitle?: string | null;
  subtitle?: string | null;
  description?: string | null;
  icon: string;
  iconActive: string;
  emptyIcon?: string | null;
  searchPlaceholder?: string | null;
  emptyMessage?: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export interface AppDrawerItem {
  id: string;
  code: string;
  groupTitle: string;
  groupSortOrder: number;
  label: string;
  href: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface PublicAppSettings {
  supportEmail?: string;
  welcomeMessage?: string;
  maintenanceMode?: string;
  maintenanceMessage?: string;
  serviceUnavailableMode?: string;
  unavailableMessage?: string;
  minAppVersion?: string;
  seasonTheme?: string;
  seasonAutoMode?: string;
  appName?: string;
  appTagline?: string;
  colorPrimaryLight?: string;
  colorPrimaryDark?: string;
  colorAccentLight?: string;
  colorAccentDark?: string;
  colorBackgroundLight?: string;
  colorBackgroundDark?: string;
  logoUrl?: string;
  logoUrlDark?: string;
  logoMarkUrl?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  accountDeletionUrl?: string;
}

export interface AppManualSection {
  id: string;
  code: string;
  audience?: 'APP' | 'PANEL';
  title: string;
  body: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface AppTutorialStep {
  id: string;
  code: string;
  title: string;
  body: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
}

export const platformApi = {
  getAppSections: () => apiClient.get<{ data: AppSection[] }>('/app/sections'),
  getDrawerItems: () => apiClient.get<{ data: AppDrawerItem[] }>('/app/drawer'),
  getPublicSettings: () => apiClient.get<{ data: PublicAppSettings }>('/settings/public'),
  getManualSections: () => apiClient.get<{ data: AppManualSection[] }>('/app/manual'),
  getTutorialSteps: () => apiClient.get<{ data: AppTutorialStep[] }>('/app/tutorial'),
  getLegalDocument: (type: 'TERMS' | 'PRIVACY' | 'COOKIES' | 'ACCEPTABLE_USE') =>
    apiClient.get<{ data: { title: string; content: string; version: string } }>(`/legal/${type}`),
  createRequirement: (data: { subject: string; message: string }) =>
    apiClient.post('/requirements', data),
};
