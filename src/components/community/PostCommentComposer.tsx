import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { AppIcon } from '../ui/AppIcon';
import { communityApi, type CommunityComment, type CommunityPost } from '../../api/community';
import { bumpCommentCount, restoreFeedQueries, snapshotFeedQueries, updatePostInFeedCache } from '../../utils/communityFeedCache';
import { spacing } from '../../theme/tokens';

interface PostCommentComposerProps {
  postId: string;
  autoFocus?: boolean;
  replyTo?: CommunityComment | null;
  onClearReply?: () => void;
}

export function PostCommentComposer({
  postId,
  autoFocus,
  replyTo,
  onClearReply,
}: PostCommentComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const addMutation = useMutation({
    mutationFn: (payload: { body: string; parentId?: string }) =>
      communityApi.addComment(postId, payload.body, payload.parentId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community-posts'] });
      const snapshots = snapshotFeedQueries(queryClient);
      updatePostInFeedCache(queryClient, postId, (p) => bumpCommentCount(p));
      queryClient.setQueryData<CommunityPost>(['community-post', postId], (old) =>
        old ? bumpCommentCount(old) : old,
      );
      return { snapshots };
    },
    onError: (_err, _body, context) => {
      if (context?.snapshots) {
        restoreFeedQueries(queryClient, context.snapshots);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
      setComment('');
      onClearReply?.();
    },
  });

  const submit = () => {
    const text = comment.trim();
    if (!text || addMutation.isPending) return;
    addMutation.mutate({ body: text, parentId: replyTo?.id });
  };

  const keyboardOpen = keyboardHeight > 0;
  // Android usa softwareKeyboardLayoutMode=resize; iOS necesita elevar el compositor.
  const lift = Platform.OS === 'ios' && keyboardOpen ? keyboardHeight : 0;

  return (
    <View
      style={[
        styles.composer,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          paddingBottom: keyboardOpen ? spacing.sm : Math.max(insets.bottom, spacing.sm),
          marginBottom: lift,
        },
      ]}
    >
      {replyTo && (
        <View style={styles.replyingBar}>
          <Text style={[styles.replyingText, { color: colors.textSecondary }]}>
            Respondiendo a @{replyTo.author.username}
          </Text>
          <Pressable onPress={onClearReply} hitSlop={8}>
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
          autoFocus={autoFocus}
          multiline
          maxLength={2000}
          textAlignVertical="center"
          blurOnSubmit={false}
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
}

const styles = StyleSheet.create({
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
