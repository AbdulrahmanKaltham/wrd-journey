import React, { useState } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { UserRole, UserGender } from '../../types';
import {
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  Mail,
  Lock,
  Sparkles,
  X,
  User,
  GraduationCap,
  BookOpen,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  isAnonymous?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isAnonymous = true,
}) => {
  const {
    user,
    updateUserProfile,
    setActiveTab,
    triggerCelebration,
    signInWithPassword,
    signUpWithPassword,
    signOutUser,
  } = useSupabase();

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [gender, setGender] = useState<UserGender>('male');
  const [circleName, setCircleName] = useState('');
  const [joinCircleCode, setJoinCircleCode] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 1. Email & Password Auth via Supabase
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim()) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('يرجى كتابة الاسم');
      return;
    }
    if (mode === 'signup' && role === 'teacher' && !circleName.trim()) {
      setErrorMsg('يرجى إدخال اسم الحلقة القرآنية');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpWithPassword(
          email.trim(),
          password,
          name.trim(),
          role,
          gender,
          circleName.trim(),
          joinCircleCode.trim()
        );

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setInfoMsg('تم إنشاء الحساب ومزامنته مع Supabase بنجاح!');
          triggerCelebration();
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const res = await signInWithPassword(email.trim(), password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          triggerCelebration();
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setErrorMsg('حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Fast Demo / Guest Login
  const handleQuickGuestLogin = () => {
    updateUserProfile({
      displayName: 'طالب ورد',
      name: 'طالب ورد',
      role: 'student',
    });
    triggerCelebration();
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onClose();
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-arabic">
      <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-right max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F9F0] border-2 border-[#006304] text-[#006304] flex items-center justify-center text-xl mx-auto shadow-xs">
            🌱
          </div>
          <h3 className="font-heading font-black text-lg text-slate-900">
            {currentUserEmail
              ? 'إدارة حساب رحلة وِرد'
              : mode === 'signup'
              ? 'إنشاء حساب جديد في رحلة وِرد'
              : 'تسجيل الدخول إلى رحلة وِرد'}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            احفظ تقدمك وسلسلة إنجازك للوصول إليها من أي جهاز
          </p>
        </div>

        {/* Currently Authenticated State */}
        {currentUserEmail && !isAnonymous ? (
          <div className="bg-[#F0F9F0] border border-[#006304]/30 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#006304]">
              <ShieldCheck className="w-4 h-4 text-[#006304]" />
              <span>الحساب مسجل ومحفوظ بالسحابة</span>
            </div>
            <p className="text-xs text-slate-700 font-bold font-num bg-white py-1.5 px-3 rounded-xl border border-gray-200 dir-ltr inline-block">
              {currentUserEmail}
            </p>

            <button
              onClick={handleSignOut}
              className="w-full bg-rose-100 text-rose-800 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-2.5">
              {/* Signup Name */}
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    الاسم الكامل:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="مثال: عبدالله أحمد"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
                      required
                    />
                    <User className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  البريد الإلكتروني:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full pl-3 pr-8 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                    required
                  />
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-8 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Signup Role & Gender */}
              {mode === 'signup' && (
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      الدور:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`py-1.5 px-2 rounded-xl border-2 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          role === 'student'
                            ? 'border-[#006304] bg-[#F0F9F0] text-[#006304]'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>طالب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`py-1.5 px-2 rounded-xl border-2 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          role === 'teacher'
                            ? 'border-[#006304] bg-[#F0F9F0] text-[#006304]'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>معلم حلقة</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      الجنس:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-1.5 px-2 rounded-xl border-2 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          gender === 'male'
                            ? 'border-[#006304] bg-[#F0F9F0] text-[#006304]'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <span>👦</span>
                        <span>ذكر (بنين)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-1.5 px-2 rounded-xl border-2 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          gender === 'female'
                            ? 'border-[#006304] bg-[#F0F9F0] text-[#006304]'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <span>👧</span>
                        <span>أنثى (بنات)</span>
                      </button>
                    </div>
                  </div>

                  {role === 'teacher' && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <label className="text-[10px] font-bold text-amber-900 block">
                        اسم الحلقة القرآنية:
                      </label>
                      <input
                        type="text"
                        value={circleName}
                        onChange={e => setCircleName(e.target.value)}
                        placeholder="مثال: حلقة الشيخ أحمد"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
                        required
                      />
                    </div>
                  )}

                  {role === 'student' && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">
                        رمز الحلقة (اختياري):
                      </label>
                      <input
                        type="text"
                        value={joinCircleCode}
                        onChange={e => setJoinCircleCode(e.target.value)}
                        placeholder="WRD-101"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 font-num dir-ltr uppercase"
                      />
                    </div>
                  )}
                </div>
              )}

              {infoMsg && (
                <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="text-[11px] text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#006304] text-white font-bold py-3 rounded-2xl text-xs hover:bg-[#005103] transition-colors shadow-md mt-1 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'جاري المعالجة...' : mode === 'login' ? 'دخول للحساب' : 'إنشاء الحساب ومتابعة'}
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-[#006304] font-bold hover:underline cursor-pointer"
              >
                {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب بالفعل؟ سجل دخولك'}
              </button>

              <button
                type="button"
                onClick={handleQuickGuestLogin}
                className="text-gray-500 font-bold hover:text-slate-800 cursor-pointer"
              >
                متابعة كضيف ⚡
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
