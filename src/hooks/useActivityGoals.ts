import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  addActivitySeconds,
  formatActivityMinutes,
  getLast7DaysActivity,
  getTodayActivitySeconds,
  getWeeklyReadingSeconds,
  goalProgress,
  computeGoalStreak,
  countDailyGoalsMet,
  type DayActivity,
} from '../lib/activityTime';
import { useGoalsStore } from '../stores/goalsStore';
import { useSettingsStore } from '../stores/settingsStore';

export function useActivitySessionTracker(kind: 'reading' | 'study') {
  useFocusEffect(
    useCallback(() => {
      const startedAt = Date.now();
      const tick = setInterval(() => {
        void addActivitySeconds(kind, 30).catch(() => undefined);
      }, 30_000);

      return () => {
        clearInterval(tick);
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remainder = elapsed % 30;
        if (remainder >= 10) {
          void addActivitySeconds(kind, remainder).catch(() => undefined);
        }
      };
    }, [kind]),
  );
}

export function useReadingSessionTracker() {
  useActivitySessionTracker('reading');
}

export function useStudySessionTracker() {
  useActivitySessionTracker('study');
}

export function useActivityGoals() {
  const locale = useSettingsStore((s) => s.locale);
  const dailyReadingGoalMinutes = useGoalsStore((s) => s.dailyReadingGoalMinutes);
  const dailyStudyGoalMinutes = useGoalsStore((s) => s.dailyStudyGoalMinutes);
  const weeklyReadingGoalMinutes = useGoalsStore((s) => s.weeklyReadingGoalMinutes);

  const [readingSeconds, setReadingSeconds] = useState(0);
  const [studySeconds, setStudySeconds] = useState(0);
  const [weeklyReadingSeconds, setWeeklyReadingSeconds] = useState(0);
  const [weekDays, setWeekDays] = useState<DayActivity[]>([]);

  const refresh = useCallback(async () => {
    const [reading, study, weekly, days] = await Promise.all([
      getTodayActivitySeconds('reading'),
      getTodayActivitySeconds('study'),
      getWeeklyReadingSeconds(),
      getLast7DaysActivity(dailyReadingGoalMinutes, dailyStudyGoalMinutes, locale),
    ]);
    setReadingSeconds(reading);
    setStudySeconds(study);
    setWeeklyReadingSeconds(weekly);
    setWeekDays(days);
  }, [dailyReadingGoalMinutes, dailyStudyGoalMinutes, locale]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  const readingProgress = goalProgress(readingSeconds, dailyReadingGoalMinutes);
  const studyProgress = goalProgress(studySeconds, dailyStudyGoalMinutes);
  const weeklyReadingProgress = goalProgress(weeklyReadingSeconds, weeklyReadingGoalMinutes);
  const readingMet = readingProgress >= 1;
  const studyMet = studyProgress >= 1;
  const weeklyReadingMet = weeklyReadingProgress >= 1;
  const bothMetToday = readingMet && studyMet;
  const streak = computeGoalStreak(weekDays);
  const weekGoalsMet = countDailyGoalsMet(weekDays);

  return {
    readingSeconds,
    studySeconds,
    weeklyReadingSeconds,
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
    weekDays,
    weekGoalsMet,
    readingLabel: formatActivityMinutes(readingSeconds),
    studyLabel: formatActivityMinutes(studySeconds),
    weeklyReadingLabel: formatActivityMinutes(weeklyReadingSeconds),
    refresh,
  };
}

/** @deprecated Usa useActivityGoals */
export function useDailyReadingTime() {
  const goals = useActivityGoals();
  return {
    seconds: goals.readingSeconds,
    goalMinutes: goals.dailyReadingGoalMinutes,
    progress: goals.readingProgress,
    label: goals.readingLabel,
    refresh: goals.refresh,
  };
}
