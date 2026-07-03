import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon } from '../ui/AppIcon';
import { AuthenticatedImage } from '../ui/AuthenticatedImage';
import type { StudyFolder, StudyNote, Highlight } from '../../api/study';
import { radius, spacing } from '../../theme/tokens';

export function StudyFolderCard({
  folder,
  onPress,
}: {
  folder: StudyFolder;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const accent = folder.color ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <AppIcon name="folder" size={22} color={accent} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {folder.noteCount} notas · {folder.childCount} subcarpetas
        </Text>
      </View>
      <AppIcon name="forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

export function StudyNoteCard({
  note,
  onDelete,
}: {
  note: StudyNote;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.noteHeader}>
        <View style={[styles.noteIcon, { backgroundColor: colors.accentSoft }]}>
          <AppIcon name="document" size={18} color={colors.accent} />
        </View>
        <View style={styles.noteHeaderText}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {note.title}
          </Text>
          {note.bookTitle ? (
            <Text style={[styles.bookRef, { color: colors.primary }]} numberOfLines={1}>
              {note.bookTitle}
            </Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.noteBody, { color: colors.textSecondary }]} numberOfLines={4}>
        {note.body}
      </Text>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Text style={[styles.deleteLink, { color: colors.error }]}>Eliminar nota</Text>
      </Pressable>
    </View>
  );
}

export function StudyHighlightCard({
  highlight,
  onOpenBook,
  onDelete,
}: {
  highlight: Highlight;
  onOpenBook: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.highlightTop}>
        {highlight.bookCoverUrl ? (
          <AuthenticatedImage url={highlight.bookCoverUrl} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: colors.primary }]}>
            <AppIcon name="library" size={20} color="#fff" />
          </View>
        )}
        <View style={styles.highlightMeta}>
          <Text style={[styles.bookRef, { color: colors.primary }]} numberOfLines={1}>
            {highlight.bookTitle}
          </Text>
          {highlight.chapterTitle ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {highlight.chapterTitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.quoteBox, { backgroundColor: colors.accentSoft, borderLeftColor: colors.primary }]}>
        <AppIcon name="highlight" size={14} color={colors.primary} />
        <Text style={[styles.quote, { color: colors.text }]}>"{highlight.excerpt}"</Text>
      </View>
      <View style={styles.highlightActions}>
        <Pressable onPress={onOpenBook}>
          <Text style={[styles.link, { color: colors.primary }]}>Ver en el lector</Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text style={[styles.deleteLink, { color: colors.error }]}>Quitar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function StudyReadingCard({
  title,
  authorName,
  percentage,
  onPress,
}: {
  title: string;
  authorName?: string | null;
  percentage: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <AppIcon name="library-filled" size={22} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {authorName ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {authorName}
          </Text>
        ) : null}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${Math.min(100, Math.max(4, percentage))}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {Math.round(percentage)}% leído
        </Text>
      </View>
      <AppIcon name="forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  noteCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noteHeader: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteHeaderText: { flex: 1, minWidth: 0 },
  bookRef: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  noteBody: { fontSize: 14, lineHeight: 21 },
  deleteLink: { fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  highlightCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  highlightTop: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  cover: { width: 44, height: 58, borderRadius: radius.sm },
  coverFallback: {
    width: 44,
    height: 58,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightMeta: { flex: 1, justifyContent: 'center' },
  quoteBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    marginBottom: spacing.sm,
  },
  quote: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  highlightActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { fontWeight: '700', fontSize: 13 },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabel: { fontSize: 11, marginTop: 4 },
});
