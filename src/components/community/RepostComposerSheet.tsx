import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { UserAvatar } from '../ui/UserAvatar';
import { EmbeddedBottomSheet } from '../ui/EmbeddedBottomSheet';
import { ModalCloseHeader, ModalSafeScreen } from '../ui/ModalSafeScreen';
import { useAuthStore } from '../../stores/authStore';
import { communityApi, type CommunityPost } from '../../api/community';
import { contentRefFromPost, ContentRefCard } from './ContentRefCard';
import {
  ensurePostReactionFields,
  prependPostToFeedCache,
  updatePostInFeedCache,
} from '../../utils/communityFeedCache';
import { radius, spacing, typography } from '../../theme/tokens';

const MAX_COMMENT_LENGTH = 500;

interface RepostComposerSheetProps {
  post: CommunityPost | null;
  visible: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export function RepostComposerSheet({ post, visible, onClose, embedded = false }: RepostComposerSheetProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible) setComment('');
  }, [visible, post?.id]);

  const repostMutation = useMutation({
    mutationFn: (body: string | undefined) => {
      if (!post) throw new Error('Publicación no disponible');
      return communityApi.repostPost(post.id, body);
    },
    onSuccess: (res) => {
      prependPostToFeedCache(queryClient, ensurePostReactionFields(res.data.data));
      if (post) {
        updatePostInFeedCache(queryClient, post.id, (p) => ({
          ...p,
          repostCount: (p.repostCount ?? 0) + 1,
        }));
      }
      onClose();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const message =
        axiosErr.response?.status === 409
          ? 'Ya reposteaste esta publicación'
          : axiosErr.response?.data?.message ?? 'No se pudo repostear la publicación.';
      Alert.alert('Error', message);
    },
  });

  if (!post) return null;

  const contentRef = contentRefFromPost(post);
  const excerpt = post.body.trim().slice(0, 180);
  const canSubmit = !repostMutation.isPending;

  const handleSubmit = () => {
    const trimmed = comment.trim();
    repostMutation.mutate(trimmed.length > 0 ? trimmed : undefined);
  };

  const form = (
    <View style={styles.form}>
      <View style={styles.authorRow}>
        <UserAvatar
          firstName={user?.firstName ?? 'Usuario'}
          lastName={user?.lastName ?? ''}
          avatarUrl={user?.avatarUrl}
          size={40}
        />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Añade un comentario (opcional)"
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={MAX_COMMENT_LENGTH}
          autoFocus={!embedded}
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
      </View>

      <View style={[styles.preview, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.previewHeader}>
          <UserAvatar
            firstName={post.author.firstName}
            lastName={post.author.lastName}
            avatarUrl={post.author.avatarUrl}
            size={28}
          />
          <Text style={[styles.previewAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {post.author.firstName} {post.author.lastName} · @{post.author.username}
          </Text>
        </View>
        {excerpt ? (
          <Text style={[styles.previewBody, { color: colors.text }]} numberOfLines={4}>
            {excerpt}
            {post.body.trim().length > excerpt.length ? '…' : ''}
          </Text>
        ) : null}
        {contentRef ? <ContentRefCard contentRef={contentRef} interactive={false} /> : null}
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Tu comentario aparecerá arriba de la publicación original en tu feed.
      </Text>

      <Button
        title={repostMutation.isPending ? 'Publicando...' : 'Repostear'}
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={styles.submit}
      />
    </View>
  );

  if (embedded) {
    return (
      <EmbeddedBottomSheet visible={visible} onClose={onClose} zIndex={27} maxHeight="85%">
        <Text style={[styles.title, { color: colors.text, marginBottom: spacing.sm }]}>
          Repostear
        </Text>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {form}
        </KeyboardAvoidingView>
      </EmbeddedBottomSheet>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalSafeScreen backgroundColor={colors.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalCloseHeader title="Repostear" onClose={onClose} closeDisabled={repostMutation.isPending} />

        {form}
      </KeyboardAvoidingView>
      </ModalSafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...typography.title, fontSize: 17 },
  form: { flex: 1, padding: spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    minHeight: 88,
    maxHeight: 160,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  preview: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  previewAuthor: { flex: 1, fontSize: 13, fontWeight: '500' },
  previewBody: { fontSize: 14, lineHeight: 20, marginBottom: spacing.xs },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: spacing.lg },
  submit: { marginTop: 'auto' },
});
