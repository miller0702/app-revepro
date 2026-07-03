import { getString, setString } from './localStorage';
import type { BookListItem } from '../api/library';
import type { PodcastSeriesSummary, VideoItem } from '../api/streaming';

export const RECENT_FILTER_ID = '__recent__';
const MAX_RECENT = 24;

export type RecentVideo = Pick<
  VideoItem,
  'id' | 'title' | 'description' | 'durationSec' | 'viewCount' | 'thumbnailUrl'
> & {
  categoryName?: string | null;
  viewedAt: string;
};

export type RecentPodcast = Pick<
  PodcastSeriesSummary,
  'id' | 'title' | 'description' | 'coverUrl' | 'episodeCount'
> & {
  authorName?: string | null;
  viewedAt: string;
};

export type RecentAudiobook = {
  id: string;
  title: string;
  description?: string | null;
  authorName?: string | null;
  coverUrl?: string | null;
  viewedAt: string;
};

type RecentKind = 'VIDEO' | 'PODCAST' | 'AUDIOBOOK';

function storageKey(kind: RecentKind) {
  return `recent:${kind}`;
}

async function readList<T>(kind: RecentKind): Promise<T[]> {
  const raw = await getString(storageKey(kind));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeList<T>(kind: RecentKind, items: T[]): Promise<void> {
  await setString(storageKey(kind), JSON.stringify(items));
}

async function pushRecent<T extends { id: string; viewedAt: string }>(
  kind: RecentKind,
  entry: Omit<T, 'viewedAt'>,
): Promise<void> {
  const list = await readList<T>(kind);
  const next: T = { ...entry, viewedAt: new Date().toISOString() } as T;
  const filtered = list.filter((item) => item.id !== entry.id);
  await writeList(kind, [next, ...filtered].slice(0, MAX_RECENT));
}

export async function getRecentVideos(): Promise<RecentVideo[]> {
  return readList<RecentVideo>('VIDEO');
}

export async function getRecentPodcasts(): Promise<RecentPodcast[]> {
  return readList<RecentPodcast>('PODCAST');
}

export async function getRecentAudiobooks(): Promise<RecentAudiobook[]> {
  return readList<RecentAudiobook>('AUDIOBOOK');
}

export async function recordRecentVideo(video: VideoItem): Promise<void> {
  await pushRecent<RecentVideo>('VIDEO', {
    id: video.id,
    title: video.title,
    description: video.description,
    durationSec: video.durationSec,
    viewCount: video.viewCount,
    thumbnailUrl: video.thumbnailUrl,
    categoryName: video.category?.name ?? null,
  });
}

export async function recordRecentPodcast(series: PodcastSeriesSummary): Promise<void> {
  await pushRecent<RecentPodcast>('PODCAST', {
    id: series.id,
    title: series.title,
    description: series.description,
    coverUrl: series.coverUrl,
    episodeCount: series.episodeCount,
    authorName: series.author?.name ?? null,
  });
}

export async function recordRecentAudiobook(book: BookListItem): Promise<void> {
  await pushRecent<RecentAudiobook>('AUDIOBOOK', {
    id: book.id,
    title: book.title,
    description: book.summary,
    authorName: book.author?.name ?? null,
    coverUrl: book.coverUrl,
  });
}

export function recentVideoToItem(recent: RecentVideo): VideoItem {
  return {
    id: recent.id,
    title: recent.title,
    slug: recent.id,
    description: recent.description,
    durationSec: recent.durationSec,
    viewCount: recent.viewCount,
    thumbnailUrl: recent.thumbnailUrl,
    category: recent.categoryName ? { id: '', name: recent.categoryName } : null,
  };
}

export function recentPodcastToSummary(recent: RecentPodcast): PodcastSeriesSummary {
  return {
    id: recent.id,
    title: recent.title,
    slug: recent.id,
    description: recent.description,
    coverUrl: recent.coverUrl,
    episodeCount: recent.episodeCount,
    author: recent.authorName ? { id: '', name: recent.authorName } : null,
  };
}

export function recentAudiobookToBook(recent: RecentAudiobook): BookListItem {
  return {
    id: recent.id,
    title: recent.title,
    slug: recent.id,
    summary: recent.description,
    coverUrl: recent.coverUrl,
    author: recent.authorName ? { id: '', name: recent.authorName } : null,
    isAudiobook: true,
  };
}
