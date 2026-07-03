import type { CommunityPost } from '../api/community';
import { getString, setString, removeString } from './localStorage';

const CACHE_KEY = 'feedPosts';
const MAX_CACHED_POSTS = 20;

export async function loadFeedCache(): Promise<CommunityPost[] | undefined> {
  const raw = await getString(CACHE_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as CommunityPost[];
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function saveFeedCache(posts: CommunityPost[]): Promise<void> {
  const trimmed = posts.slice(0, MAX_CACHED_POSTS);
  await setString(CACHE_KEY, JSON.stringify(trimmed));
}

export function mergeFeedPosts(cached: CommunityPost[], incoming: CommunityPost[]): CommunityPost[] {
  const byId = new Map<string, CommunityPost>();
  for (const post of incoming) {
    byId.set(post.id, post);
  }
  for (const post of cached) {
    if (!byId.has(post.id)) {
      byId.set(post.id, post);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function clearFeedCache(): Promise<void> {
  await removeString(CACHE_KEY);
}
