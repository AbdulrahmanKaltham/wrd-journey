import { World, Week, Badge, CampDecoration, NodeItem } from '../types';

export const WORLDS_DATA: World[] = [
  {
    id: 'juz_amma',
    title: 'جزء عم',
    subtitle: 'رحلة الحفظ الأولى - ٣٧ سورة مباركة',
    description: 'رحلة متكاملة عبر ١٧ أسبوعاً دراسياً لحفظ وتثبيت جزء عم مع نادي ورد.',
    order: 1,
    locked: false,
    totalWeeks: 17,
    icon: '📖',
  },
  {
    id: 'juz_tabarak',
    title: 'جزء تبارك',
    subtitle: 'رحلة الارتقاء والتدبر',
    description: 'أكمل رحلة جزء عم لفتح رحلة جزء تبارك والانتقال للساحة التالية.',
    order: 2,
    locked: true,
    totalWeeks: 18,
    icon: '🔒',
  },
  {
    id: 'juz_qad_samia',
    title: 'جزء قد سمع',
    subtitle: 'رحلة التدبر والعمل',
    description: 'مرحلة متقدمة من رحلة تحفيظ القرآن الكريم مع نادي ورد.',
    order: 3,
    locked: true,
    totalWeeks: 18,
    icon: '🔒',
  },
];

// Helper generator for week nodes
function generateWeekNodes(weekNum: number, surahs: string[]): NodeItem[] {
  const nodes: NodeItem[] = [];
  const surahListText = surahs.join('، ');
  const surahText = surahs.join(' و ');

  // Node 1: Listen (استماع) - Clean title, full surahs list in surahsList and description
  nodes.push({
    id: `w${weekNum}_node_1`,
    weekId: weekNum,
    order: 1,
    type: 'listen',
    title: 'استماع وترتيل',
    surahName: surahListText,
    surahsList: [...surahs],
    audioFiles: surahs.map(s => ({
      surah: s,
      url: `https://example.com/audio/${s}.mp3`,
    })),
    description: `استمع بإنصات إلى تلاوة خاشعة لجميع سور الأسبوع المقررة (${surahListText}) لضبط النطق والأحكام.`,
    xpReward: 15,
    required: true,
    audioSample: 'https://example.com/audio.mp3',
  });

  // Node 2: Memorize (حفظ) - Clean title, full surahs in description
  nodes.push({
    id: `w${weekNum}_node_2`,
    weekId: weekNum,
    order: 2,
    type: 'memorize',
    title: 'تكرار وحفظ',
    surahName: surahListText,
    description: `احفظ المقاطع والسور المقررة لهذا الأسبوع (${surahListText}) مع تكرار الآيات بتأنٍّ وتدبر.`,
    xpReward: 20,
    required: true,
  });

  // Node 3: Recite (تسميع) - Clean title, full surahs in description
  nodes.push({
    id: `w${weekNum}_node_3`,
    weekId: weekNum,
    order: 3,
    type: 'recite',
    title: 'تسميع واعتماد',
    surahName: surahListText,
    description: `سجّل تلاوتك لجميع سور الأسبوع (${surahListText}) أو قم بالتسميع في الحلقة للتأكد من سلاسة الحفظ وضبط الآيات.`,
    xpReward: 25,
    required: true,
  });

  // Node 4: Self Review (مراجعة وتثبيت)
  nodes.push({
    id: `w${weekNum}_node_4`,
    weekId: weekNum,
    order: 4,
    type: 'review',
    title: 'مراجعة وتثبيت',
    surahName: surahListText,
    description: `مراجعة ذاتية وتمكين شامل لجميع سور الأسبوع المقررة (${surahListText}) لتثبيت الحفظ والتمكين قبل اختبار البوابة.`,
    xpReward: 30,
    required: true,
  });

  // Node 5: Week Gate (بوابة الأسبوع - خيارات موزعة عشوائياً)
  const gateQ1Correct = `${surahs.length} سور`;
  const gateQ1Options = shuffleOptions([gateQ1Correct, '10 سور', '1 سورة', '20 سورة']);

  const gateQ2Correct = 'البركة والثبات والأجر العظيم';
  const gateQ2Options = shuffleOptions([gateQ2Correct, 'السرعة فقط', 'التنافس المادي', 'لا شيء']);

  nodes.push({
    id: `w${weekNum}_gate`,
    weekId: weekNum,
    order: 5,
    type: 'gate',
    title: weekNum === 17 ? '🏆 قلعة الاختبار النهائي لجزء عم' : `🏆 بوابة الأسبوع ${weekNum}`,
    surahName: surahListText,
    description: weekNum === 17 
      ? 'الاختبار الختامي الشامل لإتقان جزء عم واجتياز المرحلة الكاملة!'
      : `اختبار التثبيت والعبور للأسابيع التالية (${surahText}).`,
    xpReward: weekNum === 17 ? 250 : 100,
    required: true,
    questions: [
      {
        id: `g_${weekNum}_1`,
        type: 'mcq',
        question: `كم عدد السور المقررة في هذا الأسبوع (${surahText})؟`,
        options: gateQ1Options,
        correctAnswer: gateQ1Correct,
        explanation: `الأسبوع يحتوي على ${surahs.length} سور حسب خطة نادي ورد.`,
      },
      {
        id: `g_${weekNum}_2`,
        type: 'mcq',
        question: `ما القيمة الأساسية التي نكتسبها من استمرارية ورد القرآن اليومي؟`,
        options: gateQ2Options,
        correctAnswer: gateQ2Correct,
        explanation: 'الاستمرارية والالتزام اليومي هما روح رحلة ورد.',
      },
    ],
  });

  return nodes;
}

