import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Eye } from 'lucide-react';
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
      ? 'Đã mở khóa! Bạn đã hoàn thành bước Điền từ Ngữ cảnh.'
      : '',
  });

  // Reset local state when variation changes
  useEffect(() => {
    setInputValue(isUnlocked ? variation.targetWord : '');
    setAttempts(0);
    setFeedback({
      type: isUnlocked ? 'success' : 'idle',
      message: isUnlocked
        ? 'Đã mở khóa! Bạn đã hoàn thành bước Điền từ Ngữ cảnh.'
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
      9
    );
    return `${activeLen + 3}ch`;
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
      message: `Đã điền từ chuẩn "${variation.targetWord}" (${variation.ipa}). Hãy chuyển sang bước Luyện nói.`,
    });
    onUnlockSuccess(nextAttempts);
  };

  return (
    <section
      aria-labelledby="cloze-stage-heading"
      className="p-3 sm:p-5 material-regular rounded-3xl transition-colors flex flex-col justify-between"
    >
      {/* 1. Compact Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs min-w-0">
          <span className="font-bold vibrancy-label tracking-tight shrink-0">
            01. Điền Từ (Cloze)
          </span>
          <span className="vibrancy-tertiary shrink-0" aria-hidden="true">·</span>
          <span className="vibrancy-secondary truncate">
            {variation.pragmaticContext}
          </span>
        </div>

        {isUnlocked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Đã mở khóa</span>
          </span>
        )}
      </div>

      <h3 id="cloze-stage-heading" className="sr-only">
        Bài tập điền từ vào chỗ trống
      </h3>

      {/* 2. Interactive Cloze Sentence & Translation Box */}
      <div className="p-2.5 sm:p-4 rounded-2xl material-thin mb-2">
        <div className="text-[15px] sm:text-lg font-semibold vibrancy-label leading-snug break-words">
          <span>{templateParts.prefix}</span>
          <span className="inline-block mx-1 my-0.5 align-baseline max-w-full">
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
              className={`px-2.5 py-0.5 text-[15px] sm:text-base font-semibold text-center rounded-xl material-thick transition-all focus:outline-none ${
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

        {/* Vietnamese translation */}
        <div className="mt-1.5 pt-1.5 border-t border-black/[0.05] dark:border-white/[0.06] text-xs sm:text-sm font-medium text-[#0284C7] dark:text-sky-300 leading-snug">
          “{variation.vietnameseTranslation}”
        </div>
      </div>

      {/* 3. Ultra-Compact 2-Line Lexical Clue Box (Saves 42px height while showing full text) */}
      <div className="px-3 py-2 rounded-2xl material-thin mb-2 space-y-1 text-xs">
        <div className="leading-snug">
          <span className="text-[11px] font-medium vibrancy-secondary mr-1.5">
            Gợi ý nghĩa:
          </span>
          <span className="font-semibold vibrancy-label">
            {variation.vietnameseHint}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
          <div className="min-w-0">
            <span className="text-[11px] font-medium vibrancy-secondary mr-1.5">
              Từ loại:
            </span>
            <span className="font-semibold vibrancy-label">
              {variation.partOfSpeech}
            </span>
          </div>
          <div className="shrink-0">
            <span className="text-[11px] font-medium vibrancy-secondary mr-1">
              IPA:
            </span>
            <span className="font-ipa font-bold text-[#0284C7] dark:text-sky-400">
              {variation.ipa}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Full-Text Word Bank (2x2 Grid on Mobile, 4-Col on Desktop — Zero Truncation!) */}
      <div className="mb-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-medium vibrancy-secondary">
            Chọn từ đúng (hoặc tự gõ vào ô trống):
          </span>
          {!isUnlocked && (
            <button
              type="button"
              onClick={handleRevealAnswer}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284C7] dark:text-sky-400 hover:underline haptic-press shrink-0"
            >
              <Eye className="w-3 h-3" />
              <span>Hiện đáp án</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {wordBankChoices.map((choice) => {
            const isSelected = inputValue.trim().toLowerCase() === choice.toLowerCase();
            return (
              <button
                key={choice}
                type="button"
                onClick={() => handleVerify(choice)}
                className={`py-2 px-2.5 text-xs sm:text-[13px] font-mono font-bold rounded-xl transition-all text-center break-words leading-tight haptic-press ${
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

      {/* 5. Compact Diagnostic Status Banner */}
      {feedback.type !== 'idle' && (
        <div
          role="status"
          className={`mb-2 px-2.5 py-1.5 rounded-xl border flex items-start gap-2 text-[11px] sm:text-xs leading-snug ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-200'
              : feedback.type === 'near_miss'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-200'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : feedback.type === 'near_miss' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <span className="font-bold">
              {feedback.type === 'success'
                ? '● ĐẠT CHUẨN: '
                : feedback.type === 'near_miss'
                ? '▲ HÌNH THÁI TỪ: '
                : '✕ THỬ LẠI: '}
            </span>
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* 6. Unified Bottom Thumb Action Dock */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleVerify()}
          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-2xl hover:bg-[#0369A1] dark:hover:bg-sky-500 transition-all whitespace-nowrap haptic-press shadow-xs"
        >
          <span>Kiểm Tra Từ Vựng</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>

        {onProceedToSpeaking && (
          <button
            type="button"
            onClick={onProceedToSpeaking}
            className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-2xl transition-all whitespace-nowrap haptic-press ${
              isUnlocked
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm ring-2 ring-emerald-500/25'
                : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <span>🎙️ Sang Bước 2: Luyện Nói</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>
    </section>
  );
};
