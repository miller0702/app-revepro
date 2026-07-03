import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import { AppIcon } from '../ui/AppIcon';
import type { CommunityPost } from '../../api/community';
import { radius, spacing } from '../../theme/tokens';

export type ContentRefType = 'BOOK' | 'VIDEO' | 'PODCAST';

export interface ContentRefPreview {
  type: ContentRefType;
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
}

function typeLabel(type: ContentRefType): string {
  switch (type) {
    case 'BOOK':
      return 'Libro';
    case 'VIDEO':
      return 'Video';
    case 'PODCAST':
      return 'Podcast';
  }
}

function typeIcon(type: ContentRefType): 'library' | 'play' | 'audio' {
  switch (type) {
    case 'BOOK':
      return 'library';
    case 'VIDEO':
      return 'play';
    case 'PODCAST':
      return 'audio';
  }
}

function routeFor(ref: ContentRefPreview): string {
  switch (ref.type) {
    case 'BOOK':
      return `/book/${ref.id}`;
    case 'VIDEO':
      return `/video/${ref.id}`;
    case 'PODCAST':
      return `/podcast/${ref.id}`;
  }
}

export function contentRefFromPost(post: CommunityPost): ContentRefPreview | null {
  if (post.book) {
    return {
      type: 'BOOK',
      id: post.book.id,
      title: post.book.title,
      imageUrl: post.book.coverUrl,
    };
  }
  if (post.video) {
    return {
      type: 'VIDEO',
      id: post.video.id,
      title: post.video.title,
      imageUrl: post.video.thumbnailUrl,
    };
  }
  if (post.podcast) {
    return {
      type: 'PODCAST',
      id: post.podcast.id,
      title: post.podcast.title,
      subtitle: post.podcast.authorName,
      imageUrl: post.podcast.coverUrl,
    };
  }
  return null;
}

interface ContentRefCardProps {
  contentRef: ContentRefPreview;
  onPress?: () => void;
  /** Si es false, solo muestra la tarjeta sin navegación (p. ej. en el compositor). */
  interactive?: boolean;
}

export function ContentRefCard({ contentRef, onPress, interactive = true }: ContentRefCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (!interactive) return;
    if (onPress) {
      onPress();
      return;
    }
    router.push(routeFor(contentRef) as never);
  };

  const Wrapper = interactive ? Pressable : View;

  return (
    <Wrapper
      onPress={interactive ? handlePress : undefined}
      style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={
        interactive ? `Abrir ${typeLabel(contentRef.type)}: ${contentRef.title}` : undefined
      }
    >
      <View style={[styles.cover, { backgroundColor: colors.primary }]}>
        {contentRef.imageUrl ? (
          <AuthenticatedImage url={contentRef.imageUrl} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <AppIcon name={typeIcon(contentRef.type)} size={22} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{typeLabel(contentRef.type)}</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {contentRef.title}
        </Text>
        {contentRef.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {contentRef.subtitle}
          </Text>
        ) : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  subtitle: { fontSize: 13, marginTop: 2 },
});
