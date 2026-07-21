/** Miniatura por defecto de YouTube (hq). */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Resuelve la mejor miniatura disponible:
 * 1) thumbnailUrl de la API
 * 2) miniatura YouTube si hay videoId
 */
export function resolveVideoThumbnailUrl(video: {
  thumbnailUrl?: string | null;
  youtubeVideoId?: string | null;
  sourceType?: 'DIRECT' | 'YOUTUBE' | null;
}): string | null {
  const fromApi = video.thumbnailUrl?.trim();
  if (fromApi) return fromApi;

  const ytId = video.youtubeVideoId?.trim();
  if (ytId) return youtubeThumbnailUrl(ytId);

  return null;
}
