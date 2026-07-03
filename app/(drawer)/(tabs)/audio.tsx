import { useState, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { streamingApi } from '../../../src/api/streaming';
import { libraryApi, type BookListItem } from '../../../src/api/library';
import { PodcastCard } from '../../../src/components/PodcastCard';
import { RadioCard } from '../../../src/components/RadioCard';
import { ContentFilterBar } from '../../../src/components/ui/ContentFilterBar';
import { usePlayerStore } from '../../../src/stores/playerStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { useCategoryFilters } from '../../../src/hooks/useContentFilters';
import { useRecentAudiobooks, useRecentPodcasts } from '../../../src/hooks/useRecentContent';
import {
  RECENT_FILTER_ID,
  recentAudiobookToBook,
  recentPodcastToSummary,
  recordRecentAudiobook,
  recordRecentPodcast,
} from '../../../src/storage/recentContent';
import { useScreenTopInset, useTabContentBottomPadding } from '../../../src/hooks/useSafeAreaLayout';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { HeaderSearchButton } from '../../../src/components/navigation/HeaderSearchButton';
import { ContentSearchOverlay } from '../../../src/components/community/ContentSearchOverlay';
import { PodcastCardSkeleton, RadioCardSkeleton, skeletonKeys } from '../../../src/components/skeletons/ContentSkeletons';
import { SCREEN_PADDING_X } from '../../../src/theme/layout';
import { typography, spacing } from '../../../src/theme/tokens';
import { fetchFirstPlayableEpisode } from '../../../src/utils/playPodcast';
import { resolveApiMediaUrl } from '../../../src/utils/mediaUrl';

export default function AudioScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const scrollBottomPadding = useTabContentBottomPadding();
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingSeriesId, setLoadingSeriesId] = useState<string | null>(null);
  const [audiobookCategoryId, setAudiobookCategoryId] = useState<string | null>(null);
  const [podcastCategoryId, setPodcastCategoryId] = useState<string | null>(null);
  const { play, track, isPlaying, toggle } = usePlayerStore();
  const { categories: bookCategories, isLoading: bookFiltersLoading } = useCategoryFilters('BOOK');
  const { categories: podcastCategories, isLoading: podcastFiltersLoading } = useCategoryFilters('PODCAST');
  const { items: recentAudiobooks, refresh: refreshRecentAudiobooks } = useRecentAudiobooks();
  const { items: recentPodcasts, refresh: refreshRecentPodcasts } = useRecentPodcasts();

  const audiobookIsRecent = audiobookCategoryId === RECENT_FILTER_ID;
  const podcastIsRecent = podcastCategoryId === RECENT_FILTER_ID;

  const audiobookFilterCategories = useMemo(
    () => [{ id: RECENT_FILTER_ID, label: 'Recientes' }, ...bookCategories],
    [bookCategories],
  );
  const podcastFilterCategories = useMemo(
    () => [{ id: RECENT_FILTER_ID, label: 'Recientes' }, ...podcastCategories],
    [podcastCategories],
  );

  const audiobooksQuery = useQuery({
    queryKey: ['audiobooks', audiobookCategoryId],
    queryFn: async () =>
      (
        await libraryApi.getBooks({
          isAudiobook: true,
          categoryId: audiobookCategoryId && !audiobookIsRecent ? audiobookCategoryId : undefined,
          limit: 50,
        })
      ).data.data as BookListItem[],
    enabled: !audiobookIsRecent,
  });

  const podcastsQuery = useQuery({
    queryKey: ['podcasts', podcastCategoryId],
    queryFn: async () =>
      (
        await streamingApi.getPodcastSeries({
          categoryId: podcastCategoryId && !podcastIsRecent ? podcastCategoryId : undefined,
        })
      ).data.data,
    enabled: !podcastIsRecent,
  });

  const radioQuery = useQuery({
    queryKey: ['radio'],
    queryFn: async () => (await streamingApi.getRadioStations()).data.data,
  });

  const isRefetching = podcastsQuery.isRefetching || radioQuery.isRefetching || audiobooksQuery.isRefetching;

  const onRefresh = () => {
    if (audiobookIsRecent) void refreshRecentAudiobooks();
    else audiobooksQuery.refetch();
    if (podcastIsRecent) void refreshRecentPodcasts();
    else podcastsQuery.refetch();
    radioQuery.refetch();
  };

  const stations = radioQuery.data ?? [];
  const podcasts = podcastIsRecent
    ? recentPodcasts.map(recentPodcastToSummary)
    : (podcastsQuery.data ?? []);
  const audiobooks = audiobookIsRecent
    ? recentAudiobooks.map(recentAudiobookToBook)
    : (audiobooksQuery.data ?? []);

  const handlePlaySeries = async (seriesId: string) => {
    const series = podcasts.find((p) => p.id === seriesId);
    const isSeriesActive = track?.kind === 'podcast' && track.subtitle === series?.title;

    if (isSeriesActive) {
      await toggle();
      return;
    }

    setLoadingSeriesId(seriesId);
    try {
      const result = await fetchFirstPlayableEpisode(seriesId);
      if (!result) {
        Alert.alert('Sin audio', 'Este podcast no tiene episodios disponibles para reproducir.');
        return;
      }
      const series = podcasts.find((p) => p.id === seriesId);
      if (series) void recordRecentPodcast(series);
      await play(result.track);
    } catch {
      Alert.alert('Error', 'No se pudo reproducir el podcast.');
    } finally {
      setLoadingSeriesId(null);
    }
  };

  const handlePlayAudiobook = async (book: BookListItem) => {
    const isActive = track?.kind === 'audiobook' && track.id === book.id;
    if (isActive) {
      await toggle();
      return;
    }
    const url = resolveApiMediaUrl(book.audioUrl);
    if (!url) {
      Alert.alert('Sin audio', 'Este audiolibro no tiene archivo de audio disponible.');
      return;
    }
    try {
      await play({
        id: book.id,
        title: book.title,
        subtitle: book.author?.name ?? 'Audiolibro',
        url,
        kind: 'audiobook',
      });
      void recordRecentAudiobook(book);
    } catch {
      Alert.alert('Error', 'No se pudo reproducir el audiolibro.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerChrome}>
        <ScreenHeader
          topInset={topInset}
          greeting="Escuchar"
          title="Audio y radio"
          rightAction={
            <HeaderSearchButton onPress={() => setSearchOpen(true)} accessibilityLabel="Buscar audio" />
          }
        />
      </View>

      <ContentSearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} scope="audios" />

      <View style={styles.scrollArea}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Radio en vivo</Text>
          {radioQuery.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radioList}>
              {skeletonKeys(4).map((key) => (
                <RadioCardSkeleton key={key} />
              ))}
            </ScrollView>
          ) : stations.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No hay emisoras disponibles</Text>
          ) : (
            <FlatList
              horizontal
              data={stations}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.radioList}
              renderItem={({ item, index }) => (
                <RadioCard
                  name={item.name}
                  description={item.description}
                  isLive={item.isLive}
                  isActive={track?.id === item.id}
                  index={index}
                  onPress={() =>
                    play({
                      id: item.id,
                      title: item.name,
                      subtitle: 'Radio en vivo',
                      url: item.streamUrl,
                      kind: 'radio',
                    })
                  }
                />
              )}
            />
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Audiolibros
          </Text>
          <ContentFilterBar
            categories={audiobookFilterCategories}
            loading={bookFiltersLoading}
            activeTab="categories"
            onTabChange={() => {}}
            selectedCategoryId={audiobookCategoryId}
            selectedCollectionId={null}
            onCategoryChange={setAudiobookCategoryId}
            onCollectionChange={() => {}}
          />
          {audiobookIsRecent || !audiobooksQuery.isLoading ? (
            audiobooks.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {audiobookIsRecent
                  ? 'Aún no has escuchado audiolibros. Reproduce uno para que aparezca aquí.'
                  : audiobookCategoryId
                    ? 'No hay audiolibros en esta categoría'
                    : 'No hay audiolibros disponibles'}
              </Text>
            ) : (
              audiobooks.map((item, index) => (
                <PodcastCard
                  key={item.id}
                  title={item.title}
                  description={item.summary}
                  authorName={item.author?.name}
                  coverUrl={item.coverUrl}
                  index={index}
                  isActive={track?.kind === 'audiobook' && track.id === item.id}
                  isPlaying={track?.kind === 'audiobook' && track.id === item.id && isPlaying}
                  onPress={() => router.push(`/book/${item.id}`)}
                  onPlay={() => handlePlayAudiobook(item)}
                />
              ))
            )
          ) : (
            skeletonKeys(3).map((key) => <PodcastCardSkeleton key={key} />)
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
            Podcasts
          </Text>
          <ContentFilterBar
            categories={podcastFilterCategories}
            loading={podcastFiltersLoading}
            activeTab="categories"
            onTabChange={() => {}}
            selectedCategoryId={podcastCategoryId}
            selectedCollectionId={null}
            onCategoryChange={setPodcastCategoryId}
            onCollectionChange={() => {}}
          />
          {podcastIsRecent || !podcastsQuery.isLoading ? (
            podcasts.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {podcastIsRecent
                  ? 'Aún no has escuchado podcasts. Abre o reproduce uno para que aparezca aquí.'
                  : podcastCategoryId
                    ? 'No hay podcasts en esta categoría'
                    : 'No hay podcasts disponibles'}
              </Text>
            ) : (
              podcasts.map((item, index) => (
                <PodcastCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  authorName={item.author?.name}
                  episodeCount={item.episodeCount}
                  coverUrl={item.coverUrl}
                  index={index}
                  isActive={track?.kind === 'podcast' && track.subtitle === item.title}
                  isPlaying={track?.kind === 'podcast' && track.subtitle === item.title && isPlaying}
                  isPlayLoading={loadingSeriesId === item.id}
                  onPress={() => router.push(`/podcast/${item.id}`)}
                  onPlay={() => handlePlaySeries(item.id)}
                />
              ))
            )
          ) : (
            skeletonKeys(3).map((key) => <PodcastCardSkeleton key={key} />)
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerChrome: { zIndex: 10, paddingBottom: spacing.xs },
  scrollArea: { flex: 1 },
  scroll: { paddingHorizontal: SCREEN_PADDING_X },
  sectionTitle: { ...typography.title, fontSize: 18, marginBottom: spacing.md },
  radioList: { paddingBottom: spacing.sm },
  loading: { marginBottom: spacing.md },
  empty: { marginBottom: spacing.lg, fontSize: 14 },
});
