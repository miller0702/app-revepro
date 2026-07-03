import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ReadingStatusMeta } from '../../lib/readingStatus';
import { ReadingStatusBadge } from '../reading/ReadingStatusBadge';
import { radius, typography, spacing } from '../../theme/tokens';

export type BibleTestament = 'old' | 'new';

interface BibleBookCardProps {
  title: string;
  abbrev?: string | null;
  sortOrder: number;
  testament: BibleTestament;
  readingStatus?: ReadingStatusMeta | null;
  onPress: () => void;
}

const coverColors = ['#1a2030', '#2d2416', '#1a2e1a', '#2a1a30', '#1a2830', '#30261a'];

export function BibleBookCard({
  title,
  abbrev,
  sortOrder,
  testament,
  readingStatus,
  onPress,
}: BibleBookCardProps) {
  const { colors } = useTheme();
  const coverColor = coverColors[sortOrder % coverColors.length];
  const coverLetter = (abbrev?.charAt(0) ?? title.charAt(0)).toUpperCase();
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
        <Text style={styles.coverLetter}>{coverLetter}</Text>
        {abbrev ? <Text style={styles.coverAbbrev}>{abbrev}</Text> : null}
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.order, { color: colors.textSecondary }]}>
          Libro {sortOrder} · {testament === 'old' ? 'A.T.' : 'N.T.'}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {abbrev ? (
          <Text style={[styles.abbrev, { color: colors.primary }]} numberOfLines={1}>
            {abbrev}
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
  coverAbbrev: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
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
  order: {
    ...typography.caption,
    marginBottom: 4,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  abbrev: {
    ...typography.caption,
  },
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
