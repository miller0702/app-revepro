import { Pressable, Text, StyleSheet, View, Image } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { radius, typography, spacing } from '../theme/tokens';
import { formatDuration, formatViewCount } from '../utils/format';
import { resolveApiMediaUrl } from '../utils/mediaUrl';

interface VideoCardProps {
  title: string;
  description?: string | null;
  durationSec?: number | null;
  viewCount?: number;
  categoryName?: string;
  thumbnailUrl?: string | null;
  index?: number;
  onPress: () => void;
}

const thumbColors = ['#1a2030', '#2d3a52', '#1a2e1a', '#30241a', '#2a1a30'];

export function VideoCard({
  title,
  description,
  durationSec,
  viewCount,
  categoryName,
  thumbnailUrl,
  index = 0,
  onPress,
}: VideoCardProps) {
  const { colors } = useTheme();
  const thumbColor = thumbColors[index % thumbColors.length];
  const thumbUri = resolveApiMediaUrl(thumbnailUrl);

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
      <View style={[styles.thumbnail, { backgroundColor: thumbColor }]}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumbnailImage} resizeMode="cover" />
        ) : null}
        <View style={styles.playBadge}>
          <AppIcon name="play" size={22} color={colors.onPrimary} />
        </View>
        {durationSec != null && durationSec > 0 && (
          <View style={styles.durationBadge}>
            <Text style={[styles.durationText, { color: colors.onHero }]}>{formatDuration(durationSec)}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {viewCount != null ? `${formatViewCount(viewCount)} vistas` : ''}
          {categoryName ? ` · ${categoryName}` : ''}
        </Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
  },
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'rgba(201, 162, 39, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    zIndex: 2,
  },
  durationText: { fontSize: 12, fontWeight: '600' },
  content: { padding: spacing.md },
  title: { ...typography.body, fontWeight: '700', marginBottom: 4 },
  meta: { ...typography.caption, marginBottom: 4 },
  description: { fontSize: 13, lineHeight: 18 },
});
