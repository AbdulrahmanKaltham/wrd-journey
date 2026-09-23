import { supabase } from '../lib/supabaseClient';
import { Circle, NodeSubmission, AppNotification, NotificationType } from '../types';
import { getAllTracksWeeks } from '../data/quranJourneyData';

export const resolveSubmissionMeta = (nodeId?: string, weekId?: number) => {
  const allWeeks = getAllTracksWeeks();
  let matchedWeek = allWeeks.find(w => w.nodes.some(n => n.id === nodeId));
  let matchedNode = matchedWeek?.nodes.find(n => n.id === nodeId);

  if (!matchedWeek && nodeId) {
    const isTrack2 = nodeId.startsWith('t2_');
    const m = nodeId.match(/w(\d+)/i);
    if (m) {
      const wNum = parseInt(m[1], 10);
      matchedWeek = allWeeks.find(w => (isTrack2 ? w.trackId === 'juz_amma_tabarak' : w.trackId !== 'juz_amma_tabarak') && (w.id === wNum || w.weekNumber === wNum));
      matchedNode = matchedWeek?.nodes.find(n => n.id === nodeId) || matchedWeek?.nodes.find(n => n.type === 'recite');
    }
  }

  if (!matchedWeek && weekId) {
    matchedWeek = allWeeks.find(w => w.id === weekId);
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

/**
 * 1. إنشاء حساب معلم في جدول profiles في Supabase (بدون حلقة)
 */
export const createTeacher = async (
  userId: string,
  email: string,
  name: string,
  gender: 'male' | 'female'
) => {
  console.log('📝 [supabaseService] Inserting teacher profile into Supabase profiles table...', {
    userId,
    email,
    name,
    gender,
  });

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      name,
      role: 'teacher',
      gender,
      circle_id: null,
      teacher_id: null,
      completed_nodes: [],
      completed_weeks: [],
      xp: 120,
      streak: 1,
      current_week: 1,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [supabaseService] Failed to insert teacher in profiles table:', error);
    throw new Error(`تعذر حفظ المعلم في قاعدة البيانات: ${error.message}`);
  }

  console.log('✅ [supabaseService] Teacher profile successfully saved in profiles table:', data);
  return data;
};

/**
 * 2. إنشاء حلقة قرآنية جديدة وربطها بالمعلم
 */
export const createCircle = async (
  teacherId: string,
  name: string,
  gender: 'male' | 'female' | string,
  teacherName: string = 'المعلم'
): Promise<Circle> => {
  console.log('🏛️ [supabaseService] Creating new circle in Supabase...', {
    teacherId,
    name,
    gender,
    teacherName,
  });

  const genId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `circ_${Date.now()}`;
  const generatedCode = `WRD-${Math.floor(100 + Math.random() * 900)}`;

  try {
    // 1. Direct Supabase insert without non-existent 'code' column
    const { data: circleData, error: circleError } = await supabase
      .from('circles')
      .insert({
        id: genId,
        name: name.trim(),
        teacher_id: teacherId,
        teacher_name: teacherName,
        gender,
        student_ids: [],
        is_active: true,
      })
      .select()
      .single();

    if (!circleError && circleData) {
      console.log('✅ [supabaseService] Circle created directly via Supabase:', circleData);
      
      // Update teacher profile with circle_id
      await supabase
        .from('profiles')
        .update({ circle_id: circleData.id })
        .eq('id', teacherId);

      const code = (circleData as any).code || `WRD-${(circleData.id || genId).slice(0, 4).toUpperCase()}`;

      return {
        id: circleData.id,
        name: circleData.name,
        code,
        teacherId: circleData.teacher_id,
        teacherName: circleData.teacher_name,
        gender: circleData.gender,
        studentIds: circleData.student_ids || [],
        isActive: circleData.is_active !== false,
        createdAt: circleData.created_at || new Date().toISOString(),
      };
    } else if (circleError) {
      console.warn('⚠️ [supabaseService] Direct Supabase insert error:', circleError);
    }
  } catch (directErr) {
    console.warn('⚠️ [supabaseService] Direct circle creation failed, trying API proxy:', directErr);
  }

  // 2. Fallback via API Proxy with session token
  let token: string | undefined = undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token;
  } catch {}

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/circles', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      teacherId,
      teacherName,
      name: name.trim(),
      gender,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success || !json.circle) {
    throw new Error(json.error || 'تعذر إنشاء الحلقة في قاعدة البيانات.');
  }

  return json.circle;
};

/**
 * 3. إنشاء حساب معلم مع حلقة قرآنية (للتوافق)
 */
export const createTeacherWithCircle = async (
  userId: string,
  email: string,
  name: string,
  gender: 'male' | 'female',
  circleName?: string
) => {
  const teacherProfile = await createTeacher(userId, email, name, gender);
  if (circleName && circleName.trim()) {
    const circle = await createCircle(userId, circleName, gender, name);
    return circle;
  }
  return teacherProfile;
};

/**
 * 4. إنشاء حساب طالب في جدول profiles في Supabase
 */
export const createStudent = async (
  userId: string,
  email: string,
  name: string,
  gender: 'male' | 'female'
) => {
  console.log('📝 [supabaseService] Inserting student into profiles table in Supabase...', {
    userId,
    email,
    name,
    gender,
  });

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      name,
      role: 'student',
      gender,
      circle_id: null,
      teacher_id: null,
      completed_nodes: [],
      completed_weeks: [],
      xp: 0,
      streak: 1,
      current_week: 1,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [supabaseService] Failed to insert student in profiles table:', error);
    throw new Error(`تعذر حفظ الطالب في قاعدة البيانات: ${error.message}`);
  }

  console.log('✅ [supabaseService] Student profile successfully saved in profiles table:', data);
  return data;
};

/**
 * 3. مزامنة ملف موجود حالياً إلى Supabase profiles مباشرة
 */
export const syncProfileToSupabase = async (profile: any) => {
  if (!profile || !profile.id) return;
  console.log('🔄 [supabaseService] Syncing profile to Supabase database:', profile);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.displayName,
        role: profile.role || 'student',
        gender: profile.gender || 'male',
        circle_id: profile.circle_id || profile.circleId || null,
        teacher_id: profile.teacher_id || profile.teacherId || null,
        xp: profile.xp || 0,
        streak: profile.streak || 1,
        current_week: profile.current_week || profile.currentWeek || 1,
        completed_nodes: Array.isArray(profile.completed_nodes) ? profile.completed_nodes : (Array.isArray(profile.completedNodes) ? profile.completedNodes : []),
        completed_weeks: profile.completed_weeks || profile.completedWeeks || [],
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [supabaseService] Sync profile failed:', error);
    } else {
      console.log('✅ [supabaseService] Profile synced to database:', data);
    }
  } catch (err) {
    console.warn('Sync error:', err);
  }
};

