import { useQuery } from '@tanstack/react-query';
import { syncApi } from '../api/sync';
import { studyApi } from '../api/study';
import { mergeRemoteReadingProgress } from '../db/readingProgress';
import { getLastSync } from '../storage/localStorage';
import { useAuthStore } from '../stores/authStore';

export interface ReadingActivity {
  remotePct: Record<string, number>;
  /** IDs serializables (no usar Set: React Query no lo persiste bien). */
  studyBookIds: string[];
}

const READING_ACTIVITY_STALE_MS = 60_000;

async function fetchReadingActivity(isAuthenticated: boolean): Promise<ReadingActivity> {
  const remotePct: Record<string, number> = {};
  const studyBookIds: string[] = [];

  if (!isAuthenticated) {
    return { remotePct, studyBookIds };
  }

  try {
    const since = await getLastSync();
    const [syncRes, studyIdsRes] = await Promise.all([
      syncApi.getState(since),
      studyApi.getStudyBookIds(),
    ]);

    const remoteProgress = syncRes.data.data.progress ?? [];

    for (const p of remoteProgress) {
      remotePct[p.bookId] = Math.max(remotePct[p.bookId] ?? 0, p.percentage);
    }

    for (const bookId of studyIdsRes.data.data.bookIds) {
      if (!studyBookIds.includes(bookId)) {
        studyBookIds.push(bookId);
      }
    }

    // SQLite en segundo plano: no bloquear la UI (crítico en iOS).
    if (remoteProgress.length) {
      void mergeRemoteReadingProgress(
        remoteProgress.map((p: { bookId: string; chapterId?: string; percentage: number; updatedAt: string }) => ({
          bookId: p.bookId,
          chapterId: p.chapterId,
          percentage: p.percentage,
          updatedAt: p.updatedAt,
        })),
      ).catch(() => undefined);
    }
  } catch {
    // Offline: los consumidores usan SQLite local.
  }

  return { remotePct, studyBookIds };
}

/** Progreso remoto + libros con notas/resaltados; una sola petición compartida por la biblioteca. */
export function useReadingActivity() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['reading-activity', isAuthenticated],
    queryFn: () => fetchReadingActivity(isAuthenticated),
    staleTime: READING_ACTIVITY_STALE_MS,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}

export { READING_ACTIVITY_STALE_MS };
