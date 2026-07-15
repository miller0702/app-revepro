export const DB_NAME = 'egw_offline.db';

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  summary TEXT,
  author_name TEXT,
  cover_url TEXT,
  synced INTEGER DEFAULT 1,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  content TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  position REAL DEFAULT 0,
  note TEXT,
  synced INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS reading_progress (
  book_id TEXT PRIMARY KEY NOT NULL,
  chapter_id TEXT,
  percentage REAL DEFAULT 0,
  synced INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS download_queue (
  book_id TEXT PRIMARY KEY NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS chapter_completion (
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (book_id, chapter_id)
);

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