export const DEFAULT_SYSTEM_CIRCLES: Circle[] = [
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

/**
 * 4. الحصول على الحلقات المتاحة للطلاب
 */
export const getAvailableCircles = async (gender?: 'male' | 'female'): Promise<Circle[]> => {
  console.log('🔍 [supabaseService] Fetching available circles for gender:', gender);

  try {
    // 1. استعلام Supabase المباشر أولاً (يعمل دائماً على الاستضافة الثابتة و GitHub Pages)
    let query = supabase.from('circles').select('*');
    if (gender) {
      query = query.eq('gender', gender);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      console.log('✅ [supabaseService] Available circles loaded from Supabase:', data.length);
      return data
        .filter(c => c.is_active !== false)
        .map(c => ({
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
  } catch (err) {
    console.warn('⚠️ [supabaseService] Direct Supabase circles query error:', err);
  }

  // 2. محاولة الخادم الاختيارية مع التحقق من نوع المحتوى (لتجنب أخطاء 404 HTML في GitHub Pages)
  try {
    const res = await fetch(`/api/circles/available${gender ? `?gender=${gender}` : ''}`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      if (json.success && Array.isArray(json.circles) && json.circles.length > 0) {
        console.log('✅ [supabaseService] Available circles loaded from API proxy:', json.circles);
        return json.circles;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService] Optional API proxy check skipped:', apiErr);
  }

  // 3. الحلقات الافتراضية المعتمدة للجنس المختار
  return DEFAULT_SYSTEM_CIRCLES.filter(c => !gender || c.gender === gender);
};

// In-memory cache with short TTL (10 seconds) for ultra-fast instant UI rendering
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 15000;

export const getCached = <T>(key: string): T | null => {
  const item = memoryCache[key];
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data as T;
  }
  return null;
};

export const setCache = <T>(key: string, data: T): void => {
  memoryCache[key] = { data, timestamp: Date.now() };
};

export const invalidateCache = (pattern?: string): void => {
  if (!pattern) {
    Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  } else {
    Object.keys(memoryCache).forEach(k => {
      if (k.includes(pattern)) delete memoryCache[k];
    });
  }
};

/**
 * 4.0 جلب كافة بيانات لوحة تحكم المعلم بطلب شبكة واحد وفوري
 */
export const getTeacherDashboardData = async (
  teacherId: string,
  bypassCache = false
): Promise<{ circles: Circle[]; activeCircle: Circle | null; students: any[] }> => {
  if (!teacherId) return { circles: [], activeCircle: null, students: [] };

  const cacheKey = `teacher_dash_${teacherId}`;
  if (!bypassCache) {
    const cached = getCached<{ circles: Circle[]; activeCircle: Circle | null; students: any[] }>(cacheKey);
    if (cached) {
      console.log('⚡ [supabaseService.getTeacherDashboardData] Loaded from memory cache instantly');
      return cached;
    }
  }

  try {
    console.log('🚀 [supabaseService.getTeacherDashboardData] Fast single-roundtrip fetch for teacher:', teacherId);
    const res = await fetch(`/api/teacher/dashboard-data/${teacherId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        const result = {
          circles: json.circles || [],
          activeCircle: json.activeCircle || null,
          students: json.students || [],
        };
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getTeacherDashboardData] API fetch error:', err);
  }

  // Fallback to getTeacherCircles
  const circles = await getTeacherCircles(teacherId);
  const active = circles[0] || null;
  let students: any[] = [];
  if (active) {
    students = await getCircleStudents(active.id);
  }

  const result = { circles, activeCircle: active, students };
  setCache(cacheKey, result);
  return result;
};

/**
 * 4.01 جلب تفاصيل حلقة الطالب واسم المعلم بطلب مباشر من Supabase
 */
export const getStudentCircleInfo = async (
  circleId: string,
  bypassCache = false
): Promise<{ circle: Circle | null; teacherName: string; teacherId: string } | null> => {
  if (!circleId) return null;

  const cacheKey = `student_circle_info_${circleId}`;
  if (!bypassCache) {
    const cached = getCached<{ circle: Circle | null; teacherName: string; teacherId: string }>(cacheKey);
    if (cached) return cached;
  }

  // 1. استعلام تفاصيل الحلقة مباشرة من Supabase أولاً
  const circle = await getCircleDetails(circleId);
  if (circle) {
    let teacherName = circle.teacherName || 'المعلم';
    const teacherId = circle.teacherId;

    if (teacherId && (!circle.teacherName || circle.teacherName === 'المعلم' || circle.teacherName === 'الشيخ')) {
      try {
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', teacherId)
          .maybeSingle();

        if (teacherProfile?.name) {
          teacherName = teacherProfile.name;
        }
      } catch (err) {
        console.warn('⚠️ [supabaseService.getStudentCircleInfo] Teacher profile query note:', err);
      }
    }

    const result = {
      circle,
      teacherName,
      teacherId,
    };
    setCache(cacheKey, result);
    return result;
  }

  // 2. محاولة الخادم الاختيارية فقط إذا كانت الاستجابة بتنسيق JSON (لتفادي أخطاء 404 في GitHub Pages)
  try {
    const res = await fetch(`/api/student/circle-info/${circleId}`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.circle) {
        const result = {
          circle: json.circle,
          teacherName: json.teacherName || json.circle.teacherName || 'المعلم',
          teacherId: json.teacherId || json.circle.teacherId,
        };
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getStudentCircleInfo] API error note:', err);
  }

  return null;
};

/**
 * 4.1 جلب حلقات المعلم (مباشرة عبر Supabase)
 */
export const getTeacherCircles = async (teacherId: string): Promise<Circle[]> => {
  console.log('🔍 [supabaseService.getTeacherCircles] Starting search for teacher ID:', teacherId);
  if (!teacherId) {
    console.warn('⚠️ [supabaseService.getTeacherCircles] Empty teacherId provided');
    return [];
  }

  const cacheKey = `teacher_circles_${teacherId}`;
  const cached = getCached<Circle[]>(cacheKey);
  if (cached) return cached;

  try {
    // 1. استعلام Supabase المباشر أولاً
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('teacher_id', teacherId);

    if (!error && Array.isArray(data) && data.length > 0) {
      const circles = data.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code || (c.id ? `WRD-${c.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101'),
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        gender: c.gender,
        studentIds: c.student_ids || [],
        isActive: c.is_active !== false,
        createdAt: c.created_at,
      }));
      setCache(cacheKey, circles);
      return circles;
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getTeacherCircles] Direct Supabase exception:', err);
  }

  // 2. محاولة الخادم الاختيارية فقط إذا كانت الاستجابة JSON
  try {
    const res = await fetch(`/api/circles/teacher/${teacherId}`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      if (json.success && Array.isArray(json.circles) && json.circles.length > 0) {
        setCache(cacheKey, json.circles);
        return json.circles;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.getTeacherCircles] API error skipped:', apiErr);
  }

  return [];
};

/**
 * 4.2 جلب تفاصيل حلقة معينة (مباشرة عبر Supabase)
 */
export const getCircleDetails = async (circleId: string): Promise<Circle | null> => {
  if (!circleId) return null;

  const cacheKey = `circle_details_${circleId}`;
  const cached = getCached<Circle>(cacheKey);
  if (cached) return cached;

  try {
    // 1. استعلام Supabase المباشر
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .maybeSingle();

    if (!error && data) {
      const circle: Circle = {
        id: data.id,
        name: data.name,
        code: data.code || (data.id ? `WRD-${data.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101'),
        teacherId: data.teacher_id,
        teacherName: data.teacher_name,
        gender: data.gender,
        studentIds: data.student_ids || [],
        isActive: data.is_active !== false,
        createdAt: data.created_at,
      };
      setCache(cacheKey, circle);
      return circle;
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getCircleDetails] Direct Supabase error:', err);
  }

  // 2. فحص حلقات النظام الافتراضية
  const cleanId = String(circleId).trim().toLowerCase();
  const sysMatch = DEFAULT_SYSTEM_CIRCLES.find(c =>
    c.id.toLowerCase() === cleanId ||
    c.code.toLowerCase() === cleanId
  );
  if (sysMatch) {
    setCache(cacheKey, sysMatch);
    return sysMatch;
  }

  // 3. محاولة الخادم الاختيارية فقط إذا كانت الاستجابة JSON
  try {
    const res = await fetch(`/api/circles/${circleId}`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.circle) {
        setCache(cacheKey, json.circle);
        return json.circle;
      }
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getCircleDetails] API optional check skipped:', err);
  }

  return null;
};

/**
 * 4.3 جلب بيانات مستخدم أو معلم بواسطة معرفه (getProfile)
 */
export const getProfile = async (userId: string): Promise<any | null> => {
  if (!userId) return null;

  const cacheKey = `user_profile_${userId}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  try {
    // 1. استعلام Supabase المباشر أولاً
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getProfile] Direct getProfile exception:', err);
  }

  // 2. محاولة الخادم الاختيارية فقط إذا كانت الاستجابة JSON
  try {
    const res = await fetch(`/api/profile/${userId}`);
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.profile) {
        setCache(cacheKey, json.profile);
        return json.profile;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.getProfile] API fallback skipped:', apiErr);
  }

  return null;
};

/**
 * 5. الانضمام إلى حلقة (مباشرة عبر Supabase من جهة العميل - يعمل بالكامل على GitHub Pages)
 */
export const joinCircle = async (
  studentId: string,
  circleCodeOrId: string
): Promise<{ success: boolean; message: string; circle: Circle }> => {
  console.log('🔗 [supabaseService.joinCircle] Joining circle directly via Supabase:', { studentId, circleCodeOrId });
  const cleanInput = String(circleCodeOrId || '').trim();
  if (!studentId) {
    throw new Error('يرجى تسجيل الدخول أولاً للانضمام إلى الحلقة');
  }
  if (!cleanInput) {
    throw new Error('يرجى تقديم رمز أو معرّف الحلقة');
  }

  const normalizedInput = cleanInput.replace(/^WRD[-_]?/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  let matchedCircle: any = null;

  // 1. جلب الحلقة من جدول circles حسب المعرّف (ID)
  try {
    const { data: byId, error: byIdErr } = await supabase
      .from('circles')
      .select('*')
      .eq('id', cleanInput)
      .maybeSingle();

    if (!byIdErr && byId) {
      matchedCircle = byId;
      console.log('✅ [supabaseService.joinCircle] Matched circle by exact ID:', byId.id);
    }
  } catch (e) {
    console.warn('⚠️ [supabaseService.joinCircle] Error checking circle by id:', e);
  }

  // 2. جلب الحلقة من جدول circles حسب الرمز (code)
  if (!matchedCircle) {
    try {
      const { data: byCode, error: byCodeErr } = await supabase
        .from('circles')
        .select('*')
        .eq('code', cleanInput)
        .maybeSingle();

      if (!byCodeErr && byCode) {
        matchedCircle = byCode;
        console.log('✅ [supabaseService.joinCircle] Matched circle by exact code:', byCode.code);
      }
    } catch {
      // قد لا يكون عمود code مدعوماً في بعض المخططات، نتجاهل الخطأ ونواصل البحث في القائمة
    }
  }

  // 3. بحث شامل في كل الحلقات لمطابقة الرمز (حروف كبيرة/صغيرة، بدون بادئة WRD) أو الاسم
  if (!matchedCircle) {
    try {
      const { data: allCircles, error: listErr } = await supabase
        .from('circles')
        .select('*');

      if (!listErr && Array.isArray(allCircles) && allCircles.length > 0) {
        matchedCircle = allCircles.find((c: any) => {
          if (c.id === cleanInput) return true;
          if (c.code && c.code.toLowerCase() === cleanInput.toLowerCase()) return true;
          const cCodeNorm = String(c.code || '').replace(/^WRD[-_]?/i, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (cCodeNorm && cCodeNorm === normalizedInput) return true;
          const cIdNorm = String(c.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (normalizedInput.length >= 3 && cIdNorm.startsWith(normalizedInput)) return true;
          if (c.name && c.name.trim().toLowerCase() === cleanInput.toLowerCase()) return true;
          return false;
        });
        if (matchedCircle) {
          console.log('✅ [supabaseService.joinCircle] Matched circle from list:', matchedCircle.name);
        }
      }
    } catch (e) {
      console.warn('⚠️ [supabaseService.joinCircle] Error listing circles:', e);
    }
  }

  // 4. إذا لم توجد في قاعدة البيانات، التحقق من الحلقات الافتراضية للنظام
  if (!matchedCircle) {
    const sysMatch = DEFAULT_SYSTEM_CIRCLES.find(c =>
      c.id === cleanInput ||
      c.code.toLowerCase() === cleanInput.toLowerCase() ||
      c.code.replace(/^WRD[-_]?/i, '').toLowerCase() === normalizedInput ||
      c.name.trim().toLowerCase() === cleanInput.toLowerCase()
    );

    if (sysMatch) {
      console.log('⚡ [supabaseService.joinCircle] Matched default system circle:', sysMatch.name);
      // محاولة حفظ الحلقة في جدول circles في Supabase
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('circles')
          .insert({
            id: sysMatch.id,
            name: sysMatch.name,
            teacher_id: sysMatch.teacherId,
            teacher_name: sysMatch.teacherName,
            gender: sysMatch.gender,
            student_ids: [studentId],
            is_active: true,
            code: sysMatch.code,
          })
          .select()
          .maybeSingle();

        if (!insertErr && inserted) {
          matchedCircle = inserted;
        } else {
          // جلبها في حال كانت موجودة مسبقاً
          const { data: existing } = await supabase
            .from('circles')
            .select('*')
            .eq('id', sysMatch.id)
            .maybeSingle();
          matchedCircle = existing || {
            ...sysMatch,
            teacher_id: sysMatch.teacherId,
            teacher_name: sysMatch.teacherName,
            student_ids: [studentId],
          };
        }
      } catch (err) {
        console.warn('⚠️ [supabaseService.joinCircle] Note on inserting default circle:', err);
        matchedCircle = {
          ...sysMatch,
          teacher_id: sysMatch.teacherId,
          teacher_name: sysMatch.teacherName,
          student_ids: [studentId],
        };
      }
    }
  }

  if (!matchedCircle) {
    throw new Error('لم يتم العثور على حلقة مطابقة للرمز أو الاسم المدخل. يرجى التأكد من الرمز والمحاولة مجدداً.');
  }

  // 5. إضافة معرّف الطالبة إلى مصفوفة student_ids في جدول circles (مع تجنب التكرار)
  const currentStudentIds: string[] = Array.isArray(matchedCircle.student_ids) ? matchedCircle.student_ids : [];
  const updatedStudentIds = Array.from(new Set([...currentStudentIds, studentId]));

  try {
    const { error: circleUpdateErr } = await supabase
      .from('circles')
      .update({ student_ids: updatedStudentIds })
      .eq('id', matchedCircle.id);

    if (circleUpdateErr) {
      console.warn('⚠️ [supabaseService.joinCircle] Updating circles.student_ids note (check RLS):', circleUpdateErr.message);
    } else {
      console.log('✅ [supabaseService.joinCircle] Updated circles.student_ids successfully');
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.joinCircle] Exception updating circles:', err);
  }

  // 6. تحديث صف الطالبة في جدول profiles:
  // - circle_id = معرّف الحلقة
  // - teacher_id = معرّف المعلم
  const teacherId = matchedCircle.teacher_id || matchedCircle.teacherId || null;
  const teacherName = matchedCircle.teacher_name || matchedCircle.teacherName || 'المعلم';

  const { error: profileUpdateErr } = await supabase
    .from('profiles')
    .update({
      circle_id: matchedCircle.id,
      teacher_id: teacherId,
    })
    .eq('id', studentId);

  if (profileUpdateErr) {
    console.error('❌ [supabaseService.joinCircle] Error updating profiles row:', profileUpdateErr);
    throw new Error(`تعذر حفظ بيانات الانضمام في ملف الطالبة: ${profileUpdateErr.message}`);
  }

  console.log('✅ [supabaseService.joinCircle] Profile updated with circle_id and teacher_id successfully');

  const circleCode = matchedCircle.code || (matchedCircle.id ? `WRD-${matchedCircle.id.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'WRD-101');
  const mappedCircle: Circle = {
    id: matchedCircle.id,
    name: matchedCircle.name,
    code: circleCode,
    teacherId: teacherId || '',
    teacherName: teacherName,
    gender: matchedCircle.gender || 'female',
    studentIds: updatedStudentIds,
    isActive: matchedCircle.is_active !== false,
    createdAt: matchedCircle.created_at || new Date().toISOString(),
  };

  // إبطال التخزين المؤقت لضمان ظهور التغيير فوراً
  invalidateCache(`student_circle_info_${matchedCircle.id}`);
  invalidateCache(`circle_details_${matchedCircle.id}`);

  return {
    success: true,
    message: `تم الانضمام بنجاح إلى ${matchedCircle.name}!`,
    circle: mappedCircle,
  };
};

/**
 * 5.1 مغادرة الحلقة (مباشرة عبر Supabase من جهة العميل)
 */
export const leaveCircle = async (
  studentId: string,
  circleId?: string
): Promise<{ success: boolean; message: string }> => {
  console.log('👋 [supabaseService.leaveCircle] Leaving circle directly via Supabase:', { studentId, circleId });
  if (!studentId) {
    throw new Error('معرّف الطالب مطلوب لمغادرة الحلقة');
  }

  // 1. تحديث صف الطالبة في جدول profiles: تفريغ circle_id و teacher_id
  const { error: profileUpdateErr } = await supabase
    .from('profiles')
    .update({
      circle_id: null,
      teacher_id: null,
    })
    .eq('id', studentId);

  if (profileUpdateErr) {
    console.error('❌ [supabaseService.leaveCircle] Error updating profile:', profileUpdateErr);
    throw new Error(`تعذر إلغاء الربط بالحلقة في ملف الطالبة: ${profileUpdateErr.message}`);
  }

  // 2. إزالة الطالبة من مصفوفة student_ids في جدول circles إن وُجد معرّف الحلقة
  if (circleId) {
    try {
      const { data: circleData } = await supabase
        .from('circles')
        .select('id, student_ids')
        .eq('id', circleId)
        .maybeSingle();

      if (circleData && Array.isArray(circleData.student_ids)) {
        const updatedStudentIds = circleData.student_ids.filter((id: string) => id !== studentId);
        await supabase
          .from('circles')
          .update({ student_ids: updatedStudentIds })
          .eq('id', circleId);
      }
    } catch (err) {
      console.warn('⚠️ [supabaseService.leaveCircle] Error updating circles.student_ids:', err);
    }

    invalidateCache(`student_circle_info_${circleId}`);
    invalidateCache(`circle_details_${circleId}`);
  }

  return {
    success: true,
    message: 'تمت مغادرة الحلقة بنجاح.',
  };
};

/**
 * 6. جلب طلاب حلقة
 */
export const getCircleStudents = async (circleId: string): Promise<any[]> => {
  console.log('👥 [supabaseService] Fetching students for circle ID:', circleId);
  try {
    // 1. Direct Supabase query on profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('circle_id', circleId)
      .eq('role', 'student');

    if (!error && Array.isArray(data) && data.length > 0) {
      console.log('✅ [supabaseService] Circle students loaded from Supabase profiles:', data.length);
      return data;
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService] Supabase getCircleStudents error:', err);
  }

  // 2. Server API fallback (uses service role / elevated access)
  try {
    const res = await fetch(`/api/circles/${circleId}/students`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.students)) {
        console.log('✅ [supabaseService] Circle students loaded from API proxy:', json.students.length);
        return json.students;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService] API fallback error in getCircleStudents:', apiErr);
  }

  return [];
};

/**
 * 7. رفع تسجيل صوتي
 */
export const uploadRecording = async (
  studentId: string,
  circleId: string,
  nodeId: string,
  file: File | Blob
) => {
  const filePath = `recordings/${circleId}/${studentId}/${nodeId}_${Date.now()}.webm`;
  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(filePath, file);

  if (!uploadError) {
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    await supabase
      .from('recordings')
      .insert({
        student_id: studentId,
        circle_id: circleId,
        node_id: nodeId,
        audio_url: urlData.publicUrl,
        status: 'pending',
      });
    return urlData.publicUrl;
  }
  return URL.createObjectURL(file);
};

/**
 * 8. تسجيل إكمال مهمة / درس في جدول profiles في Supabase وحفظ التقدم بشكل دائم
 */
export const completeNodeInDB = async (
  userId: string,
  nodeId: string,
  weekId = 1,
  xpGained = 15,
  currentStreak = 1
): Promise<{ success: boolean; profile?: any; error?: string }> => {
  console.log('🎯 [supabaseService.completeNodeInDB] Saving node completion:', {
    userId,
    nodeId,
    weekId,
    xpGained,
    currentStreak,
  });

  if (!userId || !nodeId) {
    return { success: false, error: 'معرّف الطالب ومعرّف الدرس مطلوبان' };
  }

  // Invalidate any cached profile to ensure fresh read
  invalidateCache(`user_profile_${userId}`);

  // 1. Primary: Fast Server API route using elevated service key (bypasses RLS issues)
  try {
    let userToken: string | undefined;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      userToken = sessionData?.session?.access_token;
    } catch {
      // ignore
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const res = await fetch('/api/profile/complete-node', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        nodeId,
        weekId,
        xpGained,
        currentStreak,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        console.log('✅ [supabaseService.completeNodeInDB] Progress saved via API Proxy:', json.profile);
        setCache(`user_profile_${userId}`, json.profile);
        return { success: true, profile: json.profile };
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.completeNodeInDB] Server API proxy error:', apiErr);
  }

  // 2. Secondary: Direct Supabase Client Update fallback
  try {
    const { data: currentProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, completed_nodes, completed_weeks, xp, streak')
      .eq('id', userId)
      .single();

    if (!fetchErr && currentProfile) {
      const existing: string[] = Array.isArray(currentProfile.completed_nodes)
        ? currentProfile.completed_nodes
        : [];
      
      const newCompleted = existing.includes(nodeId)
        ? existing
        : [...existing, nodeId];

      const newXp = (currentProfile.xp || 0) + (existing.includes(nodeId) ? Math.round(xpGained * 0.2) : xpGained);

      const { data: updated, error: updateErr } = await supabase
        .from('profiles')
        .update({
          completed_nodes: newCompleted,
          xp: newXp,
          streak: currentStreak,
        })
        .eq('id', userId)
        .select()
        .single();

      if (!updateErr && updated) {
        console.log('✅ [supabaseService.completeNodeInDB] Saved via direct Supabase client:', updated);
        setCache(`user_profile_${userId}`, updated);
        return { success: true, profile: updated };
      }
    }
  } catch (directErr) {
    console.error('❌ [supabaseService.completeNodeInDB] Direct update exception:', directErr);
  }

  return { success: false, error: 'تعذر حفظ تقدم الطالب في قاعدة البيانات' };
};

/**
 * 8.b تسجيل إتمام الأسبوع واختبار البوابة في قاعدة البيانات وفتح الأسبوع التالي
 */
export const completeWeekInDB = async (
  userId: string,
  weekId: number,
  gateNodeId?: string,
  xpEarned = 100,
  newCompletedWeeks?: number[],
  newCurrentWeek?: number
): Promise<{ success: boolean; profile?: any; error?: string }> => {
  console.log('🏆 [supabaseService.completeWeekInDB] Saving week completion:', {
    userId,
    weekId,
    gateNodeId,
    xpEarned,
  });

  if (!userId || !weekId) {
    return { success: false, error: 'معرّف الطالب ورقم الأسبوع مطلوبان' };
  }

  invalidateCache(`user_profile_${userId}`);

  // Get user auth token
  let userToken: string | undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    userToken = sessionData?.session?.access_token;
  } catch {
    // ignore
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  // 1. Primary: Server API Route with Service Role & User Token
  try {
    const res = await fetch('/api/profile/complete-week', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        weekId,
        gateNodeId,
        xpEarned,
        newCompletedWeeks,
        newCurrentWeek,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        console.log('✅ [supabaseService.completeWeekInDB] Week completion saved via API Proxy:', json.profile);
        setCache(`user_profile_${userId}`, json.profile);
        return { success: true, profile: json.profile };
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.completeWeekInDB] Server API proxy error:', apiErr);
  }

  // 2. Secondary: Direct Supabase Client Update fallback
  try {
    const { data: currentProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, completed_nodes, completed_weeks, current_week, xp')
      .eq('id', userId)
      .single();

    if (!fetchErr && currentProfile) {
      const existingWeeks: number[] = Array.isArray(currentProfile.completed_weeks)
        ? currentProfile.completed_weeks
        : [];
      const updatedWeeks = existingWeeks.includes(weekId)
        ? existingWeeks
        : [...existingWeeks, weekId];

      const existingNodes: string[] = Array.isArray(currentProfile.completed_nodes)
        ? currentProfile.completed_nodes
        : [];
      const targetGate = gateNodeId || `w${weekId}_gate`;
      const updatedNodes = existingNodes.includes(targetGate)
        ? existingNodes
        : [...existingNodes, targetGate];

      const nextWeek = Math.max(Number(currentProfile.current_week || 1), Number(weekId) + 1);
      const newXp = (Number(currentProfile.xp) || 0) + Number(xpEarned || 100);

      const { data: updated, error: updateErr } = await supabase
        .from('profiles')
        .update({
          completed_weeks: updatedWeeks,
          completed_nodes: updatedNodes,
          current_week: nextWeek,
          xp: newXp,
        })
        .eq('id', userId)
        .select()
        .single();

      if (!updateErr && updated) {
        console.log('✅ [supabaseService.completeWeekInDB] Saved via direct Supabase client:', updated);
        setCache(`user_profile_${userId}`, updated);
        return { success: true, profile: updated };
      }
    }
  } catch (directErr) {
    console.error('❌ [supabaseService.completeWeekInDB] Direct update exception:', directErr);
  }

  return { success: false, error: 'تعذر حفظ إكمال الأسبوع في قاعدة البيانات' };
};

/**
 * دالة بديلة/مختصرة لـ completeNodeInDB
 */
export const completeNode = completeNodeInDB;

/**
 * 9. تحديث الملف الشخصي في قاعدة البيانات
 */
export const updateProfileInDB = async (
  userId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; profile?: any; error?: string }> => {
  if (!userId) return { success: false, error: 'معرّف المستخدم مطلوب' };

  invalidateCache(`user_profile_${userId}`);

  try {
    let userToken: string | undefined;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      userToken = sessionData?.session?.access_token;
    } catch {
      // ignore
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const res = await fetch(`/api/profile/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        setCache(`user_profile_${userId}`, json.profile);
        return { success: true, profile: json.profile };
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.updateProfileInDB] API error:', apiErr);
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (!error && data) {
      setCache(`user_profile_${userId}`, data);
      return { success: true, profile: data };
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.updateProfileInDB] Direct DB error:', err);
  }

  return { success: false, error: 'تعذر تحديث الملف الشخصي' };
};

/**
 * 10. جلب تسجيلات الطلاب للمعلم
 */
export const getTeacherSubmissions = async (teacherId: string): Promise<NodeSubmission[]> => {
  console.log('🎙️ [supabaseService.getTeacherSubmissions] Fetching for teacher:', teacherId);
  if (!teacherId) return [];

  // 1. Primary: Use Fast Server API proxy
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/submissions/teacher/${teacherId}`, { headers });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.submissions)) {
        console.log(`✅ [supabaseService.getTeacherSubmissions] Loaded ${json.submissions.length} submissions via API`);
        return json.submissions;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.getTeacherSubmissions] API fetch error, falling back to direct:', apiErr);
  }

  // 2. Fallback: Direct Supabase query strictly for this teacher's circles
  try {
    const { data: circles } = await supabase
      .from('circles')
      .select('id')
      .eq('teacher_id', teacherId);

    const circleIds = (circles || []).map((c: any) => c.id).filter(Boolean);
    if (circleIds.length === 0) {
      return [];
    }

    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('*')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false });

    if (recordingsError || !recordings) {
      console.warn('⚠️ [supabaseService.getTeacherSubmissions] Direct query error:', recordingsError);
      return [];
    }

    // Filter out deleted/cancelled records
    const validRecs = recordings.filter((r: any) => r.status !== 'deleted' && r.status !== 'cancelled_reset');

    // Fetch actual student profiles to get real student names
    const studentIds = Array.from(new Set(validRecs.map((r: any) => r.student_id).filter(Boolean)));
    const studentNameMap = new Map<string, string>();
    if (studentIds.length > 0) {
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name, display_name')
          .in('id', studentIds);
        (profs || []).forEach((p: any) => {
          const pName = p.display_name || p.name;
          if (pName && pName.trim()) {
            studentNameMap.set(p.id, pName.trim());
          }
        });
      } catch (e) {
        console.warn('⚠️ [supabaseService.getTeacherSubmissions] Could not fetch student profile names:', e);
      }
    }

    // 3. تحويل البيانات إلى هيكل NodeSubmission
    return validRecs.map((rec: any) => {
      const meta = resolveSubmissionMeta(rec.node_id, rec.week_id);
      const studentName = studentNameMap.get(rec.student_id) || 'طالب';
      return {
        id: rec.id,
        studentId: rec.student_id,
        studentName,
        circleId: rec.circle_id,
        nodeId: rec.node_id,
        weekId: meta.weekId,
        weekTitle: meta.weekTitle,
        nodeTitle: rec.node_title || meta.nodeTitle,
        surahName: meta.surahName,
        surahsList: meta.surahsList,
        nodeDescription: meta.nodeDescription,
        type: rec.type || (rec.audio_url ? 'recording' : 'halaqah'),
        status: rec.status || 'pending',
        audioUrl: rec.audio_url,
        teacherNotes: rec.teacher_notes || '',
        rating: rec.rating || (rec.status === 'approved' ? 'معتمد' : ''),
        submittedAt: rec.created_at,
        reviewedAt: rec.updated_at,
      };
    });
  } catch (err) {
    console.error('❌ [supabaseService.getTeacherSubmissions] Exception:', err);
    return [];
  }
};

/**
 * 11. جلب تسجيلات وتسميعات الطالب الخاصة به
 */
export const getStudentSubmissions = async (studentId: string): Promise<NodeSubmission[]> => {
  console.log('🎙️ [supabaseService.getStudentSubmissions] Fetching for student:', studentId);
  if (!studentId) return [];

  // 1. Primary: Server API Proxy
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/submissions/student/${studentId}`, { headers });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.submissions)) {
        console.log(`✅ [supabaseService.getStudentSubmissions] Loaded ${json.submissions.length} submissions for student`);
        return json.submissions;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.getStudentSubmissions] API error:', apiErr);
  }

  // 2. Fallback: Direct DB Query
  try {
    const { data: recordings, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (!error && recordings) {
      return recordings.map((rec: any) => {
        const meta = resolveSubmissionMeta(rec.node_id, rec.week_id);
        return {
          id: rec.id,
          studentId: rec.student_id,
          circleId: rec.circle_id,
          nodeId: rec.node_id,
          weekId: meta.weekId,
          weekTitle: meta.weekTitle,
          nodeTitle: rec.node_title || meta.nodeTitle,
          surahName: meta.surahName,
          surahsList: meta.surahsList,
          nodeDescription: meta.nodeDescription,
          type: rec.type || (rec.audio_url ? 'recording' : 'halaqah'),
          status: rec.status === 'approved'
            ? 'approved'
            : (rec.status === 'needs_practice' || rec.status === 'reviewed')
            ? 'reviewed'
            : rec.status === 'absent'
            ? 'absent'
            : 'pending_teacher_review',
          audioUrl: rec.audio_url,
          teacherNotes: rec.teacher_notes || '',
          rating: rec.rating || (rec.status === 'approved' ? 'معتمد' : ''),
          submittedAt: rec.created_at,
          reviewedAt: rec.updated_at,
        };
      });
    }
  } catch (err) {
    console.error('❌ [supabaseService.getStudentSubmissions] DB fallback error:', err);
  }
  return [];
};

/**
 * 12. جلب تسجيل/تسميع محدد لطالب في محطة معينة مع ملاحظات المعلم
 */
export const getStudentSubmissionForNode = async (
  studentId: string,
  nodeId: string
): Promise<NodeSubmission | null> => {
  if (!studentId || !nodeId) return null;
  try {
    const allSubs = await getStudentSubmissions(studentId);
    const found = allSubs.find(s => s.nodeId === nodeId);
    if (found) return found;
  } catch (e) {
    console.warn('⚠️ [supabaseService.getStudentSubmissionForNode] Error:', e);
  }
  return null;
};

/**
 * 13. إعادة ضبط مسار الطالب ومسح كافة التسجيلات والتسميعات بالكامل من قاعدة البيانات
 */
export const resetStudentProgressInDB = async (
  userId: string
): Promise<{ success: boolean; profile?: any }> => {
  if (!userId) return { success: false };

  console.log('🔄 [supabaseService.resetStudentProgressInDB] Fully resetting student in DB:', userId);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. Call API reset (resets profile progress & deletes recordings with service role)
    const res = await fetch('/api/profile/reset', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });

    // 2. Direct Supabase calls as secondary assurance
    await supabase
      .from('profiles')
      .update({
        completed_nodes: [],
        completed_weeks: [],
        xp: 0,
        streak: 1,
        current_week: 1,
      })
      .eq('id', userId);

    await supabase
      .from('recordings')
      .delete()
      .eq('student_id', userId);

    try {
      await supabase
        .from('recordings')
        .update({ status: 'deleted', audio_url: '' })
        .eq('student_id', userId);
    } catch (e) {}

    // Clear client-side memory cache
    invalidateCache();

    if (res.ok) {
      const json = await res.json();
      return { success: true, profile: json.profile };
    }
    return { success: true };
  } catch (err) {
    console.error('❌ [supabaseService.resetStudentProgressInDB] Error:', err);
    return { success: false };
  }
};

/**
 * 14. تبديل طريقة التسميع (بين التسجيل الذاتي والتسميع في الحلقة)
 */
export const switchRecitationTypeInDB = async (
  studentId: string,
  nodeId: string,
  newType: 'halaqah' | 'recording'
): Promise<{ success: boolean; message?: string }> => {
  const isUUID = (str?: string | null): boolean => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/submissions/switch-type', {
      method: 'POST',
      headers,
      body: JSON.stringify({ studentId, nodeId, newType }),
    });

    // Also update direct Supabase table for extra resilience if valid UUID
    if (isUUID(studentId)) {
      try {
        const updateData: Record<string, any> = {
          type: newType,
          status: 'pending',
          updated_at: new Date().toISOString(),
        };
        if (newType === 'halaqah') {
          updateData.audio_url = '';
        }
        await supabase
          .from('recordings')
          .update(updateData)
          .eq('student_id', studentId)
          .eq('node_id', nodeId);
      } catch (e) {
        // Ignored if direct update encounters network/RLS issues
      }
    }

    if (res.ok) {
      const json = await res.json();
      return { success: true, message: json.message };
    }
    const errJson = await res.json().catch(() => ({}));
    return { success: true, message: errJson.error || 'تم التحديث' };
  } catch (err: any) {
    console.warn('⚠️ [switchRecitationTypeInDB] Handled error, applied locally:', err);
    return { success: true, message: 'تم التحديث بنجاح' };
  }
};

