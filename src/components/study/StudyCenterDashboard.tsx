import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { radius, spacing, typography } from '../../theme/tokens';

export type StudyStats = {
  folders: number;
  notes: number;
  highlights: number;
  reading: number;
};

type QuickAction = {
  id: string;
  label: string;
  icon: AppIconName;
  onPress: () => void;
};

type Props = {
  stats: StudyStats;
  studyMinutesToday: number;
  studyGoalMinutes: number;
  onSync: () => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onOpenLibrary: () => void;
};

export function StudyCenterDashboard({
  stats,
  studyMinutesToday,
  studyGoalMinutes,
  onSync,
  onNewFolder,
  onNewNote,
  onOpenLibrary,
}: Props) {
  const { colors, isDark } = useTheme();

  const gradientColors = isDark
    ? ([colors.surfaceElevated, colors.surface] as const)
    : ([colors.accentSoft, colors.surface] as const);

  const actions: QuickAction[] = [
    { id: 'folder', label: 'Nueva carpeta', icon: 'folder-add', onPress: onNewFolder },
    { id: 'note', label: 'Nueva nota', icon: 'compose', onPress: onNewNote },
    { id: 'library', label: 'Biblioteca', icon: 'library-filled', onPress: onOpenLibrary },
    { id: 'sync', label: 'Sincronizar', icon: 'sync', onPress: onSync },
  ];

  const statItems = [
    { label: 'Carpetas', value: stats.folders, icon: 'folder' as const },
    { label: 'Notas', value: stats.notes, icon: 'document' as const },
    { label: 'Subrayados', value: stats.highlights, icon: 'highlight' as const },
    { label: 'Leyendo', value: stats.reading, icon: 'library' as const },
  ];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { borderColor: colors.border }]}
    >
      <View style={styles.heroTop}>
        <View style={[styles.heroIconWrap, { backgroundColor: colors.primary }]}>
          <AppIcon name="study" size={22} color={colors.onPrimary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Tu espacio de estudio</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {studyMinutesToday} / {studyGoalMinutes} min de estudio hoy
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {statItems.map((item) => (
          <View key={item.label} style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <AppIcon name={item.icon} size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
              <AppIcon name={action.icon} size={18} color={colors.accent} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroTitle: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 17,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radius.lg,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  pressed: { opacity: 0.9 },
});
