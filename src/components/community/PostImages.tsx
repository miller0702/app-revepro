import { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import { PostImageLightbox, type PostImageItem } from './PostImageLightbox';
import type { CommunityPost } from '../../api/community';
import type { PostDraft } from './CreatePostSheet';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { radius, spacing } from '../../theme/tokens';

interface PostImagesProps {
  images: PostImageItem[];
  fullBleed?: boolean;
  post?: CommunityPost;
  onOpenComments?: (post: CommunityPost) => void;
  onShareAsPost?: (draft: PostDraft) => void;
  /** Cierra modales del feed (p. ej. comentarios) al abrir el visor. */
  onLightboxOpen?: () => void;
  /** Notifica al padre cuando el visor se cierra. */
  onLightboxClose?: () => void;
}

export function PostImages({
  images,
  fullBleed,
  post,
  onShareAsPost,
  onLightboxOpen,
  onLightboxClose,
}: PostImagesProps) {
  const items = images.filter((img) => img.url);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!items.length) return null;

  const openAt = (index: number) => {
    onLightboxOpen?.();
    setLightboxIndex(index);
  };
  const closeLightbox = () => {
    setLightboxIndex(null);
    onLightboxClose?.();
  };
  const wrapBleed = fullBleed ? styles.imagesWrapBleed : undefined;

  const lightbox = (
    <PostImageLightbox
      visible={lightboxIndex !== null}
      images={items}
      initialIndex={lightboxIndex ?? 0}
      onClose={closeLightbox}
      post={post}
      onShareAsPost={onShareAsPost}
    />
  );

  if (items.length === 1) {
    return (
      <>
        <View style={[styles.imagesWrap, wrapBleed]}>
          <Pressable onPress={() => openAt(0)} accessibilityRole="button" accessibilityLabel="Ver imagen">
            <AuthenticatedImage
              url={items[0].url}
              style={[styles.singleImage, fullBleed && styles.singleImageBleed]}
              resizeMode="cover"
            />
          </Pressable>
        </View>
        {lightbox}
      </>
    );
  }

  return (
    <>
      <View style={[styles.imagesWrap, wrapBleed]}>
        <View style={styles.imageGrid}>
          {items.slice(0, 4).map((img, index) => {
            const isLast = index === 3 && items.length > 4;
            return (
              <Pressable
                key={img.id}
                onPress={() => openAt(index)}
                style={[
                  styles.gridCell,
                  items.length === 2 && styles.gridHalf,
                  items.length === 3 && index === 0 && styles.gridLarge,
                  items.length === 3 && index > 0 && styles.gridSmall,
                  items.length >= 4 && styles.gridQuarter,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isLast ? `Ver ${items.length} imágenes` : 'Ver imagen'}
              >
                <AuthenticatedImage url={img.url} style={styles.gridImageFill} resizeMode="cover" />
                {isLast && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{items.length - 3}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
      {lightbox}
    </>
  );
}

const styles = StyleSheet.create({
  imagesWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imagesWrapBleed: {
    marginHorizontal: -SCREEN_PADDING_X,
    borderRadius: 0,
  },
  singleImage: { width: '100%', height: 280, borderRadius: radius.md },
  singleImageBleed: { borderRadius: 0, height: 320 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridCell: { overflow: 'hidden', borderRadius: radius.sm, position: 'relative' },
  gridImageFill: { width: '100%', height: '100%' },
  gridHalf: { width: '49.5%', height: 180 },
  gridLarge: { width: '100%', height: 220, marginBottom: 2 },
  gridSmall: { width: '49.5%', height: 120 },
  gridQuarter: { width: '49.5%', height: 160 },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { color: '#fff', fontSize: 28, fontWeight: '700' },
});
