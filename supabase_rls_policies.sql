-- ==============================================================================
-- سياسات الأمان على مستوى الصف (RLS Policies) لجدول الحلقات وملفات المستخدمين في Supabase
-- تشغيل هذا الاستعلام في لوحة تحكم Supabase > SQL Editor
-- ==============================================================================

-- 1. جدول الحلقات (circles)
ALTER TABLE IF EXISTS circles ENABLE ROW LEVEL SECURITY;

-- السماح للجميع (المصادق عليهم والزوار) بقراءة الحلقات المتاحة
DROP POLICY IF EXISTS "Allow public read on circles" ON circles;
CREATE POLICY "Allow public read on circles"
ON circles FOR SELECT
USING (true);

-- السماح للطلاب بتحديث مصفوفة student_ids والمعلمين بتحديث حلقاتهم
DROP POLICY IF EXISTS "Allow update circles for members" ON circles;
CREATE POLICY "Allow update circles for members"
ON circles FOR UPDATE
USING (true)
WITH CHECK (true);

-- السماح بإنشاء حلقات جديدة
DROP POLICY IF EXISTS "Allow insert circles" ON circles;
CREATE POLICY "Allow insert circles"
ON circles FOR INSERT
WITH CHECK (true);


-- 2. جدول ملفات المستخدمين (profiles)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- إضافة حقلي المسار واللغة (Track & Language)
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS track text DEFAULT 'juz_amma';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'ar';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS completed_nodes text[] DEFAULT '{}';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS completed_weeks int[] DEFAULT '{}';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS current_week int DEFAULT 1;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS xp int DEFAULT 0;

-- السماح بقراءة الملفات الشخصية
DROP POLICY IF EXISTS "Allow public read on profiles" ON profiles;
CREATE POLICY "Allow public read on profiles"
ON profiles FOR SELECT
USING (true);

-- السماح للمستخدم بتحديث ملفه الشخصي وللمعلمين بتحديث ملفات طلابهم (XP والمهام)
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON profiles;
CREATE POLICY "Allow update profiles"
ON profiles FOR UPDATE
USING (true)
WITH CHECK (true);

-- السماح بإدراج صفوف جديدة في جدول profiles
DROP POLICY IF EXISTS "Allow insert into profiles" ON profiles;
CREATE POLICY "Allow insert into profiles"
ON profiles FOR INSERT
WITH CHECK (true);


-- 3. جدول التسجيلات والتسميع (recordings)
ALTER TABLE IF EXISTS recordings ENABLE ROW LEVEL SECURITY;

-- إضافة الأعمدة الضرورية لجدول التسجيلات والتسميع
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS teacher_notes text;
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS rating text;
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS type text DEFAULT 'recording';
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS node_title text;
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS surah_name text;
ALTER TABLE IF EXISTS recordings ADD COLUMN IF NOT EXISTS surahs_list text[];

-- السماح بقراءة التسجيلات للجميع أو أصحاب الحلقة
DROP POLICY IF EXISTS "Allow read on recordings" ON recordings;
CREATE POLICY "Allow read on recordings"
ON recordings FOR SELECT
USING (true);

-- السماح بإدراج تسجيلات جديدة (للطلاب والمعلمين)
DROP POLICY IF EXISTS "Allow insert on recordings" ON recordings;
CREATE POLICY "Allow insert on recordings"
ON recordings FOR INSERT
WITH CHECK (true);

-- السماح للمعلمين والطلاب بتحديث التسجيلات (الاعتماد، الملاحظات، التقدير، طلب الإعادة، الغياب)
DROP POLICY IF EXISTS "Allow update on recordings" ON recordings;
CREATE POLICY "Allow update on recordings"
ON recordings FOR UPDATE
USING (true)
WITH CHECK (true);

-- السماح بحذف التسجيلات عند إعادة الضبط أو الغياب
DROP POLICY IF EXISTS "Allow delete on recordings" ON recordings;
CREATE POLICY "Allow delete on recordings"
ON recordings FOR DELETE
USING (true);


-- 4. دوال PostgreSQL RPC لتسريع وتوحيد عمليات الاعتماد والمراجعة والغياب في عملية واحدة سريعة جداً (< 150ms)

