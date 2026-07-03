import { Tabs } from 'expo-router';
import { useTheme } from '../../../src/hooks/useTheme';
import { useAppSections } from '../../../src/hooks/useAppSections';
import {
  AppTabBar,
  appTabBarScreenOptions,
  TabProfileIcon,
  TabIcon,
} from '../../../src/components/navigation/FloatingTabBar';
import { APP_TAB_CODES } from '../../../src/config/appTabs';

const DEFAULT_TITLES: Record<string, string> = {
  feed: 'Inicio',
  library: 'Biblioteca',
  audio: 'Audio',
  videos: 'Videos',
  favorites: 'Favoritos',
  profile: 'Perfil',
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const { data: sections } = useAppSections();

  const getSection = (code: string) => sections?.find((s) => s.code === code);

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} getSection={getSection} />}
      screenOptions={({ route }) => {
        const section = getSection(route.name);
        const isHidden = section?.isVisible === false;

        return {
          title: section?.tabTitle ?? DEFAULT_TITLES[route.name] ?? route.name,
          href: isHidden ? null : undefined,
          headerShown: false,
          ...appTabBarScreenOptions(colors),
          tabBarIcon: ({ focused, color }) =>
            route.name === 'profile' ? (
              <TabProfileIcon focused={focused} color={color} />
            ) : (
              <TabIcon
                section={section}
                routeName={route.name}
                focused={focused}
                color={color}
              />
            ),
        };
      }}
    >
      {APP_TAB_CODES.map((code) => (
        <Tabs.Screen key={code} name={code} />
      ))}
    </Tabs>
  );
}
