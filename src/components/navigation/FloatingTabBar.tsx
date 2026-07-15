import { useEffect } from 'react';
import {
  View,
  ColorValue,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useTabBarScrollStore } from '../../stores/tabBarScrollStore';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { UserAvatar } from '../ui/UserAvatar';
import { AudioMiniPlayer } from '../AudioMiniPlayer';
import type { AppSection } from '../../api/platform';
import { compareAppTabOrder } from '../../config/appTabs';
import { radius } from '../../theme/tokens';

/** Altura fila de iconos (expandido / reposo). */
export const TAB_BAR_HEIGHT = 60;
/** Altura al hacer scroll down (= tamaño “grande” anterior). */
export const TAB_BAR_HEIGHT_COLLAPSED = 56;
export const TAB_ICON_SIZE = 28;
export const TAB_ICON_SIZE_COLLAPSED = 26;
export const PROFILE_TAB_AVATAR_SIZE = 28;
export const PROFILE_TAB_AVATAR_SIZE_COLLAPSED = 26;

/** Margen inferior entre el pill y el borde seguro (más abajo = menor gap). */
export const FLOATING_TAB_BOTTOM_GAP = 4;
/** Insets horizontales: expandido más ancho; compacto como el pill anterior. */
export const FLOATING_TAB_HORIZONTAL_RATIO = 0.06;
export const FLOATING_TAB_HORIZONTAL_RATIO_COLLAPSED = 0.14;
export const FLOATING_TAB_HORIZONTAL_MIN = 12;
export const FLOATING_TAB_HORIZONTAL_MAX = 28;
export const FLOATING_TAB_HORIZONTAL_MIN_COLLAPSED = 28;
export const FLOATING_TAB_HORIZONTAL_MAX_COLLAPSED = 56;

/** @deprecated */
export const FLOATING_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT;
export const FLOATING_TAB_MARGIN = FLOATING_TAB_BOTTOM_GAP;
export const FLOATING_TAB_BAR_HORIZONTAL_INSET = FLOATING_TAB_HORIZONTAL_MIN;
export const TAB_BAR_FADE_HEIGHT = 0;
export const HEADER_FADE_EXTRA = 28;

const ANIM = { duration: 220, easing: Easing.out(Easing.cubic) };

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
  size = TAB_ICON_SIZE,
}: {
  section?: AppSection;
  routeName: string;
  focused: boolean;
  color: ColorValue;
  size?: number;
}) {
  const fallback = DEFAULT_ICONS[routeName];
  const outline = (section?.icon ?? fallback?.outline ?? 'library') as AppIconName;
  const filled = (section?.iconActive ?? fallback?.filled ?? 'library-filled') as AppIconName;

  return (
    <AppIcon
      name={focused ? filled : outline}
      size={size}
      color={color}
      style={{ opacity: focused ? 1 : 0.72 }}
    />
  );
}

export function TabProfileIcon({
  focused,
  color,
  size = PROFILE_TAB_AVATAR_SIZE,
}: {
  focused: boolean;
  color: ColorValue;
  size?: number;
}) {
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
          size={size}
        />
      </View>
    );
  }

  return (
    <AppIcon
      name={focused ? 'profile-filled' : 'profile'}
      size={size}
      color={color}
      style={{ opacity: focused ? 1 : 0.72 }}
    />
  );
}

interface AppTabBarProps extends BottomTabBarProps {
  readonly getSection: (code: string) => AppSection | undefined;
}

export function getFloatingTabHorizontalInset(screenWidth: number, collapsed = false) {
  const ratio = collapsed
    ? FLOATING_TAB_HORIZONTAL_RATIO_COLLAPSED
    : FLOATING_TAB_HORIZONTAL_RATIO;
  const min = collapsed
    ? FLOATING_TAB_HORIZONTAL_MIN_COLLAPSED
    : FLOATING_TAB_HORIZONTAL_MIN;
  const max = collapsed
    ? FLOATING_TAB_HORIZONTAL_MAX_COLLAPSED
    : FLOATING_TAB_HORIZONTAL_MAX;
  const raw = screenWidth * ratio;
  return Math.round(Math.max(min, Math.min(max, raw)));
}