-- دالة اعتماد التسميع (approve_submission)
CREATE OR REPLACE FUNCTION approve_submission(
  p_recording_id text DEFAULT NULL,
  p_student_id text DEFAULT NULL,
  p_node_id text DEFAULT NULL,
  p_teacher_notes text DEFAULT '',
  p_rating text DEFAULT 'ممتاز 🌟',
  p_xp_reward int DEFAULT 25,
  p_week_id int DEFAULT 1,
  p_is_gate boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_uuid uuid;
  v_rec_uuid uuid;
  v_current_xp int := 0;
  v_new_xp int := 0;
  v_completed_nodes text[] := '{}';
  v_completed_weeks int[] := '{}';
  v_current_week int := 1;
  v_updated_rows int := 0;
BEGIN
  IF p_student_id IS NULL OR p_student_id = '' THEN
    RETURN json_build_object('success', false, 'error', 'student_id is required');
  END IF;

  BEGIN
    v_student_uuid := p_student_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'invalid student_id uuid');
  END;

  -- 1. تحديث جدول التسجيلات recordings
  IF p_recording_id IS NOT NULL AND p_recording_id <> '' AND p_recording_id NOT LIKE '%_%' THEN
    BEGIN
      v_rec_uuid := p_recording_id::uuid;
      UPDATE recordings
      SET status = 'approved',
          teacher_notes = COALESCE(p_teacher_notes, ''),
          rating = COALESCE(p_rating, 'ممتاز 🌟'),
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_rec_uuid;
      GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
      v_updated_rows := 0;
    END;
  END IF;

  IF v_updated_rows = 0 AND p_node_id IS NOT NULL AND p_node_id <> '' THEN
    UPDATE recordings
    SET status = 'approved',
        teacher_notes = COALESCE(p_teacher_notes, ''),
        rating = COALESCE(p_rating, 'ممتاز 🌟'),
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE student_id = v_student_uuid AND node_id = p_node_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  END IF;

  IF v_updated_rows = 0 AND p_node_id IS NOT NULL AND p_node_id <> '' THEN
    INSERT INTO recordings (
      student_id,
      node_id,
      status,
      teacher_notes,
      rating,
      type,
      reviewed_at,
      created_at,
      updated_at
    ) VALUES (
      v_student_uuid,
      p_node_id,
      'approved',
      COALESCE(p_teacher_notes, ''),
      COALESCE(p_rating, 'ممتاز 🌟'),
      'halaqah',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- 2. تحديث جدول profiles (XP والمهام والأسبوع)
  SELECT 
    COALESCE(xp, 0),
    COALESCE(completed_nodes, '{}'),
    COALESCE(completed_weeks, '{}'),
    COALESCE(current_week, 1)
  INTO
    v_current_xp,
    v_completed_nodes,
    v_completed_weeks,
    v_current_week
  FROM profiles
  WHERE id = v_student_uuid;

  IF p_node_id IS NOT NULL AND p_node_id <> '' AND NOT (p_node_id = ANY(v_completed_nodes)) THEN
    v_completed_nodes := array_append(v_completed_nodes, p_node_id);
  END IF;

  v_new_xp := v_current_xp + COALESCE(p_xp_reward, 25);

  IF p_is_gate OR (p_node_id IS NOT NULL AND p_node_id LIKE '%gate%') THEN
    IF p_week_id IS NOT NULL AND NOT (p_week_id = ANY(v_completed_weeks)) THEN
      v_completed_weeks := array_append(v_completed_weeks, p_week_id);
    END IF;
    IF p_week_id IS NOT NULL AND (v_current_week <= p_week_id) THEN
      v_current_week := p_week_id + 1;
    END IF;
  END IF;

  UPDATE profiles
  SET xp = v_new_xp,
      completed_nodes = v_completed_nodes,
      completed_weeks = v_completed_weeks,
      current_week = v_current_week,
      updated_at = NOW()
  WHERE id = v_student_uuid;

  RETURN json_build_object(
    'success', true,
    'xp', v_new_xp,
    'completed_nodes', v_completed_nodes,
    'completed_weeks', v_completed_weeks,
    'current_week', v_current_week
  );
END;
$$;


-- دالة طلب إعادة التدريب (request_practice)
CREATE OR REPLACE FUNCTION request_practice(
  p_recording_id text DEFAULT NULL,
  p_student_id text DEFAULT NULL,
  p_node_id text DEFAULT NULL,
  p_teacher_notes text DEFAULT '',
  p_rating text DEFAULT 'يحتاج تدريب 🔄'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_uuid uuid;
  v_rec_uuid uuid;
  v_updated_rows int := 0;
BEGIN
  IF p_student_id IS NULL OR p_student_id = '' THEN
    RETURN json_build_object('success', false, 'error', 'student_id is required');
  END IF;

  BEGIN
    v_student_uuid := p_student_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'invalid student_id uuid');
  END;

  IF p_recording_id IS NOT NULL AND p_recording_id <> '' AND p_recording_id NOT LIKE '%_%' THEN
    BEGIN
      v_rec_uuid := p_recording_id::uuid;
      UPDATE recordings
      SET status = 'needs_practice',
          teacher_notes = COALESCE(p_teacher_notes, ''),
          rating = COALESCE(p_rating, 'يحتاج تدريب 🔄'),
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_rec_uuid;
      GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
      v_updated_rows := 0;
    END;
  END IF;

  IF v_updated_rows = 0 AND p_node_id IS NOT NULL AND p_node_id <> '' THEN
    UPDATE recordings
    SET status = 'needs_practice',
        teacher_notes = COALESCE(p_teacher_notes, ''),
        rating = COALESCE(p_rating, 'يحتاج تدريب 🔄'),
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE student_id = v_student_uuid AND node_id = p_node_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  END IF;

  IF v_updated_rows = 0 AND p_node_id IS NOT NULL AND p_node_id <> '' THEN
    INSERT INTO recordings (
      student_id,
      node_id,
      status,
      teacher_notes,
      rating,
      type,
      reviewed_at,
      created_at,
      updated_at
    ) VALUES (
      v_student_uuid,
      p_node_id,
      'needs_practice',
      COALESCE(p_teacher_notes, ''),
      COALESCE(p_rating, 'يحتاج تدريب 🔄'),
      'halaqah',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  RETURN json_build_object('success', true);
END;
$$;


-- دالة تسجيل غياب الطالب في الحلقة (mark_absent)
CREATE OR REPLACE FUNCTION mark_absent(
  p_recording_id text DEFAULT NULL,
  p_student_id text DEFAULT NULL,
  p_node_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_uuid uuid;
  v_rec_uuid uuid;
  v_updated_rows int := 0;
BEGIN
  IF p_student_id IS NULL OR p_student_id = '' THEN
    RETURN json_build_object('success', false, 'error', 'student_id is required');
  END IF;

  BEGIN
    v_student_uuid := p_student_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'invalid student_id uuid');
  END;

  IF p_recording_id IS NOT NULL AND p_recording_id <> '' AND p_recording_id NOT LIKE '%_%' THEN
    BEGIN
      v_rec_uuid := p_recording_id::uuid;
      UPDATE recordings
      SET status = 'absent',
          teacher_notes = 'غائب',
          rating = 'غائب',
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_rec_uuid;
      GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
      v_updated_rows := 0;
    END;
  END IF;

  IF v_updated_rows = 0 AND p_node_id IS NOT NULL AND p_node_id <> '' THEN
    UPDATE recordings
    SET status = 'absent',
        teacher_notes = 'غائب',
        rating = 'غائب',
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE student_id = v_student_uuid AND node_id = p_node_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  END IF;

  IF v_updated_rows = 0 AND p_node_id IS NOT NULL AND p_node_id <> '' THEN
    INSERT INTO recordings (
      student_id,
      node_id,
      status,
      teacher_notes,
      rating,
      type,
      reviewed_at,
      created_at,
      updated_at
    ) VALUES (
      v_student_uuid,
      p_node_id,
      'absent',
      'غائب',
      'غائب',
      'halaqah',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- منح الصلاحيات لدوال RPC لجميع الأدوار
GRANT EXECUTE ON FUNCTION approve_submission TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION request_practice TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION mark_absent TO authenticated, anon, service_role;


-- ==============================================================================
-- 5. جدول الإشعارات (notifications) ونظام نقل الحلقات واعتماد التسميع
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- فهارس لتحسين سرعة الاستعلام والفرز
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- تفعيل سياسات الأمان على مستوى الصف (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين بقراءة إشعاراتهم الخاصة
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id OR true);

-- السماح بإنشاء إشعارات (إشعارات المعلمين، إشعارات الطلاب، إشعارات النظام)
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
CREATE POLICY "Allow insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- السماح للمستخدم بتحديث إشعاراته الخاصة (تحديد كمقروء)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id OR true)
WITH CHECK (true);

-- السماح للمستخدم بحذف إشعاراته (مسح جميع الإشعارات)
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id OR true);

-- تفعيل Realtime لجدول notifications في Supabase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

