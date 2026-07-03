import { useQuery } from '@tanstack/react-query';
import { buildReadingStatusMeta, type ReadingStatusMeta } from '../lib/readingStatus';
import { getReadingProgressMap } from '../db/readingProgress';
import { useReadingActivity } from './useReadingActivity';

function pickPercentage(local: number | undefined, remote: number | undefined): number {
  return Math.max(local ?? 0, remote ?? 0);
}

export function useReadingStatuses(bookIds: string[], enabled = true) {
  const sortedKey = [...bookIds].sort().join(',');
  const activityQuery = useReadingActivity();
  const activityVersion = activityQuery.dataUpdatedAt || 0;
  const studySet = new Set(activityQuery.data?.studyBookIds ?? []);

  const query = useQuery({
    queryKey: ['reading-statuses', sortedKey, activityVersion],
    enabled: enabled && bookIds.length > 0,
    queryFn: async (): Promise<Record<string, ReadingStatusMeta>> => {
      const remotePct = activityQuery.data?.remotePct ?? {};
      const mergedLocal = await getReadingProgressMap(bookIds);
      const result: Record<string, ReadingStatusMeta> = {};

      for (const bookId of bookIds) {
        const percentage = pickPercentage(mergedLocal[bookId]?.percentage, remotePct[bookId]);
        result[bookId] = buildReadingStatusMeta(percentage, studySet.has(bookId));
      }

      return result;
    },
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });

  return {
    statuses: query.data ?? {},
    isLoading: query.isLoading && !query.data,
    refetch: async () => {
      await activityQuery.refetch();
      return query.refetch();
    },
  };
}
