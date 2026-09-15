import { QuizQuestion, Week } from '../types';

export interface QuizResult {
  scorePercentage: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  xpEarned: number;
  message: string;
}

/**
 * Generates a dynamic set of questions for a specific week or for the Final Exam
 */
export function generateQuizForWeek(week: Week): QuizQuestion[] {
  // Check if this is the Grand Week 17 Final Exam
  if (week.id === 17) {
    return getFinalExamQuestions();
  }

  const surahs = week.surahs || [];
  const questions: QuizQuestion[] = [];

  // Question 1: Surah Order / Sequence (ترتيب السور)
  if (surahs.length >= 2) {
    const correctSeq = surahs.join(' ← ');
    const reversedSeq = [...surahs].reverse().join(' ← ');
    const shuffledSeq = [...surahs].sort(() => 0.5 - Math.random()).join(' ← ');

    const options = shuffleArray([correctSeq, reversedSeq, shuffledSeq, 'الفاتحة ← الناس']).slice(0, 4);
    // Ensure correctSeq is present
    if (!options.includes(correctSeq)) {
      options[0] = correctSeq;
    }

    questions.push({
      id: `q_w${week.id}_order`,
      type: 'order',
      question: `ما الترتيب الصحيح للسور المقررة في ${week.title}؟`,
      options: shuffleArray(options),
      correctAnswer: correctSeq,
      explanation: `الترتيب الصحيح حسب خطة ورد لهذا الأسبوع هو: ${correctSeq}.`,
    });
  }

  // Question 2: Surah Selection (اختيار السورة الصحيحة)
  if (surahs.length > 0) {
    const mainSurah = surahs[0];
    questions.push({
      id: `q_w${week.id}_select`,
      type: 'surah_select',
      question: `أي من السور التالية ضمن مقرر الحفظ في ${week.title}؟`,
      options: shuffleArray([mainSurah, 'سورة البقرة', 'سورة آل عمران', 'سورة الكهف']),
      correctAnswer: mainSurah,
      explanation: `سورة ${mainSurah} هي إحدى السور الرئيسية المقررة في هذا الأسبوع.`,
    });
  }

  // Question 3: Distinguish / Count (تمييز السورة المطلوبة)
  const countAnswer = `${surahs.length} ${surahs.length === 1 ? 'سورة واحدة' : 'سور'}`;
  questions.push({
    id: `q_w${week.id}_count`,
    type: 'distinguish',
    question: `كم عدد السور المقررة للحفظ والمراجعة في ${week.title}؟`,
    options: shuffleArray([
      countAnswer,
      '10 سور',
      '15 سورة',
      '20 سورة',
    ]),
    correctAnswer: countAnswer,
    explanation: `مقرر هذا الأسبوع يحتوي على ${surahs.length} ${surahs.length === 1 ? 'سورة' : 'سور'}.`,
  });

  // Question 4: Review / Values (أسئلة مراجعة وتثبيت)
  const reviewAnswer = 'الاستماع اليومي والتكرار المنتظم مع التسميع الذاتي';
  questions.push({
    id: `q_w${week.id}_review`,
    type: 'review',
    question: `ما الخطة الأمثل للنجاح في تثبيت مقرر ${week.title}؟`,
    options: shuffleArray([
      reviewAnswer,
      'الحفظ السريع في يوم واحد فقط دون مراجعة',
      'القراءة العابرة دون ضبط الأحكام',
      'تأجيل المراجعة إلى الشهر القادم',
    ]),
    correctAnswer: reviewAnswer,
    explanation: 'الاستمرار اليومي والتسميع الذاتي هما الركيزة الأساسية للإتقان.',
  });

  // Question 5: Additional contextual question if surahs has 2 or more
  if (surahs.length >= 2) {
    const secondSurah = surahs[1];
    questions.push({
      id: `q_w${week.id}_context`,
      type: 'mcq',
      question: `في ${week.title}، السورة التي تلي سورة ${surahs[0]} في المقرر هي:`,
      options: shuffleArray([secondSurah, 'سورة يس', 'سورة الفاتحة', 'سورة الرحمن']),
      correctAnswer: secondSurah,
      explanation: `سورة ${secondSurah} تأتي في تسلسل الحفظ بعد سورة ${surahs[0]}.`,
    });
  }

  return questions;
}

// Utility to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Questions for Week 17 Final Exam (جزء عم)
 */
