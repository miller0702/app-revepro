import { syncApi } from '../api/sync';
import { studyApi } from '../api/study';
import { getDatabase } from '../db/database';
import { mergeRemoteReadingProgress } from '../db/readingProgress';
import {
  getUnsyncedHighlights,
  markHighlightSynced,
} from '../db/highlights';
import { getLastSync, setLastSync } from '../storage/localStorage';
import { processDownloadQueue } from './downloadWorker';

export async function syncWithServer() {
  // Completa descargas pendientes si hay red.
  await processDownloadQueue().catch(() => undefined);

  const since = await getLastSync();
  const remote = await syncApi.getState(since);
  const { bookmarks, progress } = remote.data.data;

  if (progress?.length) {
    await mergeRemoteReadingProgress(
      progress.map((p: { bookId: string; chapterId?: string; percentage: number; updatedAt: string }) => ({
        bookId: p.bookId,
        chapterId: p.chapterId,
        percentage: p.percentage,
        updatedAt: p.updatedAt,
      })),
    );
  }

  const db = await getDatabase();

  const localBookmarks = await db.getAllAsync<{
    book_id: string;
    chapter_id: string | null;
    position: number;
    note: string | null;
    updated_at: string;
  }>('SELECT * FROM bookmarks WHERE synced = 0');

  const localProgress = await db.getAllAsync<{
    book_id: string;
    chapter_id: string | null;
    percentage: number;
    updated_at: string;
  }>('SELECT * FROM reading_progress WHERE synced = 0');

  if (localBookmarks.length || localProgress.length) {
    await syncApi.push({
      bookmarks: localBookmarks.map((b) => ({
        bookId: b.book_id,
        chapterId: b.chapter_id,
        position: b.position,
        note: b.note,
        updatedAt: b.updated_at,
      })),
      progress: localProgress.map((p) => ({
        bookId: p.book_id,
        chapterId: p.chapter_id,
        percentage: p.percentage,
        updatedAt: p.updated_at,
      })),
    });

    await db.runAsync('UPDATE bookmarks SET synced = 1 WHERE synced = 0');
    await db.runAsync('UPDATE reading_progress SET synced = 1 WHERE synced = 0');
  }

  // Subrayados: outbox local → API de study.
  const pendingHighlights = await getUnsyncedHighlights();
  for (const h of pendingHighlights) {
    try {
      const res = await studyApi.createHighlight({
        bookId: h.book_id,
        chapterId: h.chapter_id ?? undefined,
        excerpt: h.excerpt,
        note: h.note ?? undefined,
        color: h.color,
      });
      await markHighlightSynced(h.id, res.data.data.id);
    } catch {
      // Se reintentará en la próxima sync.
    }
  }

  await setLastSync(remote.data.data.serverTime ?? new Date().toISOString());

  return { bookmarks, progress };
}