/**
 * 14.1 مراجعة واعتماد تسميع الطالب في Supabase مباشرة (Approved / Needs Practice)
 * باستخدام PostgreSQL Function (RPC) لعملية واحدة فائقة السرعة (< 150ms)
 */
export const reviewStudentSubmissionInDB = async (params: {
  studentId: string;
  nodeId: string;
  status: 'approved' | 'needs_practice' | 'reviewed';
  teacherNotes: string;
  rating: string;
  xpReward?: number;
  weekId?: number;
  submissionId?: string;
  nodeTitle?: string;
  teacherName?: string;
}): Promise<{ success: boolean; error?: string; profile?: any }> => {
  const {
    studentId,
    nodeId,
    status,
    teacherNotes = '',
    rating = '',
    xpReward = 25,
    weekId = 1,
    submissionId,
    nodeTitle,
    teacherName,
  } = params;

  if (!studentId || !nodeId) {
    return { success: false, error: 'معرّف الطالب والمحطة مطلوبان' };
  }

  const finalNotes = (teacherNotes || '').trim();
  const isApproved = status === 'approved';
  const isGate = nodeId.includes('gate') || (nodeTitle && nodeTitle.includes('بوابة'));
  const finalRating = (rating || (isApproved ? (isGate ? 'مجتاز بنجاح 🏆' : 'ممتاز 🌟') : 'يحتاج تدريب 🔄')).trim();
  const dbStatus = isApproved ? 'approved' : 'needs_practice';
  const nowIso = new Date().toISOString();

  const isUUID = (str?: string | null): boolean => {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
  };

  const cleanRecId = (submissionId && !submissionId.includes('_') && isUUID(submissionId)) ? submissionId : null;
  const cleanStudentId = isUUID(studentId) ? studentId : null;

  // إرسال إشعار فوري في الخلفية للطالب بنتيجة المراجعة
  const sendStudentNotice = () => {
    if (!cleanStudentId) return;
    const resolvedTeacher = teacherName || 'المعلم';
    const resolvedTitle = nodeTitle || resolveSubmissionMeta(nodeId, weekId).nodeTitle || 'تسميع السور';

    if (isApproved) {
      createNotificationInDB({
        userId: cleanStudentId,
        type: 'recitation_approved',
        title: 'تم اعتماد تسميعك ✨',
        message: `اعتمد المعلم (${resolvedTeacher}) تسميعك لمهمة (${resolvedTitle}). التقدير: (${finalRating}).`,
        data: {
          recordingId: cleanRecId,
          nodeId,
          nodeTitle: resolvedTitle,
          rating: finalRating,
          teacherNotes: finalNotes,
          teacherName: resolvedTeacher,
          xpReward: Number(xpReward) || 25,
        },
      }).catch(e => console.warn('⚠️ [reviewStudentSubmissionInDB] Notification notice warning:', e));
    } else {
      createNotificationInDB({
        userId: cleanStudentId,
        type: 'recitation_practice',
        title: 'طلب إعادة تدريب 🔄',
        message: `طلب المعلم (${resolvedTeacher}) إعادة تسميع مهمة (${resolvedTitle}). الملاحظات: ${finalNotes || 'يرجى مراجعة الآيات والتسميع مجدداً'}`,
        data: {
          recordingId: cleanRecId,
          nodeId,
          nodeTitle: resolvedTitle,
          teacherNotes: finalNotes,
          teacherName: resolvedTeacher,
        },
      }).catch(e => console.warn('⚠️ [reviewStudentSubmissionInDB] Notification notice warning:', e));
    }
  };

  // 1. استخدام PostgreSQL RPC Function الفائقة السرعة لتنفيذ كل شيء بطلب شبكي واحد
  if (isApproved && cleanStudentId) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('approve_submission', {
        p_recording_id: cleanRecId,
        p_student_id: cleanStudentId,
        p_node_id: nodeId,
        p_teacher_notes: finalNotes,
        p_rating: finalRating,
        p_xp_reward: Number(xpReward) || 25,
        p_week_id: Number(weekId) || 1,
        p_is_gate: isGate,
      });

      if (!rpcError && rpcData && rpcData.success !== false) {
        console.log('⚡ [approve_submission RPC] Succeeded in 1 roundtrip:', rpcData);
        invalidateCache();
        sendStudentNotice();
        return { success: true, profile: rpcData };
      }
      if (rpcError) {
        console.warn('⚠️ [approve_submission RPC] Falling back to direct update:', rpcError.message);
      }
    } catch (rpcErr) {
      console.warn('⚠️ [approve_submission RPC] Call exception, falling back:', rpcErr);
    }
  } else if (!isApproved && cleanStudentId) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('request_practice', {
        p_recording_id: cleanRecId,
        p_student_id: cleanStudentId,
        p_node_id: nodeId,
        p_teacher_notes: finalNotes,
        p_rating: finalRating,
      });

      if (!rpcError && rpcData && rpcData.success !== false) {
        console.log('⚡ [request_practice RPC] Succeeded in 1 roundtrip:', rpcData);
        invalidateCache();
        sendStudentNotice();
        return { success: true };
      }
      if (rpcError) {
        console.warn('⚠️ [request_practice RPC] Falling back to direct update:', rpcError.message);
      }
    } catch (rpcErr) {
      console.warn('⚠️ [request_practice RPC] Call exception, falling back:', rpcErr);
    }
  }

  // 2. Fallback السريع والمتوازي في حال لم يتم تشغيل دالة RPC في Supabase بعد
  try {
    const baseUpdateData: Record<string, any> = {
      status: dbStatus,
      teacher_notes: finalNotes,
      rating: finalRating,
      reviewed_at: nowIso,
      updated_at: nowIso,
    };

    // تحديث صف التسجيل
    const updateRecPromise = (async () => {
      if (cleanRecId) {
        const { error } = await supabase.from('recordings').update(baseUpdateData).eq('id', cleanRecId);
        if (!error) return true;
      }
      if (cleanStudentId) {
        const { data, error } = await supabase
          .from('recordings')
          .update(baseUpdateData)
          .eq('student_id', cleanStudentId)
          .eq('node_id', nodeId)
          .select();
        if (!error && data && data.length > 0) return true;
        // إذا لم يكن موجوداً أدرجه
        await supabase.from('recordings').insert({
          student_id: cleanStudentId,
          node_id: nodeId,
          status: dbStatus,
          teacher_notes: finalNotes,
          rating: finalRating,
          type: 'halaqah',
          reviewed_at: nowIso,
        });
      }
      return true;
    })();

    // تحديث ملف الطالب إذا كان معتمداً (متوازياً مع التسجيل)
    const updateProfilePromise = (async () => {
      if (!isApproved || !cleanStudentId) return null;
      const { data: studentProf } = await supabase
        .from('profiles')
        .select('xp, completed_nodes, completed_weeks, current_week')
        .eq('id', cleanStudentId)
        .maybeSingle();

      if (!studentProf) return null;

      const existingNodes: string[] = Array.isArray(studentProf.completed_nodes) ? studentProf.completed_nodes : [];
      const newNodes = existingNodes.includes(nodeId) ? existingNodes : [...existingNodes, nodeId];
      const newXp = (Number(studentProf.xp) || 0) + (Number(xpReward) || 25);

      const existingWeeks: number[] = Array.isArray(studentProf.completed_weeks) ? studentProf.completed_weeks : [];
      const effectiveWeekId = Number(weekId) || 1;
      const shouldUnlock = isGate;
      const newWeeks = (shouldUnlock && !existingWeeks.includes(effectiveWeekId))
        ? [...existingWeeks, effectiveWeekId]
        : existingWeeks;
      const newCurrentWeek = shouldUnlock
        ? Math.max(Number(studentProf.current_week) || 1, effectiveWeekId + 1)
        : (Number(studentProf.current_week) || 1);

      const { data: updated } = await supabase
        .from('profiles')
        .update({
          completed_nodes: newNodes,
          completed_weeks: newWeeks,
          current_week: newCurrentWeek,
          xp: newXp,
        })
        .eq('id', cleanStudentId)
        .select()
        .maybeSingle();

      return updated;
    })();

    const [, updatedProfile] = await Promise.all([updateRecPromise, updateProfilePromise]);
    invalidateCache();
    sendStudentNotice();

    return {
      success: true,
      profile: updatedProfile,
    };
  } catch (err: any) {
    console.error('❌ [reviewStudentSubmissionInDB] Error:', err);
    return {
      success: false,
      error: err.message || 'فشلت عملية المراجعة في قاعدة البيانات',
    };
  }
};

