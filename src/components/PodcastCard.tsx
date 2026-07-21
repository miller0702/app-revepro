import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { AuthenticatedImage } from './ui/AuthenticatedImage';
import { radius, typography, spacing } from '../theme/tokens';
import { formatDuration } from '../utils/format';

interface PodcastCardProps {
  title: string;
  description?: string | null;
  authorName?: string;
  episodeCount?: number;
  coverUrl?: string | null;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isPlayLoading?: boolean;
  onPress: () => void;
  onPlay?: () => void;
}

const coverColors = ['#2d2416', '#1a2e1a', '#2a1a30', '#1a2830', '#30241a'];

export function PodcastCard({
  title,
  description,
  authorName,
  episodeCount,
  coverUrl,
  index = 0,
  isActive,
  isPlaying,
  isPlayLoading,
  onPress,
  onPlay,
}: PodcastCardProps) {
  const { colors } = useTheme();
  const coverColor = coverColors[index % coverColors.length];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: coverColor }]}>
        {coverUrl ? (
          <AuthenticatedImage url={coverUrl} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <AppIcon name="music" size={34} color="rgba(255,255,255,0.9)" />
        )}
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        {onPlay ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onPlay();
            }}
            style={({ pressed }) => [
              styles.playBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pausar podcast' : 'Reproducir podcast'}
          >
            {isPlayLoading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <AppIcon name={isPlaying ? 'pause' : 'play'} size={18} color={colors.onPrimary} />
            )}
          </Pressable>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {authorName && (
          <Text style={[styles.meta, { color: colors.primary }]} numberOfLines={1}>
            {authorName}
          </Text>
        )}
        {episodeCount != null && (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {episodeCount} episodio{episodeCount !== 1 ? 's' : ''}
          </Text>
        )}
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

interface EpisodeRowProps {
  title: string;
  durationSec?: number | null;
  order: number;
  isActive?: boolean;
  isPlaying?: boolean;
  onPress: () => void;
}

export function EpisodeRow({
  title,
  durationSec,
  order,
  isActive,
  isPlaying,
  onPress,
}: EpisodeRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.episodeRow,
        {
          backgroundColor: isActive ? colors.accentSoft : colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.episodeNum, { backgroundColor: colors.background }]}>
        {isPlaying ? (
          <AppIcon name="pause" size={14} color={colors.primary} />
        ) : isActive ? (
          <AppIcon name="play" size={14} color={colors.primary} />
        ) : (
          <Text style={[styles.episodeNumText, { color: colors.primary }]}>{order}</Text>
        )}
      </View>
      <View style={styles.episodeInfo}>
        <Text style={[styles.episodeTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.episodeDuration, { color: colors.textSecondary }]}>
          {formatDuration(durationSec)}
        </Text>
      </View>
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
  },
  cover: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  playBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  title: { ...typography.body, fontWeight: '700', marginBottom: 4 },
  meta: { ...typography.caption, marginBottom: 2 },
  description: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  episodeNum: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  episodeNumText: { fontSize: 14, fontWeight: '700' },
  episodeInfo: { flex: 1 },
  episodeTitle: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  episodeDuration: { ...typography.caption },
});
