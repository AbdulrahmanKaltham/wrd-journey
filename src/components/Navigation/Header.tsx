import React from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import { Flame, Star, GraduationCap, Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    user,
    weeks,
    setActiveTab,
    language,
    unreadNotificationsCount,
    setIsNotificationsModalOpen,
  } = useSupabase();
  const currentWeek = weeks.find(w => w.id === user.currentWeek) || weeks[0];

  const isTeacher = user.role === 'teacher';
  const defaultTitle = isTeacher
    ? (language === 'en' ? 'Respected Teacher' : 'فضيلة المعلم')
    : (language === 'en' ? 'Ward Reciter' : 'قارئ ورد');
  const userName = user.displayName || user.name || defaultTitle;

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-[#E0E0E0] px-4 py-2.5 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* User / Club Info */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('profile')}
            className="hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={language === 'en' ? 'Edit Profile & Settings' : 'تعديل الشخصية والحساب'}
          >
            <AvatarDisplay
              avatarStyle={user.avatarStyle || (isTeacher ? 'hafiz' : 'hafiz')}
              outfitColor={user.outfitColor || 'green'}
              bagStyle={user.bagStyle || 'satchel'}
              accessoryStyle={user.accessoryStyle || 'quran'}
              size="sm"
            />
          </button>
          <div className={language === 'en' ? 'text-left' : 'text-right'}>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-800 font-bold leading-none">
                {language === 'en' ? `Welcome, ${userName} 🌱` : `أهلاً بك، ${userName} 🌱`}
              </p>
              {isTeacher && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {language === 'en' ? 'Teacher' : 'معلم'}
                </span>
              )}
            </div>
            <p className="text-[11px] font-extrabold text-[#006304] leading-none font-heading mt-1">
              {isTeacher
                ? (language === 'en' ? 'Teacher Portal & Quran Circles' : 'بوابة المعلم والحلقات القرآنية')
                : (language === 'en' ? `Ward Journey • Week ${user.currentWeek || 1}` : `رحلة وِرد • ${currentWeek?.title || 'الأسبوع الأول'}`)}
            </p>
          </div>
        </div>

        {/* Stats Pill Counters & Notification Bell */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            id="notifications-bell-btn"
            onClick={() => setIsNotificationsModalOpen(true)}
            className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
            title={language === 'en' ? 'Notifications' : 'الإشعارات'}
            aria-label="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 font-num shadow-xs animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Streak Counter for Students */}
          {!isTeacher && (
            <div className="flex items-center gap-1 bg-[#FFF8E7] px-3 py-1 rounded-full border border-[#F9BF3B] shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-[#F9BF3B] fill-[#F9BF3B] animate-pulse" />
              <span className="text-[#C79545] font-bold text-xs font-num">
                {user.streak} {language === 'en' ? (user.streak === 1 ? 'day' : 'days') : 'يوماً'}
              </span>
            </div>
          )}

          {/* XP Counter (Strictly for Students only - Hidden for Teachers) */}
          {!isTeacher ? (
            <div className="flex items-center gap-1 bg-[#F0F9F0] px-3 py-1 rounded-full border border-[#006304] shadow-2xs">
              <Star className="w-3.5 h-3.5 text-[#006304] fill-[#006304]" />
              <span className="text-[#006304] font-bold text-xs font-num">{user.xp} XP</span>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1 bg-[#F0F9F0] hover:bg-[#e2f3e2] px-3 py-1 rounded-full border border-[#006304] text-[#006304] text-xs font-bold transition-colors cursor-pointer"
              title={language === 'en' ? 'My Profile' : 'حسابي'}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#006304]" />
              <span>{language === 'en' ? 'Profile' : 'حسابي'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

