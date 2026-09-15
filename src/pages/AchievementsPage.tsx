import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Star, Flame, Award, Lock } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { user, badges } = useApp();

  const completedWeeksCount = user.completedWeeks.length;
  const juzAmmaProgress = Math.round((completedWeeksCount / 17) * 100);
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#F9BF3B] shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[#C79545] text-xs font-bold mb-0.5">
            <Trophy className="w-4 h-4 text-[#C79545]" />
            <span>سجل الإنجازات والأوسمة 🏆</span>
          </div>
          <h2 className="font-heading font-extrabold text-lg text-[#006304]">
            صحيفة إنجازك المبارك 📜
          </h2>
          <p className="text-xs text-gray-600 font-medium mt-0.5">
            تتبع ثمار التزامك واجتهادك اليومي مع القرآن الكريم
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white border border-[#F9BF3B] flex items-center justify-center text-2xl shadow-2xs">
          ⭐
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#F0F9F0] border border-[#006304] rounded-2xl p-3 text-center shadow-2xs space-y-0.5">
          <Star className="w-5 h-5 text-[#006304] mx-auto fill-[#006304]" />
          <span className="font-num font-extrabold text-[#006304] text-base block">{user.xp}</span>
          <span className="text-[10px] text-gray-600 font-bold block">نقاط XP</span>
        </div>

        <div className="bg-[#FFF8E7] border border-[#F9BF3B] rounded-2xl p-3 text-center shadow-2xs space-y-0.5">
          <Flame className="w-5 h-5 text-[#F9BF3B] mx-auto fill-[#F9BF3B]" />
          <span className="font-num font-extrabold text-[#C79545] text-base block">{user.streak} يوماً</span>
          <span className="text-[10px] text-gray-600 font-bold block">سلسلة الالتزام</span>
        </div>

        <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-3 text-center shadow-2xs space-y-0.5">
          <Award className="w-5 h-5 text-[#006304] mx-auto" />
          <span className="font-num font-extrabold text-slate-900 text-base block">{unlockedBadgesCount} / {badges.length}</span>
          <span className="text-[10px] text-gray-600 font-bold block">الأوسمة المكتسبة</span>
        </div>
      </div>

      {/* Juz Amma Progress Bar Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <span className="font-heading font-extrabold text-sm text-slate-900">
              تقدم حفظ جزء عم
            </span>
          </div>
          <span className="font-num font-bold text-xs text-[#006304] bg-[#F0F9F0] px-3 py-0.5 rounded-full border border-[#006304]">
            {completedWeeksCount} / 17 أسبوعاً
          </span>
        </div>

        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
          <div
            className="bg-[#006304] h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${juzAmmaProgress}%` }}
          />
        </div>

        <p className="text-[11px] text-gray-600 font-medium">
          أتممت {juzAmmaProgress}% من المسار الشامل لجزء عم مع نادي ورد.
        </p>
      </div>

      {/* Badges Grid */}
      <div className="space-y-2.5">
        <h3 className="font-heading font-extrabold text-sm text-slate-900">
          الأوسمة الشرفية (Badges):
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                badge.unlocked
                  ? 'bg-[#FFF8E7] border-[#F9BF3B] shadow-2xs'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border ${
                badge.unlocked ? 'bg-white border-[#F9BF3B]' : 'bg-gray-200 border-gray-300'
              }`}>
                {badge.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs text-slate-900">
                    {badge.title}
                  </h4>
                  {badge.unlocked ? (
                    <span className="text-[10px] text-[#006304] font-bold bg-[#F0F9F0] px-1.5 py-0.2 rounded-md border border-[#006304]">
                      مكتسب ✓
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>

                <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 font-medium">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

