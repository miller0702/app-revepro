import { streamingApi } from '../api/streaming';
import type { PlayerTrack } from '../stores/playerStore';

export async function fetchFirstPlayableEpisode(seriesId: string) {
  const res = await streamingApi.getPodcastSeriesDetail(seriesId);
  const series = res.data.data;
  const episode = series.episodes.find((ep) => ep.audioUrl);
  if (!episode?.audioUrl) return null;

  return {
    episode,
    track: {
      id: episode.id,
      title: episode.title,
      subtitle: series.title,
      url: episode.audioUrl,
      kind: 'podcast' as const,
    } satisfies PlayerTrack,
  };
}
