import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { WORLDS_DATA } from '../data/quranJourneyData';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Lock,
  Check,
  Trophy,
  Compass,
  Sparkles,
  Star,
  Headphones,
  BookOpen,
  Mic,
  RotateCcw,
  ShieldCheck,
  Flame,
  Zap,
  Gift,
  Clock,
  X,
  Award,
  Flag,
  Target,
  Sun,
  Feather,
  Mountain,
  Waves,
  Landmark,
  Crown,
  BookMarked,
  Info,
  Building,
  Users,
  KeyRound,
  LogOut,
  CheckCircle,
} from 'lucide-react';
import { Week, NodeItem, TrackId } from '../types';
import { ListeningTask } from '../components/listening/ListeningTask';
import { TrackSelectionModal } from '../components/TrackSelectionModal';
import { getSurahName, translateSurahList } from '../lib/i18n';

// Biome Definitions grouping the 17 weeks into 6 thematic adventure zones
const BIOME_ZONES = [
  {
    id: 'zone_1',
    weeks: [1, 2, 3],
    name: 'واحة البداية',
    subtitle: 'مدخل جزء عم والقصار المكية',
    bgGradient: 'from-emerald-900/10 via-emerald-800/5 to-teal-900/10',
    borderColor: 'border-emerald-600/30',
    themeColor: '#006304',
  },
  {
    id: 'zone_2',
    weeks: [4, 5, 6],
    name: 'غابة التلاوة',
    subtitle: 'ترتيل وإتقان المنهج المكثف',
    bgGradient: 'from-teal-900/10 via-green-800/5 to-emerald-900/10',
    borderColor: 'border-teal-600/30',
    themeColor: '#0d9488',
  },
  {
    id: 'zone_3',
    weeks: [7, 8, 9],
    name: 'مرتفعات التثبيت',
    subtitle: 'صعود السور المتوسطة وتثبيت الحفظ',
    bgGradient: 'from-amber-900/10 via-yellow-800/5 to-amber-900/10',
    borderColor: 'border-amber-600/30',
    themeColor: '#C79545',
  },
  {
    id: 'zone_4',
    weeks: [10, 11, 12],
    name: 'وادي الفرقان',
    subtitle: 'جسور المراجعة والتأمل في المعاني',
    bgGradient: 'from-cyan-900/10 via-blue-800/5 to-teal-900/10',
    borderColor: 'border-cyan-600/30',
    themeColor: '#0891b2',
  },
  {
    id: 'zone_5',
    weeks: [13, 14, 15],
    name: 'حصن المعرفة',
    subtitle: 'الاقتراب من طوال جزء عم المبارك',
    bgGradient: 'from-indigo-900/10 via-purple-800/5 to-slate-900/10',
    borderColor: 'border-indigo-600/30',
    themeColor: '#4f46e5',
  },
  {
    id: 'zone_6',
    weeks: [16, 17],
    name: 'قلعة الإتقان الختامية',
    subtitle: 'الختام الميمون وتتويج حافظ جزء عم',
    bgGradient: 'from-amber-500/15 via-yellow-400/10 to-amber-600/20',
    borderColor: 'border-[#F9BF3B]',
    themeColor: '#F9BF3B',
  },
];

