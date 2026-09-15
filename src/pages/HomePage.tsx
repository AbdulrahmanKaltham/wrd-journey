import React from 'react';
import { useApp } from '../context/AppContext';
import { CompanionWidget } from '../components/Companion/CompanionWidget';
import { AvatarDisplay } from '../components/Avatar/AvatarDisplay';
import { StreakWidget } from '../components/Streak/StreakWidget';
import { Flame, Star, Play, ArrowLeft, Tent } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, weeks, setActiveTab, openWeekModal } = useApp();

  // Find active week
  const currentWeek = weeks.find(w => w.id === user.currentWeek) || weeks[0];

  return (
    <div className="space-y-4 pb-24 pt-3 px-4 max-w-md mx-auto">
      {/* Daily Ward Hero Card (Vibrant Theme) */}
      <div className="bg-gradient-to-br from-[#006304] to-[#004D03] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="hover:scale-105 transition-transform"
              title="تعديل الشخصية"
            >
              <AvatarDisplay
                avatarStyle={user.avatarStyle || 'hafiz'}
                outfitColor={user.outfitColor || 'green'}
                bagStyle={user.bagStyle || 'satchel'}
                accessoryStyle={user.accessoryStyle || 'quran'}
                size="md"
                animated={true}
                className="bg-white/10 border-white/30"
              />
            </button>
            <div>
              <span className="text-xs font-medium text-emerald-200 block">
                السلام عليكم ورحمة الله 👋
              </span>
              <h1 className="text-xl font-black font-heading text-white mt-0.5">
                وِرد اليوم، {user.displayName}
              </h1>
            </div>
          </div>
          <span className="text-xs font-bold bg-[#F9BF3B] text-black px-3 py-1 rounded-full shadow-xs">
            {currentWeek.title}
          </span>
        </div>

        <p className="text-sm opacity-90 leading-relaxed font-medium">
          سورة {currentWeek.surahs.slice(0, 3).join('، ')} - مراجعة وتثبيت
        </p>

        {/* Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-emerald-100 font-bold">
            <span>إنجاز الأسبوع</span>
            <span className="font-num text-[#F9BF3B]">
              {Math.round((user.completedNodes.length / 85) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#F9BF3B] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#F9BF3B]"
              style={{ width: `${Math.max(12, Math.round((user.completedNodes.length / 85) * 100))}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => openWeekModal(currentWeek)}
          className="w-full bg-[#F9BF3B] hover:bg-[#f3b220] text-black font-bold py-3 px-4 rounded-xl text-sm shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
        >
          <Play className="w-4 h-4 fill-current text-black" />
          <span>ابدأ الورد</span>
        </button>
      </div>

      {/* Streak Tracker Card */}
      <StreakWidget />

      {/* Personal Camp Preview Card (Vibrant Yellow Card) */}
      <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#F9BF3B] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#C79545]">مخيمي الشخصي 🏕️</h4>
            <p className="text-xs text-[#C79545]/80 font-medium mt-0.5">
              عالمك الافتراضي يتزين بإنجازاتك في حفظ القرآن
            </p>
          </div>
          <button
            onClick={() => setActiveTab('camp')}
            className="text-xs font-bold text-[#C79545] bg-white border border-[#F9BF3B] px-3 py-1.5 rounded-xl hover:bg-[#FFF8E7] transition-all flex items-center gap-1 shadow-2xs"
          >
            <span>زيارة المخيم</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-2.5 pt-1">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#F9BF3B] text-xl shadow-2xs">
            ⛺
          </div>
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#F9BF3B] text-xl shadow-2xs">
            🌳
          </div>
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#F9BF3B] text-xl shadow-2xs">
            📜
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-dashed border-gray-300 text-gray-400 font-bold text-sm">
            +
          </div>
        </div>
      </div>

      {/* Companion Widget */}
      <CompanionWidget />

      {/* Active Journey Card */}
      <div className="bg-[#F0F9F0] border-2 border-[#006304] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#006304] text-white flex items-center justify-center text-xl font-bold shadow-xs">
              🗺️
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#006304]">
                جزء عم (الخريطة النشطة)
              </h3>
              <p className="text-[11px] text-emerald-800 font-medium">
                الأسبوع {user.currentWeek} من 17 أسبوعاً
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('journey')}
            className="text-xs font-bold bg-[#006304] text-white px-3 py-1.5 rounded-xl hover:bg-[#004d03] transition-all flex items-center gap-1 shadow-2xs"
          >
            <span>فتح الخريطة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

