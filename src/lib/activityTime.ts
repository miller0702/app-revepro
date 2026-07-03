import { getString, setString } from '../storage/localStorage';
import { useGoalsStore } from '../stores/goalsStore';

export type ActivityKind = 'reading' | 'study';

const STORAGE_PREFIX: Record<ActivityKind, string> = {
  reading: 'readingTime:',
  study: 'studyTime:',
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function storageKey(kind: ActivityKind, date = new Date()): string {
  return `${STORAGE_PREFIX[kind]}${dateKey(date)}`;
}

export function getDailyReadingGoalMinutes(): number {
  return useGoalsStore.getState().dailyReadingGoalMinutes;
}

export function getDailyStudyGoalMinutes(): number {
  return useGoalsStore.getState().dailyStudyGoalMinutes;
}

export function getWeeklyReadingGoalMinutes(): number {
  return useGoalsStore.getState().weeklyReadingGoalMinutes;
}

export async function getTodayActivitySeconds(kind: ActivityKind): Promise<number> {
  return getActivitySecondsForDate(kind, new Date());
}

export async function getActivitySecondsForDate(kind: ActivityKind, date: Date): Promise<number> {
  const raw = await getString(storageKey(kind, date));
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export async function addActivitySeconds(kind: ActivityKind, seconds: number): Promise<number> {
  if (seconds <= 0) return getTodayActivitySeconds(kind);
  const current = await getTodayActivitySeconds(kind);
  const next = current + Math.floor(seconds);
  await setString(storageKey(kind), String(next));
  return next;
}

export async function getTodayReadingSeconds(): Promise<number> {
  return getTodayActivitySeconds('reading');
}

export async function addReadingSeconds(seconds: number): Promise<number> {
  return addActivitySeconds('reading', seconds);
}

export async function addStudySeconds(seconds: number): Promise<number> {
  return addActivitySeconds('study', seconds);
}

export function formatActivityMinutes(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

export function goalProgress(totalSeconds: number, goalMinutes: number): number {
  const goalSeconds = goalMinutes * 60;
  if (goalSeconds <= 0) return 0;
  return Math.min(1, totalSeconds / goalSeconds);
}

export type DayActivity = {
  date: string;
  label: string;
  readingSeconds: number;
  studySeconds: number;
  readingMet: boolean;
  studyMet: boolean;
};

function shortDayLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
}

export async function getLast7DaysActivity(
  readingGoalMinutes: number,
  studyGoalMinutes: number,
  locale = 'es',
): Promise<DayActivity[]> {
  const days: DayActivity[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const [readingSeconds, studySeconds] = await Promise.all([
      getActivitySecondsForDate('reading', date),
      getActivitySecondsForDate('study', date),
    ]);
    days.push({
      date: dateKey(date),
      label: shortDayLabel(date, locale),
      readingSeconds,
      studySeconds,
      readingMet: readingSeconds >= readingGoalMinutes * 60,
      studyMet: studySeconds >= studyGoalMinutes * 60,
    });
  }

  return days;
}

export async function getWeeklyReadingSeconds(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let total = 0;

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    total += await getActivitySecondsForDate('reading', date);
  }

  return total;
}

export function countDailyGoalsMet(days: DayActivity[]): number {
  return days.filter((day) => day.readingMet && day.studyMet).length;
}

export function computeGoalStreak(days: DayActivity[]): number {
  if (days.length === 0) return 0;

  let streak = 0;
  let startIndex = days.length - 1;

  const today = days[startIndex];
  if (!(today.readingMet && today.studyMet) && startIndex > 0) {
    startIndex -= 1;
  }

  for (let i = startIndex; i >= 0; i -= 1) {
    if (days[i].readingMet && days[i].studyMet) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
