import { useMemo, useState, type ReactNode } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  libraryApi,
  type FavoriteBookItem,
  type FavoritePodcastItem,
  type FavoritePostItem,
  type FavoriteVideoItem,
} from '../../../src/api/library';
import { BookCard } from '../../../src/components/BookCard';
import { PodcastCard } from '../../../src/components/PodcastCard';
import { VideoCard } from '../../../src/components/VideoCard';
import { AppIcon, type AppIconName } from '../../../src/components/ui/AppIcon';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { HeaderSearchButton } from '../../../src/components/navigation/HeaderSearchButton';
import { ContentSearchOverlay } from '../../../src/components/community/ContentSearchOverlay';
import { useAppSection } from '../../../src/hooks/useAppSections';
import { useTheme } from '../../../src/hooks/useTheme';
import { useScreenTopInset, useTabContentBottomPadding } from '../../../src/hooks/useSafeAreaLayout';
import { useTabBarScrollHandler } from '../../../src/hooks/useTabBarScrollHandler';
import { SCREEN_PADDING_X } from '../../../src/theme/layout';
import { typography, spacing, radius } from '../../../src/theme/tokens';
import { FavoritesSkeleton } from '../../../src/components/skeletons/ContentSkeletons';
import { AuthenticatedImage } from '../../../src/components/ui/AuthenticatedImage';
import {
  favoritePostHasPreview,
  getFavoritePostPreviewUrl,
} from '../../../src/utils/favoritePostPreview';

type SectionKey = 'books' | 'audiobooks' | 'podcasts' | 'videos' | 'posts';
type FavoritesTab = 'all' | SectionKey;

const TAB_CONFIG: { id: FavoritesTab; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'books', label: 'Libros' },
  { id: 'audiobooks', label: 'Audiolibros' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'videos', label: 'Videos' },
  { id: 'posts', label: 'Publicaciones' },
];

