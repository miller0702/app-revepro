import { computeBookReadPercentage } from '../lib/bookProgress';
import { getDatabase } from './database';
import { upsertReadingProgress } from './readingProgress';

export async function getCompletedChapterIds(bookId: string): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ chapter_id: string }>(
    'SELECT chapter_id FROM chapter_completion WHERE book_id = ?',
    [bookId],
  );
  return new Set(rows.map((row) => row.chapter_id));
}

export async function markChapterCompleted(bookId: string, chapterId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO chapter_completion (book_id, chapter_id, completed_at)
     VALUES (?, ?, datetime('now'))`,
    [bookId, chapterId],
  );
}

export async function markAllChaptersCompleted(bookId: string, chapterIds: string[]): Promise<void> {
  if (chapterIds.length === 0) return;
  const db = await getDatabase();
  for (const chapterId of chapterIds) {
    await db.runAsync(
      `INSERT OR IGNORE INTO chapter_completion (book_id, chapter_id, completed_at)
       VALUES (?, ?, datetime('now'))`,
      [bookId, chapterId],
    );
  }
}

export async function syncBookProgressFromChapters(
  bookId: string,
  currentChapterId: string | null,
  totalChapters: number,
): Promise<number> {
  const completed = await getCompletedChapterIds(bookId);
  const percentage = computeBookReadPercentage(completed.size, totalChapters);
  await upsertReadingProgress(bookId, currentChapterId, percentage);
  return percentage;
}
