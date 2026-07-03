import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { ReadingStatusMeta } from '../lib/readingStatus';
import { ReadingStatusBadge } from './reading/ReadingStatusBadge';
import { radius, typography, spacing } from '../theme/tokens';

interface BookCardProps {
  title: string;
  summary?: string | null;
  authorName?: string;
  index?: number;
  readingStatus?: ReadingStatusMeta | null;
  onPress: () => void;
}

const coverColors = ['#1a2030', '#2d2416', '#1a2e1a', '#2a1a30', '#1a2830'];

export function BookCard({
  title,
  summary,
  authorName,
  index = 0,
  readingStatus,
  onPress,
}: BookCardProps) {
  const { colors } = useTheme();
  const coverColor = coverColors[index % coverColors.length];
  const showStatus = readingStatus && readingStatus.status !== 'unread';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: coverColor }]}>
        <Text style={styles.coverLetter}>{title.charAt(0).toUpperCase()}</Text>
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {authorName ? (
          <Text style={[styles.author, { color: colors.primary }]} numberOfLines={1}>
            {authorName}
          </Text>
        ) : null}
        {summary ? (
          <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
        {showStatus && readingStatus.status === 'reading' ? (
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, Math.max(4, readingStatus.percentage))}%`,
                },
              ]}
            />
          </View>
        ) : null}
      </View>
      {showStatus ? (
        <View style={styles.statusCol}>
          <ReadingStatusBadge
            status={readingStatus.status}
            label={readingStatus.label}
            percentage={readingStatus.percentage}
            compact
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  cover: {
    width: 88,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    minWidth: 0,
  },
  statusCol: {
    justifyContent: 'center',
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
    maxWidth: 108,
  },
  title: { ...typography.body, fontWeight: '700', marginBottom: 4 },
  author: { ...typography.caption, marginBottom: 6 },
  summary: { fontSize: 13, lineHeight: 18 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