const EMPTY_TAB_MESSAGES: Record<FavoritesTab, string> = {
  all: 'Aún no tienes favoritos',
  books: 'No tienes libros guardados',
  audiobooks: 'No tienes audiolibros guardados',
  podcasts: 'No tienes podcasts guardados',
  videos: 'No tienes videos guardados',
  posts: 'No tienes publicaciones guardadas',
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const listBottomPadding = useTabContentBottomPadding();
  const onTabBarScroll = useTabBarScrollHandler();
  const section = useAppSection('favorites');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FavoritesTab>('all');

  const greeting = section?.headerGreeting ?? 'Guardados';
  const headerTitle = section?.headerTitle ?? 'Tus favoritos';
  const emptyIcon = (section?.emptyIcon ?? 'empty-favorites') as AppIconName;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await libraryApi.getFavorites()).data.data,
  });

  const grouped = data ?? { books: [], audiobooks: [], podcasts: [], videos: [], posts: [] };

  const counts = useMemo(
    () => ({
      all:
        grouped.books.length +
        grouped.audiobooks.length +
        grouped.podcasts.length +
        grouped.videos.length +
        grouped.posts.length,
      books: grouped.books.length,
      audiobooks: grouped.audiobooks.length,
      podcasts: grouped.podcasts.length,
      videos: grouped.videos.length,
      posts: grouped.posts.length,
    }),
    [grouped],
  );

  const visibleTabs = useMemo(
    () => TAB_CONFIG.filter((tab) => tab.id === 'all' || counts[tab.id] > 0),
    [counts],
  );

  const renderBooks = (items: FavoriteBookItem[]) =>
    items.map((fav, index) => (
      <BookCard
        key={fav.id}
        title={fav.item.title}
        summary={fav.item.summary}
        authorName={fav.item.author?.name}
        index={index}
        onPress={() => router.push(`/book/${fav.item.id}`)}
      />
    ));

  const renderPodcasts = (items: FavoritePodcastItem[]) =>
    items.map((fav, index) => (
      <PodcastCard
        key={fav.id}
        title={fav.item.title}
        description={fav.item.description}
        authorName={fav.item.authorName ?? undefined}
        coverUrl={fav.item.coverUrl}
        episodeCount={fav.item.episodeCount}
        index={index}
        onPress={() => router.push(`/podcast/${fav.item.id}`)}
      />
    ));

  const renderVideos = (items: FavoriteVideoItem[]) =>
    items.map((fav, index) => (
      <VideoCard
        key={fav.id}
        title={fav.item.title}
        description={fav.item.description}
        durationSec={fav.item.durationSec}
        viewCount={fav.item.viewCount}
        categoryName={fav.item.categoryName ?? undefined}
        thumbnailUrl={fav.item.thumbnailUrl}
        index={index}
        onPress={() => router.push(`/video/${fav.item.id}`)}
      />
    ));

  const renderPosts = (items: FavoritePostItem[]) =>
    items.map((fav) => {
      const post = fav.item;
      const previewUrl = getFavoritePostPreviewUrl(post);
      const showPreview = favoritePostHasPreview(post);

      return (
        <Pressable
          key={fav.id}
          onPress={() => router.push(`/post/${post.id}`)}
          style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {showPreview ? (
            <AuthenticatedImage url={previewUrl} style={styles.postThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.postThumb, { backgroundColor: colors.primary }]}>
              <AppIcon name="feed" size={24} color="#fff" />
            </View>
          )}
          <View style={styles.postInfo}>
            <Text style={[styles.postAuthor, { color: colors.textSecondary }]}>
              @{post.author.username}
            </Text>
            <Text style={[styles.postBody, { color: colors.text }]} numberOfLines={3}>
              {post.quoteExcerpt || post.body}
            </Text>
          </View>
        </Pressable>
      );
    });

  const renderSection = (key: SectionKey, showTitle: boolean) => {
    const items = grouped[key];
    if (!items.length) return null;

    let content: ReactNode = null;
    if (key === 'books' || key === 'audiobooks') {
      content = renderBooks(items as FavoriteBookItem[]);
    } else if (key === 'podcasts') {
      content = renderPodcasts(items as FavoritePodcastItem[]);
    } else if (key === 'videos') {
      content = renderVideos(items as FavoriteVideoItem[]);
    } else if (key === 'posts') {
      content = renderPosts(items as FavoritePostItem[]);
    }

    return (
      <View key={key} style={showTitle ? styles.section : undefined}>
        {showTitle ? (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {TAB_CONFIG.find((t) => t.id === key)?.label}
          </Text>
        ) : null}
        {content}
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'all') {
      const sections = (['books', 'audiobooks', 'podcasts', 'videos', 'posts'] as SectionKey[])
        .map((key) => renderSection(key, true))
        .filter(Boolean);
      return sections.length ? sections : null;
    }

    const items = grouped[activeTab];
    if (!items.length) {
      return (
        <View style={styles.empty}>
          <AppIcon name={emptyIcon} size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{EMPTY_TAB_MESSAGES[activeTab]}</Text>
        </View>
      );
    }

    return renderSection(activeTab, false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerChrome}>
        <ScreenHeader
          topInset={topInset}
          greeting={greeting}
          title={headerTitle}
          rightAction={
            <HeaderSearchButton onPress={() => setSearchOpen(true)} accessibilityLabel="Buscar favoritos" />
          }
          footer={
            !isLoading && counts.all > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsRow}
                style={styles.tabsScroll}
              >
                {visibleTabs.map((tab) => {
                  const selected = activeTab === tab.id;
                  const count = counts[tab.id];
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setActiveTab(tab.id)}
                      style={({ pressed }) => [
                        styles.tab,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: selected ? colors.onPrimary : colors.text },
                        ]}
                      >
                        {tab.label}
                      </Text>
                      {tab.id !== 'all' ? (
                        <View
                          style={[
                            styles.tabBadge,
                            {
                              backgroundColor: selected ? colors.onPrimary + '33' : colors.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tabBadgeText,
                              { color: selected ? colors.onPrimary : colors.textSecondary },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null
          }
        />
      </View>

      <ContentSearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} scope="favorites" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: listBottomPadding }]}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <>
            <FavoritesSkeleton />
            <FavoritesSkeleton />
          </>
        ) : counts.all === 0 ? (
          <View style={styles.empty}>
            <AppIcon name={emptyIcon} size={48} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aún no tienes favoritos</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Guarda libros, audiolibros, podcasts, videos o publicaciones con el icono de corazón.
            </Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerChrome: { zIndex: 10 },
  tabsScroll: { marginTop: spacing.md },
  tabsRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tabText: { ...typography.caption, fontWeight: '700' },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
  scroll: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: spacing.sm },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.title, fontSize: 18, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyTitle: { ...typography.title, textAlign: 'center' },
  emptySub: { textAlign: 'center', fontSize: 15, lineHeight: 22, maxWidth: 300 },
  postCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  postThumb: { width: 56, height: 72, borderRadius: radius.sm, overflow: 'hidden' },
  postInfo: { flex: 1 },
  postAuthor: { fontSize: 12, marginBottom: 4 },
  postBody: { fontSize: 14, lineHeight: 20 },
});
