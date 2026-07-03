import { useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { communityApi, type CommunityComment } from '../../src/api/community';
import { FeedPostCard } from '../../src/components/community/FeedPostCard';
import { FeedPostSkeleton } from '../../src/components/skeletons/ContentSkeletons';
import { PostCommentComposer } from '../../src/components/community/PostCommentComposer';
import { PostCommentRow, useCommentThread } from '../../src/components/community/PostCommentRow';
import { CommentListSkeleton } from '../../src/components/skeletons/ContentSkeletons';
import { ensurePostReactionFields } from '../../src/utils/communityFeedCache';
import { useTheme } from '../../src/hooks/useTheme';
import { typography, spacing } from '../../src/theme/tokens';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: post, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['community-post', id],
    queryFn: async () => {
      const res = await communityApi.getPost(id!);
      return ensurePostReactionFields(res.data.data);
    },
    enabled: !!id,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['community-comments', id],
    queryFn: async () => (await communityApi.getComments(id!)).data.data,
    enabled: !!id,
  });

  const thread = useCommentThread(comments);

  if (isLoading || !post) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {isLoading ? <FeedPostSkeleton /> : (
          <Text style={{ color: colors.textSecondary }}>Publicación no encontrada</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={commentsLoading ? [] : thread}
        keyExtractor={(item) => item.comment.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <FeedPostCard
              post={post}
              onOpenComments={() => undefined}
              onLightboxOpen={() => setLightboxOpen(true)}
              onLightboxClose={() => setLightboxOpen(false)}
              interactive={false}
              variant="feed"
            />
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>
                Comentarios {post.commentCount > 0 ? `(${post.commentCount})` : ''}
              </Text>
            </View>
            {commentsLoading ? <CommentListSkeleton count={3} /> : null}
            {!commentsLoading && thread.length === 0 ? (
              <Text style={[styles.emptyComments, { color: colors.textSecondary }]}>
                Sé el primero en comentar.
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <PostCommentRow
            comment={item.comment}
            depth={item.depth}
            onReply={setReplyTo}
            postId={post.id}
          />
        )}
      />

      {!lightboxOpen ? (
        <PostCommentComposer
          postId={post.id}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  listContent: { paddingBottom: spacing.md },
  commentsHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  commentsTitle: { ...typography.title, fontSize: 16 },
  emptyComments: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
});
