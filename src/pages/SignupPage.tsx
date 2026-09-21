import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import {
  User,
  GraduationCap,
  BookOpen,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Globe,
} from 'lucide-react';

interface SignupPageProps {
  onBackToLogin?: () => void;
  onSuccess?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBackToLogin, onSuccess }) => {
  const { signUp, signOut, triggerCelebration, language, setLanguage, t } = useSupabase();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isRtl = language === 'ar';

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleBackToLoginClick = async () => {
    try {
      await signOut();
    } catch {}
    if (onBackToLogin) {
      onBackToLogin();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!name.trim()) {
      setErrorMsg(isRtl ? 'يرجى كتابة الاسم الكريم' : 'Please enter your name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg(isRtl ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(isRtl ? 'كلمة المرور يجب أن تكون 6 خانات على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password, {
        name: name.trim(),
        role,
        gender,
        track: 'juz_amma',
        language,
      });

      setInfoMsg(isRtl ? 'تم إنشاء الحساب والملف الشخصي بنجاح!' : 'Account created successfully!');
      if (triggerCelebration) triggerCelebration();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('❌ [SignupFlow] Error during signup:', error);
      const raw = error.message || error.error_description || (typeof error === 'string' ? error : '');
      const lower = raw.toLowerCase();
      if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already registered')) {
        setErrorMsg(isRtl ? 'هذا البريد الإلكتروني مسجل مسبقاً. يمكنك تسجيل الدخول مباشرة.' : 'Email is already registered. Please sign in directly.');
      } else if (lower.includes('password should be at least') || lower.includes('weak_password') || lower.includes('password is too short')) {
        setErrorMsg(isRtl ? 'كلمة المرور ضعيفة (يجب أن تتكون من 6 أحرف/أرقام على الأقل).' : 'Password is too short (minimum 6 characters).');
      } else if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
        setErrorMsg(isRtl ? 'تم تجاوز حد إرسال الرسائل مؤقتاً. يرجى المحاولة بعد قليل.' : 'Email rate limit exceeded. Please try again shortly.');
      } else if (lower.includes('valid email') || lower.includes('invalid email')) {
        setErrorMsg(isRtl ? 'البريد الإلكتروني المدخل غير صالح.' : 'Invalid email address.');
      } else if (raw) {
        setErrorMsg(raw);
      } else {
        setErrorMsg(isRtl ? 'حدث خطأ أثناء إنشاء الحساب.' : 'An error occurred during account creation.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col justify-center items-center py-6 px-4 font-arabic">
      {/* Language Switcher */}
      <div className="w-full max-w-sm flex justify-end mb-2">
        <button
          onClick={toggleLanguage}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-[#006304] hover:border-[#006304] transition-colors shadow-2xs cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F9F0] border-2 border-[#006304] text-[#006304] flex items-center justify-center text-2xl mx-auto shadow-2xs">
            🌱
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900">
            {t('signup')}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {t('appSubtitle')}
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 shadow-sm rounded-3xl border-2 border-gray-100 space-y-4">
          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              {t('name')}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isRtl ? 'الاسم الكامل' : 'Full Name'}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              {t('email')}
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">{t('role')}:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'student'
                    ? 'border-[#006304] bg-[#F0F9F0] text-[#006304] shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('role_student')}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 px-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'border-[#006304] bg-[#F0F9F0] text-[#006304] shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{t('role_teacher')}</span>
              </button>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">{t('gender')}:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 px-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'border-[#006304] bg-[#F0F9F0] text-[#006304] shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>👦</span>
                <span>{t('male')}</span>
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 px-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'border-[#006304] bg-[#F0F9F0] text-[#006304] shadow-xs'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>👧</span>
                <span>{t('female')}</span>
              </button>
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
            className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3 rounded-2xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span>{isRtl ? 'جاري إنشاء الحساب...' : 'Creating account...'}</span>
            ) : (
              <span>{t('signup')}</span>
            )}
          </button>
        </form>

        {onBackToLogin && (
          <div className="text-center pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBackToLoginClick}
              className="text-xs text-[#006304] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{t('alreadyHaveAccount')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