export const JourneyPage: React.FC = () => {
  const {
    user,
    weeks,
    startLesson,
    openListeningTask,
    openWeekModal,
    completeNode,
    userCircle,
    joinCircleAction,
    leaveCurrentCircle,
    circleStudents,
    setActiveTab,
    setTrack,
    language,
    t,
  } = useSupabase();
  const [selectedWorld, setSelectedWorld] = useState<string>(user.track || 'juz_amma');
  const [chestModalItem, setChestModalItem] = useState<{ node: NodeItem; week: Week; title: string; xp: number } | null>(null);

  // Keep selectedWorld in sync whenever the user track changes
  useEffect(() => {
    setSelectedWorld(user.track || 'juz_amma');
  }, [user.track]);

  // Dynamic Tabs based on chosen user track
  const trackTabs = useMemo(() => {
    if (user.track === 'juz_amma_tabarak') {
      const isAmmaTabarakFinished = user.completedWeeks.includes(16);
      return [
        {
          id: 'juz_amma_tabarak',
          title: language === 'en' ? 'Amma & Tabarak' : 'عم وتبارك',
          locked: false,
          description: '',
        },
        {
          id: 'juz_qad_samia',
          title: language === 'en' ? 'Qad Samia' : 'قد سمع',
          locked: !isAmmaTabarakFinished,
          description: language === 'en'
            ? 'Complete the 16 weeks of Amma & Tabarak track to automatically unlock this realm.'
            : 'أكمل الأسابيع الـ ١٦ في مسار عم وتبارك للتأهل التلقائي لفتح مسار جزء قد سمع.',
        },
      ];
    }

    if (user.track === 'juz_qad_samia') {
      return [
        {
          id: 'juz_qad_samia',
          title: language === 'en' ? 'Qad Samia' : 'قد سمع',
          locked: false,
          description: '',
        },
        {
          id: 'upcoming_tracks',
          title: language === 'en' ? 'Upcoming Tracks' : 'المسارات القادمة',
          locked: true,
          description: language === 'en'
            ? 'Upcoming Quranic tracks are under development and will be available soon insha\'Allah.'
            : 'المسارات القرآنية القادمة قيد التطوير وستكون متاحة قريباً بإذن الله.',
        },
      ];
    }

    // Default: juz_amma ("عم فقط")
    const isAmmaFinished = user.completedWeeks.includes(17);
    return [
      {
        id: 'juz_amma',
        title: language === 'en' ? 'Amma' : 'عم',
        locked: false,
        description: '',
      },
      {
        id: 'juz_tabarak',
        title: language === 'en' ? 'Tabarak' : 'تبارك',
        locked: !isAmmaFinished,
        description: language === 'en'
          ? 'Complete all 17 weeks in the Juz Amma journey to unlock the Juz Tabarak track.'
          : 'أكمل جميع الأسابيع الـ ١٧ في رحلة جزء عم للتأهل لفتح مسار جزء تبارك.',
      },
      {
        id: 'juz_qad_samia',
        title: language === 'en' ? 'Qad Samia' : 'قد سمع',
        locked: true,
        description: language === 'en'
          ? 'Complete previous Quranic tracks to unlock Juz Qad Samia.'
          : 'أكمل المسارات القرآنية السابقة للتأهل لفتح مسار جزء قد سمع.',
      },
    ];
  }, [user.track, user.completedWeeks, language]);

  const isCurrentTrackView = selectedWorld === (user.track || 'juz_amma') || (user.track === 'juz_amma' && selectedWorld === 'juz_amma');
  const selectedTab = trackTabs.find(tab => tab.id === selectedWorld);

  // Track Selection Modal state for first-time students
  const [showTrackModal, setShowTrackModal] = useState(false);

  useEffect(() => {
    if (user.role === 'student') {
      const hasChosen = typeof localStorage !== 'undefined' && localStorage.getItem(`ward_track_chosen_${user.id}`) === 'true';
      if (!hasChosen) {
        setShowTrackModal(true);
      }
    }
  }, [user.id, user.role]);

  // Circle Joining & Details Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNeedCircleAlert, setShowNeedCircleAlert] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showCircleDetailsModal, setShowCircleDetailsModal] = useState(false);

  // States for motion feedback & server-validated completions
  const [recentlyCompletedNodeId, setRecentlyCompletedNodeId] = useState<string | null>(null);
  const [floatingXpInfo, setFloatingXpInfo] = useState<{ nodeId: string; xp: number } | null>(null);
  const [shakingNodeId, setShakingNodeId] = useState<string | null>(null);
  const [lockedTooltipNodeId, setLockedTooltipNodeId] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const activeNodeRef = useRef<HTMLDivElement>(null);
  const prevCompletedNodesRef = useRef<string[]>(user.completedNodes);

  // Flatten all nodes into a structured flat sequence with week metadata
  const allNodesOrdered: { week: Week; node: NodeItem; globalIndex: number }[] = [];
  let globalCounter = 0;
  weeks.forEach(w => {
    w.nodes.forEach(n => {
      allNodesOrdered.push({
        week: w,
        node: n,
        globalIndex: globalCounter++,
      });
    });
  });

  // 1. Single authoritative source of truth for the active current node:
  // The first uncompleted node in the sequential journey across all weeks.
  // When completedNodes is empty ([]), activeItem will accurately be the first listening node (w1_node_1).
  const activeItem =
    allNodesOrdered.find(item => !user.completedNodes.includes(item.node.id)) ||
    allNodesOrdered[allNodesOrdered.length - 1];
  const activeNodeId = activeItem?.node.id;

  // Diagnostic logging for progress tracking
  useEffect(() => {
    console.log('🗺️ [JourneyPage] Completed nodes:', user.completedNodes);
    console.log('📍 [JourneyPage] Active item (Current node):', activeItem?.node?.id, activeItem?.node?.title);
  }, [user.completedNodes, activeItem]);

  // Calculate Node Status derived directly from completion list, submissions, and activeNodeId
  const getNodeStatus = (item: { week: Week; node: NodeItem; globalIndex: number }): 'COMPLETED' | 'PENDING' | 'CURRENT' | 'AVAILABLE' | 'LOCKED' => {
    // إذا كان المستخدم معلم، كل المهام تكون AVAILABLE (للعرض فقط)
    if (user.role === 'teacher') {
      return 'AVAILABLE';
    }
    if (user.completedNodes.includes(item.node.id)) return 'COMPLETED';
    const sub = Array.isArray(user.submissions)
      ? user.submissions.find((s: any) => s.nodeId === item.node.id)
      : (user.submissions && typeof user.submissions === 'object' ? (user.submissions as Record<string, any>)[item.node.id] : null);
    if (sub && (sub.status === 'pending' || sub.status === 'pending_teacher_review')) {
      return 'PENDING';
    }
    if (item.node.id === activeNodeId) return 'CURRENT';
    return 'LOCKED';
  };

  // Track progress updates from server & trigger verified completion motions
  useEffect(() => {
    const prevList = prevCompletedNodesRef.current;
    const currentList = user.completedNodes;

    // Detect if a new node was added after server response
    if (currentList.length > prevList.length) {
      const newlyAddedId = currentList.find(id => !prevList.includes(id));
      if (newlyAddedId) {
        const completedNodeObj = allNodesOrdered.find(item => item.node.id === newlyAddedId);
        const xpAmount = completedNodeObj?.node.xpReward || 15;

        setRecentlyCompletedNodeId(newlyAddedId);
        setFloatingXpInfo({ nodeId: newlyAddedId, xp: xpAmount });

        // Auto-clear feedback after animation completes
        const timer = setTimeout(() => {
          setRecentlyCompletedNodeId(null);
          setFloatingXpInfo(null);
        }, 2200);

        // Smooth auto-scroll to center the new current node after movement
        const scrollTimer = setTimeout(() => {
          if (activeNodeRef.current) {
            activeNodeRef.current.scrollIntoView({
              behavior: shouldReduceMotion ? 'auto' : 'smooth',
              block: 'center',
            });
          }
        }, 500);

        prevCompletedNodesRef.current = currentList;
        return () => {
          clearTimeout(timer);
          clearTimeout(scrollTimer);
        };
      }
    }

    prevCompletedNodesRef.current = currentList;
  }, [user.completedNodes, shouldReduceMotion]);

  // Initial scroll to current position on page load / tab switch
  useEffect(() => {
    if (activeNodeRef.current) {
      const timer = setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
          block: 'center',
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedWorld, shouldReduceMotion]);

  // Softer, narrower organic curve (ranging gently between 38% and 62%)
  // Creates a calm, flowing path without extreme zig-zags or text collisions
  const getHorizontalXPercentage = (globalIdx: number) => {
    const sequence = [50, 58, 62, 57, 50, 43, 38, 43, 50];
    return sequence[globalIdx % sequence.length];
  };

  // Render icon per biome zone
  const renderZoneIcon = (zoneId: string) => {
    switch (zoneId) {
      case 'zone_1': return <Sun className="w-4 h-4 text-emerald-700" />;
      case 'zone_2': return <Feather className="w-4 h-4 text-teal-700" />;
      case 'zone_3': return <Mountain className="w-4 h-4 text-amber-700" />;
      case 'zone_4': return <Waves className="w-4 h-4 text-cyan-700" />;
      case 'zone_5': return <Landmark className="w-4 h-4 text-indigo-700" />;
      case 'zone_6': return <Crown className="w-4 h-4 text-amber-600" />;
      default: return <Compass className="w-4 h-4 text-emerald-700" />;
    }
  };

  // Render world tab icon
  const renderWorldIcon = (worldId: string) => {
    switch (worldId) {
      case 'juz_amma': return <BookOpen className="w-3.5 h-3.5" />;
      case 'juz_amma_tabarak': return <BookMarked className="w-3.5 h-3.5" />;
      case 'juz_tabarak': return <BookMarked className="w-3.5 h-3.5" />;
      case 'juz_qad_samia': return <Award className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // Icon mapping by node task type and status
  const renderNodeTypeIcon = (type: NodeItem['type'], status: string, isRewardChest: boolean) => {
    if (status === 'LOCKED') {
      return <Lock className="w-5 h-5 text-slate-400" />;
    }

    if (isRewardChest && status !== 'COMPLETED') {
      return <Gift className="w-6 h-6 text-amber-500" />;
    }

    switch (type) {
      case 'listen':
        return <Headphones className="w-5 h-5" />;
      case 'memorize':
        return <BookOpen className="w-5 h-5" />;
      case 'recite':
        return <Mic className="w-5 h-5" />;
      case 'review':
        return <RotateCcw className="w-5 h-5" />;
      case 'quiz':
        return <Target className="w-5 h-5" />;
      case 'gate':
        return <Trophy className="w-6 h-6 text-[#F9BF3B]" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  // Handle click on locked node (Visual tactile feedback & warning tooltip)
  const handleLockedNodeClick = (nodeId: string) => {
    setShakingNodeId(nodeId);
    setLockedTooltipNodeId(nodeId);

    setTimeout(() => {
      setShakingNodeId(null);
    }, 350);

    setTimeout(() => {
      setLockedTooltipNodeId(null);
    }, 2200);
  };

  const totalWeeksCount = weeks.length || (user.track === 'juz_amma_tabarak' ? 16 : user.track === 'juz_qad_samia' ? 18 : 17);
  const isFinalTrackMastered = user.completedWeeks.includes(totalWeeksCount);

  // Dynamic naming based on track
  const trackMasteryName = language === 'en'
    ? (user.track === 'juz_amma_tabarak' ? 'Amma & Tabarak Citadel' : user.track === 'juz_qad_samia' ? 'Juz Qad Samia Citadel' : 'Juz Amma Mastery Citadel')
    : (user.track === 'juz_amma_tabarak' ? 'قلعة إتقان عم وتبارك' : user.track === 'juz_qad_samia' ? 'قلعة إتقان جزء قد سمع' : 'قلعة إتقان جزء عم');

  const trackMasteryDesc = language === 'en'
    ? (user.track === 'juz_amma_tabarak'
        ? 'The grand coronation for mastering both Juz Amma & Tabarak'
        : user.track === 'juz_qad_samia'
        ? 'The grand coronation for completing Juz Qad Samia'
        : 'The grand coronation and noble badge for completing blessed Juz Amma')
    : (user.track === 'juz_amma_tabarak'
        ? 'التتويج الأكبر والحصول على الوسام الشريف لختم جزأي عم وتبارك'
        : user.track === 'juz_qad_samia'
        ? 'التتويج الأكبر والحصول على الوسام الشريف لختم جزء قد سمع المبارك'
        : 'التتويج الأكبر والحصول على الوسام الشريف لختم جزء عم المبارك');

  // Handle Joining a Circle by Code
  const handleJoinCircleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinLoading(true);
    setJoinFeedback(null);
    try {
      const res = await joinCircleAction(joinCodeInput.trim());
      setJoinFeedback(res);
      if (res.success) {
        setTimeout(() => {
          setShowJoinModal(false);
          setJoinCodeInput('');
        }, 1500);
      }
    } catch (err: any) {
      setJoinFeedback({ success: false, message: err.message || 'حدث خطأ أثناء الانضمام' });
    } finally {
      setJoinLoading(false);
    }
  };

  // Handle Leaving Current Circle
  const handleLeaveCircle = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مغادرة هذه الحلقة؟')) {
      await leaveCurrentCircle();
      setShowCircleDetailsModal(false);
    }
  };

  // Reversed weeks for climbing upwards from Week 1 (bottom) to Week 17 (top)
  const reversedWeeks = [...weeks].reverse();

  return (
    <div className="pb-32 pt-2 px-2 sm:px-4 max-w-md mx-auto space-y-3 font-arabic">
      
      {/* 1. Top Fixed/Floating Stats Bar */}
      <div className="sticky top-2 z-40 bg-white/95 backdrop-blur-md border-2 border-[#006304]/20 rounded-2xl p-2.5 shadow-md flex items-center justify-between gap-2">
        {/* Streak */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-black font-num text-amber-900">
            {user.streak} {language === 'en' ? (user.streak === 1 ? 'day' : 'days') : 'أيام'}
          </span>
        </div>

        {/* World Selector Badge */}
        <div className="bg-[#F0F9F0] border border-[#006304]/30 px-3 py-1 rounded-xl text-center">
          <span className="text-xs font-black text-[#006304] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#006304]" />
            <span>{language === 'en' ? (user.track === 'juz_amma_tabarak' ? 'Amma & Tabarak' : 'Juz Amma') : (user.track === 'juz_amma_tabarak' ? 'عم وتبارك' : 'جزء عم')}</span>
          </span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 bg-[#F0F9F0] border border-[#006304]/20 px-2.5 py-1 rounded-xl">
          <Zap className="w-4 h-4 text-[#006304] fill-[#006304]" />
          <span className="text-xs font-black font-num text-[#006304]">{user.xp} XP</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-black text-slate-700">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-num">{user.completedNodes.length}/{allNodesOrdered.length || (weeks.length * 5)}</span>
        </div>
      </div>

      {/* Student Quranic Circle Status Banner */}
      {!userCircle && !user.circleId ? (
        <div className="bg-gradient-to-r from-[#F0F9F0] to-emerald-50 border border-[#006304]/30 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006304] text-white flex items-center justify-center shadow-xs">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                {language === 'en' ? "Join Your Teacher's Quran Circle" : 'انضم إلى حلقة معلمك القرآنية'}
              </h4>
              <p className="text-[10px] text-gray-600 font-medium">
                {language === 'en' ? 'Enter circle code to submit recitations' : 'أدخل رمز الحلقة لمتابعة تلاوتك وتسميعك'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setJoinFeedback(null);
              setShowJoinModal(true);
            }}
            className="bg-[#006304] hover:bg-[#005103] text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            {language === 'en' ? 'Join Now' : 'انضمام الآن'}
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#006304]/25 rounded-2xl p-2.5 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F0F9F0] border border-[#006304] text-[#006304] flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-500">
                  {language === 'en' ? 'Circle:' : 'حلقتك:'}
                </span>
                <h4 className="text-xs font-black text-[#006304]">
                  {userCircle?.name || user.circleName || (language === 'en' ? 'Quran Circle' : 'حلقة القرآن الكريم')}
                </h4>
              </div>
              <p className="text-[10px] text-gray-600 font-medium">
                {language === 'en' ? 'Teacher:' : 'المعلم:'} {userCircle?.teacherName || user.teacherName || (language === 'en' ? 'Teacher' : 'الشيخ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCircleDetailsModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Circle Info' : 'تفاصيل الحلقة'}
          </button>
        </div>
      )}

      {/* 2. Worlds Switcher Drawer Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {trackTabs.map(tab => {
          const isSelected = selectedWorld === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedWorld(tab.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs cursor-pointer ${
                isSelected
                  ? 'bg-[#006304] text-white ring-2 ring-[#006304]/40'
                  : tab.locked
                  ? 'bg-white border border-slate-200 text-slate-400 opacity-80'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {renderWorldIcon(tab.id)}
              <span>{tab.title}</span>
              {tab.locked && <Lock className="w-3 h-3 text-slate-400" />}
            </button>
          );
        })}
      </div>

      {/* Selected World Locked Notice */}
      {selectedTab?.locked ? (
        <div className="bg-white border-2 border-[#C79545] rounded-3xl p-8 text-center space-y-4 my-8 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#FFF8E7] border border-[#F9BF3B] text-[#C79545] flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8 text-[#C79545]" />
          </div>
          <h3 className="font-heading font-black text-base text-slate-900">
            {selectedTab.title} {language === 'en' ? 'is Currently Locked' : 'مقفل حالياً'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto font-medium">
            "{selectedTab.description}"
          </p>
          <button
            onClick={() => setSelectedWorld(user.track || 'juz_amma')}
            className="bg-[#006304] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md hover:bg-[#005103] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {language === 'en'
                ? `Return to ${trackTabs[0]?.title || 'Current Track'}`
                : `العودة إلى مسار ${trackTabs[0]?.title || 'المسار الحالي'}`}
            </span>
          </button>
        </div>
      ) : (
        /* 3. Centered Vertical Adventure Map Canvas */
        <div className="relative bg-[#EAF3E7] border-2 border-[#006304]/20 rounded-3xl p-3 sm:p-5 shadow-inner overflow-hidden min-h-screen">
          
          {/* Subtle Canvas Background Pattern Grid */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#006304_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Peak Landmark: Golden Citadel for Track Completion */}
          <div className="relative z-20 mb-10 flex flex-col items-center text-center">
            <div className={`p-5 rounded-3xl border-4 transition-all max-w-[320px] shadow-xl text-center relative ${
              isFinalTrackMastered
                ? 'bg-gradient-to-b from-[#FFF8E7] to-amber-100 border-[#F9BF3B] ring-8 ring-[#F9BF3B]/20'
                : 'bg-white/95 border-amber-300/80'
            }`}>
              {/* Crown Emblem */}
              <div className="w-16 h-16 rounded-2xl bg-[#006304] border-2 border-[#F9BF3B] text-white flex items-center justify-center mx-auto shadow-md mb-2 relative">
                <Crown className="w-8 h-8 text-[#F9BF3B]" />
                {isFinalTrackMastered && (
                  <Sparkles className="w-5 h-5 text-[#F9BF3B] absolute -top-2 -right-2" />
                )}
              </div>

              <span className="inline-block bg-[#F9BF3B] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1">
                {language === 'en' ? 'Grand Summit' : 'القمة الختامية'}
              </span>

              <h3 className="font-heading font-black text-sm text-[#006304]">
                {trackMasteryName}
              </h3>
              
              <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                {trackMasteryDesc}
              </p>

              {isFinalTrackMastered ? (
                <div className="mt-3 space-y-2">
                  <div className="bg-[#006304] text-white p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-[#F9BF3B]" />
                    <span>
                      {user.track === 'juz_amma_tabarak'
                        ? (language === 'en' ? 'Completed Amma & Tabarak!' : 'مبارك! أتممت مسار عم وتبارك')
                        : user.track === 'juz_qad_samia'
                        ? (language === 'en' ? 'Completed Juz Qad Samia!' : 'مبارك! أتممت مسار جزء قد سمع')
                        : (language === 'en' ? 'Completed Juz Amma!' : 'مبارك! أتممت مسار جزء عم')}
                    </span>
                  </div>

                  {/* Contextual Next Track Transition Offer */}
                  {user.track === 'juz_amma_tabarak' ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 text-xs text-amber-950 space-y-1.5">
                      <p className="font-bold text-[11px]">
                        {language === 'en'
                          ? 'Would you like to advance to Juz Qad Samia track?'
                          : 'هل تود الانتقال إلى مسار جزء قد سمع؟'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTrack('juz_qad_samia')}
                        className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2 rounded-xl text-[11px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{language === 'en' ? 'Advance to Juz Qad Samia 🚀' : 'الانتقال إلى مسار جزء قد سمع 🚀'}</span>
                      </button>
                    </div>
                  ) : user.track === 'juz_qad_samia' ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 text-xs text-amber-950">
                      <p className="font-bold text-[11px] leading-relaxed">
                        {language === 'en'
                          ? 'Upcoming Quranic tracks are under development and will be available soon insha\'Allah.'
                          : 'المسارات القرآنية القادمة قيد التطوير وستكون متاحة قريباً بإذن الله ⏳'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 text-xs text-amber-950 space-y-1.5">
                      <p className="font-bold text-[11px]">
                        {language === 'en'
                          ? 'Would you like to advance to Amma & Tabarak track?'
                          : 'هل تود الانتقال إلى مسار عم وتبارك؟'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTrack('juz_amma_tabarak')}
                        className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2 rounded-xl text-[11px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{language === 'en' ? 'Advance to Amma & Tabarak 🚀' : 'الانتقال إلى مسار عم وتبارك 🚀'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-[10px] text-amber-900 font-bold bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-200/80 flex items-center justify-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {language === 'en'
                      ? `Requires completing all ${totalWeeksCount} weeks`
                      : `يتطلب إكمال جميع الأسابيع الـ ${totalWeeksCount}`}
                  </span>
                </div>
              )}
            </div>

            {/* Unlocked Next Realm Preview Banner */}
            <div className="mt-4 bg-white/90 border border-[#006304]/20 rounded-2xl p-3 max-w-[290px] text-center shadow-xs flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-[#006304] shrink-0" />
              <div>
                <span className="text-[#006304] block font-black text-xs">
                  {user.track === 'juz_amma_tabarak'
                    ? (language === 'en' ? 'Juz Qad Samia (Next Realm)' : 'مسار جزء قد سمع (الساحة التالية)')
                    : user.track === 'juz_qad_samia'
                    ? (language === 'en' ? 'Upcoming Tracks' : 'المسارات القرآنية القادمة')
                    : (language === 'en' ? 'Amma & Tabarak (Next Realm)' : 'مسار عم وتبارك (الساحة التالية)')}
                </span>
                <span className="text-slate-500 block text-[10px] font-medium mt-0.5">
                  {user.track === 'juz_qad_samia'
                    ? (language === 'en' ? 'In development - coming soon' : 'قيد التطوير وستتاح قريباً بإذن الله ⏳')
                    : (language === 'en' ? 'Unlocks upon completing the finale' : 'ستفتح تلقائياً فور اجتياز الختام')}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Render Weeks as Distinct Adventure Worlds (Climbing BOTTOM -> TOP) */}
          <div className="relative z-10 space-y-12">
              {reversedWeeks.map((week) => {
              const biomeZone = BIOME_ZONES.find(z => z.weeks.includes(week.id)) || BIOME_ZONES[0];
              const isWeekCompleted = user.completedWeeks.includes(week.id);
              const isWeekActive = user.currentWeek === week.id;

              const completedNodesInWeek = week.nodes.filter(n => user.completedNodes.includes(n.id)).length;
              const percentWeek = Math.round((completedNodesInWeek / week.nodes.length) * 100);

              // Reverse nodes so Gate is at the TOP of the week world and Node 1 is at the BOTTOM
              const nodesTopToBottom = [...week.nodes].reverse();

              // Calculate progression points (Lesson 1 at bottom -> Lesson 2 -> ... -> Gate at top)
              // This guarantees the path starts at the LOWEST / FIRST node and curves upward to the Gate
              const yTop = 8;
              const yBottom = 92;
              const totalNodesCount = nodesTopToBottom.length;

              const progressionPoints = week.nodes.map((n) => {
                const globalItem = allNodesOrdered.find(i => i.node.id === n.id);
                const globalIndex = globalItem ? globalItem.globalIndex : 0;
                const topToBottomIdx = nodesTopToBottom.findIndex(item => item.id === n.id);

                const y = totalNodesCount > 1
                  ? yTop + (topToBottomIdx / Math.max(1, totalNodesCount - 1)) * (yBottom - yTop)
                  : 50;
                const x = getHorizontalXPercentage(globalIndex);

                return { x, y, id: n.id };
              });

              // Generate organic winding SVG bezier curve path connecting nodes from bottom to top
              const generateWeekPathD = () => {
                if (progressionPoints.length === 0) return '';
                if (progressionPoints.length === 1) return `M ${progressionPoints[0].x} ${progressionPoints[0].y}`;

                let path = `M ${progressionPoints[0].x} ${progressionPoints[0].y}`;
                for (let i = 0; i < progressionPoints.length - 1; i++) {
                  const p1 = progressionPoints[i];
                  const p2 = progressionPoints[i + 1];
                  const cy = (p1.y + p2.y) / 2;
                  path += ` C ${p1.x} ${cy}, ${p2.x} ${cy}, ${p2.x} ${p2.y}`;
                }
                return path;
              };

              const pathD = generateWeekPathD();
              const midNodeIndex = Math.floor(nodesTopToBottom.length / 2);

              return (
                <div
                  key={week.id}
                  className={`relative rounded-3xl border-2 px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 transition-all shadow-sm overflow-visible ${
                    isWeekCompleted
                      ? 'bg-gradient-to-b from-[#F2F9F0] via-emerald-50/50 to-[#F2F9F0] border-emerald-600/30'
                      : isWeekActive
                      ? 'bg-gradient-to-b from-[#FFFDF7] via-[#F3F9F1] to-[#FFFDF7] border-[#F9BF3B] ring-2 ring-[#F9BF3B]/20'
                      : 'bg-gradient-to-b from-slate-50/90 via-slate-100/50 to-slate-50/90 border-slate-200/80'
                  }`}
                >
                  {/* Subtle Islamic Arch & Lattice Pattern Overlay Layer */}
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#006304_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
                  <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full border border-[#006304]/10 pointer-events-none" />
                  <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full border border-[#006304]/10 pointer-events-none" />

                  {/* 1. World Header Landmark Card (Top of Week Region) */}
                  <div className="relative z-[100] flex justify-center mb-6">
                    <div className={`px-4 py-4 rounded-2xl border-2 text-center transition-all max-w-[380px] sm:max-w-md w-full shadow-sm ${
                      isWeekCompleted
                        ? 'bg-white/95 border-[#006304] text-[#006304] shadow-xs'
                        : isWeekActive
                        ? 'bg-white border-[#F9BF3B] ring-2 ring-[#F9BF3B]/30 text-slate-900 shadow-md'
                        : 'bg-white/80 border-slate-300 text-slate-500 opacity-80 shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 text-right min-w-0">
                          <div className={`p-1.5 rounded-xl shrink-0 ${
                            isWeekCompleted ? 'bg-emerald-100 text-[#006304]' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {renderZoneIcon(biomeZone.id)}
                          </div>
                          <div className={`${language === 'en' ? 'text-left' : 'text-right'} min-w-0 py-0.5`}>
                            <span className="font-heading font-black text-xs sm:text-sm block leading-normal pt-0.5">
                              {language === 'en' ? t(week.title, 'en') : week.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold block leading-normal mt-0.5">
                              {language === 'en' ? t(biomeZone.name, 'en') : biomeZone.name}
                            </span>
                          </div>
                        </div>

                        {isWeekCompleted ? (
                          <span className="bg-[#F0F9F0] text-[#006304] border border-[#006304]/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" /> {language === 'en' ? 'Completed' : 'مكتمل'}
                          </span>
                        ) : isWeekActive ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <Compass className="w-3 h-3 text-amber-700" />
                            <span>{language === 'en' ? 'Current Zone' : 'المنطقة الحالية'}</span>
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3" /> {language === 'en' ? 'Locked' : 'مقفلة'}
                          </span>
                        )}
                      </div>

                      {/* Surahs Covered in Week - Full display on a dedicated line without truncation */}
                      <div className={`mt-3 pt-2.5 border-t border-slate-100 ${language === 'en' ? 'text-left' : 'text-right'} space-y-1.5`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-[#006304]" />
                            <span>{language === 'en' ? `Assigned Surahs (${week.surahs.length}):` : `السور المقررة (${week.surahs.length}):`}</span>
                          </span>
                          <span className="font-num text-[#006304] font-black text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            {percentWeek}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-800 font-extrabold leading-relaxed break-words whitespace-normal bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                          {week.surahs.map(s => (language === 'en' ? `Surah ${getSurahName(s, 'en')}` : `سورة ${s}`)).join(' • ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. World Nodes Corridor with Organic Connecting SVG Path */}
                  <div className="relative py-8 space-y-16 sm:space-y-20">
                    {/* Organic Winding Curved Trail SVG */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none z-0"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isWeekActive ? '#006304' : '#94a3b8'}
                        strokeWidth="2.5"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                        opacity={isWeekActive ? 0.28 : 0.15}
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {nodesTopToBottom.map((node, idx) => {
                      const globalItem = allNodesOrdered.find(i => i.node.id === node.id);
                      if (!globalItem) return null;

                      const isCurrent = node.id === activeNodeId;
                      const status = getNodeStatus(globalItem);
                      const isCompleted = status === 'COMPLETED';
                      const isPending = status === 'PENDING';
                      const isLocked = status === 'LOCKED';
                      const isAvailable = status === 'AVAILABLE';

                      const xPos = getHorizontalXPercentage(globalItem.globalIndex);

                      const isGate = node.type === 'gate';
                      const isRewardChest = node.type === 'reward';

                      const isRecentlyCompleted = recentlyCompletedNodeId === node.id;
                      const hasFloatingXp = floatingXpInfo?.nodeId === node.id;
                      const isShaking = shakingNodeId === node.id;
                      const isTooltipActive = lockedTooltipNodeId === node.id;

                      const showMidpointLandmark = idx === midNodeIndex && !isGate;

                      return (
                        <React.Fragment key={node.id}>
                          <div className="relative z-10 w-full min-h-[110px] flex items-center justify-center">
                            {/* Node Container along Winding Curve */}
                            <div
                              style={{ left: `${xPos}%` }}
                              className="absolute -translate-x-1/2 flex flex-col items-center z-10"
                            >
                              {/* Dedicated Node Button Anchor Wrapper: Exact dimensions of Node Button */}
                              <div
                                ref={isCurrent ? activeNodeRef : undefined}
                                className={`relative flex items-center justify-center ${
                                  isGate ? 'w-16 h-16' : 'w-14 h-14'
                                }`}
                              >
                                {/* Node Button */}
                                <motion.button
                                  animate={
                                    isShaking && !shouldReduceMotion
                                      ? { x: [-5, 5, -4, 4, -2, 2, 0], scale: 1 }
                                      : isRecentlyCompleted && !shouldReduceMotion
                                      ? { scale: [0.9, 1.12, 1], x: 0 }
                                      : { x: 0, scale: 1 }
                                  }
                                  whileTap={
                                    !isLocked
                                      ? { scale: 0.95 }
                                      : undefined
                                  }
                                  transition={
                                    isShaking
                                      ? { duration: 0.3, ease: 'easeInOut' }
                                      : isRecentlyCompleted
                                      ? { duration: 0.45, ease: 'easeOut' }
                                      : { duration: 0.2 }
                                  }
                                  onClick={() => {
                                    // إذا كان المستخدم معلم، يفتح الدرس للمعاينة والاطلاع بدون تسجيل إنجاز
                                    if (user.role === 'teacher') {
                                      if (isGate) {
                                        openWeekModal(week);
                                      } else if (node.type === 'listen') {
                                        openListeningTask(node, week);
                                      } else {
                                        startLesson(node, week);
                                      }
                                      return;
                                    }

                                    if (isLocked) {
                                      handleLockedNodeClick(node.id);
                                    } else {
                                      if (isRewardChest && !isCompleted) {
                                        setChestModalItem({ node, week, title: node.title, xp: node.xpReward + 10 });
                                      } else if (isGate) {
                                        if (isCompleted) {
                                          openWeekModal(week);
                                        } else {
                                          startLesson(node, week);
                                        }
                                      } else if (node.type === 'listen') {
                                        openListeningTask(node, week);
                                      } else if (node.type === 'recite' && user.role === 'student' && (!user.circleId || !user.teacherId) && !userCircle) {
                                        setShowNeedCircleAlert(true);
                                      } else {
                                        startLesson(node, week);
                                      }
                                    }
                                  }}
                                  className={`w-full h-full group transition-all duration-300 relative flex items-center justify-center ${
                                    isGate
                                      ? 'rounded-3xl bg-gradient-to-b from-[#FFF8E7] to-white text-[#006304] border-2 border-[#F9BF3B] shadow-md hover:scale-105 active:translate-y-0.5'
                                      : isCurrent
                                      ? 'rounded-2xl bg-[#006304] text-white border-2 border-[#F9BF3B] shadow-md shadow-[#006304]/30 active:translate-y-0.5'
                                      : isPending
                                      ? 'rounded-2xl bg-amber-500 text-white border-2 border-amber-300 shadow-md shadow-amber-500/20 hover:scale-105 active:translate-y-0.5'
                                      : isCompleted
                                      ? 'rounded-2xl bg-emerald-600 text-white border-2 border-emerald-700 shadow-sm hover:scale-105 active:translate-y-0.5'
                                      : isAvailable
                                      ? 'rounded-2xl bg-white text-[#006304] border-2 border-[#006304] shadow-sm hover:bg-emerald-50 active:translate-y-0.5'
                                      : 'rounded-2xl bg-slate-100/90 text-slate-400 border-2 border-slate-200 shadow-none'
                                  }`}
                                >
                                  {/* Icon inside Node */}
                                  <div className="flex items-center justify-center">
                                    {isPending ? (
                                      <Clock className="w-5 h-5 text-white animate-pulse" />
                                    ) : (
                                      renderNodeTypeIcon(node.type, status, isRewardChest)
                                    )}
                                  </div>

                                  {/* Completed Green Check Badge Overlay */}
                                  {isCompleted && (
                                    <motion.span
                                      initial={isRecentlyCompleted ? { scale: 0 } : false}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                      className="absolute -top-1 -right-1 bg-white text-emerald-700 p-0.5 rounded-full shadow-2xs border border-emerald-600 z-10"
                                    >
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </motion.span>
                                  )}

                                  {/* Pending Review Clock Badge Overlay */}
                                  {isPending && (
                                    <span className="absolute -top-1 -right-1 bg-amber-100 text-amber-800 p-0.5 rounded-full shadow-2xs border border-amber-400 z-10">
                                      <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                                    </span>
                                  )}

                                  {/* Floating XP Badge Tag */}
                                  {!isLocked && (
                                    <span
                                      className={`absolute -bottom-2.5 border text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs font-num z-20 ${
                                        isCurrent
                                          ? 'bg-[#F9BF3B] text-slate-900 border-white'
                                          : isPending
                                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                                          : isCompleted
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                          : 'bg-emerald-600 text-white border-white'
                                      }`}
                                    >
                                      {isPending ? (language === 'en' ? 'Under Review' : 'قيد المراجعة') : `+${node.xpReward}XP`}
                                    </span>
                                  )}
                                </motion.button>

                                {/* Floating Verified XP Popup */}
                                <AnimatePresence>
                                  {hasFloatingXp && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                      animate={{ opacity: [0, 1, 1, 0], y: -38, scale: [0.8, 1.1, 1, 0.95] }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 1.6, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
                                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 bg-[#006304] text-[#F9BF3B] border-2 border-[#F9BF3B] font-black px-3 py-1 rounded-full text-xs shadow-xl flex items-center gap-1 font-num pointer-events-none"
                                    >
                                      <Zap className="w-3.5 h-3.5 fill-[#F9BF3B]" />
                                      <span>+{floatingXpInfo.xp} XP</span>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Floating Tooltip for Locked Nodes */}
                                <AnimatePresence>
                                  {isTooltipActive && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                      animate={{ opacity: 1, y: -8, scale: 1 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      transition={{ duration: 0.2 }}
                                      className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap border border-slate-700 pointer-events-none"
                                    >
                                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span>{language === 'en' ? 'Complete previous milestone first' : 'أكمل المحطة السابقة أولاً'}</span>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Dedicated Node Text Area Card with Background Shield */}
                              <div className={`mt-3.5 px-3 py-1.5 rounded-xl border text-center max-w-[155px] w-max shadow-2xs backdrop-blur-xs transition-all z-10 ${
                                isGate
                                  ? 'bg-white/95 border-[#F9BF3B] ring-1 ring-[#F9BF3B]/30'
                                  : isCurrent
                                  ? 'bg-white border-[#F9BF3B] shadow-xs'
                                  : isPending
                                  ? 'bg-amber-50/95 border-amber-300 ring-1 ring-amber-300/40 shadow-xs'
                                  : isCompleted
                                  ? 'bg-white/95 border-emerald-600/20'
                                  : isAvailable
                                  ? 'bg-white/95 border-emerald-600/30'
                                  : 'bg-white/75 border-slate-200/80'
                              }`}>
                                <span className={`block text-[11px] leading-snug ${
                                  isGate
                                    ? 'text-[#006304] font-black text-xs'
                                    : isCurrent
                                    ? 'text-[#006304] font-black'
                                    : isPending
                                    ? 'text-amber-900 font-black'
                                    : isCompleted
                                    ? 'text-slate-800 font-bold'
                                    : isAvailable
                                    ? 'text-[#006304] font-bold'
                                    : 'text-slate-500 font-medium'
                                 }`}>
                                  {language === 'en' ? t(node.title, 'en') : node.title}
                                </span>
                                {isPending && (
                                  <span className="block text-[9px] text-amber-700 font-bold mt-0.5">
                                    {language === 'en' ? 'Pending Teacher Review' : 'بانتظار اعتماد المعلم'}
                                  </span>
                                )}
                                {isGate && (
                                  <span className="block text-[9px] text-[#C79545] font-bold mt-0.5">
                                    {language === 'en' ? 'Weekly Mastery Test' : 'اختبار إتقان الأسبوع'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 3. Midpoint Environmental Landmark */}
                          {showMidpointLandmark && (
                            <div className="relative z-10 flex justify-center my-8 py-1">
                              <div className="bg-white/85 backdrop-blur-xs border border-emerald-600/20 px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-2 text-[10px] text-[#006304] font-bold">
                                <Landmark className="w-3.5 h-3.5 text-[#C79545] shrink-0" />
                                <span>{language === 'en' ? 'Midpoint Landmark • Reflection Rest' : 'معلم منتصف المنطقة • استراحة السكينة والتدبر'}</span>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* 4. Start Area Entrance Landmark (Bottom of Week World) */}
                  <div className="relative z-10 mt-6 pt-3 border-t border-emerald-600/15 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-[11px] font-black text-[#006304] bg-white/90 border border-[#006304]/20 py-1.5 px-4 rounded-full shadow-2xs">
                      <Flag className="w-3.5 h-3.5 text-[#006304]" />
                      <span>{language === 'en' ? `Starting Zone • ${t(week.title, 'en')}` : `منطقة البداية • ${week.title}`}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Bottom Start Point (Week 1 Entry Flag) */}
          <div className="relative z-20 mt-12 mb-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#006304] text-white flex items-center justify-center shadow-md border-2 border-[#F9BF3B] mb-2">
              <Flag className="w-7 h-7 text-[#F9BF3B]" />
            </div>
            <h4 className="text-sm font-black text-[#006304]">
              {language === 'en' ? 'Start of Noble Ward Journey' : 'بداية رحلة ورد الشريفة'}
            </h4>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              {language === 'en' 
                ? (user.track === 'juz_amma_tabarak' ? 'Amma & Tabarak • Embark and ascend to the summit' : 'Juz Amma • Embark and ascend to the summit') 
                : (user.track === 'juz_amma_tabarak' ? 'عم وتبارك • انطلق واصعد نحو القمة' : 'جزء عم • انطلق واصعد نحو القمة')}
            </p>
          </div>

        </div>
      )}

      {/* Reward Chest Bonus Modal */}
      <AnimatePresence>
        {chestModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white border-2 border-[#F9BF3B] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setChestModalItem(null)}
                className="absolute top-3 left-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-[#FFF8E7] border-2 border-[#F9BF3B] text-amber-500 flex items-center justify-center mx-auto shadow-md">
                <Gift className="w-8 h-8 text-amber-500" />
              </div>

              <h3 className="font-heading font-black text-lg text-[#006304]">
                {language === 'en' ? 'Milestone Bonus Chest!' : 'صندوق مكافأة المحطة!'}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {language === 'en'
                  ? `Well done! You persevered in memorizing (${t(chestModalItem.title, 'en')}). Here is an encouragement gift for the journey!`
                  : `"أحسنت واصلت الحفظ والاجتهاد في درس (${chestModalItem.title}). إليك هدية تشجيعية للرحلة!"`}
              </p>

              <div className="bg-[#F0F9F0] border border-[#006304]/30 rounded-2xl p-3 flex items-center justify-center gap-2 text-[#006304] font-black text-sm">
                <Zap className="w-5 h-5 fill-[#006304]" />
                <span>+{chestModalItem.xp} {language === 'en' ? 'Bonus XP' : 'نقاط خبرة إضافية'}</span>
              </div>

              <button
                onClick={async () => {
                  if (chestModalItem?.node && chestModalItem?.week) {
                    await completeNode(chestModalItem.node.id, chestModalItem.week.id, chestModalItem.xp);
                  }
                  setChestModalItem(null);
                }}
                className="w-full bg-[#006304] text-white font-bold py-3 rounded-2xl text-xs shadow-md hover:bg-[#005103] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Claim & Continue Journey' : 'استلام وتكملة المسار'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Circle Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F0F9F0] border border-[#006304] text-[#006304] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-sm text-slate-900">
                  {language === 'en' ? 'Join a Quran Circle' : 'الانضمام إلى حلقة قرآنية'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinFeedback(null);
                }}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {language === 'en'
                ? 'Enter the circle code provided by your teacher (e.g., WRD-101) to join and follow memorization together.'
                : 'أدخل رمز الحلقة الذي حصلت عليه من معلمك (مثال: WRD-101) لتنضم للحلقة وتتابع الحفظ سوياً.'}
            </p>

            <form onSubmit={handleJoinCircleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {language === 'en' ? 'Circle Code:' : 'رمز الحلقة:'}
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value)}
                  placeholder="WRD-..."
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black text-slate-900 focus:border-[#006304] focus:outline-hidden font-num text-left dir-ltr uppercase"
                  required
                  autoFocus
                />
              </div>

              {joinFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    joinFeedback.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {joinFeedback.message}
                </div>
              )}

              <button
                type="submit"
                disabled={joinLoading}
                className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {joinLoading ? (
                  <span>{language === 'en' ? 'Verifying...' : 'جاري التحقق...'}</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{language === 'en' ? 'Confirm Circle Join' : 'تأكيد الانضمام للحلقة'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Circle Details Modal */}
      {showCircleDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-gray-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F0F9F0] border border-[#006304] text-[#006304] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-sm text-slate-900">
                  {language === 'en' ? 'Your Quran Circle Details' : 'تفاصيل حلقتك القرآنية'}
                </h3>
              </div>
              <button
                onClick={() => setShowCircleDetailsModal(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">{language === 'en' ? 'Circle Name:' : 'اسم الحلقة:'}</span>
                <span className="font-black text-[#006304]">{userCircle?.name || user.circleName || (language === 'en' ? 'Quran Circle' : 'حلقة القرآن')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">{language === 'en' ? 'Supervising Teacher:' : 'المعلم المشرف:'}</span>
                <span className="font-bold text-slate-900">{userCircle?.teacherName || user.teacherName || (language === 'en' ? 'Teacher' : 'الشيخ')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">{language === 'en' ? 'Circle Code:' : 'رمز الحلقة:'}</span>
                <span className="font-num font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 dir-ltr">
                  {userCircle?.code || 'WRD-101'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">{language === 'en' ? 'Students in Circle:' : 'عدد الزملاء في الحلقة:'}</span>
                <span className="font-num font-black text-slate-900">{circleStudents.length} {language === 'en' ? 'students' : 'طلاب'}</span>
              </div>
            </div>

            <button
              onClick={handleLeaveCircle}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 rounded-xl text-xs border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Leave This Circle' : 'مغادرة هذه الحلقة'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Need Circle Alert Modal for Recite Tasks */}
      {showNeedCircleAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border-2 border-amber-300 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold text-sm">
                  ⚠️
                </div>
                <h3 className="font-heading font-black text-sm text-slate-900">
                  {language === 'en' ? 'Quran Circle Required' : 'يلزم الانضمام إلى حلقة قرآنية'}
                </h3>
              </div>
              <button
                onClick={() => setShowNeedCircleAlert(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {language === 'en'
                ? 'Please join a circle first to submit recitations to a teacher. Go to your profile page to select a circle or enter your teacher code.'
                : 'يرجى الانضمام إلى حلقة أولاً لتتمكن من استخدام خاصية التسميع إلى معلم. انتقل إلى صفحة الحساب لاختيار حلقة تناسبك أو إدخال رمز معلمك.'}
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowNeedCircleAlert(false);
                  setActiveTab('profile');
                }}
                className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <Building className="w-4 h-4 text-[#F9BF3B]" />
                <span>{language === 'en' ? 'Go to Profile to Select Circle' : 'الانتقال إلى صفحة الحساب لاختيار حلقة'}</span>
              </button>

              <button
                onClick={() => {
                  setShowNeedCircleAlert(false);
                  setShowJoinModal(true);
                }}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Enter Quick Circle Code (WRD-...)' : 'إدخال رمز الحلقة السريع (WRD-...)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Selection Modal (Only shown if student hasn't chosen track yet) */}
      {showTrackModal && (
        <TrackSelectionModal
          isOpen={showTrackModal}
          currentTrack={user.track}
          forceChoice={true}
          onSelectTrack={async (newTrack) => {
            await setTrack(newTrack);
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(`ward_track_chosen_${user.id}`, 'true');
            }
            setShowTrackModal(false);
          }}
        />
      )}

    </div>
  );
};
