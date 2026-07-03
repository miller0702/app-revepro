import type { FavoritePostItem } from '../api/library';

type FavoritePost = FavoritePostItem['item'];

/** Imagen de vista previa: foto de la publi > portada del contenido compartido. */
export function getFavoritePostPreviewUrl(post: FavoritePost): string | null {
  const postImage = post.images?.find((img) => img.url)?.url;
  if (postImage) return postImage;

  if (post.book?.coverUrl) return post.book.coverUrl;
  if (post.video?.thumbnailUrl) return post.video.thumbnailUrl;
  if (post.podcast?.coverUrl) return post.podcast.coverUrl;

  return null;
}

export function favoritePostHasPreview(post: FavoritePost): boolean {
  return getFavoritePostPreviewUrl(post) != null;
}
