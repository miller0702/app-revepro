import { memo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../ui/UserAvatar';
import { AppIcon } from '../ui/AppIcon';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import { FavoriteToggle } from '../ui/FavoriteToggle';
import { PostImages } from './PostImages';
import { PostActions } from './PostActions';
import { ContentRefCard, contentRefFromPost } from './ContentRefCard';
import type { CommunityPost } from '../../api/community';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { radius, spacing, typography } from '../../theme/tokens';

import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { PostMoreOptionsSheet } from './PostMoreOptionsSheet';
import { useOpenUserProfile } from '../../hooks/useOpenUserProfile';
import type { PostDraft } from './CreatePostSheet';

interface FeedPostCardProps {
  post: CommunityPost;
  onOpenComments: (post: CommunityPost) => void;
  onShareAsPost?: (draft: PostDraft) => void;
  onLightboxOpen?: () => void;
  onLightboxClose?: () => void;
  /** Si es false, no navega al detalle (p. ej. en pantalla de detalle). */
  interactive?: boolean;
  /** `feed` = filas con separador; `card` = tarjeta con borde (detalle). */
  variant?: 'feed' | 'card';
}

function PostBodyContent({
  post,
  isQuote,
  quoteText,
  images,
  fullBleedImages,
  onShareAsPost,
  onLightboxOpen,
  onLightboxClose,
}: {
  post: CommunityPost;
  isQuote: boolean;
  quoteText: string | null;
  images: CommunityPost['images'];
  fullBleedImages?: boolean;
  onShareAsPost?: (draft: PostDraft) => void;
  onLightboxOpen?: () => void;
  onLightboxClose?: () => void;
}) {
  const { colors, scaleFont } = useTheme();

  if (isQuote && post.book?.coverUrl) {
    return (
      <View style={styles.quoteBlock}>
        <AuthenticatedImage url={post.book?.coverUrl} style={styles.quoteCover} resizeMode="cover" />
        <View style={styles.quoteContent}>
          {post.book && (
            <Text
              style={[styles.quoteBook, { color: colors.textSecondary, fontSize: scaleFont(12) }]}
              numberOfLines={1}
            >
              {post.book.title}
            </Text>
          )}
          <Text
            style={[
              styles.quoteText,
              { color: colors.text, fontSize: scaleFont(15), lineHeight: scaleFont(22) },
            ]}
          >
            "{quoteText}"
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Text style={[styles.body, { color: colors.text, fontSize: scaleFont(15), lineHeight: scaleFont(22) }]}>
        {post.body}
      </Text>
      {images.length > 0 && (
        <PostImages
          images={images}
          fullBleed={fullBleedImages}
          post={post}
          onShareAsPost={onShareAsPost}
          onLightboxOpen={onLightboxOpen}
          onLightboxClose={onLightboxClose}
        />
      )}
    </>
  );
}

function FeedPostCardInner({
  post,
  onOpenComments,
  onShareAsPost,
  onLightboxOpen,
  onLightboxClose,
  interactive = true,
  variant = 'feed',
}: FeedPostCardProps) {
  const { colors, scaleFont } = useTheme();
  const router = useRouter();
  const openUserProfile = useOpenUserProfile();
  const [moreOpen, setMoreOpen] = useState(false);
  const isFeed = variant === 'feed';
  const images = post.images ?? [];
  const mentions = post.mentions ?? [];
  const tags = post.tags ?? [];
  const isQuote = (post.kind ?? 'GENERAL') === 'QUOTE';
  const quoteText = post.quoteExcerpt || (isQuote ? post.body : null);
  const repostOriginal = post.repostOf;
  const isRepost = Boolean(repostOriginal);

  const openPost = () => {
    if (interactive) router.push(`/post/${post.id}`);
  };

  const openOriginalPost = () => {
    if (repostOriginal) router.push(`/post/${repostOriginal.id}`);
  };

  const openTag = (tag: string) => {
    router.push({ pathname: '/feed', params: { tag } });
  };

  const openAuthorProfile = () => {
    openUserProfile(post.author.id);
  };

  const openMentionProfile = (userId: string) => {
    openUserProfile(userId);
  };

  return (
    <View
      style={[
        isFeed ? styles.feedRow : styles.card,
        isFeed
          ? { borderBottomColor: colors.border, backgroundColor: colors.background }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={openAuthorProfile}
          style={styles.headerPressable}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${post.author.firstName}`}
        >
          <UserAvatar
            firstName={post.author.firstName}
            lastName={post.author.lastName}
            avatarUrl={post.author.avatarUrl}
            size={40}
          />
          <View style={styles.headerText}>
            <Text style={[styles.authorName, { color: colors.text, fontSize: scaleFont(15) }]}>
              {post.author.firstName} {post.author.lastName}
              {post.author.isOfficial || post.kind === 'ANNOUNCEMENT' ? (
                <Text style={[styles.officialBadge, { color: colors.primary, fontSize: scaleFont(12) }]}>
                  {' '}
                  · Oficial
                </Text>
              ) : null}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              @{post.author.username} · {formatRelativeTime(post.createdAt)}
              {post.kind === 'ANNOUNCEMENT' ? ' · Actualización' : isQuote ? ' · Cita' : ''}
            </Text>
          </View>
        </Pressable>
        <FavoriteToggle targetType="POST" targetId={post.id} size={22} />
        <Pressable
          onPress={() => setMoreOpen(true)}
          style={styles.moreBtn}
          accessibilityRole="button"
          accessibilityLabel="Más opciones de la publicación"
        >
          <AppIcon name="more" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Pressable onPress={openPost} disabled={!interactive}>
        {isRepost && repostOriginal && (
          <View style={styles.repostLabelRow}>
            <AppIcon name="share" size={14} color={colors.textSecondary} />
            <Text style={[styles.repostLabel, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              Reposteó
            </Text>
          </View>
        )}

        {isRepost && post.body.trim() ? (
          <Text
            style={[
              styles.body,
              { color: colors.text, marginBottom: spacing.sm, fontSize: scaleFont(15), lineHeight: scaleFont(22) },
            ]}
          >
            {post.body}
          </Text>
        ) : null}

        {!isRepost && (
          <PostBodyContent
            post={post}
            isQuote={isQuote}
            quoteText={quoteText}
            images={images}
            fullBleedImages={isFeed}
            onShareAsPost={onShareAsPost}
            onLightboxOpen={onLightboxOpen}
            onLightboxClose={onLightboxClose}
          />
        )}

        {(tags.length > 0 || mentions.length > 0) && (
          <View style={styles.tags}>
            {mentions.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => openMentionProfile(m.id)}
                style={[styles.mentionTag, { backgroundColor: colors.primary + '22' }]}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${m.username}`}
              >
                <Text style={[styles.mentionText, { color: colors.primaryDark, fontSize: scaleFont(12) }]}>
                  @{m.username}
                </Text>
              </Pressable>
            ))}
            {tags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => openTag(tag)}
                style={[styles.tag, { backgroundColor: colors.accentSoft }]}
                accessibilityRole="button"
                accessibilityLabel={`Ver publicaciones con ${tag}`}
              >
                <Text style={[styles.tagText, { color: colors.accent, fontSize: scaleFont(12) }]}>#{tag}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {(() => {
          const contentRef = contentRefFromPost(post);
          if (!contentRef || isRepost) return null;
          return <ContentRefCard contentRef={contentRef} />;
        })()}
      </Pressable>

      {isRepost && repostOriginal && (
        <Pressable
          onPress={openOriginalPost}
          style={[styles.repostCard, { borderColor: colors.border, backgroundColor: colors.background }]}
          accessibilityRole="button"
          accessibilityLabel="Ver publicación original"
        >
          <View style={styles.repostInnerHeader}>
            <Pressable
              onPress={() => openUserProfile(repostOriginal.author.id)}
              style={styles.repostInnerHeaderPressable}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${repostOriginal.author.firstName}`}
            >
              <UserAvatar
                firstName={repostOriginal.author.firstName}
                lastName={repostOriginal.author.lastName}
                avatarUrl={repostOriginal.author.avatarUrl}
                size={36}
              />
              <View style={styles.repostInnerHeaderText}>
                <Text style={[styles.repostInnerAuthor, { color: colors.text }]}>
                  {repostOriginal.author.firstName} {repostOriginal.author.lastName}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  @{repostOriginal.author.username}
                  {repostOriginal.createdAt
                    ? ` · ${formatRelativeTime(repostOriginal.createdAt)}`
                    : ''}
                </Text>
              </View>
            </Pressable>
          </View>
          <PostBodyContent
            post={{
              ...post,
              body: repostOriginal.body,
              author: repostOriginal.author,
              book: repostOriginal.book,
              video: repostOriginal.video,
              podcast: repostOriginal.podcast,
              kind: repostOriginal.kind as CommunityPost['kind'],
              quoteExcerpt: repostOriginal.quoteExcerpt,
              images: repostOriginal.images,
              createdAt: repostOriginal.createdAt ?? post.createdAt,
            }}
            isQuote={(repostOriginal.kind ?? 'GENERAL') === 'QUOTE'}
            quoteText={repostOriginal.quoteExcerpt || repostOriginal.body}
            images={repostOriginal.images ?? []}
            fullBleedImages={false}
            onShareAsPost={onShareAsPost}
            onLightboxOpen={onLightboxOpen}
            onLightboxClose={onLightboxClose}
          />
          {(() => {
            const repostRef = contentRefFromPost({
              book: repostOriginal.book,
              video: repostOriginal.video,
              podcast: repostOriginal.podcast,
            } as CommunityPost);
            if (!repostRef) return null;
            return <ContentRefCard contentRef={repostRef} />;
          })()}
        </Pressable>
      )}

      <PostActions post={post} onOpenComments={onOpenComments} />
      <PostMoreOptionsSheet visible={moreOpen} post={post} onClose={() => setMoreOpen(false)} />
    </View>
  );
}

function areFeedPostPropsEqual(prev: FeedPostCardProps, next: FeedPostCardProps): boolean {
  if (prev.variant !== next.variant || prev.interactive !== next.interactive) return false;
  if (prev.onOpenComments !== next.onOpenComments) return false;
  if (prev.onLightboxOpen !== next.onLightboxOpen) return false;
  if (prev.onLightboxClose !== next.onLightboxClose) return false;
  if (prev.post.id !== next.post.id) return false;
  if (prev.post.commentCount !== next.post.commentCount) return false;
  if (prev.post.myReaction !== next.post.myReaction) return false;
  if (prev.post.repostCount !== next.post.repostCount) return false;
  if (prev.post.body !== next.post.body) return false;
  const prevCounts = prev.post.reactionCounts;
  const nextCounts = next.post.reactionCounts;
  if (prevCounts !== nextCounts) {
    if (!prevCounts || !nextCounts) return false;
    for (const key of Object.keys(prevCounts) as Array<keyof typeof prevCounts>) {
      if (prevCounts[key] !== nextCounts[key]) return false;
    }
  }
  return true;
}

export const FeedPostCard = memo(FeedPostCardInner, areFeedPostPropsEqual);

const styles = StyleSheet.create({
  feedRow: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  headerPressable: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: spacing.sm },
  moreBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  authorName: { fontSize: 15, fontWeight: '700' },
  officialBadge: { fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  body: { fontSize: 15, lineHeight: 22 },
  repostLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  repostLabel: { fontSize: 12, fontWeight: '600' },
  repostCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  repostInnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  repostInnerHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  repostInnerHeaderText: { flex: 1, marginLeft: spacing.sm },
  repostInnerAuthor: { fontSize: 14, fontWeight: '700' },
  quoteBlock: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quoteCover: { width: 72, height: 96, borderRadius: radius.md },
  quoteContent: { flex: 1, justifyContent: 'center' },
  quoteBook: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  quoteText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  tagText: { fontSize: 12, fontWeight: '600' },
  mentionTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  mentionText: { fontSize: 12, fontWeight: '600' },
  bookRef: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bookCover: {
    width: 44,
    height: 56,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookLetter: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bookInfo: { flex: 1, marginLeft: spacing.sm },
  bookLabel: { ...typography.label, fontSize: 11 },
  bookTitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
});
