import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BookCard } from '../../../src/components/BookCard';
import { BibliaHubCard } from '../../../src/components/BibliaHubCard';
import { DailyGoalsCard } from '../../../src/components/goals/DailyGoalsCard';
import { BookCardSkeleton, skeletonKeys } from '../../../src/components/skeletons/ContentSkeletons';
import { ContentFilterBar, type ContentFilterTab } from '../../../src/components/ui/ContentFilterBar';
import { ListFooterLoader } from '../../../src/components/ui/ListFooterLoader';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { HeaderSearchButton } from '../../../src/components/navigation/HeaderSearchButton';
import { ContentSearchOverlay } from '../../../src/components/community/ContentSearchOverlay';
import { useAppSection } from '../../../src/hooks/useAppSections';
import { useBookFilters } from '../../../src/hooks/useContentFilters';
import { useInfiniteBooks } from '../../../src/hooks/useInfiniteBooks';
import { useReadingNowBooks } from '../../../src/hooks/useReadingNowBooks';
import { useReadingStatuses } from '../../../src/hooks/useReadingStatuses';
import { AppIcon, type AppIconName } from '../../../src/components/ui/AppIcon';
import { useTheme } from '../../../src/hooks/useTheme';
import { useScreenTopInset, useTabContentBottomPadding } from '../../../src/hooks/useSafeAreaLayout';
import { useTabBarScrollHandler } from '../../../src/hooks/useTabBarScrollHandler';
import { SCREEN_PADDING_X } from '../../../src/theme/layout';
import { syncWithServer } from '../../../src/offline/syncService';
import { getConfig } from '../../../src/config/environments';
import { BIBLE_CATEGORY_SLUG, BIBLE_COLLECTION_SLUG } from '../../../src/config/library';
import { spacing } from '../../../src/theme/tokens';

