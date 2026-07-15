import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { UserAvatar } from '../ui/UserAvatar';
import { AppIcon } from '../ui/AppIcon';
import { EmbeddedBottomSheet } from '../ui/EmbeddedBottomSheet';
import { ModalCloseHeader, ModalSafeScreen } from '../ui/ModalSafeScreen';
import { communityApi, type CommunityComment, type CommunityPost } from '../../api/community';
import { useOpenUserProfile } from '../../hooks/useOpenUserProfile';
import { bumpCommentCount, restoreFeedQueries, snapshotFeedQueries, updatePostInFeedCache } from '../../utils/communityFeedCache';
import { CommentListSkeleton } from '../skeletons/ContentSkeletons';
import { spacing } from '../../theme/tokens';

interface PostCommentsSheetProps {
  post: CommunityPost | null;
  onClose: () => void;
  embedded?: boolean;
  visible?: boolean;
}

function buildThread(comments: CommunityComment[]) {
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

function CommentRow({
  comment,
  depth,
  onReply,
}: {
  comment: CommunityComment;
  depth: number;
  onReply: (comment: CommunityComment) => void;
}) {
  const { colors } = useTheme();
  const openUserProfile = useOpenUserProfile();

  return (
    <View style={[styles.comment, { marginLeft: depth * 28, borderBottomColor: colors.border }]}>
      <Pressable onPress={() => openUserProfile(comment.author.id)} accessibilityRole="button">
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
        <Pressable onPress={() => onReply(comment)} hitSlop={8} style={styles.replyBtn}>
          <Text style={[styles.replyText, { color: colors.textSecondary }]}>Responder</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PostCommentsSheet({ post, onClose, embedded = false, visible }: PostCommentsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);

  const isOpen = embedded ? !!visible && !!post : !!post;

  const { data: comments, isLoading } = useQuery({
    queryKey: ['community-comments', post?.id],
    queryFn: async () => (await communityApi.getComments(post!.id)).data.data,
    enabled: isOpen && !!post,
  });

  const thread = useMemo(() => buildThread(comments ?? []), [comments]);

  useEffect(() => {
    if (!isOpen) {
      setComment('');
      setReplyTo(null);
      Keyboard.dismiss();
    }
  }, [isOpen]);

  const addMutation = useMutation({
    mutationFn: (payload: { body: string; parentId?: string }) =>
      communityApi.addComment(post!.id, payload.body, payload.parentId),
    onMutate: async () => {
      if (!post) return;
      await queryClient.cancelQueries({ queryKey: ['community-posts'] });
      const snapshots = snapshotFeedQueries(queryClient);
      updatePostInFeedCache(queryClient, post.id, (p) => bumpCommentCount(p));
      return { snapshots };
    },
    onError: (_err, _body, context) => {
      if (context?.snapshots) {
        restoreFeedQueries(queryClient, context.snapshots);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-comments', post?.id] });
      setComment('');
      setReplyTo(null);
    },
  });

  const submit = () => {
    const text = comment.trim();
    if (!text) return;
    addMutation.mutate({ body: text, parentId: replyTo?.id });
  };

  const keyboardOpen = keyboardHeight > 0;
  /**
   * iOS necesita levantar el compositor con la altura del teclado.
   * En Android `softwareKeyboardLayoutMode=resize` ya reduce la ventana:
   * sumar keyboardHeight aquí sube la caja de más (peor en tablets).
   */
  const composerLift = Platform.OS === 'ios' && keyboardOpen ? keyboardHeight : 0;
  const composerBottomPad = keyboardOpen
    ? spacing.sm
    : Math.max(insets.bottom, embedded ? spacing.sm : spacing.lg);

  const composer = (
    <View
      style={[
        styles.composer,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          paddingBottom: composerBottomPad,
          marginBottom: composerLift,
        },
      ]}
    >
      {replyTo && (
        <View style={styles.replyingBar}>
          <Text style={[styles.replyingText, { color: colors.textSecondary }]}>
            Respondiendo a @{replyTo.author.username}
          </Text>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
            <AppIcon name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}
      <View style={styles.composerRow}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={replyTo ? 'Escribe una respuesta...' : 'Escribe un comentario...'}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          multiline
          maxLength={2000}
          textAlignVertical="center"
          blurOnSubmit={false}
          returnKeyType="default"
        />
        <Pressable
          onPress={submit}
          disabled={!comment.trim() || addMutation.isPending}
          style={styles.sendBtn}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentario"
        >
          <AppIcon
            name="send"
            size={22}
            color={comment.trim() ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );

  const list = (
    <>
      {isLoading ? <CommentListSkeleton /> : null}
      <FlatList
        data={isLoading ? [] : thread}
        keyExtractor={(item) => item.comment.id}
        style={embedded ? styles.embeddedList : styles.modalList}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Sé el primero en comentar.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <CommentRow comment={item.comment} depth={item.depth} onReply={setReplyTo} />
        )}
      />
    </>
  );

  if (embedded) {
    if (!post) return null;

    return (
      <EmbeddedBottomSheet visible={!!visible} onClose={onClose} zIndex={25}>
        <Text style={[styles.sheetTitle, { color: colors.text, marginBottom: spacing.sm }]}>
          Comentarios
        </Text>
        <View style={styles.embeddedBody}>
          {list}
          {composer}
        </View>
      </EmbeddedBottomSheet>
    );
  }

  return (
    <Modal visible={!!post} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalSafeScreen backgroundColor={colors.background}>
        <View style={styles.container}>
          <ModalCloseHeader title="Comentarios" onClose={onClose} />
          {list}
          {composer}
        </View>
      </ModalSafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalList: { flex: 1 },
  embeddedBody: { flexShrink: 1 },
  embeddedList: { maxHeight: 360 },
  sheetTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  list: { paddingBottom: spacing.sm, paddingHorizontal: spacing.md },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
  comment: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentText: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  replyBtn: { marginTop: 6, alignSelf: 'flex-start' },
  replyText: { fontSize: 12, fontWeight: '600' },
  composer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  replyingText: { fontSize: 12, fontWeight: '500' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 40,
  },
  sendBtn: { padding: 8, marginBottom: 2 },
});
