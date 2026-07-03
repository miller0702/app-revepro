import { useQuery } from '@tanstack/react-query';
import { platformApi, type AppDrawerItem } from '../api/platform';
import { DRAWER_MENU } from '../config/drawerMenu';
import type { AppIconName } from '../components/ui/AppIcon';

const STALE_MS = 5 * 60 * 1000;

export type DrawerMenuSection = {
  title: string;
  groupSortOrder: number;
  items: {
    key: string;
    label: string;
    href: string;
    icon: AppIconName;
  }[];
};

function fallbackSections(): DrawerMenuSection[] {
  return DRAWER_MENU.map((section, index) => ({
    title: section.titleKey,
    groupSortOrder: index + 1,
    items: section.items.map((item) => ({
      key: item.key,
      label: item.labelKey,
      href: item.href as string,
      icon: item.icon,
    })),
  }));
}

function groupDrawerItems(items: AppDrawerItem[]): DrawerMenuSection[] {
  const visible = items.filter((item) => item.isVisible);
  const groupMap = new Map<string, DrawerMenuSection>();

  for (const item of visible) {
    const existing = groupMap.get(item.groupTitle);
    const entry = {
      key: item.code,
      label: item.label,
      href: item.href,
      icon: item.icon as AppIconName,
    };
    if (existing) {
      existing.items.push(entry);
    } else {
      groupMap.set(item.groupTitle, {
        title: item.groupTitle,
        groupSortOrder: item.groupSortOrder,
        items: [entry],
      });
    }
  }

  return [...groupMap.values()]
    .sort((a, b) => a.groupSortOrder - b.groupSortOrder)
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        const orderA = visible.find((i) => i.code === a.key)?.sortOrder ?? 0;
        const orderB = visible.find((i) => i.code === b.key)?.sortOrder ?? 0;
        return orderA - orderB;
      }),
    }));
}

export function useDrawerMenu() {
  const query = useQuery({
    queryKey: ['drawer-items'],
    queryFn: async () => {
      const res = await platformApi.getDrawerItems();
      return res.data.data;
    },
    staleTime: STALE_MS,
  });

  const sections =
    query.data && query.data.length > 0 ? groupDrawerItems(query.data) : fallbackSections();

  return { ...query, sections, fromApi: Boolean(query.data?.length) };
}
