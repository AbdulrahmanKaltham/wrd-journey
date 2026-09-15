import React from 'react';
import { useSupabase, TabType } from '../context/SupabaseContext';
import { Home, Users, User, BookOpen } from 'lucide-react';

interface TeacherNavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

export const TeacherBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useSupabase();

  const navItems: TeacherNavItem[] = [
    { id: 'teacher', label: 'الرئيسية', icon: Home },
    { id: 'halaqah', label: 'الحلقة', icon: BookOpen },
    { id: 'students', label: 'طلابي', icon: Users },
    { id: 'profile', label: 'حسابي', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#E0E0E0] h-18 flex items-center justify-around px-2 sm:px-4 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="max-w-md w-full mx-auto flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.id === 'teacher'
              ? activeTab === 'teacher' || activeTab === 'home'
              : activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 sm:px-5 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? 'text-[#006304] font-bold scale-105'
                  : 'text-gray-400 hover:text-[#006304] font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#F0F9F0] text-[#006304] filter drop-shadow-[0_0_5px_rgba(0,99,4,0.3)]'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] mt-0.5 leading-none ${
                  isActive ? 'text-[#006304] font-bold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#006304]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
