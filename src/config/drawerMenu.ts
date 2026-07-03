import type { Href } from 'expo-router';
import type { AppIconName } from '../components/ui/AppIcon';

export type DrawerMenuItem = {
  key: string;
  labelKey: string;
  href: Href;
  icon: AppIconName;
};

export type DrawerMenuSection = {
  titleKey: string;
  items: DrawerMenuItem[];
};

export const DRAWER_MENU: DrawerMenuSection[] = [
  {
    titleKey: 'drawer.sectionStudy',
    items: [
      { key: 'goals', labelKey: 'drawer.goals', href: '/goals', icon: 'time' },
      { key: 'study-center', labelKey: 'drawer.studyCenter', href: '/study-center', icon: 'study' },
      { key: 'downloads', labelKey: 'drawer.downloads', href: '/downloads', icon: 'download' },
    ],
  },
  {
    titleKey: 'drawer.sectionAccount',
    items: [{ key: 'settings', labelKey: 'drawer.settings', href: '/settings', icon: 'settings' }],
  },
  {
    titleKey: 'drawer.sectionHelp',
    items: [
      { key: 'manual', labelKey: 'drawer.manual', href: '/manual', icon: 'document' },
      { key: 'requirements', labelKey: 'drawer.requirements', href: '/requirements', icon: 'chat' },
      { key: 'terms', labelKey: 'drawer.terms', href: '/terms', icon: 'document' },
    ],
  },
];