export default function LibraryScreen() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<ContentFilterTab>('categories');
  const [tabInitialized, setTabInitialized] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const listBottomPadding = useTabContentBottomPadding();
  const onTabBarScroll = useTabBarScrollHandler();
  const { appTagline } = getConfig();
  const section = useAppSection('library');
  const { categories, collections, isLoading: filtersLoading, rawCategories, rawCollections } =
    useBookFilters();

  const readingNowQuery = useReadingNowBooks();
  const readingNowBooks = readingNowQuery.data ?? [];
  const readingCount = readingNowBooks.length;

  useEffect(() => {
    if (tabInitialized || readingNowQuery.isFetching) return;
    if (readingCount > 0) {
      setFilterTab('reading');
    }
    setTabInitialized(true);
  }, [readingCount, readingNowQuery.isFetching, tabInitialized]);

  const bibleCollection = rawCollections.find((c) => c.slug === BIBLE_COLLECTION_SLUG);

  const libraryCategories = useMemo(
    () =>
      categories.filter((c) => {
        const raw = rawCategories.find((r) => r.id === c.id);
        return raw?.slug !== BIBLE_CATEGORY_SLUG;
      }),
    [categories, rawCategories],
  );

  const libraryCollections = useMemo(
    () =>
      collections.filter((c) => {
        const raw = rawCollections.find((r) => r.id === c.id);
        return raw?.slug !== BIBLE_COLLECTION_SLUG;
      }),
    [collections, rawCollections],
  );

  const greeting = section?.headerGreeting ?? 'Tu biblioteca';
  const headerTitle = section?.headerTitle ?? 'Libros';
  const tagline = section?.subtitle ?? appTagline;
  const searchPlaceholder = section?.searchPlaceholder ?? 'Buscar libros, autores...';
  const emptyMessage = section?.emptyMessage ?? 'No hay libros disponibles';
  const emptyIcon = (section?.emptyIcon ?? 'empty-library') as AppIconName;

  const isReadingTab = filterTab === 'reading';
  const activeCategoryId = filterTab === 'categories' ? categoryId ?? undefined : undefined;
  const activeCollectionId = filterTab === 'collections' ? collectionId ?? undefined : undefined;
  const showBibleHub = !isReadingTab && !activeCategoryId && !activeCollectionId && Boolean(bibleCollection);

  const {
    books,
    total,
    isLoading: catalogLoading,
    isRefetching: catalogRefetching,
    refetch: refetchCatalog,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBooks(
    {
      categoryId: activeCategoryId,
      collectionId: activeCollectionId,
      excludeCategorySlug: !activeCategoryId && !activeCollectionId ? BIBLE_CATEGORY_SLUG : undefined,
    },
    !isReadingTab,
  );

  const catalogBookIds = useMemo(() => books.map((b) => b.id), [books]);
  const readingTabStatuses = useMemo(() => {
    const map: Record<string, (typeof readingNowBooks)[number]['status']> = {};
    for (const item of readingNowBooks) {
      map[item.book.id] = item.status;
    }
    return map;
  }, [readingNowBooks]);

  const { statuses: catalogStatuses, refetch: refetchStatuses } = useReadingStatuses(
    catalogBookIds,
    !isReadingTab,
  );
  const statuses = isReadingTab ? readingTabStatuses : catalogStatuses;

  const listData = isReadingTab ? readingNowBooks.map((r) => r.book) : books;
  const isLoading = isReadingTab
    ? readingNowQuery.isPending && readingNowBooks.length === 0
    : catalogLoading && books.length === 0;
  const isRefetching = isReadingTab ? readingNowQuery.isRefetching : catalogRefetching;

  const onRefresh = async () => {
    void syncWithServer().catch(() => {
      /* offline */
    });
    if (isReadingTab) {
      await readingNowQuery.refetch();
    } else {
      await refetchCatalog();
    }
    void refetchStatuses();
  };

  const handleCollectionChange = (id: string | null) => {
    if (id) {
      const raw = rawCollections.find((c) => c.id === id);
      if (raw?.slug === BIBLE_COLLECTION_SLUG) {
        router.push('/bible');
        return;
      }
    }
    setCollectionId(id);
  };

  const handleTabChange = (tab: ContentFilterTab) => {
    setFilterTab(tab);
    if (tab === 'reading') {
      setCategoryId(null);
      setCollectionId(null);
    } else if (tab === 'categories') {
      setCollectionId(null);
    } else {
      setCategoryId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.chrome}>
        <ScreenHeader
          topInset={topInset}
          greeting={greeting}
          title={headerTitle}
          subtitle={tagline || undefined}
          rightAction={
            <HeaderSearchButton
              onPress={() => setSearchOpen(true)}
              accessibilityLabel={searchPlaceholder}
            />
          }
          footer={
            <View style={styles.headerFooter}>
              <ContentFilterBar
                categories={libraryCategories}
                collections={libraryCollections}
                showCollections={libraryCollections.length > 0}
                showReadingTab
                readingCount={readingCount}
                loading={filtersLoading}
                activeTab={filterTab}
                onTabChange={handleTabChange}
                selectedCategoryId={categoryId}
                selectedCollectionId={collectionId}
                onCategoryChange={setCategoryId}
                onCollectionChange={handleCollectionChange}
              />
            </View>
          }
        />
      </View>
      <ContentSearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} scope="books" />
      <View style={styles.listArea}>
        <FlatList
          data={isLoading ? skeletonKeys() : listData}
          keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}
          onScroll={onTabBarScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={() => {
            if (!isReadingTab && hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            isReadingTab && !isLoading ? (
              <DailyGoalsCard />
            ) : showBibleHub ? (
              <BibliaHubCard
                bookCount={bibleCollection?.bookCount}
                onPress={() => router.push('/bible')}
              />
            ) : null
          }
          ListFooterComponent={
            !isReadingTab ? (
              <>
                <ListFooterLoader loading={isFetchingNextPage} hasMore={Boolean(hasNextPage)} />
                {!isLoading && total > 0 ? (
                  <Text style={[styles.countFooter, { color: colors.textSecondary }]}>
                    {books.length} de {total} libros
                  </Text>
                ) : null}
              </>
            ) : null
          }
          renderItem={({ item, index }) =>
            isLoading || typeof item === 'string' ? (
              <BookCardSkeleton />
            ) : (
              <BookCard
                title={item.title}
                summary={item.summary}
                authorName={item.author?.name}
                index={index}
                readingStatus={statuses[item.id]}
                onPress={() => router.push(`/book/${item.id}`)}
              />
            )
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <AppIcon name={emptyIcon} size={52} color={colors.primary} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isReadingTab
                    ? 'No tienes libros en curso. Abre uno y continúa donde lo dejaste.'
                    : activeCategoryId || activeCollectionId
                      ? 'No hay libros en este filtro'
                      : emptyMessage}
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
  chrome: { zIndex: 10, paddingBottom: spacing.xs },
  headerFooter: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  listArea: { flex: 1, position: 'relative' },
  list: { paddingHorizontal: SCREEN_PADDING_X },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { marginBottom: 12 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  countFooter: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: spacing.md,
  },
});
