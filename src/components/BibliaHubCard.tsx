import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { radius, spacing, typography } from '../theme/tokens';

interface BibliaHubCardProps {
  bookCount?: number;
  onPress: () => void;
}

export function BibliaHubCard({ bookCount, onPress }: BibliaHubCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
        <AppIcon name="library-filled" size={28} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Biblia</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Santa Biblia RVR 1960
          {bookCount ? ` · ${bookCount} libros` : ''}
        </Text>
      </View>
      <AppIcon name="forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { ...typography.title, fontSize: 18 },
  sub: { fontSize: 13, marginTop: 2 },
});
