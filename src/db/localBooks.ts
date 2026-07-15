import { getDatabase } from './database';

export type LocalBookChapter = {
  id: string;
  title: string;
  order: number;
  content: string;
};

export type LocalBookDetail = {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  coverUrl?: string | null;
  author?: { name: string } | null;
  chapters: LocalBookChapter[];
  isOffline: true;
};

export async function getLocalBookDetail(bookId: string): Promise<LocalBookDetail | null> {
  const db = await getDatabase();
  const book = await db.getFirstAsync<{
    id: string;
    title: string;
    slug: string | null;
    summary: string | null;
    author_name: string | null;
    cover_url: string | null;
  }>('SELECT * FROM books WHERE id = ?', [bookId]);

  if (!book) return null;

  const chapters = await db.getAllAsync<{
    id: string;
    title: string;
    order: number;
    content: string | null;
  }>('SELECT id, title, "order", content FROM chapters WHERE book_id = ? ORDER BY "order" ASC', [
    bookId,
  ]);

  if (chapters.length === 0) return null;

  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    summary: book.summary,
    coverUrl: book.cover_url,
    author: book.author_name ? { name: book.author_name } : null,
    chapters: chapters.map((c) => ({
      id: c.id,
      title: c.title,
      order: c.order,
      content: c.content ?? '',
    })),
    isOffline: true,
  };
}

export async function hasLocalBookChapters(bookId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM chapters WHERE book_id = ? AND content IS NOT NULL AND trim(content) != ""',
    [bookId],
  );
  return (row?.n ?? 0) > 0;
}
