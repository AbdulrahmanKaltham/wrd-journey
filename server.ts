import 'dotenv/config';
import express from 'express';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { WORLDS_DATA, WEEKS_DATA } from './src/data/quranJourneyData';
import { updateStreakOnActivity } from './src/services/streakService';

const SUPABASE_HOST = 'olhruwqwdiehbqwzbxso.supabase.co';
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saHJ1d3F3ZGllaGJxd3pieHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTg5NTIsImV4cCI6MjEwMjY5NDk1Mn0.LB2r-fNh3UoEwDAeeobEJJMoY5QroNY9owwhEH0lJiY').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

// UUID format validation helper
const isValidUUID = (str?: string | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

// Reliable native HTTPS request helper for Supabase
function supabaseRequest(
  pathName: string,
  options: { method?: string; body?: any; token?: string; prefer?: string; useServiceRole?: boolean } = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const activeKey = (options.useServiceRole && SUPABASE_SERVICE_ROLE_KEY) ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
    const headers: Record<string, string> = {
      'apikey': activeKey,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
    };
    if (options.useServiceRole && SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    } else if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    } else {
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }
    if (postData) {
      headers['Content-Length'] = String(Buffer.byteLength(postData));
    }

    const req = https.request(
      {
        hostname: SUPABASE_HOST,
        port: 443,
        path: pathName,
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          const statusCode = res.statusCode || 200;
          resolve({
            ok: statusCode >= 200 && statusCode < 300,
            status: statusCode,
            data: parsed,
          });
        });
      }
    );

    req.on('error', (err) => {
      console.error('[supabaseRequest Error]:', err.message);
      resolve({ ok: false, status: 500, data: { message: err.message } });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ----------------------------------------------------
  // Full-Stack Auth Proxy API (Eliminates Browser CORS & Sandbox Network Issues)
  // ----------------------------------------------------

  // 1. Login Proxy
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[API /api/auth/login] Attempting login for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    try {
      const authRes = await supabaseRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email: email.trim(), password: password.trim() },
      });

      if (!authRes.ok || !authRes.data?.user) {
        const errorMsg = authRes.data?.msg || authRes.data?.error_description || authRes.data?.message;
        console.warn(`[API /api/auth/login] Supabase Auth rejected:`, errorMsg);
        
        let friendlyMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        if (errorMsg === 'Email not confirmed') {
          friendlyMessage = 'يرجى تأكيد بريدك الإلكتروني أولاً.';
        }
        return res.status(400).json({ success: false, error: friendlyMessage });
      }

      const user = authRes.data.user;
      const accessToken = authRes.data.access_token;
      const session = {
        access_token: authRes.data.access_token,
        refresh_token: authRes.data.refresh_token,
        expires_in: authRes.data.expires_in,
        token_type: authRes.data.token_type,
        user,
      };

      // Fetch profile from profiles table
      const profileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${user.id}&select=*`, {
        token: accessToken,
      });

      let profile = Array.isArray(profileRes.data) && profileRes.data.length > 0 ? profileRes.data[0] : null;

      // If profile not created yet, create it on the fly
      if (!profile) {
        const metadata = user.user_metadata || {};
        const userRole = metadata.role || 'student';
        const userName = metadata.name || user.email?.split('@')[0] || 'مستخدم ورد';
        const userGender = metadata.gender || 'male';

        const newProfile = {
          id: user.id,
          email: user.email,
          name: userName,
          role: userRole,
          gender: userGender,
          circle_id: null,
          xp: 0,
          streak: 1,
          current_week: 1,
          completed_nodes: [],
          completed_weeks: [],
        };

        const createRes = await supabaseRequest('/rest/v1/profiles', {
          method: 'POST',
          token: accessToken,
          body: newProfile,
        });

        profile = createRes.ok && createRes.data ? (Array.isArray(createRes.data) ? createRes.data[0] : createRes.data) : newProfile;
      }

      console.log(`[API /api/auth/login] Login success for: ${user.id}`);
      return res.json({
        success: true,
        session,
        user,
        profile,
      });
    } catch (err: any) {
      console.error(`[API /api/auth/login] Internal error:`, err);
      return res.status(500).json({
        success: false,
        error: err.message || 'حدث خطأ في الاتصال بالخادم.',
      });
    }
  });

  // Password Reset Proxy
  app.post('/api/auth/reset-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني' });
    }
    try {
      const resetRes = await supabaseRequest('/auth/v1/recover', {
        method: 'POST',
        body: { email: email.trim() },
      });
      if (!resetRes.ok) {
        const errorMsg = resetRes.data?.msg || resetRes.data?.error_description || resetRes.data?.message;
        return res.status(400).json({ success: false, error: errorMsg || 'تعذر إرسال رابط الاستعادة' });
      }
      return res.json({ success: true, message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'حدث خطأ في الخادم' });
    }
  });

  // 2. Signup Proxy
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role = 'student', gender = 'male', circleName } = req.body;
    console.log(`\n========================================`);
    console.log(`📝 [API /api/auth/signup] Attempting signup for email: "${email}", name: "${name}", role: "${role}", gender: "${gender}"`);

    if (!email || !password || !name) {
      console.warn(`⚠️ [API /api/auth/signup] Missing required fields: email=${!!email}, password=${!!password}, name=${!!name}`);
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة (الاسم، البريد الإلكتروني، كلمة المرور)' });
    }

    try {
      console.log(`📡 [API /api/auth/signup] Sending signup request to Supabase Auth (/auth/v1/signup)...`);
      const signupRes = await supabaseRequest('/auth/v1/signup', {
        method: 'POST',
        body: {
          email: email.trim(),
          password: password.trim(),
          data: { name: name.trim(), role, gender, circleName },
        },
      });

      console.log(`📥 [API /api/auth/signup] Supabase Auth response status: ${signupRes.status}, ok: ${signupRes.ok}`);

      const user = signupRes.data?.user || (signupRes.data?.id ? signupRes.data : null);

      if (!signupRes.ok || !user) {
        const errorMsg = signupRes.data?.msg || signupRes.data?.error_description || signupRes.data?.message || (typeof signupRes.data === 'string' ? signupRes.data : '');
        console.error(`❌ [API /api/auth/signup] Supabase Auth rejected signup! Error:`, errorMsg, `Full payload:`, JSON.stringify(signupRes.data));
        
        let friendlyMsg = 'تعذر إنشاء الحساب. يرجى مراجعة البيانات.';
        const lowerMsg = (errorMsg || '').toLowerCase();
        if (lowerMsg.includes('already registered') || lowerMsg.includes('already exists') || lowerMsg.includes('user already registered')) {
          friendlyMsg = 'هذا البريد الإلكتروني مسجل مسبقاً. يمكنك تسجيل الدخول مباشرة.';
        } else if (lowerMsg.includes('rate limit') || lowerMsg.includes('over_email_send_rate_limit')) {
          friendlyMsg = 'تم تجاوز حد إرسال رسائل التأكيد مؤقتاً. يرجى إيقاف تأكيد البريد (Confirm email) من إعدادات Supabase للسماح بالتسجيل الفوري غير المحدود.';
        } else if (lowerMsg.includes('password should be at least') || lowerMsg.includes('weak_password')) {
          friendlyMsg = 'كلمة المرور ضعيفة أو قصيرة. يجب أن تكون 6 خانات على الأقل.';
        } else if (lowerMsg.includes('valid email') || lowerMsg.includes('invalid email') || lowerMsg.includes('unable to validate email')) {
          friendlyMsg = 'يرجى إدخال عنوان بريد إلكتروني صحيح.';
        } else if (errorMsg) {
          friendlyMsg = `خطأ في التسجيل: ${errorMsg}`;
        }
        return res.status(400).json({
          success: false,
          error: friendlyMsg,
          rawError: errorMsg,
          details: signupRes.data,
        });
      }

      console.log(`✅ [API /api/auth/signup] Supabase Auth user created successfully with ID: ${user.id}`);

      // Attempt immediate login to obtain access_token & session
      let accessToken = signupRes.data?.access_token || null;
      let session = signupRes.data?.access_token ? {
        access_token: signupRes.data.access_token,
        refresh_token: signupRes.data.refresh_token,
        expires_in: signupRes.data.expires_in,
        token_type: signupRes.data.token_type,
        user,
      } : null;

      if (!accessToken) {
        console.log(`🔑 [API /api/auth/signup] No access_token returned directly in signup, attempting password grant login...`);
        const loginAttempt = await supabaseRequest('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: { email: email.trim(), password: password.trim() },
        });

        if (loginAttempt.ok && loginAttempt.data?.access_token) {
          console.log(`✅ [API /api/auth/signup] Password grant login succeeded after signup.`);
          accessToken = loginAttempt.data.access_token;
          session = {
            access_token: loginAttempt.data.access_token,
            refresh_token: loginAttempt.data.refresh_token,
            expires_in: loginAttempt.data.expires_in,
            token_type: loginAttempt.data.token_type,
            user: loginAttempt.data.user || user,
          };
        } else {
          console.log(`ℹ️ [API /api/auth/signup] Direct login post-signup returned status: ${loginAttempt.status} (Confirm email might be required)`);
        }
      }

      // Upsert profile in profiles table with resolution on conflict
      const profileData = {
        id: user.id,
        email: email.trim(),
        name: name.trim(),
        role,
        gender,
        circle_id: null,
        xp: 0,
        streak: 1,
        current_week: 1,
        completed_nodes: [],
        completed_weeks: [],
      };

      console.log(`💾 [API /api/auth/signup] Upserting profile record into 'profiles' table for user: ${user.id}...`);
      const profileRes = await supabaseRequest('/rest/v1/profiles?on_conflict=id', {
        method: 'POST',
        token: accessToken || undefined,
        prefer: 'resolution=merge-duplicates,return=representation',
        body: profileData,
      });

      if (!profileRes.ok) {
        console.warn(`⚠️ [API /api/auth/signup] Profile upsert notice (status ${profileRes.status}):`, profileRes.data);
      } else {
        console.log(`✅ [API /api/auth/signup] Profile record saved/merged successfully.`);
      }

      console.log(`🎉 [API /api/auth/signup] Signup process completed successfully for: ${user.id} (${email})`);
      console.log(`========================================\n`);

      return res.json({
        success: true,
        session,
        user,
        profile: profileData,
      });
    } catch (err: any) {
      console.error(`❌ [API /api/auth/signup] Internal server error:`, err);
      return res.status(500).json({
        success: false,
        error: `حدث خطأ أثناء معالجة إنشاء الحساب: ${err.message || 'خطأ غير معروف'}`,
        details: err.message,
      });
    }
  });

  // 3. Get Profile Proxy
  app.get(['/api/auth/profile/:userId', '/api/profile/:userId'], async (req, res) => {
    const { userId } = req.params;
    try {
      console.log(`[API /api/profile] Fetching profile for user: ${userId}`);
      const profileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`);
      const profile = Array.isArray(profileRes.data) && profileRes.data.length > 0 ? profileRes.data[0] : null;

      if (!profile) {
        return res.status(404).json({ success: false, error: 'الملف الشخصي غير موجود' });
      }

      let circle = null;
      if (profile.circle_id) {
        const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${profile.circle_id}&select=*`);
        circle = Array.isArray(circleRes.data) && circleRes.data.length > 0 ? circleRes.data[0] : null;
      }

      return res.json({
        success: true,
        profile,
        circle,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3.1 Complete Node Endpoint (Persists progress to profiles table reliably with Service Role Key)
  app.post('/api/profile/complete-node', async (req, res) => {
    const {
      userId,
      nodeId,
      weekId = 1,
      xpGained = 15,
      currentStreak = 1,
    } = req.body;

    console.log(`🎯 [API /api/profile/complete-node] Request for user: ${userId}, node: ${nodeId}, xp: ${xpGained}`);

    if (!userId || !nodeId) {
      return res.status(400).json({ success: false, error: 'معرّف الطالب ومعرّف الدرس مطلوبان' });
    }

    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

    try {
      // 1. Fetch current profile
      const getProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken,
      });
      const profile = Array.isArray(getProfileRes.data) && getProfileRes.data.length > 0 ? getProfileRes.data[0] : null;

      if (!profile) {
        return res.status(404).json({ success: false, error: 'الملف الشخصي غير موجود' });
      }

      const existingCompletedNodes: string[] = Array.isArray(profile.completed_nodes)
        ? profile.completed_nodes
        : [];

      const isAlreadyCompleted = existingCompletedNodes.includes(nodeId);
      const newCompletedNodes = isAlreadyCompleted
        ? existingCompletedNodes
        : [...existingCompletedNodes, nodeId];

      const addedXp = isAlreadyCompleted ? Math.round(Number(xpGained || 15) * 0.2) : Number(xpGained || 15);
      const newXp = (Number(profile.xp) || 0) + addedXp;

      const updateData: any = {
        completed_nodes: newCompletedNodes,
        xp: newXp,
        streak: Number(currentStreak) || profile.streak || 1,
      };

      console.log(`🎯 [API /api/profile/complete-node] Saving updated completed_nodes for ${userId}:`, newCompletedNodes);

      const updateRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: updateData,
        useServiceRole: true,
        token: userToken,
      });

      if (!updateRes.ok) {
        console.error(`❌ [API /api/profile/complete-node] Update failed:`, updateRes);
        return res.status(500).json({ success: false, error: 'تعذر تحديث تقدم الطالب في قاعدة البيانات' });
      }

      // 2. Fetch updated profile to return
      const refetchedRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken,
      });
      const updatedProfile = Array.isArray(refetchedRes.data) && refetchedRes.data.length > 0 ? refetchedRes.data[0] : { ...profile, ...updateData };

      return res.json({
        success: true,
        message: 'تم حفظ التقدم بنجاح',
        profile: updatedProfile,
      });
    } catch (err: any) {
      console.error(`❌ [API /api/profile/complete-node] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3.1b Complete Week Endpoint (Marks gate node & week completed, unlocks next week)
  app.post('/api/profile/complete-week', async (req, res) => {
    const {
      userId,
      weekId,
      gateNodeId,
      xpEarned = 100,
      newCompletedWeeks,
      newCurrentWeek,
    } = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

    console.log(`🏆 [API /api/profile/complete-week] Request for user: ${userId}, week: ${weekId}, gate: ${gateNodeId}, xp: ${xpEarned}`);

    if (!userId || !weekId) {
      return res.status(400).json({ success: false, error: 'معرّف الطالب ورقم الأسبوع مطلوبان' });
    }

    try {
      // 1. Fetch current profile
      const getProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken,
      });
      const profile = Array.isArray(getProfileRes.data) && getProfileRes.data.length > 0 ? getProfileRes.data[0] : null;

      if (!profile) {
        return res.status(404).json({ success: false, error: 'الملف الشخصي غير موجود' });
      }

      // 2. Compute completed weeks
      const existingCompletedWeeks: number[] = Array.isArray(profile.completed_weeks)
        ? profile.completed_weeks
        : [];
      const numWeekId = Number(weekId);
      const updatedCompletedWeeks = Array.isArray(newCompletedWeeks)
        ? Array.from(new Set([...existingCompletedWeeks, ...newCompletedWeeks, numWeekId]))
        : existingCompletedWeeks.includes(numWeekId)
        ? existingCompletedWeeks
        : [...existingCompletedWeeks, numWeekId];

      // 3. Compute target next current week
      const targetNextWeek = Number(newCurrentWeek) || Math.max(Number(profile.current_week || 1), numWeekId + 1);

      // 4. Compute completed nodes (include gate node and all nodes of completed week)
      const existingCompletedNodes: string[] = Array.isArray(profile.completed_nodes)
        ? profile.completed_nodes
        : [];
      
      const targetGateNodeId = gateNodeId || `w${numWeekId}_gate`;
      const weekData = WEEKS_DATA.find(w => w.id === numWeekId);
      const weekNodeIds = weekData
        ? weekData.nodes.map(n => n.id)
        : [`w${numWeekId}_node_1`, `w${numWeekId}_node_2`, `w${numWeekId}_node_3`, `w${numWeekId}_node_4`, targetGateNodeId];

      const updatedCompletedNodes = Array.from(
        new Set([...existingCompletedNodes, targetGateNodeId, ...weekNodeIds])
      );

      // 5. Compute new XP
      const addedXp = Number(xpEarned || 100);
      const newXp = (Number(profile.xp) || 0) + addedXp;

      const updateData: any = {
        completed_weeks: updatedCompletedWeeks,
        current_week: targetNextWeek,
        completed_nodes: updatedCompletedNodes,
        xp: newXp,
      };

      console.log(`🏆 [API /api/profile/complete-week] Saving to profiles for ${userId}:`, updateData);

      const updateRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: updateData,
        useServiceRole: true,
        token: userToken,
      });

      if (!updateRes.ok) {
        console.error(`❌ [API /api/profile/complete-week] Update failed:`, updateRes);
        return res.status(500).json({ success: false, error: 'تعذر تحديث إكمال الأسبوع في قاعدة البيانات' });
      }

      // 6. Refetch updated profile to return
      const refetchedRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken,
      });
      const updatedProfile = Array.isArray(refetchedRes.data) && refetchedRes.data.length > 0
        ? refetchedRes.data[0]
        : { ...profile, ...updateData };

      return res.json({
        success: true,
        message: 'تم تسجيل إكمال الأسبوع وفتح الأسبوع التالي بنجاح',
        profile: updatedProfile,
      });
    } catch (err: any) {
      console.error(`❌ [API /api/profile/complete-week] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3.2 Update Profile Endpoint (Generic PATCH)
  app.patch('/api/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

    console.log(`📝 [API PATCH /api/profile/${userId}] Updating fields:`, Object.keys(updates));

    try {
      const updateRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: updates,
        useServiceRole: true,
        token: userToken,
      });

      if (!updateRes.ok) {
        return res.status(500).json({ success: false, error: 'تعذر تحديث الملف الشخصي' });
      }

      const refetched = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
        useServiceRole: true,
        token: userToken,
      });
      const updatedProfile = Array.isArray(refetched.data) && refetched.data.length > 0 ? refetched.data[0] : null;

      return res.json({
        success: true,
        profile: updatedProfile,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3.3 Reset Profile Progress Endpoint
  app.post('/api/profile/reset', async (req, res) => {
    const { userId } = req.body;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    console.log(`🔄 [API POST /api/profile/reset] Resetting all progress and wiping recordings for user:`, userId);

    if (!userId) {
      return res.status(400).json({ success: false, error: 'معرّف المستخدم مطلوب' });
    }

    try {
      const resetData = {
        completed_nodes: [],
        completed_weeks: [],
        xp: 0,
        streak: 1,
        current_week: 1,
      };

      // 1. Reset progress fields in profiles table (retaining circle_id & role)
      await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: resetData,
        token: userToken,
        useServiceRole: true,
      });

      // 2. Wipe ALL recordings / submissions for this student from DB completely
      let initialCount = 0;
      let deletedCount = 0;
      let remainingCount = 0;

      try {
        console.log(`🗑️ [API /api/profile/reset] Checking and deleting recordings for student: ${userId}`);

        // Query existing recordings first
        const countRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}&select=id,status`, {
          useServiceRole: true,
          token: userToken,
        });
        if (countRes.ok && Array.isArray(countRes.data)) {
          initialCount = countRes.data.length;
          console.log(`🗑️ [API /api/profile/reset] Found ${initialCount} recordings for student.`);
        }
        
        // 2a. Delete via service_role key (bypasses RLS)
        const delServiceRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}`, {
          method: 'DELETE',
          useServiceRole: true,
          prefer: 'return=representation',
        });
        if (delServiceRes.ok && Array.isArray(delServiceRes.data)) {
          deletedCount += delServiceRes.data.length;
        }

        // 2b. Delete via student_id query with user token
        const delUserRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}`, {
          method: 'DELETE',
          token: userToken,
          prefer: 'return=representation',
        });
        if (delUserRes.ok && Array.isArray(delUserRes.data)) {
          deletedCount += delUserRes.data.length;
        }

        // 2c. Also delete with anon key
        await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}`, {
          method: 'DELETE',
        });

        // 2d. Verify if any recordings still exist and purge them individually
        const checkRemaining = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}&select=id`, {
          useServiceRole: true,
          token: userToken,
        });

        if (checkRemaining.ok && Array.isArray(checkRemaining.data) && checkRemaining.data.length > 0) {
          console.log(`⚠️ [API /api/profile/reset] Purging remaining ${checkRemaining.data.length} recording rows individually...`);
          for (const item of checkRemaining.data) {
            if (item.id) {
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, { method: 'DELETE', useServiceRole: true });
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, { method: 'DELETE', token: userToken });
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, { method: 'DELETE' });
              // Also update status to 'deleted' and unlink student_id
              await supabaseRequest(`/rest/v1/recordings?id=eq.${item.id}`, {
                method: 'PATCH',
                body: { status: 'deleted', audio_url: null, student_id: null },
                useServiceRole: true,
                token: userToken,
              });
            }
          }

          // Final verification
          const finalCheck = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${userId}&select=id`, {
            useServiceRole: true,
            token: userToken,
          });
          remainingCount = (finalCheck.ok && Array.isArray(finalCheck.data)) ? finalCheck.data.length : 0;
        } else {
          remainingCount = 0;
        }
      } catch (delErr) {
        console.warn('⚠️ [API /api/profile/reset] Error wiping recordings for student:', delErr);
      }

      const refetched = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`, { useServiceRole: true, token: userToken });
      const updatedProfile = Array.isArray(refetched.data) && refetched.data.length > 0 ? refetched.data[0] : null;

      return res.json({
        success: true,
        message: 'تمت إعادة ضبط جميع بيانات الطالب ومسح كافة التسجيلات والتسميعات من قاعدة البيانات بنجاح',
        initialRecordings: initialCount,
        remainingRecordings: remainingCount,
        profile: updatedProfile,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3.4 Submissions & Recordings Store & Endpoints
  // All recitation submissions and reviews are persisted directly to Supabase DB

  // Helper to load submissions for teachers strictly from Supabase DB
  app.get('/api/submissions/teacher/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

    try {
      console.log(`🎙️ [API /api/submissions/teacher] Loading submissions from DB for teacher: ${teacherId}`);
      
      // Step 1: Find circles for this teacher
      const circlesRes = await supabaseRequest(`/rest/v1/circles?teacher_id=eq.${teacherId}&select=id,name`, { token: userToken });
      const circleIds: string[] = Array.isArray(circlesRes.data) ? circlesRes.data.map((c: any) => c.id).filter(Boolean) : [];

      // Step 2: Find all students belonging to this teacher or circles
      const studentNameMap = new Map<string, string>();
      const studentCircleMap = new Map<string, string>();
      const studentIds: string[] = [];
      try {
        let studentQuery = `/rest/v1/profiles?role=eq.student&select=id,name,circle_id,teacher_id`;
        if (isValidUUID(teacherId)) {
          studentQuery = `/rest/v1/profiles?role=eq.student&or=(teacher_id.eq.${teacherId}${circleIds.length > 0 ? `,circle_id.in.(${circleIds.join(',')})` : ''})&select=id,name,circle_id,teacher_id`;
        }
        const profRes = await supabaseRequest(studentQuery, { token: userToken });
        if (profRes.ok && Array.isArray(profRes.data)) {
          profRes.data.forEach((p: any) => {
            if (p.id) {
              studentIds.push(p.id);
              if (p.name) studentNameMap.set(p.id, p.name);
              if (p.circle_id) studentCircleMap.set(p.id, p.circle_id);
            }
          });
        }
      } catch (e) {}

      // If the teacher has no students and no circles, return empty array immediately
      if (studentIds.length === 0 && circleIds.length === 0) {
        console.log(`🎙️ [API /api/submissions/teacher] Teacher ${teacherId} has no assigned students or circles yet.`);
        return res.json({
          success: true,
          submissions: [],
        });
      }

      // Step 3: Query recordings table strictly for this teacher's students or circles
      let dbRecordings: any[] = [];
      try {
        let recQuery = '';
        if (studentIds.length > 0 && circleIds.length > 0) {
          recQuery = `/rest/v1/recordings?or=(student_id.in.(${studentIds.join(',')}),circle_id.in.(${circleIds.join(',')}))&select=*&order=created_at.desc`;
        } else if (studentIds.length > 0) {
          recQuery = `/rest/v1/recordings?student_id=in.(${studentIds.join(',')})&select=*&order=created_at.desc`;
        } else if (circleIds.length > 0) {
          recQuery = `/rest/v1/recordings?circle_id=in.(${circleIds.join(',')})&select=*&order=created_at.desc`;
        }

        if (recQuery) {
          const recRes = await supabaseRequest(recQuery, { token: userToken });
          if (recRes.ok && Array.isArray(recRes.data)) {
            // Filter out deleted recordings or recordings not in studentIds
            dbRecordings = recRes.data.filter(
              (r: any) => r && r.student_id && studentIds.includes(r.student_id) && r.status !== 'deleted' && r.status !== 'cancelled_reset'
            );
          }
        }
      } catch (e) {
        console.warn('Recordings table query notice:', e);
      }

      // Helper to resolve week, node and surah details
      const resolveSubmissionDetails = (nodeId?: string, weekId?: number) => {
        let matchedWeek = WEEKS_DATA.find(w => w.nodes.some(n => n.id === nodeId));
        let matchedNode = matchedWeek?.nodes.find(n => n.id === nodeId);

        if (!matchedWeek && nodeId) {
          const m = nodeId.match(/w(\d+)/i);
          if (m) {
            const wNum = parseInt(m[1], 10);
            matchedWeek = WEEKS_DATA.find(w => w.id === wNum || w.weekNumber === wNum);
            matchedNode = matchedWeek?.nodes.find(n => n.id === nodeId) || matchedWeek?.nodes.find(n => n.type === 'recite');
          }
        }

        if (!matchedWeek && weekId) {
          matchedWeek = WEEKS_DATA.find(w => w.id === weekId);
          matchedNode = matchedWeek?.nodes.find(n => n.id === nodeId) || matchedWeek?.nodes.find(n => n.type === 'recite');
        }

        const resolvedWeekId = matchedWeek?.id || weekId || 1;
        const weekTitle = matchedWeek?.title || `الأسبوع ${resolvedWeekId}`;
        const nodeTitle = matchedNode?.title || (matchedNode?.type === 'recite' ? 'تسميع واعتماد' : 'تسميع السور المقررة');
        const surahsList = (matchedNode?.surahsList && matchedNode.surahsList.length > 0)
          ? matchedNode.surahsList
          : (matchedWeek?.surahs && matchedWeek.surahs.length > 0)
          ? matchedWeek.surahs
          : [];
        const surahName = matchedNode?.surahName || (surahsList.length > 0 ? surahsList.join('، ') : '');
        const nodeDescription = matchedNode?.description || (surahsList.length > 0 ? `تسميع وتلاوة سور الأسبوع المقررة (${surahsList.join('، ')}) والتأكد من ضبط التلاوة والأحكام.` : '');

        return {
          weekId: resolvedWeekId,
          weekTitle,
          nodeTitle,
          surahName,
          surahsList,
          nodeDescription,
        };
      };

      // Map Supabase DB recordings to NodeSubmission objects
      const allSubmissions = dbRecordings.map((rec: any) => {
        const studentName = studentNameMap.get(rec.student_id) || 'طالب قرآن';
        const circleId = rec.circle_id || studentCircleMap.get(rec.student_id) || '';
        const details = resolveSubmissionDetails(rec.node_id, rec.week_id);

        return {
          id: rec.id || `${rec.student_id}_${rec.node_id}`,
          studentId: rec.student_id,
          studentName,
          circleId,
          teacherId,
          nodeId: rec.node_id,
          weekId: details.weekId,
          weekTitle: details.weekTitle,
          nodeTitle: rec.node_title || details.nodeTitle,
          surahName: details.surahName,
          surahsList: details.surahsList,
          nodeDescription: details.nodeDescription,
          type: rec.type || (rec.audio_url ? 'recording' : 'halaqah'),
          audioUrl: rec.audio_url || '',
          status: rec.status === 'approved' ? 'approved' : rec.status === 'reviewed' ? 'reviewed' : 'pending_teacher_review',
          teacherNotes: rec.teacher_notes || '',
          rating: rec.rating || (rec.status === 'approved' ? 'ممتاز 🌟' : rec.status === 'reviewed' ? 'يحتاج تدريب 🔄' : ''),
          submittedAt: rec.created_at || new Date().toISOString(),
          reviewedAt: rec.updated_at || undefined,
        };
      }).sort(
        (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
      );

      console.log(`🎙️ [API /api/submissions/teacher] Loaded ${allSubmissions.length} submissions directly from Supabase DB for teacher ${teacherId}`);

      return res.json({
        success: true,
        submissions: allSubmissions,
      });
    } catch (err: any) {
      console.error(`🎙️ [API /api/submissions/teacher] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Student Submissions Endpoint - Loaded directly from Supabase DB
  app.get('/api/submissions/student/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

    try {
      const dbRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&select=*&order=created_at.desc`, { token: userToken });
      const recordingsList = (dbRes.ok && Array.isArray(dbRes.data)) ? dbRes.data : [];

      const submissions = recordingsList.map((rec: any) => {
        let matchedWeek = WEEKS_DATA.find(w => w.nodes.some(n => n.id === rec.node_id));
        let matchedNode = matchedWeek?.nodes.find(n => n.id === rec.node_id);
        if (!matchedWeek && rec.node_id) {
          const m = rec.node_id.match(/w(\d+)/i);
          if (m) {
            const wNum = parseInt(m[1], 10);
            matchedWeek = WEEKS_DATA.find(w => w.id === wNum || w.weekNumber === wNum);
            matchedNode = matchedWeek?.nodes.find(n => n.id === rec.node_id) || matchedWeek?.nodes.find(n => n.type === 'recite');
          }
        }
        const resolvedWeekId = matchedWeek?.id || rec.week_id || 1;
        const weekTitle = matchedWeek?.title || `الأسبوع ${resolvedWeekId}`;
        const nodeTitle = rec.node_title || matchedNode?.title || (matchedNode?.type === 'recite' ? 'تسميع واعتماد' : 'تسميع السور المقررة');
        const surahsList = (matchedNode?.surahsList && matchedNode.surahsList.length > 0)
          ? matchedNode.surahsList
          : (matchedWeek?.surahs && matchedWeek.surahs.length > 0)
          ? matchedWeek.surahs
          : [];
        const surahName = matchedNode?.surahName || (surahsList.length > 0 ? surahsList.join('، ') : '');
        const nodeDescription = matchedNode?.description || (surahsList.length > 0 ? `تسميع وتلاوة سور الأسبوع المقررة (${surahsList.join('، ')}) والتأكد من ضبط التلاوة والأحكام.` : '');

        return {
          id: rec.id || `${rec.student_id}_${rec.node_id}`,
          studentId: rec.student_id,
          circleId: rec.circle_id,
          nodeId: rec.node_id,
          weekId: resolvedWeekId,
          weekTitle,
          nodeTitle,
          surahName,
          surahsList,
          nodeDescription,
          type: rec.type || (rec.audio_url ? 'recording' : 'halaqah'),
          audioUrl: rec.audio_url || '',
          status: rec.status === 'approved' ? 'approved' : rec.status === 'reviewed' ? 'reviewed' : 'pending_teacher_review',
          teacherNotes: rec.teacher_notes || '',
          rating: rec.rating || (rec.status === 'approved' ? 'ممتاز 🌟' : rec.status === 'reviewed' ? 'يحتاج تدريب 🔄' : ''),
          submittedAt: rec.created_at,
          reviewedAt: rec.updated_at || undefined,
        };
      });

      return res.json({
        success: true,
        submissions,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Submit Node for Review (Student submits halaqah or self recording)
  app.post('/api/submissions/submit', async (req, res) => {
    try {
      const {
        studentId,
        studentName,
        circleId,
        teacherId,
        nodeId,
        weekId,
        nodeTitle,
        surahName,
        surahsList,
        type,
        audioUrl,
        audioData,
      } = req.body;

      const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

      console.log('📤 [API POST /api/submissions/submit] Submission received for DB save:', {
        studentId,
        studentName,
        nodeId,
        circleId,
        type,
      });

      if (!studentId || !nodeId) {
        return res.status(400).json({
          success: false,
          error: 'بيانات ناقصة: studentId و nodeId مطلوبان',
        });
      }

      let finalCircleId = circleId;
      let finalTeacherId = teacherId;
      let finalStudentName = studentName;

      try {
        const profRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}&select=circle_id,teacher_id,name`, { token: userToken });
        if (profRes.ok && Array.isArray(profRes.data) && profRes.data.length > 0) {
          const prof = profRes.data[0];
          if (!finalCircleId) finalCircleId = prof.circle_id;
          if (!finalTeacherId) finalTeacherId = prof.teacher_id;
          if (!finalStudentName) finalStudentName = prof.name;
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch profile details in submission:', err);
      }

      if (!finalTeacherId && finalCircleId && isValidUUID(finalCircleId)) {
        try {
          const circRes = await supabaseRequest(`/rest/v1/circles?id=eq.${finalCircleId}&select=teacher_id`, { token: userToken });
          if (circRes.ok && Array.isArray(circRes.data) && circRes.data.length > 0) {
            finalTeacherId = circRes.data[0].teacher_id;
          }
        } catch (e) {}
      }

      const generatedId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let savedRecordingId = generatedId;

      // 1. Save or update directly in Supabase 'recordings' table
      const recordingPayload: Record<string, any> = {
        student_id: studentId,
        node_id: nodeId,
        audio_url: audioUrl || audioData || '',
        status: 'pending',
        teacher_notes: null,
        type: type || (audioUrl ? 'recording' : 'halaqah'),
        node_title: nodeTitle || 'تسميع السور المقررة',
        surah_name: surahName || '',
        surahs_list: surahsList || [],
      };

      if (isValidUUID(finalCircleId)) {
        recordingPayload.circle_id = finalCircleId;
      }

      // Check if an existing recording exists for this student & node to update it or insert
      try {
        const checkExisting = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}&select=id`, { token: userToken });
        if (checkExisting.ok && Array.isArray(checkExisting.data) && checkExisting.data.length > 0) {
          const existingId = checkExisting.data[0].id;
          savedRecordingId = existingId;
          await supabaseRequest(`/rest/v1/recordings?id=eq.${existingId}`, {
            method: 'PATCH',
            body: recordingPayload,
            token: userToken,
          });
          console.log(`✅ [API /api/submissions/submit] Existing DB recording updated: ${existingId}`);
        } else {
          const insertRes = await supabaseRequest('/rest/v1/recordings', {
            method: 'POST',
            body: recordingPayload,
            token: userToken,
          });
          if (insertRes.ok) {
            const recData = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
            if (recData?.id) savedRecordingId = recData.id;
            console.log(`✅ [API /api/submissions/submit] New DB recording inserted: ${savedRecordingId}`);
          }
        }
      } catch (dbErr) {
        console.warn('⚠️ [API /api/submissions/submit] Exception while saving to DB recordings table:', dbErr);
      }

      const newSubmission = {
        id: savedRecordingId,
        studentId,
        studentName: finalStudentName || 'طالب قرآن',
        circleId: finalCircleId || '',
        teacherId: finalTeacherId || '',
        nodeId,
        weekId: weekId || 1,
        nodeTitle: nodeTitle || 'تسميع السور المقررة',
        surahName: surahName || '',
        surahsList: surahsList || [],
        type: type || 'recording',
        audioUrl: audioUrl || audioData || '',
        status: 'pending_teacher_review',
        teacherNotes: '',
        rating: '',
        submittedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: 'تم إرسال التسميع إلى المعلم وحفظه في قاعدة البيانات بنجاح',
        submission: newSubmission,
      });

    } catch (err: any) {
      console.error('❌ [API /api/submissions/submit] Unhandled error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'حدث خطأ أثناء إرسال التسجيل إلى قاعدة البيانات',
      });
    }
  });

  // Review Submission (Teacher gives notes, rating, and approves or requests revision in Supabase DB)
  app.post('/api/submissions/review', async (req, res) => {
    const {
      submissionId,
      studentId,
      nodeId,
      status = 'approved', // 'approved' | 'reviewed' | 'needs_practice'
      teacherNotes = '',
      rating = 'ممتاز 🌟',
      xpReward = 25,
      weekId = 1,
    } = req.body;

    const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const finalNotes = (teacherNotes || '').trim();
    const finalRating = (rating || (status === 'approved' ? 'ممتاز 🌟' : 'يحتاج تدريب 🔄')).trim();

    console.log(`📝 [API POST /api/submissions/review] Saving teacher review to Supabase DB:`, {
      submissionId,
      studentId,
      nodeId,
      status,
      finalRating,
      notesLength: finalNotes.length,
    });

    if (!studentId || !nodeId) {
      return res.status(400).json({ success: false, error: 'معرّف الطالب والمحطة مطلوبان' });
    }

    try {
      const dbStatus = status === 'approved' ? 'approved' : 'reviewed';
      let rowsUpdated = false;

      // 1. Update recordings table directly in Supabase
      try {
        // 1a. If specific submissionId is provided and not composite, try by ID first
        if (submissionId && !submissionId.includes('_') && isValidUUID(submissionId)) {
          const updateByIdRes = await supabaseRequest(`/rest/v1/recordings?id=eq.${submissionId}`, {
            method: 'PATCH',
            body: {
              status: dbStatus,
              teacher_notes: finalNotes,
              rating: finalRating,
            },
            useServiceRole: true,
            token: userToken,
            prefer: 'return=representation',
          });
          if (updateByIdRes.ok && Array.isArray(updateByIdRes.data) && updateByIdRes.data.length > 0) {
            rowsUpdated = true;
            console.log(`✅ [API /api/submissions/review] Recording updated by ID: ${submissionId}`);
          }
        }

        // 1b. Update by student_id and node_id
        if (!rowsUpdated) {
          const updateRecRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}`, {
            method: 'PATCH',
            body: {
              status: dbStatus,
              teacher_notes: finalNotes,
              rating: finalRating,
            },
            useServiceRole: true,
            token: userToken,
            prefer: 'return=representation',
          });

          if (updateRecRes.ok && Array.isArray(updateRecRes.data) && updateRecRes.data.length > 0) {
            rowsUpdated = true;
            console.log(`✅ [API /api/submissions/review] Recording updated by student_id & node_id for student ${studentId}`);
          } else if (!updateRecRes.ok) {
            // Fallback retry with minimal fields
            console.warn('⚠️ [API /api/submissions/review] Retrying recording update with minimal fields:', updateRecRes.data);
            const retryRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}`, {
              method: 'PATCH',
              body: {
                status: dbStatus,
                teacher_notes: finalNotes,
              },
              useServiceRole: true,
              token: userToken,
              prefer: 'return=representation',
            });
            if (retryRes.ok && Array.isArray(retryRes.data) && retryRes.data.length > 0) {
              rowsUpdated = true;
            }
          }
        }

        // 1c. If still no existing row found in DB, insert an entry to record the approved submission
        if (!rowsUpdated) {
          console.log(`ℹ️ [API /api/submissions/review] No existing recording row found; creating new row in DB for student ${studentId}, node ${nodeId}`);
          await supabaseRequest('/rest/v1/recordings', {
            method: 'POST',
            body: {
              student_id: studentId,
              node_id: nodeId,
              status: dbStatus,
              teacher_notes: finalNotes,
              rating: finalRating,
              type: 'halaqah',
            },
            useServiceRole: true,
            token: userToken,
          });
        }
      } catch (recErr) {
        console.warn('⚠️ [API /api/submissions/review] Error updating recordings table:', recErr);
      }

      // 2. If approved, update student profile in Supabase DB (completed_nodes & XP)
      if (status === 'approved') {
        try {
          const studentProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}&select=*`, {
            useServiceRole: true,
            token: userToken,
          });
          if (studentProfileRes.ok && Array.isArray(studentProfileRes.data) && studentProfileRes.data.length > 0) {
            const profile = studentProfileRes.data[0];
            const existingNodes: string[] = Array.isArray(profile.completed_nodes) ? profile.completed_nodes : [];
            const newNodes = existingNodes.includes(nodeId) ? existingNodes : [...existingNodes, nodeId];
            const newXp = (profile.xp || 0) + xpReward;

            await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}`, {
              method: 'PATCH',
              body: {
                completed_nodes: newNodes,
                xp: newXp,
              },
              useServiceRole: true,
              token: userToken,
            });
            console.log(`✅ [API /api/submissions/review] Student ${studentId} marked completed for node ${nodeId} in DB. XP: ${newXp}`);
          }
        } catch (profErr) {
          console.warn('Notice updating student profile on review:', profErr);
        }
      }

      const updatedSubmission = {
        id: submissionId || `${studentId}_${nodeId}`,
        studentId,
        nodeId,
        weekId,
        type: req.body.type || 'recording',
        status: dbStatus,
        teacherNotes: finalNotes,
        rating: finalRating,
        reviewedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: status === 'approved' ? 'تم اعتماد التسميع وحفظ الملاحظات في قاعدة البيانات بنجاح' : 'تم حفظ الملاحظات وتوجيهات التدريب في قاعدة البيانات',
        submission: updatedSubmission,
      });
    } catch (err: any) {
      console.error('Error reviewing submission:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Switch Recitation Method (between self-recording and in-halaqah)
  app.post('/api/submissions/switch-type', async (req, res) => {
    try {
      const { studentId, nodeId, newType } = req.body;
      const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (!studentId || !nodeId || !newType) {
        return res.status(400).json({ success: false, error: 'studentId و nodeId و newType مطلوبان' });
      }

      if (newType !== 'halaqah' && newType !== 'recording') {
        return res.status(400).json({ success: false, error: 'نوع التسميع غير صالح' });
      }

      console.log(`🔄 [API POST /api/submissions/switch-type] Switching recitation for student ${studentId}, node ${nodeId} to ${newType}`);

      // 1. Fetch current recording row from Supabase if studentId is UUID
      if (isValidUUID(studentId)) {
        try {
          const checkRes = await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}&select=*`, {
            useServiceRole: true,
            token: userToken,
          });

          if (!checkRes.ok || !Array.isArray(checkRes.data) || checkRes.data.length === 0) {
            console.log(`ℹ️ No existing recording row found to switch for ${studentId} & ${nodeId} - inserting new record`);
            let circleId: string | null = null;
            try {
              const profRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}&select=circle_id`, { useServiceRole: true, token: userToken });
              if (profRes.ok && Array.isArray(profRes.data) && profRes.data.length > 0) {
                circleId = profRes.data[0].circle_id;
              }
            } catch (e) {}

            const insertPayload: Record<string, any> = {
              student_id: studentId,
              node_id: nodeId,
              type: newType,
              status: 'pending',
              audio_url: '',
              updated_at: new Date().toISOString(),
            };
            if (circleId && isValidUUID(circleId)) {
              insertPayload.circle_id = circleId;
            }

            await supabaseRequest('/rest/v1/recordings', {
              method: 'POST',
              body: insertPayload,
              useServiceRole: true,
              token: userToken,
            });
            console.log(`✅ [API /api/submissions/switch-type] Inserted new ${newType} submission row for student ${studentId}`);
          } else {
            const rec = checkRes.data[0];
            if (rec.status === 'approved') {
              return res.status(400).json({ success: false, error: 'تم اعتماد هذا التسميع مسبقاً ولا يمكن تبديل طريقته' });
            }

            // Update the recording row
            const patchPayload: Record<string, any> = {
              type: newType,
              status: 'pending',
              updated_at: new Date().toISOString(),
            };
            if (newType === 'halaqah') {
              patchPayload.audio_url = '';
            }

            await supabaseRequest(`/rest/v1/recordings?id=eq.${rec.id}`, {
              method: 'PATCH',
              body: patchPayload,
              useServiceRole: true,
              token: userToken,
            });

            console.log(`✅ [API /api/submissions/switch-type] Switched submission ${rec.id} to ${newType}`);
          }
        } catch (dbErr) {
          console.warn('⚠️ [API /api/submissions/switch-type] Exception during DB switch:', dbErr);
        }
      }

      return res.json({
        success: true,
        message: `تم تبديل طريقة التسميع إلى ${newType === 'halaqah' ? 'التسميع في الحلقة' : 'التسجيل الذاتي'} بنجاح`,
        newType,
      });
    } catch (err: any) {
      console.error('❌ [API /api/submissions/switch-type] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mark Student Absent in Halaqah (removes the halaqah submission so student can choose again)
  app.post('/api/submissions/mark-absent', async (req, res) => {
    try {
      const { studentId, nodeId, submissionId } = req.body;
      const userToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (!studentId && !submissionId) {
        return res.status(400).json({ success: false, error: 'بيانات غير كافية لتسجيل الغياب' });
      }

      console.log(`📋 [API /api/submissions/mark-absent] Marking student ${studentId} absent for node ${nodeId}`);

      // Delete the recording entry from Supabase so the student is freed to pick again
      if (submissionId && !submissionId.includes('_') && isValidUUID(submissionId)) {
        await supabaseRequest(`/rest/v1/recordings?id=eq.${submissionId}`, {
          method: 'DELETE',
          useServiceRole: true,
          token: userToken,
        });
      } else if (studentId && nodeId) {
        await supabaseRequest(`/rest/v1/recordings?student_id=eq.${studentId}&node_id=eq.${nodeId}`, {
          method: 'DELETE',
          useServiceRole: true,
          token: userToken,
        });
      }

      return res.json({
        success: true,
        message: 'تم تسجيل غياب الطالب بنجاح، وأصبح بإمكانه اختيار التسميع مجدداً في يوم آخر',
      });
    } catch (err: any) {
      console.error('❌ [API /api/submissions/mark-absent] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Circles API Endpoints
  const DEFAULT_SYSTEM_CIRCLES = [
    {
      id: 'circ_male_101',
      name: 'حلقة الإتقان والترتيل (بنين)',
      code: 'WRD-101',
      teacherId: 'teacher_ahmed',
      teacherName: 'الشيخ د. أحمد المنشاوي',
      gender: 'male',
      studentIds: [],
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'circ_male_102',
      name: 'حلقة الفرقان لتحفيظ جزء عم (بنين)',
      code: 'WRD-102',
      teacherId: 'teacher_ibrahim',
      teacherName: 'الشيخ إبراهيم السعدي',
      gender: 'male',
      studentIds: [],
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'circ_female_201',
      name: 'حلقة حافظات الفرقان (بنات)',
      code: 'WRD-201',
      teacherId: 'teacher_maryam',
      teacherName: 'الأستاذة مريم الصالح',
      gender: 'female',
      studentIds: [],
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'circ_female_202',
      name: 'حلقة ترتيل القرآن الكريم (بنات)',
      code: 'WRD-202',
      teacherId: 'teacher_fatima',
      teacherName: 'الأستاذة فاطمة الزهراء',
      gender: 'female',
      studentIds: [],
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  // Single Circle Details
  app.get('/api/circles/:circleId', async (req, res) => {
    const { circleId } = req.params;
    try {
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        const c = circleRes.data[0];
        return res.json({
          success: true,
          circle: {
            id: c.id,
            name: c.name,
            code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101'),
            teacherId: c.teacher_id,
            teacherName: c.teacher_name,
            gender: c.gender,
            studentIds: c.student_ids || [],
            isActive: c.is_active !== false,
            createdAt: c.created_at,
          },
        });
      }

      // Check default system circles
      const defMatch = DEFAULT_SYSTEM_CIRCLES.find(c => c.id === circleId || c.code.toLowerCase() === circleId.toLowerCase());
      if (defMatch) {
        return res.json({ success: true, circle: defMatch });
      }

      return res.status(404).json({ success: false, error: 'لم يتم العثور على الحلقة' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fast Batch: Student Circle Info + Teacher Real Profile Name in 1 shot
  app.get('/api/student/circle-info/:circleId', async (req, res) => {
    const { circleId } = req.params;
    try {
      console.log(`⚡ [API /api/student/circle-info] Fetching circle + teacher info for: ${circleId}`);
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        const c = circleRes.data[0];
        const teacherId = c.teacher_id;
        let teacherName = c.teacher_name;

        if (teacherId) {
          const teacherProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=id,name,role,gender`);
          if (teacherProfileRes.ok && Array.isArray(teacherProfileRes.data) && teacherProfileRes.data[0]?.name) {
            teacherName = teacherProfileRes.data[0].name;
          }
        }

        const circle = {
          id: c.id,
          name: c.name,
          code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101'),
          teacherId: c.teacher_id,
          teacherName: teacherName || c.teacher_name || 'المعلم',
          gender: c.gender,
          studentIds: c.student_ids || [],
          isActive: c.is_active !== false,
          createdAt: c.created_at,
        };

        return res.json({
          success: true,
          circle,
          teacherName: circle.teacherName,
          teacherId: circle.teacherId,
        });
      }

      // Check default circles fallback
      const defMatch = DEFAULT_SYSTEM_CIRCLES.find(c => c.id === circleId || c.code.toLowerCase() === circleId.toLowerCase());
      if (defMatch) {
        return res.json({
          success: true,
          circle: defMatch,
          teacherName: defMatch.teacherName,
          teacherId: defMatch.teacherId,
        });
      }

      return res.status(404).json({ success: false, error: 'لم يتم العثور على الحلقة' });
    } catch (err: any) {
      console.error(`⚡ [API /api/student/circle-info] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Available Circles
  app.get('/api/circles/available', async (req, res) => {
    const { gender } = req.query;
    try {
      let endpoint = '/rest/v1/circles?select=*';
      if (gender) {
        endpoint += `&gender=eq.${gender}`;
      }
      const circleRes = await supabaseRequest(endpoint);
      let circles: any[] = [];

      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        circles = circleRes.data
          .filter((c: any) => c.is_active !== false)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101'),
            teacherId: c.teacher_id,
            teacherName: c.teacher_name || 'المعلم',
            gender: c.gender,
            studentIds: c.student_ids || [],
            isActive: c.is_active !== false,
            createdAt: c.created_at,
          }));
      }

      // If no circles found for this gender or DB empty, add default starter circles
      const fallbackCircles = DEFAULT_SYSTEM_CIRCLES.filter(
        c => !gender || c.gender === gender
      );

      const existingIds = new Set(circles.map(c => c.id));
      for (const defC of fallbackCircles) {
        if (!existingIds.has(defC.id)) {
          circles.push(defC);
        }
      }

      return res.json({ success: true, circles });
    } catch (err: any) {
      console.warn('⚠️ [API /api/circles/available] Error, returning fallback circles:', err);
      const fallback = DEFAULT_SYSTEM_CIRCLES.filter(c => !gender || c.gender === gender);
      return res.json({ success: true, circles: fallback });
    }
  });

  // Teacher Circles
  app.get('/api/circles/teacher/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    try {
      console.log(`[API /api/circles/teacher] Fetching circles for teacher: ${teacherId}`);
      const circleRes = await supabaseRequest(`/rest/v1/circles?teacher_id=eq.${teacherId}&select=*`);
      let rawCircles = Array.isArray(circleRes.data) ? circleRes.data : [];

      // Fallback 1: If no circles found by teacher_id, check if teacher profile has circle_id
      if (rawCircles.length === 0) {
        const profRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=circle_id`);
        if (profRes.ok && Array.isArray(profRes.data) && profRes.data[0]?.circle_id) {
          const cId = profRes.data[0].circle_id;
          const cRes = await supabaseRequest(`/rest/v1/circles?id=eq.${cId}&select=*`);
          if (cRes.ok && Array.isArray(cRes.data) && cRes.data.length > 0) {
            rawCircles = cRes.data;
          }
        }
      }

      // Fallback 2: Check all circles where teacher_id matches or circle teacher_id string matches
      if (rawCircles.length === 0) {
        const allCirclesRes = await supabaseRequest(`/rest/v1/circles?select=*`);
        if (allCirclesRes.ok && Array.isArray(allCirclesRes.data)) {
          const matches = allCirclesRes.data.filter((c: any) => 
            String(c.teacher_id).trim() === String(teacherId).trim()
          );
          if (matches.length > 0) {
            rawCircles = matches;
          }
        }
      }

      const circles = rawCircles.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : 'WRD-101'),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at,
      }));

      console.log(`[API /api/circles/teacher] Found ${circles.length} circles for teacher ${teacherId}`);
      return res.json({ success: true, circles });
    } catch (err: any) {
      console.error(`[API /api/circles/teacher] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fast Batch: Teacher Complete Dashboard Data (Single roundtrip for circles + active circle students)
  app.get('/api/teacher/dashboard-data/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    try {
      console.log(`⚡ [API /api/teacher/dashboard-data] Fast fetching all data for teacher: ${teacherId}`);
      
      // Step 1: Query circles for this teacher (with fallback checks in parallel)
      const [directCircleRes, teacherProfileRes, allCirclesRes] = await Promise.all([
        supabaseRequest(`/rest/v1/circles?teacher_id=eq.${teacherId}&select=*`),
        supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=id,name,circle_id`),
        supabaseRequest(`/rest/v1/circles?select=*`),
      ]);

      let rawCircles: any[] = [];
      if (directCircleRes.ok && Array.isArray(directCircleRes.data) && directCircleRes.data.length > 0) {
        rawCircles = directCircleRes.data;
      } else if (teacherProfileRes.ok && Array.isArray(teacherProfileRes.data) && teacherProfileRes.data[0]?.circle_id) {
        const cId = teacherProfileRes.data[0].circle_id;
        const matched = Array.isArray(allCirclesRes.data) ? allCirclesRes.data.filter((c: any) => c.id === cId) : [];
        if (matched.length > 0) rawCircles = matched;
      }

      if (rawCircles.length === 0 && allCirclesRes.ok && Array.isArray(allCirclesRes.data)) {
        const matches = allCirclesRes.data.filter((c: any) =>
          String(c.teacher_id).trim() === String(teacherId).trim()
        );
        if (matches.length > 0) rawCircles = matches;
      }

      const circles = rawCircles.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : 'WRD-101'),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at,
      }));

      // Step 2: Fetch students of active circle
      let students: any[] = [];
      const activeCircle = circles[0] || null;

      if (activeCircle) {
        const [circleProfilesRes, subRes] = await Promise.all([
          supabaseRequest(`/rest/v1/profiles?circle_id=eq.${activeCircle.id}&role=eq.student&select=*`),
          supabaseRequest(`/rest/v1/submissions?circle_id=eq.${activeCircle.id}&select=*`),
        ]);

        students = Array.isArray(circleProfilesRes.data) ? circleProfilesRes.data : [];

        // Check missing studentIds
        const studentIds: string[] = activeCircle.studentIds || [];
        if (studentIds.length > 0) {
          const existingIds = new Set(students.map((s: any) => s.id));
          const missingIds = studentIds.filter(id => !existingIds.has(id));
          if (missingIds.length > 0) {
            const inQuery = missingIds.map(id => `"${id}"`).join(',');
            const batchRes = await supabaseRequest(`/rest/v1/profiles?id=in.(${inQuery})&select=*`);
            if (batchRes.ok && Array.isArray(batchRes.data)) {
              students = [...students, ...batchRes.data];
            }
          }
        }
      }

      console.log(`⚡ [API /api/teacher/dashboard-data] Complete! Found ${circles.length} circles and ${students.length} students`);
      return res.json({
        success: true,
        circles,
        activeCircle,
        students,
      });
    } catch (err: any) {
      console.error(`⚡ [API /api/teacher/dashboard-data] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fast Batch: Student Circle Info + Teacher Real Profile Name in 1 shot
  app.get('/api/student/circle-info/:circleId', async (req, res) => {
    const { circleId } = req.params;
    try {
      console.log(`⚡ [API /api/student/circle-info] Fetching circle + teacher info for: ${circleId}`);
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (!circleRes.ok || !Array.isArray(circleRes.data) || circleRes.data.length === 0) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على الحلقة' });
      }

      const c = circleRes.data[0];
      const teacherId = c.teacher_id;
      let teacherName = c.teacher_name;

      if (teacherId) {
        const teacherProfileRes = await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}&select=id,name,role,gender`);
        if (teacherProfileRes.ok && Array.isArray(teacherProfileRes.data) && teacherProfileRes.data[0]?.name) {
          teacherName = teacherProfileRes.data[0].name;
        }
      }

      const circle = {
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : 'WRD-101'),
        teacherId: c.teacher_id,
        teacherName: teacherName || c.teacher_name || 'المعلم',
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at,
      };

      return res.json({
        success: true,
        circle,
        teacherName: circle.teacherName,
        teacherId: circle.teacherId,
      });
    } catch (err: any) {
      console.error(`⚡ [API /api/student/circle-info] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Available Circles
  app.get('/api/circles/available', async (req, res) => {
    const { gender } = req.query;
    try {
      let endpoint = '/rest/v1/circles?select=*';
      if (gender) {
        endpoint += `&gender=eq.${gender}`;
      }
      const circleRes = await supabaseRequest(endpoint);
      const circles = Array.isArray(circleRes.data) ? circleRes.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : 'WRD-101'),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at,
      })) : [];

      return res.json({ success: true, circles });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Circle Students
  app.get('/api/circles/:circleId/students', async (req, res) => {
    const { circleId } = req.params;
    try {
      console.log(`[API /api/circles/:circleId/students] Fetching students for circle: ${circleId}`);
      // 1. Fetch profiles where circle_id = circleId
      const studentsRes = await supabaseRequest(`/rest/v1/profiles?circle_id=eq.${circleId}&role=eq.student&select=*`);
      let students = Array.isArray(studentsRes.data) ? studentsRes.data : [];

      // 2. Also check circle student_ids array to include any student in the list
      const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
      if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
        const studentIds: string[] = circleRes.data[0].student_ids || [];
        if (studentIds.length > 0) {
          const existingIds = new Set(students.map((s: any) => s.id));
          const missingIds = studentIds.filter(id => !existingIds.has(id));
          if (missingIds.length > 0) {
            const inQuery = missingIds.map(id => `"${id}"`).join(',');
            const batchRes = await supabaseRequest(`/rest/v1/profiles?id=in.(${inQuery})&select=*`);
            if (batchRes.ok && Array.isArray(batchRes.data)) {
              students = [...students, ...batchRes.data];
            }
          }
        }
      }

      console.log(`[API /api/circles/:circleId/students] Returning ${students.length} students for circle ${circleId}`);
      return res.json({ success: true, students });
    } catch (err: any) {
      console.error(`[API /api/circles/:circleId/students] Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create Circle
  app.post('/api/circles', async (req, res) => {
    const { teacherId, teacherName, name, gender = 'male' } = req.body;
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || undefined;
    
    if (!teacherId || !name) {
      return res.status(400).json({ success: false, error: 'بيانات الحلقة غير مكتملة' });
    }
    try {
      const genCircleId = crypto.randomUUID();
      const code = `WRD-${genCircleId.slice(0, 4).toUpperCase()}`;
      
      // Circles table columns in Supabase: id, name, teacher_id, teacher_name, gender, student_ids, is_active
      const circleData = {
        id: genCircleId,
        name: name.trim(),
        teacher_id: teacherId,
        teacher_name: teacherName || 'المعلم',
        gender,
        student_ids: [],
        is_active: true,
      };

      console.log(`[API /api/circles] Inserting circle for teacher ${teacherId}:`, circleData);

      const createRes = await supabaseRequest('/rest/v1/circles', {
        method: 'POST',
        token,
        body: circleData,
      });

      if (!createRes.ok) {
        console.error(`[API /api/circles] Insert failed:`, createRes);
        const errorDetail =
          createRes.data?.message ||
          createRes.data?.details ||
          createRes.data?.hint ||
          createRes.data?.msg ||
          'تعذر إنشاء الحلقة في قاعدة البيانات';
        return res.status(400).json({ success: false, error: errorDetail });
      }

      // Link circle to teacher profile
      await supabaseRequest(`/rest/v1/profiles?id=eq.${teacherId}`, {
        method: 'PATCH',
        token,
        body: { circle_id: genCircleId },
      });

      console.log(`[API /api/circles] Circle successfully created: ${genCircleId}`);

      return res.json({
        success: true,
        circle: {
          id: genCircleId,
          name: name.trim(),
          code,
          teacherId,
          teacherName: teacherName || 'المعلم',
          gender,
          studentIds: [],
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error(`[API /api/circles] Exception:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Join Circle
  app.post('/api/circles/join', async (req, res) => {
    const { studentId, circleCodeOrId } = req.body;
    if (!studentId || !circleCodeOrId) {
      return res.status(400).json({ success: false, error: 'يرجى تقديم معرّف الطالب ورمز الحلقة' });
    }
    try {
      const cleanInput = String(circleCodeOrId || '').trim();
      const normalizedInput = cleanInput.replace(/^WRD[-_]?/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      // 1. Query all circles from Supabase
      const findRes = await supabaseRequest(`/rest/v1/circles?select=*`);
      const allCircles = Array.isArray(findRes.data) ? findRes.data : [];

      let match = allCircles.find((c: any) => {
        if (c.id === cleanInput) return true;
        if (c.code && c.code.toLowerCase() === cleanInput.toLowerCase()) return true;
        const cIdNorm = String(c.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cCodeNorm = String(c.code || '').replace(/^WRD[-_]?/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cCodeNorm && cCodeNorm === normalizedInput) return true;
        if (cIdNorm.startsWith(normalizedInput) && normalizedInput.length >= 3) return true;
        if (c.name && c.name.trim().toLowerCase() === cleanInput.toLowerCase()) return true;
        return false;
      });

      // 2. Check default system circles
      let isSystemFallback = false;
      if (!match) {
        const sysMatch = DEFAULT_SYSTEM_CIRCLES.find(c =>
          c.id === cleanInput ||
          c.code.toLowerCase() === cleanInput.toLowerCase() ||
          c.code.replace(/^WRD[-_]?/i, '').toLowerCase() === normalizedInput ||
          c.name.trim().toLowerCase() === cleanInput.toLowerCase()
        );
        if (sysMatch) {
          match = { ...sysMatch };
          isSystemFallback = true;
        }
      }

      if (!match) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على حلقة مطابقة للرمز أو الاسم المدخل.' });
      }

      // If matched with a default system circle that doesn't exist in DB, insert it into Supabase circles table
      if (isSystemFallback) {
        try {
          await supabaseRequest('/rest/v1/circles', {
            method: 'POST',
            body: {
              id: match.id,
              name: match.name,
              teacher_id: match.teacherId || match.teacher_id,
              teacher_name: match.teacherName || match.teacher_name,
              gender: match.gender,
              student_ids: [studentId],
              is_active: true,
            },
          });
        } catch (insertErr) {
          console.warn('⚠️ [API /api/circles/join] System circle insert note:', insertErr);
        }
      } else {
        // Update circle student_ids
        const updatedStudentIds = Array.from(new Set([...(match.student_ids || []), studentId]));
        await supabaseRequest(`/rest/v1/circles?id=eq.${match.id}`, {
          method: 'PATCH',
          body: {
            student_ids: updatedStudentIds,
          },
        });
      }

      // Update student profile with circle_id and teacher_id
      await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}`, {
        method: 'PATCH',
        body: {
          circle_id: match.id,
          teacher_id: match.teacher_id || match.teacherId,
        },
      });

      const responseCircle = {
        id: match.id,
        name: match.name,
        code: match.code || (match.id ? `WRD-${match.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101'),
        teacherId: match.teacher_id || match.teacherId,
        teacherName: match.teacher_name || match.teacherName || 'المعلم',
        gender: match.gender,
        studentIds: Array.from(new Set([...(match.student_ids || match.studentIds || []), studentId])),
        isActive: match.is_active !== false,
        createdAt: match.created_at || match.createdAt || new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: `تم الانضمام بنجاح إلى ${match.name}!`,
        circle: responseCircle,
      });
    } catch (err: any) {
      console.error('❌ [API /api/circles/join] Exception:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Leave Circle
  app.post('/api/circles/leave', async (req, res) => {
    const { studentId, circleId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'معرّف الطالب مطلوب' });
    }
    try {
      await supabaseRequest(`/rest/v1/profiles?id=eq.${studentId}`, {
        method: 'PATCH',
        body: {
          circle_id: null,
          teacher_id: null,
        },
      });

      if (circleId) {
        const circleRes = await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}&select=*`);
        if (circleRes.ok && Array.isArray(circleRes.data) && circleRes.data.length > 0) {
          const c = circleRes.data[0];
          const updatedStudentIds = (c.student_ids || []).filter((id: string) => id !== studentId);
          await supabaseRequest(`/rest/v1/circles?id=eq.${circleId}`, {
            method: 'PATCH',
            body: { student_ids: updatedStudentIds },
          });
        }
      }

      return res.json({ success: true, message: 'تمت مغادرة الحلقة بنجاح.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // Curriculum & Progress API Endpoints
  // ----------------------------------------------------

  app.get('/api/content/curriculum', (req, res) => {
    res.json({
      success: true,
      worlds: WORLDS_DATA,
      weeks: WEEKS_DATA,
    });
  });

  app.post('/api/verify-completion', (req, res) => {
    const {
      nodeId,
      weekId,
      userCurrentWeek = 1,
      userCompletedNodes = [],
      userCompletedWeeks = [],
      userXp = 0,
      userStreak = 0,
      userLongestStreak = 0,
      lastActiveDate = '',
      completedDates = [],
    } = req.body;

    if (!nodeId || !weekId) {
      return res.status(400).json({ success: false, error: 'MISSING_PARAMS', message: 'معرف الدرس والأسبوع مطلوبان' });
    }

    const numericWeekId = Number(weekId);
    const numericCurrentWeek = Number(userCurrentWeek) || 1;
    const completedNodesArr: string[] = Array.isArray(userCompletedNodes) ? userCompletedNodes : [];
    const completedWeeksArr: number[] = Array.isArray(userCompletedWeeks) ? userCompletedWeeks : [];

    const isWeekUnlocked = numericWeekId <= numericCurrentWeek || completedWeeksArr.includes(numericWeekId);
    if (!isWeekUnlocked) {
      return res.status(403).json({
        success: false,
        error: 'WEEK_LOCKED',
        message: 'لا يمكن إكمال درس في أسبوع مغلق مسبقاً',
      });
    }

    const targetWeek = WEEKS_DATA.find(w => w.id === numericWeekId);
    if (!targetWeek) {
      return res.status(404).json({ success: false, error: 'WEEK_NOT_FOUND', message: 'الأسبوع المطلوب غير موجود' });
    }

    const nodeIndex = targetWeek.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      return res.status(404).json({ success: false, error: 'NODE_NOT_FOUND', message: 'الدرس المطلوب غير موجود بالأسبوع' });
    }

    const targetNode = targetWeek.nodes[nodeIndex];

    if (nodeIndex > 0) {
      const prevNode = targetWeek.nodes[nodeIndex - 1];
      const isPrevNodeCompleted = completedNodesArr.includes(prevNode.id);
      if (!isPrevNodeCompleted) {
        return res.status(403).json({
          success: false,
          error: 'NODE_LOCKED',
          message: 'يجب إكمال الدرس السابق في هذا الأسبوع أولاً',
        });
      }
    }

    const isAlreadyCompleted = completedNodesArr.includes(nodeId);
    const addedXp = isAlreadyCompleted ? 5 : targetNode.xpReward;
    const newXp = (Number(userXp) || 0) + addedXp;

    const newCompletedNodes = isAlreadyCompleted ? completedNodesArr : [...completedNodesArr, nodeId];
    const allWeekNodesDone = targetWeek.nodes.every(n => newCompletedNodes.includes(n.id));
    let newCompletedWeeks = [...completedWeeksArr];
    let newCurrentWeek = numericCurrentWeek;

    if (allWeekNodesDone && !newCompletedWeeks.includes(numericWeekId)) {
      newCompletedWeeks.push(numericWeekId);
      newCurrentWeek = Math.max(numericCurrentWeek, numericWeekId + 1);
    }

    const streakResult = updateStreakOnActivity(
      Number(userStreak) || 0,
      Number(userLongestStreak) || 0,
      lastActiveDate,
      Array.isArray(completedDates) ? completedDates : []
    );

    const unlockedBadges: string[] = [];
    if (newCompletedNodes.length >= 1) unlockedBadges.push('first_step');
    if (newCompletedWeeks.includes(1)) unlockedBadges.push('week_1_done');
    if (newCompletedWeeks.includes(17)) unlockedBadges.push('juz_amma_master');

    return res.json({
      success: true,
      nodeId,
      weekId: numericWeekId,
      isRepeat: isAlreadyCompleted,
      addedXp,
      newXp,
      newCompletedNodes,
      newCompletedWeeks,
      newCurrentWeek,
      unlockedBadges,
      streakResult,
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Vite Middleware in Dev vs Static Serving in Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.get('/', (req, res) => {
      res.redirect('/wrd-journey/');
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.get('/', (req, res) => {
      res.redirect('/wrd-journey/');
    });
    app.use('/wrd-journey', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ward Club Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
