import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Play,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CEFRLevel,
  SentenceVariation,
  SpeakingEvaluationSummary,
  WordEvaluationResult,
} from '../types/sla';
import {
  buildSimulatedTranscript,
} from '../utils/phoneticScoring';
import { slaWorkerClient } from '../utils/slaWorkerClient';
import { iOSHardwareManager, IOSHardwareSnapshot } from '../utils/iOSHardwareManager';
import { AudioWaveform } from './AudioWaveform';
import {
  playSpeech,
  stopAllSpeech,
  getCurrentVoiceOption,
  VoiceOptionId,
} from '../utils/speechVoiceManager';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface SpeakingDrillCardProps {
  variation: SentenceVariation;
  cefrLevel: CEFRLevel;
  isUnlocked: boolean;
  onEvaluationComplete: (summary: SpeakingEvaluationSummary) => void;
  onNextSentence: () => void;
  hasNextSentence: boolean;
}

export const SpeakingDrillCard: React.FC<SpeakingDrillCardProps> = ({
  variation,
  cefrLevel,
  isUnlocked,
  onEvaluationComplete,
  onNextSentence,
  hasNextSentence,
}) => {
  const [audioMode, setAudioMode] = useState<
    'idle' | 'recording' | 'tts_normal' | 'tts_slow' | 'simulating'
  >('idle');
  const [evaluation, setEvaluation] = useState<SpeakingEvaluationSummary | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [customTranscript, setCustomTranscript] = useState('');
  const [micNote, setMicNote] = useState<string | null>(null);
  const [voiceOption, setVoiceOptionState] = useState<VoiceOptionId>(getCurrentVoiceOption());
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [hwSnapshot, setHwSnapshot] = useState<IOSHardwareSnapshot>(() =>
    iOSHardwareManager.getSnapshot()
  );

  const recognitionRef = useRef<any>(null);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    return iOSHardwareManager.subscribe(setHwSnapshot);
  }, []);

  // Sync voice option changes across app components
  useEffect(() => {
    const handleVoiceChange = (e: Event) => {
      const custom = e as CustomEvent<VoiceOptionId>;
      if (custom.detail) {
        setVoiceOptionState(custom.detail);
      }
    };
    window.addEventListener('lexispeak:voice_changed', handleVoiceChange);
    return () => window.removeEventListener('lexispeak:voice_changed', handleVoiceChange);
  }, []);

  // Reset state when switching sentences, muting persistent Mic track via track.enabled = false
  useEffect(() => {
    setAudioMode('idle');
    setEvaluation(null);
    setSelectedWordIndex(null);
    setCustomTranscript('');
    setMicNote(null);
    iOSHardwareManager.setMicTrackEnabled(false);
    stopAllSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [variation.id]);

  const handlePlayTTS = async (rate: 1.0 | 0.8) => {
    iOSHardwareManager.unlockAudioContext();
    void iOSHardwareManager.requestWakeLock();
    setAudioMode(rate === 1.0 ? 'tts_normal' : 'tts_slow');

    await playSpeech({
      text: variation.fullSentence,
      rate,
      onStart: () => setAudioMode(rate === 1.0 ? 'tts_normal' : 'tts_slow'),
      onEnd: () => setAudioMode('idle'),
      onError: () => setAudioMode('idle'),
    });
  };

  const runScoringPipeline = async (transcript: string, durationSec: number) => {
    const result = await slaWorkerClient.evaluateSentenceAsync(
      variation.fullSentence,
      transcript,
      cefrLevel,
      durationSec
    );
    setEvaluation(result);
    setCustomTranscript(transcript);
    const firstNonExact = result.wordResults.findIndex((w) => w.status !== 'accurate');
    setSelectedWordIndex(firstNonExact !== -1 ? firstNonExact : 0);
    onEvaluationComplete(result);
  };

  const handleToggleRecording = async () => {
    if (!isUnlocked) return;

    // Unlock iOS WebAudio & request Screen WakeLock during active speaking drill
    iOSHardwareManager.unlockAudioContext();
    void iOSHardwareManager.requestWakeLock();

    if (audioMode === 'recording') {
      // Mute persistent stream via track.enabled = false (no getUserMedia re-prompt!)
      iOSHardwareManager.setMicTrackEnabled(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setAudioMode('idle');
      return;
    }

    // Try initializing Web Speech Recognition API if available on browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicNote(
        'Trình duyệt chưa hỗ trợ Web Speech ASR trực tiếp. Sử dụng tính năng "Bộ mô phỏng âm học L1" phía dưới để kiểm tra thuật toán chấm điểm.'
      );
      handleSimulateProfile('native_accurate');
      return;
    }

    try {
      // Warm up / ensure persistent media stream exists
      await iOSHardwareManager.acquirePersistentMicStream();
      iOSHardwareManager.setMicTrackEnabled(true);

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        recordingStartRef.current = Date.now();
        setAudioMode('recording');
        setMicNote(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const durationSec = Math.max(1, (Date.now() - recordingStartRef.current) / 1000);
        void runScoringPipeline(transcript, durationSec);
      };

      recognition.onerror = (event: any) => {
        setAudioMode('idle');
        iOSHardwareManager.setMicTrackEnabled(false);
        if (event.error === 'not-allowed') {
          setMicNote(
            'Quyền truy cập Micro bị từ chối. Hãy cho phép Micro trong Cài đặt Safari để luyện nói.'
          );
        } else {
          setMicNote(
            'Không nhận diện được giọng nói rõ ràng. Tự động chuyển sang mô phỏng âm học.'
          );
          handleSimulateProfile('vn_l1_final_consonant');
        }
      };

      recognition.onend = () => {
        setAudioMode('idle');
        iOSHardwareManager.setMicTrackEnabled(false);
      };

      recognition.start();
    } catch {
      setAudioMode('idle');
      iOSHardwareManager.setMicTrackEnabled(false);
      setMicNote('Không thể khởi chạy Micro. Tự động kiểm tra với bộ mẫu âm học.');
      handleSimulateProfile('native_accurate');
    }
  };

  const handleSimulateProfile = (
    profile: 'native_accurate' | 'vn_l1_final_consonant' | 'hesitant_omission'
  ) => {
    if (!isUnlocked) return;
    iOSHardwareManager.unlockAudioContext();
    setAudioMode('simulating');
    setMicNote(null);
    stopAllSpeech();

    const simTranscript = buildSimulatedTranscript(
      variation.fullSentence,
      profile
    );

    const simulatedDuration =
      profile === 'hesitant_omission'
        ? variation.fullSentence.split(' ').length * 0.8
        : variation.fullSentence.split(' ').length * 0.45;

    window.setTimeout(() => {
      void runScoringPipeline(simTranscript, simulatedDuration);
      setAudioMode('idle');
    }, 400);
  };

  const handleEvaluateCustomTranscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked || !customTranscript.trim()) return;
    const wordCount = customTranscript.trim().split(/\s+/).length;
    const estimatedDuration = Math.max(1.5, wordCount * 0.5);
    void runScoringPipeline(customTranscript.trim(), estimatedDuration);
  };

  const selectedWordDetail: WordEvaluationResult | null =
    evaluation && selectedWordIndex !== null && evaluation.wordResults[selectedWordIndex]
      ? evaluation.wordResults[selectedWordIndex]
      : null;

  return (
    <section
      aria-labelledby="speaking-stage-heading"
      className="p-3.5 sm:p-5 material-regular rounded-3xl transition-colors relative"
      data-testid="speaking-drill-card-container"
    >
      {/* Unlocked / Locked Indicator Header */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <span className="font-bold vibrancy-label tracking-tight shrink-0">
            02. Luyện Nói & Chẩn Đoán
          </span>
          <span className="vibrancy-tertiary shrink-0" aria-hidden="true">·</span>
          <span className="vibrancy-secondary truncate">
            {variation.pragmaticContext}
          </span>
        </div>

        <div className="shrink-0">
          {isUnlocked ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              data-testid="speaking-unlocked-status"
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Sẵn sàng</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold material-thin vibrancy-secondary"
              data-testid="speaking-locked-status"
            >
              <Lock className="w-3 h-3 shrink-0" />
              <span>Hoàn thành Bước 1 trước</span>
            </span>
          )}
        </div>
      </div>

      <h3 id="speaking-stage-heading" className="sr-only">
        Luyện phát âm và chấm điểm câu
      </h3>

      {/* Target Sentence Display — Standard Thin Material */}
      <div className="p-3 sm:p-4 rounded-2xl material-thin mb-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs vibrancy-secondary mb-1">
          <span>Câu mục tiêu phát âm:</span>
          <span className="font-ipa font-medium text-[#0284C7] dark:text-sky-300">
            Trọng điểm: {variation.l1PhoneticTrap.phoneme} ({variation.ipa})
          </span>
        </div>

        <p
          className="text-[15px] sm:text-lg md:text-xl font-bold vibrancy-label leading-snug break-words"
          data-testid="target-full-sentence"
        >
          {variation.fullSentence}
        </p>

        {/* Vietnamese translation immediately visible */}
        <div className="mt-1.5 text-xs sm:text-sm font-medium text-[#0284C7] dark:text-sky-300 leading-snug">
          “{variation.vietnameseTranslation}”
        </div>

        {/* Expandable L1 Phonetic Trap & Articulation Tip */}
        <details className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.06] text-xs group">
          <summary className="font-semibold text-amber-600 dark:text-amber-400 cursor-pointer flex items-center justify-between list-none">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Cạm bẫy âm học L1 & Mẹo khẩu hình (Người Việt)</span>
            </span>
            <span className="text-[11px] vibrancy-tertiary group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="mt-1.5 space-y-1 pl-5 vibrancy-secondary leading-snug">
            <p>
              <strong className="vibrancy-label">
                Lỗi thường gặp:
              </strong>{' '}
              {variation.l1PhoneticTrap.vietnameseTrap}
            </p>
            <p>
              <strong className="text-[#0284C7] dark:text-sky-400">
                Mẹo khẩu hình chuẩn:
              </strong>{' '}
              {variation.l1PhoneticTrap.articulationTip}
            </p>
          </div>
        </details>
      </div>

      {/* Quick Voice Selector Badge & Switcher */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <span className="text-[11px] font-semibold vibrancy-secondary">
          Giọng đọc mẫu:
        </span>
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-xs font-semibold material-thin vibrancy-label hover:opacity-90 transition-all haptic-press shadow-2xs"
          title="Bấm để chuyển đổi giữa Google Gemini Audio TTS và Samantha / Siri Voice"
        >
          {voiceOption === 'gemini_audio' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-none">Google Gemini Audio TTS</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-none">Samantha / Siri Voice</span>
            </>
          )}
          <SlidersHorizontal className="w-3 h-3 vibrancy-tertiary shrink-0 ml-0.5" />
        </button>
      </div>

      {/* Audio Waveform Animation */}
      <div className="mb-2.5">
        <AudioWaveform isActive={audioMode !== 'idle'} mode={audioMode} />
      </div>

      {/* Primary Audio & Recording Controls — Thumb-friendly row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
        <button
          type="button"
          onClick={() => handlePlayTTS(1.0)}
          className="touch-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold material-thin vibrancy-label rounded-2xl hover:opacity-90 transition-all haptic-press"
        >
          <Volume2 className="w-4 h-4 text-[#0284C7] dark:text-sky-400 shrink-0" />
          <span>Nghe 1.0x (Chuẩn)</span>
        </button>

        <button
          type="button"
          onClick={() => handlePlayTTS(0.8)}
          className="touch-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold material-thin vibrancy-label rounded-2xl hover:opacity-90 transition-all haptic-press"
        >
          <Gauge className="w-4 h-4 text-[#0284C7] dark:text-sky-400 shrink-0" />
          <span>Nghe 0.8x (Chậm)</span>
        </button>

        <button
          type="button"
          disabled={!isUnlocked}
          onClick={handleToggleRecording}
          className={`touch-btn col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all haptic-press shadow-xs ${
            !isUnlocked
              ? 'material-thin vibrancy-tertiary cursor-not-allowed opacity-60'
              : audioMode === 'recording'
              ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse shadow-[0_0_24px_rgba(225,29,72,0.45)]'
              : 'bg-[#0284C7] dark:bg-sky-600 text-white hover:bg-[#0369A1] dark:hover:bg-sky-500 shadow-sm'
          }`}
        >
          {audioMode === 'recording' ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Dừng & Chấm Điểm</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Thu Âm Giọng Nói (Mic)</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Acoustic Simulation & Diagnostic Sandbox */}
      <details className="mb-1 rounded-2xl material-thin overflow-hidden text-xs group">
        <summary className="px-3.5 py-2 font-semibold vibrancy-label cursor-pointer flex items-center justify-between list-none hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-1.5 min-w-0">
            <Play className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400 shrink-0" />
            <span className="truncate">Bộ Mô Phỏng Âm Học L1 & Chuỗi ASR</span>
          </div>
          <span className="text-[11px] vibrancy-tertiary group-open:rotate-180 transition-transform shrink-0">▾</span>
        </summary>

        <div className="p-3.5 pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2.5">
          <div className="vibrancy-secondary leading-relaxed">
            Nhấn để kiểm tra tức thì pipeline phân tích âm học SLA:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => handleSimulateProfile('native_accurate')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl material-thin vibrancy-label hover:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap shrink-0 haptic-press"
            >
              <Play className="w-3.5 h-3.5 text-emerald-500" />
              <span>Phát Âm Chuẩn (92–98%)</span>
            </button>

            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => handleSimulateProfile('vn_l1_final_consonant')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl material-thin vibrancy-label hover:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap shrink-0 haptic-press"
            >
              <Play className="w-3.5 h-3.5 text-amber-500" />
              <span>Bỏ Âm Cuối L1 (75–86%)</span>
            </button>

            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => handleSimulateProfile('hesitant_omission')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl material-thin vibrancy-label hover:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap shrink-0 haptic-press"
            >
              <Play className="w-3.5 h-3.5 text-rose-500" />
              <span>Ngập Ngừng / Sót Từ</span>
            </button>
          </div>

          {/* Optional manual ASR transcript override */}
          <form
            onSubmit={handleEvaluateCustomTranscript}
            className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              id="custom-asr-input"
              type="text"
              disabled={!isUnlocked}
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              placeholder="Nhập chuỗi ASR phân tích..."
              className="flex-1 px-3 py-1.5 text-xs font-mono material-thick vibrancy-label rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <button
              type="submit"
              disabled={!isUnlocked || !customTranscript.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold material-thin vibrancy-label rounded-xl disabled:opacity-50 transition-all whitespace-nowrap shrink-0 haptic-press"
            >
              Phân Tích Âm
            </button>
          </form>
        </div>
      </details>

      {micNote && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-950 dark:text-amber-200">
          {micNote}
        </div>
      )}

      {/* Real-Time Evaluation Results & Word-by-Word Color-Coded Diagnostics */}
      {evaluation && (
        <div
          className="p-5 rounded-3xl material-thin space-y-5"
          data-testid="speaking-evaluation-results"
        >
          {/* Quantitative Score Row (Apple Metric Tiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="p-3 rounded-2xl material-regular">
              <div className="text-[11px] font-medium vibrancy-secondary">
                Điểm Tổng Thể (Overall)
              </div>
              <div
                className="text-2xl font-bold font-mono tabular-nums vibrancy-label mt-1"
                data-testid="overall-speaking-score"
              >
                {evaluation.overallScore}%
              </div>
              <div className="text-[11px] font-semibold mt-1">
                {evaluation.overallScore >= 85 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">● ĐẠT CHUẨN TỰ ĐỘNG HÓA</span>
                ) : evaluation.overallScore >= 70 ? (
                  <span className="text-amber-600 dark:text-amber-400">▲ CẦN CHỈNH ÂM CUỐI</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">✕ CẦN LUYỆN LẠI NHỊP CÂU</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl material-regular">
              <div className="text-[11px] font-medium vibrancy-secondary">
                Độ Chính Xác Âm Học
              </div>
              <div className="text-xl font-bold font-mono tabular-nums vibrancy-label mt-1">
                {evaluation.phoneticAccuracyScore}%
              </div>
              <div className="text-[11px] vibrancy-tertiary mt-1">
                Levenshtein + L1 Rules
              </div>
            </div>

            <div className="p-3 rounded-2xl material-regular">
              <div className="text-[11px] font-medium vibrancy-secondary">
                Độ Trôi Chảy (Fluency)
              </div>
              <div className="text-xl font-bold font-mono tabular-nums vibrancy-label mt-1">
                {evaluation.fluencyScore}%
              </div>
              <div className="text-[11px] font-mono tabular-nums vibrancy-secondary mt-1">
                Tốc độ: ~{evaluation.estimatedWpm} WPM
              </div>
            </div>

            <div className="p-3 rounded-2xl material-regular">
              <div className="text-[11px] font-medium vibrancy-secondary">
                Độ Đầy Đủ Từ
              </div>
              <div className="text-xl font-bold font-mono tabular-nums vibrancy-label mt-1">
                {evaluation.completenessScore}%
              </div>
              <div className="text-[11px] vibrancy-secondary mt-1">
                Chuẩn: CEFR {evaluation.cefrLevelApplied}
              </div>
            </div>
          </div>

          {/* Word-by-Word Color-Coded + Icon-Labeled Interactive Tokens */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold vibrancy-label">
                Phân Tích Từng Từ (Nhấn vào từng từ để xem chẩn đoán khẩu hình chi tiết):
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xanh: Chuẩn xác</span>
                </span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Vàng: Thiếu âm cuối</span>
                </span>
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Đỏ: Sai hoặc sót</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl material-regular">
              {evaluation.wordResults.map((w, idx) => {
                const isSelected = selectedWordIndex === idx;
                const statusStyles =
                  w.status === 'accurate'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                    : w.status === 'minor'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-200'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-200';

                return (
                  <button
                    key={`${w.expectedWord}-${idx}`}
                    type="button"
                    onClick={() => setSelectedWordIndex(idx)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition-all haptic-press ${statusStyles} ${
                      isSelected
                        ? 'ring-2 ring-slate-900 dark:ring-sky-400 ring-offset-2 dark:ring-offset-black'
                        : ''
                    }`}
                  >
                    {w.status === 'accurate' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : w.status === 'minor' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span>{w.expectedWord}</span>
                    <span className="text-xs font-mono opacity-80 tabular-nums">
                      {Math.round(w.similarity * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Word Phonetic Inspector */}
          {selectedWordDetail && (
            <div className="p-4 rounded-2xl material-regular flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 vibrancy-secondary">
                  <span className="font-bold vibrancy-label">
                    Từ mục tiêu: “{selectedWordDetail.expectedWord}”
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    Thu nhận: “{selectedWordDetail.spokenWord || 'Bỏ sót'}”
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Độ tương đồng: {Math.round(selectedWordDetail.similarity * 100)}%
                  </span>
                </div>
                <p className="vibrancy-label leading-relaxed mt-1">
                  {selectedWordDetail.diagnosticNoteVi}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void playSpeech({ text: selectedWordDetail.expectedWord, rate: 0.8 });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold material-thin vibrancy-label rounded-xl hover:opacity-90 transition-all shrink-0 haptic-press"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400" />
                <span>Nghe từ này</span>
              </button>
            </div>
          )}

          {/* Linguistic Coach Feedback & Next Sentence CTA */}
          <div className="pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-xs space-y-1 vibrancy-secondary">
              <p>
                <strong className="vibrancy-label">
                  Nhận xét Chuyên gia Ngữ âm:
                </strong>{' '}
                {evaluation.coachFeedbackVi}
              </p>
              <p className="text-[#0284C7] dark:text-sky-400 font-semibold">
                {evaluation.l1RemediationActionVi}
              </p>
            </div>

            {hasNextSentence && (
              <button
                type="button"
                onClick={onNextSentence}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-sky-600 rounded-2xl hover:bg-slate-800 dark:hover:bg-sky-500 transition-all whitespace-nowrap shrink-0 haptic-press shadow-sm"
              >
                <span>Sang Biến Thể Câu Tiếp Theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice Settings Selection Modal (Functional Layer - Liquid Glass) */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </section>
  );
};
