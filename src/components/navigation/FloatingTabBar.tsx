import { View, ColorValue, Pressable, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { UserAvatar } from '../ui/UserAvatar';
import { AudioMiniPlayer } from '../AudioMiniPlayer';
import type { AppSection } from '../../api/platform';
import type { ThemeColors } from '../../theme/colors';
import { compareAppTabOrder } from '../../config/appTabs';

/** Altura de la fila de iconos (sin mini player ni safe area). */
export const TAB_BAR_HEIGHT = 56;

export const TAB_ICON_SIZE = 26;
export const PROFILE_TAB_AVATAR_SIZE = 26;

/** @deprecated Usar TAB_BAR_HEIGHT */
export const FLOATING_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT;
export const FLOATING_TAB_MARGIN = 0;
export const FLOATING_TAB_BAR_HORIZONTAL_INSET = 0;
export const TAB_BAR_FADE_HEIGHT = 0;
export const HEADER_FADE_EXTRA = 28;

const DEFAULT_ICONS: Record<string, { outline: AppIconName; filled: AppIconName }> = {
  feed: { outline: 'feed', filled: 'feed-filled' },
  library: { outline: 'library', filled: 'library-filled' },
  audio: { outline: 'audio', filled: 'audio-filled' },
  videos: { outline: 'video', filled: 'video-filled' },
  favorites: { outline: 'favorites', filled: 'favorites-filled' },
  profile: { outline: 'profile', filled: 'profile-filled' },
};

export function TabIcon({
  section,
  routeName,
  focused,
  color,
}: {
  section?: AppSection;
  routeName: string;
  focused: boolean;
  color: ColorValue;
}) {
  const fallback = DEFAULT_ICONS[routeName];
  const outline = (section?.icon ?? fallback?.outline ?? 'library') as AppIconName;
  const filled = (section?.iconActive ?? fallback?.filled ?? 'library-filled') as AppIconName;

  return (
    <AppIcon
      name={focused ? filled : outline}
      size={TAB_ICON_SIZE}
      color={color}
      style={{ opacity: focused ? 1 : 0.55 }}
    />
  );
}

export function TabProfileIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  if (user?.avatarUrl) {
    return (
      <View
        style={[
          tabStyles.profileAvatarWrap,
          focused && { borderColor: colors.primary, borderWidth: 2 },
        ]}
      >
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={user.avatarUrl}
          size={PROFILE_TAB_AVATAR_SIZE}
        />
      </View>
    );
  }

  return (
    <AppIcon
      name={focused ? 'profile-filled' : 'profile'}
      size={TAB_ICON_SIZE}
      color={color}
      style={{ opacity: focused ? 1 : 0.55 }}
    />
  );
}

interface AppTabBarProps extends BottomTabBarProps {
  readonly getSection: (code: string) => AppSection | undefined;
}

/** Borde superior con acento dorado + línea divisoria. */
function TabBarTopChrome({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const accentSoft = isDark ? 'rgba(232, 197, 71, 0.28)' : 'rgba(201, 162, 39, 0.32)';
  const accentPeak = isDark ? 'rgba(232, 197, 71, 0.72)' : 'rgba(201, 162, 39, 0.62)';

  return (
    <View style={topChromeStyles.wrap} pointerEvents="none">
      <LinearGradient
        colors={['transparent', accentSoft, accentPeak, accentSoft, 'transparent']}
        locations={[0, 0.32, 0.5, 0.68, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={topChromeStyles.glow}
      />
      <View style={[topChromeStyles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

/** Tab bar fijo (estilo Facebook) + mini player encima (estilo Spotify). */
export function AppTabBar({ state, descriptors, navigation, getSection }: AppTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes
    .filter((route) => {
      const section = getSection(route.name);
      return section?.isVisible !== false;
    })
    .sort((a, b) => {
      const orderA = getSection(a.name)?.sortOrder ?? 999;
      const orderB = getSection(b.name)?.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return compareAppTabOrder(a.name, b.name);
    });

  return (
    <View
      style={[
        tabStyles.shell,
        {
          backgroundColor: colors.surface,
          paddingBottom: insets.bottom,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.55 : 0.9,
              shadowRadius: 12,
            },
            android: { elevation: 14 },
          }),
        },
      ]}
    >
      <TabBarTopChrome colors={colors} isDark={isDark} />
      <AudioMiniPlayer />
      <View style={[tabStyles.row, { height: TAB_BAR_HEIGHT }]}>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === routeIndex;
          const section = getSection(route.name);
          const color = focused ? colors.primary : colors.textSecondary;

          const icon =
            route.name === 'profile' ? (
              <TabProfileIcon focused={focused} color={color} />
            ) : (
              <TabIcon section={section} routeName={route.name} focused={focused} color={color} />
            );

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              onLongPress={() => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              }}
              style={tabStyles.tab}
            >
              <View style={tabStyles.tabInner}>
                {icon}
                {focused ? (
                  <View style={[tabStyles.activeIndicator, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** @deprecated Usar AppTabBar */
export const FloatingTabBarContainer = AppTabBar;

export function appTabBarScreenOptions(colors: ReturnType<typeof useTheme>['colors']) {
  return {
    tabBarShowLabel: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
  };
}

/** @deprecated Usar appTabBarScreenOptions */
export const floatingTabBarScreenOptions = appTabBarScreenOptions;

const tabStyles = StyleSheet.create({
  shell: {
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 22,
    height: 3,
    borderRadius: 2,
  },
  profileAvatarWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});

const topChromeStyles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  glow: {
    height: 2,
    width: '100%',
  },
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
