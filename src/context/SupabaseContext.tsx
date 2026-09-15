import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
} from '../types';
import { WEEKS_DATA, INITIAL_BADGES, INITIAL_DECORATIONS } from '../data/quranJourneyData';
import { updateStreakOnActivity, getTodayDateString, getYesterdayDateString } from '../services/streakService';

export type TabType = 'home' | 'journey' | 'camp' | 'achievements' | 'profile' | 'teacher' | 'students' | 'halaqah';

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
}

const DEFAULT_USER_PROFILE: UserProfile = {
  id: '',
  displayName: '',
  name: '',
  role: 'student',
  gender: 'male',
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

  // Static Journey Data
  const [weeks] = useState<Week[]>(WEEKS_DATA);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [decorations, setDecorations] = useState<CampDecoration[]>(INITIAL_DECORATIONS);

  // User State directly mapped from Database profile
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  const mapProfileToUser = useCallback((data: any): UserProfile => {
    const completedNodesList = Array.isArray(data.completed_nodes)
      ? data.completed_nodes
      : (Array.isArray(data.completedNodes) ? data.completedNodes : []);

    return {
      ...DEFAULT_USER_PROFILE,
      id: data.id,
      name: data.name || data.email?.split('@')[0] || 'مستخدم ورد',
      displayName: data.name || data.email?.split('@')[0] || 'مستخدم ورد',
      email: data.email,
      role: data.role || 'student',
      gender: data.gender || 'male',
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

  // Auth Functions: Robust Full-Stack Proxy with Supabase Sync
  const signUp = async (email: string, password: string, metadata: any) => {
    console.log('📝 [SupabaseContext] Executing signUp for:', { email, metadata });

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
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء الحساب. يرجى التأكد من البيانات.');
      }

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
    } catch (apiErr: any) {
      console.error('❌ [SupabaseContext] Signup error:', apiErr.message);
      throw apiErr;
    }
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

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

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
          const mapped = validRecs.map(r => ({
            id: r.id,
            studentId: r.student_id,
            studentName: 'طالب قرآن',
            circleId: r.circle_id,
            teacherId,
            nodeId: r.node_id,
            nodeTitle: r.node_title || 'تسميع السور المقررة',
            type: r.type || (r.audio_url ? 'recording' : 'halaqah'),
            audioUrl: r.audio_url || '',
            status: r.status === 'approved' ? 'approved' : r.status === 'reviewed' ? 'reviewed' : 'pending_teacher_review',
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

  // Review submission method
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
    try {
      console.log('📝 [SupabaseContext.reviewStudentSubmission] Sending review:', {
        submissionId,
        studentId,
        nodeId,
        status,
        rating,
        teacherNotes,
      });

      const sessionToken = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const res = await fetch('/api/submissions/review', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          submissionId,
          studentId,
          nodeId,
          status,
          teacherNotes,
          rating,
          xpReward,
          weekId,
        }),
      });

      // Also directly update Supabase recordings table as client-side fallback
      try {
        if (submissionId && !submissionId.includes('_')) {
          await supabase
            .from('recordings')
            .update({
              status: status === 'approved' ? 'approved' : 'reviewed',
              teacher_notes: teacherNotes,
              rating: rating || (status === 'approved' ? 'ممتاز' : 'يحتاج تدريب'),
            })
            .eq('id', submissionId);
        }
        await supabase
          .from('recordings')
          .update({
            status: status === 'approved' ? 'approved' : 'reviewed',
            teacher_notes: teacherNotes,
            rating: rating || (status === 'approved' ? 'ممتاز' : 'يحتاج تدريب'),
          })
          .eq('student_id', studentId)
          .eq('node_id', nodeId);
      } catch (dbErr) {
        console.warn('⚠️ [SupabaseContext] Direct recordings table update warning:', dbErr);
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update local teacher submissions
          setTeacherSubmissions(prev =>
            prev.map(sub =>
              (sub.id && submissionId && sub.id === submissionId) ||
              (sub.studentId === studentId && sub.nodeId === nodeId)
                ? {
                    ...sub,
                    status: status === 'approved' ? 'approved' : 'reviewed',
                    teacherNotes,
                    rating,
                    reviewedAt: new Date().toISOString(),
                  }
                : sub
            )
          );

          // Update active user state if the current logged-in user is this student
          if (user.id === studentId) {
            setUser(prev => {
              const prevSubs = prev.submissions || {};
              const currentSub = prevSubs[nodeId] || { nodeId, weekId, studentId, type: 'recording' };
              const existingNodes = prev.completedNodes || [];
              const newNodes = status === 'approved' && !existingNodes.includes(nodeId)
                ? [...existingNodes, nodeId]
                : existingNodes;

              return {
                ...prev,
                submissions: {
                  ...prevSubs,
                  [nodeId]: {
                    ...currentSub,
                    status: status === 'approved' ? 'approved' : 'reviewed',
                    teacherNotes,
                    rating,
                    reviewedAt: new Date().toISOString(),
                  },
                },
                completedNodes: newNodes,
                xp: status === 'approved' ? prev.xp + xpReward : prev.xp,
              };
            });
          }

          // Update student in circle list if approved
          if (status === 'approved') {
            setCircleStudents(prev =>
              prev.map(s => {
                if (s.id === studentId) {
                  const existingNodes = s.completedNodes || [];
                  const newNodes = existingNodes.includes(nodeId) ? existingNodes : [...existingNodes, nodeId];
                  return {
                    ...s,
                    completedNodes: newNodes,
                    xp: s.xp + xpReward,
                  };
                }
                return s;
              })
            );
          }

          return true;
        }
      }
    } catch (err) {
      console.error('❌ [SupabaseContext.reviewStudentSubmission] Error:', err);
    }
    return false;
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
        const studentName = user.displayName || user.name || profile?.name || 'طالب قرآن';
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
      const res = await markHalaqahAbsentInDB(studentId, nodeId, submissionId);
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
      return { success: false, message: 'يرجى تسجيل الدخول أولاً' };
    }

    try {
      console.log('🔗 [SupabaseContext] Joining circle with code/id:', code, 'for student:', studentId);
      const res = await fetch('/api/circles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, circleCodeOrId: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'تعذر الانضمام للحلقة.' };
      }

      if (data.circle) {
        const c = data.circle;
        const mappedCircle: Circle = {
          id: c.id,
          name: c.name,
          code: c.code || (c.id ? c.id.slice(0, 6).toUpperCase() : 'WRD-101'),
          teacherId: c.teacher_id,
          teacherName: c.teacher_name,
          gender: c.gender,
          studentIds: c.student_ids || [],
          isActive: c.is_active !== false,
          createdAt: c.created_at,
        };
        setUserCircle(mappedCircle);
        setUser(prev => ({
          ...prev,
          circleId: c.id,
          circleName: c.name,
          teacherId: c.teacher_id,
          teacherName: c.teacher_name,
        }));
        setProfile((prev: any) => (prev ? { ...prev, circle_id: c.id, teacher_id: c.teacher_id } : prev));
      }

      await fetchProfile(studentId);
      triggerCelebration();
      return { success: true, message: data.message || 'تم الانضمام إلى الحلقة القرآنية بنجاح!' };
    } catch (err: any) {
      console.error('❌ [SupabaseContext] Error joining circle:', err);
      return { success: false, message: err.message || 'حدث خطأ أثناء الانضمام للحلقة.' };
    }
  };

  const leaveCurrentCircle = async () => {
    const studentId = supabaseAuthUser?.id || session?.user?.id || user.id || profile?.id;
    if (studentId) {
      try {
        console.log('👋 [SupabaseContext] Leaving current circle for student:', studentId);
        await fetch('/api/circles/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, circleId: userCircle?.id || user.circleId }),
        });

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
