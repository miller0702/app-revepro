import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { AppIcon } from '../ui/AppIcon';
import { UserAvatar } from '../ui/UserAvatar';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import { communityApi, type MentionUserOption } from '../../api/community';
import { prependPostToFeedCache, ensurePostReactionFields } from '../../utils/communityFeedCache';
import { prepareImageForUpload } from '../../utils/prepareImageForUpload';
import { ContentRefCard } from './ContentRefCard';
import { radius, spacing, typography } from '../../theme/tokens';

const MAX_IMAGES = 4;

interface LocalImage {
  uri: string;
  mimeType: string;
  fileName: string;
  width?: number;
}

import type { ContentRefPreview } from './ContentRefCard';

interface CreatePostSheetProps {
  visible: boolean;
  onClose: () => void;
  initialDraft?: PostDraft | null;
}

export interface PostDraft {
  body: string;
  kind?: 'GENERAL' | 'RECOMMENDATION' | 'QUOTE';
  bookId?: string;
  videoId?: string;
  podcastSeriesId?: string;
  chapterId?: string;
  quoteExcerpt?: string;
  /** Vista previa local del recurso adjunto (no se envía a la API). */
  attachmentPreview?: ContentRefPreview;
  /** Imágenes ya subidas al servidor (reutilizar sin volver a subir). */
  existingImageIds?: string[];
  existingImages?: { id: string; url: string | null }[];
}

function extractMentionQuery(value: string): string | null {
  const match = value.match(/@([a-zA-Z0-9_]{0,30})$/);
  return match ? match[1] : null;
}

