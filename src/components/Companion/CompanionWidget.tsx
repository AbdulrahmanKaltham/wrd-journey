import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles } from 'lucide-react';

interface CompanionWidgetProps {
  message?: string;
  className?: string;
}

export const CompanionWidget: React.FC<CompanionWidgetProps> = ({ message, className = '' }) => {
  const { user } = useApp();

  const getCompanionDetails = () => {
    switch (user.companion) {
      case 'ward_falcon':
        return { name: 'صقر ورد', avatar: '🦅', role: 'رفيق الهمة والقوة' };
      case 'ward_dove':
        return { name: 'حمامة السلام', avatar: '🕊️', role: 'رفيق السكينة والتدبر' };
      case 'ward_seedling':
      default:
        return { name: 'شتلة ورد', avatar: '🌱', role: 'رفيق النمو والاستمرارية' };
    }
  };

  const comp = getCompanionDetails();

  const defaultMessage = user.streak > 0
    ? `أهلاً بك يا ${user.displayName}! بقيت لك خطوة واحدة اليوم لإكمال ورد الأسبوع وزيادة سلسلة الاستمرار 🔥`
    : `أهلاً بك يا ${user.displayName}! ابدأ ورد اليوم لتبني أثراً مباركاً في رحلتك مع القرآن 🌱`;

  return (
    <div className={`bg-[#FFF8E7] border border-[#F9BF3B] rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs relative overflow-hidden ${className}`}>
      {/* Companion Avatar */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-xl bg-white border border-[#F9BF3B] shadow-2xs flex items-center justify-center text-2xl animate-float">
          {comp.avatar}
        </div>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#F9BF3B] text-[9px] font-bold text-black flex items-center justify-center shadow-2xs">
          ✨
        </span>
      </div>

      {/* Content Message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-[#C79545] flex items-center gap-1">
            {comp.name}
            <span className="text-[10px] text-gray-500 font-normal">({comp.role})</span>
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#F9BF3B]" />
        </div>
        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          {message || defaultMessage}
        </p>
      </div>
    </div>
  );
};

