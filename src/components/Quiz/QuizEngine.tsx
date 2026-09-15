import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QuizQuestion, Week } from '../../types';
import { generateQuizForWeek, calculateQuizResult, QuizResult } from '../../services/quizService';
import { CheckCircle2, XCircle, Trophy, Sparkles, RotateCcw, ArrowLeft, ShieldCheck, HelpCircle, Award, Compass } from 'lucide-react';

interface QuizEngineProps {
  week: Week;
  isFinalExam?: boolean;
  onPass: (xpEarned: number) => void;
  onClose: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  week,
  isFinalExam = week.id === 17,
  onPass,
  onClose,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [isQuestionSubmitted, setIsQuestionSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Initialize questions on load
  useEffect(() => {
    const generated = generateQuizForWeek(week);
    setQuestions(generated);
  }, [week]);

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-bold text-sm">
        جاري إعداد أسئلة الاختبار...
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const passThreshold = isFinalExam ? 80 : 70;

  const handleSelectAnswer = (option: string | number) => {
    if (isQuestionSubmitted) return;
    setSelectedAnswer(option);
  };

  const handleSubmitQuestion = () => {
    if (selectedAnswer === null) return;
    setIsQuestionSubmitted(true);
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: selectedAnswer }));
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsQuestionSubmitted(false);
    } else {
      // Finish Quiz
      const result = calculateQuizResult(questions, userAnswers, passThreshold);
      setQuizResult(result);
      setQuizFinished(true);

      if (result.passed) {
        confetti({
          particleCount: isFinalExam ? 120 : 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setUserAnswers({});
    setIsQuestionSubmitted(false);
    setQuizFinished(false);
    setQuizResult(null);
  };

  // ----------------------------------------------------
  // RESULT VIEW (PASS / RETRY)
  // ----------------------------------------------------
  if (quizFinished && quizResult) {
    return (
      <div className={`p-5 rounded-3xl space-y-5 text-center transition-all ${
        isFinalExam
          ? 'bg-[#FFF8E7] border-4 border-[#F9BF3B] ring-4 ring-[#F9BF3B]/20 shadow-xl'
          : 'bg-white border-2 border-[#E0E0E0] shadow-md'
      }`}>
        {/* Header Icon */}
        <div className="relative inline-block my-2">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-md ${
            quizResult.passed
              ? 'bg-[#006304] text-white border-4 border-[#F9BF3B]'
              : 'bg-amber-100 text-amber-700 border-4 border-amber-300'
          }`}>
            {quizResult.passed ? (isFinalExam ? '🏰' : '🏆') : '🌱'}
          </div>
          {quizResult.passed && (
            <span className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</span>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="font-heading font-black text-xl text-slate-900">
            {quizResult.passed
              ? isFinalExam
                ? 'مبارك! تم اجتياز الاختبار الختامي الشامل 🎉'
                : 'أحسنت! تم اجتياز بوابة الاختبار بنجاح 🌿'
              : 'محاولة مباركة!'}
          </h3>
          <p className="text-xs text-gray-600 font-medium max-w-xs mx-auto">
            {quizResult.message}
          </p>
        </div>

        {/* Score Display Card */}
        <div className={`p-4 rounded-2xl border-2 space-y-2 ${
          quizResult.passed
            ? 'bg-[#F0F9F0] border-[#006304]/30 text-[#006304]'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center justify-around font-num">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block">درجة الاختبار</span>
              <span className="font-black text-2xl font-num">
                {quizResult.scorePercentage}%
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-500 font-bold block">الإجابات الصحيحة</span>
              <span className="font-bold text-sm font-num">
                {quizResult.correctCount} / {quizResult.totalQuestions}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-500 font-bold block">نقاط المكتسبة</span>
              <span className="font-bold text-sm font-num">
                +{quizResult.xpEarned} XP
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {quizResult.passed ? (
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onPass(quizResult.xpEarned)}
              className="w-full bg-[#006304] hover:bg-[#005103] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#006304]/30 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-[#F9BF3B]" />
              <span>تسجيل النتيجة وفتح المرحلة التالية</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <button
              onClick={handleRetry}
              className="w-full bg-[#006304] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:bg-[#005103] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4 text-[#F9BF3B]" />
              <span>إعادة المحاولة الآن</span>
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-gray-200 transition-colors"
            >
              العودة للورد ومراجعة الآيات
            </button>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // QUESTION IN-PROGRESS VIEW
  // ----------------------------------------------------
  return (
    <div className={`p-4 rounded-3xl space-y-4 ${
      isFinalExam
        ? 'bg-[#FFF8E7] border-3 border-[#F9BF3B] ring-2 ring-[#F9BF3B]/30'
        : 'bg-white border-2 border-[#E0E0E0]'
    }`}>
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
            isFinalExam ? 'bg-[#F9BF3B] text-slate-900' : 'bg-[#006304] text-white'
          }`}>
            {isFinalExam ? '🏰' : '🏆'}
          </div>
          <div>
            <h4 className="font-heading font-black text-xs text-slate-900">
              {isFinalExam ? 'الاختبار الختامي الشامل (جزء عم)' : `اختبار تثبيت ${week.title}`}
            </h4>
            <span className="text-[10px] text-gray-500 font-medium">
              الحد الأدنى للنجاح: {passThreshold}%
            </span>
          </div>
        </div>

        <div className="bg-gray-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-600 font-num">
          {currentIdx + 1} / {questions.length}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#006304] h-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-start gap-2">
          <span className="bg-[#F0F9F0] text-[#006304] text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 shrink-0">
            {currentQ.type === 'order'
              ? 'ترتيب السور'
              : currentQ.type === 'surah_select'
              ? 'اختيار السورة'
              : currentQ.type === 'distinguish'
              ? 'تمييز السورة'
              : 'سؤال تثبيت'}
          </span>
          <h4 className="font-heading font-bold text-sm text-slate-900 leading-relaxed">
            {currentQ.question}
          </h4>
        </div>

        {/* Options */}
        <div className="space-y-2 pt-1">
          {currentQ.options?.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentQ.correctAnswer;

            let btnStyle = "bg-gray-50 border-gray-200 text-gray-800 hover:border-[#006304] hover:bg-white";
            if (isQuestionSubmitted) {
              if (isCorrect) {
                btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
              } else if (isSelected && !isCorrect) {
                btnStyle = "bg-rose-100 border-rose-400 text-rose-900 font-bold";
              }
            } else if (isSelected) {
              btnStyle = "bg-[#F0F9F0] border-[#006304] text-[#006304] font-bold ring-2 ring-[#006304]/20";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(opt)}
                disabled={isQuestionSubmitted}
                className={`w-full text-right p-3 rounded-xl border-2 text-xs transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span className="leading-normal">{opt}</span>
                {isQuestionSubmitted && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mr-2" />
                )}
                {isQuestionSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mr-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Banner when submitted */}
        {isQuestionSubmitted && currentQ.explanation && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed font-medium mt-3 flex items-start gap-1.5">
            <span className="text-base shrink-0">💡</span>
            <span>{currentQ.explanation}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div>
        {!isQuestionSubmitted ? (
          <button
            onClick={handleSubmitQuestion}
            disabled={selectedAnswer === null}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all ${
              selectedAnswer !== null
                ? 'bg-[#006304] text-white shadow-md hover:bg-[#005103] active:scale-98'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            تحقق من الإجابة
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-[#006304] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#005103] transition-all text-xs flex items-center justify-center gap-1.5 active:scale-98"
          >
            <span>{currentIdx < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة النهائية'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
