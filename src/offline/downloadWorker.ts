import { getDatabase } from '../db/database';
import { libraryApi } from '../api/library';
import { saveBookOffline } from '../db/database';

type ApiChapter = {
  id: string;
  title: string;
  order: number;
  content?: string | null;
};

type ApiBook = {
  id: string;
  title: string;
  slug?: string;
  summary?: string | null;
  coverUrl?: string | null;
  author?: { name?: string } | null;
  chapters?: ApiChapter[];
};

async function setQueueStatus(bookId: string, status: 'pending' | 'downloading' | 'done' | 'error') {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO download_queue (book_id, status, created_at)
     VALUES (?, ?, COALESCE((SELECT created_at FROM download_queue WHERE book_id = ?), datetime('now')))`,
    [bookId, status, bookId],
  );
}

/** Descarga capítulos del libro y los guarda en SQLite para lectura offline. */
export async function downloadBookForOffline(bookId: string): Promise<void> {
  await setQueueStatus(bookId, 'downloading');
  try {
    const res = await libraryApi.getBook(bookId);
    const book = res.data.data as ApiBook;
    const chapters = book.chapters ?? [];

    await saveBookOffline({
      id: book.id,
      title: book.title,
      slug: book.slug,
      summary: book.summary ?? undefined,
      authorName: book.author?.name,
      coverUrl: book.coverUrl ?? undefined,
    });

    const db = await getDatabase();
    await db.runAsync('DELETE FROM chapters WHERE book_id = ?', [bookId]);
    for (const ch of chapters) {
      await db.runAsync(
        `INSERT OR REPLACE INTO chapters (id, book_id, title, "order", content)
         VALUES (?, ?, ?, ?, ?)`,
        [ch.id, bookId, ch.title, ch.order, ch.content ?? ''],
      );
    }

    await setQueueStatus(bookId, 'done');
  } catch (err) {
    await setQueueStatus(bookId, 'error');
    throw err;
  }
}

/** Procesa la cola de descargas pendientes o con error (reintento). */
export async function processDownloadQueue(): Promise<void> {
  const db = await getDatabase();
  const pending = await db.getAllAsync<{ book_id: string }>(
    `SELECT book_id FROM download_queue
     WHERE status IN ('pending', 'error', 'downloading')
     ORDER BY created_at ASC`,
  );

  for (const row of pending) {
    try {
      await downloadBookForOffline(row.book_id);
    } catch {
      // Continúa con el siguiente; el estado error ya quedó registrado.
    }
  }
}
