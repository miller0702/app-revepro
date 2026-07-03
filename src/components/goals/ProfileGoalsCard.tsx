import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { useActivityGoals } from '../../hooks/useActivityGoals';
import { GoalProgressRing } from './GoalProgressRing';
import { WeekGoalsChart } from './WeekGoalsChart';
import { AppIcon } from '../ui/AppIcon';
import { radius, spacing, typography } from '../../theme/tokens';

const RING_SIZE = 56;

function InsightPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: highlight ? colors.accentSoft : colors.background,
          borderColor: highlight ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[styles.pillValue, { color: highlight ? colors.accent : colors.text }]}>{value}</Text>
      <Text style={[styles.pillLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ProfileGoalsCard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const {
    readingSeconds,
    studySeconds,
    dailyReadingGoalMinutes,
    dailyStudyGoalMinutes,
    weeklyReadingGoalMinutes,
    readingProgress,
    studyProgress,
    weeklyReadingProgress,
    readingMet,
    studyMet,
    weeklyReadingMet,
    bothMetToday,
    streak,
    weekGoalsMet,
    weekDays,
    readingLabel,
    studyLabel,
    weeklyReadingLabel,
  } = useActivityGoals();

  const readingMinutes = Math.floor(readingSeconds / 60);
  const studyMinutes = Math.floor(studySeconds / 60);

  const gradientColors = isDark
    ? ([colors.surfaceElevated, colors.surface] as const)
    : ([colors.accentSoft + '88', colors.surface] as const);

  const weeklyValue = weeklyReadingMet
    ? t('goals.met')
    : `${Math.round(weeklyReadingProgress * 100)}%`;

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
            <Text style={[styles.title, { color: colors.text }]}>{t('goals.profileTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {bothMetToday ? t('goals.todayComplete') : t('goals.todayPending')}
            </Text>
          </View>
          {bothMetToday ? (
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <AppIcon name="check-done" size={18} color={colors.accent} />
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <AppIcon name="forward" size={16} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.pillsRow}>
          <InsightPill label={t('goals.streak')} value={String(streak)} highlight={streak > 0} />
          <InsightPill label={t('goals.weekDays')} value={`${weekGoalsMet}/7`} highlight={weekGoalsMet >= 5} />
          <InsightPill label={t('goals.weekly')} value={weeklyValue} highlight={weeklyReadingMet} />
        </View>

        <View style={[styles.ringsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.ringsRow}>
            <View style={styles.ringItem}>
              <GoalProgressRing
                progress={readingProgress}
                value={readingMinutes}
                totalSeconds={readingSeconds}
                goalMinutes={dailyReadingGoalMinutes}
                activeColor={colors.primary}
                icon="library-filled"
                size={RING_SIZE}
              />
              <Text style={[styles.ringTitle, { color: colors.text }]}>{t('goals.reading')}</Text>
              <Text style={[styles.ringMeta, { color: readingMet ? colors.accent : colors.textSecondary }]}>
                {readingMet ? t('goals.met') : `${readingLabel} · ${dailyReadingGoalMinutes} min`}
              </Text>
            </View>

            <View style={[styles.ringDivider, { backgroundColor: colors.border }]} />

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
              <Text style={[styles.ringMeta, { color: studyMet ? colors.accent : colors.textSecondary }]}>
                {studyMet ? t('goals.met') : `${studyLabel} · ${dailyStudyGoalMinutes} min`}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.weekSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.weekHeader}>
            <Text style={[styles.weekTitle, { color: colors.text }]}>{t('goals.weekChartTitle')}</Text>
            <Text style={[styles.weekMeta, { color: colors.textSecondary }]}>
              {weeklyReadingLabel} / {weeklyReadingGoalMinutes} min
            </Text>
          </View>
          <WeekGoalsChart days={weekDays} compact />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
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
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    ...typography.body,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
  },
  pillValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  pillLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  ringsCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ringItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ringDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: spacing.xs,
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
    paddingHorizontal: 4,
  },
  weekSection: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingTop: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  weekTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  weekMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
});
