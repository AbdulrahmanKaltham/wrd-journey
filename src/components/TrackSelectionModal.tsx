import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { TrackId } from '../types';

interface TrackSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectTrack: (track: TrackId) => Promise<void> | void;
  currentTrack?: TrackId;
  forceChoice?: boolean;
}

export const TrackSelectionModal: React.FC<TrackSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
  currentTrack = 'juz_amma',
  forceChoice = false,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>(currentTrack);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onSelectTrack(selectedTrack);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error selecting track:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => {
        if (!forceChoice && onClose) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-[#E0E0E0] font-arabic"
        onClick={e => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-[#006304] to-[#004D03] text-white p-5 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#F9BF3B] flex items-center justify-center mx-auto mb-2 text-2xl">
            📖
          </div>
          <h2 className="font-heading font-black text-lg text-white">
            اختر مسارك الدراسي
          </h2>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            حدد خطة الحفظ التي تناسبك في رحلة وِرد القرآنية
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3">
          {/* Track 1: Juz Amma Only */}
          <div
            onClick={() => setSelectedTrack('juz_amma')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedTrack === 'juz_amma'
                ? 'border-[#006304] bg-[#F0F9F0] shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm text-slate-900">
                    📖 جزء عم فقط
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-100 text-[#006304] px-2 py-0.5 rounded-full border border-emerald-200">
                    17 أسبوعاً
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  من سورة الناس إلى سورة النبأ (المنهج الأساسي)
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedTrack === 'juz_amma'
                    ? 'border-[#006304] bg-[#006304] text-white'
                    : 'border-gray-300'
                }`}
              >
                {selectedTrack === 'juz_amma' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          {/* Track 2: Juz Amma & Juz Tabarak */}
          <div
            onClick={() => setSelectedTrack('juz_amma_tabarak')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedTrack === 'juz_amma_tabarak'
                ? 'border-[#006304] bg-[#F0F9F0] shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm text-slate-900">
                    ✨ جزء عم وجزء تبارك
                  </span>
                  <span className="text-[11px] font-bold bg-amber-100 text-[#C79545] px-2 py-0.5 rounded-full border border-amber-200">
                    16 أسبوعاً
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  حفظ وتثبيت جزأي عم وتبارك كاملاً (المنهج المكثف)
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedTrack === 'juz_amma_tabarak'
                    ? 'border-[#006304] bg-[#006304] text-white'
                    : 'border-gray-300'
                }`}
              >
                {selectedTrack === 'juz_amma_tabarak' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3 rounded-2xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'تأكيد واختيار المسار'}
          </button>
        </div>
      </div>
    </div>
  );
};
