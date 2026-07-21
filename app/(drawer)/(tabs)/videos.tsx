import { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, type ViewToken } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { streamingApi, type VideoItem } from '../../../src/api/streaming';
import { VideoFeedItem } from '../../../src/components/VideoFeedItem';
import { AppIcon } from '../../../src/components/ui/AppIcon';
import { ContentFilterBar } from '../../../src/components/ui/ContentFilterBar';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { HeaderSearchButton } from '../../../src/components/navigation/HeaderSearchButton';
import { ContentSearchOverlay } from '../../../src/components/community/ContentSearchOverlay';
import { useCategoryFilters } from '../../../src/hooks/useContentFilters';
import { useRecentVideos } from '../../../src/hooks/useRecentContent';
import {
  RECENT_FILTER_ID,
  recentVideoToItem,
} from '../../../src/storage/recentContent';
import { useTheme } from '../../../src/hooks/useTheme';
import { useScreenTopInset, useTabContentBottomPadding } from '../../../src/hooks/useSafeAreaLayout';
import { useTabBarScrollHandler } from '../../../src/hooks/useTabBarScrollHandler';
import { VideoFeedSkeleton, skeletonKeys } from '../../../src/components/skeletons/ContentSkeletons';
import { SCREEN_PADDING_X } from '../../../src/theme/layout';
import { spacing } from '../../../src/theme/tokens';

function canPlayInline(video: VideoItem): boolean {
  return (
    (video.sourceType === 'YOUTUBE' && Boolean(video.youtubeVideoId)) || Boolean(video.videoUrl)
  );
}

export default function VideosScreen() {
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const listBottomPadding = useTabContentBottomPadding();
  const onTabBarScroll = useTabBarScrollHandler();
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  /** Sonido solo tras gesto del usuario (autoplay del feed va en mute). */
  const [unmutedId, setUnmutedId] = useState<string | null>(null);
  const { categories, isLoading: filtersLoading } = useCategoryFilters('VIDEO');
  const { items: recentVideos, refresh: refreshRecent } = useRecentVideos();
  const isRecent = categoryId === RECENT_FILTER_ID;

  const filterCategories = useMemo(
    () => [{ id: RECENT_FILTER_ID, label: 'Recientes' }, ...categories],
    [categories],
  );

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['videos', categoryId],
    queryFn: async () =>
      (
        await streamingApi.getVideos({
          categoryId: categoryId && !isRecent ? categoryId : undefined,
        })
      ).data.data,
    enabled: !isRecent,
  });

  const videos = isRecent ? recentVideos.map(recentVideoToItem) : (data ?? []);
  const listLoading = isRecent ? false : isLoading;

  const stopPlayback = useCallback(() => {
    setPlayingId(null);
    setUnmutedId(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => stopPlayback();
    }, [stopPlayback]),
  );

  const handleTogglePlay = useCallback((videoId: string) => {
    setPlayingId(videoId);
    setUnmutedId(videoId);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const playable = viewableItems.filter(
        (token): token is ViewToken & { item: VideoItem } =>
          Boolean(token.isViewable) &&
          typeof token.item !== 'string' &&
          token.item != null &&
          canPlayInline(token.item as VideoItem),
      );

      if (playable.length === 0) {
        setPlayingId(null);
        return;
      }

      // El del medio entre visibles suele ser el más centrado en pantalla.
      const chosen = playable[Math.floor((playable.length - 1) / 2)]!.item;
      setPlayingId((current) => (current === chosen.id ? current : chosen.id));
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 120,
  }).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerChrome}>
        <ScreenHeader
          topInset={topInset}
          greeting="Ver"
          title="Videos"
          rightAction={
            <HeaderSearchButton onPress={() => setSearchOpen(true)} accessibilityLabel="Buscar videos" />
          }
        />
      </View>

      <ContentSearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} scope="videos" />

      <View style={styles.listArea}>
        <FlatList
          data={listLoading ? skeletonKeys() : videos}
          keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
          contentContainerStyle={{ paddingBottom: listBottomPadding }}
          onScroll={onTabBarScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListHeaderComponent={
            <ContentFilterBar
              categories={filterCategories}
              loading={filtersLoading}
              activeTab="categories"
              onTabChange={() => {}}
              selectedCategoryId={categoryId}
              selectedCollectionId={null}
              onCategoryChange={(id) => {
                stopPlayback();
                setCategoryId(id);
              }}
              onCollectionChange={() => {}}
              topSpacing={spacing.lg}
              contentInsetHorizontal={SCREEN_PADDING_X}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                stopPlayback();
                if (isRecent) void refreshRecent();
                else void refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) =>
            listLoading ? (
              <VideoFeedSkeleton />
            ) : (
              <VideoFeedItem
                video={item}
                playing={playingId === item.id}
                muted={unmutedId !== item.id}
                onTogglePlay={handleTogglePlay}
              />
            )
          }
          ListEmptyComponent={
            !listLoading ? (
              <View style={styles.empty}>
                <AppIcon name="empty-video" size={52} color={colors.primary} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isError
                    ? 'No se pudieron cargar los videos. Desliza para reintentar.'
                    : isRecent
                      ? 'Aún no has visto videos. Abre uno para que aparezca aquí.'
                      : categoryId
                        ? 'No hay videos en esta categoría'
                        : 'No hay videos disponibles'}
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerChrome: { zIndex: 10, paddingBottom: spacing.xs },
  listArea: { flex: 1 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyIcon: { marginBottom: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
