import { create } from 'zustand';
import { getNumber, setNumber } from '../storage/localStorage';

export const READING_GOAL_PRESETS = [5, 10, 15, 20, 30, 45, 60] as const;
export const STUDY_GOAL_PRESETS = [5, 10, 15, 20, 30, 45] as const;
export const WEEKLY_READING_GOAL_PRESETS = [60, 90, 105, 150, 210, 300] as const;

export const DEFAULT_DAILY_READING_GOAL = 15;
export const DEFAULT_DAILY_STUDY_GOAL = 10;
export const DEFAULT_WEEKLY_READING_GOAL = 105;

interface GoalsState {
  dailyReadingGoalMinutes: number;
  dailyStudyGoalMinutes: number;
  weeklyReadingGoalMinutes: number;
  setDailyReadingGoalMinutes: (minutes: number) => void;
  setDailyStudyGoalMinutes: (minutes: number) => void;
  setWeeklyReadingGoalMinutes: (minutes: number) => void;
  hydrate: () => Promise<void>;
}

function clampGoal(value: number | null | undefined, fallback: number, max: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(value)));
}

export const useGoalsStore = create<GoalsState>((set) => ({
  dailyReadingGoalMinutes: DEFAULT_DAILY_READING_GOAL,
  dailyStudyGoalMinutes: DEFAULT_DAILY_STUDY_GOAL,
  weeklyReadingGoalMinutes: DEFAULT_WEEKLY_READING_GOAL,

  setDailyReadingGoalMinutes: (minutes) => {
    const next = clampGoal(minutes, DEFAULT_DAILY_READING_GOAL, 180);
    void setNumber('dailyReadingGoalMinutes', next);
    set({ dailyReadingGoalMinutes: next });
  },

  setDailyStudyGoalMinutes: (minutes) => {
    const next = clampGoal(minutes, DEFAULT_DAILY_STUDY_GOAL, 120);
    void setNumber('dailyStudyGoalMinutes', next);
    set({ dailyStudyGoalMinutes: next });
  },

  setWeeklyReadingGoalMinutes: (minutes) => {
    const next = clampGoal(minutes, DEFAULT_WEEKLY_READING_GOAL, 600);
    void setNumber('weeklyReadingGoalMinutes', next);
    set({ weeklyReadingGoalMinutes: next });
  },

  hydrate: async () => {
    const [dailyReadingGoalMinutes, dailyStudyGoalMinutes, weeklyReadingGoalMinutes] =
      await Promise.all([
        getNumber('dailyReadingGoalMinutes'),
        getNumber('dailyStudyGoalMinutes'),
        getNumber('weeklyReadingGoalMinutes'),
      ]);

    set({
      dailyReadingGoalMinutes: clampGoal(
        dailyReadingGoalMinutes,
        DEFAULT_DAILY_READING_GOAL,
        180,
      ),
      dailyStudyGoalMinutes: clampGoal(dailyStudyGoalMinutes, DEFAULT_DAILY_STUDY_GOAL, 120),
      weeklyReadingGoalMinutes: clampGoal(
        weeklyReadingGoalMinutes,
        DEFAULT_WEEKLY_READING_GOAL,
        600,
      ),
    });
  },
}));
