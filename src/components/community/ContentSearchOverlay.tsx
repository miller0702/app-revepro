import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useModalTopInset } from '../../hooks/useSafeAreaLayout';
import { useOpenUserProfile } from '../../hooks/useOpenUserProfile';
import { AppIcon } from '../ui/AppIcon';
import { SearchResultsSkeleton } from '../skeletons/ContentSkeletons';
import { UserAvatar } from '../ui/UserAvatar';
import { libraryApi } from '../../api/library';
import {
  searchApi,
  type SearchScope,
  type SearchTab,
  type SearchAudio,
  type SearchBook,
  type SearchPerson,
  type SearchPost,
  type SearchVideo,
} from '../../api/search';
import { radius, spacing } from '../../theme/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ALL_TABS: Array<{ id: SearchTab; label: string }> = [
  { id: 'all', label: 'Todo' },
  { id: 'people', label: 'Personas' },
  { id: 'posts', label: 'Publicaciones' },
  { id: 'books', label: 'Libros' },
  { id: 'videos', label: 'Videos' },
  { id: 'audios', label: 'Audios' },
];

const FAVORITES_TABS = [
  { id: 'all', label: 'Todo' },
  { id: 'books', label: 'Libros' },
  { id: 'audiobooks', label: 'Audiolibros' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'videos', label: 'Videos' },
  { id: 'posts', label: 'Publicaciones' },
] as const;

type FavoritesTab = (typeof FAVORITES_TABS)[number]['id'];
export type ContentSearchScope = SearchScope | 'favorites';

const PLACEHOLDERS: Record<ContentSearchScope, string> = {
  all: 'Buscar en EGW...',
  books: 'Buscar libros, autores...',
  videos: 'Buscar videos...',
  audios: 'Buscar podcasts y audiolibros...',
  favorites: 'Buscar en tus favoritos...',
};

const TITLES: Record<ContentSearchScope, string> = {
  all: 'Buscar',
  books: 'Buscar libros',
  videos: 'Buscar videos',
  audios: 'Buscar audio',
  favorites: 'Buscar favoritos',
};

function matchesQuery(q: string, ...parts: Array<string | null | undefined>) {
  const needle = q.toLowerCase();
  return parts.some((part) => part?.toLowerCase().includes(needle));
}

interface ContentSearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  scope?: ContentSearchScope;
}

