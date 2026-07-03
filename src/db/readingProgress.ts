import { getDatabase } from './database';

export interface ReadingProgressRow {
  book_id: string;
  chapter_id: string | null;
  percentage: number;
  updated_at: string;
  synced: number;
}

export async function upsertReadingProgress(
  bookId: string,
  chapterId: string | null,
  percentage: number,
) {
  const db = await getDatabase();
  const clamped = Math.min(100, Math.max(0, percentage));
  await db.runAsync(
    `INSERT INTO reading_progress (book_id, chapter_id, percentage, synced, updated_at)
     VALUES (?, ?, ?, 0, datetime('now'))
     ON CONFLICT(book_id) DO UPDATE SET
       chapter_id = excluded.chapter_id,
       percentage = excluded.percentage,
       synced = 0,
       updated_at = datetime('now')`,
    [bookId, chapterId, clamped],
  );
}

export async function getReadingProgressMap(
  bookIds?: string[],
): Promise<Record<string, ReadingProgressRow>> {
  const db = await getDatabase();
  const rows = bookIds?.length
    ? await db.getAllAsync<ReadingProgressRow>(
        `SELECT book_id, chapter_id, percentage, updated_at, synced
         FROM reading_progress
         WHERE book_id IN (${bookIds.map(() => '?').join(',')})`,
        bookIds,
      )
    : await db.getAllAsync<ReadingProgressRow>(
        'SELECT book_id, chapter_id, percentage, updated_at, synced FROM reading_progress',
      );

  return Object.fromEntries(rows.map((row) => [row.book_id, row]));
}

type RemoteProgress = {
  bookId: string;
  chapterId?: string | null;
  percentage: number;
  updatedAt: string;
};

export async function mergeRemoteReadingProgress(remote: RemoteProgress[]) {
  if (!remote.length) return;

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const item of remote) {
      const local = await db.getFirstAsync<{ updated_at: string; synced: number }>(
        'SELECT updated_at, synced FROM reading_progress WHERE book_id = ?',
        [item.bookId],
      );

      const remoteTime = new Date(item.updatedAt).getTime();
      const localTime = local?.updated_at ? new Date(local.updated_at).getTime() : 0;
      const keepLocal = local?.synced === 0 && localTime >= remoteTime;

      if (!keepLocal) {
        await db.runAsync(
          `INSERT INTO reading_progress (book_id, chapter_id, percentage, synced, updated_at)
           VALUES (?, ?, ?, 1, ?)
           ON CONFLICT(book_id) DO UPDATE SET
             chapter_id = excluded.chapter_id,
             percentage = excluded.percentage,
             synced = 1,
             updated_at = excluded.updated_at`,
          [item.bookId, item.chapterId ?? null, item.percentage, item.updatedAt],
        );
      }
    }
  });
}
