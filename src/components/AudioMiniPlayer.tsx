import { Pressable, Text, StyleSheet, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { radius, spacing, typography } from '../theme/tokens';
import { formatDuration } from '../utils/format';

export function AudioMiniPlayer() {
  const { colors } = useTheme();
  const { track, isPlaying, positionMs, durationMs, toggle, stop } = usePlayerStore();

  if (!track) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.progress, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <View style={[styles.art, { backgroundColor: colors.cardGradient[0] }]}>
          <AppIcon
            name={track.kind === 'radio' ? 'radio' : 'music'}
            size={18}
            color={colors.onPrimary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {track.title}
          </Text>
          {track.subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {track.subtitle}
            </Text>
          )}
          {track.kind === 'podcast' || track.kind === 'audiobook' ? (
            durationMs > 0 && (
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatDuration(Math.floor(positionMs / 1000))} / {formatDuration(Math.floor(durationMs / 1000))}
              </Text>
            )
          ) : null}
        </View>
        <Pressable onPress={toggle} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <AppIcon name={isPlaying ? 'pause' : 'play'} size={16} color={colors.onPrimary} />
        </Pressable>
        <Pressable onPress={stop} style={styles.closeBtn} accessibilityLabel="Cerrar reproductor">
          <AppIcon name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
  },
  progress: { height: 2, width: '100%' },
  progressFill: { height: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.caption, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 11, marginTop: 2 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  closeBtn: { padding: spacing.sm },
});
