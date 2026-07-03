import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
export const HEADER_FADE_EXTRA = 28;

type HeaderTopFadeProps = {
  readonly height: number;
};

/** Degradado anclado al borde superior, sólido arriba → transparente abajo (patrón FarmCloud). */
export function HeaderTopFade({ height }: HeaderTopFadeProps) {
  const { colors } = useTheme();
  const bg = colors.background;
  const fadeHeight = height + HEADER_FADE_EXTRA;

  return (
    <View pointerEvents="none" style={[styles.host, { height: fadeHeight }]}>
      <LinearGradient
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        colors={[bg, `${bg}CC`, `${bg}00`]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 5,
  },
});
