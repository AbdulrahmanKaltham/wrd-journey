import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { UserProfile } from '../types';
import {
  Users,
  Search,
  Flame,
  Star,
  BookOpen,
  Copy,
  Check,
  Building,
  GraduationCap,
  Award,
  ChevronLeft,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const TeacherStudentsPage: React.FC = () => {
  const {
    userCircle,
    circleStudents,
    teacherCircles,
    teacherSubmissions,
    reviewStudentSubmission,
    fetchTeacherSubmissions,
    refreshCircleData,
    setActiveTab,
  } = useSupabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'week'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  const currentCircle = userCircle || (teacherCircles.length > 0 ? teacherCircles[0] : null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCircleData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter students based on search and filterMode
  const filteredStudents = circleStudents.filter(student => {
    const nameMatch = (student.displayName || student.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;

    if (filterMode === 'active') {
      return (student.streak || 0) > 0;
    }
    return true;
  });

  const totalStudents = circleStudents.length;
  const activeTodayCount = circleStudents.filter(s => (s.streak || 0) > 0).length;

  return (
    <div className="pb-32 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4 font-arabic">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#006304] to-emerald-800 text-white rounded-3xl p-5 shadow-xl border border-emerald-600/40 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/10 border border-white/20 shadow-xs">
                <Users className="w-6 h-6 text-[#F9BF3B]" />
              </span>
              <div>
                <span className="text-[10px] font-bold bg-[#F9BF3B] text-slate-900 px-2 py-0.5 rounded-full">
                  إدارة الطلاب والمتابعة
                </span>
                <h2 className="font-heading font-black text-lg text-white mt-0.5">
                  طلابي في الحلقة القرآنية
                </h2>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed font-medium">
            متابعة دقيقة لتقدم كل طالب ومستواه في حفظ ومراجعة سور جزء عم.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
              <span className="text-[10px] text-emerald-200 block font-bold">إجمالي الطلاب</span>
              <span className="text-base font-black font-num text-white">{totalStudents}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
              <span className="text-[10px] text-emerald-200 block font-bold">المستمرون بالورد</span>
              <span className="text-base font-black font-num text-[#F9BF3B]">{activeTodayCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Circle Join Code Box */}
      {currentCircle && (
        <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
              <Building className="w-3.5 h-3.5 text-[#006304]" />
              <span>{currentCircle.name}</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              رمز الانضمام: <span className="font-num text-[#006304] font-black text-sm dir-ltr inline-block">{currentCircle.code || currentCircle.id?.slice(0, 6).toUpperCase() || 'WRD-101'}</span>
            </p>
          </div>

          <button
            onClick={() => handleCopyCode(currentCircle.code || currentCircle.id?.slice(0, 6).toUpperCase() || 'WRD-101')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
              copiedCode
                ? 'bg-emerald-600 text-white'
                : 'bg-[#F0F9F0] hover:bg-[#e2f3e2] text-[#006304] border border-[#006304]/30'
            }`}
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'تم النسخ' : 'نسخ الرمز'}</span>
          </button>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
            <Filter className="w-4 h-4 text-[#006304]" />
            <span>تصفية وبحث الطلاب</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#006304] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              الكل ({totalStudents})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-[#006304] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              المستمرون 🔥 ({activeTodayCount})
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب..."
            className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 4. Students List */}
      <div className="space-y-2.5">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student, idx) => {
            const completedCount = student.completedNodes ? student.completedNodes.length : 0;
            return (
              <div
                key={student.id || idx}
                onClick={() => setSelectedStudent(student)}
                className="bg-white hover:bg-[#F0F9F0] border-2 border-[#E0E0E0] hover:border-[#006304]/40 rounded-3xl p-4 transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black font-num text-sm flex items-center justify-center border border-emerald-300 shadow-2xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#006304] transition-colors">
                      {student.displayName || student.name || 'طالب قرآن'}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-0.5">
                      <span className="text-[#006304]">
                        الأسبوع {student.currentWeek || 1}
                      </span>
                      <span>•</span>
                      <span>{completedCount} محطة مكتملة</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Streak */}
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-[11px] font-bold text-amber-900 font-num shadow-2xs">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{student.streak || 0} د</span>
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-[11px] font-bold text-[#006304] font-num shadow-2xs">
                    <Star className="w-3.5 h-3.5 text-[#006304] fill-[#006304]" />
                    <span>{student.xp || 0} XP</span>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-[#006304] group-hover:-translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 space-y-3 bg-white rounded-3xl border-2 border-dashed border-gray-300 p-6">
            <Users className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-heading font-black text-sm text-slate-800">
              {searchQuery ? 'لا يوجد طلاب يطابقون البحث' : 'لا يوجد طلاب مسجلون حتى الآن'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              شارك رمز الحلقة مع طلابك عبر الواتساب أو الفصل الدراسي لربطهم تلقائياً ومتابعة إنجازهم.
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#006304]" />
                <h3 className="font-heading font-black text-sm text-slate-900">
                  تفاصيل إنجاز الطالب
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-heading font-black text-base text-slate-900">
                {selectedStudent.displayName || selectedStudent.name || 'طالب قرآن'}
              </h4>
              <p className="text-xs text-[#006304] font-bold">
                {selectedStudent.gender === 'female' ? 'طالبة في حلقة الإناث' : 'طالب في حلقة البنين'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F0F9F0] p-2.5 rounded-2xl border border-[#006304]/20">
                <span className="text-[10px] text-gray-600 font-bold block">الأسبوع</span>
                <span className="font-num font-black text-[#006304] text-sm">
                  {selectedStudent.currentWeek || 1}
                </span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold block">السلسلة</span>
                <span className="font-num font-black text-amber-600 text-sm">
                  {selectedStudent.streak || 0} يوماً
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">النقاط</span>
                <span className="font-num font-black text-[#006304] text-sm">
                  {selectedStudent.xp || 0} XP
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-gray-600">
                <span>المحطات المكتملة:</span>
                <span className="text-[#006304] font-num font-black">
                  {selectedStudent.completedNodes ? selectedStudent.completedNodes.length : 0} محطة
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-600">
                <span>الأسابيع المكتملة:</span>
                <span className="text-[#006304] font-num font-black">
                  {selectedStudent.completedWeeks ? selectedStudent.completedWeeks.length : 0} أسبوع
                </span>
              </div>
            </div>

            {/* Student's Audio Recordings & Submissions */}
            {(() => {
              const studentSubs = teacherSubmissions.filter(s => s.studentId === selectedStudent.id);
              if (studentSubs.length === 0) return null;

              return (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <span className="text-xs font-bold text-slate-800 block">تسجيلات وتسميعات الطالب ({studentSubs.length}):</span>
                  {studentSubs.map(sub => (
                    <div key={sub.id || sub.nodeId} className="bg-[#F0F9F0] p-2 rounded-xl border border-[#006304]/20 space-y-1 text-right">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-900">{sub.nodeTitle || 'تسميع المقرّر'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${sub.status === 'approved' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                          {sub.status === 'approved' ? 'معتمد' : 'قيد المراجعة'}
                        </span>
                      </div>
                      {sub.audioUrl && (
                        <audio controls src={sub.audioUrl} className="w-full h-7 mt-1 rounded">
                          المتصفح لا يدعم تشغيل الصوت
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};