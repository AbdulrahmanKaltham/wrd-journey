import React from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Gift, Trophy, Zap, Award, Sparkles, Check, ArrowLeft, Star } from 'lucide-react';

export const WeekRewardModal: React.FC = () => {
  const { pendingWeekReward, claimWeekRewardAndUnlockNext, badges, user } = useApp();

  if (!pendingWeekReward) return null;

  const { week, xpEarned, unlockedBadgeIds } = pendingWeekReward;
  const isFinalWeek = week.id === 17;

  // Find badge objects from unlockedBadgeIds
  const earnedBadges = badges.filter(b => unlockedBadgeIds.includes(b.id));

  const handleClaim = () => {
    confetti({
      particleCount: isFinalWeek ? 150 : 80,
      spread: 90,
      origin: { y: 0.55 },
    });
    claimWeekRewardAndUnlockNext();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-white border-2 border-[#F9BF3B] rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden"
      >
        {/* Shimmering Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F9BF3B] via-[#006304] to-[#F9BF3B]" />

        {/* Animated Chest & Sparkles Icon */}
        <div className="relative inline-block my-1">
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              rotate: [0, -3, 3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-b from-[#FFF8E7] to-amber-100 border-2 border-[#F9BF3B] text-amber-600 flex items-center justify-center mx-auto shadow-xl"
          >
            {isFinalWeek ? (
              <Trophy className="w-10 h-10 text-[#C79545]" />
            ) : (
              <Gift className="w-10 h-10 text-amber-500" />
            )}
          </motion.div>

          <span className="absolute -top-1 -right-2 text-2xl animate-bounce">✨</span>
          <span className="absolute -bottom-1 -left-2 text-xl animate-pulse">🌟</span>
        </div>

        {/* Header Titles */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider bg-[#F9BF3B] text-slate-900 px-3 py-0.5 rounded-full inline-block shadow-2xs">
            {isFinalWeek ? 'تاج الإتقان والختام' : 'صندوق مكافأة الأسبوع'}
          </span>

          <h3 className="font-heading font-black text-xl sm:text-2xl text-[#006304]">
            {isFinalWeek ? 'مبارك ختم مقرر جزء عم! 🎉' : `مبارك إتمام ${week.title}! 🌿`}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed font-medium px-2">
            هنيئاً لك يا <span className="font-bold text-slate-900">{user.displayName}</span>! لقد أتممت متطلبات حفظ وتسميع سور ({week.surahs.join('، ')}) وتجاوزت بوابة الاختبار بنجاح وجدارة.
          </p>
        </div>

        {/* Reward Metrics Grid */}
        <div className="bg-[#F0F9F0] border-2 border-[#006304]/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>نقاط الخبرة المكتسبة:</span>
            </div>
            <span className="font-num font-black text-base text-[#006304] bg-white px-3 py-0.5 rounded-xl border border-[#006304]/20 shadow-2xs">
              +{xpEarned} XP
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1 border-t border-emerald-600/10">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#F9BF3B] fill-[#F9BF3B]" />
              <span>المرحلة القادمة:</span>
            </div>
            <span className="text-slate-900 font-bold">
              {isFinalWeek ? 'إتمام الرحلة المباركة' : `الأسبوع ${week.id + 1}`}
            </span>
          </div>
        </div>

        {/* Unlocked Badges Section (if any) */}
        {earnedBadges.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-2 text-right">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
              <Award className="w-4 h-4 text-amber-600" />
              <span>أوسمة جديدة تم فتحها:</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {earnedBadges.map(badge => (
                <div
                  key={badge.id}
                  className="bg-white border border-amber-200 rounded-xl p-2 flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="text-2xl shrink-0">{badge.icon}</span>
                  <div className="text-right flex-1">
                    <h5 className="text-xs font-heading font-black text-slate-900">
                      {badge.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim and Unlock Action Button */}
        <div className="pt-2">
          <button
            onClick={handleClaim}
            className="w-full bg-[#006304] hover:bg-[#005103] text-white font-heading font-black py-4 px-6 rounded-2xl text-sm shadow-lg shadow-[#006304]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>
              {isFinalWeek ? 'استلام المكافأة وتتويج ختم جزء عم' : 'استلام المكافأة وفتح الأسبوع التالي'}
            </span>
            <ArrowLeft className="w-4 h-4 text-[#F9BF3B]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