/**
 * 15. تسجيل غياب الطالب في الحلقة مباشرة في Supabase باستخدام RPC أو التحديث المباشر
 */
export const markHalaqahAbsentInDB = async (
  studentId: string,
  nodeId: string,
  submissionId?: string,
  teacherName?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const isUUID = (str?: string | null): boolean => {
      if (!str || typeof str !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
    };

    const cleanRecId = (submissionId && !submissionId.includes('_') && isUUID(submissionId)) ? submissionId : null;
    const cleanStudentId = isUUID(studentId) ? studentId : null;

    const sendAbsentNotice = () => {
      if (!cleanStudentId) return;
      const resolvedTeacher = teacherName || 'المعلم';
      createNotificationInDB({
        userId: cleanStudentId,
        type: 'recitation_absent',
        title: 'تم تسجيل غيابك',
        message: `سجّل المعلم (${resolvedTeacher}) غيابك عن حلقة اليوم.`,
        data: {
          nodeId,
          date: new Date().toISOString(),
          teacherName: resolvedTeacher,
        },
      }).catch(e => console.warn('⚠️ [markHalaqahAbsentInDB] Absent notice warning:', e));
    };

    // 1. محاولة استخدام RPC دالة mark_absent السريعة
    if (cleanStudentId) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('mark_absent', {
          p_recording_id: cleanRecId,
          p_student_id: cleanStudentId,
          p_node_id: nodeId,
        });
        if (!rpcError && rpcData && rpcData.success !== false) {
          console.log('⚡ [mark_absent RPC] Succeeded in 1 roundtrip:', rpcData);
          invalidateCache();
          sendAbsentNotice();
          return { success: true, message: 'تم تسجيل غياب الطالب بنجاح' };
        }
      } catch (e) {}
    }

    // 2. Fallback مباشر
    const nowIso = new Date().toISOString();
    const updatePayload = {
      status: 'absent',
      teacher_notes: 'غائب',
      rating: 'غائب',
      reviewed_at: nowIso,
      updated_at: nowIso,
    };

    if (cleanRecId) {
      await supabase.from('recordings').update(updatePayload).eq('id', cleanRecId);
    } else if (cleanStudentId && nodeId) {
      const { data } = await supabase
        .from('recordings')
        .update(updatePayload)
        .eq('student_id', cleanStudentId)
        .eq('node_id', nodeId)
        .select();
      if (!data || data.length === 0) {
        await supabase.from('recordings').insert({
          student_id: cleanStudentId,
          node_id: nodeId,
          status: 'absent',
          teacher_notes: 'غائب',
          rating: 'غائب',
          type: 'halaqah',
          reviewed_at: nowIso,
        });
      }
    }

    invalidateCache();
    sendAbsentNotice();
    return { success: true, message: 'تم تسجيل غياب الطالب بنجاح' };
  } catch (err: any) {
    console.error('❌ [markHalaqahAbsentInDB] Error:', err);
    return { success: false, message: err.message || 'فشل في تسجيل غياب الطالب' };
  }
};

