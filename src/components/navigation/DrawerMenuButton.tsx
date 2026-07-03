import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface DrawerMenuButtonProps {
  readonly size?: number;
  readonly style?: ViewStyle;
  readonly color?: string;
}

export function DrawerMenuButton({ size = 30, style, color }: DrawerMenuButtonProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const iconColor = color ?? colors.text;

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
    >
      <Ionicons name="menu-outline" size={size} color={iconColor} />
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
