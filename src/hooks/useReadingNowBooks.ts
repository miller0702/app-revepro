import { useQuery } from '@tanstack/react-query';
import { libraryApi, type BookListItem } from '../api/library';
import { buildReadingStatusMeta, type ReadingStatusMeta } from '../lib/readingStatus';
import { getReadingProgressMap } from '../db/readingProgress';
import { type ReadingActivity, useReadingActivity } from './useReadingActivity';

export interface ReadingNowItem {
  book: BookListItem;
  status: ReadingStatusMeta;
  updatedAt: string | null;
}

function studyIdSet(activity: ReadingActivity | undefined): Set<string> {
  return new Set(activity?.studyBookIds ?? []);
}

async function buildReadingNowItems(activity?: ReadingActivity): Promise<ReadingNowItem[]> {
  const remotePct = activity?.remotePct ?? {};
  const studying = studyIdSet(activity);

  const localMap = await getReadingProgressMap();
  const bookIds = new Set<string>([
    ...Object.keys(localMap),
    ...Object.keys(remotePct),
    ...studying,
  ]);

  const statuses: Record<string, ReadingStatusMeta> = {};
  const updatedAt: Record<string, string | null> = {};

  for (const bookId of bookIds) {
    const percentage = Math.max(localMap[bookId]?.percentage ?? 0, remotePct[bookId] ?? 0);
    statuses[bookId] = buildReadingStatusMeta(percentage, studying.has(bookId));
    updatedAt[bookId] = localMap[bookId]?.updated_at ?? null;
  }

  const ids = [...bookIds].filter((id) => {
    const status = statuses[id]?.status;
    return status === 'reading' || status === 'studying';
  });

  ids.sort((a, b) => {
    const ta = updatedAt[a] ? new Date(updatedAt[a]!).getTime() : 0;
    const tb = updatedAt[b] ? new Date(updatedAt[b]!).getTime() : 0;
    return tb - ta;
  });

  if (ids.length === 0) return [];

  const res = await libraryApi.getBooks({ ids: ids.join(','), limit: ids.length });
  const books = res.data.data as BookListItem[];
  const bookMap = new Map(books.map((b) => [b.id, b]));

  return ids
    .map((id) => bookMap.get(id))
    .filter((book): book is BookListItem => book != null)
    .map((book) => ({
      book,
      status: statuses[book.id],
      updatedAt: updatedAt[book.id] ?? null,
    }));
}

export function useReadingNowBooks() {
  const activityQuery = useReadingActivity();
  const activityVersion = activityQuery.dataUpdatedAt || 0;

  return useQuery({
    queryKey: ['reading-now-books', activityVersion],
    queryFn: () => buildReadingNowItems(activityQuery.data),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}
