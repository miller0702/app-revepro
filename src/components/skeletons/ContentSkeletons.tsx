import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Skeleton } from '../ui/Skeleton';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { radius, spacing } from '../../theme/tokens';

const SKELETON_COUNT = 5;

export function skeletonKeys(count = SKELETON_COUNT): string[] {
  return Array.from({ length: count }, (_, i) => `sk-${i}`);
}

export function BookCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton width={88} height={120} borderRadius={0} />
      <View style={styles.bookContent}>
        <Skeleton height={18} style={styles.mbSm} />
        <Skeleton width="60%" height={14} style={styles.mbSm} />
        <Skeleton height={14} />
        <Skeleton width="85%" height={14} style={styles.mtXs} />
      </View>
    </View>
  );
}

export function VideoCardSkeleton() {
  return <VideoFeedSkeleton />;
}

/** Skeleton estilo feed (sin card con borde). */
export function VideoFeedSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.videoFeedRow, { borderBottomColor: colors.border }]}>
      <View style={styles.videoThumb}>
        <Skeleton fill borderRadius={0} />
      </View>
      <View style={styles.videoFeedContent}>
        <Skeleton height={18} style={styles.mbSm} />
        <Skeleton width="45%" height={13} style={styles.mbSm} />
        <Skeleton height={14} />
      </View>
    </View>
  );
}

export function PodcastCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.podcastCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.podcastCover}>
        <Skeleton fill borderRadius={0} />
      </View>
      <View style={styles.podcastContent}>
        <Skeleton height={18} style={styles.mbSm} />
        <Skeleton width="50%" height={14} style={styles.mbSm} />
        <Skeleton height={14} />
        <Skeleton width="80%" height={14} style={styles.mtXs} />
      </View>
    </View>
  );
}

export function RadioCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.radioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.radioCover}>
        <Skeleton fill borderRadius={radius.md} />
      </View>
      <Skeleton width="88%" height={13} style={styles.mbXs} />
      <Skeleton width="65%" height={11} />
    </View>
  );
}

export function FeedComposerSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.composerRow, { borderBottomColor: colors.border }]}>
      <Skeleton width={40} height={40} borderRadius={radius.full} />
      <Skeleton height={40} borderRadius={radius.full} style={styles.composerInput} />
    </View>
  );
}

export function FeedPostSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.feedRow, { borderBottomColor: colors.border }]}>
      <View style={styles.feedHeader}>
        <Skeleton width={40} height={40} borderRadius={radius.full} />
        <View style={styles.feedHeaderText}>
          <Skeleton width="55%" height={16} style={styles.mbXs} />
          <Skeleton width="35%" height={12} />
        </View>
        <Skeleton width={22} height={22} borderRadius={radius.full} />
      </View>
      <Skeleton height={14} style={styles.mbXs} />
      <Skeleton height={14} style={styles.mbXs} />
      <Skeleton width="70%" height={14} style={styles.mbSm} />
      <View style={styles.feedImageBleed}>
        <Skeleton width="100%" height={220} borderRadius={0} />
      </View>
      <View style={styles.feedActions}>
        <Skeleton width={56} height={24} borderRadius={radius.full} />
        <Skeleton width={48} height={24} borderRadius={radius.full} />
        <Skeleton width={44} height={24} borderRadius={radius.full} />
        <Skeleton width={40} height={24} borderRadius={radius.full} />
      </View>
    </View>
  );
}

export function FilterChipsSkeleton() {
  return (
    <View style={styles.filterWrap}>
      <Skeleton width={72} height={11} style={styles.mbSm} />
      <View style={styles.chipRow}>
        <Skeleton width={64} height={34} borderRadius={radius.full} />
        <Skeleton width={88} height={34} borderRadius={radius.full} />
        <Skeleton width={72} height={34} borderRadius={radius.full} />
        <Skeleton width={96} height={34} borderRadius={radius.full} />
      </View>
    </View>
  );
}

export function FavoritesSkeleton() {
  return (
    <View>
      <Skeleton width={120} height={20} style={styles.sectionTitle} />
      <BookCardSkeleton />
      <VideoCardSkeleton />
      <PodcastCardSkeleton />
    </View>
  );
}

