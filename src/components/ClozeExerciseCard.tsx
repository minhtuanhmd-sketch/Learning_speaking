import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { SentenceVariation } from '../types/sla';
import { validateClozeInput } from '../utils/phoneticScoring';

interface ClozeExerciseCardProps {
  variation: SentenceVariation;
  isUnlocked: boolean;
  onUnlockSuccess: (attempts: number) => void;
  onProceedToSpeaking?: () => void;
}

export const ClozeExerciseCard: React.FC<ClozeExerciseCardProps> = ({
  variation,
  isUnlocked,
  onUnlockSuccess,
  onProceedToSpeaking,
}) => {
  const [inputValue, setInputValue] = useState(isUnlocked ? variation.targetWord : '');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'success' | 'near_miss' | 'error';
    message: string;
  }>({
    type: isUnlocked ? 'success' : 'idle',
    message: isUnlocked
      ? 'Đã mở khóa! Bạn đã hoàn thành bước Truy xuất Từ vựng Ngữ cảnh (Contextual Cloze). Hãy nhấn nút bên dưới để chuyển sang bước Luyện nói.'
      : '',
  });

  // Reset local state when variation changes
  useEffect(() => {
    setInputValue(isUnlocked ? variation.targetWord : '');
    setAttempts(0);
    setFeedback({
      type: isUnlocked ? 'success' : 'idle',
      message: isUnlocked
        ? 'Đã mở khóa! Bạn đã hoàn thành bước Truy xuất Từ vựng Ngữ cảnh (Contextual Cloze).'
        : '',
    });
  }, [variation.id, isUnlocked, variation.targetWord]);

  // Deterministic shuffled choices (targetWord + 3 distractors)
  const wordBankChoices = useMemo(() => {
    const all = [variation.targetWord, ...variation.distractors];
    return all.sort((a, b) => a.localeCompare(b));
  }, [variation.targetWord, variation.distractors]);

  const templateParts = useMemo(() => {
    const parts = variation.clozeTemplate.split('___');
    return {
      prefix: parts[0] || '',
      suffix: parts[1] || '',
    };
  }, [variation.clozeTemplate]);

  // Dynamically expand input width so long words are never clipped
  const inputMinWidthCh = useMemo(() => {
    const activeLen = Math.max(
      variation.targetWord.length,
      inputValue.length,
      12
    );
    return `${activeLen + 5}ch`;
  }, [variation.targetWord.length, inputValue.length]);

  const handleVerify = (candidateValue?: string) => {
    const valToCheck = candidateValue !== undefined ? candidateValue : inputValue;
    if (candidateValue !== undefined) {
      setInputValue(candidateValue);
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const validation = validateClozeInput(valToCheck, variation.targetWord);

    if (validation.isCorrect) {
      setFeedback({
        type: 'success',
        message: validation.feedbackVi,
      });
      onUnlockSuccess(nextAttempts);
    } else if (validation.isMorphologicalNearMiss) {
      setFeedback({
        type: 'near_miss',
        message: validation.feedbackVi,
      });
    } else {
      setFeedback({
        type: 'error',
        message: validation.feedbackVi,
      });
    }
  };

  const handleRevealAnswer = () => {
    setInputValue(variation.targetWord);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setFeedback({
      type: 'success',
      message: `Đã điền từ chuẩn "${variation.targetWord}" (${variation.ipa}). Hãy đọc kỹ nghĩa ngữ cảnh và chuyển sang bước Luyện nói.`,
    });
    onUnlockSuccess(nextAttempts);
  };

  return (
    <section
      aria-labelledby="cloze-stage-heading"
      className="p-4 sm:p-6 material-regular rounded-3xl transition-colors"
    >
      {/* Clean Unboxed Metadata Header (Vibrancy hierarchy) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold vibrancy-label tracking-tight">
            01. Điền Từ Ngữ Cảnh (Cloze)
          </span>
          <span className="vibrancy-tertiary" aria-hidden="true">·</span>
          <span className="vibrancy-secondary truncate max-w-[220px] sm:max-w-none">
            {variation.pragmaticContext}
          </span>
        </div>

        {isUnlocked && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Đã mở khóa</span>
          </span>
        )}
      </div>

      <h3 id="cloze-stage-heading" className="sr-only">
        Bài tập điền từ vào chỗ trống
      </h3>

      {/* Interactive Cloze Sentence Display — Standard Thin Material */}
      <div className="p-4 sm:p-5 rounded-2xl material-thin mb-3.5">
        <div className="text-base sm:text-lg md:text-xl font-semibold vibrancy-label leading-relaxed break-words">
          <span>{templateParts.prefix}</span>
          <span className="inline-block mx-1.5 my-0.5 align-baseline max-w-full">
            <label htmlFor="cloze-word-input" className="sr-only">
              Từ vựng cần điền
            </label>
            <input
              id="cloze-word-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerify();
                }
              }}
              style={{ minWidth: inputMinWidthCh }}
              placeholder="nhập từ..."
              aria-label="Nhập từ vựng cần điền vào chỗ trống"
              className={`px-3 py-1 text-base font-semibold text-center rounded-xl material-thick transition-all focus:outline-none ${
                isUnlocked
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : feedback.type === 'error'
                  ? 'bg-rose-500/15 border-rose-500/60 text-rose-600 dark:text-rose-300 ring-2 ring-rose-500/20'
                  : feedback.type === 'near_miss'
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-600 dark:text-amber-300 ring-2 ring-amber-500/20'
                  : 'text-[#0284C7] dark:text-sky-300 focus:border-[#0284C7] dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
              }`}
            />
          </span>
          <span>{templateParts.suffix}</span>
        </div>

        {/* Full sentence preview & Vietnamese translation with Secondary Vibrancy */}
        <div className="mt-2.5 pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] text-xs sm:text-sm font-medium text-[#0284C7] dark:text-sky-300 leading-snug">
          “{variation.vietnameseTranslation}”
        </div>
      </div>

      {/* Lexical Clue Box: Vietnamese Hint · POS · IPA */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl material-thin mb-3.5">
        <div>
          <div className="text-[11px] font-medium vibrancy-secondary">
            Gợi ý nghĩa
          </div>
          <div className="text-xs font-semibold vibrancy-label leading-snug mt-0.5">
            {variation.vietnameseHint}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium vibrancy-secondary">
            Từ loại
          </div>
          <div className="text-xs font-semibold vibrancy-label mt-0.5">
            {variation.partOfSpeech}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium vibrancy-secondary">
            Phiên âm IPA
          </div>
          <div className="text-xs font-ipa font-semibold text-[#0284C7] dark:text-sky-400 mt-0.5">
            {variation.ipa}
          </div>
        </div>
      </div>

      {/* Quick Word Bank Selection (Scaffolding for A2-B2) + Verify Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium vibrancy-secondary mb-2">
            Chọn nhanh từ ngân hàng từ vựng (hoặc tự gõ vào ô trống):
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {wordBankChoices.map((choice) => {
              const isSelected = inputValue.trim().toLowerCase() === choice.toLowerCase();
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleVerify(choice)}
                  className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-2xl transition-all whitespace-nowrap shrink-0 haptic-press ${
                    isSelected && isUnlocked
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isSelected
                      ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-xs'
                      : 'material-thin vibrancy-label hover:opacity-90'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isUnlocked && (
            <button
              type="button"
              onClick={handleRevealAnswer}
              className="px-3.5 py-2 text-xs font-semibold material-thin vibrancy-label rounded-2xl hover:opacity-90 transition-all whitespace-nowrap shrink-0 haptic-press"
            >
              Hiện Đáp Án
            </button>
          )}
          <button
            type="button"
            onClick={() => handleVerify()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-2xl hover:bg-[#0369A1] dark:hover:bg-sky-500 transition-all whitespace-nowrap shrink-0 haptic-press shadow-xs"
          >
            <span>Kiểm Tra Từ Vựng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onProceedToSpeaking && (
            <button
              type="button"
              onClick={onProceedToSpeaking}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl transition-all whitespace-nowrap shrink-0 haptic-press ${
                isUnlocked
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <span>🎙️ Sang Bước 2: Luyện Nói</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Diagnostic Feedback Banner */}
      {feedback.type !== 'idle' && (
        <div
          role="status"
          className={`mt-3.5 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-200'
              : feedback.type === 'near_miss'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-200'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : feedback.type === 'near_miss' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold">
                {feedback.type === 'success'
                  ? '● ĐẠT CHUẨN TỪ VỰNG: '
                  : feedback.type === 'near_miss'
                  ? '▲ LƯU Ý HÌNH THÁI TỪ (MORPHOLOGY): '
                  : '✕ CẦN THỬ LẠI: '}
              </span>
              <span>{feedback.message}</span>
            </div>
          </div>

          {feedback.type === 'success' && onProceedToSpeaking && (
            <button
              type="button"
              onClick={onProceedToSpeaking}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shrink-0 shadow-sm haptic-press"
            >
              <span>🎙️ Bắt Đầu Luyện Nói Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </section>
  );
};
