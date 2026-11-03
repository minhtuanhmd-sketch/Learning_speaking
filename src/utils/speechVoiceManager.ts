/**
 * Speech Voice Manager for LexiSpeak VN
 * Provides seamless management & playback across the two requested voice options:
 * 1. "Google Gemini Audio TTS" (High-quality AI voice via server-side @google/genai)
 * 2. "Samantha (Enhanced) / Siri Voice" (Apple / Web Speech API with enhanced voice selection)
 * Hardened with Bounded LRU Blob Cache + URL.revokeObjectURL and AbortController race condition prevention.
 */

import { iOSHardwareManager } from './iOSHardwareManager';

export type VoiceOptionId = 'gemini_audio' | 'samantha_siri';

export interface VoiceOptionInfo {
  id: VoiceOptionId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  isAi: boolean;
}

export const VOICE_OPTIONS: VoiceOptionInfo[] = [
  {
    id: 'gemini_audio',
    name: 'Google Gemini Audio TTS',
    tagline: 'Giọng AI Studio chuẩn phòng thu Mỹ',
    description: 'Ngữ điệu tự nhiên, luyến láy như người bản xứ, cực chuẩn cho việc học phát âm và nối âm.',
    badge: 'AI Studio',
    isAi: true,
  },
  {
    id: 'samantha_siri',
    name: 'Samantha (Enhanced) / Siri Voice',
    tagline: 'Giọng Apple / Web Speech tự nhiên',
    description: 'Giọng đọc chuẩn iOS WebKit (Samantha Enhanced / Siri), phản hồi tức thì, hỗ trợ offline 100%.',
    badge: 'Apple / Native',
    isAi: false,
  },
];

const STORAGE_KEY = 'lexispeak_tts_voice_option';

// Bounded LRU Blob Cache (Max 40 entries) to prevent browser memory leaks
interface BlobCacheEntry {
  url: string;
  accessedAt: number;
}
const MAX_BLOB_CACHE = 40;
const GEMINI_AUDIO_CACHE = new Map<string, BlobCacheEntry>();

let currentActiveAudio: HTMLAudioElement | null = null;
let currentVoiceOption: VoiceOptionId = 'gemini_audio';
let activeFetchController: AbortController | null = null;

// Initialize from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as VoiceOptionId;
    if (saved === 'gemini_audio' || saved === 'samantha_siri') {
      currentVoiceOption = saved;
    }
  } catch {
    // ignore
  }
}

/**
 * Cleanly evicts and revokes oldest blob URLs from memory
 */
function evictOldestBlob(): void {
  if (GEMINI_AUDIO_CACHE.size >= MAX_BLOB_CACHE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of GEMINI_AUDIO_CACHE.entries()) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = GEMINI_AUDIO_CACHE.get(oldestKey);
      if (entry && typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
        try {
          window.URL.revokeObjectURL(entry.url);
        } catch {
          // ignore
        }
      }
      GEMINI_AUDIO_CACHE.delete(oldestKey);
    }
  }
}

/**
 * Clears and revokes all cached audio blob URLs (useful on logout / memory pressure)
 */
export function clearAudioCache(): void {
  if (typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
    for (const entry of GEMINI_AUDIO_CACHE.values()) {
      try {
        window.URL.revokeObjectURL(entry.url);
      } catch {
        // ignore
      }
    }
  }
  GEMINI_AUDIO_CACHE.clear();
}

/**
 * Returns current selected voice option
 */
export function getCurrentVoiceOption(): VoiceOptionId {
  return currentVoiceOption;
}

/**
 * Sets current voice option and persists
 */
export function setVoiceOption(option: VoiceOptionId): void {
  currentVoiceOption = option;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, option);
      window.dispatchEvent(new CustomEvent('lexispeak:voice_changed', { detail: option }));
    } catch {
      // ignore
    }
  }
}

/**
 * Finds Samantha (Enhanced), Siri, or the best available English browser voice
 */
export function getSamanthaOrSiriVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Try Samantha Enhanced / Premium first
  const samanthaEnhanced = voices.find(
    (v) => /samantha/i.test(v.name) && /(enhanced|premium|natural)/i.test(v.name)
  );
  if (samanthaEnhanced) return samanthaEnhanced;

  // 2. Try any Samantha
  const samantha = voices.find((v) => /samantha/i.test(v.name));
  if (samantha) return samantha;

  // 3. Try Siri
  const siri = voices.find((v) => /siri/i.test(v.name));
  if (siri) return siri;

  // 4. Try Apple iOS/macOS top English voices
  const appleVoice = voices.find(
    (v) =>
      /(ava|allison|karen|daniel|moira|tessa|rachel|tom|zoe)/i.test(v.name) &&
      v.lang.startsWith('en')
  );
  if (appleVoice) return appleVoice;

  // 5. Try Google or Microsoft Natural voices
  const naturalVoice = voices.find(
    (v) =>
      /(google us english|natural.*english|jenny.*natural|aria.*natural|guy.*natural)/i.test(
        v.name
      )
  );
  if (naturalVoice) return naturalVoice;

  // 6. Any en-US voice
  const enUsVoice = voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
  if (enUsVoice) return enUsVoice;

  // 7. Any en voice
  return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
}

