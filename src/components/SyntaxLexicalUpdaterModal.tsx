import React, { useEffect, useState } from 'react';
import { X, Save, RotateCcw, Sparkles, Edit3, BookOpenCheck } from 'lucide-react';
import { SentencePattern, SentenceVariation } from '../types/sla';

export interface CustomPatternOverride {
  patternTitle?: string;
  formula?: string;
  vietnameseMeaning?: string;
  pragmaticUsage?: string;
  variationOverrides?: Record<number, Partial<SentenceVariation>>;
}

interface SyntaxLexicalUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePattern: SentencePattern;
  currentVariation: SentenceVariation;
  onSavePatternSyntax: (
    patternId: string,
    updates: {
      patternTitle: string;
      formula: string;
      vietnameseMeaning: string;
      pragmaticUsage: string;
    }
  ) => void;
  onSaveVariationLexical: (
    patternId: string,
    variationIndex: number,
    updates: Partial<SentenceVariation>
  ) => void;
  onResetPatternOverrides: (patternId: string) => void;
  hasCustomOverrides: boolean;
}

export const SyntaxLexicalUpdaterModal: React.FC<SyntaxLexicalUpdaterModalProps> = ({
  isOpen,
  onClose,
  activePattern,
  currentVariation,
  onSavePatternSyntax,
  onSaveVariationLexical,
  onResetPatternOverrides,
  hasCustomOverrides,
}) => {
  const [mode, setMode] = useState<'lexical' | 'syntax'>('lexical');

  // Pattern syntax state
  const [patternTitle, setPatternTitle] = useState(activePattern.patternTitle);
  const [formula, setFormula] = useState(activePattern.formula);
  const [vietnameseMeaning, setVietnameseMeaning] = useState(activePattern.vietnameseMeaning);
  const [pragmaticUsage, setPragmaticUsage] = useState(activePattern.pragmaticUsage);

  // Variation lexical state
  const [fullSentence, setFullSentence] = useState(currentVariation.fullSentence);
  const [targetWord, setTargetWord] = useState(currentVariation.targetWord);
  const [partOfSpeech, setPartOfSpeech] = useState(currentVariation.partOfSpeech);
  const [ipa, setIpa] = useState(currentVariation.ipa);
  const [vietnameseHint, setVietnameseHint] = useState(currentVariation.vietnameseHint);
  const [vietnameseTranslation, setVietnameseTranslation] = useState(
    currentVariation.vietnameseTranslation
  );
  const [distractorStr, setDistractorStr] = useState(
    currentVariation.distractors.join(', ')
  );
  const [slotQuickPhrase, setSlotQuickPhrase] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setPatternTitle(activePattern.patternTitle);
    setFormula(activePattern.formula);
    setVietnameseMeaning(activePattern.vietnameseMeaning);
    setPragmaticUsage(activePattern.pragmaticUsage);
  }, [activePattern]);

  useEffect(() => {
    setFullSentence(currentVariation.fullSentence);
    setTargetWord(currentVariation.targetWord);
    setPartOfSpeech(currentVariation.partOfSpeech);
    setIpa(currentVariation.ipa);
    setVietnameseHint(currentVariation.vietnameseHint);
    setVietnameseTranslation(currentVariation.vietnameseTranslation);
    setDistractorStr(currentVariation.distractors.join(', '));
    setStatusMessage(null);
  }, [currentVariation]);

  if (!isOpen) return null;

  const handleApplyQuickSlot = () => {
    const trimmed = slotQuickPhrase.trim();
    if (!trimmed) return;
    const baseTemplate = currentVariation.patternTemplate || activePattern.formula;
    let nextSentence = '';
    if (baseTemplate.includes('[...]')) {
      nextSentence = baseTemplate.replace('[...]', trimmed);
    } else {
      nextSentence = `${baseTemplate.replace(/[.?!]+$/, '')} (${trimmed}).`;
    }
    const words = trimmed.split(/\s+/).filter(Boolean);
    const longestWord =
      words.reduce((a, b) => (b.length >= a.length ? b : a), words[0] || trimmed).replace(
        /[^a-zA-Z-]/g,
        ''
      ) || trimmed;

    setFullSentence(nextSentence);
    setTargetWord(longestWord);
    setStatusMessage(
      `Đã điền cụm "${trimmed}" vào khung cú pháp và chọn từ mục tiêu "${longestWord}". Hãy bấm Lưu Cập Nhật Từ Vựng để áp dụng!`
    );
  };

  const handleSaveLexicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSentence = fullSentence.trim();
    const cleanTarget = targetWord.trim();
    if (!cleanSentence || !cleanTarget) {
      setStatusMessage('Vui lòng nhập đầy đủ Câu tiếng Anh hoàn chỉnh và Từ vựng mục tiêu.');
      return;
    }

    // Ensure targetWord exists in fullSentence so Cloze blank can be constructed
    const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    let computedCloze = '';
    if (regex.test(cleanSentence)) {
      computedCloze = cleanSentence.replace(regex, '___');
    } else if (cleanSentence.toLowerCase().includes(cleanTarget.toLowerCase())) {
      const idx = cleanSentence.toLowerCase().indexOf(cleanTarget.toLowerCase());
      computedCloze =
        cleanSentence.slice(0, idx) +
        '___' +
        cleanSentence.slice(idx + cleanTarget.length);
    } else {
      setStatusMessage(
        `Lưu ý: Từ mục tiêu "${cleanTarget}" phải xuất hiện bên trong câu "${cleanSentence}" để tạo chỗ trống điền từ.`
      );
      return;
    }

    const parsedDistractors = distractorStr
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && d.toLowerCase() !== cleanTarget.toLowerCase());

    while (parsedDistractors.length < 3) {
      parsedDistractors.push(`${cleanTarget}s`);
    }

    onSaveVariationLexical(activePattern.id, currentVariation.index, {
      fullSentence: cleanSentence,
      clozeTemplate: computedCloze,
      targetWord: cleanTarget,
      partOfSpeech: partOfSpeech.trim() || 'Noun / Phrase',
      ipa: ipa.trim() || `/${cleanTarget.toLowerCase()}/`,
      vietnameseHint: vietnameseHint.trim() || 'Từ vựng cập nhật theo công việc',
      vietnameseTranslation:
        vietnameseTranslation.trim() || currentVariation.vietnameseTranslation,
      distractors: parsedDistractors.slice(0, 3),
    });

    setStatusMessage(
      `Đã cập nhật thành công Biến thể #${currentVariation.index}/20! Câu mới đã sẵn sàng để Luyện nói và Chấm điểm.`
    );
  };

  const handleSaveSyntaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePatternSyntax(activePattern.id, {
      patternTitle: patternTitle.trim() || activePattern.patternTitle,
      formula: formula.trim() || activePattern.formula,
      vietnameseMeaning: vietnameseMeaning.trim() || activePattern.vietnameseMeaning,
      pragmaticUsage: pragmaticUsage.trim() || activePattern.pragmaticUsage,
    });
    setStatusMessage('Đã lưu cập nhật Cú pháp & Ý nghĩa của Mẫu câu hiện tại!');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="updater-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl liquid-glass-regular rounded-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.3)] p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="text-xs font-semibold text-[#0284C7] dark:text-sky-400">
              Trình Cập Nhật Cú Pháp & Từ Vựng Cá Nhân Hóa (CEFR {activePattern.cefrLevel} · Mẫu #{activePattern.patternNumberInLevel || 1}/60)
            </div>
            <h2
              id="updater-modal-title"
              className="text-lg font-bold vibrancy-label font-serif-display mt-0.5"
            >
              Cập Nhật Cú Pháp Câu & Từ Vựng Thực Tế Cho Công Việc
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ cập nhật"
            className="p-2 rounded-2xl material-thin vibrancy-secondary hover:vibrancy-label transition-all haptic-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl p-1 material-thin">
            <button
              type="button"
              onClick={() => {
                setMode('lexical');
                setStatusMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all haptic-press ${
                mode === 'lexical'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'vibrancy-secondary hover:vibrancy-label'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa Biến Thể #{currentVariation.index}/20 (Từ vựng)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('syntax');
                setStatusMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all haptic-press ${
                mode === 'syntax'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'vibrancy-secondary hover:vibrancy-label'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>Sửa Cú Pháp Mẫu Lớn (Formula)</span>
            </button>
          </div>

          {hasCustomOverrides && (
            <button
              type="button"
              onClick={() => {
                onResetPatternOverrides(activePattern.id);
                setStatusMessage('Đã khôi phục mẫu câu về dữ liệu gốc mặc định.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục Mặc định Mẫu này</span>
            </button>
          )}
        </div>

        {mode === 'lexical' ? (
          <form onSubmit={handleSaveLexicalSubmit} className="space-y-4">
            {/* Quick [...] Slot Filler */}
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 space-y-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-sky-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400" />
                <span>Thay nhanh cụm từ vào khung mẫu: {activePattern.formula}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={slotQuickPhrase}
                  onChange={(e) => setSlotQuickPhrase(e.target.value)}
                  placeholder="Nhập cụm từ công việc của bạn (VD: offshore wind fabrication)..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleApplyQuickSlot}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-lg hover:bg-[#0369A1] whitespace-nowrap shrink-0"
                >
                  Điền Vào Khung [...]
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Câu tiếng Anh hoàn chỉnh (Biến thể #{currentVariation.index}/20 để Luyện nói):
              </label>
              <input
                type="text"
                value={fullSentence}
                onChange={(e) => setFullSentence(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Từ vựng mục tiêu (Cloze):
                </label>
                <input
                  type="text"
                  value={targetWord}
                  onChange={(e) => setTargetWord(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-[#0284C7] dark:text-sky-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Từ loại (POS):
                </label>
                <input
                  type="text"
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Phiên âm (IPA):
                </label>
                <input
                  type="text"
                  value={ipa}
                  onChange={(e) => setIpa(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-ipa rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Gợi ý nghĩa từ vựng (Vietnamese Hint):
                </label>
                <input
                  type="text"
                  value={vietnameseHint}
                  onChange={(e) => setVietnameseHint(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  3 Từ gây nhiễu (cách nhau bởi dấu phẩy):
                </label>
                <input
                  type="text"
                  value={distractorStr}
                  onChange={(e) => setDistractorStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Dịch nghĩa cả câu tiếng Việt:
              </label>
              <input
                type="text"
                value={vietnameseTranslation}
                onChange={(e) => setVietnameseTranslation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] dark:bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cập Nhật Từ Vựng & Câu</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveSyntaxSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Tiêu đề Mẫu câu:
              </label>
              <input
                type="text"
                value={patternTitle}
                onChange={(e) => setPatternTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Công thức Cú pháp (Syntactic Formula — dùng [...] cho vị trí thay thế):
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-semibold rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-[#0284C7] dark:text-sky-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Nghĩa tiếng Việt của Khung Cú pháp:
              </label>
              <input
                type="text"
                value={vietnameseMeaning}
                onChange={(e) => setVietnameseMeaning(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Ghi chú Ngữ dụng & Tình huống sử dụng (Pragmatics):
              </label>
              <input
                type="text"
                value={pragmaticUsage}
                onChange={(e) => setPragmaticUsage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#151F32] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] dark:bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cập Nhật Cú Pháp</span>
              </button>
            </div>
          </form>
        )}

        {statusMessage && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200"
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
