import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { AvatarDisplay } from '../components/Avatar/AvatarDisplay';
import { Circle, UserProfile, NodeSubmission } from '../types';
import { getTeacherDashboardData } from '../services/supabaseService';
import { getAllTracksWeeks } from '../data/quranJourneyData';
import { generateRandomExamQuestions, ExamQuestion } from '../utils/quranExamHelper';

// Helper to resolve comprehensive task & surahs details for any submission
export const getSubmissionTaskDetails = (sub: NodeSubmission) => {
  const allWeeks = getAllTracksWeeks();
  let matchedWeek = allWeeks.find(w => w.nodes.some(n => n.id === sub.nodeId));
  let matchedNode = matchedWeek?.nodes.find(n => n.id === sub.nodeId);

  if (!matchedWeek && sub.nodeId) {
    const isTrack2 = sub.nodeId.startsWith('t2_');
    const m = sub.nodeId.match(/w(\d+)/i);
    if (m) {
      const wNum = parseInt(m[1], 10);
      matchedWeek = allWeeks.find(w => (isTrack2 ? w.trackId === 'juz_amma_tabarak' : w.trackId !== 'juz_amma_tabarak') && (w.id === wNum || w.weekNumber === wNum));
      matchedNode = matchedWeek?.nodes.find(n => n.id === sub.nodeId) || matchedWeek?.nodes.find(n => n.type === 'recite');
    }
  }

  if (!matchedWeek && sub.weekId) {
    matchedWeek = allWeeks.find(w => w.id === sub.weekId);
    matchedNode = matchedWeek?.nodes.find(n => n.id === sub.nodeId) || matchedWeek?.nodes.find(n => n.type === 'recite');
  }

  const weekNumber = matchedWeek?.weekNumber || matchedWeek?.id || sub.weekId || 1;
  const weekTitle = sub.weekTitle || matchedWeek?.title || `الأسبوع ${weekNumber}`;
  const nodeTitle = sub.nodeTitle && sub.nodeTitle !== 'تسميع السور المقررة' && sub.nodeTitle !== 'تسميع المقرّر'
    ? sub.nodeTitle
    : (matchedNode?.title || 'تسميع واعتماد');

  const surahsList = (sub.surahsList && sub.surahsList.length > 0)
    ? sub.surahsList
    : (matchedNode?.surahsList && matchedNode.surahsList.length > 0)
    ? matchedNode.surahsList
    : (matchedWeek?.surahs && matchedWeek.surahs.length > 0)
    ? matchedWeek.surahs
    : [];

  const surahName = sub.surahName || matchedNode?.surahName || (surahsList.length > 0 ? surahsList.join('، ') : '');
  const description = sub.nodeDescription || matchedNode?.description || (surahsList.length > 0 ? `سجّل تلاوتك لجميع سور الأسبوع (${surahsList.join('، ')}) غيباً للتأكد من سلامة الحفظ وضبط مخارج الحروف وأحكام التجويد.` : 'تسميع وتلاوة السور المقررة وضبط أحكام التجويد.');

  return {
    weekNumber,
    weekTitle,
    nodeTitle,
    surahsList,
    surahName,
    description,
  };
};

export const formatArabicDate = (dateStr?: string) => {
  if (!dateStr) return 'غير محدد';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};