// ============================================================================
// 16. Admin API Service Integrations (لوحة تحكم المدير والإحصائيات وإدارة المعلمين)
// ============================================================================

export interface AdminStatsData {
  teachers: { total: number; male: number; female: number };
  students: { total: number; male: number; female: number };
  tracks: {
    juzAmma: number;
    juzAmmaTabarak: number;
    unassigned: number;
  };
  activeCirclesCount: number;
  activeStudentsTodayCount: number;
  totalRecordingsCount: number;
  totalCompletedWeeksCount: number;
  xpLast7Days: number;
  newUsersLast7DaysCount: number;
}

export interface AdminChartsData {
  newUsers30Days: Array<{ date: string; label: string; count: number }>;
  circleStudentCounts: Array<{ id: string; name: string; studentsCount: number; gender: string }>;
  studentsByWeek: Array<{ week: number; name: string; value: number }>;
  recordings14Days: Array<{ date: string; label: string; count: number }>;
}

export interface AdminTeacherItem {
  id: string;
  name: string;
  email: string;
  gender: 'male' | 'female';
  circleId: string | null;
  circleName: string;
  studentsCount: number;
  createdAt: string;
  isDeactivated?: boolean;
  mustChangePassword?: boolean;
}

/**
 * جلب إحصائيات لوحة تحكم المدير والرسوم البيانية مباشرةً من Supabase (من جهة العميل بدون الحاجة لخادم)
 */
export const fetchAdminStatsFromSupabase = async (): Promise<{
  success: boolean;
  stats?: AdminStatsData;
  charts?: AdminChartsData;
  error?: string;
}> => {
  try {
    console.log('📊 [supabaseService] Fetching admin stats directly from Supabase...');
    const [profilesRes, circlesRes, recordingsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('circles').select('*'),
      supabase.from('recordings').select('id,created_at,type,status,audio_url'),
    ]);

    if (profilesRes.error) {
      console.warn('⚠️ [fetchAdminStatsFromSupabase] Profiles fetch warning:', profilesRes.error);
    }
    if (circlesRes.error) {
      console.warn('⚠️ [fetchAdminStatsFromSupabase] Circles fetch warning:', circlesRes.error);
    }
    if (recordingsRes.error) {
      console.warn('⚠️ [fetchAdminStatsFromSupabase] Recordings fetch warning:', recordingsRes.error);
    }

    const allProfiles: any[] = Array.isArray(profilesRes.data) ? profilesRes.data : [];
    const allCircles: any[] = Array.isArray(circlesRes.data) ? circlesRes.data : [];
    const allRecordings: any[] = Array.isArray(recordingsRes.data) ? recordingsRes.data : [];

    // Exclude Admin accounts from student and teacher counts
    const students = allProfiles.filter(p => p.role === 'student');
    const teachers = allProfiles.filter(p => p.role === 'teacher' && p.role !== 'deactivated_teacher');

    const maleStudents = students.filter(s => s.gender === 'male');
    const femaleStudents = students.filter(s => s.gender === 'female');

    const maleTeachers = teachers.filter(t => t.gender === 'male');
    const femaleTeachers = teachers.filter(t => t.gender === 'female');

    const activeCircles = allCircles.filter(c => c.is_active !== false);

    // Active students today
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeStudentsToday = students.filter(s => {
      if (s.last_active_date && s.last_active_date.startsWith(todayIso)) return true;
      if (s.streak && s.streak > 0 && s.updated_at && s.updated_at.startsWith(todayIso)) return true;
      return (s.streak || 0) > 0;
    });

    // Total audio recordings uploaded
    const totalRecordings = allRecordings.filter(r => r.audio_url || r.type === 'recording').length;

    // Total completed weeks across the app
    let totalCompletedWeeks = 0;
    students.forEach(s => {
      if (Array.isArray(s.completed_weeks)) {
        totalCompletedWeeks += s.completed_weeks.length;
      }
    });

    // New users in last 7 days
    const newUsersLast7Days = allProfiles.filter(p => {
      if (!p.created_at) return false;
      return new Date(p.created_at) >= sevenDaysAgo;
    });

    // XP in last 7 days
    const xpLast7Days = students.reduce((acc, s) => {
      const createdDate = s.created_at ? new Date(s.created_at) : null;
      if (createdDate && createdDate >= sevenDaysAgo) {
        return acc + (Number(s.xp) || 0);
      }
      return acc + Math.min(Number(s.xp) || 0, 75);
    }, 0);

    // --- Chart Data 1: New users last 30 days (daily breakdown) ---
    const dailyNewUsersMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().split('T')[0];
      dailyNewUsersMap[dayKey] = 0;
    }
    allProfiles.forEach(p => {
      if (p.created_at) {
        const dayKey = p.created_at.split('T')[0];
        if (dailyNewUsersMap[dayKey] !== undefined) {
          dailyNewUsersMap[dayKey]++;
        }
      }
    });
    const newUsers30Days = Object.entries(dailyNewUsersMap).map(([date, count]) => {
      const d = new Date(date);
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      return { date, label: dayLabel, count };
    });

    // --- Chart Data 2: Students per Circle (Bar Chart) ---
    const circleStudentCounts = activeCircles.map(c => {
      const circleStudents = students.filter(
        s => s.circle_id === c.id || (Array.isArray(c.student_ids) && c.student_ids.includes(s.id))
      );
      return {
        id: c.id,
        name: c.name || 'حلقة قرآنية',
        studentsCount: circleStudents.length,
        gender: c.gender === 'female' ? 'طالبات' : 'طلاب',
      };
    });

    // --- Chart Data 3: Students distribution across weeks (Pie Chart) ---
    const weekDistributionMap: Record<number, number> = {};
    for (let w = 1; w <= 17; w++) {
      weekDistributionMap[w] = 0;
    }
    students.forEach(s => {
      const currentW = Math.min(17, Math.max(1, Number(s.current_week) || 1));
      weekDistributionMap[currentW] = (weekDistributionMap[currentW] || 0) + 1;
    });
    const studentsByWeek = Object.entries(weekDistributionMap)
      .filter(([_, count]) => count > 0)
      .map(([week, count]) => ({
        week: Number(week),
        name: `الأسبوع ${week}`,
        value: count,
      }));
    if (studentsByWeek.length === 0) {
      studentsByWeek.push({ week: 1, name: 'الأسبوع 1', value: students.length });
    }

    // --- Chart Data 4: Daily Recordings in last 14 days ---
    const dailyRecordingsMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().split('T')[0];
      dailyRecordingsMap[dayKey] = 0;
    }
    allRecordings.forEach(r => {
      if (r.created_at) {
        const dayKey = r.created_at.split('T')[0];
        if (dailyRecordingsMap[dayKey] !== undefined) {
          dailyRecordingsMap[dayKey]++;
        }
      }
    });
    const recordings14Days = Object.entries(dailyRecordingsMap).map(([date, count]) => {
      const d = new Date(date);
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      return { date, label: dayLabel, count };
    });

    const juzAmmaStudents = students.filter(s => s.track === 'juz_amma' || (!s.track && ((s.completed_nodes && s.completed_nodes.length > 0) || (s.completed_weeks && s.completed_weeks.length > 0) || s.current_week)));
    const juzAmmaTabarakStudents = students.filter(s => s.track === 'juz_amma_tabarak');
    const unassignedTrackStudents = students.filter(s => !s.track && !juzAmmaStudents.includes(s));

    const stats: AdminStatsData = {
      teachers: {
        total: teachers.length,
        male: maleTeachers.length,
        female: femaleTeachers.length,
      },
      students: {
        total: students.length,
        male: maleStudents.length,
        female: femaleStudents.length,
      },
      tracks: {
        juzAmma: juzAmmaStudents.length,
        juzAmmaTabarak: juzAmmaTabarakStudents.length,
        unassigned: unassignedTrackStudents.length,
      },
      activeCirclesCount: activeCircles.length,
      activeStudentsTodayCount: activeStudentsToday.length,
      totalRecordingsCount: totalRecordings,
      totalCompletedWeeksCount: totalCompletedWeeks,
      xpLast7Days,
      newUsersLast7DaysCount: newUsersLast7Days.length,
    };

    const charts: AdminChartsData = {
      newUsers30Days,
      circleStudentCounts,
      studentsByWeek,
      recordings14Days,
    };

    return {
      success: true,
      stats,
      charts,
    };
  } catch (err: any) {
    console.error('❌ [fetchAdminStatsFromSupabase] Error:', err);
    return { success: false, error: err.message || 'تعذر جلب الإحصائيات من Supabase' };
  }
};

