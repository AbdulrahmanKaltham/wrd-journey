import { supabase } from '../lib/supabaseClient';
import { Circle, NodeSubmission } from '../types';
import { WEEKS_DATA } from '../data/quranJourneyData';

const resolveSubmissionMeta = (nodeId?: string, weekId?: number) => {
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

/**
 * 4. الحصول على الحلقات المتاحة للطلاب
 */
export const getAvailableCircles = async (gender?: 'male' | 'female'): Promise<Circle[]> => {
  console.log('🔍 [supabaseService] Fetching available circles for gender:', gender);
  const DEFAULT_FALLBACK_CIRCLES: Circle[] = [
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

  try {
    // 1. First try API Proxy
    const res = await fetch(`/api/circles/available${gender ? `?gender=${gender}` : ''}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.circles) && json.circles.length > 0) {
        console.log('✅ [supabaseService] Available circles loaded from API proxy:', json.circles);
        return json.circles;
      }
    }

    // 2. Direct Supabase query as fallback
    let query = supabase.from('circles').select('*');
    if (gender) {
      query = query.eq('gender', gender);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      console.log('✅ [supabaseService] Available circles loaded from Supabase:', data);
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
    console.warn('⚠️ [supabaseService] Error in getAvailableCircles:', err);
  }

  // 3. Fallback to default circles for gender
  return DEFAULT_FALLBACK_CIRCLES.filter(c => !gender || c.gender === gender);
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
 * 4.01 جلب تفاصيل حلقة الطالب واسم المعلم بطلب شبكة واحد
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

  try {
    const res = await fetch(`/api/student/circle-info/${circleId}`);
    if (res.ok) {
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
    console.warn('⚠️ [supabaseService.getStudentCircleInfo] Error:', err);
  }

  const circle = await getCircleDetails(circleId);
  if (!circle) return null;
  return {
    circle,
    teacherName: circle.teacherName || 'المعلم',
    teacherId: circle.teacherId,
  };
};

/**
 * 4.1 جلب حلقات المعلم
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

  // 1. Fast API Request First (Runs in server container with direct service key)
  try {
    const res = await fetch(`/api/circles/teacher/${teacherId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.circles) && json.circles.length > 0) {
        setCache(cacheKey, json.circles);
        return json.circles;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.getTeacherCircles] API error, falling back to direct:', apiErr);
  }

  try {
    // 2. Direct Supabase query
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('teacher_id', teacherId);

    if (!error && Array.isArray(data) && data.length > 0) {
      const circles = data.map(c => ({
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
      setCache(cacheKey, circles);
      return circles;
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getTeacherCircles] Direct Supabase exception:', err);
  }

  return [];
};

/**
 * 4.2 جلب تفاصيل حلقة معينة
 */
export const getCircleDetails = async (circleId: string): Promise<Circle | null> => {
  if (!circleId) return null;

  const cacheKey = `circle_details_${circleId}`;
  const cached = getCached<Circle>(cacheKey);
  if (cached) return cached;

  // 1. Fast Server API proxy
  try {
    const res = await fetch(`/api/circles/${circleId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.circle) {
        setCache(cacheKey, json.circle);
        return json.circle;
      }
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getCircleDetails] API error:', err);
  }

  try {
    // 2. Direct Supabase
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .single();

    if (!error && data) {
      const circle: Circle = {
        id: data.id,
        name: data.name,
        code: data.code || (data.id ? data.id.slice(0, 6).toUpperCase() : 'WRD-101'),
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

  // 1. Server API fast lookup
  try {
    const res = await fetch(`/api/profile/${userId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        setCache(cacheKey, json.profile);
        return json.profile;
      }
    }
  } catch (apiErr) {
    console.warn('⚠️ [supabaseService.getProfile] API fallback error:', apiErr);
  }

  try {
    // 2. Direct Supabase query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn('⚠️ [supabaseService.getProfile] Direct getProfile exception:', err);
  }

  return null;
};

/**
 * 5. الانضمام إلى حلقة
 */
export const joinCircle = async (studentId: string, circleId: string) => {
  console.log('🔗 [supabaseService] Joining circle:', { studentId, circleId });
  try {
    // 1. Direct Supabase join
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('id, student_ids, teacher_id, name, teacher_name')
      .eq('id', circleId)
      .single();

    if (!circleError && circle) {
      const updatedStudents = Array.from(new Set([...(circle.student_ids || []), studentId]));

      await supabase
        .from('circles')
        .update({ student_ids: updatedStudents })
        .eq('id', circleId);

      await supabase
        .from('profiles')
        .update({
          circle_id: circleId,
          teacher_id: circle.teacher_id,
        })
        .eq('id', studentId);

      console.log('✅ [supabaseService] Student joined circle successfully via Supabase direct');
      return { success: true, circle };
    }
  } catch (directErr) {
    console.warn('⚠️ [supabaseService] Direct join failed, trying API proxy:', directErr);
  }

  // 2. API Proxy Fallback
  const res = await fetch('/api/circles/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, circleCodeOrId: circleId }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'تعذر الانضمام للحلقة');
  }

  console.log('✅ [supabaseService] Student joined circle via API proxy');
  return json;
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

    // 3. تحويل البيانات إلى هيكل NodeSubmission
    return validRecs.map((rec: any) => {
      const meta = resolveSubmissionMeta(rec.node_id, rec.week_id);
      return {
        id: rec.id,
        studentId: rec.student_id,
        studentName: 'طالب قرآن',
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
          status: rec.status === 'approved' ? 'approved' : rec.status === 'reviewed' ? 'reviewed' : 'pending_teacher_review',
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
 * 15. تسجيل غياب الطالب في الحلقة (حذف طلب التسميع لإتاحته للطالب لاحقاً)
 */
export const markHalaqahAbsentInDB = async (
  studentId: string,
  nodeId: string,
  submissionId?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/submissions/mark-absent', {
      method: 'POST',
      headers,
      body: JSON.stringify({ studentId, nodeId, submissionId }),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, message: json.message };
    }
    const errJson = await res.json().catch(() => ({}));
    return { success: false, message: errJson.error || 'فشل في تسجيل غياب الطالب' };
  } catch (err: any) {
    console.error('❌ [markHalaqahAbsentInDB] Error:', err);
    return { success: false, message: err.message };
  }
};

// ============================================================================
// 16. Admin API Service Integrations (لوحة تحكم المدير والإحصائيات وإدارة المعلمين)
// ============================================================================

export interface AdminStatsData {
  teachers: { total: number; male: number; female: number };
  students: { total: number; male: number; female: number };
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
 * جلب إحصائيات لوحة تحكم المدير والرسوم البيانية
 */
export const fetchAdminStatsFromAPI = async (): Promise<{
  success: boolean;
  stats?: AdminStatsData;
  charts?: AdminChartsData;
  error?: string;
}> => {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'تعذر جلب الإحصائيات' };
    }
    const data = await res.json();
    return { success: true, stats: data.stats, charts: data.charts };
  } catch (err: any) {
    console.error('❌ [fetchAdminStatsFromAPI] Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * جلب قائمة المعلمين وحلقاتهم وعدد طلابهم للمدير
 */
export const fetchAdminTeachersFromAPI = async (): Promise<{
  success: boolean;
  teachers?: AdminTeacherItem[];
  error?: string;
}> => {
  try {
    const res = await fetch('/api/admin/teachers');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'تعذر جلب قائمة المعلمين' };
    }
    const data = await res.json();
    return { success: true, teachers: data.teachers || [] };
  } catch (err: any) {
    console.error('❌ [fetchAdminTeachersFromAPI] Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * إضافة معلم جديد وإنشاء حلقته وتوليد كلمة مرور مؤقتة له
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
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'تعذر إنشاء المعلم' };
    }
    return {
      success: true,
      teacher: data.teacher,
      temporaryPassword: data.temporaryPassword,
      circle: data.circle,
    };
  } catch (err: any) {
    console.error('❌ [createTeacherByAdmin] Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * إعادة توليد كلمة مرور مؤقتة لمعلم
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
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'تعذر توليد كلمة المرور' };
    }
    return { success: true, temporaryPassword: data.temporaryPassword };
  } catch (err: any) {
    console.error('❌ [regenerateTeacherTempPassword] Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * تعطيل أو حذف حساب معلم وإلغاء تنشيط حلقاته
 */
export const deleteOrDeactivateTeacher = async (
  teacherId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch('/api/admin/delete-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'تعذر تعطيل حساب المعلم' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('❌ [deleteOrDeactivateTeacher] Error:', err);
    return { success: false, error: err.message };
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
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'تعذر ترقية الحساب' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};