function getFinalExamQuestions(): QuizQuestion[] {
  return [
    {
      id: 'fe_1',
      type: 'mcq',
      question: 'كم عدد سور جزء عم المبارك بالكامل في المصحف الشريف؟',
      options: ['37 سورة', '30 سورة', '40 سورة', '25 سورة'],
      correctAnswer: '37 سورة',
      explanation: 'يتكون جزء عم من 37 سورة مباركة تبدأ بسورة النبأ وتختم بسورة الناس.',
    },
    {
      id: 'fe_2',
      type: 'surah_select',
      question: 'ما أول سورة في ترتيب المصحف من جزء عم (الجزء الثلاثون)؟',
      options: ['سورة النبأ', 'سورة النازعات', 'سورة الفاتحة', 'سورة الملك'],
      correctAnswer: 'سورة النبأ',
      explanation: 'سورة النبأ هي السورة رقم 78 في المصحف وبداية جزء عم.',
    },
    {
      id: 'fe_3',
      type: 'surah_select',
      question: 'ما آخر سورة في ترتيب المصحف الشريف وخاتمة جزء عم؟',
      options: ['سورة الناس', 'سورة الفلق', 'سورة الإخلاص', 'سورة النصر'],
      correctAnswer: 'سورة الناس',
      explanation: 'سورة الناس هي السورة رقم 114 وخاتمة كتاب الله عز وجل.',
    },
    {
      id: 'fe_4',
      type: 'distinguish',
      question: 'أول ما نزل من القرآن الكريم على النبي ﷺ هي الآيات الأولى من سورة:',
      options: ['سورة العلق', 'سورة القدر', 'سورة المدثر', 'سورة المزمل'],
      correctAnswer: 'سورة العلق',
      explanation: 'نزلت أول خمس آيات من سورة العلق (اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ) في غار حراء.',
    },
    {
      id: 'fe_5',
      type: 'mcq',
      question: 'السورة التي تعدل ثلث القرآن الكريم في الأجر والفضل هي سورة:',
      options: ['سورة الإخلاص', 'سورة الفلق', 'سورة الكافرون', 'سورة الفاتحة'],
      correctAnswer: 'سورة الإخلاص',
      explanation: 'قال النبي ﷺ: (قل هو الله أحد تعدل ثلث القرآن).',
    },
    {
      id: 'fe_6',
      type: 'order',
      question: 'ما الترتيب الصحيح لخاتمة المصحف (التوحيد والمعوذتان)؟',
      options: [
        'الإخلاص ← الفلق ← الناس',
        'الناس ← الفلق ← الإخلاص',
        'الفلق ← الناس ← الإخلاص',
        'الإخلاص ← الناس ← الفلق',
      ],
      correctAnswer: 'الإخلاص ← الفلق ← الناس',
      explanation: 'ترتيب المصحف الشريف: سورة الإخلاص (112)، سورة الفلق (113)، سورة الناس (114).',
    },
    {
      id: 'fe_7',
      type: 'review',
      question: 'كم عدد أسابيع الرحلة التعليمية المنظمة لحفظ وتثبيت جزء عم في نادي ورد؟',
      options: ['17 أسبوعاً', '10 أسابيع', '20 أسبوعاً', '30 أسبوعاً'],
      correctAnswer: '17 أسبوعاً',
      explanation: 'تم تقسيم رحلة جزء عم إلى 17 أسبوعاً دراسياً متدرجاً ومنظماً.',
    },
  ];
}

/**
 * Calculates result, grade percentage, and encouragement text
 */
export function calculateQuizResult(
  questions: QuizQuestion[],
  userAnswers: Record<string, string | number>,
  passThresholdPercentage: number = 70
): QuizResult {
  let correctCount = 0;

  questions.forEach(q => {
    if (userAnswers[q.id] === q.correctAnswer) {
      correctCount++;
    }
  });

  const totalQuestions = questions.length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= passThresholdPercentage;

  let message = '';
  if (passed) {
    message = scorePercentage === 100
      ? 'ماشاء الله! إتقان تام ونتيجة كاملة 🌟'
      : 'أحسنت صنعاً! اجتزت الاختبار بنجاح مبارك 🌱';
  } else {
    message = 'اقتربت! راجع وردك وحاول مرة أخرى 🌱';
  }

  const xpEarned = passed ? Math.round(scorePercentage * 1.5) : 10;

  return {
    scorePercentage,
    totalQuestions,
    correctCount,
    passed,
    xpEarned,
    message,
  };
}
