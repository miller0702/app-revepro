import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { radius, spacing } from '../../theme/tokens';

type Props = {
  icon: AppIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StudyEmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
        <AppIcon name={icon} size={28} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionIcon?: AppIconName;
  onAction?: () => void;
};

export function StudySectionHeader({ title, actionLabel, actionIcon, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction && actionIcon ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionChip,
            { backgroundColor: colors.primary, borderColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name={actionIcon} size={16} color={colors.onPrimary} />
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  btn: { alignSelf: 'stretch' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: { opacity: 0.9 },
});
