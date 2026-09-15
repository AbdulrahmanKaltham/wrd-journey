import React from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { Home, Map, Tent, Trophy, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useSupabase();

  const navItems = [
    { id: 'home' as const, label: 'الرئيسية', icon: Home },
    { id: 'journey' as const, label: 'الرحلة', icon: Map },
    { id: 'camp' as const, label: 'المخيم', icon: Tent },
    { id: 'achievements' as const, label: 'الإنجازات', icon: Trophy },
    { id: 'profile' as const, label: 'حسابي', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#E0E0E0] h-18 flex items-center justify-around px-4 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="max-w-md w-full mx-auto flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? 'text-[#006304] font-bold scale-105'
                  : 'text-gray-400 hover:text-[#006304] font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-[#F0F9F0] text-[#006304] filter drop-shadow-[0_0_5px_rgba(0,99,4,0.3)]' : 'bg-transparent'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[11px] mt-0.5 leading-none ${isActive ? 'text-[#006304] font-bold' : 'text-gray-400'}`}>
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

