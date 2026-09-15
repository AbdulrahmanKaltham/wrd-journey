import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tent, ShoppingBag } from 'lucide-react';

export const CampPage: React.FC = () => {
  const { user, decorations, buyDecoration } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'view' | 'store'>('view');

  const unlockedDecs = decorations.filter(d => d.unlocked);

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#F9BF3B] shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[#C79545] text-xs font-bold mb-0.5">
            <Tent className="w-4 h-4 text-[#C79545]" />
            <span>مخيمي الشخصي 🏕️</span>
          </div>
          <h2 className="font-heading font-extrabold text-lg text-[#006304]">
            مخيم {user.displayName} المبارك
          </h2>
          <p className="text-xs text-gray-600 font-medium mt-0.5">
            مكانك الخاص للاستراحة والتأمل في رحلتك مع القرآن
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white border border-[#F9BF3B] flex items-center justify-center text-2xl shadow-2xs">
          🏕️
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center bg-white rounded-2xl p-1 border-2 border-[#E0E0E0] shadow-2xs">
        <button
          onClick={() => setActiveSubTab('view')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'view'
              ? 'bg-[#006304] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tent className="w-4 h-4" />
          <span>عرض المخيم</span>
        </button>

        <button
          onClick={() => setActiveSubTab('store')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'store'
              ? 'bg-[#006304] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>متجر الزينة ({user.xp} XP)</span>
        </button>
      </div>

      {activeSubTab === 'view' ? (
        /* Campsite Visual Scene Canvas */
        <div className="relative bg-[#FFF8E7] border-2 border-[#F9BF3B] rounded-3xl p-6 min-h-[360px] shadow-sm flex flex-col justify-between overflow-hidden">
          {/* Background atmosphere */}
          <div className="absolute top-4 left-6 text-3xl opacity-80 animate-float">🌙</div>
          <div className="absolute top-8 right-8 text-xl opacity-60">✨</div>

          {/* Placed Items Display Grid */}
          <div className="relative z-10 grid grid-cols-3 gap-4 my-auto text-center py-6">
            {unlockedDecs.map(item => (
              <div
                key={item.id}
                className="bg-white/90 backdrop-blur-xs border border-[#F9BF3B] rounded-2xl p-3 shadow-xs flex flex-col items-center justify-center animate-float"
              >
                <span className="text-4xl block mb-1">{item.icon}</span>
                <span className="text-[11px] font-bold text-[#C79545]">{item.title}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#C79545] bg-white/80 border border-[#F9BF3B] rounded-xl p-2.5 text-center font-bold relative z-10">
            🌱 كلما حافظت على وردك اليومي وكسبت نقاط XP، يمكنك فتح عناصر تجميلية لمخيمك المبارك.
          </p>
        </div>
      ) : (
        /* Decoration Store */
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-600 block">
            المحتوى القابل للفتح بنقاط XP:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {decorations.map(dec => {
              const canAfford = user.xp >= dec.costXp;

              return (
                <div
                  key={dec.id}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    dec.unlocked
                      ? 'bg-[#F0F9F0] border-[#006304]'
                      : canAfford
                      ? 'bg-white border-[#F9BF3B] shadow-2xs'
                      : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-white shadow-2xs border border-gray-100">
                      {dec.icon}
                    </span>
                    <div>
                      <h4 className="font-heading font-bold text-xs text-slate-900">
                        {dec.title}
                      </h4>
                      <span className="text-[10px] text-[#C79545] font-bold font-num block mt-0.5">
                        {dec.unlocked ? 'مفتوح في المخيم ✓' : `${dec.costXp} XP`}
                      </span>
                    </div>
                  </div>

                  <div>
                    {dec.unlocked ? (
                      <span className="w-7 h-7 rounded-full bg-[#006304] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => buyDecoration(dec.id)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-[#006304] hover:bg-[#005103] text-white shadow-xs'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        شراء
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