function parseHashtags(value: string): string[] {
  const tags = value.match(/#([a-zA-Z0-9_\u00C0-\u024F]+)/g) ?? [];
  return [...new Set(tags.map((t) => t.replace(/^#/, '').toLowerCase()))].slice(0, 10);
}

export function CreatePostSheet({ visible, onClose, initialDraft }: CreatePostSheetProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<PostDraft['kind']>('GENERAL');
  const [bookId, setBookId] = useState<string | undefined>();
  const [videoId, setVideoId] = useState<string | undefined>();
  const [podcastSeriesId, setPodcastSeriesId] = useState<string | undefined>();
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [quoteExcerpt, setQuoteExcerpt] = useState<string | undefined>();
  const [attachmentPreview, setAttachmentPreview] = useState<ContentRefPreview | undefined>();
  const [tagsInput, setTagsInput] = useState('');
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [serverImages, setServerImages] = useState<{ id: string; url: string | null }[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<MentionUserOption[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const mentionSearch = useQuery({
    queryKey: ['mention-users', mentionQuery],
    queryFn: async () =>
      (await communityApi.searchMentionUsers(mentionQuery ?? '')).data.data,
    enabled: visible && mentionQuery !== null && mentionQuery.length >= 1,
  });

  useEffect(() => {
    if (!visible) {
      setBody('');
      setKind('GENERAL');
      setBookId(undefined);
      setVideoId(undefined);
      setPodcastSeriesId(undefined);
      setChapterId(undefined);
      setQuoteExcerpt(undefined);
      setAttachmentPreview(undefined);
      setTagsInput('');
      setLocalImages([]);
      setServerImages([]);
      setSelectedMentions([]);
      setMentionQuery(null);
      return;
    }
    if (initialDraft) {
      setBody(initialDraft.body);
      setKind(initialDraft.kind ?? 'GENERAL');
      setBookId(initialDraft.bookId);
      setVideoId(initialDraft.videoId);
      setPodcastSeriesId(initialDraft.podcastSeriesId);
      setChapterId(initialDraft.chapterId);
      setQuoteExcerpt(initialDraft.quoteExcerpt);
      setAttachmentPreview(initialDraft.attachmentPreview);
      setServerImages(initialDraft.existingImages ?? []);
    }
  }, [visible, initialDraft]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const imageIds: string[] = serverImages.map((img) => img.id);
      for (const img of localImages) {
        const prepared = await prepareImageForUpload(
          img.uri,
          img.fileName,
          img.mimeType,
          'post',
          img.width,
        );
        const formData = new FormData();
        formData.append('file', {
          uri: prepared.uri,
          name: prepared.fileName,
          type: prepared.mimeType,
        } as unknown as Blob);
        const res = await communityApi.uploadImage(formData);
        imageIds.push(res.data.data.id);
      }

      const tags = parseHashtags(tagsInput);
      const mentionIds = selectedMentions.map((m) => m.id);

      return communityApi.createPost({
        body: body.trim().length >= 3 ? body.trim() : 'Compartiendo imagen',
        kind,
        bookId,
        videoId,
        podcastSeriesId,
        chapterId,
        quoteExcerpt,
        tags,
        imageIds: imageIds.length ? imageIds : undefined,
        mentionIds: mentionIds.length ? mentionIds : undefined,
      });
    },
    onSuccess: (res) => {
      prependPostToFeedCache(queryClient, ensurePostReactionFields(res.data.data));
      onClose();
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo publicar. Revisa tu conexión e intenta de nuevo.');
    },
  });

  const pickImages = async () => {
    if (localImages.length + serverImages.length >= MAX_IMAGES) {
      Alert.alert('Límite alcanzado', `Puedes agregar hasta ${MAX_IMAGES} imágenes.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Activa el acceso a fotos para adjuntar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - localImages.length - serverImages.length,
      quality: 0.85,
    });

    if (result.canceled) return;

    setLocalImages((prev) => {
      const remaining = MAX_IMAGES - prev.length - serverImages.length;
      if (remaining <= 0) return prev;
      const picked = result.assets.slice(0, remaining).map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `post-${Date.now()}.jpg`,
        width: asset.width,
      }));
      return [...prev, ...picked];
    });
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    setMentionQuery(extractMentionQuery(value));
  };

  const addMention = (user: MentionUserOption) => {
    if (selectedMentions.some((m) => m.id === user.id)) return;
    setSelectedMentions((prev) => [...prev, user].slice(0, 10));
    const withoutPartial = tagsInput.replace(/@([a-zA-Z0-9_]{0,30})$/, `@${user.username} `);
    setTagsInput(withoutPartial);
    setMentionQuery(null);
  };

  const removeMention = (userId: string) => {
    setSelectedMentions((prev) => prev.filter((m) => m.id !== userId));
  };

  const removeImage = (index: number) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeServerImage = (id: string) => {
    setServerImages((prev) => prev.filter((img) => img.id !== id));
  };

  const canSubmit =
    (body.trim().length >= 3 || serverImages.length > 0 || localImages.length > 0) &&
    !createMutation.isPending;
  const suggestions = useMemo(() => mentionSearch.data ?? [], [mentionSearch.data]);
  const sheetTitle =
    kind === 'QUOTE' ? 'Nueva cita' : attachmentPreview ? 'Compartir recomendación' : 'Nueva publicación';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <AppIcon name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{sheetTitle}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {kind === 'QUOTE'
              ? 'Publicarás una cita del libro. La portada aparecerá como imagen en el feed.'
              : attachmentPreview
                ? 'Añade un comentario y publica. El recurso adjunto se mostrará con su portada en el feed.'
                : 'Comparte como en una red social: texto, fotos, #etiquetas y @menciones a seguidores.'}
          </Text>

          {attachmentPreview ? (
            <ContentRefCard contentRef={attachmentPreview} interactive={false} />
          ) : null}

          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="¿Qué estás leyendo o recomiendas?"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={2000}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          />

          <View style={styles.imagesHeader}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Fotos (opcional)</Text>
            {kind !== 'QUOTE' && (
              <Pressable onPress={pickImages} style={styles.addPhotoBtn}>
                <AppIcon name="compose" size={20} color={colors.primary} />
                <Text style={[styles.addPhotoText, { color: colors.primary }]}>Agregar</Text>
              </Pressable>
            )}
          </View>

          {(serverImages.length > 0 || localImages.length > 0) && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {serverImages.map((img) => (
                <View key={img.id} style={styles.imageWrap}>
                  <AuthenticatedImage url={img.url} style={styles.preview} resizeMode="cover" />
                  <Pressable
                    onPress={() => removeServerImage(img.id)}
                    style={[styles.removeImage, { backgroundColor: colors.inverse }]}
                  >
                    <AppIcon name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {localImages.map((img, index) => (
                <View key={`${img.uri}-${index}`} style={styles.imageWrap}>
                  <Image source={{ uri: img.uri }} style={styles.preview} />
                  <Pressable
                    onPress={() => removeImage(index)}
                    style={[styles.removeImage, { backgroundColor: colors.inverse }]}
                  >
                    <AppIcon name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Etiquetas y menciones (opcional)
          </Text>
          <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
            Usa # para temas y @ para mencionar seguidores o amigos.
          </Text>
          <TextInput
            value={tagsInput}
            onChangeText={handleTagsChange}
            placeholder="#espiritualidad @usuario"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.tagsInput,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          />

          {mentionQuery !== null && mentionQuery.length >= 1 && (
            <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {mentionSearch.isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.suggestionLoading} />
              ) : suggestions.length === 0 ? (
                <Text style={[styles.suggestionEmpty, { color: colors.textSecondary }]}>
                  Sin coincidencias entre tus seguidores
                </Text>
              ) : (
                suggestions.map((user) => (
                  <Pressable
                    key={user.id}
                    onPress={() => addMention(user)}
                    style={({ pressed }) => [styles.suggestionRow, pressed && { opacity: 0.7 }]}
                  >
                    <UserAvatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                      avatarUrl={user.avatarUrl}
                      size={32}
                    />
                    <View style={styles.suggestionText}>
                      <Text style={[styles.suggestionName, { color: colors.text }]}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text style={[styles.suggestionUser, { color: colors.textSecondary }]}>
                        @{user.username}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {selectedMentions.length > 0 && (
            <View style={styles.mentionChips}>
              {selectedMentions.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => removeMention(m.id)}
                  style={[styles.mentionChip, { backgroundColor: colors.accentSoft }]}
                >
                  <Text style={[styles.mentionChipText, { color: colors.accent }]}>@{m.username}</Text>
                  <AppIcon name="close" size={12} color={colors.accent} />
                </Pressable>
              ))}
            </View>
          )}

          <Button
            title={createMutation.isPending ? 'Publicando...' : 'Publicar'}
            onPress={() => createMutation.mutate()}
            disabled={!canSubmit}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { ...typography.title, fontSize: 17 },
  form: { padding: spacing.md },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  label: { ...typography.label, marginBottom: spacing.xs },
  fieldHint: { fontSize: 12, marginBottom: spacing.sm },
  tagsInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 15,
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addPhotoText: { fontSize: 14, fontWeight: '600' },
  imageRow: { gap: spacing.sm, marginTop: spacing.sm, paddingBottom: spacing.xs },
  imageWrap: { position: 'relative' },
  preview: { width: 88, height: 88, borderRadius: radius.md },
  removeImage: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  suggestionLoading: { padding: spacing.md },
  suggestionEmpty: { padding: spacing.md, fontSize: 13 },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  suggestionText: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: '600' },
  suggestionUser: { fontSize: 12, marginTop: 2 },
  mentionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  mentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  mentionChipText: { fontSize: 12, fontWeight: '600' },
  submit: { marginTop: spacing.lg },
});
