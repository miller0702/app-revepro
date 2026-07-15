import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/stores/authStore';
import { useTheme } from '../../../src/hooks/useTheme';
import { Button } from '../../../src/components/ui/Button';
import { ActionBottomSheet, ConfirmBottomSheet } from '../../../src/components/ui/ActionBottomSheet';
import { UserAvatar } from '../../../src/components/ui/UserAvatar';
import { AppIcon } from '../../../src/components/ui/AppIcon';
import { DrawerMenuButton } from '../../../src/components/navigation/DrawerMenuButton';
import { communityApi, type MentionUserOption, type CommunityPost } from '../../../src/api/community';
import { libraryApi } from '../../../src/api/library';
import { FeedPostCard } from '../../../src/components/community/FeedPostCard';
import { PostCommentsSheet } from '../../../src/components/community/PostCommentsSheet';
import { CoverBannerImage } from '../../../src/components/profile/CoverBannerImage';
import { CoverPositionSheet } from '../../../src/components/profile/CoverPositionSheet';
import { ProfileGoalsCard } from '../../../src/components/goals/ProfileGoalsCard';
import { DEFAULT_COVER_FOCUS, type CoverFocus } from '../../../src/utils/coverFocus';
import { useUserPosts } from '../../../src/hooks/useUserPosts';
import { communityFeedQueryKey } from '../../../src/utils/communityFeedCache';
import { FEED_STALE_MS } from '../../../src/config/socialFeed';
import { useOpenUserProfile } from '../../../src/hooks/useOpenUserProfile';
import { useScreenTopInset, useTabContentBottomPadding } from '../../../src/hooks/useSafeAreaLayout';
import { useTabBarScrollHandler } from '../../../src/hooks/useTabBarScrollHandler';
import { SCREEN_PADDING_X } from '../../../src/theme/layout';
import { typography, spacing, radius } from '../../../src/theme/tokens';
import { pickProfileImage } from '../../../src/utils/pickProfileImage';
import { toast } from '../../../src/utils/toast';

const AVATAR_SIZE = 96;
const COVER_HEIGHT = 140;

type CoverEditorState =
  | { mode: 'upload'; localUri: string; mimeType: string; fileName: string; width?: number }
  | { mode: 'adjust' };

