import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { t } from '../../lib/i18n';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import { NodeItem, Week } from '../../types';
import {
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  Play,
  Pause,
  Repeat,
  Sparkles,
  Headphones,
  BookOpen,
  Zap,
  ChevronDown,
  Rewind,
  FastForward,
  Check,
} from 'lucide-react';

interface ListeningTaskProps {
  node: NodeItem;
  week: Week;
  onClose: () => void;
}

export const ListeningTask: React.FC<ListeningTaskProps> = ({ node, week, onClose }) => {
  const { user, completeNode, language } = useApp();

  // All surahs in this week
  const surahs = node.surahsList && node.surahsList.length > 0 ? node.surahsList : week.surahs;

  // Selected surah from the dropdown
  const [selectedSurah, setSelectedSurah] = useState<string>(surahs[0] || '');

  // Track listened surahs (if the task is already completed previously, consider all completed)
  const isAlreadyCompleted = user.completedNodes.includes(node.id);
  const [listenedSurahs, setListenedSurahs] = useState<string[]>(() => {
    return isAlreadyCompleted ? [...surahs] : [];
  });

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // 1. Repeat state (1 or 2 times)
  const [repeatCount, setRepeatCount] = useState<1 | 2>(1);

  // 3. Volume state & Popover
  const [volume, setVolume] = useState<number>(80);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const volumePopoverRef = useRef<HTMLDivElement>(null);

  // Completion view state
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumePopoverRef.current && !volumePopoverRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };
    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  // Simulated audio playback
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            // Mark current surah as listened
            if (selectedSurah) {
              setListenedSurahs(current =>
                current.includes(selectedSurah) ? current : [...current, selectedSurah]
              );
            }
            return 100;
          }
          return prev + 5;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, selectedSurah]);

  // Handle Surah change from dropdown
  const handleSurahChange = (surahName: string) => {
    setSelectedSurah(surahName);
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const TOTAL_DURATION_SEC = 60;
  const currentSeconds = Math.min(TOTAL_DURATION_SEC, Math.round((audioProgress / 100) * TOTAL_DURATION_SEC));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle Repeat Count (1 -> 2 -> 1)
  const handleToggleRepeat = () => {
    // TODO: ربط التكرار مع ملف الصوت لاحقاً
    setRepeatCount(prev => (prev === 1 ? 2 : 1));
  };

  // Rewind 10 seconds (-10s)
  const handleRewind10 = () => {
    const stepPercent = (10 / TOTAL_DURATION_SEC) * 100;
    setAudioProgress(prev => Math.max(0, Math.round(prev - stepPercent)));
  };

  // Fast forward 10 seconds (+10s)
  const handleFastForward10 = () => {
    const stepPercent = (10 / TOTAL_DURATION_SEC) * 100;
    setAudioProgress(prev => {
      const next = Math.min(100, Math.round(prev + stepPercent));
      if (next >= 100) {
        setIsPlayingAudio(false);
        if (selectedSurah) {
          setListenedSurahs(curr => (curr.includes(selectedSurah) ? curr : [...curr, selectedSurah]));
        }
      }
      return next;
    });
  };

  const toggleAudio = () => {
    if (audioProgress >= 100) {
      setAudioProgress(0);
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  // Handle Volume Change
  const handleVolumeChange = (newVolume: number) => {
    // TODO: ربط slider.value مع HTMLAudioElement.volume لاحقاً
    setVolume(newVolume);
  };

  const handleFinishLesson = async () => {
    await completeNode(node.id, week.id, node.xpReward);
    onClose();
  };

  const totalCount = surahs.length;
  const completedCount = listenedSurahs.length;
  const allListened = totalCount > 0 && completedCount >= totalCount;
  const isCurrentSurahListened = listenedSurahs.includes(selectedSurah);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="bg-[#006304] text-white p-4 relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 shadow-xs border border-white/20 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-[#F9BF3B] text-slate-900 px-2 py-0.5 rounded-full">
                  {language === 'en' ? 'Listening & Recitation' : 'استماع وترتيل'}
                </span>
                <span className="text-[10px] text-green-200 font-bold">
                  {language === 'en' ? t(week.title, 'en') : week.title}
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-base text-white mt-0.5">
                {language === 'en' ? t(node.title, 'en') : node.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {completedSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="relative inline-block">
                <AvatarDisplay
                  avatarStyle={user.avatarStyle || 'hafiz'}
                  outfitColor={user.outfitColor || 'green'}
                  bagStyle={user.bagStyle || 'satchel'}
                />
              </div>

              <div>
                <h4 className="font-heading font-black text-xl text-slate-900">
                  مبارك يا {user.displayName}!
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  أتممت مهمتك بنجاح وتخطو شخصيتك خطوة مباركة للأمام في الخريطة!
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-[#F0F9F0] border border-[#006304] px-3 py-1 rounded-full text-xs font-bold text-[#006304]">
                  <Zap className="w-4 h-4 fill-[#006304]" />
                  <span>مكافأة الإنجاز:</span>
                  <span className="font-num font-extrabold text-[#006304]">+{node.xpReward} XP</span>
                </div>
              </div>

              <button
                onClick={handleFinishLesson}
                className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#006304]/30 flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer"
              >
                <span>انتقل إلى المحطة التالية</span>
                <Sparkles className="w-4 h-4 text-[#F9BF3B]" />
              </button>
            </div>
          ) : (
            <>
              {/* Description */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
                {node.description}
              </div>

              {/* Surah Dropdown Selector above the player */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 px-1">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#006304]" />
                    <span>اختر السورة للاستماع:</span>
                  </div>
                  <span className="text-[11px] font-num bg-white px-2 py-0.5 rounded-lg border border-amber-200 text-[#006304]">
                    تم الاستماع: {completedCount} / {totalCount}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedSurah}
                    onChange={(e) => handleSurahChange(e.target.value)}
                    className="w-full appearance-none bg-white border-2 border-emerald-600/30 hover:border-emerald-600 text-slate-900 font-bold text-xs sm:text-sm rounded-xl py-2.5 px-3 pr-9 pl-4 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                  >
                    {surahs.map((s, idx) => {
                      const isListened = listenedSurahs.includes(s);
                      return (
                        <option key={s} value={s}>
                          {idx + 1}. سورة {s} {isListened ? '✓ (تم الاستماع)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-800">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Classic Audio Player */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-950 to-green-900 text-white rounded-2xl p-5 text-center shadow-md border border-emerald-800">
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-5 h-5 text-[#F9BF3B]" />
                  </div>

                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h4 className="font-heading font-bold text-lg text-amber-300">
                      سورة {selectedSurah}
                    </h4>
                    {isCurrentSurahListened && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <Check className="w-3 h-3 text-[#F9BF3B]" />
                        <span>مكتملة</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-emerald-200 mt-1">
                    القارئ: فضيلة الشيخ (تلاوة تعليمية مرتلة)
                  </p>

                  {/* Waveform Visualizer */}
                  <div className="flex items-center justify-center gap-1 my-6 h-10">
                    {[40, 75, 100, 60, 30, 90, 70, 45, 80, 100, 50, 85, 60].map((h, i) => (
                      <span
                        key={i}
                        style={{
                          height: isPlayingAudio ? `${Math.max(15, Math.round(h * Math.random()))}%` : '20%',
                        }}
                        className="w-1.5 bg-[#F9BF3B] rounded-full transition-all duration-200"
                      />
                    ))}
                  </div>

                  {/* Progress Bar & Time Display (Strict LTR direction) */}
                  <div className="space-y-1 mb-5" dir="ltr">
                    <div className="flex justify-between items-center text-[11px] text-emerald-200 font-num px-1 font-bold">
                      <span>{formatTime(currentSeconds)}</span>
                      <span>{formatTime(TOTAL_DURATION_SEC)}</span>
                    </div>
                    {/* Progress container starting from left to right */}
                    <div className="w-full bg-emerald-950/80 h-2.5 rounded-full overflow-hidden border border-emerald-700/50 flex flex-row justify-start">
                      <div
                        className="bg-[#F9BF3B] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Controls Container: Ordered strictly LTR: [Repeat] [Rewind -10s] [Play/Pause] [FastForward +10s] [Volume] */}
                  <div className="flex items-center justify-center gap-3 relative" dir="ltr">
                    {/* 1. Repeat Button with Counter Badge */}
                    <button
                      onClick={handleToggleRepeat}
                      className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-800 transition-all shadow-xs active:scale-95 flex items-center justify-center relative group cursor-pointer"
                      title={`تكرار التلاوة (${repeatCount} مرات)`}
                    >
                      <Repeat className="w-5 h-5 text-slate-700 group-hover:text-emerald-800" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#006304] text-white text-[10px] font-bold flex items-center justify-center font-num shadow-xs border border-white">
                        {repeatCount}
                      </span>
                    </button>

                    {/* 2. Rewind 10s (-10s) */}
                    <button
                      onClick={handleRewind10}
                      className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-800 transition-all shadow-xs active:scale-95 flex items-center justify-center relative group cursor-pointer"
                      title="تأخير 10 ثوانٍ (-10s)"
                    >
                      <Rewind className="w-5 h-5 text-slate-700 group-hover:text-emerald-800" />
                      <span className="absolute -bottom-1 text-[8px] font-num font-black leading-none bg-slate-200/90 text-slate-800 px-1 py-0.5 rounded-full border border-slate-300">
                        10-
                      </span>
                    </button>

                    {/* 3. Play / Pause Button (Larger w-16 h-16) */}
                    <button
                      onClick={toggleAudio}
                      className="w-16 h-16 rounded-full bg-[#F9BF3B] text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-xl font-bold flex items-center justify-center cursor-pointer"
                      title={isPlayingAudio ? 'إيقاف مؤقت' : 'تشغيل'}
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-8 h-8 fill-current" />
                      ) : (
                        <Play className="w-8 h-8 ml-1 fill-current" />
                      )}
                    </button>

                    {/* 4. Fast Forward 10s (+10s) */}
                    <button
                      onClick={handleFastForward10}
                      className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-800 transition-all shadow-xs active:scale-95 flex items-center justify-center relative group cursor-pointer"
                      title="تقديم 10 ثوانٍ (+10s)"
                    >
                      <FastForward className="w-5 h-5 text-slate-700 group-hover:text-emerald-800" />
                      <span className="absolute -bottom-1 text-[8px] font-num font-black leading-none bg-slate-200/90 text-slate-800 px-1 py-0.5 rounded-full border border-slate-300">
                        10+
                      </span>
                    </button>

                    {/* 5. Volume Button & Popover Slider */}
                    <div className="relative" ref={volumePopoverRef}>
                      <button
                        onClick={() => setShowVolumeSlider(prev => !prev)}
                        className={`w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 transition-all shadow-xs active:scale-95 flex items-center justify-center cursor-pointer ${
                          showVolumeSlider ? 'ring-2 ring-[#F9BF3B] text-emerald-900' : 'text-slate-700'
                        }`}
                        title="التحكم في مستوى الصوت"
                      >
                        {volume === 0 ? (
                          <VolumeX className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-slate-700 hover:text-emerald-800" />
                        )}
                      </button>

                      {/* Volume Slider Popover */}
                      {showVolumeSlider && (
                        <div className="absolute bottom-14 right-1/2 translate-x-1/2 bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 flex flex-col items-center gap-2 z-30 w-32 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between w-full text-[11px] font-num font-bold text-amber-300">
                            <span>الصوت</span>
                            <span>{volume}%</span>
                          </div>
                          {/* Slider input */}
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#F9BF3B]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Completion Button - only active once all surahs are listened to */}
                <button
                  onClick={() => {
                    if (allListened) {
                      setCompletedSuccess(true);
                    }
                  }}
                  disabled={!allListened}
                  className={`w-full py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                    allListened
                      ? 'bg-[#006304] text-white hover:bg-[#005103] cursor-pointer shadow-[#006304]/30'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${allListened ? 'text-[#F9BF3B]' : 'text-slate-400'}`} />
                  <span>
                    {allListened
                      ? 'أتممت الاستماع لجميع السور'
                      : `استمع لجميع السور لإكمال المهمة (${completedCount}/${totalCount})`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