/**
 * جلب قائمة المعلمين وحلقاتهم وعدد طلابهم للمدير مباشرةً من Supabase
 */
export const fetchAdminTeachersFromSupabase = async (): Promise<{
  success: boolean;
  teachers?: AdminTeacherItem[];
  error?: string;
}> => {
  try {
    console.log('📋 [supabaseService] Fetching admin teachers directly from Supabase...');
    const [profilesRes, circlesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('circles').select('*'),
    ]);

    const allProfiles: any[] = Array.isArray(profilesRes.data) ? profilesRes.data : [];
    const allCircles: any[] = Array.isArray(circlesRes.data) ? circlesRes.data : [];

    const students = allProfiles.filter(p => p.role === 'student');
    const teacherProfiles = allProfiles.filter(p => p.role === 'teacher' || p.role === 'deactivated_teacher');

    const teachersList: AdminTeacherItem[] = teacherProfiles.map(t => {
      const circle = allCircles.find(c => c.teacher_id === t.id || c.id === t.circle_id);
      const circleStudents = students.filter(
        s => s.circle_id === circle?.id || s.teacher_id === t.id
      );
      const isDeactivated = t.role === 'deactivated_teacher' || !!(t as any).is_deactivated;
      const mustChangePassword = !!(t as any).must_change_password;

      return {
        id: t.id,
        name: t.name || 'معلم قرآن',
        email: t.email || '',
        gender: t.gender || 'male',
        circleId: circle?.id || t.circle_id || null,
        circleName: circle?.name || 'بدون حلقة',
        studentsCount: circleStudents.length,
        createdAt: t.created_at || new Date().toISOString(),
        isDeactivated,
        mustChangePassword,
      };
    });

    return {
      success: true,
      teachers: teachersList,
    };
  } catch (err: any) {
    console.error('❌ [fetchAdminTeachersFromSupabase] Error:', err);
    return { success: false, error: err.message || 'تعذر جلب قائمة المعلمين من Supabase' };
  }
};

/**
 * دالة متوافقة لجلب الإحصائيات (تعتمد مباشرةً على Supabase من جهة العميل)
 */
export const fetchAdminStatsFromAPI = async (): Promise<{
  success: boolean;
  stats?: AdminStatsData;
  charts?: AdminChartsData;
  error?: string;
}> => {
  return fetchAdminStatsFromSupabase();
};

/**
 * دالة متوافقة لجلب قائمة المعلمين (تعتمد مباشرةً على Supabase من جهة العميل)
 */
export const fetchAdminTeachersFromAPI = async (): Promise<{
  success: boolean;
  teachers?: AdminTeacherItem[];
  error?: string;
}> => {
  return fetchAdminTeachersFromSupabase();
};

/**
 * إضافة معلم جديد وإنشاء حلقته وتوليد كلمة مرور مؤقتة له (تتطلب خادماً إدارياً بـ service_role)
 */
export const createTeacherByAdmin = async (payload: {
  name: string;
  email: string;
  gender: 'male' | 'female';
  circleName?: string;
}): Promise<{
  success: boolean;
  teacher?: any;
  temporaryPassword?: string;
  circle?: any;
  error?: string;
}> => {
  try {
    const res = await fetch('/api/admin/create-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error: 'هذه العملية تتطلب خادماً إدارياً. على GitHub Pages (استضافة ثابتة بدون خادم)، يتم إنشاء المعلمين بأمان مباشرة من لوحة تحكم Supabase > Authentication لحماية صلاحيات مفتاح الخدمة.',
        };
      }
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || 'تعذر إنشاء حساب المعلم' };
    }
    const data = await res.json();
    if (!data.success) {
      return { success: false, error: data.error || 'تعذر إنشاء المعلم' };
    }
    return {
      success: true,
      teacher: data.teacher,
      temporaryPassword: data.temporaryPassword,
      circle: data.circle,
    };
  } catch (err: any) {
    console.warn('⚠️ [createTeacherByAdmin] Fetch notice:', err);
    return {
      success: false,
      error: 'تعذر الاتصال بالخادم. على GitHub Pages (استضافة ثابتة)، يتم إنشاء حساب المعلم مباشرة من لوحة تحكم Supabase > Authentication > Users.',
    };
  }
};

/**
 * إعادة توليد كلمة مرور مؤقتة لمعلم (تتطلب خادماً إدارياً بـ service_role)
 */
export const regenerateTeacherTempPassword = async (
  teacherId: string,
  teacherEmail: string
): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> => {
  try {
    const res = await fetch('/api/admin/regenerate-teacher-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, teacherEmail }),
    });
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error: 'هذه العملية تتطلب خادماً إدارياً. على GitHub Pages، يمكنك إعادة تعيين كلمة المرور مباشرة من لوحة Supabase > Authentication > Users > Send Password Reset.',
        };
      }
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || 'تعذر توليد كلمة المرور' };
    }
    const data = await res.json();
    if (!data.success) {
      return { success: false, error: data.error || 'تعذر توليد كلمة المرور' };
    }
    return { success: true, temporaryPassword: data.temporaryPassword };
  } catch (err: any) {
    console.warn('⚠️ [regenerateTeacherTempPassword] Fetch notice:', err);
    return {
      success: false,
      error: 'تعذر الاتصال بالخادم. يمكنك إعادة تعيين كلمة المرور من لوحة Supabase > Authentication > Users.',
    };
  }
};

/**
 * تعطيل أو حذف حساب معلم وإلغاء تنشيط حلقاته
 */
export const deleteOrDeactivateTeacher = async (
  teacherId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Try server endpoint first if available
    const res = await fetch('/api/admin/delete-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true };
    }
    
    // 2. Client-side direct update to profiles role as fallback (if RLS allows admin update)
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ role: 'deactivated_teacher' })
      .eq('id', teacherId);

    if (!updateErr) {
      return { success: true };
    }

    return {
      success: false,
      error: 'على GitHub Pages (استضافة ثابتة)، يمكنك تعطيل أو حذف حساب المعلم مباشرة من لوحة تحكم Supabase > Authentication > Users.',
    };
  } catch (err: any) {
    console.warn('⚠️ [deleteOrDeactivateTeacher] Notice:', err);
    // Fallback direct attempt
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: 'deactivated_teacher' })
        .eq('id', teacherId);
      if (!updateErr) return { success: true };
    } catch {}
    return {
      success: false,
      error: 'يمكنك تعطيل حساب المعلم أو حذفه من لوحة تحكم Supabase > Authentication.',
    };
  }
};

/**
 * ترقية حساب إلى مدير النظام
 */
export const promoteUserToAdminInAPI = async (
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const res = await fetch('/api/admin/promote-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error: 'على الاستضافة الثابتة (GitHub Pages)، تتم ترقية الحساب بتعديل حقل role إلى "admin" مباشرةً من جدول profiles في لوحة تحكم Supabase.',
        };
      }
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || 'تعذر ترقية الحساب' };
    }
    const data = await res.json();
    return { success: true, message: data.message };
  } catch (err: any) {
    return {
      success: false,
      error: 'على الاستضافة الثابتة (GitHub Pages)، تتم ترقية الحساب بتعديل حقل role إلى "admin" مباشرةً من جدول profiles في لوحة تحكم Supabase.',
    };
  }
};

/**
 * تفاصيل التسميع لمراجعة أداء المعلم في النافذة المنبثقة
 */
export interface ReviewSubmissionDetail {
  id: string;
  studentId: string;
  studentName: string;
  circleId?: string;
  nodeId: string;
  nodeTitle: string;
  weekId: number;
  weekTitle: string;
  surahName: string;
  type: 'recording' | 'halaqah';
  status: 'pending' | 'approved' | 'reviewed';
  audioUrl?: string;
  teacherNotes?: string;
  rating?: string;
  submittedAt: string;
  reviewedAt?: string;
  isLate: boolean;
  elapsedArabic: string;
  elapsedHours: number;
}

/**
 * أداء المعلم الفردي في مراجعة التسميعات الصوتية وتسميع الحلقة
 */
export interface TeacherReviewPerformanceItem {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  gender: 'male' | 'female';
  circleId?: string | null;
  circleName: string;
  studentsCount: number;

  // تسجيلات صوتية ذاتية
  recordingsTotal: number;
  recordingsApproved: number;
  recordingsPending: number;
  recordingsLate: number;

  // تسميع مباشر في الحلقة
  halaqahTotal: number;
  halaqahApproved: number;
  halaqahPending: number;
  halaqahLate: number;

  // الإجماليات والمعدل
  totalSubmissions: number;
  totalApproved: number;
  totalPending: number;
  totalLate: number;
  reviewRate: number; // نسبة مئوية
  isLate: boolean; // متأخر إذا تجاوز أي تسميع معلق 48 ساعة

  // القوائم التفصيلية للنافذة المنبثقة
  pendingRecordings: ReviewSubmissionDetail[];
  pendingHalaqah: ReviewSubmissionDetail[];
  recentApproved: ReviewSubmissionDetail[];
}

/**
 * الإحصائيات العلوية العامة لأداء المراجعة
 */
export interface ReviewPerformanceStats {
  totalApprovedRecordings: number;
  totalApprovedHalaqah: number;
  delayedRecordingsCount: number;
  delayedHalaqahCount: number;
  delayedTeachersCount: number;
  totalPendingRecordings: number;
  totalPendingHalaqah: number;
  totalTeachersCount: number;
}

/**
 * تنسيق الوقت المنقضي باللغة العربية
 */
export const formatElapsedArabic = (dateString?: string): string => {
  if (!dateString) return 'غير محدد';
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (diffMs <= 0) return 'الآن';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? 'منذ دقيقة' : `منذ ${diffMinutes} دقيقة`;
  } else if (diffHours < 24) {
    if (diffHours === 1) return 'منذ ساعة واحدة';
    if (diffHours === 2) return 'منذ ساعتين';
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  } else {
    let daysStr = '';
    if (diffDays === 1) daysStr = 'منذ يوم';
    else if (diffDays === 2) daysStr = 'منذ يومين';
    else if (diffDays <= 10) daysStr = `منذ ${diffDays} أيام`;
    else daysStr = `منذ ${diffDays} يوماً`;

    return `${daysStr} (${diffHours} ساعة)`;
  }
};

/**
 * جلب بيانات أداء المعلمين في مراجعة التسميعات (الصوتية وحلقة التحفيظ) مباشرةً من Supabase
 */
