import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Apple, Check, Play, Pause, X } from 'lucide-react';
import {
  VoiceOptionId,
  VOICE_OPTIONS,
  getCurrentVoiceOption,
  setVoiceOption,
  playSpeech,
  stopAllSpeech,
  getSamanthaOrSiriVoice,
} from '../utils/speechVoiceManager';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SENTENCE = 'Welcome to LexiSpeak. Practice English naturally every day!';

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOptionId>(getCurrentVoiceOption());
  const [previewingVoice, setPreviewingVoice] = useState<VoiceOptionId | null>(null);
  const [detectedNativeVoice, setDetectedNativeVoice] = useState<string>('Đang tìm...');

  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
      setPreviewingVoice(null);
      return;
    }

    setSelectedVoice(getCurrentVoiceOption());

    // Detect browser voice name for Samantha / Siri
    const updateVoiceName = () => {
      const v = getSamanthaOrSiriVoice();
      if (v) {
        setDetectedNativeVoice(v.name);
      } else {
        setDetectedNativeVoice('Giọng mặc định thiết bị');
      }
    };

    updateVoiceName();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceName;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (optionId: VoiceOptionId) => {
    setSelectedVoice(optionId);
    setVoiceOption(optionId);
  };

  const handlePlayPreview = async (e: React.MouseEvent, optionId: VoiceOptionId) => {
    e.stopPropagation();

    if (previewingVoice === optionId) {
      stopAllSpeech();
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(optionId);
    await playSpeech({
      text: SAMPLE_SENTENCE,
      rate: 1.0,
      forceOption: optionId,
      onStart: () => setPreviewingVoice(optionId),
      onEnd: () => setPreviewingVoice(null),
      onError: () => setPreviewingVoice(null),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg liquid-glass-regular rounded-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Functional Liquid Glass with Vibrancy) */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl material-thin flex items-center justify-center text-[#0284C7] dark:text-sky-300 shadow-2xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold vibrancy-label leading-tight">
                Tùy Chọn Giọng Đọc (TTS)
              </h2>
              <p className="text-xs vibrancy-secondary mt-0.5">
                Hai chuẩn âm thanh công nghệ cao cho học viên Việt Nam
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl material-thin vibrancy-secondary hover:vibrancy-label transition-all haptic-press"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Option Cards (Content Layer - Standard Materials) */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {VOICE_OPTIONS.map((opt) => {
            const isSelected = selectedVoice === opt.id;
            const isPlaying = previewingVoice === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`relative p-4.5 rounded-2xl transition-all cursor-pointer haptic-press ${
                  isSelected
                    ? 'material-regular ring-2 ring-sky-500 border-sky-500/40 shadow-sm'
                    : 'material-thin hover:opacity-95'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Icon Tile */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        opt.id === 'gemini_audio'
                          ? 'bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                          : 'bg-linear-to-br from-slate-700 to-slate-900 text-white dark:from-slate-600 dark:to-slate-800 shadow-sm'
                      }`}
                    >
                      {opt.id === 'gemini_audio' ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <Apple className="w-5 h-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold vibrancy-label">
                          {opt.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            opt.id === 'gemini_audio'
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#0284C7] dark:text-sky-300">
                        {opt.tagline}
                      </p>
                      <p className="text-xs vibrancy-secondary leading-relaxed">
                        {opt.description}
                      </p>

                      {opt.id === 'samantha_siri' && (
                        <div className="text-[11px] vibrancy-tertiary pt-0.5">
                          Thiết bị đang khớp: <span className="font-semibold vibrancy-label">{detectedNativeVoice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Radio / Selection Indicator */}
                  <div className="shrink-0 flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#0284C7] text-white'
                          : 'border-2 border-black/[0.15] dark:border-white/[0.2]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Preview Button */}
                <div className="mt-3.5 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                  <div className="text-[11px] vibrancy-tertiary">
                    {opt.id === 'gemini_audio'
                      ? '⚡ Caching tức thì sau lần tải đầu'
                      : '📶 Hoạt động không cần kết nối mạng'}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handlePlayPreview(e, opt.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all haptic-press ${
                      isPlaying
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'material-thin vibrancy-label hover:opacity-90'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Đang đọc...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Nghe thử mẫu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Sample sentence preview card */}
          <div className="p-4 rounded-2xl material-thin text-center space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider vibrancy-tertiary">
              Câu mẫu thử nghiệm
            </span>
            <p className="text-xs italic vibrancy-label font-serif">
              "{SAMPLE_SENTENCE}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="text-xs vibrancy-secondary">
            Đang áp dụng:{' '}
            <strong className="vibrancy-label">
              {selectedVoice === 'gemini_audio'
                ? 'Google Gemini Audio TTS'
                : 'Samantha / Siri Voice'}
            </strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all haptic-press shadow-sm"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
