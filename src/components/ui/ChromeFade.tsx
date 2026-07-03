import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import {
  BOTTOM_FADE_HEIGHT,
  HEADER_FADE_HEIGHT,
  bottomChromeFade,
  headerBottomFade,
} from '../../theme/backgroundFade';

export { HEADER_FADE_HEIGHT, BOTTOM_FADE_HEIGHT };

interface ChromeFadeProps {
  readonly style?: ViewStyle;
}

/** Franja corta bajo el título del header. */
export function HeaderChromeFade({ style }: ChromeFadeProps) {
  const { colors } = useTheme();
  const fade = headerBottomFade(colors.background);

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...fade.colors]}
      locations={[...fade.locations]}
      style={[styles.headerFade, style]}
    />
  );
}

interface BottomChromeFadeProps {
  readonly bottomOffset: number;
  readonly style?: ViewStyle;
}

/** Franja encima del tab bar flotante. */
export function BottomChromeFade({ bottomOffset, style }: BottomChromeFadeProps) {
  const { colors } = useTheme();
  const fade = bottomChromeFade(colors.background);

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...fade.colors]}
      locations={[...fade.locations]}
      style={[styles.bottomFade, { bottom: bottomOffset, height: BOTTOM_FADE_HEIGHT }, style]}
    />
  );
}

const styles = StyleSheet.create({
  headerFade: {
    width: '100%',
    height: HEADER_FADE_HEIGHT,
    marginTop: 2,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
