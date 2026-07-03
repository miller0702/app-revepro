import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getRecentAudiobooks,
  getRecentPodcasts,
  getRecentVideos,
  type RecentAudiobook,
  type RecentPodcast,
  type RecentVideo,
} from '../storage/recentContent';

function useRecentList<T>(loader: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);

  const refresh = useCallback(async () => {
    setItems(await loader());
  }, [loader]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { items, count: items.length, refresh };
}

export function useRecentVideos() {
  return useRecentList<RecentVideo>(getRecentVideos);
}

export function useRecentPodcasts() {
  return useRecentList<RecentPodcast>(getRecentPodcasts);
}

export function useRecentAudiobooks() {
  return useRecentList<RecentAudiobook>(getRecentAudiobooks);
}
