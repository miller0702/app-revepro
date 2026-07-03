import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import type { ReadingStatus } from '../../lib/readingStatus';
import { radius, typography } from '../../theme/tokens';

interface ReadingStatusBadgeProps {
  status: ReadingStatus;
  label: string;
  percentage?: number;
  compact?: boolean;
}

function badgeColors(status: ReadingStatus, isDark: boolean) {
  switch (status) {
    case 'read':
      return {
        bg: isDark ? 'rgba(74, 124, 89, 0.28)' : 'rgba(74, 124, 89, 0.14)',
        text: isDark ? '#9fd4a8' : '#3d6b47',
        border: isDark ? 'rgba(159, 212, 168, 0.35)' : 'rgba(61, 107, 71, 0.25)',
      };
    case 'studying':
      return {
        bg: isDark ? 'rgba(107, 91, 149, 0.3)' : 'rgba(107, 91, 149, 0.14)',
        text: isDark ? '#c4b8e8' : '#5a4d82',
        border: isDark ? 'rgba(196, 184, 232, 0.35)' : 'rgba(90, 77, 130, 0.25)',
      };
    case 'reading':
      return {
        bg: isDark ? 'rgba(201, 162, 39, 0.28)' : 'rgba(201, 162, 39, 0.16)',
        text: isDark ? '#f0d878' : '#8a6f1a',
        border: isDark ? 'rgba(240, 216, 120, 0.35)' : 'rgba(138, 111, 26, 0.28)',
      };
    default:
      return null;
  }
}

function badgeIcon(status: ReadingStatus) {
  switch (status) {
    case 'read':
      return 'check-done' as const;
    case 'studying':
      return 'study' as const;
    case 'reading':
      return 'time' as const;
    default:
      return null;
  }
}

export function ReadingStatusBadge({
  status,
  label,
  percentage,
  compact = false,
}: ReadingStatusBadgeProps) {
  const { isDark } = useTheme();

  if (status === 'unread' || !label) return null;

  const palette = badgeColors(status, isDark);
  if (!palette) return null;

  const icon = badgeIcon(status);
  const showPct =
    !compact && status === 'reading' && percentage != null && percentage > 0 && percentage < 100;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
    >
      {icon ? <AppIcon name={icon} size={compact ? 11 : 12} color={palette.text} /> : null}
      <Text style={[styles.label, compact && styles.labelCompact, { color: palette.text }]}>
        {label}
        {showPct ? ` · ${Math.round(percentage)}%` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  labelCompact: {
    fontSize: 10,
  },
});
