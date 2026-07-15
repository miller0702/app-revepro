import type { ReactNode } from 'react';
import { View, Text, StyleSheet, type ColorValue } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerBackButton } from '../navigation/DrawerBackButton';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { useResolvedTopInset } from '../../hooks/useSafeAreaLayout';
import { radius, spacing, typography } from '../../theme/tokens';
import { resolveApiMediaUrl } from '../../utils/mediaUrl';

export const PARALLAX_HERO_HEIGHT = 320;

/** Espacio entre el borde inferior del hero y el inicio del sheet (sin solapamiento). */
export const PARALLAX_SHEET_CLEARANCE = 24;

interface ParallaxCoverLayoutProps {
  coverUrl?: string | null;
  fallbackColor: ColorValue;
  fallbackIcon?: AppIconName;
  fallbackLetter?: string;
  heroOverlay?: ReactNode;
  children: ReactNode;
  bottomInset?: number;
  /** Altura del espaciador antes del sheet. Por defecto deja visible el overlay del hero. */
  topSpacer?: number;
  /** Solapamiento del sheet sobre el hero (solo si no se pasa topSpacer). */
  sheetOverlap?: number;
}

export function ParallaxCoverLayout({
  coverUrl,
  fallbackColor,
  fallbackIcon = 'music',
  fallbackLetter,
  heroOverlay,
  children,
  bottomInset = 0,
  topSpacer,
  sheetOverlap = 28,
}: ParallaxCoverLayoutProps) {
  const topInset = useResolvedTopInset();
  const scrollY = useSharedValue(0);
  const imageUri = resolveApiMediaUrl(coverUrl);

  const spacerHeight =
    topSpacer ??
    (heroOverlay
      ? PARALLAX_HERO_HEIGHT + PARALLAX_SHEET_CLEARANCE
      : PARALLAX_HERO_HEIGHT - sheetOverlap);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-80, 0, PARALLAX_HERO_HEIGHT],
          [40, 0, -PARALLAX_HERO_HEIGHT * 0.35],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(scrollY.value, [-120, 0], [1.18, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const navBarStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${interpolate(
      scrollY.value,
      [spacerHeight - 80, spacerHeight - 20],
      [0, 0.55],
      Extrapolation.CLAMP,
    )})`,
  }));

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { height: PARALLAX_HERO_HEIGHT, backgroundColor: fallbackColor }]}>
        {imageUri ? (
          <Animated.Image
            source={{ uri: imageUri }}
            style={[styles.heroImage, heroImageStyle]}
            resizeMode="cover"
          />
        ) : fallbackLetter ? (
          <Animated.View style={[styles.heroFallback, heroImageStyle, { backgroundColor: fallbackColor }]}>
            <Text style={styles.heroLetter}>{fallbackLetter}</Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.heroFallback, heroImageStyle, { backgroundColor: fallbackColor }]}>
            <AppIcon name={fallbackIcon} size={72} color="rgba(255,255,255,0.35)" />
          </Animated.View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        {heroOverlay ? <View style={styles.heroOverlay}>{heroOverlay}</View> : null}
      </View>

      <Animated.View style={[styles.navBar, { paddingTop: topInset }, navBarStyle]}>
        <DrawerBackButton color="#fff" />
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + spacing.xl }}
      >
        <View style={{ height: spacerHeight }} />
        <View style={styles.sheet}>{children}</View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: PARALLAX_HERO_HEIGHT + 80,
  },
  heroFallback: {
    width: '100%',
    height: PARALLAX_HERO_HEIGHT + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLetter: {
    fontSize: 88,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: spacing.lg,
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.xs,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 200,
  },
});

/** Estilos compartidos para título/autor en el hero. */
export const parallaxHeroStyles = StyleSheet.create({
  title: {
    ...typography.title,
    fontSize: 28,
    color: '#fff',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.md,
  },
});