// Utility to shuffle options without altering correctAnswer identity
function shuffleOptions<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const WEEKS_DATA: Week[] = [
  {
    id: 1,
    worldId: 'juz_amma',
    weekNumber: 1,
    title: 'الأسبوع الأول',
    startDate: '30/8',
    endDate: '5/9',
    surahs: ['الناس', 'الفلق', 'الإخلاص', 'المسد', 'النصر', 'الكافرون'],
    status: 'IN_PROGRESS',
    xpReward: 100,
    nodes: generateWeekNodes(1, ['الناس', 'الفلق', 'الإخلاص', 'المسد', 'النصر', 'الكافرون']),
  },
  {
    id: 2,
    worldId: 'juz_amma',
    weekNumber: 2,
    title: 'الأسبوع الثاني',
    startDate: '6/9',
    endDate: '12/9',
    surahs: ['الكوثر', 'الماعون', 'قريش', 'الفيل', 'الهمزة', 'العصر'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(2, ['الكوثر', 'الماعون', 'قريش', 'الفيل', 'الهمزة', 'العصر']),
  },
  {
    id: 3,
    worldId: 'juz_amma',
    weekNumber: 3,
    title: 'الأسبوع الثالث',
    startDate: '13/9',
    endDate: '19/9',
    surahs: ['التكاثر', 'القارعة', 'العاديات', 'الزلزلة'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(3, ['التكاثر', 'القارعة', 'العاديات', 'الزلزلة']),
  },
  {
    id: 4,
    worldId: 'juz_amma',
    weekNumber: 4,
    title: 'الأسبوع الرابع',
    startDate: '20/9',
    endDate: '26/9',
    surahs: ['البينة', 'القدر', 'العلق', 'التين'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(4, ['البينة', 'القدر', 'العلق', 'التين']),
  },
  {
    id: 5,
    worldId: 'juz_amma',
    weekNumber: 5,
    title: 'الأسبوع الخامس',
    startDate: '27/9',
    endDate: '3/10',
    surahs: ['الشرح', 'الضحى', 'الليل'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(5, ['الشرح', 'الضحى', 'الليل']),
  },
  {
    id: 6,
    worldId: 'juz_amma',
    weekNumber: 6,
    title: 'الأسبوع السادس',
    startDate: '4/10',
    endDate: '10/10',
    surahs: ['الشمس', 'البلد'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(6, ['الشمس', 'البلد']),
  },
  {
    id: 7,
    worldId: 'juz_amma',
    weekNumber: 7,
    title: 'الأسبوع السابع',
    startDate: '11/10',
    endDate: '17/10',
    surahs: ['الفجر', 'الغاشية'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(7, ['الفجر', 'الغاشية']),
  },
  {
    id: 8,
    worldId: 'juz_amma',
    weekNumber: 8,
    title: 'الأسبوع الثامن',
    startDate: '18/10',
    endDate: '24/10',
    surahs: ['الأعلى', 'الطارق'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(8, ['الأعلى', 'الطارق']),
  },
  {
    id: 9,
    worldId: 'juz_amma',
    weekNumber: 9,
    title: 'الأسبوع التاسع',
    startDate: '25/10',
    endDate: '31/10',
    surahs: ['البروج', 'الانشقاق'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(9, ['البروج', 'الانشقاق']),
  },
  {
    id: 10,
    worldId: 'juz_amma',
    weekNumber: 10,
    title: 'الأسبوع العاشر',
    startDate: '1/11',
    endDate: '7/11',
    surahs: ['المطففين'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(10, ['المطففين']),
  },
  {
    id: 11,
    worldId: 'juz_amma',
    weekNumber: 11,
    title: 'الأسبوع الحادي عشر',
    startDate: '8/11',
    endDate: '14/11',
    surahs: ['الانفطار', 'التكوير'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(11, ['الانفطار', 'التكوير']),
  },
  {
    id: 12,
    worldId: 'juz_amma',
    weekNumber: 12,
    title: 'الأسبوع الثاني عشر',
    startDate: '15/11',
    endDate: '21/11',
    surahs: ['عبس', 'النازعات'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(12, ['عبس', 'النازعات']),
  },
  {
    id: 13,
    worldId: 'juz_amma',
    weekNumber: 13,
    title: 'الأسبوع الثالث عشر',
    startDate: '22/11',
    endDate: '28/11',
    surahs: ['النبأ'],
    status: 'LOCKED',
    xpReward: 100,
    nodes: generateWeekNodes(13, ['النبأ']),
  },
  {
    id: 14,
    worldId: 'juz_amma',
    weekNumber: 14,
    title: 'الأسبوع الرابع عشر',
    startDate: '29/11',
    endDate: '5/12',
    surahs: ['مراجعة 1 (الناس إلى الزلزلة)'],
    status: 'LOCKED',
    xpReward: 120,
    nodes: generateWeekNodes(14, ['مراجعة 1']),
  },
  {
    id: 15,
    worldId: 'juz_amma',
    weekNumber: 15,
    title: 'الأسبوع الخامس عشر',
    startDate: '6/12',
    endDate: '12/12',
    surahs: ['مراجعة 2 (البينة إلى الليل)'],
    status: 'LOCKED',
    xpReward: 120,
    nodes: generateWeekNodes(15, ['مراجعة 2']),
  },
  {
    id: 16,
    worldId: 'juz_amma',
    weekNumber: 16,
    title: 'الأسبوع السادس عشر',
    startDate: '13/12',
    endDate: '19/12',
    surahs: ['تثبيت ومراجعة شاملة'],
    status: 'LOCKED',
    xpReward: 150,
    nodes: generateWeekNodes(16, ['تثبيت ومراجعة']),
  },
  {
    id: 17,
    worldId: 'juz_amma',
    weekNumber: 17,
    title: 'الأسبوع السابع عشر',
    startDate: '20/12',
    endDate: '26/12',
    surahs: ['الاختبار الختامي الشامل لجزء عم'],
    status: 'LOCKED',
    xpReward: 300,
    nodes: generateWeekNodes(17, ['الاختبار الختامي']),
  },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_step',
    title: '🌱 أول خطوة',
    description: 'أكملت أول يوم وأول درس في رحلة ورد.',
    icon: '🌱',
    unlocked: false,
    category: 'first_step',
  },
  {
    id: 'streak_7',
    title: '🔥 أسبوع ثابت',
    description: 'حافظت على وردك اليومي لمدة 7 أيام متتالية.',
    icon: '🔥',
    unlocked: false,
    category: 'streak',
  },
  {
    id: 'week_1_done',
    title: '🌿 أول منطقة',
    description: 'أتممت متطلبات الأسبوع الأول بنجاح.',
    icon: '🌿',
    unlocked: false,
    category: 'completion',
  },
  {
    id: 'streak_30',
    title: '🏕️ مستمر ومثابر',
    description: 'حافظت على الورد اليومي لمدة 30 يوماً.',
    icon: '🏕️',
    unlocked: false,
    category: 'streak',
  },
  {
    id: 'juz_amma_master',
    title: '🏆 إتقان جزء عم',
    description: 'اجتزت الاختبار النهائي الشامل لحفظ جزء عم بنجاح!',
    icon: '🏆',
    unlocked: false,
    category: 'mastery',
  },
];

export const INITIAL_DECORATIONS: CampDecoration[] = [
  {
    id: 'tent_ward',
    title: 'خيمة ورد الأصيلة',
    category: 'tents',
    icon: '🎪',
    costXp: 0,
    unlocked: true,
    placed: true,
    x: 50,
    y: 50,
  },
  {
    id: 'olive_tree',
    title: 'شجرة زيتون مباركة',
    category: 'nature',
    icon: '🌳',
    costXp: 50,
    unlocked: false,
    placed: false,
  },
  {
    id: 'andulasian_lamp',
    title: 'مصباح أنور أندلسي',
    category: 'furniture',
    icon: '🪔',
    costXp: 80,
    unlocked: false,
    placed: false,
  },
  {
    id: 'arabic_seating',
    title: 'جلسة عربية دافئة',
    category: 'furniture',
    icon: '🛋️',
    costXp: 120,
    unlocked: false,
    placed: false,
  },
  {
    id: 'bamboo_mushaf',
    title: 'حامل مصحف من الخيزران',
    category: 'quran',
    icon: '📖',
    costXp: 150,
    unlocked: false,
    placed: false,
  },
  {
    id: 'ward_fountain',
    title: 'نافورة ورد الهادئة',
    category: 'nature',
    icon: '⛲',
    costXp: 200,
    unlocked: false,
    placed: false,
  },
];
