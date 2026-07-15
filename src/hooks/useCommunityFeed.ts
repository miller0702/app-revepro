import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '../api/community';
import {
  buildFeedSeedMeta,
  communityFeedQueryKey,
  ensurePostReactionFields,
  mergeNewPostsIntoFeedCache,
  type FeedPage,
} from '../utils/communityFeedCache';
import {
  FEED_GC_MS,
  FEED_PAGE_SIZE,
  FEED_SINCE_POLL_MS,
  FEED_STALE_MS,
} from '../config/socialFeed';
import { loadFeedCache, mergeFeedPosts, saveFeedCache } from '../storage/feedCache';

async function fetchFeedPage(page: number, tag?: string): Promise<FeedPage> {
  const res = await communityApi.getPosts({ page, limit: FEED_PAGE_SIZE, tag });
  return {
    posts: res.data.data.map(ensurePostReactionFields),
    meta: res.data.meta,
  };
}

export function useCommunityFeed(tag?: string) {
  const queryClient = useQueryClient();
  const [cacheReady, setCacheReady] = useState(false);
  const isTaggedFeed = Boolean(tag);
  // Estabilizar la key: un array nuevo en cada render re-dispara el efecto de caché
  // y provoca "Maximum update depth exceeded".
  const queryKey = useMemo(() => communityFeedQueryKey(tag), [tag]);

  useEffect(() => {
    let mounted = true;

    if (isTaggedFeed) {
      setCacheReady(true);
      return () => {
        mounted = false;
      };
    }

    setCacheReady(false);
    loadFeedCache().then((cached) => {
      if (!mounted) return;
      if (cached?.length) {
        const existing = queryClient.getQueryData(queryKey);
        // No pisar datos frescos de red / mutaciones con caché de disco.
        if (!existing) {
          queryClient.setQueryData(queryKey, {
            pages: [
              {
                posts: cached,
                meta: buildFeedSeedMeta(cached.length, FEED_PAGE_SIZE),
              },
            ],
            pageParams: [1],
          });
        }
      }
      setCacheReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [queryClient, isTaggedFeed, queryKey]);

  const infiniteQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam, tag),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: cacheReady,
    staleTime: FEED_STALE_MS,
    gcTime: FEED_GC_MS,
  });

  const firstPagePosts = infiniteQuery.data?.pages[0]?.posts;

  useEffect(() => {
    if (isTaggedFeed || !firstPagePosts?.length) return;
    void saveFeedCache(firstPagePosts);
  }, [firstPagePosts, isTaggedFeed]);

  useEffect(() => {
    if (isTaggedFeed || !cacheReady) return;
    let cancelled = false;

    const pollSince = async () => {
      const data = queryClient.getQueryData<{ pages: FeedPage[] }>(queryKey);
      const latest = data?.pages[0]?.posts[0]?.createdAt;
      if (!latest || cancelled) return;
      try {
        const incoming = (await communityApi.getPosts({ since: latest, limit: FEED_PAGE_SIZE })).data.data.map(
          ensurePostReactionFields,
        );
        if (!incoming.length || cancelled) return;
        mergeNewPostsIntoFeedCache(queryClient, queryKey, incoming, mergeFeedPosts);
        const merged = mergeFeedPosts(data!.pages[0].posts, incoming);
        void saveFeedCache(merged);
      } catch {
        // Polling en segundo plano: ignorar errores de red
      }
    };

    void pollSince();
    const intervalId = setInterval(pollSince, FEED_SINCE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isTaggedFeed, cacheReady, queryClient, queryKey]);

  const cachedFallback = useMemo(() => {
    if (isTaggedFeed) return [];
    return queryClient.getQueryData<{ pages: FeedPage[] }>(queryKey)?.pages.flatMap((p) => p.posts) ?? [];
  }, [isTaggedFeed, queryClient, queryKey, infiniteQuery.dataUpdatedAt]);

  const posts = useMemo(
    () => infiniteQuery.data?.pages.flatMap((page) => page.posts) ?? cachedFallback,
    [infiniteQuery.data, cachedFallback],
  );

  const isInitialLoading = !cacheReady || (infiniteQuery.isLoading && posts.length === 0);

  const refetch = async () => {
    await infiniteQuery.refetch({ refetchPage: (_page, index) => index === 0 });
  };

  return {
    posts,
    isLoading: isInitialLoading,
    isRefetching: infiniteQuery.isRefetching,
    refetch,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
  };
}
