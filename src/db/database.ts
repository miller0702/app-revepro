import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DB_NAME } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

const CHAPTER_COMPLETION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chapter_completion (
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (book_id, chapter_id)
);
`;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(CREATE_TABLES_SQL);
    await db.execAsync(CHAPTER_COMPLETION_TABLE_SQL);
  }
  return db;
}

export async function saveBookOffline(book: {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  authorName?: string;
  coverUrl?: string;
}) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO books (id, title, slug, summary, author_name, cover_url, synced, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [book.id, book.title, book.slug ?? null, book.summary ?? null, book.authorName ?? null, book.coverUrl ?? null],
  );
}

export async function queueDownload(bookId: string) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO download_queue (book_id, status, created_at) VALUES (?, 'pending', datetime('now'))`,
    [bookId],
  );
}
