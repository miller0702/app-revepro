import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { useActivityGoals } from '../../hooks/useActivityGoals';
import { GoalProgressRing } from './GoalProgressRing';
import { AppIcon } from '../ui/AppIcon';
import { radius, spacing, typography } from '../../theme/tokens';

const RING_SIZE = 58;

export function DailyGoalsCard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const {
    readingSeconds,
    studySeconds,
    dailyReadingGoalMinutes,
    dailyStudyGoalMinutes,
    readingProgress,
    studyProgress,
    readingLabel,
    studyLabel,
    bothMetToday,
  } = useActivityGoals();

  const readingMinutes = Math.floor(readingSeconds / 60);
  const studyMinutes = Math.floor(studySeconds / 60);

  const gradientColors = isDark
    ? ([colors.surfaceElevated, colors.surface] as const)
    : ([colors.surface, colors.surfaceElevated] as const);

  return (
    <Pressable
      onPress={() => router.push('/goals')}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('goals.openGoals')}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: bothMetToday ? colors.accent : colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <View style={[styles.todayPill, { backgroundColor: colors.accentSoft }]}>
              <AppIcon name="time" size={14} color={colors.primary} />
              <Text style={[styles.todayPillText, { color: colors.primary }]}>
                {t('goals.todayTitle')}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {bothMetToday ? t('goals.todayComplete') : t('goals.todayPending')}
            </Text>
          </View>
          {bothMetToday ? (
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <AppIcon name="check-done" size={18} color={colors.accent} />
            </View>
          ) : (
            <AppIcon name="forward" size={18} color={colors.textSecondary} />
          )}
        </View>

        <View style={styles.ringsRow}>
          <View style={styles.ringItem}>
            <GoalProgressRing
              progress={readingProgress}
              value={readingMinutes}
              totalSeconds={readingSeconds}
              goalMinutes={dailyReadingGoalMinutes}
              activeColor={colors.primary}
              icon="time"
              size={RING_SIZE}
            />
            <Text style={[styles.ringTitle, { color: colors.text }]}>{t('goals.reading')}</Text>
            <Text style={[styles.ringMeta, { color: colors.textSecondary }]}>
              {readingLabel} · meta {dailyReadingGoalMinutes} min
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.ringItem}>
            <GoalProgressRing
              progress={studyProgress}
              value={studyMinutes}
              totalSeconds={studySeconds}
              goalMinutes={dailyStudyGoalMinutes}
              activeColor={colors.accent}
              icon="study"
              size={RING_SIZE}
            />
            <Text style={[styles.ringTitle, { color: colors.text }]}>{t('goals.study')}</Text>
            <Text style={[styles.ringMeta, { color: colors.textSecondary }]}>
              {studyLabel} · meta {dailyStudyGoalMinutes} min
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.94 },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 6 },
  todayPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  todayPillText: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ringItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  ringTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ringMeta: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
