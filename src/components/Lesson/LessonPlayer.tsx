import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { t } from '../../lib/i18n';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import { QuizEngine } from '../Quiz/QuizEngine';
import { NodeItem, Week, NodeSubmission } from '../../types';
import { saveAudioRecording, getAudioRecordingUrl } from '../../services/storageService';
import {
  X,
  Volume2,
  Mic,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Sparkles,
  Headphones,
  BookOpen,
  Target,
  Star,
  Zap,
  Users,
  Clock,
  Square,
  UploadCloud,
  AlertCircle,
  ChevronDown,
  GraduationCap,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface LessonPlayerProps {
  node: NodeItem;
  week: Week;
  onClose: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ node, week, onClose }) => {
  const { user, completeNode, submitNodeForReview, switchRecitationType, openWeekRewardModal, userCircle, setActiveTab, language } = useApp();
  
  // Audio state
  const surahsList = node.surahsList && node.surahsList.length > 0 ? node.surahsList : week.surahs;
  const [selectedSurah, setSelectedSurah] = useState<string>(surahsList[0] || '');
  const [listenedSurahs, setListenedSurahs] = useState<string[]>(() => {
    return user.completedNodes.includes(node.id) ? [...surahsList] : [];
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Recitation Option State: 'choose' | 'halaqah' | 'recording'
  const [latestSubmission, setLatestSubmission] = useState<NodeSubmission | null>(
    user.submissions?.[node.id] || null
  );
  const [isReReciting, setIsReReciting] = useState(false);

  const existingSubmission = latestSubmission || user.submissions?.[node.id];

  // Refresh submission status and teacher notes on mount or when node/user changes
  useEffect(() => {
    setIsReReciting(false);
    if (user.submissions?.[node.id]) {
      setLatestSubmission(user.submissions[node.id]);
    }
    const currentUserId = user.id;
    if (node.type === 'recite' && currentUserId) {
      import('../../services/supabaseService').then(({ getStudentSubmissionForNode }) => {
        getStudentSubmissionForNode(currentUserId, node.id).then(fresh => {
          if (fresh) {
            setLatestSubmission(fresh);
            if (fresh.status === 'approved' || fresh.status === 'reviewed') {
              setSubmissionSuccess(true);
            }
          }
        });
      }).catch(err => console.warn('Note loading fresh submission:', err));
    }
  }, [node.id, user.id, user.submissions]);

  const [reciteOption, setReciteOption] = useState<'choose' | 'halaqah' | 'recording'>(() => {
    if (existingSubmission) return existingSubmission.type;
    return 'choose';
  });

  // MediaRecorder Real State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(!!existingSubmission);
  const [submissionType, setSubmissionType] = useState<'halaqah' | 'recording' | null>(existingSubmission?.type || null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingMimeTypeRef = useRef<string>('audio/webm;codecs=opus');
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // General Completion state for other non-recitation nodes
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // دالة تحويل الصوت إلى صيغة جاهزة للإرسال وقابلة للفتح عند المعلم
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Load existing audio recording if available in IndexedDB
  useEffect(() => {
    if (existingSubmission?.audioBlobKey) {
      getAudioRecordingUrl(existingSubmission.audioBlobKey).then(url => {
        if (url) setRecordedAudioUrl(url);
      });
    } else if (existingSubmission?.audioUrl) {
      setRecordedAudioUrl(existingSubmission.audioUrl);
    }
  }, [existingSubmission]);

  // Audio simulated playback for listen nodes
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            if (selectedSurah) {
              setListenedSurahs(curr => (curr.includes(selectedSurah) ? curr : [...curr, selectedSurah]));
            }
            return 100;
          }
          return prev + 5;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, selectedSurah]);

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleAudio = () => {
    if (audioProgress >= 100) setAudioProgress(0);
    setIsPlayingAudio(!isPlayingAudio);
  };

  // --- Real MediaRecorder Audio Recording Functions ---
  const startRecordingHandler = async () => {
    setMicPermissionError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // اكتشاف الجهاز ونظام التشغيل واختيار صيغة الصوت المناسبة
      const isIOS = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      );

      let mimeType = 'audio/webm;codecs=opus'; // الافتراضي للحواسيب وChrome

      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (isIOS) {
          // iOS Safari يدعم audio/mp4 فقط بشكل رئيسي
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
            mimeType = 'audio/mpeg';
          }
        } else if (!MediaRecorder.isTypeSupported(mimeType)) {
          // Android قديم أو متصفحات أخرى
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
        }
      }

      recordingMimeTypeRef.current = mimeType;

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (recErr) {
        console.warn('MediaRecorder with specified mimeType failed, falling back:', recErr);
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      if (mediaRecorder.mimeType) {
        recordingMimeTypeRef.current = mediaRecorder.mimeType;
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = recordingMimeTypeRef.current || mediaRecorder.mimeType || mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        setRecordedBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedBlob(null);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setMicPermissionError('يرجى السماح بصلاحية استخدام الميكروفون من إعدادات المتصفح للتمكن من التسجيل.');
    }
  };

  const stopRecordingHandler = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayRecordedAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingRecorded) {
      audioPlayerRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioPlayerRef.current.play()
        .then(() => {
          setIsPlayingRecorded(true);
        })
        .catch((err) => {
          console.warn('Audio play failed:', err);
          setIsPlayingRecorded(false);
        });
    }
  };

  // Submit Halaqah Recitation Choice
  const handleConfirmHalaqah = async () => {
    setIsSubmitting(true);
    try {
      await submitNodeForReview(
        node.id,
        week.id,
        'halaqah',
        '',
        '',
        '',
        node.title,
        selectedSurah,
        surahsList
      );
      setSubmissionType('halaqah');
      setSubmissionSuccess(true);
      setIsReReciting(false);
      setLatestSubmission({
        nodeId: node.id,
        weekId: week.id,
        nodeTitle: node.title || 'تسميع السور المقررة',
        surahName: selectedSurah || '',
        surahsList: surahsList || [],
        type: 'halaqah',
        submittedAt: new Date().toISOString(),
        status: 'pending_teacher_review',
      });
    } catch (err) {
      console.error('Failed to submit halaqah recitation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Gate Exam Request in Halaqah (Only in-halaqah oral exam)
  const handleRequestGateExamInHalaqah = async () => {
    setIsSubmitting(true);
    try {
      await submitNodeForReview(
        node.id,
        week.id,
        'halaqah',
        '',
        '',
        '',
        'اختبار بوابة الأسبوع',
        week.surahs.join(' - '),
        week.surahs
      );
      setSubmissionType('halaqah');
      setSubmissionSuccess(true);
      setLatestSubmission({
        nodeId: node.id,
        weekId: week.id,
        nodeTitle: 'اختبار بوابة الأسبوع',
        surahName: week.surahs.join(' - '),
        surahsList: week.surahs,
        type: 'halaqah',
        submittedAt: new Date().toISOString(),
        status: 'pending_teacher_review',
      });
    } catch (err) {
      console.error('Failed to submit gate halaqah exam request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Self Recording Choice
  const handleSubmitRecording = async () => {
    if (!recordedBlob) return;
    setIsSubmitting(true);
    try {
      // 1. حفظ التسجيل محلياً
      const blobKey = await saveAudioRecording(node.id, recordedBlob);

      // 2. تحويل الصوت لنص Base64 كي يصل للمعلم في قاعدة البيانات
      const base64Audio = await blobToBase64(recordedBlob);

      // 3. إرسال الصوت الحقيقي والتفاصيل كاملة
      await submitNodeForReview(
        node.id,
        week.id,
        'recording',
        base64Audio,
        blobKey,
        base64Audio,
        node.title,
        selectedSurah,
        surahsList
      );
      setSubmissionType('recording');
      setSubmissionSuccess(true);
      setIsReReciting(false);
      setLatestSubmission({
        nodeId: node.id,
        weekId: week.id,
        nodeTitle: node.title || 'تسميع السور المقررة',
        surahName: selectedSurah || '',
        surahsList: surahsList || [],
        type: 'recording',
        audioUrl: base64Audio,
        audioBlobKey: blobKey,
        audioData: base64Audio,
        submittedAt: new Date().toISOString(),
        status: 'pending_teacher_review',
      });
    } catch (err) {
      console.error('Failed to submit recording:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch recitation method (between self-recording and in-halaqah)
  const handleSwitchMethod = async (targetTypeParam?: 'halaqah' | 'recording') => {
    setIsSubmitting(true);
    try {
      const isCurrentHalaqah = submissionType === 'halaqah' || existingSubmission?.type === 'halaqah';
      const targetType: 'halaqah' | 'recording' = targetTypeParam || (isCurrentHalaqah ? 'recording' : 'halaqah');

      if (targetType === 'recording') {
        setSubmissionType('recording');
        setSubmissionSuccess(false);
        setReciteOption('recording');
        setIsReReciting(true);
        setRecordedBlob(null);
        setRecordedAudioUrl(null);
        setLatestSubmission(prev => prev ? { ...prev, type: 'recording', audioUrl: undefined, status: 'pending_teacher_review' } : null);
      } else {
        setSubmissionType('halaqah');
        setSubmissionSuccess(true);
        setReciteOption('halaqah');
        setIsReReciting(false);
        setLatestSubmission(prev => prev ? { ...prev, type: 'halaqah', audioUrl: undefined, status: 'pending_teacher_review' } : {
          nodeId: node.id,
          weekId: week.id,
          nodeTitle: node.title || 'تسميع السور المقررة',
          surahName: selectedSurah || '',
          surahsList: surahsList || [],
          type: 'halaqah',
          submittedAt: new Date().toISOString(),
          status: 'pending_teacher_review',
        });
      }

      await switchRecitationType(node.id, targetType);
    } catch (err) {
      console.error('Failed to switch recitation method:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishLesson = () => {
    completeNode(node.id, week.id, node.xpReward);
  };

  // Node Type icons and colors
  const getTypeInfo = () => {
    const isEn = language === 'en';
    switch (node.type) {
      case 'listen':
        return { label: isEn ? 'Listening & Recitation' : 'استماع وترتيل', icon: <Headphones className="w-5 h-5 text-white" />, color: 'bg-blue-500' };
      case 'memorize':
        return { label: isEn ? 'Repetition & Memorization' : 'تكرار وحفظ', icon: <BookOpen className="w-5 h-5 text-white" />, color: 'bg-emerald-600' };
      case 'recite':
        return { label: isEn ? 'Recitation & Verification' : 'تسميع واعتماد', icon: <Mic className="w-5 h-5 text-white" />, color: 'bg-purple-600' };
      case 'review':
        return { label: isEn ? 'Review & Mastery' : 'مراجعة وتثبيت', icon: <RotateCcw className="w-5 h-5 text-white" />, color: 'bg-amber-500' };
      case 'quiz':
        return { label: isEn ? 'Short Quiz' : 'اختبار قصير', icon: <Target className="w-5 h-5 text-white" />, color: 'bg-indigo-600' };
      case 'gate':
        return { label: isEn ? 'Gate Exam & Passage' : 'بوابة الاختبار والعبور', icon: <Trophy className="w-5 h-5 text-[#F9BF3B]" />, color: 'bg-[#C79545]' };
      default:
        return { label: isEn ? 'Lesson' : 'درس', icon: <Star className="w-5 h-5 text-white" />, color: 'bg-green-600' };
    }
  };

  const typeInfo = getTypeInfo();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="bg-[#006304] text-white p-4 relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 shadow-xs border border-white/20 flex items-center justify-center">
              {typeInfo.icon}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-[#F9BF3B] text-slate-900 px-2 py-0.5 rounded-full">
                  {typeInfo.label}
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
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* General Success / Completion Banner for other lessons */}
          {completedSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="relative inline-block">
                <AvatarDisplay
                  avatarStyle={user.avatarStyle || 'hafiz'}
                  outfitColor={user.outfitColor || 'green'}
                  bagStyle={user.bagStyle || 'satchel'}
                  accessoryStyle={user.accessoryStyle || 'quran'}
                  size="xl"
                  animated={true}
                  className="shadow-xl ring-4 ring-[#F9BF3B]/40"
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
                className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#006304]/30 flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
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

              {/* MODE 1: LISTENING (استماع) */}
              {node.type === 'listen' && (() => {
                const totalCount = surahsList.length;
                const completedCount = listenedSurahs.length;
                const allListened = totalCount > 0 && completedCount >= totalCount;
                const isCurrentSurahListened = listenedSurahs.includes(selectedSurah);

                return (
                  <div className="space-y-4">
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
                          onChange={(e) => {
                            setSelectedSurah(e.target.value);
                            setIsPlayingAudio(false);
                            setAudioProgress(0);
                          }}
                          className="w-full appearance-none bg-white border-2 border-emerald-600/30 hover:border-emerald-600 text-slate-900 font-bold text-xs sm:text-sm rounded-xl py-2.5 px-3 pr-9 pl-4 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                        >
                          {surahsList.map((s, idx) => {
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
                            <CheckCircle2 className="w-3 h-3 text-[#F9BF3B]" />
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

                      {/* Progress Bar */}
                      <div className="w-full bg-emerald-950/80 h-2 rounded-full overflow-hidden mb-4 border border-emerald-700/50">
                        <div
                          className="bg-[#F9BF3B] h-full transition-all duration-300"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setAudioProgress(0)}
                          className="p-2.5 rounded-full bg-emerald-800/60 hover:bg-emerald-800 text-emerald-200 transition-colors"
                          title="إعادة الاستماع"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={toggleAudio}
                          className="p-4 rounded-full bg-[#F9BF3B] text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-lg font-bold"
                        >
                          {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 mr-0.5" />}
                        </button>

                        <div className="p-2.5 rounded-full bg-emerald-800/60 text-emerald-200">
                          <Volume2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

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
                );
              })()}

              {/* MODE 2: MEMORIZATION (حفظ) */}
              {node.type === 'memorize' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>خطوات الحفظ الموصى بها</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-[#006304]" /> ورد</span>
                    </div>

                    <ul className="text-xs text-slate-700 space-y-2 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#006304] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>اقرأ السورة 5 مرات متتالية من المصحف بتركيز ودقة.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#006304] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>اقرأ كل آية مرتين عن ظهر قلب قبل الانتقال للآية التالية.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#006304] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>ربط أول السورة بآخرها للحصول على حفظ متقن وراسخ.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card Displaying Surah Names */}
                  <div className="bg-white border-2 border-dashed border-[#006304]/30 rounded-2xl p-4 text-center">
                    <span className="text-xs text-[#006304] font-bold block mb-1">المقرر الحالي للحفظ:</span>
                    <h4 className="font-heading font-black text-lg text-slate-900">
                      سورة {week.surahs.join(' - سورة ')}
                    </h4>
                  </div>

                  <button
                    onClick={() => setCompletedSuccess(true)}
                    className="w-full bg-[#006304] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#005103] transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#F9BF3B]" />
                    <span>أتممت تكرار وحفظ المقرر</span>
                  </button>
                </div>
              )}

              {/* MODE 3: RECITATION SYSTEM (نظام التسميع: حلقة أو تسجيل صوتي) */}
              {node.type === 'recite' && (() => {
                const isNodeCompleted = user.completedNodes.includes(node.id) || existingSubmission?.status === 'approved';
                const isApproved = existingSubmission?.status === 'approved' || (isNodeCompleted && !!existingSubmission);
                const isNeedsPractice = existingSubmission?.status === 'reviewed' || existingSubmission?.status === 'needs_practice';
                const isPending = !isReReciting && (submissionSuccess || existingSubmission?.status === 'pending' || existingSubmission?.status === 'pending_teacher_review') && !isApproved && !isNeedsPractice;
                const audioSrc = recordedAudioUrl || existingSubmission?.audioUrl || existingSubmission?.audioData;
                const teacherDisplayName = userCircle?.teacherName || user.teacherName || 'فضيلة المعلم';

                // Extract teacher notes & ratings safely
                const notesText =
                  existingSubmission?.teacherNotes ||
                  (existingSubmission as any)?.teacher_notes ||
                  (existingSubmission as any)?.notes ||
                  '';
                const ratingText = existingSubmission?.rating || (isApproved ? 'ممتاز 🌟' : 'يحتاج تدريب 🔄');

                // Case 1: Approved / Completed Recitation
                if (isApproved) {
                  return (
                    <div className="bg-gradient-to-br from-emerald-50 via-[#F0F9F0] to-emerald-100/70 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-4 shadow-md animate-in fade-in zoom-in-95">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-[#006304] text-[#006304] flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>

                      <div>
                        <span className="bg-emerald-200 text-emerald-900 text-xs font-black px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                          <span>تم اعتماد التسميع وتوثيق الإنجاز ✨</span>
                        </span>
                        <h4 className="font-heading font-black text-lg sm:text-xl text-slate-900 mt-2.5">
                          مبارك! تم اعتماد تسميعك بنجاح
                        </h4>
                        <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                          أتممت تسميع سور هذا الأسبوع بنجاح وحصلت على اعتماد فضيلة المعلم ونقاط الإنجاز.
                        </p>
                      </div>

                      {/* Teacher Evaluation & Notes Card */}
                      <div className="bg-white rounded-2xl p-4 border-2 border-emerald-200 shadow-xs text-right space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                            <GraduationCap className="w-4 h-4 text-[#006304]" />
                            <span>تقييم {teacherDisplayName}:</span>
                          </div>
                          <span className="text-xs font-black text-[#006304] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                            {ratingText}
                          </span>
                        </div>

                        {/* Teacher notes section */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-[#006304]" />
                              <span>ملاحظات وتوجيهات المعلم:</span>
                            </span>
                            {existingSubmission?.reviewedAt && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                {new Date(existingSubmission.reviewedAt).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                          <div className="bg-[#F0F9F0] p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-800 font-bold leading-relaxed shadow-2xs">
                            <p className="whitespace-pre-wrap">
                              {notesText.trim() ? `"${notesText.trim()}"` : 'تلاوة مباركة ومتقنة، أحسنت وبارك الله فيك وجعلك من أهل القرآن وخاصته.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 text-gray-600">
                          <span>المكافأة المستحقة:</span>
                          <span className="font-bold text-[#006304] font-num flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-[#006304]" />
                            <span>+25 XP مكتسبة</span>
                          </span>
                        </div>
                      </div>

                      {/* Playback preview for recording if audio exists */}
                      {audioSrc && (
                        <div className="bg-white border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={togglePlayRecordedAudio}
                              className="w-9 h-9 rounded-full bg-[#006304] text-white flex items-center justify-center shadow-xs hover:bg-[#005103] cursor-pointer"
                            >
                              {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-0.5" />}
                            </button>
                            <span className="font-bold">استماع لتسجيلك المعتمد</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                            معتمد ✓
                          </span>
                          <audio
                            ref={audioPlayerRef}
                            src={audioSrc}
                            preload="metadata"
                            playsInline
                            onEnded={() => setIsPlayingRecorded(false)}
                            onError={() => setIsPlayingRecorded(false)}
                            className="hidden"
                          >
                            <source src={audioSrc} />
                          </audio>
                        </div>
                      )}

                      <button
                        onClick={onClose}
                        className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#F9BF3B]" />
                        <span>العودة إلى خريطة الرحلة</span>
                      </button>
                    </div>
                  );
                }

                // Case 2: Reviewed / Needs Practice Feedback
                if (isNeedsPractice && !isReReciting) {
                  return (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-center space-y-4 shadow-md animate-in fade-in">
                      <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                        <RotateCcw className="w-7 h-7" />
                      </div>

                      <div>
                        <span className="bg-amber-200 text-amber-900 text-xs font-black px-3.5 py-1 rounded-full inline-block">
                          توجيهات المعلم: طلب تدريب وإعادة
                        </span>
                        <h4 className="font-heading font-black text-lg text-slate-900 mt-2.5">
                          يرجى مراجعة ملاحظات المعلم وإعادة التسميع
                        </h4>
                        <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                          اطلع على توجيهات المعلم أدناه ثم أعد التسجيل أو التسميع لتثبيت الحفظ ونيل الاعتماد.
                        </p>
                      </div>

                      {/* Notes Box */}
                      <div className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-xs text-right space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                            <GraduationCap className="w-4 h-4 text-amber-700" />
                            <span>تقييم {teacherDisplayName}:</span>
                          </div>
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                            {ratingText}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                              <span>ملاحظات وتوجيهات المعلم:</span>
                            </span>
                            {existingSubmission?.reviewedAt && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                {new Date(existingSubmission.reviewedAt).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                          {notesText.trim() ? (
                            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-slate-800 font-bold leading-relaxed shadow-2xs">
                              <p className="whitespace-pre-wrap">"{notesText.trim()}"</p>
                            </div>
                          ) : (
                            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-[11px] text-amber-900 font-medium">
                              <p>طلب المعلم إعادة التدريب والتسميع لتثبيت الحفظ وضبط الأداء.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Previous Recording Audio preview */}
                      {audioSrc && (
                        <div className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={togglePlayRecordedAudio}
                              className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs hover:bg-amber-700 cursor-pointer"
                            >
                              {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-0.5" />}
                            </button>
                            <span className="font-bold">استماع لتسجيلك السابق</span>
                          </div>
                          <audio
                            ref={audioPlayerRef}
                            src={audioSrc}
                            preload="metadata"
                            playsInline
                            onEnded={() => setIsPlayingRecorded(false)}
                            onError={() => setIsPlayingRecorded(false)}
                            className="hidden"
                          >
                            <source src={audioSrc} />
                          </audio>
                        </div>
                      )}

                      <div className="space-y-2.5 pt-1">
                        {/* Action 1: Re-record Audio Now (Fixes Issue 1) */}
                        <button
                          onClick={() => {
                            setIsReReciting(true);
                            setReciteOption('recording');
                            setSubmissionSuccess(false);
                            setRecordedBlob(null);
                            setRecordedAudioUrl(null);
                          }}
                          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98"
                        >
                          <Mic className="w-5 h-5 text-[#F9BF3B]" />
                          <span>إعادة التسجيل والتسميع الآن (تسجيل ذاتي)</span>
                        </button>

                        {/* Action 2: Switch to In-Halaqah Recitation (Fixes Issue 2) */}
                        <button
                          onClick={() => {
                            setIsReReciting(true);
                            setReciteOption('halaqah');
                            setSubmissionSuccess(false);
                            setRecordedBlob(null);
                            setRecordedAudioUrl(null);
                          }}
                          className="w-full bg-white hover:bg-emerald-50 text-[#006304] border-2 border-[#006304] font-bold py-3.5 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98"
                        >
                          <Users className="w-5 h-5 text-[#006304]" />
                          <span>التبديل إلى التسميع في الحلقة (أمام المعلم)</span>
                        </button>

                        <button
                          onClick={onClose}
                          className="w-full bg-transparent hover:bg-amber-100/60 text-slate-600 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          العودة إلى الخريطة
                        </button>
                      </div>
                    </div>
                  );
                }

                // Case 3: Pending Review Status
                if (isPending) {
                  return (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-in fade-in">
                      <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                        <Clock className="w-7 h-7 animate-pulse" />
                      </div>

                      <div>
                        <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          حالة المهمة: بانتظار اعتماد المعلم
                        </span>
                        <h4 className="font-heading font-black text-lg text-slate-900 mt-2">
                          {submissionType === 'halaqah' || existingSubmission?.type === 'halaqah'
                            ? 'تم اختيار التسميع في الحلقة'
                            : 'تم رفع التسجيل الصوتي بنجاح'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {submissionType === 'halaqah' || existingSubmission?.type === 'halaqah'
                            ? 'سيقوم فضيلة المعلم بتسميعك وضبط الحفظ مباشرة في الحلقة وتوثيق الاعتماد في سجل تقدمك.'
                            : 'تم حفظ تسجيلك الصوتي وتوجيهه للمعلم للمراجعة والتدقيق ومنح الاعتماد والملاحظات قريباً.'}
                        </p>
                      </div>

                      {/* Switch recitation method card */}
                      {(() => {
                        const isCurrentHalaqah =
                          submissionType === 'halaqah' || existingSubmission?.type === 'halaqah';

                        return (
                          <div className="bg-white border-2 border-dashed border-purple-200 rounded-2xl p-3.5 text-right space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                                <span>إمكانية تبديل طريقة التسميع</span>
                              </div>
                              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                                متاح قبل الاعتماد
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {isCurrentHalaqah
                                ? 'هل ترغب بالتبديل إلى رفع تسجيل صوتي ذاتي بدلاً من الحضور في الحلقة؟'
                                : 'هل ترغب بالتبديل إلى التسميع في الحلقة حضورياً أمام المعلم بدلاً من التسجيل؟'}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSwitchMethod(isCurrentHalaqah ? 'recording' : 'halaqah')}
                              disabled={isSubmitting}
                              className="w-full bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-800 border border-purple-300 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                              <span>
                                {isCurrentHalaqah
                                  ? 'تبديل إلى: تسجيل صوتي ذاتي'
                                  : 'تبديل إلى: التسميع في الحلقة'}
                              </span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* Playback preview for recording if available */}
                      {audioSrc && (
                        <div className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={togglePlayRecordedAudio}
                              className="w-9 h-9 rounded-full bg-[#006304] text-white flex items-center justify-center shadow-xs hover:bg-[#005103] cursor-pointer"
                            >
                              {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-0.5" />}
                            </button>
                            <span className="font-bold">استماع لتسجيلك المرسل</span>
                          </div>
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold">
                            محفوظ
                          </span>
                          <audio
                            ref={audioPlayerRef}
                            src={audioSrc}
                            preload="metadata"
                            playsInline
                            onEnded={() => setIsPlayingRecorded(false)}
                            onError={() => setIsPlayingRecorded(false)}
                            className="hidden"
                          >
                            <source src={audioSrc} />
                          </audio>
                        </div>
                      )}

                      <button
                        onClick={onClose}
                        className="w-full bg-[#006304] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#005103] transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#F9BF3B]" />
                        <span>العودة إلى خريطة الرحلة</span>
                      </button>
                    </div>
                  );
                }

                // Guard: Student not joined in a circle
                if (user.role === 'student' && (!user.circleId || !user.teacherId) && !userCircle) {
                  return (
                    <div className="space-y-4 bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 text-center shadow-sm animate-in fade-in">
                      <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-800 flex items-center justify-center mx-auto shadow-xs text-2xl font-black">
                        ⚠️
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-lg text-amber-950">
                          يلزم الانضمام إلى حلقة قرآنية
                        </h4>
                        <p className="text-xs text-amber-900/80 mt-1.5 leading-relaxed font-medium">
                          يرجى الانضمام إلى حلقة أولاً لتتمكن من استخدام خاصية التسميع إلى معلم. تتطلب مهام التسميع متابعة وتصحيحاً معتمداً من فضيلة المعلم المشرف.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => {
                            onClose();
                            setActiveTab('profile');
                          }}
                          className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-[#F9BF3B]" />
                          <span>الانتقال إلى صفحة الحساب لاختيار حلقة</span>
                        </button>
                        <button
                          onClick={onClose}
                          className="w-full bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs border border-gray-300 transition-colors cursor-pointer"
                        >
                          العودة إلى الخريطة
                        </button>
                      </div>
                    </div>
                  );
                }

                // Initial Recite Choice Screen
                if (reciteOption === 'choose') {
                  return (
                    <div className="space-y-4 animate-in fade-in">
                      {isNeedsPractice && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-right space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                            <span className="flex items-center gap-1.5">
                              <RotateCcw className="w-4 h-4 text-amber-700" />
                              <span>إعادة التسميع والتدريب بناءً على توجيه المعلم</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsReReciting(false)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                            >
                              عرض تقييم المعلم
                            </button>
                          </div>
                          {notesText.trim() && (
                            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
                              <span className="text-[10px] text-amber-800 font-bold block mb-0.5">توجيه المعلم:</span>
                              <p className="whitespace-pre-wrap font-bold">"{notesText.trim()}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-purple-100 border-2 border-purple-300 text-purple-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                          <Mic className="w-7 h-7" />
                        </div>
                        <h4 className="font-heading font-black text-lg text-slate-900">
                          اختر طريقة التسميع
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          حدد المسار الأنسب لك لتسميع سور الأسبوع ({week.surahs.join('، ')})
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 pt-2">
                        {/* Option 1: In-Halaqah */}
                        <button
                          onClick={() => setReciteOption('halaqah')}
                          className="bg-emerald-50/80 hover:bg-emerald-100 border-2 border-emerald-300 rounded-2xl p-4 text-right transition-all flex items-start gap-3.5 group shadow-xs hover:border-[#006304] cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-[#006304] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-heading font-bold text-sm text-slate-900 group-hover:text-[#006304] transition-colors">
                              تسميع في الحلقة
                            </h5>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              التسميع المباشر أمام فضيلة المعلم في الحلقة القرآنية الحضورية أو عن بعد.
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Self-Recording */}
                        <button
                          onClick={() => setReciteOption('recording')}
                          className="bg-purple-50/80 hover:bg-purple-100 border-2 border-purple-300 rounded-2xl p-4 text-right transition-all flex items-start gap-3.5 group shadow-xs hover:border-purple-600 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-heading font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                              تسميع ذاتي (تسجيل صوتي)
                            </h5>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              سجّل تلاوتك بصوتك عبر الميكروفون لرفعها ومراجعتها من قبل المعلم.
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                }

                // In-Halaqah Confirmation Flow
                if (reciteOption === 'halaqah') {
                  return (
                    <div className="space-y-4 bg-emerald-50/90 border border-emerald-200 rounded-3xl p-5 text-center animate-in fade-in">
                      {/* Guidance banner when re-training */}
                      {isNeedsPractice && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-right space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                            <span className="flex items-center gap-1.5">
                              <RotateCcw className="w-4 h-4 text-amber-700" />
                              <span>إعادة التسميع بناءً على توجيه المعلم</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsReReciting(false)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                            >
                              عرض ملاحظات المعلم
                            </button>
                          </div>
                          {notesText.trim() && (
                            <div className="bg-white/90 p-2 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
                              <span className="text-[10px] text-amber-800 font-bold block mb-0.5">توجيه المعلم:</span>
                              <p className="whitespace-pre-wrap font-bold">"{notesText.trim()}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recitation Mode Switcher Bar */}
                      <div className="grid grid-cols-2 gap-2 bg-white/90 p-1.5 rounded-2xl border border-emerald-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleSwitchMethod('recording')}
                          disabled={isSubmitting}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-slate-600 hover:text-purple-800 hover:bg-purple-50 disabled:opacity-50"
                        >
                          <Mic className="w-4 h-4 text-purple-600" />
                          <span>تسجيل صوتي ذاتي</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReciteOption('halaqah')}
                          className="py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#006304] text-white shadow-xs"
                        >
                          <Users className="w-4 h-4 text-[#F9BF3B]" />
                          <span>تسميع في الحلقة</span>
                        </button>
                      </div>

                      <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-800 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-base text-slate-900">
                          تأكيد التسميع في الحلقة
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          عند التأكيد، سيتم وضع هذه المهمة في حالة <span className="font-bold text-[#006304]">"بانتظار اعتماد المعلم"</span> حتى يسمعك المعلم في الحلقة ويعتمد التسميع.
                        </p>
                      </div>

                      <div className="bg-white border border-emerald-200 rounded-xl p-3 text-right space-y-1 text-xs text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 font-bold text-[#006304]">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>السور المقررة للتسميع:</span>
                        </div>
                        <p className="text-slate-800 font-bold pr-5">{week.surahs.join(' - ')}</p>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={handleConfirmHalaqah}
                          disabled={isSubmitting}
                          className="w-full bg-[#006304] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#005103] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5 text-[#F9BF3B]" />
                          <span>{isSubmitting ? 'جاري التأكيد...' : 'تأكيد التسميع في الحلقة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSwitchMethod('recording')}
                          disabled={isSubmitting}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 py-1.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Mic className="w-4 h-4" />
                          <span>التبديل إلى التسجيل الصوتي الذاتي بدلاً من الحلقة</span>
                        </button>

                        {isNeedsPractice && (
                          <button
                            onClick={() => setIsReReciting(false)}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 py-1 cursor-pointer"
                          >
                            عرض ملاحظات المعلم
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Self-Recording Studio Flow
                return (
                  <div className="space-y-4 bg-purple-50/90 border border-purple-200 rounded-3xl p-5 text-center animate-in fade-in">
                    {/* Guidance banner when re-training */}
                    {isNeedsPractice && (
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-right space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-amber-700" />
                            <span>إعادة التسميع والتسجيل بناءً على توجيه المعلم</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsReReciting(false)}
                            className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                          >
                            عرض ملاحظات المعلم
                          </button>
                        </div>
                        {notesText.trim() && (
                          <div className="bg-white/90 p-2 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
                            <span className="text-[10px] text-amber-800 font-bold block mb-0.5">توجيه المعلم:</span>
                            <p className="whitespace-pre-wrap font-bold">"{notesText.trim()}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recitation Mode Switcher Bar */}
                    <div className="grid grid-cols-2 gap-2 bg-white/90 p-1.5 rounded-2xl border border-purple-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setReciteOption('recording')}
                        className="py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-purple-700 text-white shadow-xs"
                      >
                        <Mic className="w-4 h-4 text-[#F9BF3B]" />
                        <span>تسجيل صوتي ذاتي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isRecording) stopRecordingHandler();
                          handleSwitchMethod('halaqah');
                        }}
                        disabled={isSubmitting}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>تسميع في الحلقة</span>
                      </button>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-purple-100 border-2 border-purple-400 text-purple-700 flex items-center justify-center mx-auto">
                      <Mic className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-base text-slate-900">
                        استوديو التسجيل الصوتي
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        سجّل تلاوتك لسورة ({week.surahs.join('، ')}) بدقة وترتيل
                      </p>
                    </div>

                    {micPermissionError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2 text-right">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{micPermissionError}</span>
                      </div>
                    )}

                    {/* Active Recording or Playback Interface */}
                    {isRecording ? (
                      <div className="bg-white border-2 border-red-300 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-red-600 font-bold font-num text-xl animate-pulse">
                          <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
                          <span>00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 h-8">
                          {[30, 70, 100, 50, 80, 95, 40, 85, 60].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: `${Math.max(20, Math.round(h * Math.random()))}%` }}
                              className="w-1.5 bg-red-500 rounded-full animate-bounce"
                            />
                          ))}
                        </div>

                        <button
                          onClick={stopRecordingHandler}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          <span>إيقاف وإنهاء التسجيل</span>
                        </button>
                      </div>
                    ) : recordedBlob ? (
                      /* Recorded Audio Review & Submit */
                      <div className="bg-white border border-purple-200 rounded-2xl p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تم التقاط التسجيل بنجاح</span>
                          </span>
                          <span className="text-slate-500 font-num">
                            00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                          </span>
                        </div>

                        {/* Playback controller */}
                        {recordedAudioUrl && (
                          <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between gap-3">
                            <button
                              onClick={togglePlayRecordedAudio}
                              className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs hover:bg-purple-700 cursor-pointer"
                            >
                              {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-0.5" />}
                            </button>
                            <span className="text-xs font-bold text-purple-900">
                              {isPlayingRecorded ? 'جاري الاستماع للتسجيل...' : 'استمع لتسجيلك قبل الإرسال'}
                            </span>
                            <button
                              onClick={startRecordingHandler}
                              className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>إعادة التسجيل</span>
                            </button>
                            <audio
                              ref={audioPlayerRef}
                              src={recordedAudioUrl}
                              preload="metadata"
                              playsInline
                              onEnded={() => setIsPlayingRecorded(false)}
                              onError={() => setIsPlayingRecorded(false)}
                              className="hidden"
                            >
                              <source src={recordedAudioUrl} />
                            </audio>
                          </div>
                        )}

                        {/* Submit recording button */}
                        <button
                          onClick={handleSubmitRecording}
                          disabled={isSubmitting}
                          className="w-full bg-[#006304] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#005103] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                        >
                          <UploadCloud className="w-5 h-5 text-[#F9BF3B]" />
                          <span>{isSubmitting ? 'جاري رفع التسجيل...' : 'رفع التسجيل واعتماده للمعلم'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isRecording) stopRecordingHandler();
                            handleSwitchMethod('halaqah');
                          }}
                          disabled={isSubmitting}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 py-1.5 cursor-pointer flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
                        >
                          <Users className="w-4 h-4 text-[#006304]" />
                          <span>التبديل إلى التسميع في الحلقة بدلاً من رفع التسجيل</span>
                        </button>
                      </div>
                    ) : (
                      /* Initial Recording trigger button */
                      <div className="space-y-3 pt-2">
                        <button
                          onClick={startRecordingHandler}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl shadow-md text-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                        >
                          <Mic className="w-5 h-5" />
                          <span>ابدأ التسجيل الصوتي الآن</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isRecording) stopRecordingHandler();
                            handleSwitchMethod('halaqah');
                          }}
                          disabled={isSubmitting}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 py-1 cursor-pointer flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
                        >
                          <Users className="w-4 h-4 text-[#006304]" />
                          <span>التبديل إلى التسميع في الحلقة (أمام المعلم)</span>
                        </button>

                        {isNeedsPractice && (
                          <button
                            onClick={() => setIsReReciting(false)}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 py-1 cursor-pointer block mx-auto"
                          >
                            عرض ملاحظات المعلم
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MODE 4: SELF REVIEW (مراجعة ذاتية للسور المقررة) */}
              {node.type === 'review' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                      <RotateCcw className="w-7 h-7" />
                    </div>

                    <div className="text-center">
                      <h4 className="font-heading font-black text-base text-slate-900">
                        مراجعة وتثبيت السور المقررة
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        هذه المحطة مخصصة للمراجعة الذاتية وتمكين الحفظ قبل التقدم لاختبار البوابة
                      </p>
                    </div>

                    {/* Surahs Checklist */}
                    <div className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <span className="text-[11px] font-bold text-amber-900 block border-b border-amber-100 pb-1.5">
                        قائمة السور المشمولة في مراجعة الأسبوع:
                      </span>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {week.surahs.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-100">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#006304]" />
                            <span>سورة {s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 font-medium">
                      <p className="font-bold text-slate-800">💡 نصيحة تثبيت الورد:</p>
                      <p>قم بتلاوة السور غيباً من أولها لآخرها مع التأكد من عدم وجود تعثر في الآيات المتشابهة.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCompletedSuccess(true)}
                    className="w-full bg-[#006304] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#005103] transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#F9BF3B]" />
                    <span>أتممت المراجعة الذاتية بنجاح</span>
                  </button>
                </div>
              )}

              {/* MODE 5: QUIZ (اختبار قصير عادي) */}
              {node.type === 'quiz' && (
                <QuizEngine
                  week={week}
                  isFinalExam={week.id === 17 || node.id.includes('w17')}
                  onPass={(xpEarned) => {
                    completeNode(node.id, week.id, xpEarned);
                    onClose();
                  }}
                  onClose={onClose}
                />
              )}

              {/* MODE 6: GATE EXAM (اختبار بوابة الأسبوع في الحلقة أمام المعلم) */}
              {node.type === 'gate' && (() => {
                const isGateApproved = user.completedNodes.includes(node.id) || existingSubmission?.status === 'approved';
                const isGatePending = !isGateApproved && (submissionSuccess || existingSubmission?.status === 'pending' || existingSubmission?.status === 'pending_teacher_review');
                const isGateNeedsPractice = !isGateApproved && !isGatePending && (existingSubmission?.status === 'reviewed' || existingSubmission?.status === 'needs_practice');

                return (
                  <div className="space-y-4 text-right">
                    {/* Approved State */}
                    {isGateApproved && (
                      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 text-center space-y-3 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 mx-auto flex items-center justify-center text-emerald-700 shadow-xs">
                          <Trophy className="w-8 h-8 text-[#006304]" />
                        </div>
                        <div>
                          <span className="inline-block bg-emerald-200/80 text-emerald-900 text-xs font-black px-3 py-1 rounded-full mb-1.5 border border-emerald-300">
                            {existingSubmission?.rating || 'مجتاز بنجاح 🏆'}
                          </span>
                          <h3 className="font-heading font-black text-lg text-slate-900">
                            مبارك! اجتزت اختبار بوابة الأسبوع بنجاح
                          </h3>
                          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                            تم اعتماد اختبارك الشفهي في الحلقة من قِبل فضيلة المعلم وفتح الأسبوع التالي.
                          </p>
                        </div>
                        {existingSubmission?.teacherNotes && (
                          <div className="bg-white/90 p-3 rounded-2xl border border-emerald-200 text-right text-xs text-slate-800">
                            <span className="font-black text-[#006304] block mb-1">ملاحظات المعلم:</span>
                            <p className="leading-relaxed font-medium">{existingSubmission.teacherNotes}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition-colors cursor-pointer"
                        >
                          العودة إلى خريطة الرحلة
                        </button>
                      </div>
                    )}

                    {/* Pending State */}
                    {isGatePending && (
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-center space-y-3 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center text-amber-700 shadow-xs animate-pulse">
                          <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                          <span className="inline-block bg-amber-200/80 text-amber-900 text-xs font-black px-3 py-1 rounded-full mb-1.5 border border-amber-300">
                            حالة الاختبار: بانتظار المعلم في الحلقة
                          </span>
                          <h3 className="font-heading font-black text-lg text-slate-900">
                            تم تسجيل طلب اختبار البوابة في الحلقة
                          </h3>
                          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                            طلبك مسجل الآن لدى فضيلة المعلم. سيقوم المعلم باختبارك شفهياً في الحلقة القادمة عبر 4 مقاطع قرآنية واعتماد اجتيازك وفتح الأسبوع التالي.
                          </p>
                        </div>
                        <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-200 text-right text-xs space-y-1.5">
                          <span className="font-black text-amber-900 block">📖 السور المقررة في الاختبار:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {week.surahs.map((s) => (
                              <span key={s} className="bg-amber-100/80 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200">
                                سورة {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition-colors cursor-pointer"
                        >
                          حسناً، العودة إلى الخريطة
                        </button>
                      </div>
                    )}

                    {/* Needs Practice / Retest State */}
                    {isGateNeedsPractice && (
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-3xl p-5 text-center space-y-3 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-orange-100 border border-orange-300 mx-auto flex items-center justify-center text-orange-700 shadow-xs">
                          <RotateCcw className="w-8 h-8 text-orange-600" />
                        </div>
                        <div>
                          <span className="inline-block bg-orange-200 text-orange-900 text-xs font-black px-3 py-1 rounded-full mb-1.5 border border-orange-300">
                            توجيه المعلم: إعادة الاختبار والتدريب
                          </span>
                          <h3 className="font-heading font-black text-lg text-slate-900">
                            تحتاج لمراجعة بعض الآيات
                          </h3>
                          {existingSubmission?.teacherNotes && (
                            <div className="bg-white/95 p-3 rounded-2xl border border-orange-200 text-right text-xs text-slate-800 mt-2">
                              <span className="font-black text-orange-900 block mb-1">ملاحظات وتوجيهات المعلم:</span>
                              <p className="leading-relaxed font-medium">{existingSubmission.teacherNotes}</p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleRequestGateExamInHalaqah}
                          className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-4 h-4 text-[#F9BF3B]" />
                          <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'إعادة طلب اختبار البوابة في الحلقة'}</span>
                        </button>
                      </div>
                    )}

                    {/* Initial State (Not submitted yet) */}
                    {!isGateApproved && !isGatePending && !isGateNeedsPractice && (
                      <div className="space-y-4">
                        {/* Information Banner */}
                        <div className="bg-gradient-to-br from-[#006304]/10 via-[#006304]/5 to-transparent border-2 border-[#006304]/20 rounded-3xl p-4 sm:p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#006304] text-white flex items-center justify-center shrink-0 shadow-md">
                              <Trophy className="w-6 h-6 text-[#F9BF3B]" />
                            </div>
                            <div>
                              <h3 className="font-heading font-black text-base text-slate-900">
                                اختبار بوابة {week.title}
                              </h3>
                              <p className="text-xs text-gray-600 font-medium mt-0.5">
                                اختبار شفهي في الحلقة أمام المعلم للتأكد من إتقان الحفظ وأحكام التجويد
                              </p>
                            </div>
                          </div>

                          {/* Surahs Included */}
                          <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
                            <span className="text-xs font-black text-[#006304] flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              <span>السور المقررة في هذا الاختبار:</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {week.surahs.map((surah) => (
                                <span
                                  key={surah}
                                  className="bg-[#006304]/10 text-[#006304] border border-[#006304]/20 px-3 py-1 rounded-xl text-xs font-black shadow-2xs"
                                >
                                  سورة {surah}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Notice */}
                          <div className="text-[11px] text-slate-600 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/70 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-medium">
                              يقوم المعلم في حلقة التحفيظ باختبارك شفهياً عبر ٤ مقاطع قرآنية عشوائية من منهج هذا الأسبوع للتأكد من تمام الضبط والإتقان قبل فتح الأسبوع التالي.
                            </p>
                          </div>
                        </div>

                        {/* Single Primary Action Button (Strictly In-Halaqah, No Self Recording) */}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleRequestGateExamInHalaqah}
                          className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer disabled:opacity-50 group hover:shadow-xl active:scale-[0.99]"
                        >
                          <Trophy className="w-5 h-5 text-[#F9BF3B] group-hover:scale-110 transition-transform" />
                          <span>{isSubmitting ? 'جاري إرسال الطلب للمعلم...' : 'طلب اختبار البوابة في الحلقة'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};