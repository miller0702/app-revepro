import { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { libraryApi } from '../../src/api/library';
import { BibleBookCard } from '../../src/components/bible/BibleBookCard';
import { BibleTestamentTabs, type BibleTestamentTab } from '../../src/components/bible/BibleTestamentTabs';
import { BookCardSkeleton, skeletonKeys } from '../../src/components/skeletons/ContentSkeletons';
import { DrawerBackButton } from '../../src/components/navigation/DrawerBackButton';
import { useBookFilters } from '../../src/hooks/useContentFilters';
import { useReadingStatuses } from '../../src/hooks/useReadingStatuses';
import { useTheme } from '../../src/hooks/useTheme';
import { useScreenTopInset, useTabContentBottomPadding } from '../../src/hooks/useSafeAreaLayout';
import { BIBLE_COLLECTION_SLUG, OLD_TESTAMENT_MAX_ORDER } from '../../src/config/library';
import { SCREEN_PADDING_X } from '../../src/theme/layout';
import { spacing, typography } from '../../src/theme/tokens';


function parseAbbrev(summary?: string | null): string | null {
  if (!summary) return null;
  const parts = summary.split(' · ');
  return parts.length > 1 ? (parts.at(-1)?.trim() ?? null) : null;
}

export default function BibliaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const bottomPadding = useTabContentBottomPadding();
  const { rawCollections } = useBookFilters();
  const [activeTab, setActiveTab] = useState<BibleTestamentTab>('old');

  const bibleCollection = rawCollections.find((c) => c.slug === BIBLE_COLLECTION_SLUG);

  const collectionQuery = useQuery({
    queryKey: ['collection', bibleCollection?.id],
    queryFn: async () => {
      const id = bibleCollection?.id;
      if (!id) throw new Error('Colección Biblia no encontrada');
      return (await libraryApi.getCollection(id)).data.data;
    },
    enabled: Boolean(bibleCollection?.id),
  });

  const { oldTestament, newTestament } = useMemo(() => {
    const rows = collectionQuery.data?.books ?? [];
    return {
      oldTestament: rows.filter((r) => r.sortOrder <= OLD_TESTAMENT_MAX_ORDER),
      newTestament: rows.filter((r) => r.sortOrder > OLD_TESTAMENT_MAX_ORDER),
    };
  }, [collectionQuery.data]);

  const activeBooks = activeTab === 'old' ? oldTestament : newTestament;
  const bibleBookIds = useMemo(
    () => (collectionQuery.data?.books ?? []).map((row) => row.book.id),
    [collectionQuery.data],
  );
  const { statuses, refetch: refetchStatuses } = useReadingStatuses(bibleBookIds);
  const isLoading = collectionQuery.isLoading;
  const totalBooks = collectionQuery.data?.books.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + spacing.sm, borderColor: colors.border }]}>
        <DrawerBackButton />
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Santa Biblia</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Reina Valera 1960 · {totalBooks || 66} libros
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <BibleTestamentTabs
          active={activeTab}
          oldCount={oldTestament.length}
          newCount={newTestament.length}
          onChange={setActiveTab}
        />
      </View>

      <FlatList
        data={isLoading ? skeletonKeys() : activeBooks}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.book.id)}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={collectionQuery.isRefetching}
            onRefresh={() => {
              void collectionQuery.refetch();
              void refetchStatuses();
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          isLoading || typeof item === 'string' ? (
            <BookCardSkeleton />
          ) : (
            <BibleBookCard
              title={item.book.title}
              abbrev={parseAbbrev(item.book.summary)}
              sortOrder={item.sortOrder}
              testament={activeTab}
              readingStatus={statuses[item.book.id]}
              onPress={() => router.push(`/book/${item.book.id}`)}
            />
          )
        }
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {totalBooks === 0
                ? 'La Biblia aún no está disponible. Ejecuta `pnpm seed:bible` en la API.'
                : 'No hay libros en este testamento.'}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCopy: { flex: 1 },
  title: { ...typography.title, fontSize: 24 },
  sub: { fontSize: 13, marginTop: 2 },
  tabsWrap: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.xs,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: 15,
    lineHeight: 22,
  },
});
