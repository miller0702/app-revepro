import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { streamingApi } from '../../src/api/streaming';
import { EpisodeRow } from '../../src/components/PodcastCard';
import { FavoriteToggle } from '../../src/components/ui/FavoriteToggle';
import { ShareToFeedButton } from '../../src/components/community/ShareToFeedButton';
import { AudioMiniPlayer } from '../../src/components/AudioMiniPlayer';
import { ParallaxCoverLayout, parallaxHeroStyles } from '../../src/components/layout/ParallaxCoverLayout';
import { AppIcon } from '../../src/components/ui/AppIcon';
import { usePlayerStore } from '../../src/stores/playerStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, radius } from '../../src/theme/tokens';
import { SCREEN_PADDING_X } from '../../src/theme/layout';
import { ScreenDetailLoading } from '../../src/components/ui/ScreenDetailLoading';
import { fetchFirstPlayableEpisode } from '../../src/utils/playPodcast';
import { recordRecentPodcast } from '../../src/storage/recentContent';

const HERO_COLORS = ['#2d2416', '#1a2e1a', '#2a1a30'];

export default function PodcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { play, track, isPlaying } = usePlayerStore();

  const { data, isLoading } = useQuery({
    queryKey: ['podcast', id],
    queryFn: async () => (await streamingApi.getPodcastSeriesDetail(id!)).data.data,
    enabled: !!id,
  });

  const series = data;
  const heroColor = HERO_COLORS[(series?.title.length ?? 0) % HERO_COLORS.length];
  const playerBottom = track ? 88 + insets.bottom : insets.bottom;

  useEffect(() => {
    if (!series) return;
    void recordRecentPodcast({
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      coverUrl: series.coverUrl,
      episodeCount: series.episodes?.length ?? series.episodeCount ?? 0,
      author: series.author,
      category: series.category,
    });
  }, [series?.id]);

  const playFirstEpisode = async () => {
    if (!series) return;
    const result = await fetchFirstPlayableEpisode(series.id);
    if (result) await play(result.track);
  };

  if (isLoading) {
    return <ScreenDetailLoading />;
  }

  if (!series) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ParallaxCoverLayout
          coverUrl={series.coverUrl}
          fallbackColor={heroColor}
          bottomInset={playerBottom}
          heroOverlay={
            <>
              <Text style={parallaxHeroStyles.title} numberOfLines={3}>
                {series.title}
              </Text>
              {series.author?.name ? (
                <Text style={parallaxHeroStyles.subtitle}>{series.author.name}</Text>
              ) : null}
              <Pressable
                onPress={playFirstEpisode}
                style={({ pressed }) => [
                  styles.playHeroBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <AppIcon name="play" size={18} color={colors.onPrimary} />
                <Text style={[styles.playHeroText, { color: colors.onPrimary }]}>Reproducir</Text>
              </Pressable>
            </>
          }
        >
          <View style={[styles.body, { backgroundColor: colors.background }]}>
            <View style={styles.favRow}>
              <FavoriteToggle targetType="PODCAST" targetId={series.id} size={28} />
              <Text style={[styles.favLabel, { color: colors.textSecondary }]}>Guardar podcast</Text>
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <ShareToFeedButton
                draft={{
                  kind: 'RECOMMENDATION',
                  body: `Te recomiendo este podcast: «${series.title}»`,
                  podcastSeriesId: series.id,
                  attachmentPreview: {
                    type: 'PODCAST',
                    id: series.id,
                    title: series.title,
                    subtitle: series.author?.name,
                    imageUrl: series.coverUrl,
                  },
                }}
              />
            </View>

            {series.description ? (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {series.description}
              </Text>
            ) : null}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Episodios · {series.episodes.length}
            </Text>

            {series.episodes.map((ep) => (
              <EpisodeRow
                key={ep.id}
                title={ep.title}
                durationSec={ep.durationSec}
                order={ep.order}
                isActive={track?.id === ep.id}
                isPlaying={track?.id === ep.id && isPlaying}
                onPress={() => {
                  if (!ep.audioUrl) return;
                  play({
                    id: ep.id,
                    title: ep.title,
                    subtitle: series.title,
                    url: ep.audioUrl,
                    kind: 'podcast',
                  });
                }}
              />
            ))}
          </View>
        </ParallaxCoverLayout>

      {track ? (
        <View style={[styles.playerDock, { paddingBottom: insets.bottom }]}>
          <AudioMiniPlayer />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { fontSize: 15 },
  playHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  playHeroText: { ...typography.body, fontWeight: '700', fontSize: 15 },
  body: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  favLabel: { fontSize: 14, fontWeight: '600' },
  description: { ...typography.body, marginBottom: spacing.lg },
  sectionTitle: { ...typography.title, fontSize: 18, marginBottom: spacing.md },
  playerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
