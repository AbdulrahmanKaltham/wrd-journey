import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { createTeacher, createStudent } from '../services/supabaseService';
import { supabase } from '../lib/supabaseClient';
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
} from 'lucide-react';

interface SignupPageProps {
  onBackToLogin?: () => void;
  onSuccess?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBackToLogin, onSuccess }) => {
  const { signUp, signOut, refreshProfile, triggerCelebration } = useSupabase();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleBackToLoginClick = async () => {
    // If a partial session without profile was created, sign out to ensure clean state
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
      setErrorMsg('يرجى كتابة الاسم الكريم');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن تكون 6 خانات على الأقل');
      return;
    }

    setLoading(true);
    console.log('🚀 [SignupFlow] Step 1: Initiating signup for:', { email: email.trim(), role, gender, name: name.trim() });

    try {
      // إنشاء الحساب والملف الشخصي في Supabase فقط (بدون حلقة)
      const signupRes = await signUp(email.trim(), password, {
        name: name.trim(),
        role,
        gender,
      });

      console.log('🎉 [SignupFlow] Signup completed successfully:', signupRes);
      setInfoMsg('تم إنشاء الحساب والملف الشخصي بنجاح!');
      if (triggerCelebration) triggerCelebration();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('❌ [SignupFlow] Error during signup:', error);
      const raw = error.message || '';
      const lower = raw.toLowerCase();
      if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already registered')) {
        setErrorMsg('هذا البريد الإلكتروني مسجل مسبقاً. يمكنك تسجيل الدخول مباشرة.');
      } else if (lower.includes('password should be at least') || lower.includes('weak_password')) {
        setErrorMsg('كلمة المرور يجب أن تتكون من 6 خانات على الأقل.');
      } else if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
        setErrorMsg('تم تجاوز حد إرسال رسائل التأكيد مؤقتاً. يرجى إيقاف تأكيد البريد (Confirm email) من إعدادات Supabase للسماح بالتسجيل الفوري غير المحدود.');
      } else if (lower.includes('valid email') || lower.includes('invalid email')) {
        setErrorMsg('يرجى إدخال عنوان بريد إلكتروني صحيح.');
      } else if (lower.includes('failed to fetch') || lower.includes('network')) {
        setErrorMsg('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
      } else {
        setErrorMsg(raw || 'حدث خطأ أثناء إنشاء الحساب. يرجى مراجعة البيانات والمحاولة مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex items-center justify-center p-4 font-arabic antialiased text-right">
      <div className="bg-white border-2 border-[#E0E0E0] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F9F0] border-2 border-[#006304] text-[#006304] flex items-center justify-center text-3xl mx-auto shadow-xs">
            🌱
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900">
            إنشاء حساب جديد في رحلة وِرد
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            انضم إلى مجتمع التلاوة والحفظ المتقن
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              الاسم الكامل:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="الاسم"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden"
                required
              />
              <User className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              البريد الإلكتروني:
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="البريد"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              كلمة المرور:
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">الدور:</label>
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
                <span>طالب</span>
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
                <span>معلم</span>
              </button>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">الجنس:</label>
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
                <span>ذكر</span>
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
                <span>أنثى</span>
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
            className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span>جاري إنشاء الحساب...</span>
            ) : (
              <>
                <span>إنشاء حساب</span>
                <Sparkles className="w-4 h-4 text-[#F9BF3B]" />
              </>
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
              <span>لديك حساب بالفعل؟ سجل دخولك</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
