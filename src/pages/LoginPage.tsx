import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  KeyRound,
  Shield,
  X,
} from 'lucide-react';
import { promoteUserToAdminInAPI } from '../services/supabaseService';

interface LoginPageProps {
  onGoToSignup?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoToSignup }) => {
  const { signIn, signInWithOAuth, resetPassword } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Admin Setup Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('quranum@um.edu.sa');
  const [adminPromoteLoading, setAdminPromoteLoading] = useState(false);
  const [adminPromoteMsg, setAdminPromoteMsg] = useState('');
  const [adminPromoteError, setAdminPromoteError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await signIn(cleanEmail, cleanPassword);
    } catch (err: any) {
      console.error('❌ [LoginPage] Caught login error:', err);
      const rawMsg = err.message || '';
      if (rawMsg.includes('Invalid login credentials') || rawMsg.includes('invalid_credentials')) {
        setErrorMsg('كلمة السر غير صحيحة أو البريد الإلكتروني غير مسجل.');
      } else if (rawMsg.includes('Email not confirmed') || rawMsg.includes('email_not_confirmed')) {
        setErrorMsg('يرجى تأكيد البريد الإلكتروني أولاً من خلال الرابط المرسل إلى بريدك.');
      } else if (rawMsg.includes('User not found') || rawMsg.includes('user_not_found')) {
        setErrorMsg('البريد الإلكتروني غير موجود. يمكنك إنشاء حساب جديد.');
      } else if (rawMsg.includes('Failed to fetch')) {
        setErrorMsg('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
      } else {
        setErrorMsg(rawMsg || 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithOAuth('google');
    } catch (err: any) {
      console.error('❌ [LoginPage] Google login error:', err);
      setErrorMsg(err.message || 'تعذر تسجيل الدخول بواسطة Google. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const cleanResetEmail = resetEmail.trim();

    if (!cleanResetEmail) {
      setResetError('يرجى كتابة البريد الإلكتروني');
      return;
    }

    setResetLoading(true);
    try {
      const res = await resetPassword(cleanResetEmail);
      setResetSuccess(res.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
      setResetEmail('');
    } catch (err: any) {
      setResetError(err.message || 'تعذر إرسال رابط الاستعادة. تأكد من صحة البريد.');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPromoteMsg('');
    setAdminPromoteError('');
    const cleanAdminEmail = adminEmail.trim();

    if (!cleanAdminEmail) {
      setAdminPromoteError('يرجى كتابة البريد الإلكتروني لحساب المدير');
      return;
    }

    setAdminPromoteLoading(true);
    try {
      const res = await promoteUserToAdminInAPI(cleanAdminEmail);
      if (res.success) {
        setAdminPromoteMsg(res.message || 'تم ترقية وتجهيز حساب المدير بنجاح!');
        setEmail(cleanAdminEmail);
      } else {
        setAdminPromoteError(res.error || 'تعذر ترقية الحساب');
      }
    } catch (err: any) {
      setAdminPromoteError(err.message || 'حدث خطأ أثناء الاتصال');
    } finally {
      setAdminPromoteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col justify-center items-center py-6 px-4 font-arabic antialiased text-slate-800" dir="rtl">
      {/* 1. Central Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100 max-w-sm w-full space-y-4">
        {/* 2. Logo (Sprout inside rounded square with green border) */}
        <div className="text-center pt-1">
          <div className="w-14 h-14 rounded-2xl border-2 border-[#006304] bg-white flex items-center justify-center mx-auto shadow-2xs">
            <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none">
              <path d="M50 82 Q49 55 52 40" stroke="#689F38" strokeWidth="5" strokeLinecap="round" />
              <path d="M52 48 C68 40 78 26 71 14 C59 14 52 28 50 42 Z" fill="#7CB342" />
              <path d="M50 56 C34 48 23 34 30 21 C42 21 49 35 52 49 Z" fill="#8BC34A" />
            </svg>
          </div>

          {/* 3. Main Title */}
          <h2 className="font-heading font-black text-xl text-slate-900 mt-3">
            تسجيل الدخول إلى رحلة وِرد
          </h2>

          {/* 4. Subtitle */}
          <p className="text-xs text-gray-500 font-medium mt-1">
            متابعة رحلة حفظ وتلاوة كتاب الله تعالى
          </p>
        </div>

        {/* Error / Info Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 text-right">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* 5. Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <span className="text-xs sm:text-sm">تسجيل الدخول بواسطة Google</span>
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </button>

        {/* 6. Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-gray-400 shrink-0 font-medium">
            أو بالبريد وكلمة المرور
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          {/* 7. Email Field */}
          <div className="space-y-1 text-right">
            <label className="text-[11px] font-bold text-slate-800 block">
              البريد الإلكتروني:
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full pr-3 pl-9 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-900 placeholder:text-gray-400 focus:border-[#006304] focus:outline-hidden text-right"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            </div>
          </div>

          {/* 8. Password Field */}
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[11px] font-bold text-slate-800">
                كلمة المرور:
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-[#006304] hover:underline cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-3 pl-9 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-900 placeholder:text-gray-400 focus:border-[#006304] focus:outline-hidden text-right"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            </div>
          </div>

          {/* 9. Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006304] hover:bg-[#005203] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 mt-1"
          >
            {loading ? (
              <span>جاري التحقق...</span>
            ) : (
              <>
                <span>دخول للحساب</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 10. Bottom Divider */}
        <div className="border-t border-gray-100 pt-2"></div>

        {/* 11. Create Account Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onGoToSignup}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#006304] hover:opacity-90 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>
              ليس لديك حساب؟ <span className="underline underline-offset-2">أنشئ حساباً جديداً</span>
            </span>
          </button>
        </div>

        {/* 12. Admin Link at Bottom */}
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="inline-flex items-center justify-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Shield className="w-3 h-3 text-amber-500/80 shrink-0" />
            <span>دخول أو تهيئة حساب مدير النظام (Admin)</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-gray-200 space-y-4 text-center text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-[#F0F9F0] text-[#006304] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">
              استعادة كلمة المرور
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
            </p>

            {resetSuccess && (
              <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-right">
                {resetSuccess}
              </div>
            )}

            {resetError && (
              <div className="text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-right">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-slate-900 focus:border-[#006304] focus:outline-hidden text-right"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-[#006304] hover:bg-[#005203] text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSuccess('');
                    setResetError('');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Setup & Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-gray-200 space-y-4 text-center text-slate-800 relative">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminPromoteMsg('');
                setAdminPromoteError('');
              }}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-black text-base text-slate-900">
              حساب مدير النظام (Admin)
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed text-right">
              حساب مدير النظام يتيح الوصول للوحة التحكم الشاملة، الإحصائيات، وإدارة الحلقات والمعلمين.
            </p>

            {adminPromoteMsg && (
              <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-right">
                {adminPromoteMsg}
              </div>
            )}

            {adminPromoteError && (
              <div className="text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-right">
                {adminPromoteError}
              </div>
            )}

            <form onSubmit={handlePromoteAdmin} className="space-y-3 text-right">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  البريد الإلكتروني للمدير:
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="quranum@um.edu.sa"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-right"
                  required
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={adminPromoteLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {adminPromoteLoading ? 'جاري التحقق والترقية...' : 'ترقية الحساب إلى مدير (Admin)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(adminEmail);
                    setShowAdminModal(false);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  استخدام هذا البريد لتسجيل الدخول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

