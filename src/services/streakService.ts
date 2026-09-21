/**
 * Streak and Activity Tracking Service
 * Manages daily Quran activity streaks, calendar calculations, and date helpers.
 */

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface StreakUpdateResult {
  streak: number;
  longestStreak: number;
  streakMaintained: boolean;
  isNewDay: boolean;
  completedDates: string[];
}

export function updateStreakOnActivity(
  currentStreak = 0,
  longestStreak = 0,
  lastActiveDate?: string,
  completedDates: string[] = []
): StreakUpdateResult {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const newCompletedDates = Array.isArray(completedDates) ? [...completedDates] : [];
  if (!newCompletedDates.includes(today)) {
    newCompletedDates.push(today);
  }

  // If already active today
  if (lastActiveDate === today) {
    const s = Math.max(1, currentStreak);
    return {
      streak: s,
      longestStreak: Math.max(longestStreak || 0, s),
      streakMaintained: true,
      isNewDay: false,
      completedDates: newCompletedDates,
    };
  }

  // If consecutive day from yesterday
  if (lastActiveDate === yesterday) {
    const newStreak = (currentStreak || 0) + 1;
    return {
      streak: newStreak,
      longestStreak: Math.max(longestStreak || 0, newStreak),
      streakMaintained: true,
      isNewDay: true,
      completedDates: newCompletedDates,
    };
  }

  // Break in streak or first activity
  const newStreak = 1;
  return {
    streak: newStreak,
    longestStreak: Math.max(longestStreak || 0, newStreak),
    streakMaintained: false,
    isNewDay: true,
    completedDates: newCompletedDates,
  };
}

export interface DayCalendarItem {
  dayName: string;
  dayNumber: number;
  dateStr: string;
  isCompleted: boolean;
  isToday: boolean;
  isPast: boolean;
}

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function getWeeklyStreakCalendar(completedDates: string[] = []): DayCalendarItem[] {
  const todayStr = getTodayDateString();
  const calendar: DayCalendarItem[] = [];
  const completedSet = new Set(completedDates || []);

  // Generate 7 days ending today
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = d.getDay();
    const isToday = dateStr === todayStr;
    const isPast = i > 0;

    calendar.push({
      dayName: ARABIC_DAYS[dayOfWeek],
      dayNumber: d.getDate(),
      dateStr,
      isCompleted: completedSet.has(dateStr),
      isToday,
      isPast,
    });
  }

  return calendar;
}

