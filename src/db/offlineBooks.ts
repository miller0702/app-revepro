import { getDatabase } from './database';

export interface OfflineBookRow {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  author_name: string | null;
  cover_url: string | null;
  download_status: string | null;
  updated_at: string | null;
}

export interface StudyProgressRow {
  book_id: string;
  chapter_id: string | null;
  percentage: number;
  updated_at: string | null;
  title: string;
  author_name: string | null;
}

export async function getOfflineBooks(): Promise<OfflineBookRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<OfflineBookRow>(
    `SELECT b.*, dq.status AS download_status
     FROM books b
     LEFT JOIN download_queue dq ON dq.book_id = b.id
     ORDER BY b.updated_at DESC, b.title ASC`,
  );
}

export async function getStudyProgress(): Promise<StudyProgressRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<StudyProgressRow>(
    `SELECT rp.book_id, rp.chapter_id, rp.percentage, rp.updated_at, b.title, b.author_name
     FROM reading_progress rp
     INNER JOIN books b ON b.id = rp.book_id
     WHERE rp.percentage > 0
     ORDER BY rp.updated_at DESC
     LIMIT 20`,
  );
}

export async function removeOfflineBook(bookId: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM download_queue WHERE book_id = ?', [bookId]);
  await db.runAsync('DELETE FROM chapters WHERE book_id = ?', [bookId]);
  await db.runAsync('DELETE FROM bookmarks WHERE book_id = ?', [bookId]);
  await db.runAsync('DELETE FROM reading_progress WHERE book_id = ?', [bookId]);
  await db.runAsync('DELETE FROM books WHERE id = ?', [bookId]);
}

export function downloadStatusLabel(status: string | null) {
  switch (status) {
    case 'pending':
      return 'En cola';
    case 'downloading':
      return 'Descargando';
    case 'done':
      return 'Completo';
    case 'error':
      return 'Error';
    default:
      return 'Guardado';
  }
}
