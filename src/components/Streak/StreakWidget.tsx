import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getWeeklyStreakCalendar, getTodayDateString } from '../../services/streakService';
import { Flame, Trophy, Calendar, CheckCircle2, Sparkles, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface StreakWidgetProps {
  compact?: boolean;
  className?: string;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ compact = false, className = '' }) => {
  const { user } = useApp();
  const [expanded, setExpanded] = useState(!compact);

  const weeklyCalendar = getWeeklyStreakCalendar(user.completedDates || []);
  const todayStr = getTodayDateString();
  const isCompletedToday = user.lastActiveDate === todayStr;

  const currentStreak = user.streak || 0;
  const longestStreak = Math.max(user.longestStreak || 0, currentStreak);
  const totalCompletedDays = (user.completedDates || []).length;

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={`bg-[#FFF8E7] border-2 border-[#F9BF3B] rounded-2xl p-3 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-2 text-right w-full ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F9BF3B] text-slate-900 flex items-center justify-center font-black text-lg shadow-2xs animate-pulse">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm text-[#C79545] font-num">
                {currentStreak} {currentStreak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
              </span>
              {isCompletedToday && (
                <span className="bg-[#006304] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                  مكتمل اليوم ✓
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              {isCompletedToday ? 'أحسنت! حافظت على وردك اليوم' : 'أكمل وِرد اليوم للحفاظ على السلسلة'}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-[#C79545]" />
      </button>
    );
  }

  return (
    <div className={`bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C79545] to-[#F9BF3B] text-white flex items-center justify-center text-xl shadow-md">
            🔥
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <span>سلسلة الالتزام اليومي</span>
              <span className="text-xs bg-[#FFF8E7] text-[#C79545] border border-[#F9BF3B]/40 px-2 py-0.5 rounded-full font-num font-bold">
                {currentStreak} أيام 🔥
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              تتبّع الاستمرار على الورد القرآني يومًا بعد يوم
            </p>
          </div>
        </div>

        {compact && (
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mini 7-Day Calendar */}
      <div className="bg-[#F0F9F0] border border-[#006304]/20 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#006304]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#006304]" />
            <span>سجل الأيام السبعة الأخيرة</span>
          </span>
          <span className="text-gray-500 text-[10px]">
            {isCompletedToday ? 'كتِبت لك حسنة اليوم 🌱' : 'لم تُكمل وِرد اليوم بعد'}
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center pt-1">
          {weeklyCalendar.map((day, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-1.5 flex flex-col items-center justify-between border transition-all ${
                day.isToday
                  ? day.isCompleted
                    ? 'bg-[#006304] text-white border-[#006304] shadow-sm ring-2 ring-[#F9BF3B]'
                    : 'bg-[#FFF8E7] text-slate-900 border-[#F9BF3B] ring-2 ring-[#F9BF3B]'
                  : day.isCompleted
                  ? 'bg-white text-[#006304] border-[#006304]/30'
                  : 'bg-white/60 text-gray-400 border-gray-200 opacity-70'
              }`}
            >
              <span className="text-[9px] font-bold block mb-0.5 opacity-80">
                {day.dayName}
              </span>

              <div className="w-6 h-6 rounded-full flex items-center justify-center my-0.5 text-xs font-bold font-num">
                {day.isCompleted ? (
                  <span className={day.isToday ? 'text-white' : 'text-[#006304]'}>✓</span>
                ) : (
                  <span>{day.dayNumber}</span>
                )}
              </div>

              <span className="text-[8px] font-bold">
                {day.isToday ? 'اليوم' : day.isCompleted ? 'مكتمل' : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 gap-2 text-center pt-1">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
          <span className="text-[10px] text-gray-500 font-bold block">أطول سلسلة إنجاز</span>
          <span className="font-heading font-black text-xs text-[#006304] font-num flex items-center justify-center gap-1 mt-0.5">
            <Trophy className="w-3.5 h-3.5 text-[#F9BF3B]" />
            <span>{longestStreak} {longestStreak === 1 ? 'يوم' : 'أيام'}</span>
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
          <span className="text-[10px] text-gray-500 font-bold block">إجمالي أيام الورد</span>
          <span className="font-heading font-black text-xs text-[#C79545] font-num flex items-center justify-center gap-1 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F9BF3B]" />
            <span>{totalCompletedDays} {totalCompletedDays === 1 ? 'يوم' : 'أيام'}</span>
          </span>
        </div>
      </div>

      {/* Motivational Footnote */}
      <div className="text-center pt-1">
        <p className="text-[10px] text-gray-500 font-medium">
          "أحب الأعمال إلى الله أدومها وإن قل" 🌿
        </p>
      </div>
    </div>
  );
};
