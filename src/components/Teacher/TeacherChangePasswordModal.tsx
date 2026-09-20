import React, { useState } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { Lock, Check, AlertCircle, Sparkles, KeyRound, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TeacherChangePasswordModalProps {
  onSuccess: () => void;
}

export const TeacherChangePasswordModal: React.FC<TeacherChangePasswordModalProps> = ({ onSuccess }) => {
  const { user, profile, signOut, refreshProfile } = useSupabase();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور المؤقتة الحالية للتأكيد.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('كلمة المرور الجديدة يجب أن تتكون من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('يجب اختيار كلمة مرور جديدة تختلف عن كلمة المرور المؤقتة.');
      return;
    }

    setLoading(true);

    try {
      const userEmail = user.email || profile?.email;
      if (!userEmail) {
        throw new Error('تعذر العثور على البريد الإلكتروني للحساب.');
      }

      // Step 1: Verify current temporary password by signing in
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword.trim(),
      });

      if (verifyErr) {
        throw new Error('كلمة المرور المؤقتة الحالية غير صحيحة. يرجى التحقق منها.');
      }

      // Step 2: Try Server-side update first
      let serverSuccess = false;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const res = await fetch('/api/admin/teacher-change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId: user.id || profile?.id,
            newPassword: newPassword.trim(),
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) serverSuccess = true;
        }
      } catch (e) {
        console.warn('Server password update endpoint notice, falling back to direct Supabase:', e);
      }

      // Step 3: Direct Supabase client update
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword.trim(),
        data: { must_change_password: false },
      });

      if (updateErr && !serverSuccess) {
        throw updateErr;
      }

      // Step 4: Clear local flags and notify
      try {
        const userId = user.id || profile?.id;
        if (userId) {
          localStorage.removeItem(`ward_teacher_must_change_pw_${userId}`);
        }
      } catch {}

      setSuccessMsg('تم تغيير كلمة المرور بنجاح! جاري تحويلك إلى لوحة المعلم...');
      
      setTimeout(async () => {
        await refreshProfile();
        onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error('❌ [TeacherChangePasswordModal] Error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 font-arabic antialiased animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#006304] relative">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8E7] border-2 border-[#F9BF3B] text-[#006304] flex items-center justify-center text-3xl mb-3 shadow-xs">
            <KeyRound className="w-8 h-8 text-[#006304]" />
          </div>
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            إجراء أمني إلزامي
          </span>
          <h2 className="font-heading font-black text-xl text-slate-900">
            تغيير كلمة المرور المؤقتة
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed max-w-sm">
            أهلاً بك يا فضيلة المعلم! لقد تم إنشاء حسابك بكلمة مرور مؤقتة، حفاظاً على أمان بياناتك وحلقاتك، يجب تعيين كلمة مرور جديدة وخاصة بك للمتابعة.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              كلمة المرور المؤقتة الحالية:
            </label>
            <div className="relative">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور التي سلّمها لك المدير"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
                disabled={loading}
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              كلمة المرور الجديدة:
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="6 خانات على الأقل (أحرف أو أرقام)"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
                disabled={loading}
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              تأكيد كلمة المرور الجديدة:
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة للتأكيد"
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-slate-900 focus:border-[#006304] focus:outline-hidden text-left dir-ltr"
                required
                disabled={loading}
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#006304] hover:bg-[#005003] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>جاري الحفظ والتأكيد...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F9BF3B]" />
                  <span>تأكيد وحفظ كلمة المرور الجديدة</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Logout Option */}
        <div className="mt-5 text-center pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => signOut()}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors font-bold cursor-pointer"
          >
            تسجيل الخروج والعودة لاحقاً ↩
          </button>
        </div>
      </div>
    </div>
  );
};
