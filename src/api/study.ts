import { apiClient } from './client';

export interface StudyFolder {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  noteCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyNote {
  id: string;
  title: string;
  body: string;
  folderId: string | null;
  folderName: string | null;
  bookId: string | null;
  chapterId: string | null;
  bookTitle: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  chapterId: string | null;
  excerpt: string;
  note: string | null;
  color: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  authorName: string | null;
  chapterTitle: string | null;
  createdAt: string;
}

export const studyApi = {
  getFolders: (parentId?: string | null) =>
    apiClient.get<{ data: StudyFolder[] }>('/study/folders', {
      params: parentId === undefined ? {} : { parentId: parentId ?? 'null' },
    }),
  createFolder: (body: { name: string; color?: string; parentId?: string }) =>
    apiClient.post<{ data: StudyFolder }>('/study/folders', body),
  deleteFolder: (id: string) => apiClient.delete(`/study/folders/${id}`),

  getStudyBookIds: () => apiClient.get<{ data: { bookIds: string[] } }>('/study/book-ids'),

  getNotes: (params?: { folderId?: string; bookId?: string }) =>
    apiClient.get<{ data: StudyNote[] }>('/study/notes', { params }),
  createNote: (body: {
    title: string;
    body: string;
    folderId?: string;
    bookId?: string;
    chapterId?: string;
  }) => apiClient.post<{ data: StudyNote }>('/study/notes', body),
  updateNote: (
    id: string,
    body: Partial<{ title: string; body: string; folderId: string | null; bookId: string | null }>,
  ) => apiClient.patch<{ data: StudyNote }>(`/study/notes/${id}`, body),
  deleteNote: (id: string) => apiClient.delete(`/study/notes/${id}`),

  getHighlights: (bookId?: string) =>
    apiClient.get<{ data: Highlight[] }>('/study/highlights', { params: bookId ? { bookId } : {} }),
  createHighlight: (body: {
    bookId: string;
    chapterId?: string;
    excerpt: string;
    note?: string;
    color?: string;
  }) => apiClient.post<{ data: Highlight }>('/study/highlights', body),
  deleteHighlight: (id: string) => apiClient.delete(`/study/highlights/${id}`),
};
