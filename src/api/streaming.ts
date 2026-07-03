import { apiClient } from './client';

export interface PodcastSeriesSummary {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  author?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  categoryId?: string | null;
  coverUrl?: string | null;
  episodeCount: number;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  order: number;
  durationSec?: number | null;
  audioUrl?: string | null;
  publishedAt?: string | null;
}

export interface VideoItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  durationSec?: number | null;
  viewCount: number;
  publishedAt?: string | null;
  category?: { id: string; name: string } | null;
  sourceType?: 'DIRECT' | 'YOUTUBE';
  youtubeVideoId?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
}

export interface RadioStation {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  streamUrl: string;
  coverUrl?: string | null;
  isLive: boolean;
}

export const streamingApi = {
  getPodcastSeries: (params?: { categoryId?: string }) =>
    apiClient.get<{ data: PodcastSeriesSummary[] }>('/podcasts/series', { params }),
  getPodcastSeriesDetail: (id: string) =>
    apiClient.get<{ data: PodcastSeriesSummary & { episodes: PodcastEpisode[] } }>(
      `/podcasts/series/${id}`,
    ),
  getVideos: (params?: { categoryId?: string }) =>
    apiClient.get<{ data: VideoItem[] }>('/videos', { params }),
  getVideo: (id: string) => apiClient.get<{ data: VideoItem }>(`/videos/${id}`),
  getRadioStations: () => apiClient.get<{ data: RadioStation[] }>('/radio/stations'),
};
