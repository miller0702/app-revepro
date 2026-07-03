import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  type ViewToken,
} from 'react-native';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { HeaderSearchButton } from '../../../src/components/navigation/HeaderSearchButton';
import { FeedPostCard } from '../../../src/components/community/FeedPostCard';
import { FeedComposer } from '../../../src/components/community/FeedComposer';
import { AnnouncementBanner } from '../../../src/components/community/AnnouncementBanner';
import { useAnnouncementNotice } from '../../../src/hooks/useAnnouncementNotice';
import { FeedEndFooter } from '../../../src/components/community/FeedEndFooter';
import { FeedSearchOverlay } from '../../../src/components/community/ContentSearchOverlay';
import { CreatePostSheet, type PostDraft } from '../../../src/components/community/CreatePostSheet';
import { PostCommentsSheet } from '../../../src/components/community/PostCommentsSheet';
import { AppIcon } from '../../../src/components/ui/AppIcon';
import { type CommunityPost } from '../../../src/api/community';
import { useCommunityFeed } from '../../../src/hooks/useCommunityFeed';
import { FEED_PREFETCH_AHEAD, FLAT_LIST_PERF } from '../../../src/config/socialFeed';
import { useAppSection } from '../../../src/hooks/useAppSections';
import { getConfig } from '../../../src/config/environments';
import { FeedComposerSkeleton, FeedPostSkeleton, skeletonKeys } from '../../../src/components/skeletons/ContentSkeletons';
import { useTheme } from '../../../src/hooks/useTheme';
import { useScreenTopInset, useTabContentBottomPadding } from '../../../src/hooks/useSafeAreaLayout';
import { spacing } from '../../../src/theme/tokens';

export default function FeedScreen() {
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const listBottomPadding = useTabContentBottomPadding();
  const section = useAppSection('feed');
  const { appName } = getConfig();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<PostDraft | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const listRef = useRef<FlatList<CommunityPost | string>>(null);
  const endReachedReady = useRef(false);
  const loadMoreLock = useRef(false);

  useScrollToTop(listRef);

  useFocusEffect(
    useCallback(() => {
      endReachedReady.current = false;
      const timer = setTimeout(() => {
        endReachedReady.current = true;
      }, 400);
      return () => clearTimeout(timer);
    }, []),
  );

  const greeting = section?.headerGreeting ?? 'Comunidad';
  const headerTitle = section?.headerTitle ?? appName;
  const emptyMessage = section?.emptyMessage ?? 'Aún no hay publicaciones';
  const composerPlaceholder = '¿Qué quieres recomendar?';

  const { tag } = useLocalSearchParams<{ tag?: string }>();
  const activeTag = typeof tag === 'string' && tag.length > 0 ? tag : undefined;
  const { latest: latestAnnouncement, isUnread, markSeen } = useAnnouncementNotice();
  const {
    posts,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityFeed(activeTag);

  useEffect(() => {
    if (isLoading) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [isLoading, activeTag]);

  const requestNextPage = useCallback(() => {
    if (!endReachedReady.current || loadMoreLock.current) return;
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    loadMoreLock.current = true;
    void fetchNextPage().finally(() => {
      loadMoreLock.current = false;
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  const requestNextPageRef = useRef(requestNextPage);
  requestNextPageRef.current = requestNextPage;

  const postsLengthRef = useRef(posts.length);
  postsLengthRef.current = isLoading ? 0 : posts.length;

  const handleEndReached = useCallback(() => {
    requestNextPageRef.current();
  }, []);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;
      const maxIndex = viewableItems.reduce(
        (max, token) => Math.max(max, token.index ?? -1),
        -1,
      );
      if (maxIndex < 0) return;
      if (maxIndex >= postsLengthRef.current - FEED_PREFETCH_AHEAD) {
        requestNextPageRef.current();
      }
    },
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerChrome}>
        <ScreenHeader
          topInset={topInset}
          greeting={greeting}
          title={headerTitle}
          rightAction={<HeaderSearchButton onPress={() => setSearchOpen(true)} />}
        />
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={isLoading ? skeletonKeys() : posts}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        contentContainerStyle={{ paddingBottom: listBottomPadding }}
        {...FLAT_LIST_PERF}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
        onMomentumScrollBegin={() => {
          endReachedReady.current = true;
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          isLoading ? (
            <FeedComposerSkeleton />
          ) : (
            <>
              {isUnread && latestAnnouncement && !activeTag ? (
                <AnnouncementBanner
                  body={latestAnnouncement.body}
                  onDismiss={() => void markSeen()}
                />
              ) : null}
              {activeTag ? (
                <View style={[styles.tagBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                  <Text style={[styles.tagBannerText, { color: colors.text }]}>
                    #{activeTag}
                  </Text>
                </View>
              ) : null}
              <FeedComposer onPress={() => setCreateOpen(true)} placeholder={composerPlaceholder} />
            </>
          )
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <AppIcon name="feed" size={48} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyMessage}</Text>
              <Pressable onPress={() => setCreateOpen(true)}>
                <Text style={[styles.emptyCta, { color: colors.primary }]}>Crear recomendación</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListFooterComponent={
          !isLoading && posts.length > 0 ? (
            <FeedEndFooter
              hasMore={hasNextPage}
              loadingMore={isFetchingNextPage}
              onReload={refetch}
              loadingReload={isRefetching}
            />
          ) : null
        }
        renderItem={({ item }) =>
          isLoading ? (
            <FeedPostSkeleton />
          ) : (
            <FeedPostCard
              post={item}
              onOpenComments={setCommentsPost}
              onLightboxOpen={() => {
                setCommentsPost(null);
                setLightboxOpen(true);
              }}
              onLightboxClose={() => setLightboxOpen(false)}
              onShareAsPost={(draft) => {
                setCreateDraft(draft);
                setCreateOpen(true);
              }}
              variant="feed"
            />
          )
        }
      />

      <FeedSearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} />
      <CreatePostSheet
        visible={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDraft(null);
        }}
        initialDraft={createDraft}
      />
      {!lightboxOpen ? (
        <PostCommentsSheet post={commentsPost} onClose={() => setCommentsPost(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerChrome: { zIndex: 10 },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2, gap: spacing.md, paddingHorizontal: spacing.lg },
  emptyTitle: { textAlign: 'center', fontSize: 16, maxWidth: 280 },
  emptyCta: { fontWeight: '700', fontSize: 15 },
  tagBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tagBannerText: { fontSize: 15, fontWeight: '700' },
});
