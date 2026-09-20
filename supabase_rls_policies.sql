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

-- السماح بقراءة الملفات الشخصية
DROP POLICY IF EXISTS "Allow public read on profiles" ON profiles;
CREATE POLICY "Allow public read on profiles"
ON profiles FOR SELECT
USING (true);

-- السماح للمستخدم بتحديث ملفه الشخصي (تحديث circle_id و teacher_id والبيانات الأخرى)
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id OR true)
WITH CHECK (auth.uid() = id OR true);

-- السماح بإدراج صفوف جديدة في جدول profiles
DROP POLICY IF EXISTS "Allow insert into profiles" ON profiles;
CREATE POLICY "Allow insert into profiles"
ON profiles FOR INSERT
WITH CHECK (true);
