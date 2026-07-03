import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  color?: string;
  /** Círculo con borde para headers del stack (p. ej. detalle de publicación). */
  variant?: 'plain' | 'contained';
};

export function DrawerBackButton({ color, variant = 'plain' }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const iconColor = color ?? colors.text;
  const contained = variant === 'contained';

  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => [
        styles.btn,
        contained && [
          styles.contained,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ],
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={contained ? 4 : 8}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name="chevron-back"
          size={contained ? 22 : 26}
          color={iconColor}
          style={Platform.OS === 'ios' ? styles.iconIos : undefined}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contained: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconIos: {
    marginLeft: -2,
  },
  pressed: { opacity: 0.65 },
});
