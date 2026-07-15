import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';
import type { CommunityPost } from '../api/community';
import {
  emptyReactionCounts,
  normalizeReactionCounts,
  type CommunityReactionType,
  type ReactionCounts,
} from '../constants/communityReactions';

export const COMMUNITY_POSTS_QUERY_KEY = ['community-posts'] as const;

export type FeedPageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type FeedPage = {
  posts: CommunityPost[];
  meta: FeedPageMeta;
};

export type FeedInfiniteData = InfiniteData<FeedPage, number>;

/** Clave de caché: feed global, por tag o por autor. */
export function communityFeedQueryKey(tag?: string, authorId?: string) {
  return [...COMMUNITY_POSTS_QUERY_KEY, tag ?? 'all', authorId ?? 'feed'] as const;
}

/** Publicaciones de un autor ya presentes en cualquier caché del feed (p. ej. tras ver el feed). */
export function extractPostsByAuthorFromCache(
  queryClient: QueryClient,
  authorId: string,
): CommunityPost[] {
  const byId = new Map<string, CommunityPost>();
  for (const [, data] of snapshotFeedQueries(queryClient)) {
    if (!data?.pages.length) continue;
    for (const page of data.pages) {
      for (const post of page.posts) {
        if (post.author.id === authorId) {
          byId.set(post.id, post);
        }
      }
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Meta optimista al hidratar desde caché local (permite seguir paginando hasta que responda la API). */
export function buildFeedSeedMeta(cachedCount: number, pageSize: number): FeedPageMeta {
  const fullPage = cachedCount >= pageSize;
  return {
    total: cachedCount,
    page: 1,
    limit: pageSize,
    totalPages: fullPage ? 2 : 1,
  };
}

export function buildUserPostsSeedData(
  posts: CommunityPost[],
  pageSize: number,
): FeedInfiniteData | undefined {
  if (!posts.length) return undefined;
  const pagePosts = posts.slice(0, pageSize);
  return {
    pages: [
      {
        posts: pagePosts,
        meta: {
          total: posts.length,
          page: 1,
          limit: pageSize,
          totalPages: Math.max(1, Math.ceil(posts.length / pageSize)),
        },
      },
    ],
    pageParams: [1],
  };
}

function patchInfiniteFeed(
  old: FeedInfiniteData | undefined,
  patch: (posts: CommunityPost[]) => CommunityPost[],
): FeedInfiniteData | undefined {
  if (!old?.pages.length) return old;
  return {
    ...old,
    pages: old.pages.map((page, index) =>
      index === 0 ? { ...page, posts: patch(page.posts) } : page,
    ),
  };
}

function mapPostInInfiniteFeed(
  old: FeedInfiniteData | undefined,
  postId: string,
  updater: (post: CommunityPost) => CommunityPost,
): FeedInfiniteData | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      posts: page.posts.map((post) => (post.id === postId ? updater(post) : post)),
    })),
  };
}

export function snapshotFeedQueries(
  queryClient: QueryClient,
): Array<[QueryKey, FeedInfiniteData | undefined]> {
  return queryClient.getQueriesData<FeedInfiniteData>({ queryKey: COMMUNITY_POSTS_QUERY_KEY });
}

export function restoreFeedQueries(
  queryClient: QueryClient,
  snapshots: Array<[QueryKey, FeedInfiniteData | undefined]>,
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

export function findPostInFeedCache(
  queryClient: QueryClient,
  postId: string,
): CommunityPost | undefined {
  for (const [, data] of snapshotFeedQueries(queryClient)) {
    if (!data?.pages.length) continue;
    for (const page of data.pages) {
      const match = page.posts.find((post) => post.id === postId);
      if (match) return match;
    }
  }
  return undefined;
}

export function updatePostInFeedCache(
  queryClient: QueryClient,
  postId: string,
  updater: (post: CommunityPost) => CommunityPost,
) {
  queryClient.setQueriesData<FeedInfiniteData>(
    { queryKey: COMMUNITY_POSTS_QUERY_KEY },
    (old) => mapPostInInfiniteFeed(old, postId, updater),
  );
  queryClient.setQueryData<CommunityPost>(['community-post', postId], (old) =>
    old ? updater(old) : old,
  );
}

export function prependPostToFeedCache(queryClient: QueryClient, post: CommunityPost) {
  queryClient.setQueriesData<FeedInfiniteData>(
    {
      queryKey: COMMUNITY_POSTS_QUERY_KEY,
      predicate: (query) => {
        const [, scope, mode] = query.queryKey;
        if (scope !== 'all') return false;
        if (mode === 'feed') return true;
        return mode === post.author.id;
      },
    },
    (old) => {
      if (!old?.pages[0]) {
        return {
          pages: [
            {
              posts: [post],
              meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
            },
          ],
          pageParams: [1],
        };
      }
      const first = old.pages[0];
      if (first.posts.some((p) => p.id === post.id)) return old;
      return {
        ...old,
        pages: [
          {
            ...first,
            posts: [post, ...first.posts],
            meta: { ...first.meta, total: first.meta.total + 1 },
          },
          ...old.pages.slice(1),
        ],
      };
    },
  );
}

export function mergeNewPostsIntoFeedCache(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  incoming: CommunityPost[],
  merge: (cached: CommunityPost[], incoming: CommunityPost[]) => CommunityPost[],
) {
  if (!incoming.length) return;
  queryClient.setQueryData<FeedInfiniteData>(queryKey, (old) =>
    patchInfiniteFeed(old, (posts) => merge(posts, incoming)),
  );
}

export function applyReactionOptimistic(
  post: CommunityPost,
  type: CommunityReactionType,
): CommunityPost {
  const counts = normalizeReactionCounts(post.reactionCounts, post.likeCount);
  const prev = post.myReaction ?? (post.likedByMe ? 'AMEN' : null);

  if (prev === type) {
    counts[type] = Math.max(0, counts[type] - 1);
    return { ...post, reactionCounts: counts, myReaction: null, likedByMe: false, likeCount: 0 };
  }

  if (prev) {
    counts[prev] = Math.max(0, counts[prev] - 1);
  }
  counts[type] = counts[type] + 1;
  return { ...post, reactionCounts: counts, myReaction: type, likedByMe: type === 'AMEN', likeCount: 0 };
}

export function applyReactionFromServer(
  post: CommunityPost,
  myReaction: CommunityReactionType | null,
  reactionCounts: ReactionCounts,
): CommunityPost {
  return {
    ...post,
    myReaction,
    reactionCounts,
    likedByMe: myReaction === 'AMEN',
    likeCount: 0,
  };
}

export function bumpCommentCount(post: CommunityPost, delta = 1): CommunityPost {
  return { ...post, commentCount: Math.max(0, post.commentCount + delta) };
}

export function ensurePostReactionFields(post: CommunityPost): CommunityPost {
  return {
    ...post,
    repostOfId: post.repostOfId ?? null,
    repostCount: post.repostCount ?? 0,
    repostOf: post.repostOf ?? null,
    reactionCounts: normalizeReactionCounts(post.reactionCounts, post.likeCount),
    myReaction: post.myReaction ?? (post.likedByMe ? 'AMEN' : null),
  };
}

export function emptyCounts(): ReactionCounts {
  return emptyReactionCounts();
}
