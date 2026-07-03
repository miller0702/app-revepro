import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { useTheme } from '../../src/hooks/useTheme';
import { useI18n } from '../../src/hooks/useI18n';
import { useActivityGoals } from '../../src/hooks/useActivityGoals';
import {
  useGoalsStore,
  READING_GOAL_PRESETS,
  STUDY_GOAL_PRESETS,
  WEEKLY_READING_GOAL_PRESETS,
} from '../../src/stores/goalsStore';
import { GoalProgressRing } from '../../src/components/goals/GoalProgressRing';
import { WeekGoalsChart } from '../../src/components/goals/WeekGoalsChart';
import { AppIcon } from '../../src/components/ui/AppIcon';
import { spacing, radius, typography } from '../../src/theme/tokens';

function GoalPresetRow({
  title,
  hint,
  value,
  presets,
  onSelect,
}: {
  title: string;
  hint: string;
  value: number;
  presets: readonly number[];
  onSelect: (minutes: number) => void;
}) {
  const { colors, scaleFont } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
        {title}
      </Text>
      <Text style={[styles.sectionHint, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
        {hint}
      </Text>
      <View style={styles.chipRow}>
        {presets.map((preset) => (
          <Pressable
            key={preset}
            style={[
              styles.chip,
              { borderColor: colors.border },
              value === preset && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => onSelect(preset)}
          >
            <Text
              style={{
                color: value === preset ? colors.onPrimary : colors.text,
                fontWeight: '600',
                fontSize: scaleFont(13),
              }}
            >
              {preset} min
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const { colors, scaleFont } = useTheme();
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

  const setDailyReadingGoalMinutes = useGoalsStore((s) => s.setDailyReadingGoalMinutes);
  const setDailyStudyGoalMinutes = useGoalsStore((s) => s.setDailyStudyGoalMinutes);
  const setWeeklyReadingGoalMinutes = useGoalsStore((s) => s.setWeeklyReadingGoalMinutes);

  const weeklyHint = t('goals.weeklyReading')
    .replace('{current}', weeklyReadingLabel)
    .replace('{goal}', String(weeklyReadingGoalMinutes));

  return (
    <DrawerScreenLayout title={t('goals.title')} subtitle={t('goals.subtitle')}>
      <View
        style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.todayHeader}>
          <Text style={[styles.todayTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
            {t('goals.todayTitle')}
          </Text>
          {bothMetToday ? (
            <View style={[styles.completeBadge, { backgroundColor: colors.accentSoft }]}>
              <AppIcon name="check-done" size={16} color={colors.accent} />
              <Text style={[styles.completeText, { color: colors.accent }]}>{t('goals.met')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.todayRings}>
          <View style={styles.ringBlock}>
            <GoalProgressRing
              progress={readingProgress}
              value={Math.floor(readingSeconds / 60)}
              totalSeconds={readingSeconds}
              goalMinutes={dailyReadingGoalMinutes}
              activeColor={colors.primary}
              icon="library-filled"
              size={64}
            />
            <Text style={[styles.ringTitle, { color: colors.text }]}>{t('goals.reading')}</Text>
            <Text style={[styles.ringMeta, { color: readingMet ? colors.accent : colors.textSecondary }]}>
              {readingLabel} / {dailyReadingGoalMinutes} min
            </Text>
          </View>
          <View style={styles.ringBlock}>
            <GoalProgressRing
              progress={studyProgress}
              value={Math.floor(studySeconds / 60)}
              totalSeconds={studySeconds}
              goalMinutes={dailyStudyGoalMinutes}
              activeColor={colors.accent}
              icon="study"
              size={64}
            />
            <Text style={[styles.ringTitle, { color: colors.text }]}>{t('goals.study')}</Text>
            <Text style={[styles.ringMeta, { color: studyMet ? colors.accent : colors.textSecondary }]}>
              {studyLabel} / {dailyStudyGoalMinutes} min
            </Text>
          </View>
        </View>

        <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('goals.streak')}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{weekGoalsMet}/7</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('goals.weekDays')}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryValue,
                { color: weeklyReadingMet ? colors.accent : colors.text },
              ]}
            >
              {weeklyReadingMet ? '✓' : `${Math.round(weeklyReadingProgress * 100)}%`}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('goals.weekly')}</Text>
          </View>
        </View>
        <Text style={[styles.weeklyHint, { color: colors.textSecondary }]}>{weeklyHint}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
          {t('goals.weekChartTitle')}
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
          {t('goals.weekChartHint')}
        </Text>
        <WeekGoalsChart days={weekDays} />
      </View>

      <Text style={[styles.configHeading, { color: colors.text, fontSize: scaleFont(16) }]}>
        {t('goals.configureTitle')}
      </Text>

      <GoalPresetRow
        title={t('goals.dailyReadingGoal')}
        hint={t('goals.dailyReadingHint')}
        value={dailyReadingGoalMinutes}
        presets={READING_GOAL_PRESETS}
        onSelect={setDailyReadingGoalMinutes}
      />

      <GoalPresetRow
        title={t('goals.dailyStudyGoal')}
        hint={t('goals.dailyStudyHint')}
        value={dailyStudyGoalMinutes}
        presets={STUDY_GOAL_PRESETS}
        onSelect={setDailyStudyGoalMinutes}
      />

      <GoalPresetRow
        title={t('goals.weeklyReadingGoal')}
        hint={t('goals.weeklyReadingHint')}
        value={weeklyReadingGoalMinutes}
        presets={WEEKLY_READING_GOAL_PRESETS}
        onSelect={setWeeklyReadingGoalMinutes}
      />

      <View style={[styles.tipCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <Text style={[styles.tipTitle, { color: colors.text }]}>{t('goals.trackingTitle')}</Text>
        <Text style={[styles.tipBody, { color: colors.textSecondary }]}>{t('goals.trackingHint')}</Text>
      </View>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  todayCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  todayTitle: {
    ...typography.title,
    fontSize: 17,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  completeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  todayRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  ringBlock: {
    alignItems: 'center',
    gap: 6,
  },
  ringTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ringMeta: {
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  weeklyHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  sectionHint: { marginBottom: spacing.md, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexGrow: 1,
    flexBasis: '28%',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  configHeading: {
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  tipTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
