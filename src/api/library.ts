import { apiClient } from './client';

export type ContentKind = 'BOOK' | 'PODCAST' | 'VIDEO';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  kind: ContentKind;
  sortOrder: number;
}

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bookCount?: number;
}

export interface BookListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  isAudiobook?: boolean;
  audioUrl?: string | null;
  coverUrl?: string | null;
  author?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
}

export type FavoriteTargetType = 'BOOK' | 'PODCAST' | 'VIDEO' | 'POST';

export interface FavoriteBookItem {
  id: string;
  targetId: string;
  createdAt: string;
  item: BookListItem;
}

export interface FavoritePodcastItem {
  id: string;
  targetId: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverUrl?: string | null;
    authorName?: string | null;
    episodeCount: number;
  };
}

export interface FavoriteVideoItem {
  id: string;
  targetId: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    durationSec?: number | null;
    viewCount: number;
    categoryName?: string | null;
  };
}

export interface FavoritePostItem {
  id: string;
  targetId: string;
  createdAt: string;
  item: {
    id: string;
    kind: string;
    body: string;
    quoteExcerpt?: string | null;
    bookId?: string | null;
    book?: { id: string; title: string; coverUrl?: string | null } | null;
    videoId?: string | null;
    video?: { id: string; title: string; thumbnailUrl?: string | null } | null;
    podcastSeriesId?: string | null;
    podcast?: { id: string; title: string; coverUrl?: string | null; authorName?: string | null } | null;
    images?: Array<{ id: string; url: string | null }>;
    author: { firstName: string; lastName: string; username: string };
    createdAt?: string;
  };
}

export interface GroupedFavorites {
  books: FavoriteBookItem[];
  audiobooks: FavoriteBookItem[];
  podcasts: FavoritePodcastItem[];
  videos: FavoriteVideoItem[];
  posts: FavoritePostItem[];
}

export interface CollectionDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bookCount?: number;
  books: Array<{
    sortOrder: number;
    book: {
      id: string;
      title: string;
      slug: string;
      summary?: string | null;
      author?: { id: string; name: string } | null;
    };
  }>;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const libraryApi = {
  getBooks: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    collectionId?: string;
    excludeCategorySlug?: string;
    isAudiobook?: boolean;
    ids?: string;
  }) =>
    apiClient.get<{ data: BookListItem[]; meta: PaginatedMeta }>('/books', { params }),
  getBook: (id: string) => apiClient.get(`/books/${id}`),
  getCategories: (kind?: ContentKind) =>
    apiClient.get<{ data: CategoryItem[] }>('/categories', { params: kind ? { kind } : undefined }),
  getCollections: () => apiClient.get<{ data: CollectionItem[] }>('/collections'),
  getCollection: (id: string) => apiClient.get<{ data: CollectionDetail }>(`/collections/${id}`),
  getAuthors: () => apiClient.get('/authors'),
  getFavorites: () => apiClient.get<{ data: GroupedFavorites }>('/favorites'),
  addFavorite: (targetType: FavoriteTargetType, targetId: string) =>
    apiClient.post('/favorites', { targetType, targetId }),
  removeFavorite: (targetType: FavoriteTargetType, targetId: string) =>
    apiClient.delete(`/favorites/${targetType}/${targetId}`),
};