import {
  Users,
  Copy,
  Check,
  Share2,
  Building,
  GraduationCap,
  Sparkles,
  Trophy,
  Flame,
  Star,
  BookOpen,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Settings,
  ChevronLeft,
  UserCheck,
  Award,
  RefreshCw,
  ExternalLink,
  Shield,
  MessageSquare,
  Mic,
  Play,
  Pause,
  Volume2,
  X,
  FileText,
  UserX,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    user,
    profile,
    userCircle,
    circleStudents,
    teacherCircles,
    teacherSubmissions,
    fetchTeacherSubmissions,
    reviewStudentSubmission,
    markStudentAbsent,
    createTeacherCircle,
    refreshCircleData,
    activeTab,
    setActiveTab,
  } = useSupabase();

  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingCircles, setIsLoadingCircles] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<UserProfile | null>(null);
  const [reviewModalSubmission, setReviewModalSubmission] = useState<NodeSubmission | null>(null);
  const [directCircles, setDirectCircles] = useState<Circle[]>([]);
  const [directStudents, setDirectStudents] = useState<UserProfile[]>([]);
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [ratingState, setRatingState] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [submissionsFilter, setSubmissionsFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [halaqahSection, setHalaqahSection] = useState<'recording' | 'halaqah'>('recording');
  const [inHalaqahFilter, setInHalaqahFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [openPracticeNoteId, setOpenPracticeNoteId] = useState<string | null>(null);
  const [inHalaqahNotes, setInHalaqahNotes] = useState<Record<string, string>>({});
  const [absentConfirmId, setAbsentConfirmId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);

  // Helper to resolve the real student display name accurately from circle or direct students
  const getStudentDisplayName = (sub: { studentId?: string; studentName?: string }) => {
    if (sub.studentId) {
      const allStudents = [...circleStudents, ...directStudents];
      const found = allStudents.find(
        s => s.id === sub.studentId || (s.id && sub.studentId && (s.id.startsWith(sub.studentId) || sub.studentId.startsWith(s.id)))
      );
      if (found?.displayName?.trim() && found.displayName.trim() !== 'طالب قرآن' && found.displayName.trim() !== 'طالب') {
        return found.displayName.trim();
      }
      if (found?.name?.trim() && found.name.trim() !== 'طالب قرآن' && found.name.trim() !== 'طالب') {
        return found.name.trim();
      }
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(`ward_student_name_${sub.studentId}`);
        if (cached && cached.trim() && cached.trim() !== 'طالب قرآن' && cached.trim() !== 'طالب') {
          return cached.trim();
        }
      }
    }
    if (sub.studentName && sub.studentName !== 'طالب قرآن' && sub.studentName !== 'طالب' && sub.studentName.trim()) {
      return sub.studentName.trim();
    }
    return 'طالب';
  };

  // Dynamically resolve and load profiles of any submitting students not already in the active list
  useEffect(() => {
    if (teacherSubmissions && teacherSubmissions.length > 0) {
      const knownIds = new Set([...circleStudents.map(s => s.id), ...directStudents.map(s => s.id)]);
      const unknownIds: string[] = Array.from(new Set(
        teacherSubmissions
          .map(s => s.studentId)
          .filter((id): id is string => !!id && !knownIds.has(id))
      ));
      if (unknownIds.length > 0) {
        import('../services/supabaseService').then(({ getStudentProfilesByIds }) => {
          getStudentProfilesByIds(unknownIds).then(profs => {
            if (profs && profs.length > 0) {
              setDirectStudents(prev => {
                const existing = new Set(prev.map(p => p.id));
                const newOnes = profs.filter(p => !existing.has(p.id));
                return [...prev, ...newOnes];
              });
            }
          });
        });
      }
    }
  }, [teacherSubmissions, circleStudents, directStudents]);

  // When review modal opens for a gate exam, generate 4 random questions
  useEffect(() => {
    if (reviewModalSubmission) {
      const isGate = reviewModalSubmission.nodeId?.includes('gate') || reviewModalSubmission.nodeTitle?.includes('بوابة');
      if (isGate) {
        const details = getSubmissionTaskDetails(reviewModalSubmission);
        setExamQuestions(generateRandomExamQuestions(details.surahsList));
      } else {
        setExamQuestions([]);
      }
    }
  }, [reviewModalSubmission]);

  // Fast single-roundtrip data fetching
  const fetchData = async (bypassCache = false) => {
    const teacherId = profile?.id || user.id;
    if (!teacherId) return;

    if (directCircles.length === 0 && teacherCircles.length === 0) {
      setIsLoadingCircles(true);
    }

    try {
      console.log('⚡ [TeacherDashboard.fetchData] Fast fetching all dashboard data...');
      const data = await getTeacherDashboardData(teacherId, bypassCache);
      
      if (data.circles && data.circles.length > 0) {
        setDirectCircles(data.circles);
        setDirectStudents((data.students || []).map(s => ({
          ...s,
          displayName: s.name || (s as any).displayName || 'طالب',
        } as UserProfile)));
      }
    } catch (err) {
      console.error('❌ [TeacherDashboard.fetchData] Error:', err);
    } finally {
      setIsLoadingCircles(false);
    }
  };

  // Automatically fetch teacher circle data and submissions on mount or when profile changes
  useEffect(() => {
    fetchData();
    if (profile?.id || user.id) {
      fetchTeacherSubmissions();
    }
  }, [profile?.id, user.id, profile?.circle_id]);

  // Copy circle join code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRefresh = async () => {
    console.log('🔄 [TeacherDashboard] Manual refresh clicked by teacher:', profile?.id || user.id);
    setIsRefreshing(true);
    await Promise.all([
      fetchData(true),
      refreshCircleData(),
      fetchTeacherSubmissions(),
    ]);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleOpenReviewModal = (sub: NodeSubmission) => {
    const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
    if (notesState[subKey] === undefined) {
      setNotesState(prev => ({
        ...prev,
        [subKey]: sub.teacherNotes || '',
      }));
    }
    if (ratingState[subKey] === undefined && sub.rating) {
      setRatingState(prev => ({
        ...prev,
        [subKey]: sub.rating,
      }));
    }
    setReviewModalSubmission(sub);
  };

  const handleReview = async (
    sub: NodeSubmission,
    status: 'approved' | 'reviewed',
    defaultRating?: string
  ) => {
    const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
    setReviewingId(subKey);
    const isGate = sub.nodeId?.includes('gate') || sub.nodeTitle?.includes('بوابة');
    const teacherNotes = (notesState[subKey] !== undefined ? notesState[subKey] : (sub.teacherNotes || '')).trim();
    const rating = ratingState[subKey] || sub.rating || defaultRating || (
      isGate
        ? (status === 'approved' ? 'مجتاز بنجاح 🏆' : 'إعادة وتدريب 🔄')
        : (status === 'approved' ? 'ممتاز 🌟' : 'يحتاج تدريب 🔄')
    );
    const xpReward = isGate ? (status === 'approved' ? 50 : 15) : (status === 'approved' ? 25 : 10);
    try {
      await reviewStudentSubmission(
        sub.studentId,
        sub.nodeId,
        status,
        teacherNotes,
        rating,
        xpReward,
        sub.weekId || 1,
        sub.id
      );
      await fetchTeacherSubmissions();
      setReviewModalSubmission(null);
      if (status === 'approved') {
        const studentName = getStudentDisplayName(sub);
        const msg = isGate
          ? `تم اعتماد اجتياز بوابة الأسبوع للطالب ${studentName} بنجاح، وفُتح له الأسبوع القادم (+50 XP)! 🏆`
          : `تم اعتماد تسميع الطالب ${studentName} بنجاح وإضافة 25 نقطة لإنجازه`;
        setActionSuccessMsg(msg);
        setTimeout(() => setActionSuccessMsg(null), 4500);
      }
    } catch (err) {
      console.error('Error reviewing submission:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const handleMarkAbsent = async (sub: NodeSubmission) => {
    const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
    setReviewingId(subKey);
    try {
      const res = await markStudentAbsent(sub.studentId, sub.nodeId, sub.id);
      if (res?.success) {
        await fetchTeacherSubmissions();
        setAbsentConfirmId(null);
        setActionSuccessMsg(`تم تسجيل غياب الطالب ${getStudentDisplayName(sub)} بنجاح، ويمكنه التسميع لاحقاً`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(res?.message || 'حدث خطأ أثناء تسجيل الغياب');
      }
    } catch (err) {
      console.error('Error marking student absent:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const handleApproveInHalaqah = async (sub: NodeSubmission) => {
    const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
    setReviewingId(subKey);
    const isGate = sub.nodeId?.includes('gate') || sub.nodeTitle?.includes('بوابة');
    const teacherNotes = (inHalaqahNotes[subKey] || '').trim();
    const rating = isGate ? 'مجتاز بنجاح 🏆' : 'ممتاز 🌟';
    const xpReward = isGate ? 50 : 25;
    try {
      await reviewStudentSubmission(
        sub.studentId,
        sub.nodeId,
        'approved',
        teacherNotes,
        rating,
        xpReward,
        sub.weekId || 1,
        sub.id
      );
      await fetchTeacherSubmissions();
      const studentName = getStudentDisplayName(sub);
      const msg = isGate
        ? `تم اعتماد اجتياز بوابة الأسبوع للطالب ${studentName} بنجاح، وفُتح له الأسبوع القادم (+50 XP)! 🏆`
        : `تم اعتماد تسميع الطالب ${studentName} بنجاح وإضافة 25 نقطة لإنجازه`;
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } catch (err) {
      console.error('Error approving halaqah submission:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const handleRequestPracticeInHalaqah = async (sub: NodeSubmission) => {
    const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
    const teacherNotes = (inHalaqahNotes[subKey] || '').trim();
    if (!teacherNotes) {
      alert('يرجى كتابة ملاحظاتك وتوجيهاتك للطالب حتى يعرف ما يحتاج لمراجعته وتدريبه.');
      return;
    }
    setReviewingId(subKey);
    const isGate = sub.nodeId?.includes('gate') || sub.nodeTitle?.includes('بوابة');
    const rating = isGate ? 'إعادة وتدريب 🔄' : 'يحتاج تدريب 🔄';
    try {
      await reviewStudentSubmission(
        sub.studentId,
        sub.nodeId,
        'reviewed',
        teacherNotes,
        rating,
        10,
        sub.weekId || 1,
        sub.id
      );
      await fetchTeacherSubmissions();
      setOpenPracticeNoteId(null);
      setActionSuccessMsg(`تم إرسال الملاحظات للطالب ${getStudentDisplayName(sub)} بنجاح لإعادة التدريب`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error requesting practice for halaqah submission:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const handleCreateCircleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createTeacherCircle(newCircleName.trim());
      setNewCircleName('');
      setShowCreateModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'تعذر إنشاء الحلقة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsCreating(false);
    }
  };

  // Merge context and direct loaded students & circles
  const effectiveCircles = teacherCircles.length > 0 ? teacherCircles : directCircles;
  const currentCircle = userCircle || (effectiveCircles.length > 0 ? effectiveCircles[0] : null);
  const effectiveStudents = circleStudents.length > 0 ? circleStudents : directStudents;

  // Filter students by name
  const filteredStudents = effectiveStudents.filter(s =>
    (s.displayName || s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = effectiveStudents.length;
  const activeTodayCount = effectiveStudents.filter(s => (s.streak || 0) > 0).length;
  const totalCirclesCount = effectiveCircles.length || (currentCircle ? 1 : 0);

  const isHalaqahSub = (sub: NodeSubmission) => sub.type === 'halaqah';
  const isRecordingSub = (sub: NodeSubmission) => sub.type !== 'halaqah';

  const pendingRecordings = teacherSubmissions.filter(
    s => isRecordingSub(s) && (s.status === 'pending' || s.status === 'pending_teacher_review')
  );
  const approvedRecordings = teacherSubmissions.filter(
    s => isRecordingSub(s) && s.status === 'approved'
  );
  const allRecordings = teacherSubmissions.filter(s => isRecordingSub(s));

  const pendingHalaqah = teacherSubmissions.filter(
    s => isHalaqahSub(s) && (s.status === 'pending' || s.status === 'pending_teacher_review')
  );
  const approvedHalaqah = teacherSubmissions.filter(
    s => isHalaqahSub(s) && s.status === 'approved'
  );
  const allHalaqah = teacherSubmissions.filter(s => isHalaqahSub(s));

  const isHalaqahTab = activeTab === 'halaqah';

  return (
    <div className="pb-32 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4 font-arabic">
      {isHalaqahTab ? (
        /* ==================== TAB: HALAQAH (إدارة الحلقة والتسميع) ==================== */
        <div className="space-y-4">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-[#006304] to-emerald-800 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-emerald-600/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-white/10 border border-white/20 shadow-xs">
                  <BookOpen className="w-5 h-5 text-[#F9BF3B]" />
                </span>
                <div>
                  <span className="text-[10px] font-bold bg-[#F9BF3B] text-slate-900 px-2 py-0.5 rounded-full">
                    إدارة الحلقة والتسميع
                  </span>
                  <h2 className="font-heading font-black text-base sm:text-lg text-white mt-0.5">
                    تسميع الطلاب ومراجعة الإنجاز
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('teacher')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="العودة للوحة الرئيسية"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                  <span>الرئيسية</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-emerald-100 mt-2 font-medium">
              استعراض ومراجعة التسجيلات الصوتية الذاتية، ومتابعة تسميع طلاب الحلقة واعتماد إنجازهم مباشرة.
            </p>
          </div>

          {/* Action Success Notification Toast */}
          {actionSuccessMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl p-3 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-[#006304] shrink-0" />
              <span className="flex-1">{actionSuccessMsg}</span>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Two Main Sections Navigation Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setHalaqahSection('recording')}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                halaqahSection === 'recording'
                  ? 'bg-purple-700 text-white font-black shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-purple-800 font-bold'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>تسجيل ذاتي</span>
              {pendingRecordings.length > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full font-num ${
                    halaqahSection === 'recording'
                      ? 'bg-white text-purple-800'
                      : 'bg-purple-200 text-purple-900'
                  }`}
                >
                  {pendingRecordings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setHalaqahSection('halaqah')}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                halaqahSection === 'halaqah'
                  ? 'bg-[#006304] text-white font-black shadow-sm'
                  : 'bg-transparent text-gray-600 hover:text-emerald-800 font-bold'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>تسميع في الحلقة</span>
              {pendingHalaqah.length > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full font-num ${
                    halaqahSection === 'halaqah'
                      ? 'bg-white text-emerald-800'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {pendingHalaqah.length}
                </span>
              )}
            </button>
          </div>

          {/* Section 1 Content: تسجيل ذاتي */}
          {halaqahSection === 'recording' && (
            <div className="bg-white border-2 border-purple-200/80 rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                    <Mic className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-heading font-black text-sm text-slate-900">
                      التسجيلات الصوتية الذاتية
                    </h3>
                    <p className="text-[10.5px] text-gray-500 font-medium">
                      تسجيلات صوتية رفعها الطلاب بانتظار المراجعة والاعتماد
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchTeacherSubmissions()}
                  className="text-xs text-purple-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تحديث</span>
                </button>
              </div>

              {/* Submissions Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSubmissionsFilter('pending')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    submissionsFilter === 'pending'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-gray-600 hover:text-slate-900'
                  }`}
                >
                  بانتظار المراجعة ({pendingRecordings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionsFilter('approved')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    submissionsFilter === 'approved'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-gray-600 hover:text-slate-900'
                  }`}
                >
                  المعتمدة ({approvedRecordings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionsFilter('all')}
                  className={`py-1.5 px-2.5 rounded-lg transition-all text-center cursor-pointer ${
                    submissionsFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-gray-600 hover:text-slate-900'
                  }`}
                >
                  الكل ({allRecordings.length})
                </button>
              </div>

              {/* Recordings List */}
              {(() => {
                const displayedRecordings =
                  submissionsFilter === 'pending'
                    ? pendingRecordings
                    : submissionsFilter === 'approved'
                    ? approvedRecordings
                    : allRecordings;

                if (displayedRecordings.length === 0) {
                  return (
                    <div className="text-center py-8 bg-purple-50/40 rounded-2xl border border-dashed border-purple-200 space-y-1.5">
                      <Mic className="w-7 h-7 text-purple-300 mx-auto" />
                      <p className="text-xs text-gray-700 font-bold">
                        {submissionsFilter === 'pending'
                          ? 'لا توجد تسجيلات ذاتية جديدة بانتظار المراجعة'
                          : submissionsFilter === 'approved'
                          ? 'لا توجد تسجيلات معتمدة بعد'
                          : 'لا توجد أي تسجيلات صوتية'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        عندما يقوم أي طالب برفع تسجيل صوتي للمهمة سيظهر هنا فوراً
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-0.5">
                    {displayedRecordings.map(sub => {
                      const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
                      const isApproved = sub.status === 'approved';
                      const isReviewed = sub.status === 'reviewed';
                      const taskDetails = getSubmissionTaskDetails(sub);

                      return (
                        <div
                          key={subKey}
                          onClick={() => handleOpenReviewModal(sub)}
                          className={`rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                            isApproved
                              ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200'
                              : isReviewed
                              ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200'
                              : 'bg-white hover:bg-purple-50/50 border-purple-100 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-black text-xs shrink-0 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {(getStudentDisplayName(sub))[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-heading font-black text-xs text-slate-900 group-hover:text-purple-800 transition-colors truncate">
                                  {getStudentDisplayName(sub)}
                                </span>
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-purple-200 shrink-0">
                                  {taskDetails.weekTitle}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-medium mt-0.5 space-y-0.5">
                                <span className="font-bold text-slate-700 block truncate">
                                  {taskDetails.nodeTitle}
                                </span>
                                {taskDetails.surahsList.length > 0 && (
                                  <span className="text-[#006304] text-[9.5px] font-semibold block truncate">
                                    📖 السور: {taskDetails.surahsList.join('، ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isApproved ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ معتمد
                              </span>
                            ) : isReviewed ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                🔄 مطلوب تدريب
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 font-num">
                                ⏳ قيد المراجعة
                              </span>
                            )}

                            <button
                              type="button"
                              className="bg-purple-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs hover:bg-purple-800 transition-colors cursor-pointer"
                            >
                              {isApproved ? 'عرض التفاصيل' : 'مراجعة واعتماد'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section 2 Content: تسميع في الحلقة */}
          {halaqahSection === 'halaqah' && (
            <div className="bg-white border-2 border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-emerald-100 text-[#006304]">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-heading font-black text-sm text-slate-900">
                      التسميع المباشر في الحلقة
                    </h3>
                    <p className="text-[10.5px] text-gray-500 font-medium">
                      الطلاب الذين اختاروا التسميع حضورياً ومباشرة في الحلقة
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchTeacherSubmissions()}
                  className="text-xs text-[#006304] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تحديث</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setInHalaqahFilter('pending')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    inHalaqahFilter === 'pending'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-gray-600 hover:text-slate-900'
                  }`}
                >
                  بانتظار التسميع ({pendingHalaqah.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInHalaqahFilter('approved')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    inHalaqahFilter === 'approved'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-gray-600 hover:text-slate-900'
                  }`}
                >
                  المعتمد اليوم ({approvedHalaqah.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInHalaqahFilter('all')}
                  className={`py-1.5 px-2.5 rounded-lg transition-all text-center cursor-pointer ${
                    inHalaqahFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-gray-600 hover:text-slate-900'
                  }`}
                >
                  الكل ({allHalaqah.length})
                </button>
              </div>

              {/* In-Halaqah Students List */}
              {(() => {
                const displayedHalaqah =
                  inHalaqahFilter === 'pending'
                    ? pendingHalaqah
                    : inHalaqahFilter === 'approved'
                    ? approvedHalaqah
                    : allHalaqah;

                if (displayedHalaqah.length === 0) {
                  return (
                    <div className="text-center py-8 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200 space-y-1.5">
                      <BookOpen className="w-7 h-7 text-emerald-300 mx-auto" />
                      <p className="text-xs text-gray-700 font-bold">
                        {inHalaqahFilter === 'pending'
                          ? 'لا يوجد طلاب بانتظار التسميع في الحلقة حالياً'
                          : inHalaqahFilter === 'approved'
                          ? 'لا يوجد تسميع معتمد في الحلقة اليوم بعد'
                          : 'لا توجد طلبات تسميع في الحلقة'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        عندما يختار الطالب "التسميع في الحلقة" سيظهر اسمه هنا فوراً لتسميع ورده
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-0.5">
                    {displayedHalaqah.map(sub => {
                      const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
                      const isApproved = sub.status === 'approved';
                      const isReviewed = sub.status === 'reviewed';
                      const isProcessing = reviewingId === subKey;
                      const taskDetails = getSubmissionTaskDetails(sub);
                      const isPracticeOpen = openPracticeNoteId === subKey;
                      const isAbsentConfirmOpen = absentConfirmId === subKey;

                      return (
                        <div
                          key={subKey}
                          className={`rounded-2xl p-4 border transition-all space-y-3 ${
                            isApproved
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isReviewed
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          {/* Student & Task Meta */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006304] font-heading font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                                {(getStudentDisplayName(sub))[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-heading font-black text-sm text-slate-900">
                                    {getStudentDisplayName(sub)}
                                  </h4>
                                  <span className="bg-[#006304]/10 text-[#006304] text-[9.5px] font-black px-2 py-0.5 rounded-full border border-[#006304]/20">
                                    {taskDetails.weekTitle}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                                  طلب التسميع: {formatArabicDate(sub.submittedAt)}
                                </span>
                              </div>
                            </div>

                            {isApproved ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ تم الاعتماد
                              </span>
                            ) : isReviewed ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                🔄 طلب تدريب
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-num">
                                🕌 بانتظار التسميع
                              </span>
                            )}
                          </div>

                          {/* Task Details Box: اسم المهمة، السور المقررة، الأسبوع */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 font-medium">المهمة المقررة:</span>
                              <span className="font-heading font-black text-slate-900">
                                {taskDetails.nodeTitle}
                              </span>
                            </div>
                            {taskDetails.surahsList.length > 0 && (
                              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                                <span className="text-gray-500 font-medium shrink-0">السور المقررة:</span>
                                <span className="font-bold text-[#006304] text-left">
                                  📖 {taskDetails.surahsList.join('، ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions Row */}
                          {isApproved ? (
                            <div className="bg-emerald-100/60 text-emerald-900 rounded-xl p-2 text-center text-xs font-bold border border-emerald-200">
                              ✓ تم اعتماد إنجاز الطالب بنجاح واحتساب 25 نقطة
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* 1. اعتماد الإنجاز (زر أخضر) */}
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleApproveInHalaqah(sub)}
                                  className="flex-1 min-w-[120px] bg-[#006304] hover:bg-[#005103] disabled:opacity-60 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>اعتماد الإنجاز</span>
                                </button>

                                {/* 2. طلب تدريب وإعادة (زر برتقالي/أصفر) */}
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => {
                                    setAbsentConfirmId(null);
                                    setOpenPracticeNoteId(isPracticeOpen ? null : subKey);
                                  }}
                                  className="flex-1 min-w-[120px] bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>طلب تدريب وإعادة</span>
                                </button>

                                {/* 3. تسجيل الطالب كغائب (لم يحضر الحلقة) */}
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => {
                                    setOpenPracticeNoteId(null);
                                    setAbsentConfirmId(isAbsentConfirmOpen ? null : subKey);
                                  }}
                                  className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="تسجيل الطالب كغائب عن الحلقة"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>تسجيل كغائب</span>
                                </button>
                              </div>

                              {/* Practice Notes Box (When requested) */}
                              {isPracticeOpen && (
                                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2 animate-in fade-in">
                                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                                    <span>ملاحظات المعلم للطالب لإعادة التدريب:</span>
                                  </div>
                                  <p className="text-[10px] text-amber-800">
                                    (ستظهر للطالب ملاحظاتك المكتوبة هنا فقط بدون أي نص تلقائي مفترض)
                                  </p>
                                  <textarea
                                    value={inHalaqahNotes[subKey] || ''}
                                    onChange={e =>
                                      setInHalaqahNotes(prev => ({
                                        ...prev,
                                        [subKey]: e.target.value,
                                      }))
                                    }
                                    rows={2}
                                    placeholder="اكتب توجيهاتك للطالب (مثل: مراجعة مخارج حرف الضاد في سورة الناس، والتدرب على ترتيل الآيات 1-3...)"
                                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:border-amber-600"
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setOpenPracticeNoteId(null)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white transition-colors cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleRequestPracticeInHalaqah(sub)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      {isProcessing ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-3 h-3" />
                                      )}
                                      <span>إرسال التوجيه والطلب</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Absent Confirmation Box */}
                              {isAbsentConfirmOpen && (
                                <div className="bg-red-50 border border-red-300 rounded-2xl p-3 space-y-2 animate-in fade-in">
                                  <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span>تأكيد تسجيل الطالب كغائب عن الحلقة:</span>
                                  </div>
                                  <p className="text-[11px] text-red-800 leading-relaxed">
                                    عند تأكيد الغياب، سيختفي طلب التسميع لهذا الطالب من القائمة، وسيتمكن الطالب لاحقاً من اختيار طريقة التسميع مرة أخرى (في الحلقة أو تسجيل ذاتي).
                                  </p>
                                  <div className="flex items-center gap-2 justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setAbsentConfirmId(null)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white transition-colors cursor-pointer"
                                    >
                                      تراجع
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleMarkAbsent(sub)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      {isProcessing ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <UserX className="w-3 h-3" />
                                      )}
                                      <span>تأكيد تسجيل الغياب</span>
                                    </button>
                                  </div>
                                </div>
                              )}
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
        </div>
      ) : (
        /* ==================== HOME / MAIN TEACHER DASHBOARD ==================== */
        <>
      {/* 1. Header & Welcome Card (No Teacher XP) */}
      <div className="bg-gradient-to-br from-[#006304] to-emerald-800 text-white rounded-3xl p-5 shadow-xl border border-emerald-600/40 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/10 border border-white/20 shadow-xs">
                <GraduationCap className="w-6 h-6 text-[#F9BF3B]" />
              </span>
              <div>
                <span className="text-[10px] font-bold bg-[#F9BF3B] text-slate-900 px-2 py-0.5 rounded-full">
                  لوحة تحكم المعلم
                </span>
                <h2 className="font-heading font-black text-lg text-white mt-0.5">
                  أهلاً بك، {user.displayName || user.name || 'فضيلة المعلم'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="حسابي ومعلوماتي"
              >
                <span>حسابي</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed font-medium">
            متابعة إنجاز طلاب حلقتك، تحفيز التقدم، ومراجعة التسميع والتلاوة المباركة.
          </p>

          {/* Quick Stat Highlights - Tailored for Teachers (No XP) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
              <span className="text-[10px] text-emerald-200 block font-bold">الطلاب</span>
              <span className="text-base font-black font-num text-white">{totalStudents}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
              <span className="text-[10px] text-emerald-200 block font-bold">المستمرون</span>
              <span className="text-base font-black font-num text-[#F9BF3B]">{activeTodayCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
              <span className="text-[10px] text-emerald-200 block font-bold">الحلقات</span>
              <span className="text-base font-black font-num text-white">{totalCirclesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Circle Information Card & Code Share */}
      {isLoadingCircles ? (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 text-center space-y-2.5 shadow-sm">
          <RefreshCw className="w-6 h-6 text-[#006304] animate-spin mx-auto" />
          <h3 className="font-heading font-bold text-xs text-slate-800">
            جاري جلب بيانات الحلقة والطلاب من قاعدة البيانات...
          </h3>
          <p className="text-[11px] text-gray-500">يرجى الانتظار لحظات</p>
        </div>
      ) : currentCircle ? (
        <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#F0F9F0] border-2 border-[#006304] text-[#006304] flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-sm text-slate-900">
                  {currentCircle.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <span>
                    الجنس: {currentCircle.gender === 'female' ? 'بنات (إناث)' : 'بنين (ذكور)'}
                  </span>
                  <span>•</span>
                  <span className="text-[#006304] font-bold">مفعلة</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-[11px] font-bold bg-[#F0F9F0] hover:bg-[#e2f3e2] text-[#006304] border border-[#006304]/30 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="إنشاء حلقة إضافية"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>حلقة جديدة</span>
              </button>
            </div>
          </div>

          {/* Code Box with 1-Click Copy */}
          <div className="bg-amber-50/80 border-2 border-[#F9BF3B] rounded-2xl p-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-amber-900 block">
                رمز انضمام الطلاب للحلقة:
              </span>
              <span className="text-base sm:text-lg font-black font-num text-[#006304] tracking-wider dir-ltr inline-block">
                {currentCircle.code || currentCircle.id?.slice(0, 6).toUpperCase() || 'WRD-101'}
              </span>
            </div>

            <button
              onClick={() => handleCopyCode(currentCircle.code || currentCircle.id?.slice(0, 6).toUpperCase() || 'WRD-101')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                copiedCode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#006304] hover:bg-[#005103] text-white'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرمز</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-500 text-center font-medium">
            شارك هذا الرمز مع طلابك ليدخلوه في التطبيق وينضموا لحلقتك فوراً.
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-6 text-center space-y-3">
          <Building className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-heading font-black text-sm text-slate-800">
            لم تقم بإنشاء حلقة قرآنية بعد
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            أنشئ حلقتك الآن لتوليد رمز الانضمام ومتابعة طلابك بسهولة.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#006304] text-white font-bold px-4 py-2.5 rounded-2xl text-xs hover:bg-[#005103] transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حلقة جديدة</span>
          </button>
        </div>
      )}

      {/* 3. Dedicated Actions Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('journey')}
          className="bg-white border-2 border-gray-200 hover:border-[#006304] p-3 rounded-2xl text-right transition-all group cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <BookOpen className="w-4 h-4 text-[#006304]" />
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#006304]" />
          </div>
          <p className="font-heading font-bold text-xs text-slate-900 mt-2">
            معاينة خريطة المنهج
          </p>
          <span className="text-[10px] text-gray-500 font-medium">استعراض محطات جزء عم الـ ١٧</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="bg-white border-2 border-gray-200 hover:border-[#006304] p-3 rounded-2xl text-right transition-all group cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <GraduationCap className="w-4 h-4 text-[#006304]" />
            <ChevronLeft className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#006304]" />
          </div>
          <p className="font-heading font-bold text-xs text-slate-900 mt-2">
            حسابي والمعلومات
          </p>
          <span className="text-[10px] text-gray-500 font-medium">البيانات الشخصية والإعدادات</span>
        </button>
      </div>

      {/* 4. Students Section (طلابي) */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#006304]" />
            <h3 className="font-heading font-black text-sm text-slate-900">
              قائمة طلابي ({circleStudents.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-[11px] font-bold text-gray-600 hover:text-[#006304] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="تحديث قائمة الطلاب"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className="text-[11px] font-bold text-[#006304] hover:text-[#005103] flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث عن طالب..."
            className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Students List */}
        {filteredStudents.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {filteredStudents.map((student, idx) => {
              const completedCount = student.completedNodes ? student.completedNodes.length : 0;
              return (
                <div
                  key={student.id || idx}
                  onClick={() => setSelectedStudentForDetails(student)}
                  className="bg-slate-50 hover:bg-[#F0F9F0] border border-slate-200/80 hover:border-[#006304]/40 rounded-2xl p-3 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold font-num text-xs flex items-center justify-center border border-emerald-300 group-hover:bg-[#006304] group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-xs text-slate-900 group-hover:text-[#006304] transition-colors">
                        {student.displayName || student.name || 'طالب'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-0.5">
                        <span className="text-[#006304]">
                          الأسبوع {student.currentWeek || 1}
                        </span>
                        <span>•</span>
                        <span>{completedCount} محطة</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Streak */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px] font-bold text-amber-900 font-num">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{student.streak || 0} د</span>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px] font-bold text-[#006304] font-num">
                      <Star className="w-3 h-3 text-[#006304] fill-[#006304]" />
                      <span>{student.xp || 0} XP</span>
                    </div>

                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#006304] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <Users className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-bold">
              {searchQuery ? 'لا يوجد طالب يطابق البحث' : 'لا يوجد طلاب منضمون حتى الآن'}
            </p>
            <p className="text-[10px] text-gray-400">
              شارك رمز الحلقة مع طلابك ليظهروا هنا تلقائياً
            </p>
          </div>
        )}
      </div>

      {/* 5. The Two Distinct Submission Boxes (جنباً إلى جنب، تصميم أصغر حجماً ومبسط) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {/* Box 1: تسميع بانتظار المراجعة (Soft Purple & White) */}
        <div
          onClick={() => {
            setHalaqahSection('recording');
            setActiveTab('halaqah');
          }}
          className="bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 border-2 border-purple-200 hover:border-purple-300 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md border border-purple-200">
                تسجيل ذاتي
              </span>
            </div>
            <h3 className="font-heading font-black text-xs sm:text-[13px] text-slate-900 leading-tight">
              تسميع بانتظار المراجعة
            </h3>
            <div className="pt-1.5">
              <span className="text-2xl sm:text-3xl font-black font-num text-purple-900 leading-none">
                {pendingRecordings.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHalaqahSection('recording');
              setActiveTab('halaqah');
            }}
            className="w-full bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer mt-2"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>بدء المراجعة</span>
          </button>
        </div>

        {/* Box 2: تسميع الحلقة اليوم (Soft Green & White) */}
        <div
          onClick={() => {
            setHalaqahSection('halaqah');
            setActiveTab('halaqah');
          }}
          className="bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-2 border-emerald-200 hover:border-emerald-300 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 text-[#006304] flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                في الحلقة
              </span>
            </div>
            <h3 className="font-heading font-black text-xs sm:text-[13px] text-slate-900 leading-tight">
              تسميع الحلقة اليوم
            </h3>
            <div className="pt-1.5">
              <span className="text-2xl sm:text-3xl font-black font-num text-[#006304] leading-none">
                {pendingHalaqah.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHalaqahSection('halaqah');
              setActiveTab('halaqah');
            }}
            className="w-full bg-[#006304] hover:bg-[#005103] active:bg-[#003d02] text-white font-bold py-1.5 px-2 rounded-xl text-[11px] shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer mt-2"
          >
            <Users className="w-3 h-3" />
            <span>بدء الحلقة</span>
          </button>
        </div>
      </div>
    </>
  )}

      {/* Review & Evaluation Modal (تفاصيل التسميع والمراجعة والاعتماد) */}
      {reviewModalSubmission && (() => {
        const sub = reviewModalSubmission;
        const subKey = sub.id || `${sub.studentId}_${sub.nodeId}`;
        const isApproved = sub.status === 'approved';
        const isReviewed = sub.status === 'reviewed';
        const isSubmittingReview = reviewingId === subKey;
        const taskDetails = getSubmissionTaskDetails(sub);
        const isGate = sub.nodeId?.includes('gate') || sub.nodeTitle?.includes('بوابة');
        const studentDisplayName = getStudentDisplayName(sub);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-lg w-full space-y-3.5 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center font-heading shrink-0 border ${
                    isGate
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-[#006304]/10 text-[#006304] border-[#006304]/20'
                  }`}>
                    {studentDisplayName[0]}
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
                      {isGate ? 'اختبار بوابة الأسبوع في الحلقة' : 'مراجعة تسميع'}: {studentDisplayName}
                    </h3>
                    <span className="text-[11px] text-gray-500 font-bold block mt-0.5">
                      {taskDetails.weekTitle} • {isGate ? 'بوابة العبور واختبار الإتقان' : taskDetails.nodeTitle}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setReviewModalSubmission(null)}
                  className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comprehensive Task Details Card (سياق المهمة، الأسبوع، والسور المقررة بالتفصيل) */}
              <div className="bg-gradient-to-br from-emerald-50 via-[#F3FAF3] to-teal-50/50 rounded-2xl p-3.5 sm:p-4 border-2 border-[#006304]/25 space-y-3 shadow-xs">
                {/* Week & Task badges row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#006304] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs">
                      {taskDetails.weekTitle}
                    </span>
                    <span className="bg-emerald-100 text-[#006304] text-[11px] font-black px-2.5 py-1 rounded-lg border border-emerald-300">
                      {taskDetails.nodeTitle}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-bold bg-white/90 px-2 py-0.5 rounded-md border border-gray-200">
                    {sub.nodeId}
                  </span>
                </div>

                {/* Prominent Surahs Required List */}
                <div className="space-y-2 bg-white/95 p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#006304]" />
                      <span>السور المقررة للاستماع والتصحيح:</span>
                    </span>
                    {taskDetails.surahsList.length > 0 && (
                      <span className="text-[10px] font-black text-[#006304] bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                        {taskDetails.surahsList.length} سور مقررة
                      </span>
                    )}
                  </div>

                  {taskDetails.surahsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {taskDetails.surahsList.map((surah, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-[#006304]/10 text-[#006304] border border-[#006304]/30 px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs hover:bg-[#006304]/15 transition-colors"
                        >
                          <span className="text-[11px] text-emerald-600">📖</span>
                          <span>سورة {surah}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700 font-medium">
                      {taskDetails.surahName || 'السور المقررة للأسبوع'}
                    </p>
                  )}
                </div>

                {/* Task Objective / Student Instruction */}
                {taskDetails.description && (
                  <div className="text-[11px] text-emerald-950 bg-white/80 p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <span className="font-black text-slate-900">المطلوب من الطالب: </span>
                      {taskDetails.description}
                    </p>
                  </div>
                )}

                {/* Metadata: Submission time and recitation method */}
                <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1 px-0.5 border-t border-emerald-200/60 flex-wrap gap-2">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>تاريخ التقديم: {formatArabicDate(sub.submittedAt)}</span>
                  </span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-lg text-[10.5px] ${
                      sub.type === 'recording'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}
                  >
                    {sub.type === 'recording' ? '🎙️ تسجيل صوتي ذاتي' : '🕌 تسميع في حلقة المسجد'}
                  </span>
                </div>
              </div>

              {/* Oral Exam Questions (Proposed 4 random sections for Teacher in Halaqah) */}
              {isGate && examQuestions.length > 0 && (
                <div className="bg-amber-50/80 border-2 border-amber-300/90 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      <span>أسئلة الاختبار الشفهي المقترحة (٤ مقاطع في الحلقة):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExamQuestions(generateRandomExamQuestions(taskDetails.surahsList))}
                      className="text-[10px] font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-amber-300"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>توليد أسئلة أخرى</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {examQuestions.map((q) => (
                      <div key={q.number} className="bg-white p-2.5 rounded-xl border border-amber-200/90 text-right space-y-0.5">
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-amber-800">
                          <span className="bg-amber-100 px-2 py-0.5 rounded font-num">المقطع {q.number}</span>
                          <span>سورة {q.surah} {q.verse ? `(الآية ${q.verse})` : ''}</span>
                        </div>
                        <p className="font-quran text-sm text-slate-900 font-bold leading-relaxed pt-0.5">
                          {q.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio player if student recorded audio */}
              {!isGate && sub.audioUrl ? (
                <div className="bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-purple-700" />
                      <span>تسجيل تلاوة الطالب:</span>
                    </span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                      جاهز للاستماع
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 font-medium leading-relaxed">
                    استمع للتسجيل وتأكد من قراءة الطالب للسور الموضحة أعلاه غيباً مع صحة مخارج الحروف وأحكام التجويد.
                  </p>
                  <audio
                    controls
                    src={sub.audioUrl}
                    className="w-full h-10 rounded-lg"
                    preload="metadata"
                  >
                    متصفحك لا يدعم تشغيل هذا الملف الصوتي.
                  </audio>
                </div>
              ) : !isGate && sub.type === 'recording' ? (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-800 text-center font-bold">
                  لم يتم إرفاق ملف صوتي أو قيد الرفع
                </div>
              ) : null}

              {/* Evaluation: Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  التقدير ومستوى الأداء:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(isGate
                    ? ['مجتاز بنجاح 🏆', 'ممتاز 🌟', 'جيد جداً 👍', 'إعادة وتدريب 🔄']
                    : ['ممتاز 🌟', 'جيد جداً 👍', 'جيد 👏', 'يحتاج تدريب 🔄']
                  ).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setRatingState(prev => ({ ...prev, [subKey]: tag }))}
                      className={`text-xs font-bold py-2 px-1.5 rounded-xl border transition-all cursor-pointer text-center ${
                        (ratingState[subKey] || sub.rating || (isGate ? 'مجتاز بنجاح 🏆' : 'ممتاز 🌟')) === tag
                          ? 'bg-[#006304] text-white border-[#006304] shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evaluation: Notes Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>ملاحظات وتوجيهات المعلم:</span>
                  <span className="text-[10px] text-gray-500 font-normal">
                    (تظهر للطالب مباشرة في بطاقة التسميع)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={notesState[subKey] ?? sub.teacherNotes ?? ''}
                  onChange={(e) => setNotesState(prev => ({ ...prev, [subKey]: e.target.value }))}
                  placeholder={
                    sub.teacherNotes ||
                    (isGate
                      ? 'اكتب توجيهاتك للطالب بعد الاختبار الشفهي في الحلقة، أو ثناء على حفظه وإتقانه...'
                      : 'اكتب توجيهاتك للطالب، مثل: إتقان أحكام النون الساكنة أو ثناء على جودة التلاوة...')
                  }
                  className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-2xl focus:border-[#006304] focus:outline-hidden resize-none font-medium text-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => handleReview(sub, 'approved', isGate ? 'مجتاز بنجاح 🏆' : 'ممتاز 🌟')}
                    className="bg-[#006304] hover:bg-[#005103] disabled:opacity-50 text-white text-xs font-bold py-3 px-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#F9BF3B]" />
                    <span>
                      {isSubmittingReview
                        ? 'جاري الاعتماد...'
                        : isGate
                        ? 'اعتماد اجتياز البوابة (+50 XP)'
                        : 'اعتماد التسميع (+25 XP)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => handleReview(sub, 'reviewed', isGate ? 'إعادة وتدريب 🔄' : 'يحتاج تدريب 🔄')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-amber-800" />
                    <span>{isGate ? 'طلب إعادة الاختبار' : 'طلب إعادة وتدريب'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewModalSubmission(null)}
                  className="w-full bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-xs border border-gray-200 transition-colors cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Student Detail Modal (تفاصيل الطالب ومحفوظاته وتسجيلاته) */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#006304]" />
                <h3 className="font-heading font-black text-sm text-slate-900">
                  تفاصيل إنجاز الطالب
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForDetails(null)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-heading font-black text-base text-slate-900">
                {selectedStudentForDetails.displayName || selectedStudentForDetails.name || 'طالب'}
              </h4>
              <p className="text-xs text-[#006304] font-bold">
                {selectedStudentForDetails.gender === 'female' ? 'طالبة في حلقة الإناث' : 'طالب في حلقة البنين'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F0F9F0] p-2.5 rounded-2xl border border-[#006304]/20">
                <span className="text-[10px] text-gray-600 font-bold block">الأسبوع</span>
                <span className="font-num font-black text-[#006304] text-sm">
                  {selectedStudentForDetails.currentWeek || 1}
                </span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold block">السلسلة</span>
                <span className="font-num font-black text-amber-600 text-sm">
                  {selectedStudentForDetails.streak || 0} يوماً
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">النقاط</span>
                <span className="font-num font-black text-[#006304] text-sm">
                  {selectedStudentForDetails.xp || 0} XP
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-gray-600">
                <span>المحطات المكتملة:</span>
                <span className="text-[#006304] font-num font-black">
                  {selectedStudentForDetails.completedNodes ? selectedStudentForDetails.completedNodes.length : 0} محطة
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-600">
                <span>الأسابيع المكتملة:</span>
                <span className="text-[#006304] font-num font-black">
                  {selectedStudentForDetails.completedWeeks ? selectedStudentForDetails.completedWeeks.length : 0} أسبوع
                </span>
              </div>
            </div>

            {/* Student's Submissions & Recordings History */}
            {(() => {
              const studentSubs = teacherSubmissions.filter(s => s.studentId === selectedStudentForDetails.id);
              if (studentSubs.length === 0) {
                return (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-500 font-medium">
                    لا توجد تسجيلات محفوظة لهذا الطالب حتى الآن
                  </div>
                );
              }

              return (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  <span className="text-xs font-bold text-slate-800 block">
                    سجل تسجيلات وتسميعات الطالب ({studentSubs.length}):
                  </span>
                  {studentSubs.map(sub => {
                    const taskDetails = getSubmissionTaskDetails(sub);
                    return (
                      <div
                        key={sub.id || sub.nodeId}
                        className="bg-[#F0F9F0] p-2.5 rounded-xl border border-[#006304]/20 space-y-1.5 text-right"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[#006304] bg-[#006304]/10 px-1.5 py-0.5 rounded text-[10px] font-black">
                              {taskDetails.weekTitle}
                            </span>
                            <span className="text-slate-900">{taskDetails.nodeTitle}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              sub.status === 'approved'
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-amber-200 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {sub.status === 'approved' ? '✓ معتمد' : '⏳ قيد المراجعة'}
                          </span>
                        </div>

                        {taskDetails.surahsList.length > 0 && (
                          <div className="text-[10px] text-[#006304] font-bold bg-white/90 p-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <span>📖</span>
                            <span>السور: {taskDetails.surahsList.join('، ')}</span>
                          </div>
                        )}

                      {sub.rating && (
                        <div className="text-[10px] text-emerald-800 font-bold">
                          <span>التقدير: </span>
                          <span className="bg-white px-1.5 py-0.5 rounded border border-emerald-200">{sub.rating}</span>
                        </div>
                      )}

                      {sub.teacherNotes && (
                        <p className="text-[10px] text-gray-700 bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                          {sub.teacherNotes}
                        </p>
                      )}

                      {sub.audioUrl && (
                        <audio controls src={sub.audioUrl} className="w-full h-8 mt-1 rounded">
                          المتصفح لا يدعم تشغيل الصوت
                        </audio>
                      )}

                      {sub.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForDetails(null);
                            setReviewModalSubmission(sub);
                          }}
                          className="w-full bg-[#006304] text-white text-[10px] font-bold py-1 rounded-lg hover:bg-[#005103] cursor-pointer mt-1"
                        >
                          مراجعة واعتماد الآن
                        </button>
                      )}
                    </div>
                  );
                })}
                </div>
              );
            })()}

            <button
              onClick={() => setSelectedStudentForDetails(null)}
              className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-slate-900">
                إنشاء حلقة جديدة
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCircleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسم الحلقة:
                </label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={e => setNewCircleName(e.target.value)}
                  placeholder="مثال: حلقة النور - الفوج الثاني"
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
                  required
                />
              </div>

              <p className="text-[11px] text-gray-500 font-medium">
                الجنس المحدد للحلقة: {user.gender === 'male' ? 'للبنين (ذكور)' : 'للبنات (إناث)'}
              </p>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-[#006304] hover:bg-[#005103] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري إنشاء الحلقة وتوليد الرمز...</span>
                  </>
                ) : (
                  <span>إنشاء وتوليد الرمز</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};