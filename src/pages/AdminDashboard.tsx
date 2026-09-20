import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import {
  fetchAdminStatsFromSupabase,
  fetchAdminTeachersFromSupabase,
  createTeacherByAdmin,
  regenerateTeacherTempPassword,
  deleteOrDeactivateTeacher,
  AdminStatsData,
  AdminChartsData,
  AdminTeacherItem,
} from '../services/supabaseService';
import {
  Shield,
  Users,
  GraduationCap,
  Sparkles,
  BarChart3,
  UserPlus,
  Flame,
  Award,
  BookOpen,
  Mic,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  KeyRound,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  LogOut,
  AlertCircle,
  Clock,
  UserCheck,
  FolderLock,
  Database,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut, activeTab, setActiveTab } = useSupabase();

  // Selected subtab within admin
  const [currentSection, setCurrentSection] = useState<'analytics' | 'teachers' | 'add_teacher'>('analytics');

  // Stats and Charts State
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [charts, setCharts] = useState<AdminChartsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Teachers State
  const [teachers, setTeachers] = useState<AdminTeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Add Teacher Form State
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherGender, setNewTeacherGender] = useState<'male' | 'female'>('male');
  const [newTeacherCircleName, setNewTeacherCircleName] = useState('');
  const [submittingTeacher, setSubmittingTeacher] = useState(false);
  const [createdTeacherResult, setCreatedTeacherResult] = useState<{
    teacher: any;
    temporaryPassword: string;
    circleName?: string;
  } | null>(null);
  const [formError, setFormError] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Action status state
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Synchronize with activeTab from context if requested
  useEffect(() => {
    if (activeTab === 'admin_analytics') setCurrentSection('analytics');
    else if (activeTab === 'admin_teachers') setCurrentSection('teachers');
    else if (activeTab === 'admin_add_teacher') setCurrentSection('add_teacher');
  }, [activeTab]);

  // Load Admin Data directly from Supabase (Client-Side)
  const loadData = async () => {
    setLoadingStats(true);
    setLoadingTeachers(true);
    try {
      const [statsRes, teachersRes] = await Promise.all([
        fetchAdminStatsFromSupabase(),
        fetchAdminTeachersFromSupabase(),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
        if (statsRes.charts) setCharts(statsRes.charts);
      }
      if (teachersRes.success && teachersRes.teachers) {
        setTeachers(teachersRes.teachers);
      }
    } catch (err) {
      console.error('Error loading admin data directly from Supabase:', err);
    } finally {
      setLoadingStats(false);
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  };

  // Submit new teacher form
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreatedTeacherResult(null);

    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      setFormError('يرجى تعبئة الاسم والبريد الإلكتروني للمعلم.');
      return;
    }

    setSubmittingTeacher(true);
    try {
      const res = await createTeacherByAdmin({
        name: newTeacherName.trim(),
        email: newTeacherEmail.trim(),
        gender: newTeacherGender,
        circleName: newTeacherCircleName.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'تعذر إنشاء حساب المعلم.');
        return;
      }

      setCreatedTeacherResult({
        teacher: res.teacher,
        temporaryPassword: res.temporaryPassword || '',
        circleName: res.circle?.name || newTeacherCircleName,
      });

      // Clear form inputs
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherCircleName('');

      // Refresh teachers and stats in background
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setSubmittingTeacher(false);
    }
  };

  // Regenerate password for a teacher
  const handleRegeneratePassword = async (teacher: AdminTeacherItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إعادة توليد كلمة مرور مؤقتة للمعلم (${teacher.name})؟`)) {
      return;
    }
    setRegeneratingId(teacher.id);
    try {
      const res = await regenerateTeacherTempPassword(teacher.id, teacher.email);
      if (res.success && res.temporaryPassword) {
        setActionMessage({
          type: 'success',
          text: `تم توليد كلمة المرور الجديدة بنجاح: ${res.temporaryPassword} (تم النسخ للحافظة)`,
        });
        navigator.clipboard.writeText(res.temporaryPassword);
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'تعذر توليد كلمة المرور' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'حدث خطأ' });
    } finally {
      setRegeneratingId(null);
      setTimeout(() => setActionMessage(null), 8000);
    }
  };

  // Deactivate teacher
  const handleDeactivateTeacher = async (teacher: AdminTeacherItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في تعطيل حساب المعلم (${teacher.name}) وإلغاء تنشيط حلقته؟`)) {
      return;
    }
    try {
      const res = await deleteOrDeactivateTeacher(teacher.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: `تم تعطيل حساب المعلم (${teacher.name}) بنجاح.` });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'فشل تعطيل الحساب' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (t.circleName && t.circleName.toLowerCase().includes(teacherSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedGenderFilter === 'male') return t.gender === 'male';
    if (selectedGenderFilter === 'female') return t.gender === 'female';
    return true;
  });

  // Chart Colors (Warm Islamic Green & Gold)
  const PIE_COLORS = ['#006304', '#16A34A', '#F9BF3B', '#C79545', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-arabic pb-16 antialiased" dir="rtl">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-[#E0E0E0] px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-5 h-5 text-[#F9BF3B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-slate-900 text-base sm:text-lg">
                  بوابة إدارة تطبيق وِرد
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                  مدير النظام (Admin)
                </span>
                <span className="bg-emerald-50 text-[#006304] border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md hidden sm:flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#006304]" />
                  مباشر من Supabase
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                لوحة المتابعة الشاملة، التحليلات، وإدارة الكادر التعليمي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingTeachers ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="max-w-6xl mx-auto px-4 mt-4 animate-fade-in">
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer mr-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b-2 border-gray-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setCurrentSection('analytics');
              setActiveTab('admin_analytics');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              currentSection === 'analytics'
                ? 'bg-[#006304] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>لوحة التحليلات والإحصائيات</span>
          </button>

          <button
            onClick={() => {
              setCurrentSection('teachers');
              setActiveTab('admin_teachers');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              currentSection === 'teachers'
                ? 'bg-[#006304] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة المعلمين والحلقات ({teachers.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentSection('add_teacher');
              setActiveTab('admin_add_teacher');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              currentSection === 'add_teacher'
                ? 'bg-[#006304] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة معلم جديد</span>
          </button>
        </div>

        {/* SECTION 1: ANALYTICS & CHARTS */}
        {currentSection === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Teachers */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">المعلمون والمعلمات</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006304] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.teachers.total ?? 0}
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">♂ {stats?.teachers.male ?? 0} معلمين</span>
                  <span>•</span>
                  <span className="text-purple-700 font-bold">♀ {stats?.teachers.female ?? 0} معلمات</span>
                </div>
              </div>

              {/* Card 2: Students */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">إجمالي الطلاب المسجلين</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.students.total ?? 0}
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
                  <span className="text-blue-700 font-bold">♂ {stats?.students.male ?? 0} طلاب</span>
                  <span>•</span>
                  <span className="text-pink-700 font-bold">♀ {stats?.students.female ?? 0} طالبات</span>
                </div>
              </div>

              {/* Card 3: Active Circles */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">الحلقات النشطة</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.activeCirclesCount ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-medium">
                  حلقات قرآنية تابعة للمعلمين
                </p>
              </div>

              {/* Card 4: Active Today */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">النشطون اليوم</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.activeStudentsTodayCount ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-emerald-600 font-bold">
                  طلاب أنجزوا ورد أو واصلوا السلسلة
                </p>
              </div>

              {/* Card 5: Audio Recordings */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">التسجيلات المرفوعة</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.totalRecordingsCount ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-medium">
                  تسميعات صوتية مسجلة للتقييم
                </p>
              </div>

              {/* Card 6: Completed Weeks */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">الأسابيع المكتملة</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.totalCompletedWeeksCount ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-medium">
                  ختم كامل لأسابيع خطة جزء عم
                </p>
              </div>

              {/* Card 7: XP in 7 Days */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">نقاط XP (آخر 7 أيام)</span>
                  <div className="w-8 h-8 rounded-xl bg-yellow-50 text-[#F9BF3B] flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#006304] font-num">
                  {stats?.xpLast7Days ?? 0} XP
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-medium">
                  نشاط الحفظ والمراجعة التراكمي
                </p>
              </div>

              {/* Card 8: New Registrations in 7 Days */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-gray-100 shadow-xs hover:border-[#006304]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold">مستخدمون جدد (7 أيام)</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-num">
                  {stats?.newUsersLast7DaysCount ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-medium">
                  حسابات جديدة انضمت للبرنامج
                </p>
              </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Daily New Users Last 30 Days (Line Chart) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#006304]" />
                      المستخدمون الجدد خلال آخر 30 يوماً
                    </h3>
                    <p className="text-xs text-gray-400">معدل التسجيل اليومي في المنصة</p>
                  </div>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  {charts?.newUsers30Days && charts.newUsers30Days.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.newUsers30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0' }}
                          labelFormatter={(label) => `التاريخ: ${label}`}
                          formatter={(val) => [`${val} مستخدم`, 'المسجلون']}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#006304"
                          strokeWidth={3}
                          dot={{ fill: '#006304', r: 3 }}
                          activeDot={{ r: 6, fill: '#F9BF3B' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      لا توجد بيانات تسجيلات كافية حالياً
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Students Per Circle (Bar Chart) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#F9BF3B]" />
                      توزيع الطلاب على الحلقات القرآنية
                    </h3>
                    <p className="text-xs text-gray-400">عدد الطلاب الملتحقين بكل حلقة</p>
                  </div>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  {charts?.circleStudentCounts && charts.circleStudentCounts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.circleStudentCounts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          angle={-15}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0' }}
                          formatter={(val) => [`${val} طالب/ـة`, 'عدد الطلاب']}
                        />
                        <Bar dataKey="studentsCount" fill="#006304" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      لا توجد حلقات قرآنية مضافة حتى الآن
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 3: Students Progress by Week (Pie Chart) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-600" />
                      توزيع الطلاب حسب الأسبوع الحالي في الرحلة
                    </h3>
                    <p className="text-xs text-gray-400">أين يقف الطلاب في خطة الـ 17 أسبوعاً</p>
                  </div>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  {charts?.studentsByWeek && charts.studentsByWeek.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.studentsByWeek}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.studentsByWeek.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0' }}
                          formatter={(val, name) => [`${val} طالب`, name]}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      لا توجد بيانات تقدم حالياً
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 4: Daily Recordings Uploaded Last 14 Days */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Mic className="w-4 h-4 text-purple-600" />
                      التسميعات الصوتية اليومية (آخر 14 يوماً)
                    </h3>
                    <p className="text-xs text-gray-400">حجم التفاعل اليومي في التسميع الصوتي</p>
                  </div>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  {charts?.recordings14Days && charts.recordings14Days.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.recordings14Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0' }}
                          formatter={(val) => [`${val} تسجيل`, 'التسجيلات']}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          dot={{ fill: '#8B5CF6', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      لا توجد تسجيلات صوتية مسجلة بعد
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: TEACHERS MANAGEMENT */}
        {currentSection === 'teachers' && (
          <div className="space-y-4">
            {/* Search & Gender Filter Bar */}
            <div className="bg-white rounded-3xl p-4 border-2 border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  placeholder="ابحث بالاسم، البريد، أو الحلقة..."
                  className="w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#006304]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedGenderFilter('all')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedGenderFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  الكل ({teachers.length})
                </button>
                <button
                  onClick={() => setSelectedGenderFilter('male')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedGenderFilter === 'male'
                      ? 'bg-[#006304] text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  معلمون ♂ ({teachers.filter(t => t.gender === 'male').length})
                </button>
                <button
                  onClick={() => setSelectedGenderFilter('female')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedGenderFilter === 'female'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  معلمات ♀ ({teachers.filter(t => t.gender === 'female').length})
                </button>
              </div>
            </div>

            {/* Teachers Table / Cards */}
            {loadingTeachers ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-100">
                <RefreshCw className="w-8 h-8 text-[#006304] animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-bold">جاري تحميل قائمة المعلمين والحلقات...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-100">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-heading font-black text-slate-800 text-base mb-1">
                  لم يتم العثور على أي معلمين
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {teacherSearch ? 'جرب البحث بكلمات أخرى' : 'يمكنك إضافة أول معلم بالضغط على الزر أدناه'}
                </p>
                <button
                  onClick={() => setCurrentSection('add_teacher')}
                  className="px-4 py-2 bg-[#006304] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  إضافة معلم جديد ➕
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeachers.map((t) => (
                  <div
                    key={t.id}
                    className={`bg-white rounded-3xl p-5 border-2 transition-all relative ${
                      t.isDeactivated
                        ? 'border-gray-200 opacity-60 bg-gray-50'
                        : 'border-gray-100 hover:border-[#006304]/40 shadow-xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                            t.gender === 'female'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-[#006304]'
                          }`}
                        >
                          {t.gender === 'female' ? '🧕' : '👳'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base">
                              {t.name}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                t.gender === 'female'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {t.gender === 'female' ? 'معلمة' : 'معلم'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-medium dir-ltr text-right">
                            {t.email}
                          </p>
                        </div>
                      </div>

                      {t.mustChangePassword && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          بانتظار تغيير كلمة المرور
                        </span>
                      )}
                    </div>

                    {/* Circle & Students Details */}
                    <div className="bg-gray-50 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">الحلقة القرآنية:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#006304]" />
                          {t.circleName}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-gray-400 block text-[10px]">عدد الطلاب:</span>
                        <span className="font-black text-[#006304] text-sm font-num flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5" />
                          {t.studentsCount} طلاب
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleRegeneratePassword(t)}
                        disabled={regeneratingId === t.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                        title="إعادة تعيين كلمة مرور مؤقتة للمعلم"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>{regeneratingId === t.id ? 'جاري التوليد...' : 'توليد كلمة مرور مؤقتة'}</span>
                      </button>

                      {!t.isDeactivated && (
                        <button
                          onClick={() => handleDeactivateTeacher(t)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                          title="تعطيل حساب المعلم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>تعطيل</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: ADD NEW TEACHER */}
        {currentSection === 'add_teacher' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] border-2 border-[#F9BF3B] text-[#006304] flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-slate-900 text-lg">
                    إضافة معلم جديد إلى المنصة
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    سيتم إنشاء حساب المعلم، وحلقته القرآنية، وتوليد كلمة مرور مؤقتة له تلقائياً.
                  </p>
                </div>
              </div>

              {/* Notice for GitHub Pages & Static Hosting */}
              <div className="mb-5 p-4 bg-amber-50/90 border-2 border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ملاحظة الاستضافة على GitHub Pages:</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  كافة الإحصائيات وقوائم المعلمين والطلاب وتوزيع الحلقات تُجلب وتُعرض مباشرةً من Supabase. أما إنشاء حسابات المعلمين وتوليد كلمات المرور فتتطلب صلاحيات مفتاح الخدمة الإداري (Service Role Key)، وتتم بأمان وسرعة من لوحة تحكم <strong>Supabase &gt; Authentication &gt; Users</strong> دون كشف المفتاح السري في المتصفح.
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-[11px] text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900">خطوات إضافة معلم جديد عبر لوحة Supabase:</div>
                  <div>1. في مشروعك في Supabase: اذهب إلى <strong>Authentication → Users → Add User</strong> وأدخل بريد المعلم وكلمة المرور.</div>
                  <div>2. في جدول <strong>profiles</strong>: عدّل قيمة <strong>role</strong> إلى <code>teacher</code> وحدد الجنس <code>male</code> أو <code>female</code>.</div>
                  <div>3. سيظهر المعلم فوراً في لوحة الإدارة هنا وتُحسب كافة إحصائياته تلقائياً!</div>
                </div>
              </div>

              {/* Success Result Box */}
              {createdTeacherResult && (
                <div className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>تم إنشاء حساب المعلم بنجاح!</span>
                  </div>

                  <p className="text-xs text-emerald-800 font-medium mb-3">
                    يرجى نسخ بيانات الدخول المؤقتة هذه وتسليمها للمعلم، حيث سيُطلب منه تغييرها عند أول تسجيل دخول:
                  </p>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">الاسم:</span>
                      <span className="font-bold text-slate-900">{createdTeacherResult.teacher?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                      <span className="font-bold text-slate-900 dir-ltr">{createdTeacherResult.teacher?.email}</span>
                    </div>
                    {createdTeacherResult.circleName && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">اسم الحلقة:</span>
                        <span className="font-bold text-[#006304]">{createdTeacherResult.circleName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-amber-800 font-bold">كلمة المرور المؤقتة:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-mono font-black text-sm tracking-wider">
                          {createdTeacherResult.temporaryPassword}
                        </code>
                        <button
                          onClick={() => handleCopy(createdTeacherResult.temporaryPassword)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPassword ? 'تم النسخ!' : 'نسخ'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Error */}
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* The Form */}
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                {/* Teacher Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل للمعلم / المعلمة:
                  </label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={e => setNewTeacherName(e.target.value)}
                    placeholder="مثال: الشيخ عبدالله المحمدي"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold focus:border-[#006304] focus:outline-hidden"
                    required
                    disabled={submittingTeacher}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني للمعلم (يُستخدم لتسجيل الدخول):
                  </label>
                  <input
                    type="email"
                    value={newTeacherEmail}
                    onChange={e => setNewTeacherEmail(e.target.value)}
                    placeholder="teacher@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold focus:border-[#006304] focus:outline-hidden dir-ltr text-right"
                    required
                    disabled={submittingTeacher}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الجنس (يحدد خصوصية الحلقة تلقائياً):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewTeacherGender('male')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        newTeacherGender === 'male'
                          ? 'border-[#006304] bg-[#F0F9F0] text-[#006304]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">👳</span>
                      <span>معلم (حلقات بنين)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTeacherGender('female')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        newTeacherGender === 'female'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">🧕</span>
                      <span>معلمة (حلقات بنات)</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    * ملاحظة: وفق ضوابط المنصة، حلقات المعلمة ستكون للطالبات الإناث فقط تلقائياً، وحلقات المعلم للطلاب الذكور.
                  </p>
                </div>

                {/* Circle Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الحلقة القرآنية التأسيسية (اختياري):
                  </label>
                  <input
                    type="text"
                    value={newTeacherCircleName}
                    onChange={e => setNewTeacherCircleName(e.target.value)}
                    placeholder={
                      newTeacherGender === 'female'
                        ? 'مثال: حلقة الفردوس للبنات'
                        : 'مثال: حلقة الإمام نافع للفتيان'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold focus:border-[#006304] focus:outline-hidden"
                    disabled={submittingTeacher}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    إذا تركت الحقل فارغاً، سيتم تسمية الحلقة تلقائياً باسم المعلم.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submittingTeacher}
                    className="w-full py-3 bg-[#006304] hover:bg-[#005003] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingTeacher ? (
                      <span>جاري إنشاء حساب المعلم والحلقة...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#F9BF3B]" />
                        <span>إنشاء حساب المعلم وتوليد كلمة المرور المؤقتة</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