export function ContentSearchOverlay({ visible, onClose, scope = 'all' }: ContentSearchOverlayProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useModalTopInset();
  const router = useRouter();
  const openUserProfile = useOpenUserProfile();
  const slide = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab | FavoritesTab>('all');
  const inputRef = useRef<TextInput>(null);

  const debouncedQ = query.trim();
  const canSearch = debouncedQ.length >= 2;
  const isFavorites = scope === 'favorites';
  const apiScope: SearchScope = scope === 'favorites' ? 'all' : scope;

  const defaultTab = useMemo((): SearchTab | FavoritesTab => {
    if (scope === 'books') return 'books';
    if (scope === 'videos') return 'videos';
    if (scope === 'audios') return 'audios';
    return 'all';
  }, [scope]);

  const visibleTabs = useMemo(() => {
    if (isFavorites) return FAVORITES_TABS;
    if (scope === 'books') return [{ id: 'books' as const, label: 'Libros' }];
    if (scope === 'videos') return [{ id: 'videos' as const, label: 'Videos' }];
    if (scope === 'audios') return [{ id: 'audios' as const, label: 'Audios' }];
    return ALL_TABS;
  }, [isFavorites, scope]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : SCREEN_WIDTH,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      if (visible) {
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        setQuery('');
        setTab(defaultTab);
      }
    });
  }, [visible, slide, defaultTab]);

  useEffect(() => {
    if (visible) setTab(defaultTab);
  }, [visible, defaultTab]);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQ, apiScope],
    queryFn: async () => (await searchApi.search({ q: debouncedQ, tab: 'all', scope: apiScope })).data,
    enabled: visible && canSearch && !isFavorites,
  });

  const { data: favoritesData, isFetching: favoritesFetching } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await libraryApi.getFavorites()).data.data,
    enabled: visible && isFavorites,
  });

  const counts = data?.meta.counts;
  const results = data?.data;

  const favoritesItems = useMemo(() => {
    if (!isFavorites || !favoritesData || !canSearch) return [];
    const grouped = favoritesData;
    const q = debouncedQ;

    const rows: Array<{ kind: string; id: string; item: unknown }> = [];

    const pushIfMatch = (kind: string, id: string, item: unknown, ...parts: Array<string | null | undefined>) => {
      if (matchesQuery(q, ...parts)) rows.push({ kind, id, item });
    };

    grouped.books.forEach((fav) =>
      pushIfMatch('books', fav.id, fav, fav.item.title, fav.item.summary, fav.item.author?.name),
    );
    grouped.audiobooks.forEach((fav) =>
      pushIfMatch('audiobooks', fav.id, fav, fav.item.title, fav.item.summary, fav.item.author?.name),
    );
    grouped.podcasts.forEach((fav) =>
      pushIfMatch('podcasts', fav.id, fav, fav.item.title, fav.item.description, fav.item.authorName),
    );
    grouped.videos.forEach((fav) =>
      pushIfMatch('videos', fav.id, fav, fav.item.title, fav.item.description, fav.item.categoryName),
    );
    grouped.posts.forEach((fav) =>
      pushIfMatch('posts', fav.id, fav, fav.item.body, fav.item.quoteExcerpt, fav.item.author.username),
    );

    return rows;
  }, [isFavorites, favoritesData, canSearch, debouncedQ]);

  const favoritesCounts = useMemo(() => {
    const countsMap = {
      all: favoritesItems.length,
      books: favoritesItems.filter((r) => r.kind === 'books').length,
      audiobooks: favoritesItems.filter((r) => r.kind === 'audiobooks').length,
      podcasts: favoritesItems.filter((r) => r.kind === 'podcasts').length,
      videos: favoritesItems.filter((r) => r.kind === 'videos').length,
      posts: favoritesItems.filter((r) => r.kind === 'posts').length,
    };
    return countsMap;
  }, [favoritesItems]);

  const listItems = useMemo(() => {
    if (isFavorites) {
      if (tab === 'all') return favoritesItems;
      return favoritesItems.filter((row) => row.kind === tab);
    }
    if (!results) return [];
    if (tab === 'all') {
      return [
        ...results.people.map((p) => ({ kind: 'people' as const, id: p.id, item: p })),
        ...results.posts.map((p) => ({ kind: 'posts' as const, id: p.id, item: p })),
        ...results.books.map((b) => ({ kind: 'books' as const, id: b.id, item: b })),
        ...results.videos.map((v) => ({ kind: 'videos' as const, id: v.id, item: v })),
        ...results.audios.map((a) => ({ kind: 'audios' as const, id: a.id, item: a })),
      ];
    }
    return (results[tab as SearchTab] ?? []).map((item) => ({
      kind: tab,
      id: 'id' in item ? item.id : String(Math.random()),
      item,
    }));
  }, [isFavorites, favoritesItems, tab, results]);

  const totalCount = useMemo(() => {
    if (isFavorites) return favoritesCounts.all;
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, n) => sum + n, 0);
  }, [isFavorites, favoritesCounts, counts]);

  const loading = isFavorites ? favoritesFetching && !favoritesData : isFetching && !results;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: colors.background,
          transform: [{ translateX: slide }],
          paddingTop: topInset,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.backBtn}>
            <AppIcon name="back" size={24} color={colors.text} />
          </Pressable>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppIcon name="search" size={18} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder={PLACEHOLDERS[scope]}
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <AppIcon name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <Text style={[styles.scopeTitle, { color: colors.textSecondary }]}>{TITLES[scope]}</Text>

        {canSearch && visibleTabs.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabs}
          >
            {visibleTabs.map((t) => {
              const active = tab === t.id;
              const count = isFavorites
                ? favoritesCounts[t.id as FavoritesTab] ?? 0
                : t.id === 'all'
                  ? totalCount
                  : counts?.[t.id as keyof typeof counts] ?? 0;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                      opacity: count === 0 && t.id !== 'all' ? 0.55 : 1,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.tabText, { color: active ? colors.onPrimary : colors.text }]}
                  >
                    {t.label}
                    {count > 0 ? ` (${count})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.body}>
        {!canSearch ? (
          <View style={styles.hintWrap}>
            <AppIcon name="search" size={40} color={colors.primary} />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Escribe al menos 2 caracteres para buscar.
            </Text>
          </View>
        ) : loading ? (
          <SearchResultsSkeleton />
        ) : (
          <FlatList
            data={listItems}
            keyExtractor={(row) => `${row.kind}-${row.id}`}
            style={styles.list}
            contentContainerStyle={listItems.length === 0 ? styles.listEmpty : styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                Sin resultados para «{debouncedQ}»
              </Text>
            }
            renderItem={({ item: row }) => renderSearchRow(row, colors, onClose, router, openUserProfile)}
          />
        )}
      </View>
    </Animated.View>
  );
}

export function FeedSearchOverlay(props: Omit<ContentSearchOverlayProps, 'scope'>) {
  return <ContentSearchOverlay {...props} scope="all" />;
}

function renderSearchRow(
  row: { kind: string; id: string; item: unknown },
  colors: ReturnType<typeof useTheme>['colors'],
  onClose: () => void,
  router: ReturnType<typeof useRouter>,
  openUserProfile: (userId: string) => void,
) {
  if (row.kind === 'people') {
    const p = row.item as SearchPerson;
    return (
      <Pressable
        onPress={() => {
          onClose();
          openUserProfile(p.id);
        }}
        style={[styles.row, { borderBottomColor: colors.border }]}
        accessibilityRole="button"
      >
        <UserAvatar firstName={p.firstName} lastName={p.lastName} avatarUrl={p.avatarUrl} size={40} />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {p.firstName} {p.lastName}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>@{p.username}</Text>
        </View>
      </Pressable>
    );
  }

  if (row.kind === 'posts') {
    const raw = row.item as SearchPost | { item: { id: string; body: string; quoteExcerpt?: string | null; author: SearchPerson } };
    const post = 'item' in raw ? raw.item : raw;
    return (
      <Pressable
        onPress={() => {
          onClose();
          router.push(`/post/${post.id}`);
        }}
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <UserAvatar
          firstName={post.author.firstName}
          lastName={post.author.lastName}
          avatarUrl={post.author.avatarUrl}
          size={40}
        />
        <View style={styles.rowText}>
          <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>@{post.author.username}</Text>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
            {post.quoteExcerpt || post.body}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (row.kind === 'books' || row.kind === 'audiobooks') {
    const b = row.item as SearchBook | { item: { id: string; title: string; author?: { name: string } | null; authorName?: string | null } };
    const book = 'title' in b && 'id' in b && !('item' in b) ? b : (b as { item: { id: string; title: string; author?: { name: string }; authorName?: string } }).item;
    const authorName = 'authorName' in book ? book.authorName : book.author?.name;
    return (
      <Pressable
        onPress={() => {
          onClose();
          router.push(`/book/${book.id}`);
        }}
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.thumb, { backgroundColor: colors.primary }]}>
          <AppIcon name="library" size={20} color="#fff" />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{book.title}</Text>
          {authorName ? (
            <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>{authorName}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  if (row.kind === 'podcasts') {
    const fav = row.item as { item: { id: string; title: string; authorName?: string | null } };
    return (
      <Pressable
        onPress={() => {
          onClose();
          router.push(`/podcast/${fav.item.id}`);
        }}
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.thumb, { backgroundColor: colors.primaryDark }]}>
          <AppIcon name="audio" size={20} color="#fff" />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{fav.item.title}</Text>
          {fav.item.authorName ? (
            <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>{fav.item.authorName}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  if (row.kind === 'videos') {
    const v = row.item as SearchVideo | { item: { id: string; title: string; categoryName?: string | null } };
    const video = 'slug' in v && !('item' in v) ? v : (v as { item: { id: string; title: string; categoryName?: string } }).item;
    return (
      <Pressable
        onPress={() => {
          onClose();
          router.push(`/video/${video.id}`);
        }}
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.thumb, { backgroundColor: colors.accent }]}>
          <AppIcon name="video" size={20} color="#fff" />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{video.title}</Text>
          {'categoryName' in video && video.categoryName ? (
            <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>{video.categoryName}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  const a = row.item as SearchAudio;
  const route = a.kind === 'PODCAST' ? `/podcast/${a.id}` : `/book/${a.id}`;
  return (
    <Pressable
      onPress={() => {
        onClose();
        router.push(route);
      }}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.thumb, { backgroundColor: colors.primaryDark }]}>
        <AppIcon name="audio" size={20} color="#fff" />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{a.title}</Text>
        <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
          {a.kind === 'PODCAST' ? 'Podcast' : 'Audiolibro'}
          {a.subtitle ? ` · ${a.subtitle}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  topBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  scopeTitle: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 48,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  body: {
    flex: 1,
    minHeight: 0,
  },
  hintWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  hint: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  loader: { marginTop: spacing.xl },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  listEmpty: { flexGrow: 1, paddingBottom: spacing.xl },
  empty: { textAlign: 'center', padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 13, marginTop: 2 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
