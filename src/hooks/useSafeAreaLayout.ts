import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import {
  FLOATING_TAB_BOTTOM_GAP,
  getFloatingTabBarReserve,
} from '../components/navigation/FloatingTabBar';

/**
 * Top inset fiable en Android (pantallas y Modal).
 * Dentro de Modal, useSafeAreaInsets().top a menudo es 0: usamos StatusBar como fallback.
 */
export function useResolvedTopInset() {
  const insets = useSafeAreaInsets();
  const androidFallback = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  return Math.max(insets.top, androidFallback);
}

/** Padding superior estándar para pantallas sin header nativo. */
export function useScreenTopInset(extra = spacing.md) {
  return useResolvedTopInset() + extra;
}

/**
 * Inset superior para headers/toolbars dentro de Modal (X, cancelar, etc.).
 */
export function useModalTopInset(extra = 0) {
  return useResolvedTopInset() + extra;
}

/** Altura reservada del tab bar flotante (pill + gaps + safe area). */
export function useTabBarOffset() {
  const insets = useSafeAreaInsets();
  return getFloatingTabBarReserve(insets.bottom, false);
}

/** @deprecated */
export function useFloatingTabBarOffset() {
  return useTabBarOffset();
}

/**
 * Padding inferior de listas dentro de tabs (contenido no queda bajo el pill flotante).
 */
export function useTabContentBottomPadding(extra = spacing.md) {
  const insets = useSafeAreaInsets();
  return getFloatingTabBarReserve(insets.bottom, false) + extra;
}

/** @deprecated Usar useTabContentBottomPadding */
export function useFloatingTabBarPadding(extra = spacing.md) {
  return useTabContentBottomPadding(extra);
}

/** @deprecated */
export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  return {
    height: getFloatingTabBarReserve(insets.bottom, false),
    paddingBottom: insets.bottom + FLOATING_TAB_BOTTOM_GAP,
    paddingTop: 0,
  };
}