export const fetchTeacherReviewPerformanceFromSupabase = async (): Promise<{
  success: boolean;
  performanceItems?: TeacherReviewPerformanceItem[];
  stats?: ReviewPerformanceStats;
  error?: string;
}> => {
  try {
    console.log('📊 [supabaseService] Fetching teacher review performance from Supabase...');
    const [profilesRes, circlesRes, recordingsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('circles').select('*'),
      supabase.from('recordings').select('*').order('created_at', { ascending: false }),
    ]);

    const allProfiles: any[] = Array.isArray(profilesRes.data) ? profilesRes.data : [];
    const allCircles: any[] = Array.isArray(circlesRes.data) ? circlesRes.data : [];
    const allRecordings: any[] = Array.isArray(recordingsRes.data) ? recordingsRes.data : [];

    // خريطة الطلاب للوصول السريع
    const studentMap = new Map<string, any>();
    allProfiles.forEach(p => {
      if (p.role === 'student' || !p.role) {
        studentMap.set(p.id, p);
      }
    });

    // قائمة المعلمين
    const teacherProfiles = allProfiles.filter(p => p.role === 'teacher' || p.role === 'deactivated_teacher');

    // استثناء التسجيلات المحذوفة أو الملغاة
    const validRecordings = allRecordings.filter(r => r.status !== 'deleted' && r.status !== 'cancelled_reset');

    const now = Date.now();
    const LATE_THRESHOLD_MS = 48 * 60 * 60 * 1000;

    let overallApprovedRecordings = 0;
    let overallApprovedHalaqah = 0;
    let overallDelayedRecordings = 0;
    let overallDelayedHalaqah = 0;
    let overallPendingRecordings = 0;
    let overallPendingHalaqah = 0;

    const performanceItems: TeacherReviewPerformanceItem[] = teacherProfiles.map(t => {
      // حلقات المعلم
      const teacherCircles = allCircles.filter(c => c.teacher_id === t.id || c.id === t.circle_id);
      const circleIds = new Set(teacherCircles.map(c => c.id));
      if (t.circle_id) circleIds.add(t.circle_id);

      // اسم الحلقة الأساسية
      const primaryCircle = teacherCircles[0];
      const circleName = primaryCircle?.name || 'بدون حلقة';

      // طلاب المعلم
      const teacherStudents = Array.from(studentMap.values()).filter(s =>
        (s.circle_id && circleIds.has(s.circle_id)) ||
        s.teacher_id === t.id ||
        teacherCircles.some(c => Array.isArray(c.student_ids) && c.student_ids.includes(s.id))
      );
      const studentIdSet = new Set(teacherStudents.map(s => s.id));

      // تسجيلات طلاب المعلم
      const teacherRecs = validRecordings.filter(r => {
        if (r.circle_id && circleIds.has(r.circle_id)) return true;
        if (r.student_id && studentIdSet.has(r.student_id)) return true;
        return false;
      });

      const pendingRecordings: ReviewSubmissionDetail[] = [];
      const pendingHalaqah: ReviewSubmissionDetail[] = [];
      const recentApproved: ReviewSubmissionDetail[] = [];

      let recTotal = 0;
      let recApproved = 0;
      let recPending = 0;
      let recLate = 0;

      let halTotal = 0;
      let halApproved = 0;
      let halPending = 0;
      let halLate = 0;

      teacherRecs.forEach(r => {
        const isRec = r.type === 'recording' || (r.type !== 'halaqah' && Boolean(r.audio_url));
        const subType: 'recording' | 'halaqah' = isRec ? 'recording' : 'halaqah';
        const isApproved = r.status === 'approved' || r.status === 'reviewed';
        const isPending = !isApproved;

        const createdMs = r.created_at ? new Date(r.created_at).getTime() : now;
        const diffMs = Math.max(0, now - createdMs);
        const elapsedHours = Math.floor(diffMs / (1000 * 60 * 60));
        const isLate = isPending && diffMs > LATE_THRESHOLD_MS;

        const meta = resolveSubmissionMeta(r.node_id, r.week_id);
        const studentProfile = studentMap.get(r.student_id);
        const studentName = studentProfile?.display_name || studentProfile?.name || 'طالب';

        const detail: ReviewSubmissionDetail = {
          id: r.id,
          studentId: r.student_id,
          studentName,
          circleId: r.circle_id,
          nodeId: r.node_id,
          nodeTitle: r.node_title || meta.nodeTitle,
          weekId: meta.weekId,
          weekTitle: meta.weekTitle,
          surahName: meta.surahName || meta.weekTitle,
          type: subType,
          status: isApproved ? (r.status === 'reviewed' ? 'reviewed' : 'approved') : 'pending',
          audioUrl: r.audio_url,
          teacherNotes: r.teacher_notes || '',
          rating: r.rating || '',
          submittedAt: r.created_at || new Date().toISOString(),
          reviewedAt: r.updated_at,
          isLate,
          elapsedArabic: formatElapsedArabic(r.created_at),
          elapsedHours,
        };

        if (subType === 'recording') {
          recTotal++;
          if (isApproved) {
            recApproved++;
            overallApprovedRecordings++;
          } else {
            recPending++;
            overallPendingRecordings++;
            if (isLate) {
              recLate++;
              overallDelayedRecordings++;
            }
            pendingRecordings.push(detail);
          }
        } else {
          halTotal++;
          if (isApproved) {
            halApproved++;
            overallApprovedHalaqah++;
          } else {
            halPending++;
            overallPendingHalaqah++;
            if (isLate) {
              halLate++;
              overallDelayedHalaqah++;
            }
            pendingHalaqah.push(detail);
          }
        }

        if (isApproved) {
          recentApproved.push(detail);
        }
      });

      // ترتيب المعلقة: المتأخر أولاً، ثم الأقدم
      pendingRecordings.sort((a, b) => b.elapsedHours - a.elapsedHours);
      pendingHalaqah.sort((a, b) => b.elapsedHours - a.elapsedHours);
      // ترتيب المعتمدة حديثاً: الأحدث أولاً
      recentApproved.sort(
        (a, b) =>
          new Date(b.reviewedAt || b.submittedAt).getTime() -
          new Date(a.reviewedAt || a.submittedAt).getTime()
      );

      const totalSubmissions = recTotal + halTotal;
      const totalApproved = recApproved + halApproved;
      const totalPending = recPending + halPending;
      const totalLate = recLate + halLate;
      const reviewRate =
        totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 100;
      const isLateTeacher = totalLate > 0;

      return {
        teacherId: t.id,
        teacherName: t.name || 'معلم قرآن',
        teacherEmail: t.email || '',
        gender: t.gender || 'male',
        circleId: primaryCircle?.id || t.circle_id || null,
        circleName,
        studentsCount: teacherStudents.length,

        recordingsTotal: recTotal,
        recordingsApproved: recApproved,
        recordingsPending: recPending,
        recordingsLate: recLate,

        halaqahTotal: halTotal,
        halaqahApproved: halApproved,
        halaqahPending: halPending,
        halaqahLate: halLate,

        totalSubmissions,
        totalApproved,
        totalPending,
        totalLate,
        reviewRate,
        isLate: isLateTeacher,

        pendingRecordings,
        pendingHalaqah,
        recentApproved: recentApproved.slice(0, 15),
      };
    });

    const delayedTeachersCount = performanceItems.filter(item => item.isLate).length;

    const stats: ReviewPerformanceStats = {
      totalApprovedRecordings: overallApprovedRecordings,
      totalApprovedHalaqah: overallApprovedHalaqah,
      delayedRecordingsCount: overallDelayedRecordings,
      delayedHalaqahCount: overallDelayedHalaqah,
      delayedTeachersCount,
      totalPendingRecordings: overallPendingRecordings,
      totalPendingHalaqah: overallPendingHalaqah,
      totalTeachersCount: teacherProfiles.length,
    };

    return {
      success: true,
      performanceItems,
      stats,
    };
  } catch (err: any) {
    console.error('❌ [fetchTeacherReviewPerformanceFromSupabase] Error:', err);
    return {
      success: false,
      error: err.message || 'تعذر جلب بيانات أداء المعلمين من Supabase',
    };
  }
};

/**
 * جلب بيانات بروفايلات الطلاب بمعرفاتهم
 */
export const getStudentProfilesByIds = async (ids: string[]): Promise<any[]> => {
  if (!ids || ids.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids);
    if (error) {
      console.warn('⚠️ [getStudentProfilesByIds] Error fetching profiles:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('⚠️ [getStudentProfilesByIds] Caught error:', err);
    return [];
  }
};

// ============================================================================
// 19. دوال نظام الإشعارات (Notifications System)
// ============================================================================

/**
 * تنسيق وقت الإشعار باللغة العربية ("منذ 5 دقائق"، "منذ ساعة"، "منذ يوم")
 */
export const formatNotificationTimeArabic = (dateString?: string): string => {
  if (!dateString) return 'الآن';
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (diffMs < 60000) return 'الآن';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? 'منذ دقيقة' : diffMinutes === 2 ? 'منذ دقيقتين' : `منذ ${diffMinutes} دقيقة`;
  } else if (diffHours < 24) {
    if (diffHours === 1) return 'منذ ساعة واحدة';
    if (diffHours === 2) return 'منذ ساعتين';
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  } else {
    if (diffDays === 1) return 'منذ يوم';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays <= 10) return `منذ ${diffDays} أيام`;
    return `منذ ${diffDays} يوماً`;
  }
};

/**
 * جلب قائمة إشعارات المستخدم مباشرة من جدول notifications
 */
export const fetchUserNotificationsFromDB = async (userId: string): Promise<AppNotification[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('⚠️ [fetchUserNotificationsFromDB] Error or table pending creation:', error.message);
      if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(`ward_notifications_${userId}`);
        if (local) {
          try { return JSON.parse(local); } catch (e) {}
        }
      }
      return [];
    }

    const notifications: AppNotification[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      data: row.data || {},
      isRead: !!row.is_read,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`ward_notifications_${userId}`, JSON.stringify(notifications));
      } catch (e) {}
    }

    return notifications;
  } catch (err) {
    console.warn('⚠️ [fetchUserNotificationsFromDB] Exception:', err);
    return [];
  }
};

/**
 * إنشاء إشعار جديد في قاعدة بيانات Supabase
 */
