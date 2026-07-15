import { getDatabase } from './database';
import type { Highlight } from '../api/study';

const HIGHLIGHTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  excerpt TEXT NOT NULL,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  book_title TEXT,
  author_name TEXT,
  chapter_title TEXT,
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
`;

let ensured = false;

async function ensureHighlightsTable() {
  if (ensured) return;
  const db = await getDatabase();
  await db.execAsync(HIGHLIGHTS_TABLE_SQL);
  ensured = true;
}

function newLocalId() {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export type LocalHighlightInput = {
  bookId: string;
  chapterId?: string | null;
  excerpt: string;
  note?: string | null;
  color?: string;
  bookTitle?: string | null;
  authorName?: string | null;
  chapterTitle?: string | null;
};

function mapRow(row: {
  id: string;
  server_id: string | null;
  book_id: string;
  chapter_id: string | null;
  excerpt: string;
  note: string | null;
  color: string;
  book_title: string | null;
  author_name: string | null;
  chapter_title: string | null;
  created_at: string;
}): Highlight {
  return {
    id: row.server_id ?? row.id,
    bookId: row.book_id,
    chapterId: row.chapter_id,
    excerpt: row.excerpt,
    note: row.note,
    color: row.color || 'yellow',
    bookTitle: row.book_title ?? '',
    bookCoverUrl: null,
    authorName: row.author_name,
    chapterTitle: row.chapter_title,
    createdAt: row.created_at,
  };
}

/** Guarda un subrayado localmente (synced=0) y lo muestra offline. */
export async function saveLocalHighlight(
  input: LocalHighlightInput,
): Promise<{ localId: string; highlight: Highlight }> {
  await ensureHighlightsTable();
  const db = await getDatabase();
  const id = newLocalId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO highlights
      (id, server_id, book_id, chapter_id, excerpt, note, color, book_title, author_name, chapter_title, synced, created_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      input.bookId,
      input.chapterId ?? null,
      input.excerpt,
      input.note ?? null,
      input.color ?? 'yellow',
      input.bookTitle ?? null,
      input.authorName ?? null,
      input.chapterTitle ?? null,
      createdAt,
    ],
  );
  return {
    localId: id,
    highlight: mapRow({
      id,
      server_id: null,
      book_id: input.bookId,
      chapter_id: input.chapterId ?? null,
      excerpt: input.excerpt,
      note: input.note ?? null,
      color: input.color ?? 'yellow',
      book_title: input.bookTitle ?? null,
      author_name: input.authorName ?? null,
      chapter_title: input.chapterTitle ?? null,
      created_at: createdAt,
    }),
  };
}

export async function getLocalHighlights(bookId?: string): Promise<Highlight[]> {
  await ensureHighlightsTable();
  const db = await getDatabase();
  const rows = bookId
    ? await db.getAllAsync<Parameters<typeof mapRow>[0]>(
        'SELECT * FROM highlights WHERE book_id = ? ORDER BY created_at DESC',
        [bookId],
      )
    : await db.getAllAsync<Parameters<typeof mapRow>[0]>(
        'SELECT * FROM highlights ORDER BY created_at DESC',
      );
  return rows.map(mapRow);
}

export async function getUnsyncedHighlights() {
  await ensureHighlightsTable();
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    book_id: string;
    chapter_id: string | null;
    excerpt: string;
    note: string | null;
    color: string;
  }>('SELECT id, book_id, chapter_id, excerpt, note, color FROM highlights WHERE synced = 0');
}

export async function markHighlightSynced(localId: string, serverId: string) {
  await ensureHighlightsTable();
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE highlights SET synced = 1, server_id = ? WHERE id = ?',
    [serverId, localId],
  );
}

/** Cachea subrayados del servidor para poder verlos offline. */
export async function cacheRemoteHighlights(highlights: Highlight[]) {
  await ensureHighlightsTable();
  const db = await getDatabase();
  for (const h of highlights) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM highlights WHERE server_id = ? OR (book_id = ? AND excerpt = ? AND synced = 1)',
      [h.id, h.bookId, h.excerpt],
    );
    if (existing) {
      await db.runAsync(
        `UPDATE highlights SET server_id = ?, chapter_id = ?, note = ?, color = ?, book_title = ?,
          author_name = ?, chapter_title = ?, synced = 1 WHERE id = ?`,
        [
          h.id,
          h.chapterId,
          h.note,
          h.color,
          h.bookTitle,
          h.authorName,
          h.chapterTitle,
          existing.id,
        ],
      );
    } else {
      await db.runAsync(
        `INSERT INTO highlights
          (id, server_id, book_id, chapter_id, excerpt, note, color, book_title, author_name, chapter_title, synced, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          h.id,
          h.id,
          h.bookId,
          h.chapterId,
          h.excerpt,
          h.note,
          h.color,
          h.bookTitle,
          h.authorName,
          h.chapterTitle,
          h.createdAt,
        ],
      );
    }
  }
}
