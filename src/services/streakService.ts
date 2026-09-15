export interface StreakCalculationResult {
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  completedDates: string[];
  streakIncreased: boolean;
  streakReset: boolean;
  isFirstToday: boolean;
}

export interface DayStatus {
  dateStr: string;
  dayName: string;
  dayNumber: number;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/**
 * Returns today's date formatted as YYYY-MM-DD in local timezone
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date formatted as YYYY-MM-DD
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates updated streak information when a user completes a daily activity/node
 */
export function updateStreakOnActivity(
  currentStreak: number = 0,
  longestStreak: number = 0,
  lastActiveDate: string = '',
  completedDates: string[] = []
): StreakCalculationResult {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const updatedCompletedDates = Array.from(new Set([...completedDates, today]));

  // If already completed an activity today
  if (lastActiveDate === today) {
    return {
      streak: Math.max(1, currentStreak),
      longestStreak: Math.max(currentStreak, longestStreak, 1),
      lastActiveDate: today,
      completedDates: updatedCompletedDates,
      streakIncreased: false,
      streakReset: false,
      isFirstToday: false,
    };
  }

  let newStreak = 1;
  let streakIncreased = false;
  let streakReset = false;

  if (lastActiveDate === yesterday) {
    // Continued streak from yesterday!
    newStreak = currentStreak + 1;
    streakIncreased = true;
  } else if (!lastActiveDate) {
    // First time starting streak
    newStreak = 1;
    streakIncreased = true;
  } else {
    // Missed 1 or more days -> streak resets to 1 today
    newStreak = 1;
    streakReset = true;
  }

  const newLongestStreak = Math.max(newStreak, longestStreak);

  return {
    streak: newStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: today,
    completedDates: updatedCompletedDates,
    streakIncreased,
    streakReset,
    isFirstToday: true,
  };
}

/**
 * Generates status for the current week or last 7 days for calendar display
 */
export function getWeeklyStreakCalendar(completedDates: string[] = []): DayStatus[] {
  const todayStr = getTodayDateString();
  const result: DayStatus[] = [];
  const completedSet = new Set(completedDates);

  // Generate last 7 days ending today (or recent 7 days window: today - 6 days to today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = ARABIC_DAYS[d.getDay()];
    const dayNumber = d.getDate();
    const isToday = dateStr === todayStr;
    const isCompleted = completedSet.has(dateStr);

    result.push({
      dateStr,
      dayName,
      dayNumber,
      isCompleted,
      isToday,
      isFuture: false,
    });
  }

  return result;
}
