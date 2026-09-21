import React from 'react';
import { useApp } from '../../context/AppContext';
import { Week } from '../../types';
import { t, getSurahName } from '../../lib/i18n';
import { X, CheckCircle2, Lock, Play, Calendar, BookOpen, Headphones, Mic, RotateCcw, Target, Trophy, Star } from 'lucide-react';

interface WeekDetailModalProps {
  week: Week;
  onClose: () => void;
}

export const WeekDetailModal: React.FC<WeekDetailModalProps> = ({ week, onClose }) => {
  const { user, startLesson, userCircle, setActiveTab, language } = useApp();
  const [showReciteCircleAlert, setShowReciteCircleAlert] = React.useState(false);
  const isEn = language === 'en';

  const handleStartTask = (node: any) => {
    if (node.type === 'recite' && user.role === 'student' && (!user.circleId || !user.teacherId) && !userCircle) {
      setShowReciteCircleAlert(true);
      return;
    }
    onClose();
    startLesson(node, week);
  };

  // Calculate week completion percentage
  const totalNodes = week.nodes.length;
  const completedCount = week.nodes.filter(n => user.completedNodes.includes(n.id)).length;
  const progressPercent = Math.round((completedCount / totalNodes) * 100);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'listen': return <Headphones className="w-5 h-5" />;
      case 'memorize': return <BookOpen className="w-5 h-5" />;
      case 'recite': return <Mic className="w-5 h-5" />;
      case 'review': return <RotateCcw className="w-5 h-5" />;
      case 'quiz': return <Target className="w-5 h-5" />;
      case 'gate': return <Trophy className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-[#E0E0E0] flex flex-col max-h-[88vh]">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-[#006304] to-[#004D03] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-[#F9BF3B] text-black px-3 py-0.5 rounded-full shadow-2xs">
              {isEn ? `Week ${week.id} Gate` : `بوابة ${week.title}`}
            </span>
            <span className="text-xs text-emerald-200 flex items-center gap-1 font-num font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {week.startDate} — {week.endDate}
            </span>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-white mt-1">
            {isEn ? t(week.title, 'en') : week.title}
          </h3>

          <div className="flex items-start gap-2 mt-2 text-xs text-emerald-100 font-medium">
            <BookOpen className="w-4 h-4 text-[#F9BF3B] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {isEn
                ? `Prescribed Surahs: ${week.surahs.map(s => getSurahName(s, 'en')).join(', ')}`
                : `السور المقررة: ${week.surahs.join('، ')}`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[#F9BF3B] mb-1 font-bold">
              <span>{isEn ? 'Weekly Progress' : 'نسبة الإنجاز بالأسبوع'}</span>
              <span className="font-num">{progressPercent}%</span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#F9BF3B] h-full transition-all duration-500 rounded-full shadow-[0_0_8px_#F9BF3B]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nodes List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <span className="text-xs font-bold text-gray-500 block mb-2">
            {isEn
              ? `Weekly Milestones & Tasks (${week.nodes.length} steps):`
              : `محطات ومهام الأسبوع (${week.nodes.length} خطوات):`}
          </span>

          {week.nodes.map((node, index) => {
            const isCompleted = user.completedNodes.includes(node.id);
            const isWeekUnlocked = user.role === 'teacher' || week.id === 1 || user.completedWeeks.includes(week.id - 1) || user.currentWeek >= week.id;
            const isPreviousCompleted = index === 0 || user.completedNodes.includes(week.nodes[index - 1].id);
            const isAvailable = user.role === 'teacher' || (isWeekUnlocked && (isPreviousCompleted || isCompleted));

            return (
              <div
                key={node.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  isCompleted
                    ? 'bg-[#F0F9F0] border-[#006304]'
                    : isAvailable
                    ? 'bg-white border-[#F9BF3B] shadow-2xs'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-2xs shrink-0 ${
                    isCompleted
                      ? 'bg-[#006304] text-white'
                      : isAvailable
                      ? 'bg-[#F9BF3B] text-black border border-[#C79545]'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : getNodeIcon(node.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-xs text-slate-900">
                        {isEn ? t(node.title, 'en') : node.title}
                      </span>
                      {node.type === 'gate' && (
                        <span className="text-[9px] bg-[#FFF8E7] text-[#C79545] font-bold px-1.5 py-0.2 rounded-md border border-[#F9BF3B]">
                          {isEn ? 'Gate Exam' : 'اختبار عبور'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                      {isEn ? t(node.description, 'en') : node.description}
                    </p>
                  </div>
                </div>

                {/* Right Action */}
                <div className="shrink-0 mr-2">
                  {isCompleted ? (
                    <button
                      onClick={() => handleStartTask(node)}
                      className="bg-[#F0F9F0] text-[#006304] border border-[#006304] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isEn ? 'Earned' : 'مكسب'}</span>
                      <span className="font-num text-[10px]">+{node.xpReward}XP</span>
                    </button>
                  ) : isAvailable ? (
                    <button
                      onClick={() => handleStartTask(node)}
                      className="bg-[#006304] hover:bg-[#005103] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-2xs flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isEn ? 'Start' : 'ابدأ'}</span>
                    </button>
                  ) : (
                    <div className="p-1.5 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning alert if attempting recite without circle */}
        {showReciteCircleAlert && (
          <div className="p-4 bg-amber-50 border-t-2 border-amber-200 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <span>⚠️</span>
              <span>يلزم الانضمام إلى حلقة قرآنية</span>
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
              يرجى الانضمام إلى حلقة أولاً لتتمكن من استخدام خاصية التسميع إلى معلم.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowReciteCircleAlert(false);
                  onClose();
                  setActiveTab('profile');
                }}
                className="flex-1 bg-[#006304] hover:bg-[#005103] text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                اختيار حلقة من الحساب
              </button>
              <button
                onClick={() => setShowReciteCircleAlert(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