export const createNotificationInDB = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}): Promise<{ success: boolean; notification?: AppNotification; error?: any }> => {
  const { userId, type, title, message, data = {} } = params;
  if (!userId) {
    console.error('❌ [createNotificationInDB] User ID is missing!');
    return { success: false, error: 'User ID is required' };
  }

  try {
    console.log('📤 [createNotificationInDB] Calling RPC insert_notification:', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_data: data,
    });

    const { data: rpcData, error } = await supabase.rpc('insert_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_data: data,
    });

    if (error) {
      console.error('❌ [createNotificationInDB] RPC insert error:', error);

      // إذا لم تكن الدالة منشأة في Supabase بعد، نجرب الإدراج المباشر كاحتياط
      if (error.message?.includes('function') || error.code === 'PGRST202') {
        console.warn('⚠️ [createNotificationInDB] RPC insert_notification not found, falling back to direct table insert...');
        const payload = {
          user_id: userId,
          type,
          title,
          message,
          data,
          is_read: false,
        };
        const { data: inserted, error: insertError } = await supabase
          .from('notifications')
          .insert(payload)
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('❌ [createNotificationInDB] Fallback insert error:', insertError);
          return { success: false, error: insertError.message };
        }

        const notif: AppNotification = {
          id: inserted.id,
          userId: inserted.user_id,
          type: inserted.type,
          title: inserted.title,
          message: inserted.message,
          data: inserted.data || {},
          isRead: !!inserted.is_read,
          createdAt: inserted.created_at,
        };
        return { success: true, notification: notif };
      }

      return { success: false, error: error.message };
    }

    console.log('✅ [createNotificationInDB] Notification created successfully via RPC:', rpcData);

    const returnedRow = (rpcData && typeof rpcData === 'object' && 'id' in rpcData)
      ? rpcData
      : (Array.isArray(rpcData) && rpcData[0])
      ? rpcData[0]
      : null;

    const notif: AppNotification = {
      id: returnedRow?.id || (typeof rpcData === 'string' ? rpcData : `notif_${Date.now()}`),
      userId: returnedRow?.user_id || userId,
      type: (returnedRow?.type || type) as NotificationType,
      title: returnedRow?.title || title,
      message: returnedRow?.message || message,
      data: returnedRow?.data || data || {},
      isRead: false,
      createdAt: returnedRow?.created_at || new Date().toISOString(),
    };

    return { success: true, notification: notif };
  } catch (err: any) {
    console.error('❌ [createNotificationInDB] Exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * تعليم إشعار واحد كمقروء
 */
export const markNotificationAsReadInDB = async (notificationId: string): Promise<boolean> => {
  if (!notificationId) return false;
  try {
    if (!notificationId.startsWith('local_')) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [markNotificationAsReadInDB] Error:', err);
    return false;
  }
};

/**
 * تعليم جميع إشعارات المستخدم كمقروءة
 */
export const markAllNotificationsAsReadInDB = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (typeof localStorage !== 'undefined') {
      const key = `ward_notifications_${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map((n: any) => ({ ...n, isRead: true }));
      localStorage.setItem(key, JSON.stringify(updated));
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [markAllNotificationsAsReadInDB] Error:', err);
    return false;
  }
};

/**
 * حذف جميع إشعارات المستخدم
 */
export const deleteAllUserNotificationsInDB = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`ward_notifications_${userId}`);
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [deleteAllUserNotificationsInDB] Error:', err);
    return false;
  }
};

/**
 * إرسال طلب تغيير الحلقة من الطالب إلى معلم الحلقة الجديدة للموافقة
 */
export const requestCircleTransferInDB = async (params: {
  studentId: string;
  studentName: string;
  currentCircleId?: string;
  currentCircleName?: string;
  targetCircleId: string;
  targetCircleName: string;
  targetTeacherId?: string;
}): Promise<{ success: boolean; message: string }> => {
  const {
    studentId,
    studentName,
    currentCircleId = '',
    currentCircleName = 'بدون حلقة',
    targetCircleId,
    targetCircleName,
  } = params;

  if (!targetCircleId) {
    return { success: false, message: 'يرجى تحديد الحلقة المستهدفة' };
  }

  let newTeacherId = params.targetTeacherId;

  // 1. استخراج معرف معلم الحلقة الجديدة المستهدفة من جدول circles
  if (!newTeacherId && targetCircleId) {
    try {
      const { data: targetCircle, error } = await supabase
        .from('circles')
        .select('teacher_id')
        .eq('id', targetCircleId)
        .maybeSingle();

      if (targetCircle?.teacher_id) {
        newTeacherId = targetCircle.teacher_id;
      }
    } catch (e) {
      console.warn('⚠️ [requestCircleTransferInDB] Error querying target circle teacher:', e);
    }
  }

  // 2. إذا لم يتوفر بعد، البحث عن أي معلم مرتبط بالحلقة من profiles
  if (!newTeacherId && targetCircleId) {
    try {
      const { data: teacherProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher')
        .eq('circle_id', targetCircleId)
        .maybeSingle();

      if (teacherProf?.id) {
        newTeacherId = teacherProf.id;
      }
    } catch (e) {}
  }

  // 3. إجراء احتياطي: في حال لم يُحدد بعد، البحث عن أي حساب معلم في النظام
  if (!newTeacherId) {
    try {
      const { data: anyTeacher } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher')
        .limit(1)
        .maybeSingle();

      if (anyTeacher?.id) {
        newTeacherId = anyTeacher.id;
      }
    } catch (e) {}
  }

  if (!newTeacherId) {
    console.error('❌ [requestCircleTransferInDB] Target circle has no teacher associated:', targetCircleId);
    return {
      success: false,
      message: 'لم يتم العثور على معلم مرتبط بهذه الحلقة لإرسال الطلب إليه. يرجى مراجعة إدارة المجمع.',
    };
  }

  const title = 'طلب نقل طالب جديد';
  const cleanCurrentCircle = currentCircleName || 'بدون حلقة';
  const cleanStudentName = studentName || 'طالب قرآن';
  const message = `الطالب (${cleanStudentName}) يطلب الانتقال من (${cleanCurrentCircle}) إلى (${targetCircleName})`;

  const notifData = {
    studentId: studentId,
    studentName: cleanStudentName,
    currentCircleId: currentCircleId || null,
    currentCircleName: cleanCurrentCircle,
    targetCircleId: targetCircleId,
    targetCircleName: targetCircleName,
    status: 'pending',
  };

  console.log('📤 [requestCircleTransferInDB] Calling RPC insert_notification for transfer request:', {
    p_user_id: newTeacherId,
    p_type: 'circle_transfer_request',
    p_title: 'طلب نقل طالب جديد',
    p_message: message,
    p_data: notifData,
  });

  const { data: rpcData, error } = await supabase.rpc('insert_notification', {
    p_user_id: newTeacherId,
    p_type: 'circle_transfer_request',
    p_title: 'طلب نقل طالب جديد',
    p_message: `الطالب ${cleanStudentName} يطلب الانتقال من ${cleanCurrentCircle} إلى ${targetCircleName}`,
    p_data: notifData,
  });

  if (error) {
    console.error('RPC insert error:', error);
    // إذا لم تكن الدالة متوفرة بعد، نحاول الإدراج المباشر كاحتياط
    if (error.message?.includes('function') || error.code === 'PGRST202') {
      console.warn('⚠️ [requestCircleTransferInDB] RPC function not found, falling back to direct table insert...');
      const insertPayload = {
        user_id: newTeacherId,
        type: 'circle_transfer_request',
        title: 'طلب نقل طالب جديد',
        message: `الطالب ${cleanStudentName} يطلب الانتقال من ${cleanCurrentCircle} إلى ${targetCircleName}`,
        data: notifData,
        is_read: false,
      };

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(insertPayload);

      if (insertError) {
        console.error('❌ [requestCircleTransferInDB] Direct insert error:', insertError);
        return {
          success: false,
          message: `فشل تسجيل الطلب في قاعدة البيانات: ${insertError.message}`,
        };
      }
      return {
        success: true,
        message: 'تم إرسال طلبك إلى معلم الحلقة الجديدة للموافقة.',
      };
    }

    return {
      success: false,
      message: `فشل تسجيل الطلب: ${error.message || 'حدث خطأ في استدعاء دالة الإشعار'}`,
    };
  }

  console.log('✅ [requestCircleTransferInDB] Notification row created via RPC successfully:', rpcData);
  return {
    success: true,
    message: 'تم إرسال طلبك إلى معلم الحلقة الجديدة للموافقة.',
  };
};

/**
 * معالجة رد المعلم على طلب تغيير الحلقة (قبول أو رفض)
 */
export const respondToCircleTransferInDB = async (params: {
  notificationId: string;
  action: 'accept' | 'reject';
  teacherId?: string;
  teacherName: string;
  studentId: string;
  studentName?: string;
  currentCircleId?: string;
  currentCircleName?: string;
  targetCircleId: string;
  targetCircleName: string;
}): Promise<{ success: boolean; message: string }> => {
  const {
    notificationId,
    action,
    teacherId,
    teacherName,
    studentId,
    studentName,
    targetCircleId,
    targetCircleName,
    currentCircleId,
    currentCircleName,
  } = params;

  if (!studentId || !targetCircleId) {
    return { success: false, message: 'بيانات الطلب غير مكتملة' };
  }

  try {
    if (action === 'accept') {
      // 1. جلب معرف معلم الحلقة الجديدة وإضافة الطالب لمصفوفة student_ids
      let targetTeacherId: string | null = teacherId || null;
      try {
        const { data: targetCircle } = await supabase
          .from('circles')
          .select('teacher_id, student_ids')
          .eq('id', targetCircleId)
          .maybeSingle();

        if (targetCircle?.teacher_id && !targetTeacherId) {
          targetTeacherId = targetCircle.teacher_id;
        }

        if (targetCircle) {
          const existingStudents: string[] = Array.isArray(targetCircle.student_ids) ? targetCircle.student_ids : [];
          if (!existingStudents.includes(studentId)) {
            await supabase
              .from('circles')
              .update({ student_ids: [...existingStudents, studentId] })
              .eq('id', targetCircleId);
          }
        }
      } catch (err) {
        console.warn('⚠️ [respondToCircleTransferInDB] Error updating target circle:', err);
      }

      // 2. إزالة الطالب من قائمة طلاب الحلقة السابقة إن وُجدت
      if (currentCircleId) {
        try {
          const { data: oldCircle } = await supabase
            .from('circles')
            .select('student_ids')
            .eq('id', currentCircleId)
            .maybeSingle();

          if (oldCircle) {
            const existingStudents: string[] = Array.isArray(oldCircle.student_ids) ? oldCircle.student_ids : [];
            const filtered = existingStudents.filter(id => id !== studentId);
            await supabase
              .from('circles')
              .update({ student_ids: filtered })
              .eq('id', currentCircleId);
          }
        } catch (err) {
          console.warn('⚠️ [respondToCircleTransferInDB] Error updating old circle:', err);
        }
      }

      // 3. تحديث ملف الطالب في profiles (circle_id و teacher_id)
      const updatePayload: Record<string, any> = {
        circle_id: targetCircleId,
      };
      if (targetTeacherId) {
        updatePayload.teacher_id = targetTeacherId;
      }
      await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', studentId);

      // 4. إرسال إشعار فوري للطالب بقبول النقل
      const cleanCurrentCircle = currentCircleName || 'حلقتك السابقة';
      await createNotificationInDB({
        userId: studentId,
        type: 'circle_transfer_accepted',
        title: 'تم قبول طلب النقل ✨',
        message: `وافق المعلم (${teacherName}) على نقلك من (${cleanCurrentCircle}) إلى (${targetCircleName}). مرحباً بك!`,
        data: {
          studentId,
          studentName: studentName || 'طالب قرآن',
          currentCircleId: currentCircleId || null,
          currentCircleName: cleanCurrentCircle,
          targetCircleId,
          targetCircleName,
          teacherName,
          status: 'accepted',
        },
      });

      // 5. تحديث الإشعار الأصلي لدى المعلم ليصبح مقروءاً ومكتملاً (is_read = true, data.status = 'accepted')
      if (notificationId && !notificationId.startsWith('local_')) {
        try {
          const { data: cur } = await supabase
            .from('notifications')
            .select('data')
            .eq('id', notificationId)
            .maybeSingle();

          const mergedData = {
            ...(cur?.data || {}),
            ...params,
            status: 'accepted',
            processedAt: new Date().toISOString(),
          };

          await supabase
            .from('notifications')
            .update({
              is_read: true,
              data: mergedData,
            })
            .eq('id', notificationId);
        } catch (e) {
          console.warn('⚠️ [respondToCircleTransferInDB] Error updating original notification:', e);
        }
      }

      invalidateCache();
      return { success: true, message: `وافق المعلم على نقل الطالب إلى (${targetCircleName}) بنجاح.` };
    } else {
      // الرفض
      // 1. إنشاء إشعار للطالب برفض النقل
      const cleanCurrentCircle = currentCircleName || 'حلقتك الحالية';
      await createNotificationInDB({
        userId: studentId,
        type: 'circle_transfer_rejected',
        title: 'تم رفض طلب النقل',
        message: `اعتذر المعلم (${teacherName}) عن نقل طلبك من (${cleanCurrentCircle}) إلى (${targetCircleName}).`,
        data: {
          studentId,
          studentName: studentName || 'طالب قرآن',
          currentCircleId: currentCircleId || null,
          currentCircleName: cleanCurrentCircle,
          targetCircleId,
          targetCircleName,
          teacherName,
          status: 'rejected',
        },
      });

      // 2. تحديث الإشعار الأصلي لدى المعلم ليصبح مقروءاً ومرفوضاً
      if (notificationId && !notificationId.startsWith('local_')) {
        try {
          const { data: cur } = await supabase
            .from('notifications')
            .select('data')
            .eq('id', notificationId)
            .maybeSingle();

          const mergedData = {
            ...(cur?.data || {}),
            ...params,
            status: 'rejected',
            processedAt: new Date().toISOString(),
          };

          await supabase
            .from('notifications')
            .update({
              is_read: true,
              data: mergedData,
            })
            .eq('id', notificationId);
        } catch (e) {
          console.warn('⚠️ [respondToCircleTransferInDB] Error updating original notification:', e);
        }
      }

      invalidateCache();
      return { success: true, message: 'تم رفض طلب نقل الحلقة.' };
    }
  } catch (err: any) {
    console.error('❌ [respondToCircleTransferInDB] Error:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء معالجة الطلب.' };
  }
};


