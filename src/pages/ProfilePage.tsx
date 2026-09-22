import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { AvatarDisplay } from '../components/Avatar/AvatarDisplay';
import { StreakWidget } from '../components/Streak/StreakWidget';
import {
  RotateCcw,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Palette,
  Briefcase,
  BookOpen,
  CloudCheck,
  ShieldCheck,
  GraduationCap,
  Building,
  KeyRound,
  Users,
  LogOut,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Check,
  ArrowLeftRight,
  Send,
  X,
  MessageSquare,
  Mic,
  Star,
  Play,
  Pause,
  Clock,
  Globe,
  Compass,
  Loader2,
} from 'lucide-react';
import { AvatarStyle, OutfitColor, BagStyle, AccessoryStyle, UserRole, UserGender, Circle, NodeSubmission, TrackId, Language } from '../types';
import { getAvailableCircles, getProfile, getStudentSubmissions } from '../services/supabaseService';
import { TrackSelectionModal } from '../components/TrackSelectionModal';
import { getTrackTitle } from '../lib/i18n';

export const ProfilePage: React.FC = () => {
  const {
    user,
    profile,
    updateUserProfile,
    resetProgress,
    loadSampleProgress,
    userCircle,
    setActiveTab,
    joinCircleAction,
    leaveCurrentCircle,
    refreshCircleData,
    refreshProfile,
    signOut,
    session,
    supabaseAuthUser,
    language,
    setLanguage,
    setTrack,
    t,
    requestCircleTransfer,
  } = useSupabase();

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [showTrackChangeWarning, setShowTrackChangeWarning] = useState(false);
  const [trackChangeSuccessNotice, setTrackChangeSuccessNotice] = useState(false);

  const [editingName, setEditingName] = useState(user.displayName || user.name || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);
  const [isResettingProgress, setIsResettingProgress] = useState(false);

  // Circle Joining State
  const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [selectedCircleCode, setSelectedCircleCode] = useState('');
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [circleActionLoading, setCircleActionLoading] = useState(false);
  const [circleFeedback, setCircleFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Change Circle Modal & Request State
  const [isChangeCircleModalOpen, setIsChangeCircleModalOpen] = useState(false);
  const [changeCircleSuccessNotice, setChangeCircleSuccessNotice] = useState(false);
  const [requestedNewCircleCode, setRequestedNewCircleCode] = useState('');

  // Teacher Info State for Students
  const [teacherDisplayName, setTeacherDisplayName] = useState<string>('');
  const [isTeacherInfoLoading, setIsTeacherInfoLoading] = useState<boolean>(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);

  // Student Recitation Submissions & Teacher Notes State
  const [studentRecitations, setStudentRecitations] = useState<NodeSubmission[]>([]);
  const [loadingRecitations, setLoadingRecitations] = useState<boolean>(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const profileAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchRecitations = async () => {
    const studentId = profile?.id || user.id;
    if (!studentId || user.role === 'teacher') return;
    setLoadingRecitations(true);
    try {
      const subs = await getStudentSubmissions(studentId);
      if (Array.isArray(subs)) {
        setStudentRecitations(subs);
      }
    } catch (e) {
      console.warn('⚠️ [ProfilePage] Error fetching recitations:', e);
    } finally {
      setLoadingRecitations(false);
    }
  };

  const togglePlayAudio = (url: string) => {
    if (!profileAudioRef.current) return;
    if (playingAudioUrl === url) {
      profileAudioRef.current.pause();
      setPlayingAudioUrl(null);
    } else {
      profileAudioRef.current.src = url;
      profileAudioRef.current.play().catch(e => console.warn('Audio play error:', e));
      setPlayingAudioUrl(url);
    }
  };

  // Fetch available circles for user's gender
  const loadCircles = async (gender?: UserGender) => {
    setLoadingCircles(true);
    try {
      const circles = await getAvailableCircles(gender || user.gender || 'male');
      setAvailableCircles(circles);
    } catch (err) {
      console.warn('Error loading available circles:', err);
    } finally {
      setLoadingCircles(false);
    }
  };

  // Fetch up-to-date teacher name from database with fast batch query
  const fetchTeacherInfo = async (bypassCache = false) => {
    const targetCircleId = profile?.circle_id || user.circleId || userCircle?.id;
    let teacherId = profile?.teacher_id || user.teacherId || userCircle?.teacherId;

    if (targetCircleId) {
      setIsTeacherInfoLoading(true);
      try {
        const { getStudentCircleInfo } = await import('../services/supabaseService');
        const info = await getStudentCircleInfo(targetCircleId, bypassCache);
        if (info) {
          if (info.teacherName && info.teacherName !== 'الشيخ' && info.teacherName !== 'المعلم') {
            setTeacherDisplayName(info.teacherName);
            setIsTeacherInfoLoading(false);
            return;
          }
          if (info.teacherId) {
            teacherId = info.teacherId;
          }
        }
      } catch (err) {
        console.warn('⚠️ [ProfilePage.fetchTeacherInfo] Error with getStudentCircleInfo:', err);
      }
    }

    if (!teacherId) {
      if (userCircle?.teacherName && userCircle.teacherName !== 'الشيخ' && userCircle.teacherName !== 'المعلم') {
        setTeacherDisplayName(userCircle.teacherName);
      }
      setIsTeacherInfoLoading(false);
      return;
    }

    setIsTeacherInfoLoading(true);
    try {
      const teacherData = await getProfile(teacherId);
      if (teacherData && (teacherData.name || teacherData.displayName)) {
        const resolvedName = teacherData.name || teacherData.displayName;
        setTeacherDisplayName(resolvedName);
      } else if (userCircle?.teacherName) {
        setTeacherDisplayName(userCircle.teacherName);
      }
    } catch (err) {
      console.error('❌ [ProfilePage.fetchTeacherInfo] Error loading teacher profile:', err);
    } finally {
      setIsTeacherInfoLoading(false);
    }
  };

  // Sync circles, teacher info, and recitations when profile / circle state changes
  useEffect(() => {
    console.log('🔄 [ProfilePage] Circle or user state changed:', {
      circleId: user.circleId,
      profileCircleId: profile?.circle_id,
      teacherId: profile?.teacher_id,
      userGender: user.gender,
    });
    loadCircles(user.gender);
    fetchTeacherInfo();
    if (user.role === 'student') {
      fetchRecitations();
    }
  }, [user.gender, user.circleId, profile?.circle_id, profile?.teacher_id, userCircle?.teacherId, user.submissions]);

  const handleManualRefresh = async () => {
    console.log('🔄 [ProfilePage] Manual page refresh triggered');
    setIsRefreshingAll(true);
    try {
      await Promise.all([
        refreshProfile(),
        refreshCircleData(),
        fetchTeacherInfo(true),
        loadCircles(user.gender),
        fetchRecitations(),
      ]);
    } catch (err) {
      console.error('❌ [ProfilePage] Error during manual refresh:', err);
    } finally {
      setTimeout(() => setIsRefreshingAll(false), 300);
    }
  };

  const handleJoinBySelected = async () => {
    if (!selectedCircleCode) return;
    setCircleActionLoading(true);
    setCircleFeedback(null);
    const res = await joinCircleAction(selectedCircleCode);
    setCircleFeedback(res);
    setCircleActionLoading(false);
    if (res.success) {
      await refreshCircleData();
    }
  };

  const handleJoinByCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCodeInput.trim()) return;
    setCircleActionLoading(true);
    setCircleFeedback(null);
    const res = await joinCircleAction(customCodeInput.trim());
    setCircleFeedback(res);
    setCircleActionLoading(false);
    if (res.success) {
      setCustomCodeInput('');
      await refreshCircleData();
    }
  };

  const handleLeaveCircle = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مغادرة هذه الحلقة القرآنية؟')) {
      setCircleActionLoading(true);
      await leaveCurrentCircle();
      setCircleFeedback({ success: true, message: 'تمت مغادرة الحلقة بنجاح.' });
      setCircleActionLoading(false);
      loadCircles(user.gender);
    }
  };

  const handleSendChangeCircleRequest = async () => {
    if (!requestedNewCircleCode) {
      alert(language === 'en' ? 'Please select a circle to request transfer.' : 'يرجى اختيار الحلقة المطلوب الانتقال إليها.');
      return;
    }
    const selectedCircle = availableCircles.find(
      c => c.code === requestedNewCircleCode || c.id === requestedNewCircleCode
    );
    if (!selectedCircle) {
      alert(language === 'en' ? 'Selected circle not found.' : 'لم يتم العثور على الحلقة المختارة.');
      return;
    }

    setCircleActionLoading(true);
    try {
      const res = await requestCircleTransfer(selectedCircle.id, selectedCircle.name);
      setIsChangeCircleModalOpen(false);
      setCircleActionLoading(false);
      if (res.success) {
        setChangeCircleSuccessNotice(true);
        setTimeout(() => {
          setChangeCircleSuccessNotice(false);
        }, 6000);
      } else {
        alert(res.message || (language === 'en' ? 'Failed to send transfer request.' : 'فشل إرسال طلب النقل.'));
      }
    } catch (err: any) {
      setCircleActionLoading(false);
      alert(err.message || (language === 'en' ? 'Error sending request.' : 'حدث خطأ أثناء إرسال الطلب.'));
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim()) return;

    updateUserProfile({ displayName: editingName.trim(), name: editingName.trim() });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const isTeacher = user.role === 'teacher';
  const currentAvatarStyle: AvatarStyle = user.avatarStyle || (user.gender === 'female' ? 'hafiza' : 'hafiz');
  const currentOutfitColor: OutfitColor = user.outfitColor || 'green';
  const currentBagStyle: BagStyle = user.bagStyle || 'satchel';
  const currentAccessoryStyle: AccessoryStyle = user.accessoryStyle || 'quran';

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4 font-arabic">
      {/* Profile Header Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-5 shadow-xs text-center space-y-3 relative overflow-hidden">
        <div className="flex justify-center my-1">
          <AvatarDisplay
            avatarStyle={currentAvatarStyle}
            outfitColor={currentOutfitColor}
            bagStyle={currentBagStyle}
            accessoryStyle={currentAccessoryStyle}
            size="xl"
            animated={true}
          />
        </div>

        <div>
          <h2 className="font-heading font-black text-xl text-slate-900">
            {user.displayName || user.name || (isTeacher ? (language === 'en' ? 'Honorable Teacher' : 'فضيلة المعلم') : (language === 'en' ? 'Ward Reader' : 'قارئ ورد'))}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xs text-[#006304] font-bold bg-[#F0F9F0] px-3 py-0.5 rounded-full border border-[#006304]">
              {isTeacher
                ? (language === 'en' ? '👨‍🏫 Quran Halaqah Teacher' : '👨‍🏫 معلم حلقة قرآنية')
                : (language === 'en' ? '🌱 Student in Ward Journey' : '🌱 طالب في رحلة وِرد القرآن')}
            </span>
            <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {user.gender === 'female'
                ? (language === 'en' ? '👧 Female' : '👧 إناث')
                : (language === 'en' ? '👦 Male' : '👦 ذكور')}
            </span>
          </div>
        </div>

        {/* Stats Row (Hidden XP for teachers) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          {!isTeacher ? (
            <div className="bg-[#F0F9F0] p-2.5 rounded-2xl border border-[#006304]/20">
              <span className="text-[10px] text-gray-600 font-bold block">
                {language === 'en' ? 'XP Points' : 'نقاط XP'}
              </span>
              <span className="font-num font-extrabold text-[#006304] text-sm">{user.xp} XP</span>
            </div>
          ) : (
            <div className="bg-[#F0F9F0] p-2.5 rounded-2xl border border-[#006304]/20">
              <span className="text-[10px] text-gray-600 font-bold block">
                {language === 'en' ? 'Account Type' : 'نوع الحساب'}
              </span>
              <span className="font-extrabold text-[#006304] text-xs">
                {language === 'en' ? 'Certified Teacher' : 'معلم معتمد'}
              </span>
            </div>
          )}
          <div className="bg-[#FFF8E7] p-2.5 rounded-2xl border border-[#F9BF3B]/30">
            <span className="text-[10px] text-[#C79545] font-bold block">
              {isTeacher ? (language === 'en' ? 'Role' : 'الدور') : (language === 'en' ? 'Longest Streak' : 'أطول سلسلة')}
            </span>
            <span className="font-num font-extrabold text-[#C79545] text-sm">
              {isTeacher
                ? (language === 'en' ? 'Teacher & Muhaffiz' : 'معلم ومحفّظ')
                : `🏆 ${user.longestStreak || user.streak} ${language === 'en' ? (user.longestStreak === 1 ? 'day' : 'days') : 'يوماً'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Role & Circle Details Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <Building className="w-4 h-4 text-[#006304]" />
            <span>{language === 'en' ? 'Account & Quran Circle Info' : 'بيانات الحساب والحلقة القرآنية'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshingAll}
              className="text-[11px] font-bold text-gray-600 hover:text-[#006304] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title={language === 'en' ? 'Refresh profile and circle' : 'تحديث بيانات الملف والحلقة'}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              <span>{language === 'en' ? 'Refresh' : 'تحديث'}</span>
            </button>
            <span className="text-[10px] font-bold bg-emerald-50 text-[#006304] px-2 py-0.5 rounded-full border border-emerald-200">
              {isTeacher ? (language === 'en' ? 'Teacher' : 'معلم') : (language === 'en' ? 'Student' : 'طالب')}
            </span>
          </div>
        </div>

        {/* Read-Only Gender Display (Cannot be changed by student) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 block">
            {language === 'ar' ? 'الجنس المحدد للحساب:' : 'Account Gender:'}
          </label>
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="text-base">{user.gender === 'female' ? '👧' : '👦'}</span>
              <span>
                {user.gender === 'female'
                  ? (language === 'ar' ? 'أنثى (حلقات البنات)' : 'Female (Girls Halaqah)')
                  : (language === 'ar' ? 'ذكر (حلقات البنين)' : 'Male (Boys Halaqah)')}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-gray-200/70 text-gray-600 px-2 py-0.5 rounded-md">
              {language === 'ar' ? 'ثابت للقراءة فقط' : 'Read only'}
            </span>
          </div>
        </div>

        {/* 1. Interface Language Setting Card */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <label className="text-[11px] font-bold text-gray-700 block flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#006304]" />
            <span>{t('language')}:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                language === 'ar'
                  ? 'border-[#006304] bg-[#F0F9F0] text-[#006304] shadow-xs ring-1 ring-[#006304]/20'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>🇸🇦</span>
              <span>{t('lang_ar')}</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                language === 'en'
                  ? 'border-[#006304] bg-[#F0F9F0] text-[#006304] shadow-xs ring-1 ring-[#006304]/20'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>🇬🇧</span>
              <span>{t('lang_en')}</span>
            </button>
          </div>
        </div>

        {/* 2. Study Track Management Card (Students Only) */}
        {!isTeacher && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#006304]" />
                <span>{language === 'en' ? 'Study Track:' : 'المسار الدراسي:'}</span>
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                user.track === 'juz_amma_tabarak'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {language === 'en'
                  ? (user.track === 'juz_amma_tabarak' ? 'Amma & Tabarak' : 'Juz Amma')
                  : (user.track === 'juz_amma_tabarak' ? 'عم وتبارك' : 'جزء عم')}
              </span>
            </div>

            <div className="bg-[#F0F9F0] border-2 border-[#006304]/30 rounded-2xl p-3.5 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-500 block">
                  {language === 'en' ? 'Current Track:' : 'المسار الحالي:'}
                </span>
                <h4 className="text-xs font-black text-[#006304]">
                  {language === 'en'
                    ? (user.track === 'juz_amma_tabarak' ? 'Juz Amma & Tabarak (16 Weeks)' : 'Juz Amma Only (17 Weeks)')
                    : (user.track === 'juz_amma_tabarak' ? 'جزء عم وجزء تبارك (16 أسبوعاً)' : 'جزء عم فقط (17 أسبوعاً)')}
                </h4>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  {language === 'en'
                    ? (user.track === 'juz_amma_tabarak' ? 'Intensive plan to memorize and solidify Amma and Tabarak' : 'Foundational plan to memorize and solidify Juz Amma in full')
                    : (user.track === 'juz_amma_tabarak' ? 'الخطة المكثفة لحفظ وتثبيت جزأي عم وتبارك' : 'الخطة الأساسية لحفظ وتثبيت جزء عم كاملاً')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTrackChangeWarning(true)}
                className="w-full bg-white hover:bg-emerald-50 text-[#006304] border border-[#006304]/30 hover:border-[#006304] font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Change Track' : 'تغيير المسار'}</span>
              </button>
            </div>

            {trackChangeSuccessNotice && (
              <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{language === 'en' ? 'Your study track was updated successfully!' : 'تم تحديث مسارك الدراسي بنجاح!'}</span>
              </div>
            )}
          </div>
        )}

        {/* Change Circle Request Notification Banner */}
        {changeCircleSuccessNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-[#006304] flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-0.5">
              <p>{language === 'en' ? 'Circle change request sent to the teacher.' : 'تم إرسال طلب تغيير الحلقة إلى المعلم.'}</p>
              <p className="text-[11px] font-medium text-emerald-800">
                {language === 'en'
                  ? 'You will be notified and your circle updated once approved.'
                  : 'سيتم إعلامك وتحديث حلقتك فور اعتماد المعلم للطلب.'}
              </p>
            </div>
          </div>
        )}

        {/* Student Circle Status & Join/Change System */}
        {!isTeacher && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            {userCircle || user.circleId ? (
              /* Already Joined a Circle */
              <div className="bg-[#F0F9F0] border-2 border-[#006304]/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#006304] text-white flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block">
                        {language === 'en' ? 'Your Current Circle:' : 'حلقتك الحالية:'}
                      </span>
                      <h4 className="text-xs font-black text-[#006304]">
                        {userCircle?.name || user.circleName || (language === 'en' ? 'Quran Circle' : 'حلقة القرآن')}
                      </h4>
                    </div>
                  </div>

                  {/* Change Circle Button */}
                  <button
                    onClick={() => setIsChangeCircleModalOpen(true)}
                    className="bg-white hover:bg-emerald-50 text-[#006304] border border-[#006304]/30 hover:border-[#006304] font-bold px-2.5 py-1.5 rounded-xl text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    title={language === 'en' ? 'Request Circle Change' : 'طلب تغيير الحلقة'}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Change Circle' : 'تغيير الحلقة'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-[#006304]/10">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{language === 'en' ? 'Teacher:' : 'المعلم:'}</span>
                    <span className="font-black text-[#006304]">
                      {isTeacherInfoLoading ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>{language === 'en' ? 'Verifying...' : 'جاري التحقق...'}</span>
                        </span>
                      ) : (
                        teacherDisplayName || userCircle?.teacherName || user.teacherName || (language === 'en' ? 'Teacher' : 'معلم الحلقة')
                      )}
                    </span>
                  </div>
                  {userCircle?.code && (
                    <span className="font-num dir-ltr bg-white px-2 py-0.5 rounded-md border border-gray-200 text-slate-800 font-bold text-[11px]">
                      {userCircle.code}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Not in a circle: Selection UI */
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <Users className="w-4 h-4 text-[#006304]" />
                  <span>{language === 'en' ? 'Join a Quran Circle:' : 'الانضمام إلى حلقة قرآنية:'}</span>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {language === 'en'
                    ? 'Select an approved circle below or enter your direct circle code:'
                    : 'اختر حلقة معتمدة من القائمة أدناه أو أدخل رمز الحلقة المباشر للربط مع معلمك:'}
                </p>

                {/* 1. Dropdown / Selection from Available Circles */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <span>
                      {language === 'en'
                        ? `1. Available Circles (${user.gender === 'female' ? 'Girls' : 'Boys'}):`
                        : `1. الحلقات المتاحة (${user.gender === 'female' ? 'للبنات' : 'للبنين'}):`}
                    </span>
                    <button
                      onClick={() => loadCircles(user.gender)}
                      className="text-[#006304] hover:underline flex items-center gap-1 text-[10px]"
                      title={language === 'en' ? 'Refresh circles list' : 'تحديث قائمة الحلقات'}
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingCircles ? 'animate-spin' : ''}`} />
                      <span>{language === 'en' ? 'Refresh' : 'تحديث'}</span>
                    </button>
                  </div>

                  {loadingCircles ? (
                    <div className="text-center py-2 text-xs text-gray-500 font-bold">
                      {language === 'en' ? 'Loading available circles...' : 'جاري تحميل الحلقات المتاحة...'}
                    </div>
                  ) : availableCircles.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={selectedCircleCode}
                          onChange={e => setSelectedCircleCode(e.target.value)}
                          className="w-full appearance-none bg-white border border-gray-300 hover:border-[#006304] text-slate-900 font-bold text-xs rounded-xl py-2 px-3 pr-8 shadow-2xs focus:outline-hidden focus:border-[#006304] transition-all cursor-pointer"
                        >
                          <option value="">{language === 'en' ? '-- Select a Quran Circle --' : '-- اختر حلقة قرآنية --'}</option>
                          {availableCircles.map(c => (
                            <option key={c.id} value={c.code || c.id}>
                              {c.name} ({language === 'en' ? 'Teacher:' : 'المعلم:'} {c.teacherName}) - {c.code}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {selectedCircleCode && (
                        <button
                          onClick={handleJoinBySelected}
                          disabled={circleActionLoading}
                          className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Confirm Join Selected Circle' : 'تأكيد الانضمام للحلقة المختارة'}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center text-xs text-gray-500">
                      {language === 'en'
                        ? 'No approved circles available for this gender. You can enter a code below:'
                        : 'لا توجد حلقات معتمدة متاحة حالياً لهذا الجنس. يمكنك إدخال الرمز المباشر أدناه:'}
                    </div>
                  )}
                </div>

                {/* 2. Manual Join Code */}
                <form onSubmit={handleJoinByCustomCode} className="space-y-2 pt-1 border-t border-amber-200/60">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    {language === 'en' ? '2. Or enter direct circle code:' : '2. أو أدخل رمز الحلقة المباشر:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCodeInput}
                      onChange={e => setCustomCodeInput(e.target.value.toUpperCase())}
                      placeholder={language === 'en' ? 'e.g. WRD-101' : 'مثال: WRD-101'}
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs font-bold text-slate-900 tracking-wider dir-ltr uppercase focus:outline-hidden focus:border-[#006304]"
                    />
                    <button
                      type="submit"
                      disabled={circleActionLoading || !customCodeInput.trim()}
                      className="bg-[#006304] hover:bg-[#005103] disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Join' : 'انضمام'}</span>
                    </button>
                  </div>
                </form>

                {circleFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      circleFeedback.success
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {circleFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{circleFeedback.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Teacher Circle Management Link */}
        {user.role === 'teacher' && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => setActiveTab('teacher')}
              className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#F9BF3B]" />
              <span>{language === 'en' ? 'Go to Teacher Dashboard & Circles' : 'الانتقال إلى لوحة تحكم المعلم والحلقات'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Requesting Circle Change */}
      {isChangeCircleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#F0F9F0] text-[#006304]">
                  <ArrowLeftRight className="w-5 h-5" />
                </span>
                <h3 className="font-heading font-black text-sm text-slate-900">
                  طلب تغيير الحلقة
                </h3>
              </div>
              <button
                onClick={() => setIsChangeCircleModalOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5">
                <h4 className="text-xs font-bold text-amber-900">
                  تنبيه وإشعار:
                </h4>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  سيتم إرسال طلب تغيير الحلقة إلى معلمك الحالي للموافقة. لن يتم تغيير الحلقة إلا بعد موافقة المعلم.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span className="font-bold">الحلقة الحالية:</span>
                  <span className="font-bold text-[#006304]">{userCircle?.name || user.circleName || 'حلقة القرآن'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">المعلم:</span>
                  <span className="font-bold text-slate-800">{userCircle?.teacherName || user.teacherName || 'الشيخ'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSendChangeCircleRequest}
                className="flex-1 bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال الطلب</span>
              </button>

              <button
                onClick={() => setIsChangeCircleModalOpen(false)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for Profile playback */}
      <audio
        ref={profileAudioRef}
        onEnded={() => setPlayingAudioUrl(null)}
        className="hidden"
      />

      {/* Student Recitation Submissions & Teacher Feedback Card */}
      {!isTeacher && (
        <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
              <GraduationCap className="w-4 h-4 text-[#006304]" />
              <span>{language === 'en' ? 'Recitation Log & Teacher Feedback' : 'سجل التسميع وملاحظات المعلم'}</span>
            </div>
            <button
              onClick={fetchRecitations}
              disabled={loadingRecitations}
              className="text-[11px] font-bold text-[#006304] hover:text-[#005103] bg-[#F0F9F0] px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title={language === 'en' ? 'Refresh Recitation Log' : 'تحديث سجل التسميع'}
            >
              <RefreshCw className={`w-3 h-3 ${loadingRecitations ? 'animate-spin' : ''}`} />
              <span>{language === 'en' ? 'Refresh Log' : 'تحديث السجل'}</span>
            </button>
          </div>

          {(() => {
            // Combine submissions from server array and local state dict
            const allSubsMap = new Map<string, NodeSubmission>();
            studentRecitations.forEach(sub => {
              if (sub.nodeId) allSubsMap.set(sub.nodeId, sub);
            });
            if (user.submissions && typeof user.submissions === 'object') {
              Object.entries(user.submissions).forEach(([nodeId, sub]) => {
                if (sub && typeof sub === 'object' && !allSubsMap.has(nodeId)) {
                  allSubsMap.set(nodeId, { ...(sub as NodeSubmission), nodeId });
                }
              });
            }

            const subsList = Array.from(allSubsMap.values()).sort((a, b) => {
              const dateA = new Date(a.reviewedAt || a.submittedAt || 0).getTime();
              const dateB = new Date(b.reviewedAt || b.submittedAt || 0).getTime();
              return dateB - dateA;
            });

            if (loadingRecitations && subsList.length === 0) {
              return (
                <div className="text-center py-6 space-y-2">
                  <RefreshCw className="w-5 h-5 text-[#006304] animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 font-bold">
                    {language === 'en' ? 'Loading recitations and evaluations...' : 'جاري تحميل سجل التسميع والتقييمات...'}
                  </p>
                </div>
              );
            }

            if (subsList.length === 0) {
              return (
                <div className="bg-[#F0F9F0]/60 rounded-xl p-4 text-center space-y-2 border border-emerald-100">
                  <Mic className="w-6 h-6 text-[#006304] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'No recitation recordings submitted yet' : 'لا توجد تسجيلات تسميع مرسلة بعد'}
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {language === 'en'
                      ? 'When you complete weekly recitation tasks in the memorization plan, your teacher’s feedback will appear here.'
                      : 'عند إتمام مهام التسميع الأسبوعية في خطة الحفظ وإرسالها، ستظهر تقييمات وتوجيهات معلمك هنا.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {subsList.map(sub => {
                  const isApproved = sub.status === 'approved';
                  const isNeedsPractice = (sub.status as string) === 'reviewed' || (sub.status as string) === 'needs_practice';
                  const isPending = !isApproved && !isNeedsPractice;
                  const notes = sub.teacherNotes || (sub as any).teacher_notes || (sub as any).notes;
                  const rating = sub.rating || (isApproved
                    ? (language === 'en' ? 'Excellent 🌟' : 'ممتاز 🌟')
                    : isNeedsPractice
                    ? (language === 'en' ? 'Needs Practice 🔄' : 'يحتاج تدريب 🔄')
                    : (language === 'en' ? 'Under Review' : 'قيد المراجعة'));
                  const audioUrl = sub.audioUrl || (sub as any).audioData;
                  const isPlaying = playingAudioUrl === audioUrl;
                  const weekNum = (sub as any).weekNumber || (sub as any).week_number;

                  return (
                    <div
                      key={sub.id || sub.nodeId}
                      className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                        isApproved
                          ? 'bg-[#F0F9F0]/70 border-emerald-200'
                          : isNeedsPractice
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-gray-200'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                              isApproved
                                ? 'bg-emerald-100 text-[#006304]'
                                : isNeedsPractice
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {sub.type === 'recording' ? <Mic className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">
                              {sub.nodeTitle || (language === 'en' ? `Task Recitation ${sub.nodeId || ''}` : `تسميع المهمة ${sub.nodeId || ''}`)}
                            </h4>
                            {weekNum && (
                              <span className="text-[10px] text-gray-500 font-bold block">
                                {language === 'en' ? `Week ${weekNum}` : `الأسبوع ${weekNum}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              isApproved
                                ? 'bg-emerald-100 text-[#006304] border-emerald-300'
                                : isNeedsPractice
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            {isApproved
                              ? (language === 'en' ? 'Approved ✓' : 'معتمد ✓')
                              : isNeedsPractice
                              ? (language === 'en' ? 'Practice Needed 🔄' : 'توجيه تدريب 🔄')
                              : (language === 'en' ? 'In Review ⏳' : 'قيد المراجعة ⏳')}
                          </span>
                        </div>
                      </div>

                      {/* Rating and Details */}
                      <div className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-600 font-bold text-[11px]">
                          <span>{language === 'en' ? 'Evaluation:' : 'التقدير:'}</span>
                          <span
                            className={`font-black px-2 py-0.5 rounded-md ${
                              isApproved
                                ? 'text-[#006304] bg-emerald-50'
                                : isNeedsPractice
                                ? 'text-amber-800 bg-amber-50'
                                : 'text-slate-700 bg-gray-50'
                            }`}
                          >
                            {rating}
                          </span>
                        </div>

                        {sub.reviewedAt ? (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(sub.reviewedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA')}</span>
                          </div>
                        ) : sub.submittedAt ? (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(sub.submittedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA')}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Teacher Notes Block */}
                      {notes ? (
                        <div className="bg-white rounded-xl p-3 border border-emerald-200/80 space-y-1 text-right shadow-2xs">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <MessageSquare className="w-3.5 h-3.5 text-[#006304]" />
                            <span>{language === 'en' ? "Teacher's Guidance & Notes:" : 'ملاحظات وتوجيهات المعلم:'}</span>
                          </div>
                          <p className="text-xs text-slate-800 font-bold leading-relaxed bg-[#F0F9F0] p-2.5 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                            "{notes.trim()}"
                          </p>
                        </div>
                      ) : isApproved ? (
                        <div className="bg-white rounded-xl p-2.5 border border-emerald-100 text-right">
                          <p className="text-[11px] text-emerald-800 font-bold">
                            {language === 'en'
                              ? '"Blessed and precise recitation, well done!"'
                              : '"تلاوة مباركة ومتقنة، أحسنت وبارك الله فيك."'}
                          </p>
                        </div>
                      ) : null}

                      {/* Audio Playback Button if audio is available */}
                      {audioUrl && (
                        <div className="bg-white rounded-xl p-2 border border-gray-200 flex items-center justify-between">
                          <button
                            onClick={() => togglePlayAudio(audioUrl)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#006304] hover:text-[#005103] bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>
                              {isPlaying
                                ? (language === 'en' ? 'Pause' : 'إيقاف مؤقت')
                                : (language === 'en' ? 'Listen to Recording' : 'استماع للتسجيل المعتمد')}
                            </span>
                          </button>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {language === 'en' ? 'Audio File' : 'ملف صوتي'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Account Actions & Sign Out Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>{language === 'en' ? 'Account & Session Management' : 'إدارة الحساب والجلسة'}</span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>{language === 'en' ? 'Sign Out of Account' : 'تسجيل الخروج من الحساب'}</span>
        </button>
      </div>

      {/* Cloud Account & User Session Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <CloudCheck className="w-4 h-4 text-[#006304]" />
            <span>{language === 'en' ? 'Cloud Backup & Sync' : 'حفظ السحابة والمزامنة (Supabase)'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0F9F0] text-[#006304] border border-[#006304]/30">
            {language === 'en' ? 'Active & Synced' : 'حساب نشط ومزامن'}
          </span>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
          {language === 'en' ? (
            <>
              Logged in as: <strong className="text-slate-800 dir-ltr inline-block">{user.email || session?.user?.email || supabaseAuthUser?.email || 'Active Account'}</strong>. All progress and circle records are safely synchronized in the cloud.
            </>
          ) : (
            <>
              تم تسجيل الدخول بالبريد الإلكتروني: <strong className="text-slate-800 dir-ltr inline-block">{user.email || session?.user?.email || supabaseAuthUser?.email || 'حساب مفعل'}</strong>. يتم حفظ كافة الإنجازات وسجلات الحلقات تلقائياً في قاعدة البيانات السحابية.
            </>
          )}
        </p>
      </div>

      {/* Streak Calendar Widget */}
      <StreakWidget />

      {/* Avatar Customization Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 text-[#006304] font-bold text-xs border-b border-gray-100 pb-2">
          <UserCheck className="w-4 h-4 text-[#006304]" />
          <span>{language === 'en' ? 'Customize Quran Student Avatar' : 'تخصيص شخصية طالب القرآن (Avatar)'}</span>
        </div>

        {/* 1. Base Character */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 block">
            {language === 'en' ? '1. Main Character Appearance:' : '1. مظهر الشخصية الرئيسي:'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hafiz', title: language === 'en' ? 'Seeker' : 'طالب العلم', icon: '👨‍🎓' },
              { id: 'hafiza', title: language === 'en' ? 'Female Seeker' : 'طالبة العلم', icon: '👩‍🎓' },
              { id: 'scholar', title: language === 'en' ? 'Dignified Hafiz' : 'الحافظ الوقور', icon: '🧓' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateUserProfile({ avatarStyle: item.id as AvatarStyle })}
                className={`p-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  currentAvatarStyle === item.id
                    ? 'bg-[#F0F9F0] border-[#006304] text-[#006304] font-bold shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl block mb-0.5">{item.icon}</span>
                <span className="text-[11px] block">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Outfit Color */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-[#006304]" />
            <span>{language === 'en' ? '2. Robe & Outfit Color:' : '2. لون الكسوة والرداء:'}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'green', title: language === 'en' ? 'Emerald Green' : 'الأخضر الزمردي', bg: 'bg-[#006304]', text: 'text-[#006304]' },
              { id: 'gold', title: language === 'en' ? 'Noble Gold' : 'الذهبي الشريف', bg: 'bg-[#C79545]', text: 'text-[#C79545]' },
              { id: 'navy', title: language === 'en' ? 'Dignified Navy' : 'الكحلي الوقور', bg: 'bg-[#1E293B]', text: 'text-[#1E293B]' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateUserProfile({ outfitColor: item.id as OutfitColor })}
                className={`p-2 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentOutfitColor === item.id
                    ? 'bg-[#FFF8E7] border-[#F9BF3B] font-bold shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${item.bg} border border-white shadow-2xs`} />
                <span className="text-[10px] font-bold">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Bag Style */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-[#006304]" />
            <span>{language === 'en' ? '3. Scholar Bag:' : '3. حقيبة طالب العلم:'}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'satchel', title: language === 'en' ? 'Mushaf Satchel' : 'حقيبة المصحف', icon: '💼' },
              { id: 'backpack', title: language === 'en' ? 'Student Backpack' : 'حقيبة الطالب', icon: '🎒' },
              { id: 'none', title: language === 'en' ? 'No Bag' : 'بدون حقيبة', icon: '🚫' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateUserProfile({ bagStyle: item.id as BagStyle })}
                className={`p-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  currentBagStyle === item.id
                    ? 'bg-[#F0F9F0] border-[#006304] text-[#006304] font-bold shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <span className="text-base block">{item.icon}</span>
                <span className="text-[10px] block font-bold">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Accessory */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#006304]" />
            <span>{language === 'en' ? '4. Aesthetic Accessory:' : '4. عنصر تجميلي بسيط:'}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'quran', title: language === 'en' ? 'Noble Mushaf' : 'المصحف الشريف', icon: '📖' },
              { id: 'seedling', title: language === 'en' ? 'Rose Seedling' : 'غرسة ورد', icon: '🌿' },
              { id: 'glasses', title: language === 'en' ? 'Contemplation Glasses' : 'نظارة التدبر', icon: '👓' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateUserProfile({ accessoryStyle: item.id as AccessoryStyle })}
                className={`p-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  currentAccessoryStyle === item.id
                    ? 'bg-[#FFF8E7] border-[#F9BF3B] text-[#C79545] font-bold shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <span className="text-base block">{item.icon}</span>
                <span className="text-[10px] block font-bold">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Display Name */}
      <form onSubmit={handleSaveName} className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          {language === 'en' ? 'Edit Display Name:' : 'تعديل الاسم الشخصي:'}
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
            required
          />
          <button
            type="submit"
            className="bg-[#006304] text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-[#005103] transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Save' : 'حفظ'}
          </button>
        </div>

        {savedNotice && (
          <p className="text-[11px] text-[#006304] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#006304]" />
            <span>{language === 'en' ? 'New name saved successfully' : 'تم حفظ الاسم الجديد بنجاح'}</span>
          </p>
        )}
      </form>

      {/* Companion Selector */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          {language === 'en' ? 'Current Journey Companion:' : 'رفيق الرحلة الحالي:'}
        </span>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'ward_seedling', name: language === 'en' ? 'Seedling' : 'شتلة ورد', avatar: '🌱' },
            { id: 'ward_falcon', name: language === 'en' ? 'Falcon' : 'صقر ورد', avatar: '🦅' },
            { id: 'ward_dove', name: language === 'en' ? 'Peace Dove' : 'حمامة السلام', avatar: '🕊️' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => updateUserProfile({ companion: c.id as any })}
              className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                user.companion === c.id
                  ? 'bg-[#F0F9F0] border-[#006304] text-[#006304] font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <span className="text-xl block mb-0.5">{c.avatar}</span>
              <span className="text-[11px] font-bold block">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-[#FFF8E7] border border-[#F9BF3B] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-1.5 text-[#C79545] font-bold text-xs">
          <Sparkles className="w-4 h-4 text-[#C79545]" />
          <span>{language === 'en' ? 'Quick Demo Tools' : 'أدوات التجربة السريعة'}</span>
        </div>

        <p className="text-[11px] text-gray-600 font-medium">
          {language === 'en'
            ? 'Load sample progress to preview unlocked weeks and badges, or reset your journey.'
            : 'يمكنك تحميل تقدم نموذجي لتجربة فتح الأسابيع والأوسمة، أو إعادة الضبط.'}
        </p>

        {resetSuccessNotice && (
          <div className="bg-emerald-50 border border-emerald-500/30 text-emerald-800 text-xs rounded-xl p-2.5 text-center font-bold animate-in fade-in">
            {language === 'en'
              ? '✓ Your journey progress was completely reset successfully!'
              : '✓ تمت إعادة ضبط مسار رحلتك بالكامل وتصفير المهام بنجاح!'}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={loadSampleProgress}
            className="flex-1 bg-[#006304] text-white font-bold py-2.5 px-3 rounded-xl text-xs hover:bg-[#005103] transition-colors shadow-2xs cursor-pointer"
          >
            {language === 'en' ? 'Load Sample Progress' : 'تحميل تقدم تجريبي'}
          </button>

          <button
            disabled={isResettingProgress}
            onClick={async () => {
              setIsResettingProgress(true);
              try {
                if (profileAudioRef.current) {
                  profileAudioRef.current.pause();
                }
                setPlayingAudioUrl(null);
                setStudentRecitations([]);
                await resetProgress();
                setResetSuccessNotice(true);
                setTimeout(() => setResetSuccessNotice(false), 4000);
              } catch (err) {
                console.error('Reset error:', err);
              } finally {
                setIsResettingProgress(false);
              }
            }}
            className="bg-rose-100 text-rose-800 font-bold py-2.5 px-3 rounded-xl text-xs hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResettingProgress ? 'animate-spin' : ''}`} />
            <span>
              {isResettingProgress
                ? (language === 'en' ? 'Resetting...' : 'جاري الضبط...')
                : (language === 'en' ? 'Reset' : 'إعادة ضبط')}
            </span>
          </button>
        </div>
      </div>

      {/* About Ward Club */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs text-center space-y-1">
        <h4 className="font-heading font-bold text-xs text-[#006304]">
          {language === 'en' ? 'Ward Quran Memorization Club' : 'نادي ورد لتحفيظ القرآن الكريم'}
        </h4>
        <p className="text-[11px] text-gray-500 font-medium">
          {language === 'en'
            ? 'An inspiring spiritual and educational journey to master the Book of Allah.'
            : 'رحلة علمية وإيمانية محفزة للارتقاء بحفظ كتاب الله تعالى.'}
        </p>
      </div>

      {/* Change Circle Modal */}
      {isChangeCircleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#006304]" />
                <h3 className="font-heading font-black text-sm text-slate-900">
                  {language === 'en' ? 'Request Quran Circle Change' : 'طلب تغيير الحلقة القرآنية'}
                </h3>
              </div>
              <button
                onClick={() => setIsChangeCircleModalOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Important Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{language === 'en' ? 'Important Notice' : 'تنبيه هام'}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                {language === 'en'
                  ? 'A request will be sent to the teacher for approval. The circle will only change after the teacher approves.'
                  : 'سيتم إرسال طلب تغيير الحلقة إلى المعلم للموافقة. لن يتم تغيير الحلقة إلا بعد موافقة المعلم.'}
              </p>
            </div>

            {/* New Circle Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                {language === 'en' ? 'Select New Circle:' : 'اختر الحلقة الجديدة المطلوبة:'}
              </label>
              <div className="relative">
                <select
                  value={requestedNewCircleCode}
                  onChange={e => setRequestedNewCircleCode(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-200 text-slate-900 font-bold text-xs rounded-xl py-2.5 px-3 pr-8 focus:outline-hidden focus:border-[#006304] transition-all cursor-pointer"
                >
                  <option value="">{language === 'en' ? '-- Select a circle --' : '-- اختر حلقة --'}</option>
                  {availableCircles
                    .filter(c => c.id !== userCircle?.id && c.id !== user.circleId)
                    .map(c => (
                      <option key={c.id} value={c.code || c.id}>
                        {c.name} ({language === 'en' ? 'Teacher:' : 'المعلم:'} {c.teacherName})
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={circleActionLoading || !requestedNewCircleCode}
                onClick={handleSendChangeCircleRequest}
                className="flex-1 bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {circleActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {circleActionLoading
                    ? (language === 'en' ? 'Sending...' : 'جاري الإرسال...')
                    : (language === 'en' ? 'Send Request' : 'إرسال طلب التغيير')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangeCircleModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Confirmation Modal Before Changing Track */}
      {showTrackChangeWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-center animate-in fade-in zoom-in-95 duration-150 font-arabic">
            <div className="w-14 h-14 rounded-2xl bg-[#F0F9F0] text-[#006304] border border-[#006304]/20 flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-black text-base text-slate-900">
                {language === 'en' ? 'Notice Before Changing Track' : 'تنبيه قبل تغيير المسار'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'en'
                  ? 'Changing the track will reset your journey map to match the new curriculum, while keeping all your points and previous recitations safe.'
                  : 'تغيير المسار سيعيد ضبط خريطة الرحلة لتتوافق مع المنهج الجديد، مع الاحتفاظ بجميع نقاطك وتسميعاتك السابقة.'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowTrackChangeWarning(false);
                  setIsTrackModalOpen(true);
                }}
                className="flex-1 bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                {language === 'en' ? 'Yes, Continue' : 'نعم، المتابعة'}
              </button>

              <button
                type="button"
                onClick={() => setShowTrackChangeWarning(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Selection Modal */}
      <TrackSelectionModal
        isOpen={isTrackModalOpen}
        currentTrack={user.track}
        onClose={() => setIsTrackModalOpen(false)}
        onSelectTrack={async (newTrack) => {
          await setTrack(newTrack);
          setIsTrackModalOpen(false);
          setTrackChangeSuccessNotice(true);
          setTimeout(() => setTrackChangeSuccessNotice(false), 4000);
        }}
      />
    </div>
  );
};

