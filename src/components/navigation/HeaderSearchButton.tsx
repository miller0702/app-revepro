import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';

interface HeaderSearchButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  /** Tamaño del icono (área táctil mínima 44×44). */
  size?: number;
}

export function HeaderSearchButton({
  onPress,
  accessibilityLabel = 'Buscar',
  size = 30,
}: HeaderSearchButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <AppIcon name="search" size={size} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55 },
});
