import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { streamingApi } from '../../src/api/streaming';
import { AppIcon } from '../../src/components/ui/AppIcon';
import { FavoriteToggle } from '../../src/components/ui/FavoriteToggle';
import { ShareToFeedButton } from '../../src/components/community/ShareToFeedButton';
import { DirectVideoPlayer, YouTubePlayer } from '../../src/components/VideoPlayer';
import { DrawerBackButton } from '../../src/components/navigation/DrawerBackButton';
import { useTheme } from '../../src/hooks/useTheme';
import { typography, spacing } from '../../src/theme/tokens';
import { SCREEN_PADDING_X } from '../../src/theme/layout';
import { ScreenDetailLoading } from '../../src/components/ui/ScreenDetailLoading';
import { formatDuration, formatViewCount } from '../../src/utils/format';
import { recordRecentVideo } from '../../src/storage/recentContent';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => (await streamingApi.getVideo(id!)).data.data,
    enabled: !!id,
  });

  const video = data;
  const isYouTube = video?.sourceType === 'YOUTUBE' && Boolean(video.youtubeVideoId);

  useEffect(() => {
    if (video) void recordRecentVideo(video);
  }, [video?.id]);

  if (isLoading) {
    return <ScreenDetailLoading />;
  }

  if (!video) return null;

  const statsLine = [
    formatViewCount(video.viewCount) + ' vistas',
    video.durationSec ? formatDuration(video.durationSec) : null,
    video.category?.name ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.playerSection}>
        <View style={styles.playerFrame}>
          {isYouTube && video.youtubeVideoId ? (
            <YouTubePlayer videoId={video.youtubeVideoId} autoPlay />
          ) : video.videoUrl ? (
            <DirectVideoPlayer url={video.videoUrl} autoPlay />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.cardGradient[0] }]}>
              <AppIcon name="play" size={48} color="rgba(255,255,255,0.85)" />
              <Text style={styles.placeholderText}>Video no disponible</Text>
            </View>
          )}
        </View>

        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent']}
          style={[styles.playerTopGradient, { paddingTop: insets.top }]}
        >
          <DrawerBackButton color="#fff" />
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{video.title}</Text>
        {statsLine ? (
          <Text style={[styles.stats, { color: colors.textSecondary }]}>{statsLine}</Text>
        ) : null}

        <View style={styles.favRow}>
          <FavoriteToggle targetType="VIDEO" targetId={video.id} size={28} />
          <Text style={[styles.favLabel, { color: colors.textSecondary }]}>Guardar video</Text>
        </View>

        <View style={styles.shareRow}>
          <ShareToFeedButton
            draft={{
              kind: 'RECOMMENDATION',
              body: `Te recomiendo este video: «${video.title}»`,
              videoId: video.id,
              attachmentPreview: {
                type: 'VIDEO',
                id: video.id,
                title: video.title,
                imageUrl: video.thumbnailUrl,
              },
            }}
          />
        </View>

        {video.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{video.description}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { fontSize: 15 },
  playerSection: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  playerFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  playerTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
    zIndex: 2,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
  },
  title: { ...typography.title, fontSize: 24, marginBottom: spacing.xs },
  stats: { fontSize: 14, marginBottom: spacing.md },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  shareRow: { marginBottom: spacing.lg },
  favLabel: { fontSize: 14, fontWeight: '600' },
  description: { ...typography.body, lineHeight: 22 },
});
