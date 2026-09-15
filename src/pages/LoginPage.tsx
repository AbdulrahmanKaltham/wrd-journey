import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Mail, Lock, Sparkles, LogIn, AlertCircle, CheckCircle2, UserPlus, KeyRound, ArrowRight } from 'lucide-react';

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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    console.log('📤 [LoginPage] Submitting login form with:', { email: cleanEmail });

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await signIn(cleanEmail, cleanPassword);
      console.log('🎉 [LoginPage] Login succeeded!');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const cleanResetEmail = resetEmail.trim();

    if (!cleanResetEmail) {
      setResetError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setResetLoading(true);
    try {
      console.log('📤 [LoginPage] Requesting password reset for:', cleanResetEmail);
      const result = await resetPassword(cleanResetEmail);
      setResetSuccess(result.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      console.error('❌ [LoginPage] Password reset error:', err);
      setResetError(err.message || 'تعذر إرسال رابط إعادة التعيين. يرجى المحاولة لاحقاً.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (signInWithOAuth) {
        await signInWithOAuth('google');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg('تعذر تسجيل الدخول بحساب Google. يمكنك استخدام البريد وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex items-center justify-center p-4 font-arabic antialiased text-right">
      <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F9F0] border-2 border-[#006304] text-[#006304] flex items-center justify-center text-3xl mx-auto shadow-xs">
            🌱
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900">
            تسجيل الدخول إلى رحلة وِرد
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            متابعة رحلة حفظ وتلاوة كتاب الله تعالى
          </p>
        </div>

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-[#006304] text-slate-800 font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2.5 text-xs shadow-xs cursor-pointer active:scale-98"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>تسجيل الدخول بواسطة Google</span>
        </button>

        <div className="flex items-center my-1">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-[10px] text-gray-400 font-bold">
            أو بالبريد وكلمة المرور
          </span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              البريد الإلكتروني:
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">
                كلمة المرور:
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-[#006304] hover:underline font-bold cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span>جاري تسجيل الدخول...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>دخول للحساب</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Signup */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onGoToSignup}
            className="text-xs text-[#006304] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ليس لديك حساب؟ أنشئ حساباً جديداً</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-gray-200 space-y-4 text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#006304]" />
                <span>استعادة كلمة المرور</span>
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {resetError && (
                <div className="text-xs text-rose-700 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  {resetSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  {resetLoading ? 'جاري الإرسال...' : 'إرسال الرابط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
