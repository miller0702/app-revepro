import { useMemo } from 'react';
import { Modal, View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../ui/UserAvatar';
import { AppIcon } from '../ui/AppIcon';
import { communityApi, type CommunityPost } from '../../api/community';
import { useOpenUserProfile } from '../../hooks/useOpenUserProfile';
import { COMMUNITY_REACTIONS, getReactionMeta } from '../../constants/communityReactions';
import { EmbeddedBottomSheet } from '../ui/EmbeddedBottomSheet';
import { CommentListSkeleton } from '../skeletons/ContentSkeletons';
import { radius, spacing, typography } from '../../theme/tokens';

interface ReactionsListSheetProps {
  post: CommunityPost | null;
  onClose: () => void;
  embedded?: boolean;
}

export function ReactionsListSheet({ post, onClose, embedded = false }: ReactionsListSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const openUserProfile = useOpenUserProfile();

  const { data, isLoading } = useQuery({
    queryKey: ['community-reactions', post?.id],
    queryFn: async () => (await communityApi.getReactions(post!.id)).data.data,
    enabled: !!post,
  });

  const grouped = useMemo(() => {
    const reactions = data ?? [];
    return COMMUNITY_REACTIONS.map((meta) => ({
      ...meta,
      items: reactions.filter((r) => r.type === meta.type),
    })).filter((g) => g.items.length > 0);
  }, [data]);

  const listContent = (
    <>
      {isLoading ? <CommentListSkeleton count={5} /> : null}
      <FlatList
        data={isLoading ? [] : grouped}
        keyExtractor={(item) => item.type}
        style={embedded ? styles.embeddedList : undefined}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Aún no hay reacciones.
            </Text>
          ) : null
        }
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
              <Text style={[styles.groupTitle, { color: colors.text }]}>
                {group.label} · {group.items.length}
              </Text>
            </View>
            {group.items.map((entry) => (
              <Pressable
                key={`${entry.type}-${entry.user.id}`}
                onPress={() => openUserProfile(entry.user.id)}
                style={styles.row}
                accessibilityRole="button"
              >
                <UserAvatar
                  firstName={entry.user.firstName}
                  lastName={entry.user.lastName}
                  avatarUrl={entry.user.avatarUrl}
                  size={36}
                />
                <View style={styles.rowText}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {entry.user.firstName} {entry.user.lastName}
                  </Text>
                  <Text style={[styles.username, { color: colors.textSecondary }]}>
                    @{entry.user.username}
                  </Text>
                </View>
                <Text style={styles.rowEmoji}>{getReactionMeta(entry.type).emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
      />
    </>
  );

  if (embedded) {
    return (
      <EmbeddedBottomSheet visible={!!post} onClose={onClose} zIndex={26}>
        <Text style={[styles.title, { color: colors.text, marginBottom: spacing.sm }]}>
          Reacciones
        </Text>
        {listContent}
      </EmbeddedBottomSheet>
    );
  }

  return (
    <Modal visible={!!post} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <AppIcon name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Reacciones</Text>
          <View style={{ width: 24 }} />
        </View>

        {listContent}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  embeddedList: { maxHeight: 420 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { ...typography.title, fontSize: 17 },
  loading: { textAlign: 'center', padding: spacing.md },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
  group: { marginBottom: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  groupEmoji: { fontSize: 20 },
  groupTitle: { fontSize: 15, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600' },
  username: { fontSize: 12, marginTop: 2 },
  rowEmoji: { fontSize: 18 },
});
