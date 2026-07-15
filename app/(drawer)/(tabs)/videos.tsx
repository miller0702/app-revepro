import { useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { streamingApi } from '../../../src/api/streaming';
import { VideoCard } from '../../../src/components/VideoCard';
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
import { SCREEN_PADDING_X } from '../../../src/theme/layout';
import { VideoCardSkeleton, skeletonKeys } from '../../../src/components/skeletons/ContentSkeletons';
import { spacing } from '../../../src/theme/tokens';

export default function VideosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const listBottomPadding = useTabContentBottomPadding();
  const onTabBarScroll = useTabBarScrollHandler();
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { categories, isLoading: filtersLoading } = useCategoryFilters('VIDEO');
  const { items: recentVideos, refresh: refreshRecent } = useRecentVideos();
  const isRecent = categoryId === RECENT_FILTER_ID;

  const filterCategories = useMemo(
    () => [{ id: RECENT_FILTER_ID, label: 'Recientes' }, ...categories],
    [categories],
  );

  const { data, isLoading, refetch, isRefetching } = useQuery({
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
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}
          onScroll={onTabBarScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <ContentFilterBar
              categories={filterCategories}
              loading={filtersLoading}
              activeTab="categories"
              onTabChange={() => {}}
              selectedCategoryId={categoryId}
              selectedCollectionId={null}
              onCategoryChange={setCategoryId}
              onCollectionChange={() => {}}
              topSpacing={spacing.lg}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                if (isRecent) void refreshRecent();
                else void refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) =>
            listLoading ? (
              <VideoCardSkeleton />
            ) : (
              <VideoCard
                title={item.title}
                description={item.description}
                durationSec={item.durationSec}
                viewCount={item.viewCount}
                categoryName={item.category?.name}
                thumbnailUrl={item.thumbnailUrl}
                index={index}
                onPress={() => router.push(`/video/${item.id}`)}
              />
            )
          }
          ListEmptyComponent={
            !listLoading ? (
              <View style={styles.empty}>
                <AppIcon name="empty-video" size={52} color={colors.primary} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isRecent
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
  list: { paddingHorizontal: SCREEN_PADDING_X },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { marginBottom: 12 },
  emptyText: { fontSize: 15 },
});
