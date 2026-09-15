import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowLeft, Check, HeartHandshake } from 'lucide-react';

interface WelcomeModalProps {
  onComplete: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const { user, updateUserProfile, triggerCelebration } = useApp();
  const [name, setName] = useState(user.displayName || 'عبدالله');
  const [companion, setCompanion] = useState<'ward_seedling' | 'ward_falcon' | 'ward_dove'>(user.companion || 'ward_seedling');
  const [avatar, setAvatar] = useState<any>(user.avatar || 'student');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      displayName: name.trim(),
      companion,
      avatar,
    });

    triggerCelebration();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#006304]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-amber-200/50 p-6 space-y-5 animate-float">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#F9BF3B] text-slate-900 border-2 border-amber-200 flex items-center justify-center text-3xl mx-auto shadow-md">
            🌱
          </div>
          <h2 className="font-heading font-black text-2xl text-slate-900">
            أهلاً بك في رحلة وِرد
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            رحلتك التفاعلية اليومية لحفظ وتثبيت القرآن الكريم مع رحلة وِرد
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ما هو اسمك المبارك؟
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="أدخل اسمك هنا..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#006304] focus:outline-none text-sm font-bold text-slate-900 bg-slate-50/50"
              required
            />
          </div>

          {/* Companion Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              اختر رفيقك الرحلة (تشجيع وتذكير):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ward_seedling', name: 'شتلة ورد', avatar: '🌱', desc: 'النمو والثبات' },
                { id: 'ward_falcon', name: 'صقر ورد', avatar: '🦅', desc: 'العزيمة والهمة' },
                { id: 'ward_dove', name: 'حمامة السلام', avatar: '🕊️', desc: 'السكينة والتدبر' },
              ].map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCompanion(c.id as any)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    companion === c.id
                      ? 'bg-[#006304]/10 border-[#006304] text-[#006304] font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{c.avatar}</span>
                  <span className="text-xs font-bold block">{c.name}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#006304]/30 flex items-center justify-center gap-2 text-sm transition-all"
          >
            <span>انطلق في رحلة جزء عم</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
