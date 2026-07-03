import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import { TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';

/** Padding superior estándar para pantallas sin header nativo. */
export function useScreenTopInset(extra = spacing.md) {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}

/** Altura reservada del tab bar fijo (iconos + safe area). */
export function useTabBarOffset() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom;
}

/** @deprecated Tab bar fijo; el layout reserva espacio automáticamente. */
export function useFloatingTabBarOffset() {
  return useTabBarOffset();
}

/** Padding extra al final de listas dentro de tabs. */
export function useTabContentBottomPadding(extra = spacing.md) {
  return extra;
}

/** @deprecated Usar useTabContentBottomPadding */
export function useFloatingTabBarPadding(extra = spacing.md) {
  return useTabContentBottomPadding(extra);
}

/** @deprecated */
export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  return {
    height: TAB_BAR_HEIGHT + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 0,
  };
}
