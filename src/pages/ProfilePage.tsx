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
} from 'lucide-react';
import { AvatarStyle, OutfitColor, BagStyle, AccessoryStyle, UserRole, UserGender, Circle, NodeSubmission } from '../types';
import { getAvailableCircles, getProfile, getStudentSubmissions } from '../services/supabaseService';

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
  } = useSupabase();

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

  const handleSendChangeCircleRequest = () => {
    setIsChangeCircleModalOpen(false);
    setChangeCircleSuccessNotice(true);
    setTimeout(() => {
      setChangeCircleSuccessNotice(false);
    }, 6000);
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
            {user.displayName || user.name || (isTeacher ? 'فضيلة المعلم' : 'قارئ ورد')}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xs text-[#006304] font-bold bg-[#F0F9F0] px-3 py-0.5 rounded-full border border-[#006304]">
              {isTeacher ? '👨‍🏫 معلم حلقة قرآنية' : '🌱 طالب في رحلة وِرد القرآن'}
            </span>
            <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {user.gender === 'female' ? '👧 إناث' : '👦 ذكور'}
            </span>
          </div>
        </div>

        {/* Stats Row (Hidden XP for teachers) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          {!isTeacher ? (
            <div className="bg-[#F0F9F0] p-2.5 rounded-2xl border border-[#006304]/20">
              <span className="text-[10px] text-gray-600 font-bold block">نقاط XP</span>
              <span className="font-num font-extrabold text-[#006304] text-sm">{user.xp} XP</span>
            </div>
          ) : (
            <div className="bg-[#F0F9F0] p-2.5 rounded-2xl border border-[#006304]/20">
              <span className="text-[10px] text-gray-600 font-bold block">نوع الحساب</span>
              <span className="font-extrabold text-[#006304] text-xs">معلم معتمد</span>
            </div>
          )}
          <div className="bg-[#FFF8E7] p-2.5 rounded-2xl border border-[#F9BF3B]/30">
            <span className="text-[10px] text-[#C79545] font-bold block">
              {isTeacher ? 'الدور' : 'أطول سلسلة'}
            </span>
            <span className="font-num font-extrabold text-[#C79545] text-sm">
              {isTeacher ? 'معلم ومحفّظ' : `🏆 ${user.longestStreak || user.streak} يوماً`}
            </span>
          </div>
        </div>
      </div>

      {/* Role & Circle Details Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <Building className="w-4 h-4 text-[#006304]" />
            <span>بيانات الحساب والحلقة القرآنية</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshingAll}
              className="text-[11px] font-bold text-gray-600 hover:text-[#006304] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="تحديث بيانات الملف والحلقة"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <span className="text-[10px] font-bold bg-emerald-50 text-[#006304] px-2 py-0.5 rounded-full border border-emerald-200">
              {isTeacher ? 'معلم' : 'طالب'}
            </span>
          </div>
        </div>

        {/* Read-Only Gender Display (Cannot be changed by student) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 block">
            الجنس المحدد للحساب:
          </label>
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="text-base">{user.gender === 'female' ? '👧' : '👦'}</span>
              <span>{user.gender === 'female' ? 'أنثى (حلقات البنات)' : 'ذكر (حلقات البنين)'}</span>
            </div>
            <span className="text-[10px] font-bold bg-gray-200/70 text-gray-600 px-2 py-0.5 rounded-md">
              ثابت للقراءة فقط
            </span>
          </div>
        </div>

        {/* Change Circle Request Notification Banner */}
        {changeCircleSuccessNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-[#006304] flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-0.5">
              <p>تم إرسال طلب تغيير الحلقة إلى المعلم.</p>
              <p className="text-[11px] font-medium text-emerald-800">سيتم إعلامك وتحديث حلقتك فور اعتماد المعلم للطلب.</p>
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
                      <span className="text-[10px] font-bold text-gray-500 block">حلقتك الحالية:</span>
                      <h4 className="text-xs font-black text-[#006304]">
                        {userCircle?.name || user.circleName || 'حلقة القرآن'}
                      </h4>
                    </div>
                  </div>

                  {/* Change Circle Button */}
                  <button
                    onClick={() => setIsChangeCircleModalOpen(true)}
                    className="bg-white hover:bg-emerald-50 text-[#006304] border border-[#006304]/30 hover:border-[#006304] font-bold px-2.5 py-1.5 rounded-xl text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    title="طلب تغيير الحلقة"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>تغيير الحلقة</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-[#006304]/10">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">المعلم:</span>
                    <span className="font-black text-[#006304]">
                      {isTeacherInfoLoading ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>جاري التحقق...</span>
                        </span>
                      ) : (
                        teacherDisplayName || userCircle?.teacherName || user.teacherName || 'معلم الحلقة'
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
                  <span>الانضمام إلى حلقة قرآنية:</span>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">
                  اختر حلقة معتمدة من القائمة أدناه أو أدخل رمز الحلقة المباشر للربط مع معلمك:
                </p>

                {/* 1. Dropdown / Selection from Available Circles */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <span>1. الحلقات المتاحة ({user.gender === 'female' ? 'للبنات' : 'للبنين'}):</span>
                    <button
                      onClick={() => loadCircles(user.gender)}
                      className="text-[#006304] hover:underline flex items-center gap-1 text-[10px]"
                      title="تحديث قائمة الحلقات"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingCircles ? 'animate-spin' : ''}`} />
                      <span>تحديث</span>
                    </button>
                  </div>

                  {loadingCircles ? (
                    <div className="text-center py-2 text-xs text-gray-500 font-bold">
                      جاري تحميل الحلقات المتاحة...
                    </div>
                  ) : availableCircles.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={selectedCircleCode}
                          onChange={e => setSelectedCircleCode(e.target.value)}
                          className="w-full appearance-none bg-white border border-gray-300 hover:border-[#006304] text-slate-900 font-bold text-xs rounded-xl py-2 px-3 pr-8 shadow-2xs focus:outline-hidden focus:border-[#006304] transition-all cursor-pointer"
                        >
                          <option value="">-- اختر حلقة قرآنية --</option>
                          {availableCircles.map(c => (
                            <option key={c.id} value={c.code || c.id}>
                              {c.name} (المعلم: {c.teacherName}) - {c.code}
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
                          <span>تأكيد الانضمام للحلقة المختارة</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center text-xs text-gray-500">
                      لا توجد حلقات معتمدة متاحة حالياً لهذا الجنس. يمكنك إدخال الرمز المباشر أدناه:
                    </div>
                  )}
                </div>

                {/* 2. Manual Join Code */}
                <form onSubmit={handleJoinByCustomCode} className="space-y-2 pt-1 border-t border-amber-200/60">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    2. أو أدخل رمز الحلقة المباشر:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCodeInput}
                      onChange={e => setCustomCodeInput(e.target.value.toUpperCase())}
                      placeholder="مثال: WRD-101"
                      className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs font-bold text-slate-900 tracking-wider dir-ltr uppercase focus:outline-hidden focus:border-[#006304]"
                    />
                    <button
                      type="submit"
                      disabled={circleActionLoading || !customCodeInput.trim()}
                      className="bg-[#006304] hover:bg-[#005103] disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>انضمام</span>
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
              <span>الانتقال إلى لوحة تحكم المعلم والحلقات</span>
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
              <span>سجل التسميع وملاحظات المعلم</span>
            </div>
            <button
              onClick={fetchRecitations}
              disabled={loadingRecitations}
              className="text-[11px] font-bold text-[#006304] hover:text-[#005103] bg-[#F0F9F0] px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="تحديث سجل التسميع"
            >
              <RefreshCw className={`w-3 h-3 ${loadingRecitations ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
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
                  <p className="text-xs text-gray-500 font-bold">جاري تحميل سجل التسميع والتقييمات...</p>
                </div>
              );
            }

            if (subsList.length === 0) {
              return (
                <div className="bg-[#F0F9F0]/60 rounded-xl p-4 text-center space-y-2 border border-emerald-100">
                  <Mic className="w-6 h-6 text-[#006304] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-700">لا توجد تسجيلات تسميع مرسلة بعد</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    عند إتمام مهام التسميع الأسبوعية في خطة الحفظ وإرسالها، ستظهر تقييمات وتوجيهات معلمك هنا.
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
                  const rating = sub.rating || (isApproved ? 'ممتاز 🌟' : isNeedsPractice ? 'يحتاج تدريب 🔄' : 'قيد المراجعة');
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
                              {sub.nodeTitle || `تسميع المهمة ${sub.nodeId || ''}`}
                            </h4>
                            {weekNum && (
                              <span className="text-[10px] text-gray-500 font-bold block">
                                الأسبوع {weekNum}
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
                            {isApproved ? 'معتمد ✓' : isNeedsPractice ? 'توجيه تدريب 🔄' : 'قيد المراجعة ⏳'}
                          </span>
                        </div>
                      </div>

                      {/* Rating and Details */}
                      <div className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-600 font-bold text-[11px]">
                          <span>التقدير:</span>
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
                            <span>{new Date(sub.reviewedAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        ) : sub.submittedAt ? (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(sub.submittedAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Teacher Notes Block */}
                      {notes ? (
                        <div className="bg-white rounded-xl p-3 border border-emerald-200/80 space-y-1 text-right shadow-2xs">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <MessageSquare className="w-3.5 h-3.5 text-[#006304]" />
                            <span>ملاحظات وتوجيهات المعلم:</span>
                          </div>
                          <p className="text-xs text-slate-800 font-bold leading-relaxed bg-[#F0F9F0] p-2.5 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                            "{notes.trim()}"
                          </p>
                        </div>
                      ) : isApproved ? (
                        <div className="bg-white rounded-xl p-2.5 border border-emerald-100 text-right">
                          <p className="text-[11px] text-emerald-800 font-bold">
                            "تلاوة مباركة ومتقنة، أحسنت وبارك الله فيك."
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
                            <span>{isPlaying ? 'إيقاف مؤقت' : 'استماع للتسجيل المعتمد'}</span>
                          </button>
                          <span className="text-[10px] text-gray-500 font-bold">ملف صوتي</span>
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
            <span>إدارة الحساب والجلسة</span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      </div>

      {/* Cloud Account & User Session Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <CloudCheck className="w-4 h-4 text-[#006304]" />
            <span>حفظ السحابة والمزامنة (Supabase)</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0F9F0] text-[#006304] border border-[#006304]/30">
            حساب نشط ومزامن
          </span>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
          تم تسجيل الدخول بالبريد الإلكتروني: <strong className="text-slate-800 dir-ltr inline-block">{user.email || session?.user?.email || supabaseAuthUser?.email || 'حساب مفعل'}</strong>. يتم حفظ كافة الإنجازات وسجلات الحلقات تلقائياً في قاعدة البيانات السحابية.
        </p>
      </div>

      {/* Streak Calendar Widget */}
      <StreakWidget />

      {/* Avatar Customization Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 text-[#006304] font-bold text-xs border-b border-gray-100 pb-2">
          <UserCheck className="w-4 h-4 text-[#006304]" />
          <span>تخصيص شخصية طالب القرآن (Avatar)</span>
        </div>

        {/* 1. Base Character */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-600 block">
            1. مظهر الشخصية الرئيسي:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hafiz', title: 'طالب العلم', icon: '👨‍🎓' },
              { id: 'hafiza', title: 'طالبة العلم', icon: '👩‍🎓' },
              { id: 'scholar', title: 'الحافظ الوقور', icon: '🧓' },
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
            <span>2. لون الكسوة والرداء:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'green', title: 'الأخضر الزمردي', bg: 'bg-[#006304]', text: 'text-[#006304]' },
              { id: 'gold', title: 'الذهبي الشريف', bg: 'bg-[#C79545]', text: 'text-[#C79545]' },
              { id: 'navy', title: 'الكحلي الوقور', bg: 'bg-[#1E293B]', text: 'text-[#1E293B]' },
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
            <span>3. حقيبة طالب العلم:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'satchel', title: 'حقيبة المصحف', icon: '💼' },
              { id: 'backpack', title: 'حقيبة الطالب', icon: '🎒' },
              { id: 'none', title: 'بدون حقيبة', icon: '🚫' },
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
            <span>4. عنصر تجميلي بسيط:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'quran', title: 'المصحف الشريف', icon: '📖' },
              { id: 'seedling', title: 'غرسة ورد', icon: '🌿' },
              { id: 'glasses', title: 'نظارة التدبر', icon: '👓' },
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
          تعديل الاسم الشخصي:
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
            حفظ
          </button>
        </div>

        {savedNotice && (
          <p className="text-[11px] text-[#006304] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#006304]" />
            <span>تم حفظ الاسم الجديد بنجاح</span>
          </p>
        )}
      </form>

      {/* Companion Selector */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          رفيق الرحلة الحالي:
        </span>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'ward_seedling', name: 'شتلة ورد', avatar: '🌱' },
            { id: 'ward_falcon', name: 'صقر ورد', avatar: '🦅' },
            { id: 'ward_dove', name: 'حمامة السلام', avatar: '🕊️' },
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
          <span>أدوات التجربة السريعة</span>
        </div>

        <p className="text-[11px] text-gray-600 font-medium">
          يمكنك تحميل تقدم نموذجي لتجربة فتح الأسابيع والأوسمة، أو إعادة الضبط.
        </p>

        {resetSuccessNotice && (
          <div className="bg-emerald-50 border border-emerald-500/30 text-emerald-800 text-xs rounded-xl p-2.5 text-center font-bold animate-in fade-in">
            ✓ تمت إعادة ضبط مسار رحلتك بالكامل وتصفير المهام بنجاح!
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={loadSampleProgress}
            className="flex-1 bg-[#006304] text-white font-bold py-2.5 px-3 rounded-xl text-xs hover:bg-[#005103] transition-colors shadow-2xs cursor-pointer"
          >
            تحميل تقدم تجريبي
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
            <span>{isResettingProgress ? 'جاري الضبط...' : 'إعادة ضبط'}</span>
          </button>
        </div>
      </div>

      {/* About Ward Club */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl p-4 shadow-2xs text-center space-y-1">
        <h4 className="font-heading font-bold text-xs text-[#006304]">
          نادي ورد لتحفيظ القرآن الكريم
        </h4>
        <p className="text-[11px] text-gray-500 font-medium">
          رحلة علمية وإيمانية محفزة للارتقاء بحفظ كتاب الله تعالى.
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
                  طلب تغيير الحلقة القرآنية
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
                <span>تنبيه هام</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                سيتم إرسال طلب تغيير الحلقة إلى المعلم للموافقة. لن يتم تغيير الحلقة إلا بعد موافقة المعلم.
              </p>
            </div>

            {/* New Circle Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                اختر الحلقة الجديدة المطلوبة:
              </label>
              <div className="relative">
                <select
                  value={requestedNewCircleCode}
                  onChange={e => setRequestedNewCircleCode(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-200 text-slate-900 font-bold text-xs rounded-xl py-2.5 px-3 pr-8 focus:outline-hidden focus:border-[#006304] transition-all cursor-pointer"
                >
                  <option value="">-- اختر حلقة --</option>
                  {availableCircles
                    .filter(c => c.id !== userCircle?.id && c.id !== user.circleId)
                    .map(c => (
                      <option key={c.id} value={c.code || c.id}>
                        {c.name} (المعلم: {c.teacherName})
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
                onClick={handleSendChangeCircleRequest}
                className="flex-1 bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال طلب التغيير</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangeCircleModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