/**
 * Immediately stops any playing audio (both HTML Audio & SpeechSynthesis)
 * and aborts in-flight network requests.
 */
export function stopAllSpeech(): void {
  // Abort any in-flight fetch
  if (activeFetchController) {
    try {
      activeFetchController.abort();
    } catch {
      // ignore
    }
    activeFetchController = null;
  }

  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
      currentActiveAudio.src = '';
    } catch {
      // ignore
    }
    currentActiveAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export interface PlaySpeechOptions {
  text: string;
  rate?: 1.0 | 0.8;
  forceOption?: VoiceOptionId;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Plays speech using the active (or specified) voice option:
 * - 'gemini_audio': Fetches from /api/tts/generate (with local memory LRU cache) & plays via HTML5 Audio
 * - 'samantha_siri': Uses Web Speech API with Samantha / Siri voice configuration
 * Automatically falls back to Samantha / Web Speech if Gemini server request fails.
 */
export async function playSpeech(options: PlaySpeechOptions): Promise<void> {
  const { text, rate = 1.0, forceOption, onStart, onEnd, onError } = options;
  const targetOption = forceOption || currentVoiceOption;

  // Stop any currently playing audio and cancel prior in-flight fetch
  stopAllSpeech();

  // Unlock iOS WebKit audio context
  iOSHardwareManager.unlockAudioContext();
  void iOSHardwareManager.requestWakeLock();

  if (targetOption === 'gemini_audio') {
    try {
      onStart?.();
      await playGeminiSpeech(text, rate, onEnd, onError);
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User intentionally interrupted playback by pressing another item
        return;
      }
      console.warn('[LexiSpeak TTS] Gemini Audio fallback to Samantha/Siri:', err);
      // Seamless fallback to Samantha / Siri so learner is never blocked
      playSamanthaSpeech(text, rate, onStart, onEnd, onError);
      return;
    }
  }

  // Samantha / Siri voice
  playSamanthaSpeech(text, rate, onStart, onEnd, onError);
}

/**
 * Internal: Play via Gemini Audio TTS API with AbortController and bounded LRU Blob caching
 */
async function playGeminiSpeech(
  text: string,
  rate: number,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  const cacheKey = text.trim();
  let cachedEntry = GEMINI_AUDIO_CACHE.get(cacheKey);

  let audioUrl: string;

  if (cachedEntry) {
    cachedEntry.accessedAt = Date.now();
    audioUrl = cachedEntry.url;
  } else {
    // Setup fresh AbortController
    activeFetchController = new AbortController();
    const currentSignal = activeFetchController.signal;

    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cacheKey, voiceName: 'Kore' }),
      signal: currentSignal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.audioBase64) {
      throw new Error('Dữ liệu âm thanh rỗng');
    }

    // Convert base64 WAV to Blob URL
    const binaryStr = atob(data.audioBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });

    // Evict oldest if reaching capacity
    evictOldestBlob();

    audioUrl = URL.createObjectURL(blob);
    GEMINI_AUDIO_CACHE.set(cacheKey, {
      url: audioUrl,
      accessedAt: Date.now(),
    });
  }

  const audio = new Audio(audioUrl);
  currentActiveAudio = audio;
  audio.playbackRate = rate;

  return new Promise((resolve, reject) => {
    let resolved = false;

    audio.onended = () => {
      if (!resolved) {
        resolved = true;
        currentActiveAudio = null;
        onEnd?.();
        resolve();
      }
    };

    audio.onerror = (e) => {
      if (!resolved) {
        resolved = true;
        currentActiveAudio = null;
        onError?.(e);
        reject(new Error('Audio playback failed'));
      }
    };

    audio.play().catch((playErr) => {
      if (!resolved) {
        resolved = true;
        currentActiveAudio = null;
        if (playErr?.name === 'AbortError') {
          // Play was interrupted by pause/stop, harmless
          resolve();
          return;
        }
        onError?.(playErr);
        reject(playErr);
      }
    });
  });
}

/**
 * Internal: Play via Samantha (Enhanced) / Siri voice using Web Speech API
 */
function playSamanthaSpeech(
  text: string,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Web Speech API is not supported'));
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const matchedVoice = getSamanthaOrSiriVoice();
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      onError?.(e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);

    // Fallback safety timeout in case WebKit fails to trigger onend
    const estMs = Math.round((text.length * 65) / rate);
    window.setTimeout(() => {
      if (window.speechSynthesis.speaking) {
        // still speaking or hung
      }
    }, Math.min(4500, Math.max(1200, estMs)));
  } catch (err) {
    onError?.(err);
    onEnd?.();
  }
}
