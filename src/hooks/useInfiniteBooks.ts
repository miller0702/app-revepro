import { useInfiniteQuery } from '@tanstack/react-query';
import { libraryApi, type BookListItem } from '../api/library';
import { BOOKS_PAGE_SIZE } from '../config/library';

const BOOKS_STALE_MS = 5 * 60_000;

export interface BooksPage {
  data: BookListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type BooksQueryParams = {
  categoryId?: string;
  collectionId?: string;
  excludeCategorySlug?: string;
  isAudiobook?: boolean;
  search?: string;
  limit?: number;
};

async function fetchBooksPage(page: number, params: BooksQueryParams): Promise<BooksPage> {
  const res = await libraryApi.getBooks({ ...params, page, limit: params.limit ?? BOOKS_PAGE_SIZE });
  return {
    data: res.data.data as BookListItem[],
    meta: res.data.meta,
  };
}

export function useInfiniteBooks(params: BooksQueryParams, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: [
      'books',
      'infinite',
      params.categoryId ?? null,
      params.collectionId ?? null,
      params.excludeCategorySlug ?? null,
      params.isAudiobook ?? null,
      params.search ?? null,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchBooksPage(pageParam, params),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
    staleTime: BOOKS_STALE_MS,
    gcTime: 30 * 60_000,
  });

  const books = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return {
    ...query,
    books,
    total,
  };
}
