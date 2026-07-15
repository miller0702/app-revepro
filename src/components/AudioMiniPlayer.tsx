import { Pressable, Text, StyleSheet, View } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { radius, spacing, typography } from '../theme/tokens';
import { formatDuration } from '../utils/format';

type Props = {
  /** Variante sobre el tab bar flotante (píldora separada). */
  floating?: boolean;
};

export function AudioMiniPlayer({ floating = false }: Props) {
  const { colors, isDark } = useTheme();
  const { track, isPlaying, positionMs, durationMs, toggle, stop } = usePlayerStore();

  if (!track) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const surface = floating
    ? isDark
      ? 'rgba(22, 26, 34, 0.88)'
      : 'rgba(18, 20, 26, 0.84)'
    : colors.surface;
  const textPrimary = floating ? '#FFFFFF' : colors.text;
  const textSecondary = floating ? 'rgba(255,255,255,0.72)' : colors.textSecondary;
  const border = floating ? 'rgba(255,255,255,0.14)' : colors.border;

  return (
    <View
      style={[
        floating ? styles.floating : styles.container,
        {
          backgroundColor: surface,
          borderColor: border,
          borderBottomColor: border,
        },
      ]}
    >
      <View style={[styles.progress, { backgroundColor: floating ? 'rgba(255,255,255,0.16)' : colors.border }]}>
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
          <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
            {track.title}
          </Text>
          {track.subtitle && (
            <Text style={[styles.subtitle, { color: textSecondary }]} numberOfLines={1}>
              {track.subtitle}
            </Text>
          )}
          {track.kind === 'podcast' || track.kind === 'audiobook' ? (
            durationMs > 0 && (
              <Text style={[styles.time, { color: textSecondary }]}>
                {formatDuration(Math.floor(positionMs / 1000))} /{' '}
                {formatDuration(Math.floor(durationMs / 1000))}
              </Text>
            )
          ) : null}
        </View>
        <Pressable onPress={toggle} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <AppIcon name={isPlaying ? 'pause' : 'play'} size={16} color={colors.onPrimary} />
        </Pressable>
        <Pressable onPress={stop} style={styles.closeBtn} accessibilityLabel="Cerrar reproductor">
          <AppIcon name="close" size={20} color={textSecondary} />
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
  floating: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  progress: { height: 2, width: '100%' },
  progressFill: { height: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  art: {
    width: 40,
    height: 40,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  closeBtn: { padding: spacing.sm },
});
