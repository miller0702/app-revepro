import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../ui/UserAvatar';
import { useOpenUserProfile } from '../../hooks/useOpenUserProfile';
import type { CommunityComment } from '../../api/community';
import { ReportContentSheet } from './ReportContentSheet';
import { buildPostDeepLink } from '../../utils/postImageActions';
import { spacing } from '../../theme/tokens';

export function buildCommentThread(comments: CommunityComment[]) {
  const byParent = new Map<string | null, CommunityComment[]>();
  for (const c of comments) {
    const key = c.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  }

  const renderBranch = (
    parentId: string | null,
    depth = 0,
  ): Array<{ comment: CommunityComment; depth: number }> => {
    const items = byParent.get(parentId) ?? [];
    const out: Array<{ comment: CommunityComment; depth: number }> = [];
    for (const item of items) {
      out.push({ comment: item, depth });
      out.push(...renderBranch(item.id, depth + 1));
    }
    return out;
  };

  return renderBranch(null);
}

export function PostCommentRow({
  comment,
  depth,
  onReply,
  postId,
}: {
  comment: CommunityComment;
  depth: number;
  onReply: (comment: CommunityComment) => void;
  postId?: string;
}) {
  const { colors } = useTheme();
  const openUserProfile = useOpenUserProfile();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <View style={[styles.comment, { marginLeft: depth * 28, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => openUserProfile(comment.author.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${comment.author.firstName}`}
        >
          <UserAvatar
            firstName={comment.author.firstName}
            lastName={comment.author.lastName}
            avatarUrl={comment.author.avatarUrl}
            size={32}
          />
        </Pressable>
        <View style={styles.commentBody}>
          <Pressable onPress={() => openUserProfile(comment.author.id)} hitSlop={4}>
            <Text style={[styles.commentAuthor, { color: colors.text }]}>
              {comment.author.firstName} {comment.author.lastName}
            </Text>
          </Pressable>
          <Text style={[styles.commentText, { color: colors.text }]}>{comment.body}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => onReply(comment)} hitSlop={8} style={styles.replyBtn}>
              <Text style={[styles.replyText, { color: colors.textSecondary }]}>Responder</Text>
            </Pressable>
            <Pressable onPress={() => setReportOpen(true)} hitSlop={8} style={styles.replyBtn}>
              <Text style={[styles.replyText, { color: colors.textSecondary }]}>Reportar</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ReportContentSheet
        visible={reportOpen}
        targetType="COMMENT"
        targetId={comment.id}
        contextUrl={postId ? buildPostDeepLink(postId) : undefined}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}

export function useCommentThread(comments: CommunityComment[] | undefined) {
  return useMemo(() => buildCommentThread(comments ?? []), [comments]);
}

const styles = StyleSheet.create({
  comment: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentText: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: 6 },
  replyBtn: { alignSelf: 'flex-start' },
  replyText: { fontSize: 12, fontWeight: '600' },
});
