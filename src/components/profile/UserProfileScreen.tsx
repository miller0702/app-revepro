import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, type CommunityPost } from '../../api/community';
import { useTheme } from '../../hooks/useTheme';
import { useUserPosts } from '../../hooks/useUserPosts';
import { useScreenTopInset } from '../../hooks/useSafeAreaLayout';
import { UserAvatar } from '../ui/UserAvatar';
import { Button } from '../ui/Button';
import { FeedPostCard } from '../community/FeedPostCard';
import { PostCommentsSheet } from '../community/PostCommentsSheet';
import { CoverBannerImage } from './CoverBannerImage';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { spacing, radius, typography } from '../../theme/tokens';

const AVATAR_SIZE = 96;
const COVER_HEIGHT = 140;

type Props = {
  userId: string;
};

export function UserProfileScreen({ userId }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const topInset = useScreenTopInset();
  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['community-user', userId],
    queryFn: async () => (await communityApi.getUserProfile(userId)).data.data,
    enabled: Boolean(userId),
  });

  const {
    posts,
    isLoading: postsLoading,
    fetchNextPage: fetchMorePosts,
    hasNextPage: hasMorePosts,
    isFetchingNextPage: loadingMorePosts,
  } = useUserPosts(userId);

  const followMutation = useMutation({
    mutationFn: (isFollowing: boolean) =>
      isFollowing ? communityApi.unfollowUser(userId) : communityApi.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
    },
  });

  const profile = profileQuery.data;
  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username
    : '';

  if (profileQuery.isLoading || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {profileQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Usuario no encontrado</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.cover, { height: COVER_HEIGHT + topInset }]}>
          {profile.coverUrl ? (
            <CoverBannerImage
              url={profile.coverUrl}
              focusX={profile.coverFocusX}
              focusY={profile.coverFocusY}
              style={styles.coverImage}
            />
          ) : (
            <View style={[styles.coverFallback, { backgroundColor: colors.primary }]} />
          )}
        </View>

        <View style={styles.body}>
          <View style={[styles.avatarWrap, { marginTop: -(AVATAR_SIZE / 2) }]}>
            <View style={[styles.avatarRing, { borderColor: colors.background }]}>
              <UserAvatar
                firstName={profile.firstName}
                lastName={profile.lastName}
                avatarUrl={profile.avatarUrl}
                size={AVATAR_SIZE}
              />
            </View>
          </View>

          <Text style={[styles.name, { color: colors.text }]}>
            {fullName}
            {profile.isOfficial ? (
              <Text style={[styles.official, { color: colors.primary }]}> · Oficial</Text>
            ) : null}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{profile.username}</Text>

          {!profile.isMe ? (
            <Button
              title={profile.isFollowing ? 'Siguiendo' : 'Conectar'}
              variant={profile.isFollowing ? 'outline' : 'primary'}
              onPress={() => followMutation.mutate(profile.isFollowing)}
              disabled={followMutation.isPending}
              style={styles.followBtn}
            />
          ) : null}

          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.postCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Publicaciones</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.followerCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Seguidores</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Siguiendo</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Publicaciones</Text>
          {postsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : posts.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Este usuario aún no ha publicado nada.
              </Text>
            </View>
          ) : (
            <>
              {posts.map((post) => (
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
                <View style={styles.loadMore}>
                  {loadingMorePosts ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Button title="Ver más" variant="outline" onPress={() => void fetchMorePosts()} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: spacing.xxl },
  cover: { width: '100%', overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  coverFallback: { flex: 1 },
  body: { paddingHorizontal: SCREEN_PADDING_X },
  avatarWrap: { alignSelf: 'flex-start' },
  avatarRing: {
    borderWidth: 4,
    borderRadius: AVATAR_SIZE / 2 + 4,
    overflow: 'hidden',
  },
  name: { ...typography.title, fontSize: 22, marginTop: spacing.sm },
  official: { fontSize: 14, fontWeight: '600' },
  username: { fontSize: 15, marginTop: 4, marginBottom: spacing.md },
  followBtn: { marginBottom: spacing.md },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statDivider: { width: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { ...typography.title, fontSize: 18, marginBottom: spacing.md },
  loader: { marginVertical: spacing.lg },
  empty: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyText: { textAlign: 'center', lineHeight: 20 },
  loadMore: { paddingVertical: spacing.md, alignItems: 'center' },
});
