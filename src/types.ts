export type WorldId = 'juz_amma' | 'juz_tabarak' | 'juz_qad_samia';

export interface World {
  id: WorldId;
  title: string;
  subtitle: string;
  description: string;
  order: number;
  locked: boolean;
  totalWeeks: number;
  icon: string;
}

export interface SurahItem {
  id: number;
  name: string;
  englishName: string;
  versesCount: number;
  revelationType: 'مكية' | 'مدنية';
}

export type NodeType = 'memorize' | 'listen' | 'recite' | 'review' | 'quiz' | 'gate' | 'reward';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'complete' | 'order' | 'surah_select' | 'distinguish' | 'review';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  surahContext?: string;
}

export interface WeekRewardInfo {
  week: Week;
  gateNode: NodeItem;
  xpEarned: number;
  unlockedBadgeIds: string[];
}

export type TaskStatus = 'locked' | 'available' | 'completed' | 'pending_teacher_review' | 'approved' | 'reviewed' | 'needs_practice' | 'absent' | 'pending';

export interface NodeSubmission {
  id?: string;
  studentId?: string;
  studentName?: string;
  circleId?: string;
  teacherId?: string;
  nodeId: string;
  weekId: number;
  weekTitle?: string;
  nodeTitle?: string;
  nodeDescription?: string;
  surahName?: string;
  surahsList?: string[];
  type: 'halaqah' | 'recording';
  status: TaskStatus;
  audioUrl?: string;
  audioData?: string; // base64 string for audio
  recordingUrl?: string;
  audioBlobKey?: string; // Key for IndexedDB storage
  teacherNotes?: string;
  rating?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface NodeItem {
  id: string;
  weekId: number;
  order: number;
  type: NodeType;
  title: string;
  surahName?: string;
  surahsList?: string[];
  audioFiles?: { surah: string; url: string }[];
  description: string;
  xpReward: number;
  required: boolean;
  questions?: QuizQuestion[];
  audioSample?: string;
  memorizeText?: string;
  recordingUrl?: string;
  teacherNotes?: string;
  status?: TaskStatus;
}

export type WeekStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface Week {
  id: number;
  worldId: WorldId;
  trackId?: TrackId;
  weekNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  surahs: string[];
  status: WeekStatus;
  nodes: NodeItem[];
  xpReward: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'completion' | 'mastery' | 'first_step';
}

export interface CampDecoration {
  id: string;
  title: string;
  category: 'tents' | 'nature' | 'furniture' | 'quran';
  icon: string;
  costXp: number;
  unlocked: boolean;
  placed: boolean;
  x?: number;
  y?: number;
}

export type AvatarStyle = 'hafiz' | 'hafiza' | 'scholar';
export type OutfitColor = 'green' | 'gold' | 'navy';
export type BagStyle = 'none' | 'satchel' | 'backpack';
export type AccessoryStyle = 'quran' | 'seedling' | 'glasses';

export type UserRole = 'teacher' | 'student' | 'admin';
export type UserGender = 'male' | 'female';
export type TrackId = 'juz_amma' | 'juz_amma_tabarak' | 'juz_qad_samia';
export type Language = 'ar' | 'en';

export interface Circle {
  id: string;
  name: string;                // اسم الحلقة (مثل "حلقة الشيخ أحمد")
  code: string;                // رمز الانضمام السريع (مثل "WRD-482")
  teacherId: string;           // معرف المعلم
  teacherName: string;         // اسم المعلم
  gender: 'male' | 'female';   // جنس الحلقة (ذكر/أنثى)
  studentIds: string[];        // قائمة معرفات الطلاب
  createdAt: string;
  isActive: boolean;
  settings?: {
    allowJoin: boolean;
    maxStudents?: number;
  };
}

export interface UserProfile {
  id: string;
  name?: string;
  displayName: string;
  email?: string;
  role: UserRole;              // معلم | طالب | مدير
  gender: UserGender;          // ذكر | أنثى
  track?: TrackId;             // المسار الدراسي: جزء عم فقط أو جزء عم وتبارك
  language?: Language;         // لغة الواجهة: ar | en
  mustChangePassword?: boolean;// إجبار المعلم على تغيير كلمة المرور عند أول دخول
  circleId?: string;           // معرف الحلقة
  teacherId?: string;          // معرف المعلم
  circleName?: string;         // اسم الحلقة الحالية
  teacherName?: string;        // اسم المعلم المسؤول
  avatar: 'hafiz_male' | 'hafiz_female' | 'student' | 'falcon' | 'seedling';
  avatarStyle?: AvatarStyle;
  outfitColor?: OutfitColor;
  bagStyle?: BagStyle;
  accessoryStyle?: AccessoryStyle;
  companion: 'ward_seedling' | 'ward_falcon' | 'ward_dove';
  currentWorld: WorldId;
  currentWeek: number;
  currentNodeId: string;
  xp: number;
  streak: number;
  longestStreak?: number;
  lastActiveDate: string;
  completedDates?: string[];
  completedNodes: string[];
  completedWeeks: number[];
  submissions?: Record<string, NodeSubmission>;
  unlockedBadges: string[];
  placedDecorations: string[];
  unlockedDecorations: string[];
  createdAt?: string;
}

// User alias for types compatibility
export type User = UserProfile;
