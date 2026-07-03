import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import type { DayActivity } from '../../lib/activityTime';
import { radius, spacing } from '../../theme/tokens';

type Props = {
  days: DayActivity[];
  /** Oculta leyenda (p. ej. en tarjeta de perfil). */
  compact?: boolean;
};

export function WeekGoalsChart({ days, compact = false }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <View style={styles.daysRow}>
        {days.map((day) => {
        const bothMet = day.readingMet && day.studyMet;
        return (
          <View key={day.date} style={styles.dayCol}>
            <View style={styles.bars}>
              <View
                style={[
                  styles.bar,
                  {
                    height: day.readingMet ? 28 : 10,
                    backgroundColor: day.readingMet ? colors.primary : colors.border,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: day.studyMet ? 28 : 10,
                    backgroundColor: day.studyMet ? colors.accent : colors.border,
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: bothMet ? colors.accent : 'transparent',
                  borderColor: bothMet ? colors.accent : colors.border,
                },
              ]}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
              {day.label}
            </Text>
          </View>
        );
      })}
      </View>
      {!compact ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('goals.reading')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('goals.study')}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 32,
  },
  bar: {
    width: 8,
    borderRadius: radius.sm,
    minHeight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
  },
});