/** Espacio vertical reservado bajo el contenido (pill + gaps + safe area). */
export function getFloatingTabBarReserve(bottomInset: number, collapsed = false) {
  const row = collapsed ? TAB_BAR_HEIGHT_COLLAPSED : TAB_BAR_HEIGHT;
  return row + FLOATING_TAB_BOTTOM_GAP + Math.max(bottomInset, 8) + 8;
}

/**
 * Tab bar flotante estilo Instagram:
 * píldora translúcida centrada; se compacta al scrollear hacia abajo.
 */
export function AppTabBar({ state, navigation, getSection }: AppTabBarProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const collapseTarget = useTabBarScrollStore((s) => s.collapse);
  const expand = useTabBarScrollStore((s) => s.expand);
  const collapse = useSharedValue(0);

  useEffect(() => {
    collapse.value = withTiming(collapseTarget, ANIM);
  }, [collapse, collapseTarget]);

  useEffect(() => {
    expand();
  }, [state.index, expand]);

  const hInsetExpanded = getFloatingTabHorizontalInset(width, false);
  const hInsetCollapsed = getFloatingTabHorizontalInset(width, true);
  const bottomPad = Math.max(insets.bottom, 6) + FLOATING_TAB_BOTTOM_GAP;

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

  const pillBg = isDark ? 'rgba(22, 26, 34, 0.82)' : 'rgba(18, 20, 26, 0.78)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)';
  const activePill = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.22)';
  const iconIdle = 'rgba(255,255,255,0.78)';
  const iconActive = '#FFFFFF';

  const dockStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(
      collapse.value,
      [0, 1],
      [hInsetExpanded, hInsetCollapsed],
    ),
  }));

  const shellStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(collapse.value, [0, 1], [0, 2]),
      },
    ],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    height: interpolate(collapse.value, [0, 1], [TAB_BAR_HEIGHT, TAB_BAR_HEIGHT_COLLAPSED]),
    paddingHorizontal: interpolate(collapse.value, [0, 1], [8, 6]),
  }));

  const iconSize =
    collapseTarget >= 0.5 ? TAB_ICON_SIZE_COLLAPSED : TAB_ICON_SIZE;
  const avatarSize =
    collapseTarget >= 0.5 ? PROFILE_TAB_AVATAR_SIZE_COLLAPSED : PROFILE_TAB_AVATAR_SIZE;

  return (
    <View style={tabStyles.host} pointerEvents="box-none">
      <Animated.View
        style={[tabStyles.dock, { paddingBottom: bottomPad }, dockStyle]}
        pointerEvents="box-none"
      >
        <AudioMiniPlayer floating />
        <Animated.View
          style={[
            tabStyles.shadowWrap,
            shellStyle,
            Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.35,
                shadowRadius: 18,
              },
              android: { elevation: 18 },
            }),
          ]}
        >
          <Animated.View
            style={[
              tabStyles.pill,
              pillStyle,
              {
                backgroundColor: pillBg,
                borderColor: pillBorder,
              },
            ]}
          >
            {visibleRoutes.map((route) => {
              const routeIndex = state.routes.findIndex((r) => r.key === route.key);
              const focused = state.index === routeIndex;
              const section = getSection(route.name);
              const color = focused ? iconActive : iconIdle;

              const icon =
                route.name === 'profile' ? (
                  <TabProfileIcon focused={focused} color={color} size={avatarSize} />
                ) : (
                  <TabIcon
                    section={section}
                    routeName={route.name}
                    focused={focused}
                    color={color}
                    size={iconSize}
                  />
                );

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  onPress={() => {
                    expand();
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
                  <View
                    style={[
                      tabStyles.tabInner,
                      focused && { backgroundColor: activePill },
                    ]}
                  >
                    {icon}
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        </Animated.View>
      </Animated.View>
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
    tabBarStyle: {
      position: 'absolute' as const,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
    },
  };
}

/** @deprecated Usar appTabBarScreenOptions */
export const floatingTabBarScreenOptions = appTabBarScreenOptions;

const tabStyles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dock: {
    width: '100%',
    alignItems: 'stretch',
    gap: 8,
  },
  shadowWrap: {
    borderRadius: radius.full,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    minWidth: 48,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
