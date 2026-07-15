import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '../api/community';
import {
  buildUserPostsSeedData,
  communityFeedQueryKey,
  ensurePostReactionFields,
  extractPostsByAuthorFromCache,
  type FeedInfiniteData,
  type FeedPage,
} from '../utils/communityFeedCache';
import { FEED_GC_MS, FEED_STALE_MS, PROFILE_POSTS_PAGE_SIZE } from '../config/socialFeed';
import { loadFeedCache } from '../storage/feedCache';

async function fetchUserPostsPage(authorId: string, page: number): Promise<FeedPage> {
  const res = await communityApi.getPosts({
    page,
    limit: PROFILE_POSTS_PAGE_SIZE,
    authorId,
  });
  return {
    posts: res.data.data.map(ensurePostReactionFields),
    meta: res.data.meta,
  };
}

function hasCachedPosts(data: FeedInfiniteData | undefined): boolean {
  return Boolean(data?.pages.some((page) => page.posts.length > 0));
}

export function useUserPosts(authorId: string | undefined) {
  const queryClient = useQueryClient();
  const [cacheReady, setCacheReady] = useState(false);
  const queryKey = useMemo(() => communityFeedQueryKey(undefined, authorId), [authorId]);

  useEffect(() => {
    if (!authorId) {
      setCacheReady(false);
      return;
    }

    let mounted = true;

    if (!hasCachedPosts(queryClient.getQueryData<FeedInfiniteData>(queryKey))) {
      const fromFeed = extractPostsByAuthorFromCache(queryClient, authorId);
      const seed = buildUserPostsSeedData(fromFeed, PROFILE_POSTS_PAGE_SIZE);
      if (seed) {
        queryClient.setQueryData(queryKey, seed);
      } else {
        void loadFeedCache().then((cached) => {
          if (!mounted || !cached?.length) return;
          if (hasCachedPosts(queryClient.getQueryData<FeedInfiniteData>(queryKey))) return;
          const mine = cached
            .filter((post) => post.author.id === authorId)
            .map(ensurePostReactionFields);
          const asyncSeed = buildUserPostsSeedData(mine, PROFILE_POSTS_PAGE_SIZE);
          if (asyncSeed) {
            queryClient.setQueryData(queryKey, asyncSeed);
          }
        });
      }
    }

    setCacheReady(true);

    return () => {
      mounted = false;
    };
  }, [authorId, queryClient, queryKey]);

  const infiniteQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchUserPostsPage(authorId!, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(authorId) && cacheReady,
    staleTime: FEED_STALE_MS,
    gcTime: FEED_GC_MS,
  });

  const cachedFallback = useMemo(
    () =>
      queryClient.getQueryData<FeedInfiniteData>(queryKey)?.pages.flatMap((page) => page.posts) ?? [],
    [queryClient, queryKey, infiniteQuery.dataUpdatedAt],
  );

  const posts = useMemo(
    () => infiniteQuery.data?.pages.flatMap((page) => page.posts) ?? cachedFallback,
    [infiniteQuery.data, cachedFallback],
  );

  const totalCount = infiniteQuery.data?.pages[0]?.meta.total ?? posts.length;

  return {
    posts,
    totalCount,
    isLoading: !cacheReady || (infiniteQuery.isLoading && posts.length === 0),
    refetch: infiniteQuery.refetch,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
  };
}
