import { useQuery } from '@tanstack/react-query';
import { libraryApi, type ContentKind, type CategoryItem, type CollectionItem } from '../api/library';
import type { FilterOption } from '../components/ui/ContentFilterBar';

const FILTERS_STALE_MS = 10 * 60_000;

function toOptions(items: { id: string; name: string }[]): FilterOption[] {
  return items.map((item) => ({ id: item.id, label: item.name }));
}

export function useBookFilters() {
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'BOOK'],
    queryFn: async () => (await libraryApi.getCategories('BOOK')).data.data,
    staleTime: FILTERS_STALE_MS,
    gcTime: 30 * 60_000,
  });

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => (await libraryApi.getCollections()).data.data,
    staleTime: FILTERS_STALE_MS,
    gcTime: 30 * 60_000,
  });

  return {
    categories: toOptions(categoriesQuery.data ?? []),
    collections: toOptions(collectionsQuery.data ?? []),
    isLoading: categoriesQuery.isLoading || collectionsQuery.isLoading,
    rawCategories: categoriesQuery.data ?? ([] as CategoryItem[]),
    rawCollections: collectionsQuery.data ?? ([] as CollectionItem[]),
  };
}

export function useCategoryFilters(kind: ContentKind) {
  const categoriesQuery = useQuery({
    queryKey: ['categories', kind],
    queryFn: async () => (await libraryApi.getCategories(kind)).data.data,
  });

  return {
    categories: toOptions(categoriesQuery.data ?? []),
    isLoading: categoriesQuery.isLoading,
  };
}
