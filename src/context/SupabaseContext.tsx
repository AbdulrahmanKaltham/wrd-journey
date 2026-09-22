import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Week,
  NodeItem,
  Badge,
  CampDecoration,
  WorldId,
  NodeSubmission,
  WeekRewardInfo,
  UserRole,
  UserGender,
  Circle,
  TrackId,
  Language,
  AppNotification,
} from '../types';
import { WEEKS_DATA, INITIAL_BADGES, INITIAL_DECORATIONS, getWeeksForTrack } from '../data/quranJourneyData';
import { t as i18nT } from '../lib/i18n';
import { updateStreakOnActivity, getTodayDateString, getYesterdayDateString } from '../services/streakService';

export type TabType = 'home' | 'journey' | 'camp' | 'achievements' | 'profile' | 'teacher' | 'students' | 'halaqah' | 'admin' | 'admin_analytics' | 'admin_teachers' | 'admin_add_teacher';

export interface SupabaseContextType {
  session: Session | null;
  user: UserProfile;
  supabaseAuthUser: User | null;
  profile: any | null;
  loading: boolean;
  isRefreshing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  refreshProfile: (customProfile?: any) => Promise<void>;
  signInWithOAuth?: (provider: 'google') => Promise<void>;
  // App navigation and interactive journey states
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  weeks: Week[];
  badges: Badge[];
  decorations: CampDecoration[];
  activeWeek: Week | null;
  activeNode: NodeItem | null;
  selectedWeekForModal: Week | null;
  showLessonModal: boolean;
  showWeekModal: boolean;
  pendingWeekReward: WeekRewardInfo | null;
  userCircle: Circle | null;
  circleStudents: UserProfile[];
  teacherCircles: Circle[];
  teacherSubmissions: NodeSubmission[];
  fetchTeacherSubmissions: () => Promise<void>;
  reviewStudentSubmission: (
    studentId: string,
    nodeId: string,
    status: 'approved' | 'needs_practice',
    teacherNotes: string,
    rating: string,
    xpReward?: number,
    weekId?: number
  ) => Promise<boolean>;
  openWeekModal: (week: Week) => void;
  closeWeekModal: () => void;
  startLesson: (node: NodeItem, week: Week) => void;
  closeLessonModal: () => void;
  activeListeningTask: { node: NodeItem; week: Week } | null;
  openListeningTask: (node: NodeItem, week: Week) => void;
  closeListeningTask: () => void;
  openWeekRewardModal: (reward: WeekRewardInfo) => void;
  closeWeekRewardModal: () => void;
  claimWeekRewardAndUnlockNext: () => Promise<void>;
  completeNode: (nodeId: string, weekId: number, xpGained: number) => Promise<void>;
  submitNodeForReview: (
    nodeId: string,
    weekId: number,
    type: 'halaqah' | 'recording',
    audioUrl?: string,
    audioBlobKey?: string,
    audioData?: string,
    nodeTitle?: string,
    surahName?: string,
    surahsList?: string[]
  ) => Promise<void>;
  switchRecitationType: (nodeId: string, newType: 'halaqah' | 'recording') => Promise<{ success: boolean; message?: string }>;
  markStudentAbsent: (studentId: string, nodeId: string, submissionId?: string) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  buyDecoration: (decId: string) => void;
  placeDecoration: (decId: string, x: number, y: number) => void;
  triggerCelebration: () => void;
  // Aliases
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  firebaseUser: any;
  isAnonymous: boolean;
  joinCircleAction: (code: string) => Promise<{ success: boolean; message: string }>;
  leaveCurrentCircle: () => Promise<void>;
  createTeacherCircle: (name: string) => Promise<Circle>;
  refreshCircleData: () => Promise<void>;
  updateProfile: (updates: any) => void;
  resetProgress: () => void;
  loadSampleProgress: () => void;
  // Multi-language & Study Tracks
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  setTrack: (track: TrackId) => Promise<void>;
  t: (key: string, langOrFallback?: Language | string, fallback?: string) => string;
  // Notification system
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isNotificationsModalOpen: boolean;
  setIsNotificationsModalOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  requestCircleTransfer: (targetCircleId: string, targetCircleName: string, targetTeacherId?: string) => Promise<{ success: boolean; message: string }>;
  respondToCircleTransfer: (notificationId: string, action: 'accept' | 'reject') => Promise<{ success: boolean; message: string }>;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  id: '',
  displayName: '',
  name: '',
  role: 'student',
  gender: 'male',
  track: 'juz_amma',
  language: 'ar',
  circleId: '',
  teacherId: '',
  circleName: '',
  teacherName: '',
  avatar: 'student',
  avatarStyle: 'hafiz',
  outfitColor: 'green',
  bagStyle: 'satchel',
  accessoryStyle: 'quran',
  companion: 'ward_seedling',
  currentWorld: 'juz_amma',
  currentWeek: 1,
  currentNodeId: 'w1_node_1',
  xp: 0,
  streak: 1,
  longestStreak: 1,
  lastActiveDate: getYesterdayDateString(),
  completedDates: [],
  completedNodes: [],
  completedWeeks: [],
  submissions: {},
  unlockedBadges: [],
  placedDecorations: ['tent_basic', 'plant_basil'],
  unlockedDecorations: ['tent_basic', 'plant_basil'],
  createdAt: new Date().toISOString(),
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any legacy localStorage account dumps on initialization
  useEffect(() => {
    try {
      localStorage.removeItem('ward_local_profile_v2');
      localStorage.removeItem('ward_local_session_v2');
      localStorage.removeItem('ward_circles_cache_v2');
      localStorage.removeItem('ward_profiles_cache_v2');
      localStorage.removeItem('ward_local_profile');
      localStorage.removeItem('ward_local_session');
    } catch {}
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [supabaseAuthUser, setSupabaseAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // App & Navigation States
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedWeekForModal, setSelectedWeekForModal] = useState<Week | null>(null);
  const [showWeekModal, setShowWeekModal] = useState<boolean>(false);
  const [activeNode, setActiveNode] = useState<NodeItem | null>(null);
  const [activeWeek, setActiveWeek] = useState<Week | null>(null);
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [activeListeningTask, setActiveListeningTask] = useState<{ node: NodeItem; week: Week } | null>(null);
  const [pendingWeekReward, setPendingWeekReward] = useState<WeekRewardInfo | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [userCircle, setUserCircle] = useState<Circle | null>(null);
  const [circleStudents, setCircleStudents] = useState<UserProfile[]>([]);
  const [teacherCircles, setTeacherCircles] = useState<Circle[]>([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState<NodeSubmission[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ward_language');
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {}
    return 'ar';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Static Journey Data
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [decorations, setDecorations] = useState<CampDecoration[]>(INITIAL_DECORATIONS);

  // User State directly mapped from Database profile
  const [user, setUser] = useState<UserProfile>(() => {
    const guestTrack = (typeof localStorage !== 'undefined' ? localStorage.getItem('ward_guest_track') : null) as TrackId | null;
    return {
      ...DEFAULT_USER_PROFILE,
      language: (typeof localStorage !== 'undefined' ? (localStorage.getItem('ward_language') as Language) : 'ar') || 'ar',
      track: guestTrack || 'juz_amma',
    };
  });

  // Dynamic Journey Weeks based on user's track
  const weeks = useMemo(() => {
    return getWeeksForTrack(user.track);
  }, [user.track]);

  const mapProfileToUser = useCallback((data: any): UserProfile => {
    const completedNodesList = Array.isArray(data.completed_nodes)
      ? data.completed_nodes
      : (Array.isArray(data.completedNodes) ? data.completedNodes : []);

    const cachedTrack = (data.id ? localStorage.getItem(`ward_user_track_${data.id}`) : localStorage.getItem('ward_guest_track')) as TrackId | null;
    const resolvedTrack: TrackId = data.track || cachedTrack || (completedNodesList.some((n: string) => n.startsWith('t2_')) ? 'juz_amma_tabarak' : 'juz_amma');
    const cachedLang = (localStorage.getItem('ward_language') || 'ar') as Language;
    const resolvedLang: Language = data.language || cachedLang;

    return {
      ...DEFAULT_USER_PROFILE,
      id: data.id,
      name: data.name || data.email?.split('@')[0] || 'مستخدم ورد',
      displayName: data.name || data.email?.split('@')[0] || 'مستخدم ورد',
      email: data.email,
      role: data.role || 'student',
      gender: data.gender || 'male',
      track: resolvedTrack,
      language: resolvedLang,
      mustChangePassword: !!(data.must_change_password ?? data.mustChangePassword),
      circleId: data.circle_id || '',
      teacherId: data.teacher_id || '',
      xp: data.xp ?? 0,
      streak: data.streak ?? 1,
      currentWeek: data.current_week ?? 1,
      completedNodes: completedNodesList,
      completedWeeks: data.completed_weeks || [],
      avatar: data.gender === 'female' ? 'hafiz_female' : 'student',
      avatarStyle: data.gender === 'female' ? 'hafiza' : 'hafiz',
    };
  }, []);

  // Fetch profile strictly from Supabase DB with fallback to Server API Proxy
  const fetchProfile = async (userId: string) => {
    console.log('🔍 [SupabaseContext.fetchProfile] Fetching profile for ID:', userId);
    if (!userId) return null;

    let data: any = null;

    // 1. Try Direct Supabase Query
    try {
      const { data: dbData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && dbData) {
        console.log('✅ [SupabaseContext.fetchProfile] Profile loaded directly from Supabase DB:', dbData);
        data = dbData;
      } else if (error) {
        console.warn('⚠️ [SupabaseContext.fetchProfile] Direct DB query returned error:', error.message);
      }
    } catch (directErr) {
      console.warn('⚠️ [SupabaseContext.fetchProfile] Direct DB query exception:', directErr);
    }

    // 2. Try Server API Proxy Fallback
    if (!data) {
      try {
        console.log('📡 [SupabaseContext.fetchProfile] Trying /api/profile/' + userId);
        const res = await fetch(`/api/profile/${userId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.profile) {
            console.log('✅ [SupabaseContext.fetchProfile] Profile loaded from API Proxy fallback:', json.profile);
            data = json.profile;
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ [SupabaseContext.fetchProfile] API Proxy profile fetch error:', apiErr);
      }
    }

    if (data) {
      // Check auth user metadata for must_change_password flag or admin role synchronization
      try {
        const { data: authUserData } = await supabase.auth.getUser();
        if (authUserData?.user?.user_metadata?.must_change_password !== undefined) {
          data.must_change_password = !!authUserData.user.user_metadata.must_change_password;
        }
        if (authUserData?.user?.user_metadata?.role === 'admin' || authUserData?.user?.app_metadata?.role === 'admin') {
          data.role = 'admin';
        }
      } catch {}

      setProfile(data);
      const mapped = mapProfileToUser(data);
      console.log('👤 [SupabaseContext] Current user mapped from database:', mapped);
      setUser(mapped);

      // If teacher, fetch their circles and students via fast single roundtrip
      if (data.role === 'teacher') {
        try {
          const { getTeacherDashboardData } = await import('../services/supabaseService');
          const dashData = await getTeacherDashboardData(userId);
          console.log('⚡ [SupabaseContext.fetchProfile] Fast loaded teacher dashboard data:', dashData);
          
          setTeacherCircles(dashData.circles || []);
          if (dashData.activeCircle) {
            setUserCircle(dashData.activeCircle);
            setUser(prev => ({
              ...prev,
              circleId: dashData.activeCircle?.id,
              circleName: dashData.activeCircle?.name,
            }));
            const mappedStudents = (dashData.students || []).map(s => mapProfileToUser(s));
            setCircleStudents(mappedStudents);
          } else {
            setUserCircle(null);
            setCircleStudents([]);
          }
        } catch (teacherErr) {
          console.warn('⚠️ [SupabaseContext.fetchProfile] Error loading teacher dashboard data:', teacherErr);
        }
      } else {
        // If student, also fetch their submissions & reviews
        try {
          const { getStudentSubmissions } = await import('../services/supabaseService');
          const studentSubs = await getStudentSubmissions(userId);
          if (studentSubs && studentSubs.length > 0) {
            const subsMap: Record<string, NodeSubmission> = {};
            const approvedNodes: string[] = [];
            studentSubs.forEach(s => {
              if (s.nodeId) {
                subsMap[s.nodeId] = s;
                if (s.status === 'approved' && !approvedNodes.includes(s.nodeId)) {
                  approvedNodes.push(s.nodeId);
                }
              }
            });
            setUser(prev => {
              const mergedCompletedNodes = Array.from(new Set([...(prev.completedNodes || []), ...approvedNodes]));
              return {
                ...prev,
                submissions: {
                  ...(prev.submissions || {}),
                  ...subsMap,
                },
                completedNodes: mergedCompletedNodes,
              };
            });
          }
        } catch (subErr) {
          console.warn('⚠️ [SupabaseContext.fetchProfile] Error loading student submissions:', subErr);
        }

        if (data.circle_id) {
          // If student in a circle, fetch circle details and teacher info in 1 single fast roundtrip
          try {
            const { getStudentCircleInfo } = await import('../services/supabaseService');
            const info = await getStudentCircleInfo(data.circle_id);
            
            if (info && info.circle) {
              const enrichedCircle: Circle = {
                ...info.circle,
                teacherId: data.teacher_id || info.teacherId || info.circle.teacherId,
                teacherName: info.teacherName || info.circle.teacherName || 'المعلم',
              };
              console.log('⚡ [SupabaseContext.fetchProfile] Fast loaded student circle details:', enrichedCircle);
              setUserCircle(enrichedCircle);
              setUser(prev => ({
                ...prev,
                circleId: enrichedCircle.id,
                circleName: enrichedCircle.name,
                teacherId: enrichedCircle.teacherId,
                teacherName: enrichedCircle.teacherName,
              }));
            }
          } catch (studErr) {
            console.warn('⚠️ [SupabaseContext.fetchProfile] Error fetching student circle details:', studErr);
          }
        } else {
          setUserCircle(null);
        }
      }
      return data;
    }

    return null;
  };

  const refreshProfile = async (customProfile?: any) => {
    console.log('🔄 [SupabaseContext.refreshProfile] Profile refresh triggered');
    if (customProfile) {
      console.log('📋 [SupabaseContext.refreshProfile] Setting custom profile:', customProfile);
      setProfile(customProfile);
      setUser(mapProfileToUser(customProfile));
      return;
    }

    const currentUserId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    console.log('🔍 [SupabaseContext.refreshProfile] Refreshing profile for user ID:', currentUserId);
    if (currentUserId) {
      setIsRefreshing(true);
      try {
        const refreshed = await fetchProfile(currentUserId);
        console.log('✅ [SupabaseContext.refreshProfile] Completed refresh. Profile:', refreshed);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Listen to Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session: currentSession } }) => {
        if (currentSession?.user) {
          setSession(currentSession);
          setSupabaseAuthUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setSession(null);
          setSupabaseAuthUser(null);
          setProfile(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Supabase getSession error:', err);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setSupabaseAuthUser(newSession.user);
        await fetchProfile(newSession.user.id);
      } else {
        setSession(null);
        setSupabaseAuthUser(null);
        setProfile(null);
        setUser(DEFAULT_USER_PROFILE);
      }
      setLoading(false);
    });

    return () => listener?.subscription?.unsubscribe();
  }, [mapProfileToUser]);

  // Auth Functions: Robust Full-Stack Proxy with Supabase Sync and direct fallback
  const signUp = async (email: string, password: string, metadata: any) => {
    console.log('📝 [SupabaseContext] Executing signUp for:', { email, metadata });
    let lastError: any = null;

    // 1. Try Full-Stack Server API Proxy first (if backend running)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: metadata?.name || '',
          role: metadata?.role || 'student',
          gender: metadata?.gender || 'male',
          circleName: metadata?.circleName || '',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        if (data.session) {
          try {
            await supabase.auth.setSession(data.session);
          } catch {}
          setSession(data.session);
        }
        if (data.user) {
          setSupabaseAuthUser(data.user);
        }
        if (data.profile) {
          setProfile(data.profile);
          setUser(mapProfileToUser(data.profile));
        }
        if (data.user?.id) {
          await fetchProfile(data.user.id);
        }
        return { data: { user: data.user, session: data.session }, error: null };
      } else {
        const errMsg = data.error || (data.rawError ? `خطأ: ${data.rawError}` : null);
        if (errMsg) {
          lastError = new Error(errMsg);
        }
      }
    } catch (proxyErr: any) {
      console.warn('⚠️ [SupabaseContext] Server API signup failed/unavailable (e.g. static host), falling back to direct Supabase client...', proxyErr);
      lastError = proxyErr;
    }

    // 2. Direct Supabase Client fallback (Essential for GitHub Pages & static deployments)
    console.log('🔄 [SupabaseContext] Attempting direct client-side Supabase signUp...');
    try {
      const { data: directData, error: directError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: metadata?.name || '',
            role: metadata?.role || 'student',
            gender: metadata?.gender || 'male',
            track: metadata?.track || 'juz_amma',
            language: metadata?.language || language || 'ar',
            circleName: metadata?.circleName || '',
          },
        },
      });

      if (directError) {
        console.error('❌ [SupabaseContext] Direct Supabase signUp error:', directError);
        throw directError;
      }

      if (directData.user) {
        setSupabaseAuthUser(directData.user);
        if (directData.session) {
          setSession(directData.session);
        }

        const chosenTrack = metadata?.track || 'juz_amma';
        const chosenLanguage = metadata?.language || language || 'ar';

        try {
          localStorage.setItem(`ward_user_track_${directData.user.id}`, chosenTrack);
          localStorage.setItem(`ward_track_chosen_${directData.user.id}`, 'true');
        } catch {}

        // Upsert profile in Supabase profiles table
        try {
          const profileData: any = {
            id: directData.user.id,
            email: email.trim(),
            name: (metadata?.name || '').trim(),
            role: metadata?.role || 'student',
            gender: metadata?.gender || 'male',
            track: chosenTrack,
            language: chosenLanguage,
            circle_id: null,
            xp: 120,
            streak: 1,
            current_week: 1,
            completed_nodes: ['w1_node_1'],
            completed_weeks: [],
          };

          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select()
            .single();

          if (!profErr && prof) {
            setProfile(prof);
            setUser(mapProfileToUser(prof));
          } else {
            // If track/language column doesn't exist yet in remote schema, retry without them
            if (profErr?.message?.includes('track') || profErr?.message?.includes('language')) {
              const { track: _t, language: _l, ...fallbackData } = profileData;
              const { data: fbProf } = await supabase.from('profiles').upsert(fallbackData, { onConflict: 'id' }).select().single();
              if (fbProf) {
                setProfile({ ...fbProf, track: chosenTrack, language: chosenLanguage });
                setUser(mapProfileToUser({ ...fbProf, track: chosenTrack, language: chosenLanguage }));
              }
            } else {
              setProfile(profileData as any);
              setUser(mapProfileToUser(profileData));
            }
          }
        } catch (profCatch) {
          console.warn('⚠️ [SupabaseContext] Could not upsert profile directly:', profCatch);
        }

        return { data: directData, error: null };
      }
    } catch (directCatch: any) {
      console.error('❌ [SupabaseContext] Direct Supabase signUp caught error:', directCatch);
      throw directCatch;
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error('فشل إنشاء الحساب. يرجى التحقق من البيانات والمحاولة مجدداً.');
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = typeof email === 'string' ? email.trim() : String(email || '').trim();
    const cleanPassword = typeof password === 'string' ? password.trim() : String(password || '').trim();

    console.log('🔑 [SupabaseContext] Starting signIn flow for email:', cleanEmail);

    if (!cleanEmail || !cleanPassword) {
      throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
    }

    try {
      console.log('📡 [SupabaseContext] Attempting server proxy login at /api/auth/login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await response.json().catch(() => ({}));
      console.log('📥 [SupabaseContext] /api/auth/login response status:', response.status, 'data:', data);

      if (response.ok && data.success) {
        if (data.session) {
          try {
            await supabase.auth.setSession(data.session);
          } catch (sessionErr) {
            console.warn('⚠️ [SupabaseContext] Client setSession warning:', sessionErr);
          }
          setSession(data.session);
        }
        if (data.user) {
          setSupabaseAuthUser(data.user);
        }
        if (data.profile) {
          setProfile(data.profile);
          setUser(mapProfileToUser(data.profile));
        }
        if (data.user?.id) {
          await fetchProfile(data.user.id);
        }
        console.log('✅ [SupabaseContext] Sign in successful for:', cleanEmail);
        return;
      }

      // If server returned specific error message, inspect it
      const rawError = data.error || '';
      console.warn('⚠️ [SupabaseContext] Server login returned error:', rawError);

      if (rawError.includes('Email not confirmed') || rawError.includes('email_not_confirmed')) {
        throw new Error('لم يتم تأكيد البريد الإلكتروني بعد. يرجى مراجعة رسائل بريدك أو تعطيل تأكيد البريد في Supabase.');
      } else if (rawError.includes('Invalid login credentials') || rawError.includes('invalid_credentials')) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من كتابة كلمة المرور بدقة.');
      } else if (rawError) {
        throw new Error(rawError);
      }

      // Fallback: Direct client-side Supabase authentication
      console.log('🔄 [SupabaseContext] Trying direct client-side Supabase signInWithPassword...');
      const { data: clientAuthData, error: clientAuthError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (clientAuthError) {
        console.error('❌ [SupabaseContext] Direct Supabase signIn error:', clientAuthError);
        if (clientAuthError.message.includes('Invalid login credentials') || clientAuthError.message.includes('invalid_credentials')) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من كتابة كلمة المرور بدقة.');
        } else if (clientAuthError.message.includes('Email not confirmed')) {
          throw new Error('لم يتم تأكيد البريد الإلكتروني بعد. يرجى مراجعة بريدك الإلكتروني.');
        }
        throw new Error(clientAuthError.message || 'تعذر تسجيل الدخول.');
      }

      if (clientAuthData.session) {
        setSession(clientAuthData.session);
        setSupabaseAuthUser(clientAuthData.user);
        await fetchProfile(clientAuthData.user.id);
        console.log('✅ [SupabaseContext] Direct Supabase client sign in successful!');
      }
    } catch (apiErr: any) {
      console.error('❌ [SupabaseContext] Signin error caught:', apiErr.message);
      throw apiErr;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = typeof email === 'string' ? email.trim() : String(email || '').trim();
    console.log('🔑 [SupabaseContext] Triggering reset password for:', cleanEmail);

    if (!cleanEmail) {
      throw new Error('يرجى إدخال البريد الإلكتروني أولاً');
    }

    try {
      // 1. First attempt through client Supabase SDK
      const { error: clientError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });

      if (!clientError) {
        console.log('✅ [SupabaseContext] Reset password link sent via client SDK');
        return {
          success: true,
          message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.',
        };
      }

      console.warn('⚠️ [SupabaseContext] Client reset error, trying server proxy...', clientError);

      // 2. Fallback through backend proxy
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.',
        };
      }

      throw new Error(data.error || clientError?.message || 'تعذر إرسال رابط إعادة التعيين');
    } catch (err: any) {
      console.error('❌ [SupabaseContext] Reset password failed:', err);
      throw err;
    }
  };

  const signInWithOAuth = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    console.log('👋 [SupabaseContext] Signing out...');
    await supabase.auth.signOut();
    setSession(null);
    setSupabaseAuthUser(null);
    setProfile(null);
    setUser(DEFAULT_USER_PROFILE);
  };

  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#006304', '#F9BF3B', '#10B981', '#34D399'],
    });
  }, []);

  const setLanguage = useCallback(async (newLang: Language) => {
    console.log('🌐 [SupabaseContext] Setting app language to:', newLang);
    setLanguageState(newLang);
    try {
      localStorage.setItem('ward_language', newLang);
    } catch {}
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    setUser(prev => ({ ...prev, language: newLang }));

    if (user.id) {
      try {
        await supabase.from('profiles').update({ language: newLang }).eq('id', user.id);
      } catch (e) {
        console.warn('⚠️ Could not update language in Supabase profiles (column may not exist yet):', e);
      }
    }
  }, [user.id]);

  const setTrack = useCallback(async (newTrack: TrackId) => {
    console.log('🎯 [SupabaseContext] Setting study track to:', newTrack);
    setUser(prev => ({ ...prev, track: newTrack }));
    if (user.id) {
      try {
        localStorage.setItem(`ward_user_track_${user.id}`, newTrack);
      } catch {}
      try {
        await supabase.from('profiles').update({ track: newTrack }).eq('id', user.id);
      } catch (e) {
        console.warn('⚠️ Could not update track in Supabase profiles (column may not exist yet):', e);
      }
    } else {
      try {
        localStorage.setItem('ward_guest_track', newTrack);
      } catch {}
    }
  }, [user.id]);

  const t = useCallback((key: string, langOrFallback?: Language | string, fallback?: string) => {
    let targetLang = language;
    let fallbackText = fallback;

    if (langOrFallback === 'ar' || langOrFallback === 'en') {
      targetLang = langOrFallback as Language;
    } else if (typeof langOrFallback === 'string') {
      fallbackText = langOrFallback;
    }

    const res = i18nT(key, targetLang, fallbackText);
    if ((res === 'ar' || res === 'en') && key !== 'lang_ar' && key !== 'lang_en') {
      return fallbackText || key;
    }
    return res;
  }, [language]);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  // ============================================================================
  // Notifications Logic & Realtime Listeners
  // ============================================================================
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    const effectiveUserId = user?.id || session?.user?.id;
    if (!effectiveUserId) return;
    try {
      const { fetchUserNotificationsFromDB } = await import('../services/supabaseService');
      const data = await fetchUserNotificationsFromDB(effectiveUserId);
      setNotifications(data);
    } catch (err) {
      console.warn('⚠️ [SupabaseContext.fetchNotifications] Error:', err);
    }
  }, [user?.id, session?.user?.id]);

  // Realtime subscription and 30s polling for notifications
  useEffect(() => {
    const effectiveUserId = user?.id || session?.user?.id;
    if (!effectiveUserId) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-realtime-${effectiveUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${effectiveUserId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [user?.id, session?.user?.id, fetchNotifications]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    try {
      const { markNotificationAsReadInDB } = await import('../services/supabaseService');
      await markNotificationAsReadInDB(notificationId);
    } catch (err) {
      console.warn('⚠️ [markNotificationAsRead] Error:', err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    const effectiveUserId = user?.id || session?.user?.id;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (effectiveUserId) {
      try {
        const { markAllNotificationsAsReadInDB } = await import('../services/supabaseService');
        await markAllNotificationsAsReadInDB(effectiveUserId);
      } catch (err) {
        console.warn('⚠️ [markAllNotificationsAsRead] Error:', err);
      }
    }
  }, [user?.id, session?.user?.id]);

  const clearAllNotifications = useCallback(async () => {
    const effectiveUserId = user?.id || session?.user?.id;
    setNotifications([]);
    if (effectiveUserId) {
      try {
        const { deleteAllUserNotificationsInDB } = await import('../services/supabaseService');
        await deleteAllUserNotificationsInDB(effectiveUserId);
      } catch (err) {
        console.warn('⚠️ [clearAllNotifications] Error:', err);
      }
    }
  }, [user?.id, session?.user?.id]);

  const requestCircleTransfer = useCallback(async (
    targetCircleId: string,
    targetCircleName: string,
    targetTeacherId?: string
  ) => {
    try {
      const { requestCircleTransferInDB } = await import('../services/supabaseService');
      const res = await requestCircleTransferInDB({
        studentId: user.id,
        studentName: user.displayName || user.name || 'طالب قرآن',
        currentCircleId: user.circleId || userCircle?.id || '',
        currentCircleName: user.circleName || userCircle?.name || 'بدون حلقة',
        targetCircleId,
        targetCircleName,
        targetTeacherId,
      });
      return res;
    } catch (err: any) {
      console.error('❌ [requestCircleTransfer] Error:', err);
      return { success: false, message: err.message || 'فشل إرسال طلب النقل' };
    }
  }, [user, userCircle]);

  const respondToCircleTransfer = useCallback(async (notificationId: string, action: 'accept' | 'reject') => {
    const targetNotif = notifications.find(n => n.id === notificationId);
    if (!targetNotif || !targetNotif.data) {
      return { success: false, message: 'بيانات الإشعار غير متوفرة' };
    }

    const {
      studentId,
      studentName,
      currentCircleId,
      currentCircleName,
      targetCircleId,
      targetCircleName,
    } = targetNotif.data;

    // تحديث تفاؤلي لحالة الإشعار
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          isRead: true,
          data: {
            ...n.data,
            status: action === 'accept' ? 'accepted' : 'rejected',
          },
        };
      }
      return n;
    }));

    try {
      const { respondToCircleTransferInDB } = await import('../services/supabaseService');
      const res = await respondToCircleTransferInDB({
        notificationId,
        action,
        teacherId: user.id,
        teacherName: user.displayName || user.name || 'معلمك',
        studentId,
        studentName,
        currentCircleId,
        currentCircleName,
        targetCircleId,
        targetCircleName,
      });

      if (res.success && action === 'accept') {
        // تحديث حلقات المعلم وقائمة طلابه مباشرة
        try {
          const { getTeacherDashboardData } = await import('../services/supabaseService');
          const dash = await getTeacherDashboardData(user.id);
          if (dash && dash.circles) {
            setTeacherCircles(dash.circles || []);
            setCircleStudents(dash.students || []);
          }
        } catch (e) {}
      }

      return res;
    } catch (err: any) {
      console.error('❌ [respondToCircleTransfer] Error:', err);
      return { success: false, message: err.message || 'حدث خطأ أثناء معالجة الطلب' };
    }
  }, [notifications, user]);

  const openWeekModal = useCallback((week: Week) => {
    setSelectedWeekForModal(week);
    setShowWeekModal(true);
  }, []);

  const closeWeekModal = useCallback(() => {
    setShowWeekModal(false);
    setSelectedWeekForModal(null);
  }, []);

  const openListeningTask = useCallback((node: NodeItem, week: Week) => {
    setActiveListeningTask({ node, week });
  }, []);

  const closeListeningTask = useCallback(() => {
    setActiveListeningTask(null);
  }, []);

  const startLesson = useCallback(async (node: NodeItem, week: Week) => {
    if (node.type === 'recite') {
      const hasCircle = profile?.circle_id || user.circleId || userCircle?.id;
      if (!hasCircle && user.role === 'student') {
        alert('⚠️ يرجى الانضمام إلى حلقة أولاً لتتمكن من استخدام خاصية التسميع إلى معلم.');
        return;
      }

      // Fetch fresh submissions for user so teacher notes & reviews are 100% updated in state
      const currentUserId = profile?.id || user.id;
      if (currentUserId) {
        try {
          const { getStudentSubmissions } = await import('../services/supabaseService');
          const latestSubs = await getStudentSubmissions(currentUserId);
          if (latestSubs && latestSubs.length > 0) {
            const subsMap: Record<string, NodeSubmission> = {};
            const approvedNodes: string[] = [];
            latestSubs.forEach(s => {
              if (s.nodeId) {
                subsMap[s.nodeId] = s;
                if (s.status === 'approved' && !approvedNodes.includes(s.nodeId)) {
                  approvedNodes.push(s.nodeId);
                }
              }
            });
            setUser(prev => ({
              ...prev,
              submissions: {
                ...(prev.submissions || {}),
                ...subsMap,
              },
              completedNodes: Array.from(new Set([...(prev.completedNodes || []), ...approvedNodes])),
            }));
          }
        } catch (e) {
          console.warn('⚠️ [startLesson] Error refreshing student submissions:', e);
        }
      }
    }
    if (node.type === 'listen') {
      setActiveListeningTask({ node, week });
      return;
    }
    setActiveNode(node);
    setActiveWeek(week);
    setShowLessonModal(true);
  }, [profile, user.circleId, userCircle, user.role, user.id]);

  const closeLessonModal = useCallback(() => {
    setShowLessonModal(false);
    setActiveNode(null);
    setActiveWeek(null);
  }, []);

  const openWeekRewardModal = useCallback((reward: WeekRewardInfo) => {
    setPendingWeekReward(reward);
  }, []);

  const closeWeekRewardModal = useCallback(() => {
    setPendingWeekReward(null);
  }, []);

  // Fetch submissions for teacher
  const fetchTeacherSubmissions = useCallback(async () => {
    const teacherId = profile?.id || user.id;
    if (!teacherId || user.role !== 'teacher') return;
    try {
      console.log('🎙️ [SupabaseContext] Fetching submissions for teacher:', teacherId);
      const sessionToken = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token;
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const res = await fetch(`/api/submissions/teacher/${teacherId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.submissions)) {
          console.log(`✅ [SupabaseContext] Loaded ${data.submissions.length} submissions for teacher from API`);
          setTeacherSubmissions(data.submissions);
          return;
        }
      }

      // If API fails completely, fallback to direct query strictly for this teacher's circles
      try {
        const { data: circles } = await supabase
          .from('circles')
          .select('id')
          .eq('teacher_id', teacherId);

        const circleIds = (circles || []).map((c: any) => c.id).filter(Boolean);
        if (circleIds.length === 0) {
          setTeacherSubmissions([]);
          return;
        }

        const { data: recData, error: recErr } = await supabase
          .from('recordings')
          .select('*')
          .in('circle_id', circleIds)
          .order('created_at', { ascending: false });

        if (!recErr && Array.isArray(recData)) {
          const validRecs = recData.filter((r: any) => r.status !== 'deleted' && r.status !== 'cancelled_reset');
          
          // Fetch student profiles to get their real names
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
            } catch (e) {}
          }

          const mapped = validRecs.map(r => ({
            id: r.id,
            studentId: r.student_id,
            studentName: studentNameMap.get(r.student_id) || 'طالب',
            circleId: r.circle_id,
            teacherId,
            nodeId: r.node_id,
            nodeTitle: r.node_title || 'تسميع السور المقررة',
            type: r.type || (r.audio_url ? 'recording' : 'halaqah'),
            audioUrl: r.audio_url || '',
            status: r.status === 'approved'
              ? 'approved'
              : (r.status === 'needs_practice' || r.status === 'reviewed')
              ? 'reviewed'
              : r.status === 'absent'
              ? 'absent'
              : 'pending_teacher_review',
            teacherNotes: r.teacher_notes || '',
            rating: r.rating || (r.status === 'approved' ? 'معتمد' : ''),
            submittedAt: r.created_at || new Date().toISOString(),
          }));
          console.log(`✅ [SupabaseContext] Direct Supabase query loaded ${mapped.length} recordings for teacher`);
          setTeacherSubmissions(mapped as NodeSubmission[]);
        } else {
          setTeacherSubmissions([]);
        }
      } catch (dbFallbackErr) {
        console.warn('⚠️ [SupabaseContext] DB fallback error:', dbFallbackErr);
        setTeacherSubmissions([]);
      }
    } catch (e) {
      console.warn('⚠️ [SupabaseContext] Error fetching teacher submissions:', e);
    }
  }, [profile?.id, user.id, user.role, session?.access_token]);

  // Review submission method directly via Supabase client with instant Optimistic UI & fast RPC
  const reviewStudentSubmission = async (
    studentId: string,
    nodeId: string,
    status: 'approved' | 'needs_practice' | 'reviewed',
    teacherNotes: string,
    rating: string,
    xpReward = 25,
    weekId = 1,
    submissionId?: string
  ): Promise<boolean> => {
    const dbStatus = status === 'approved' ? 'approved' : status === 'needs_practice' ? 'needs_practice' : 'reviewed';
    const nowIso = new Date().toISOString();

    // 1. حفظ نسخة احتياطية من الحالة الحالية للتراجع في حال حدوث خطأ
    const prevTeacherSubmissions = [...teacherSubmissions];
    const prevCircleStudents = [...circleStudents];
    const prevUser = { ...user };

    // 2. تحديث تفاؤلي فوري للواجهة (Optimistic UI) بدون أي انتظار
    setTeacherSubmissions(prev =>
      prev.map(sub => {
        const isMatch = (sub.id && submissionId && sub.id === submissionId) ||
                        (sub.studentId === studentId && sub.nodeId === nodeId);
        if (!isMatch) return sub;
        return {
          ...sub,
          status: dbStatus,
          teacherNotes,
          rating,
          reviewedAt: nowIso,
        };
      })
    );

    // 3. تحديث نقاط ومهام الطالب في الحلقة فوراً إذا كان اعتماداً
    if (status === 'approved') {
      const isGateNode = nodeId.includes('gate');
      setCircleStudents(prev =>
        prev.map(s => {
          if (s.id === studentId) {
            const existingNodes = s.completedNodes || [];
            const newNodes = existingNodes.includes(nodeId) ? existingNodes : [...existingNodes, nodeId];
            const existingWeeks = s.completedWeeks || [];
            const newWeeks = isGateNode && weekId && !existingWeeks.includes(weekId) ? [...existingWeeks, weekId] : existingWeeks;
            const newCurrentWeek = isGateNode && weekId ? Math.max(s.currentWeek || 1, weekId + 1) : (s.currentWeek || 1);
            return {
              ...s,
              completedNodes: newNodes,
              completedWeeks: newWeeks,
              currentWeek: newCurrentWeek,
              xp: (s.xp || 0) + (xpReward || 25),
            };
          }
          return s;
        })
      );
    }

    // 4. تحديث حالة المستخدم الحالي إذا كان هو الطالب نفسه
    if (user.id === studentId) {
      setUser(prev => {
        const prevSubs = prev.submissions || {};
        const currentSub = prevSubs[nodeId] || { nodeId, weekId, studentId, type: 'recording' };
        const existingNodes = prev.completedNodes || [];
        const newNodes = status === 'approved' && !existingNodes.includes(nodeId)
          ? [...existingNodes, nodeId]
          : existingNodes;

        const isGateNode = nodeId.includes('gate');
        const existingWeeks = prev.completedWeeks || [];
        const newWeeks = status === 'approved' && isGateNode && weekId && !existingWeeks.includes(weekId)
          ? [...existingWeeks, weekId]
          : existingWeeks;
        const newCurrentWeek = status === 'approved' && isGateNode && weekId
          ? Math.max(prev.currentWeek || 1, weekId + 1)
          : (prev.currentWeek || 1);

        return {
          ...prev,
          submissions: {
            ...prevSubs,
            [nodeId]: {
              ...currentSub,
              status: dbStatus,
              teacherNotes,
              rating,
              reviewedAt: nowIso,
            },
          },
          completedNodes: newNodes,
          completedWeeks: newWeeks,
          currentWeek: newCurrentWeek,
          xp: status === 'approved' ? prev.xp + xpReward : prev.xp,
        };
      });
    }

    // 5. تنفيذ العملية في قاعدة البيانات باستخدام RPC بطلب شبكي واحد
    try {
      const { reviewStudentSubmissionInDB } = await import('../services/supabaseService');
      const result = await reviewStudentSubmissionInDB({
        submissionId,
        studentId,
        nodeId,
        status,
        teacherNotes,
        rating,
        xpReward,
        weekId,
        teacherName: user.displayName || user.name || 'المعلم',
      });

      if (!result.success) {
        console.error('❌ [SupabaseContext.reviewStudentSubmission] DB review failed, rolling back:', result.error);
        // استرجاع الحالة السابقة عند الفشل
        setTeacherSubmissions(prevTeacherSubmissions);
        setCircleStudents(prevCircleStudents);
        if (user.id === studentId) setUser(prevUser);
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ [SupabaseContext.reviewStudentSubmission] Error, rolling back:', err);
      // استرجاع الحالة السابقة عند حدوث خطأ استثنائي
      setTeacherSubmissions(prevTeacherSubmissions);
      setCircleStudents(prevCircleStudents);
      if (user.id === studentId) setUser(prevUser);
      return false;
    }
  };

  // Update progress directly in Supabase DB
  const completeNode = async (nodeId: string, weekId: number, xpGained: number) => {
    console.log('🌟 [SupabaseContext.completeNode] Invoked for node:', nodeId, 'week:', weekId, 'xp:', xpGained);

    // If teacher, do NOT record completion in teacher's profile (it's just a preview)
    if (user.role === 'teacher') {
      console.log('👀 [SupabaseContext.completeNode] Teacher preview mode - no progress recorded.');
      closeLessonModal();
      closeListeningTask();
      return;
    }

    const today = getTodayDateString();
    const streakResult = updateStreakOnActivity(user.streak, user.longestStreak, user.lastActiveDate, user.completedDates);

    const isAlreadyCompleted = user.completedNodes.includes(nodeId);
    const newCompletedNodes = isAlreadyCompleted ? user.completedNodes : [...user.completedNodes, nodeId];
    const newXp = user.xp + (isAlreadyCompleted ? Math.round(xpGained * 0.2) : xpGained);

    const updatedUser: UserProfile = {
      ...user,
      xp: newXp,
      streak: streakResult.streak,
      longestStreak: streakResult.longestStreak,
      lastActiveDate: today,
      completedNodes: newCompletedNodes,
    };

    // Instant local UI state update
    setUser(updatedUser);
    setProfile((prev: any) =>
      prev
        ? {
            ...prev,
            xp: newXp,
            streak: streakResult.streak,
            completed_nodes: newCompletedNodes,
          }
        : prev
    );

    triggerCelebration();

    const userId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    if (userId) {
      try {
        const { completeNodeInDB } = await import('../services/supabaseService');
        const res = await completeNodeInDB(userId, nodeId, weekId, xpGained, streakResult.streak);
        console.log('✅ [SupabaseContext.completeNode] Database update response:', res);
        if (res.success && res.profile) {
          setProfile(res.profile);
        }
      } catch (err) {
        console.error('❌ [SupabaseContext.completeNode] Error updating progress in DB:', err);
      }
    }
  };

  const submitNodeForReview = async (
    nodeId: string,
    weekId: number,
    type: 'halaqah' | 'recording',
    audioUrl?: string,
    audioBlobKey?: string,
    audioData?: string,
    nodeTitle?: string,
    surahName?: string,
    surahsList?: string[]
  ) => {
    console.log('📤 [SupabaseContext.submitNodeForReview] Submitting node for review:', {
      nodeId,
      weekId,
      type,
      audioUrl,
    });

    const updatedSubmissions: Record<string, NodeSubmission> = {
      ...(user.submissions || {}),
      [nodeId]: {
        nodeId,
        weekId,
        nodeTitle: nodeTitle || 'تسميع السور المقررة',
        surahName: surahName || '',
        surahsList: surahsList || [],
        type,
        audioUrl,
        audioData,
        audioBlobKey,
        submittedAt: new Date().toISOString(),
        status: 'pending_teacher_review',
      },
    };

    setUser(prev => ({
      ...prev,
      submissions: updatedSubmissions,
    }));

    const studentId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    const circleId = user.circleId || profile?.circle_id;
    const teacherId = user.teacherId || profile?.teacher_id;
    const studentName = user.displayName || user.name || profile?.name || 'طالب';

    if (studentId && studentName && studentName !== 'طالب' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`ward_student_name_${studentId}`, studentName);
      } catch (e) {}
    }

    const isValidUUID = (str?: string | null): boolean => {
      if (!str || typeof str !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
    };

    // 1. Direct client insert into Supabase recordings table (using authenticated Supabase client session)
    if (studentId && isValidUUID(studentId)) {
      try {
        const recordingPayload: Record<string, any> = {
          student_id: studentId,
          node_id: nodeId,
          audio_url: audioUrl || audioData || '',
          status: 'pending',
          type,
          node_title: nodeTitle || 'تسميع السور المقررة',
          surah_name: surahName || '',
          surahs_list: surahsList || [],
        };
        if (isValidUUID(circleId)) {
          recordingPayload.circle_id = circleId;
        }

        const { data: dbRec, error: dbErr } = await supabase
          .from('recordings')
          .insert(recordingPayload)
          .select();

        if (!dbErr && dbRec) {
          console.log('✅ [SupabaseContext] Recording saved directly to Supabase table:', dbRec);
        } else if (dbErr) {
          console.warn('⚠️ [SupabaseContext] Direct recordings insert warning:', dbErr);
        }
      } catch (directErr) {
        console.warn('⚠️ [SupabaseContext] Direct recordings insert exception:', directErr);
      }
    }

    // 2. Synchronize with Server API proxy (passing Auth Bearer header)
    if (studentId) {
      try {
        const sessionToken = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        await fetch('/api/submissions/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify({
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
          }),
        });
        console.log('✅ [SupabaseContext] Submission successfully synchronized with server API');
      } catch (err) {
        console.warn('⚠️ [SupabaseContext] Error saving submission to server API:', err);
      }
    }
  };

  const switchRecitationType = async (nodeId: string, newType: 'halaqah' | 'recording') => {
    const studentId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    if (!studentId || !nodeId) return { success: false, message: 'معرّف الطالب أو المحطة غير موجود' };

    console.log(`🔄 [SupabaseContext.switchRecitationType] Switching nodeId ${nodeId} to ${newType}`);

    // 1. Update student submissions in local state immediately
    const existing = user.submissions?.[nodeId];
    const updatedSubmission: NodeSubmission = existing
      ? {
          ...existing,
          type: newType,
          audioUrl: newType === 'halaqah' ? undefined : existing.audioUrl,
          audioData: newType === 'halaqah' ? undefined : existing.audioData,
          status: 'pending_teacher_review',
        }
      : {
          nodeId,
          weekId: 1,
          nodeTitle: 'تسميع السور المقررة',
          type: newType,
          status: 'pending_teacher_review',
          submittedAt: new Date().toISOString(),
        };

    setUser(prev => ({
      ...prev,
      submissions: {
        ...(prev.submissions || {}),
        [nodeId]: updatedSubmission,
      },
    }));

    // 2. Synchronize teacherSubmissions immediately for instant reflection in teacher view
    setTeacherSubmissions(prev => {
      const exists = prev.some(s => s.studentId === studentId && s.nodeId === nodeId);
      if (!exists) {
        const studentName = user.displayName || user.name || profile?.name || 'طالب';
        if (studentId && studentName !== 'طالب' && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`ward_student_name_${studentId}`, studentName);
          } catch (e) {}
        }
        const circleId = user.circleId || profile?.circle_id || '';
        const teacherId = user.teacherId || profile?.teacher_id || '';
        const newTeacherSub: NodeSubmission = {
          id: `sub_${studentId}_${nodeId}`,
          studentId,
          studentName,
          circleId,
          teacherId,
          nodeId,
          weekId: existing?.weekId || 1,
          nodeTitle: existing?.nodeTitle || 'تسميع السور المقررة',
          surahName: existing?.surahName || '',
          surahsList: existing?.surahsList || [],
          type: newType,
          audioUrl: newType === 'halaqah' ? '' : existing?.audioUrl || '',
          status: 'pending_teacher_review',
          submittedAt: new Date().toISOString(),
        };
        return [newTeacherSub, ...prev];
      }
      return prev.map(s => {
        if (s.studentId === studentId && s.nodeId === nodeId) {
          return {
            ...s,
            type: newType,
            audioUrl: newType === 'halaqah' ? '' : s.audioUrl,
            audioData: newType === 'halaqah' ? '' : s.audioData,
            status: 'pending_teacher_review',
          };
        }
        return s;
      });
    });

    try {
      const { switchRecitationTypeInDB } = await import('../services/supabaseService');
      const res = await switchRecitationTypeInDB(studentId, nodeId, newType);
      return res;
    } catch (err: any) {
      console.error('❌ [SupabaseContext.switchRecitationType] Error:', err);
      return { success: false, message: err.message };
    }
  };

  const markStudentAbsent = async (studentId: string, nodeId: string, submissionId?: string) => {
    console.log(`📋 [SupabaseContext.markStudentAbsent] Student ${studentId}, node ${nodeId}`);
    try {
      // 1. Remove from teacherSubmissions state immediately
      setTeacherSubmissions(prev =>
        prev.filter(s => {
          if (submissionId && s.id === submissionId) return false;
          if (s.studentId === studentId && s.nodeId === nodeId) return false;
          return true;
        })
      );

      // 2. If current user is student, clean local submissions
      if (user.id === studentId) {
        setUser(prev => {
          const subs = { ...(prev.submissions || {}) };
          delete subs[nodeId];
          return { ...prev, submissions: subs };
        });
      }

      // 3. Direct DB call
      try {
        if (submissionId && !submissionId.includes('_')) {
          await supabase.from('recordings').delete().eq('id', submissionId);
        } else {
          await supabase.from('recordings').delete().eq('student_id', studentId).eq('node_id', nodeId);
        }
      } catch (dbDelErr) {
        console.warn('Notice on direct delete:', dbDelErr);
      }

      // 4. Call server API
      const { markHalaqahAbsentInDB } = await import('../services/supabaseService');
      const res = await markHalaqahAbsentInDB(studentId, nodeId, submissionId, user.displayName || user.name || 'المعلم');
      return res;
    } catch (err: any) {
      console.error('❌ [SupabaseContext.markStudentAbsent] Error:', err);
      return { success: false, message: err.message };
    }
  };

  const claimWeekRewardAndUnlockNext = async () => {
    if (!pendingWeekReward) return;
    const { week, xpEarned, gateNode, unlockedBadgeIds } = pendingWeekReward;
    const gateNodeId = gateNode?.id || `w${week.id}_gate`;
    const nextWeekId = week.id + 1;

    // 1. Compute new completed weeks
    const newCompletedWeeks = user.completedWeeks.includes(week.id)
      ? user.completedWeeks
      : [...user.completedWeeks, week.id];

    // 2. Ensure gate node + all nodes of this week are included in completedNodes
    const weekNodeIds = (week.nodes || []).map(n => n.id);
    const nodesToAdd = [gateNodeId, ...weekNodeIds];
    const newCompletedNodes = Array.from(new Set([...user.completedNodes, ...nodesToAdd]));

    // 3. Compute next current week
    const newCurrentWeek = Math.max(user.currentWeek, nextWeekId);

    // 4. Compute unlocked badges
    const newBadges = Array.from(new Set([...(user.unlockedBadges || []), ...(unlockedBadgeIds || [])]));
    const newXp = user.xp + xpEarned;

    console.log('🏆 [SupabaseContext.claimWeekRewardAndUnlockNext] Unlocking week:', {
      weekId: week.id,
      nextWeekId: newCurrentWeek,
      gateNodeId,
      newCompletedWeeks,
      newCompletedNodesCount: newCompletedNodes.length,
    });

    // 5. Update local React state immediately for snappy user experience
    setUser(prev => ({
      ...prev,
      xp: newXp,
      completedWeeks: newCompletedWeeks,
      completedNodes: newCompletedNodes,
      currentWeek: newCurrentWeek,
      unlockedBadges: newBadges,
    }));

    setProfile((prev: any) =>
      prev
        ? {
            ...prev,
            xp: newXp,
            current_week: newCurrentWeek,
            completed_weeks: newCompletedWeeks,
            completed_nodes: newCompletedNodes,
          }
        : prev
    );

    closeWeekRewardModal();
    triggerCelebration();

    // 6. Persist to DB table profiles using completeWeekInDB service
    const userId = session?.user?.id || supabaseAuthUser?.id || profile?.id || user.id;
    if (userId) {
      try {
        const { completeWeekInDB } = await import('../services/supabaseService');
        const res = await completeWeekInDB(userId, week.id, gateNodeId, xpEarned, newCompletedWeeks, newCurrentWeek);
        console.log('🏆 [SupabaseContext] Week completion persisted to DB:', res);
        if (res.success && res.profile) {
          setProfile(res.profile);
        }
      } catch (err) {
        console.error('❌ [SupabaseContext] Error saving reward to DB:', err);
      }
    }
  };

  const buyDecoration = (decId: string) => {
    const dec = INITIAL_DECORATIONS.find(d => d.id === decId);
    if (!dec || user.xp < dec.costXp || user.unlockedDecorations.includes(decId)) return;
    setUser(prev => ({
      ...prev,
      xp: prev.xp - dec.costXp,
      unlockedDecorations: [...prev.unlockedDecorations, decId],
      placedDecorations: [...prev.placedDecorations, decId],
    }));
    triggerCelebration();
  };

  const placeDecoration = (decId: string, x: number, y: number) => {
    setUser(prev => {
      const placed = prev.placedDecorations.includes(decId)
        ? prev.placedDecorations
        : [...prev.placedDecorations, decId];
      return { ...prev, placedDecorations: placed };
    });
  };

  const joinCircleAction = async (code: string): Promise<{ success: boolean; message: string }> => {
    const studentId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    if (!studentId) {
      return { success: false, message: 'يرجى تسجيل الدخول أولاً للانضمام إلى الحلقة' };
    }

    try {
      console.log('🔗 [SupabaseContext] Joining circle directly via Supabase SDK for student:', studentId, 'code:', code);
      const { joinCircle } = await import('../services/supabaseService');
      const res = await joinCircle(studentId, code.trim());

      if (!res.success || !res.circle) {
        return { success: false, message: res.message || 'تعذر الانضمام للحلقة.' };
      }

      const c = res.circle;
      // تحديث حالة الحلقة والمستخدم والملف الشخصي فوراً في الـ React State
      setUserCircle(c);
      setUser(prev => ({
        ...prev,
        circleId: c.id,
        circleName: c.name,
        teacherId: c.teacherId,
        teacherName: c.teacherName,
      }));
      setProfile((prev: any) => (prev ? { ...prev, circle_id: c.id, teacher_id: c.teacherId } : prev));

      await fetchProfile(studentId);
      triggerCelebration();
      return { success: true, message: res.message || `تم الانضمام بنجاح إلى ${c.name}!` };
    } catch (err: any) {
      console.error('❌ [SupabaseContext] Error joining circle:', err);
      return { success: false, message: err.message || 'حدث خطأ أثناء الانضمام للحلقة.' };
    }
  };

  const leaveCurrentCircle = async () => {
    const studentId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    if (studentId) {
      try {
        const circleId = userCircle?.id || user.circleId || profile?.circle_id;
        console.log('👋 [SupabaseContext] Leaving current circle directly via Supabase SDK for student:', studentId, 'circleId:', circleId);
        const { leaveCircle } = await import('../services/supabaseService');
        await leaveCircle(studentId, circleId);

        setUserCircle(null);
        setUser(prev => ({
          ...prev,
          circleId: '',
          circleName: '',
          teacherId: '',
          teacherName: '',
        }));
        setProfile((prev: any) => (prev ? { ...prev, circle_id: null, teacher_id: null } : prev));
        await fetchProfile(studentId);
      } catch (err) {
        console.error('Error leaving circle:', err);
      }
    }
  };

  const createTeacherCircle = async (name: string): Promise<Circle> => {
    const teacherId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    const teacherName = user.displayName || user.name || profile?.name || 'المعلم';
    const gender = user.gender || profile?.gender || 'male';

    console.log('🏛️ [SupabaseContext] Creating new circle:', { name, teacherId, teacherName, gender });

    try {
      const { createCircle } = await import('../services/supabaseService');
      const newCircle = await createCircle(teacherId, name.trim(), gender, teacherName);

      setTeacherCircles(prev => [newCircle, ...prev.filter(c => c.id !== newCircle.id)]);
      setUserCircle(newCircle);
      
      // Update local profile & user state immediately
      setProfile((prev: any) => (prev ? { ...prev, circle_id: newCircle.id } : prev));
      setUser(prev => ({ ...prev, circleId: newCircle.id, circleName: newCircle.name }));

      triggerCelebration();
      await fetchProfile(teacherId);
      return newCircle;
    } catch (err: any) {
      console.error('❌ [SupabaseContext] Error creating circle:', err);
      throw err;
    }
  };

  const updateProfile = (updates: any) => {
    setProfile((prev: any) => (prev ? { ...prev, ...updates } : updates));
    setUser((prev: UserProfile) => ({ ...prev, ...updates }));
  };

  const refreshCircleData = async () => {
    const userId = supabaseAuthUser?.id || session?.user?.id || user.id;
    if (userId) {
      console.log('🔄 [SupabaseContext] Refreshing circle data for:', userId);
      setIsRefreshing(true);
      try {
        await fetchProfile(userId);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const resetProgress = async () => {
    const updatedUser: UserProfile = {
      ...user,
      xp: 0,
      streak: 1,
      longestStreak: 1,
      currentWeek: 1,
      completedNodes: [],
      completedWeeks: [],
      submissions: {},
      unlockedDecorations: [],
      placedDecorations: [],
    };
    setUser(updatedUser);
    setProfile((prev: any) => (prev ? {
      ...prev,
      completed_nodes: [],
      completed_weeks: [],
      xp: 0,
      streak: 1,
      current_week: 1,
    } : prev));

    const userId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    if (userId) {
      try {
        const { resetStudentProgressInDB } = await import('../services/supabaseService');
        await resetStudentProgressInDB(userId);

        const { clearAllAudioRecordings } = await import('../services/storageService');
        await clearAllAudioRecordings();

        await fetchProfile(userId);
      } catch (err) {
        console.error('Error resetting progress in DB:', err);
      }
    }
  };

  const loadSampleProgress = () => {
    setUser(prev => ({ ...prev, xp: 500, streak: 5 }));
    triggerCelebration();
  };

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        supabaseAuthUser,
        profile,
        loading,
        isRefreshing,
        signIn,
        signUp,
        resetPassword,
        signOut,
        refreshProfile,
        signInWithOAuth,
        activeTab,
        setActiveTab,
        weeks,
        badges,
        decorations,
        activeWeek,
        activeNode,
        selectedWeekForModal,
        showLessonModal,
        showWeekModal,
        activeListeningTask,
        openListeningTask,
        closeListeningTask,
        pendingWeekReward,
        userCircle,
        circleStudents,
        teacherCircles,
        teacherSubmissions,
        fetchTeacherSubmissions,
        reviewStudentSubmission,
        openWeekModal,
        closeWeekModal,
        startLesson,
        closeLessonModal,
        openWeekRewardModal,
        closeWeekRewardModal,
        claimWeekRewardAndUnlockNext,
        completeNode,
        submitNodeForReview,
        switchRecitationType,
        markStudentAbsent,
        updateUserProfile,
        buyDecoration,
        placeDecoration,
        triggerCelebration,
        isAuthModalOpen,
        setIsAuthModalOpen,
        firebaseUser: supabaseAuthUser ? { uid: supabaseAuthUser.id, email: supabaseAuthUser.email } : null,
        isAnonymous: !supabaseAuthUser,
        joinCircleAction,
        leaveCurrentCircle,
        createTeacherCircle,
        refreshCircleData,
        updateProfile,
        resetProgress,
        loadSampleProgress,
        language,
        setLanguage,
        setTrack,
        t,
        // Notifications
        notifications,
        unreadNotificationsCount,
        isNotificationsModalOpen,
        setIsNotificationsModalOpen,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        requestCircleTransfer,
        respondToCircleTransfer,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) throw new Error('useSupabase must be used within SupabaseProvider');
  return context;
};

// Backward-compatible aliases
export const AppProvider = SupabaseProvider;
export const useApp = useSupabase;
export type AppContextType = SupabaseContextType;