function ConnectionAvatar({ person }: { person: MentionUserOption }) {
  const { colors } = useTheme();
  const openUserProfile = useOpenUserProfile();
  const label = [person.firstName, person.lastName].filter(Boolean).join(' ') || person.username;

  return (
    <Pressable
      onPress={() => openUserProfile(person.id)}
      style={styles.connectionItem}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${label}`}
    >
      <UserAvatar
        firstName={person.firstName}
        lastName={person.lastName}
        avatarUrl={person.avatarUrl}
        size={56}
      />
      <Text style={[styles.connectionName, { color: colors.text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);
  const removeAvatar = useAuthStore((s) => s.removeAvatar);
  const uploadCover = useAuthStore((s) => s.uploadCover);
  const updateCoverFocus = useAuthStore((s) => s.updateCoverFocus);
  const removeCover = useAuthStore((s) => s.removeCover);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const topInset = useScreenTopInset();
  const bottomPadding = useTabContentBottomPadding();
  const onTabBarScroll = useTabBarScrollHandler();
  const [uploading, setUploading] = useState(false);
  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [coverEditor, setCoverEditor] = useState<CoverEditorState | null>(null);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [coverSheetOpen, setCoverSheetOpen] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);
  const [confirmRemoveCover, setConfirmRemoveCover] = useState(false);

  const coverFocus = useMemo(
    (): CoverFocus => ({
      x: user?.coverFocusX ?? DEFAULT_COVER_FOCUS.x,
      y: user?.coverFocusY ?? DEFAULT_COVER_FOCUS.y,
    }),
    [user?.coverFocusX, user?.coverFocusY],
  );

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  const connectionsQuery = useQuery({
    queryKey: ['my-connections'],
    queryFn: async () => (await communityApi.searchMentionUsers('')).data.data,
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await libraryApi.getFavorites()).data.data,
  });

  const {
    posts: myPosts,
    totalCount: postsCount,
    isLoading: postsLoading,
    refetch: refetchPosts,
    fetchNextPage: fetchMorePosts,
    hasNextPage: hasMorePosts,
    isFetchingNextPage: loadingMorePosts,
  } = useUserPosts(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      const queryKey = communityFeedQueryKey(undefined, user.id);
      const state = queryClient.getQueryState(queryKey);
      const isStale =
        !state?.dataUpdatedAt || Date.now() - state.dataUpdatedAt > FEED_STALE_MS;
      if (isStale || state?.isInvalidated) {
        void refetchPosts();
      }
    }, [user?.id, queryClient, refetchPosts]),
  );

  const connections = connectionsQuery.data ?? [];
  const favoritesCount =
    (favoritesQuery.data?.books.length ?? 0) +
    (favoritesQuery.data?.audiobooks.length ?? 0) +
    (favoritesQuery.data?.podcasts.length ?? 0) +
    (favoritesQuery.data?.videos.length ?? 0) +
    (favoritesQuery.data?.posts.length ?? 0);

  const applyCoverAsset = (asset: {
    uri: string;
    mimeType: string;
    fileName: string;
    width?: number;
  }) => {
    setCoverEditor({
      mode: 'upload',
      localUri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      width: asset.width,
    });
  };

  const pickCoverFromLibrary = async () => {
    const asset = await pickProfileImage('library', { quality: 1 });
    if (asset) applyCoverAsset(asset);
  };

  const pickCoverFromCamera = async () => {
    const asset = await pickProfileImage('camera', { quality: 1 });
    if (asset) applyCoverAsset(asset);
  };

  const openAdjustCover = () => {
    if (!user?.coverUrl) return;
    setCoverEditor({ mode: 'adjust' });
  };

  const handleSaveCoverPosition = async (focus: CoverFocus) => {
    if (coverEditor?.mode === 'upload') {
      setUploading(true);
      try {
        await uploadCover(
          coverEditor.localUri,
          coverEditor.mimeType,
          coverEditor.fileName,
          coverEditor.width,
          focus,
        );
      } catch {
        toast.error('No se pudo subir la portada. Intenta de nuevo.');
        throw new Error('UPLOAD_FAILED');
      } finally {
        setUploading(false);
      }
      return;
    }

    setUploading(true);
    try {
      await updateCoverFocus(focus);
    } catch {
      toast.error('No se pudo guardar la posición de la portada.');
      throw new Error('FOCUS_FAILED');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    setUploading(true);
    try {
      await removeCover();
      toast.success('Portada eliminada');
    } catch {
      toast.error('No se pudo eliminar la portada.');
    } finally {
      setUploading(false);
      setConfirmRemoveCover(false);
    }
  };

  const uploadAvatarAsset = async (asset: {
    uri: string;
    mimeType: string;
    fileName: string;
    width?: number;
  }) => {
    setUploading(true);
    try {
      await uploadAvatar(asset.uri, asset.mimeType, asset.fileName, asset.width);
      toast.success('Foto de perfil actualizada');
    } catch {
      toast.error('No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const pickAvatarFromLibrary = async () => {
    const asset = await pickProfileImage('library', { squareCrop: true });
    if (asset) await uploadAvatarAsset(asset);
  };

  const pickAvatarFromCamera = async () => {
    const asset = await pickProfileImage('camera', { squareCrop: true });
    if (asset) await uploadAvatarAsset(asset);
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await removeAvatar();
      toast.success('Foto de perfil eliminada');
    } catch {
      toast.error('No se pudo eliminar la foto.');
    } finally {
      setUploading(false);
      setConfirmRemoveAvatar(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setCoverSheetOpen(true)}
          disabled={uploading}
          style={[styles.cover, { height: COVER_HEIGHT + topInset }]}
          accessibilityRole="button"
          accessibilityLabel="Editar portada de perfil"
        >
          {user?.coverUrl ? (
            <CoverBannerImage
              url={user.coverUrl}
              focusX={coverFocus.x}
              focusY={coverFocus.y}
              style={styles.coverImage}
            />
          ) : (
            <View style={[styles.coverFallback, { backgroundColor: colors.primary }]} />
          )}
          <View style={[styles.coverToolbar, { paddingTop: topInset + spacing.xs }]}>
            <DrawerMenuButton color={colors.text} style={styles.toolbarBtn} />
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={8}
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
            >
              <AppIcon name="settings-filled" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.coverEditChip}>
            <AppIcon name="compose" size={14} color="#fff" />
            <Text style={styles.coverEditText}>Editar portada</Text>
          </View>
          {uploading && (
            <View style={styles.coverOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </Pressable>

        <View style={styles.profileBody}>
          <Pressable
            onPress={() => setAvatarSheetOpen(true)}
            style={[styles.avatarWrap, { marginTop: -(AVATAR_SIZE / 2) }]}
            disabled={uploading}
            accessibilityLabel="Editar foto de perfil"
          >
            <View style={[styles.avatarRing, { borderColor: colors.background }]}>
              <UserAvatar
                firstName={user?.firstName}
                lastName={user?.lastName}
                avatarUrl={user?.avatarUrl}
                size={AVATAR_SIZE}
              />
            </View>
            {uploading ? (
              <View style={[styles.avatarOverlay, { borderRadius: AVATAR_SIZE / 2 }]}>
                <ActivityIndicator color={colors.onPrimary} />
              </View>
            ) : (
              <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <AppIcon name="compose" size={14} color={colors.onPrimary} />
              </View>
            )}
          </Pressable>

          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {fullName}
          </Text>
          {user?.username ? (
            <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
              @{user.username}
            </Text>
          ) : null}

          <Button
            title="Editar foto de perfil"
            variant="outline"
            onPress={() => setAvatarSheetOpen(true)}
            disabled={uploading}
            style={styles.editButton}
          />

          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <Pressable style={styles.statItem} onPress={() => router.push('/feed')}>
              <Text style={[styles.statValue, { color: colors.text }]}>{postsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Publicaciones</Text>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Pressable style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{connections.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Conexiones</Text>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Pressable style={styles.statItem} onPress={() => router.push('/favorites')}>
              <Text style={[styles.statValue, { color: colors.text }]}>{favoritesCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoritos</Text>
            </Pressable>
          </View>

          <ProfileGoalsCard />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppIcon name="people" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tu comunidad</Text>
            </View>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              Lectores que sigues o que te siguen. Aparecen al mencionar en publicaciones.
            </Text>

            {connectionsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.sectionLoader} />
            ) : connections.length === 0 ? (
              <View style={[styles.emptyCommunity, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyCommunityText, { color: colors.textSecondary }]}>
                  Aún no tienes conexiones. Sigue a otros lectores desde el feed para formar tu comunidad.
                </Text>
              </View>
            ) : (
              <FlatList
                horizontal
                data={connections}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.connectionsList}
                renderItem={({ item }) => <ConnectionAvatar person={item} />}
              />
            )}
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={[styles.sectionTitle, styles.postsSectionTitle, { color: colors.text }]}>
            Tus publicaciones
          </Text>
          {postsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.sectionLoader} />
          ) : myPosts.length === 0 ? (
            <View
              style={[
                styles.emptyCommunity,
                styles.emptyCommunityInset,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.emptyCommunityText, { color: colors.textSecondary }]}>
                Aún no tienes publicaciones. Comparte una recomendación desde el feed.
              </Text>
              <Pressable onPress={() => router.push('/feed')}>
                <Text style={[styles.emptyCta, { color: colors.primary }]}>Ir al feed</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {myPosts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  variant="feed"
                  onOpenComments={setCommentsPost}
                  onLightboxOpen={() => {
                    setCommentsPost(null);
                    setLightboxOpen(true);
                  }}
                  onLightboxClose={() => setLightboxOpen(false)}
                />
              ))}
              {hasMorePosts ? (
                <View style={styles.loadMoreWrap}>
                  {loadingMorePosts ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Button
                      title="Ver más publicaciones"
                      variant="outline"
                      onPress={() => void fetchMorePosts()}
                    />
                  )}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      {!lightboxOpen ? (
        <PostCommentsSheet post={commentsPost} onClose={() => setCommentsPost(null)} />
      ) : null}
      <CoverPositionSheet
        visible={coverEditor !== null}
        onClose={() => setCoverEditor(null)}
        localUri={coverEditor?.mode === 'upload' ? coverEditor.localUri : undefined}
        remoteUrl={coverEditor?.mode === 'adjust' ? user?.coverUrl : undefined}
        initialFocus={coverFocus}
        onSave={handleSaveCoverPosition}
      />

      <ActionBottomSheet
        visible={avatarSheetOpen}
        title="Foto de perfil"
        subtitle="Actualiza cómo te ven en la comunidad"
        options={[
          {
            key: 'camera',
            label: 'Tomar foto',
            icon: 'camera',
            onPress: () => void pickAvatarFromCamera(),
          },
          {
            key: 'gallery',
            label: 'Elegir de galería',
            icon: 'gallery',
            onPress: () => void pickAvatarFromLibrary(),
          },
          ...(user?.avatarUrl
            ? [
                {
                  key: 'remove',
                  label: 'Quitar foto',
                  icon: 'trash' as const,
                  destructive: true,
                  onPress: () => setConfirmRemoveAvatar(true),
                },
              ]
            : []),
        ]}
        onClose={() => setAvatarSheetOpen(false)}
      />

      <ActionBottomSheet
        visible={coverSheetOpen}
        title="Portada de perfil"
        subtitle="Personaliza el banner de tu perfil"
        options={[
          {
            key: 'camera',
            label: 'Tomar foto',
            icon: 'camera',
            onPress: () => void pickCoverFromCamera(),
          },
          {
            key: 'gallery',
            label: 'Elegir de galería',
            icon: 'gallery',
            onPress: () => void pickCoverFromLibrary(),
          },
          ...(user?.coverUrl
            ? [
                {
                  key: 'adjust',
                  label: 'Ajustar posición',
                  icon: 'crop' as const,
                  onPress: openAdjustCover,
                },
                {
                  key: 'remove',
                  label: 'Quitar portada',
                  icon: 'trash' as const,
                  destructive: true,
                  onPress: () => setConfirmRemoveCover(true),
                },
              ]
            : []),
        ]}
        onClose={() => setCoverSheetOpen(false)}
      />

      <ConfirmBottomSheet
        visible={confirmRemoveAvatar}
        title="Quitar foto"
        message="¿Eliminar tu foto de perfil? Podrás subir otra cuando quieras."
        onConfirm={() => void handleRemoveAvatar()}
        onClose={() => setConfirmRemoveAvatar(false)}
        loading={uploading}
      />

      <ConfirmBottomSheet
        visible={confirmRemoveCover}
        title="Quitar portada"
        message="¿Eliminar la imagen de portada de tu perfil?"
        onConfirm={() => void handleRemoveCover()}
        onClose={() => setConfirmRemoveCover(false)}
        loading={uploading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: { width: '100%', position: 'relative', overflow: 'hidden' },
  coverImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  coverFallback: { ...StyleSheet.absoluteFillObject },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEditChip: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  coverEditText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  coverToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING_X - spacing.xs,
    zIndex: 2,
  },
  toolbarBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  profileBody: {
    paddingHorizontal: SCREEN_PADDING_X,
    alignItems: 'center',
  },
  postsSection: {
    width: '100%',
    marginTop: spacing.lg,
  },
  postsSectionTitle: {
    paddingHorizontal: SCREEN_PADDING_X,
    marginBottom: spacing.sm,
  },
  emptyCommunityInset: {
    marginHorizontal: SCREEN_PADDING_X,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: SCREEN_PADDING_X,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatarRing: {
    borderRadius: AVATAR_SIZE / 2 + 4,
    borderWidth: 4,
    overflow: 'hidden',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  name: { ...typography.title, fontSize: 22, textAlign: 'center' },
  username: { fontSize: 15, marginTop: 4, textAlign: 'center' },
  editButton: { marginTop: spacing.md, alignSelf: 'stretch' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  section: { width: '100%', marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: { ...typography.title, fontSize: 17 },
  sectionHint: { fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  sectionLoader: { marginVertical: spacing.lg },
  emptyCommunity: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  emptyCommunityText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyCta: { fontSize: 14, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  connectionsList: { gap: spacing.md, paddingVertical: spacing.xs },
  connectionItem: { width: 72, alignItems: 'center', gap: spacing.xs },
  connectionName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
