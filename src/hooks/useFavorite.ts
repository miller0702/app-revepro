import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryApi, type FavoriteTargetType } from '../api/library';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await libraryApi.getFavorites()).data.data,
  });
}

export function useIsFavorite(targetType: FavoriteTargetType, targetId: string | undefined) {
  const { data } = useFavorites();
  if (!targetId || !data) return false;

  switch (targetType) {
    case 'BOOK':
      return (
        data.books.some((f) => f.targetId === targetId) ||
        data.audiobooks.some((f) => f.targetId === targetId)
      );
    case 'PODCAST':
      return data.podcasts.some((f) => f.targetId === targetId);
    case 'VIDEO':
      return data.videos.some((f) => f.targetId === targetId);
    case 'POST':
      return data.posts.some((f) => f.targetId === targetId);
    default:
      return false;
  }
}

export function useFavoriteToggle(targetType: FavoriteTargetType, targetId: string | undefined) {
  const queryClient = useQueryClient();
  const isFavorite = useIsFavorite(targetType, targetId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!targetId) return;
      if (isFavorite) {
        await libraryApi.removeFavorite(targetType, targetId);
      } else {
        await libraryApi.addFavorite(targetType, targetId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return { isFavorite, toggle: () => mutation.mutate(), isPending: mutation.isPending };
}