export function SearchResultsSkeleton() {
  return (
    <View style={styles.searchList}>
      {skeletonKeys(6).map((key) => (
        <View key={key} style={styles.searchRow}>
          <Skeleton width={48} height={48} borderRadius={radius.md} />
          <View style={styles.searchRowText}>
            <Skeleton height={16} style={styles.mbXs} />
            <Skeleton width="60%" height={13} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Fila genérica (comentarios, reacciones, carpetas, notas). */
export function ListRowSkeleton({ avatarSize = 40 }: { avatarSize?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.listRow, { borderColor: colors.border }]}>
      <Skeleton width={avatarSize} height={avatarSize} borderRadius={radius.full} />
      <View style={styles.listRowText}>
        <Skeleton width="50%" height={15} style={styles.mbXs} />
        <Skeleton height={13} />
        <Skeleton width="75%" height={13} style={styles.mtXs} />
      </View>
    </View>
  );
}

/** Tarjeta compacta (carpeta, nota, highlight en centro de estudio). */
export function CompactCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton width={12} height={12} borderRadius={radius.full} />
      <View style={styles.compactCardText}>
        <Skeleton width="55%" height={16} style={styles.mbXs} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

/** Lector: barra superior + área de contenido. */
export function ReaderScreenSkeleton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.readerRoot, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.readerHeader,
          { paddingTop: insets.top, borderBottomColor: colors.border },
        ]}
      >
        <Skeleton width={36} height={36} borderRadius={radius.full} />
        <View style={styles.readerTitles}>
          <Skeleton width="70%" height={16} style={styles.mbXs} />
          <Skeleton width="50%" height={12} />
        </View>
        <Skeleton width={36} height={36} borderRadius={radius.full} />
      </View>
      <View style={styles.readerBody}>
        <Skeleton height={18} width="40%" style={styles.mbMd} />
        <Skeleton height={14} />
        <Skeleton height={14} style={styles.mtXs} />
        <Skeleton height={14} style={styles.mtXs} />
        <Skeleton width="92%" height={14} style={styles.mtXs} />
        <Skeleton height={14} style={styles.mtMd} />
        <Skeleton height={14} />
        <Skeleton height={14} style={styles.mtXs} />
        <Skeleton width="88%" height={14} style={styles.mtXs} />
      </View>
    </View>
  );
}

/** Detalle con portada hero (libro, video, podcast). */
export function ParallaxDetailSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.parallaxRoot}>
      <Skeleton width="100%" height={280} borderRadius={0} />
      <View style={[styles.parallaxBody, { backgroundColor: colors.background }]}>
        <Skeleton width="85%" height={26} style={styles.mbSm} />
        <Skeleton width="45%" height={14} style={styles.mbMd} />
        <Skeleton width="100%" height={44} borderRadius={radius.lg} style={styles.mbSm} />
        <Skeleton width="100%" height={44} borderRadius={radius.lg} style={styles.mbMd} />
        <Skeleton height={14} />
        <Skeleton height={14} style={styles.mtXs} />
        <Skeleton width="90%" height={14} style={styles.mtXs} />
      </View>
    </View>
  );
}

export function CommentListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {skeletonKeys(count).map((key) => (
        <ListRowSkeleton key={key} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bookCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  bookContent: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  videoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  videoFeedRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.md,
    marginBottom: 0,
  },
  videoThumb: { aspectRatio: 16 / 9, width: '100%' },
  videoContent: { padding: spacing.md },
  videoFeedContent: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.sm,
  },
  podcastCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    minHeight: 96,
  },
  podcastCover: {
    width: 96,
    height: 96,
  },
  podcastContent: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  radioCard: {
    width: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  radioCover: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composerInput: { flex: 1 },
  feedRow: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  feedHeaderText: { flex: 1 },
  feedImageBleed: {
    marginHorizontal: -SCREEN_PADDING_X,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  filterWrap: { marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { marginBottom: spacing.md },
  searchList: { paddingTop: spacing.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchRowText: { flex: 1 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listRowText: { flex: 1 },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  compactCardText: { flex: 1 },
  parallaxRoot: { flex: 1 },
  parallaxBody: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: spacing.lg },
  readerRoot: { flex: 1 },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  readerTitles: { flex: 1, minWidth: 0 },
  readerBody: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.lg,
  },
  mbMd: { marginBottom: spacing.md },
  mbXs: { marginBottom: spacing.xs },
  mbSm: { marginBottom: spacing.sm },
  mtXs: { marginTop: spacing.xs },
  mtSm: { marginTop: spacing.sm },
  mtMd: { marginTop: spacing.md },
});
