/**
 * iOSHardwareManager — Dedicated iOS WebKit Permission & Media Lifecycle Manager
 *
 * Engineered specifically for iPhone Safari / WebKit standalone PWA constraints:
 * 1. AudioContext Unlocker: One-time global user-gesture listener ('touchstart', 'pointerdown', 'click')
 *    that silently resumes webkitAudioContext / AudioContext and unlocks Web Audio & SpeechSynthesis.
 * 2. Persistent MediaStream (Microphone): Acquires navigator.mediaDevices.getUserMedia once per session
 *    and toggles MediaStreamTrack.enabled = true/false for active/mute states to prevent repeated
 *    iOS permission popups.
 * 3. Visibility & Screen WakeLock Handler: Acquires navigator.wakeLock.request('screen') to prevent
 *    iPhone screen dimming during speaking drills and listens to document.visibilitychange to
 *    cleanly re-acquire WakeLock and re-verify AudioContext/mic states when returning to the app.
 */

export interface IOSHardwareSnapshot {
  audioUnlocked: boolean;
  audioContextState: AudioContextState | 'uninitialized';
  micPermissionState: 'idle' | 'granted' | 'denied' | 'unsupported';
  micStreamReady: boolean;
  micTrackEnabled: boolean;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  isIOSDevice: boolean;
  isStandalonePWA: boolean;
}

type HardwareStateListener = (snapshot: IOSHardwareSnapshot) => void;

class IOSHardwareManagerService {
  private audioCtx: AudioContext | null = null;
  private audioUnlocked = false;
  private unlockListenersAttached = false;

  private persistentStream: MediaStream | null = null;
  private micPermissionState: 'idle' | 'granted' | 'denied' | 'unsupported' = 'idle';
  private micTrackEnabled = false;
  private analyserNode: AnalyserNode | null = null;
  private mediaSourceNode: MediaStreamAudioSourceNode | null = null;
  private frequencyBuffer: Uint8Array<ArrayBuffer> | null = null;

  private wakeLockSentinel: any = null;
  private shouldKeepWakeLock = true;
  private visibilityListenerAttached = false;

  private listeners = new Set<HardwareStateListener>();

  /**
   * Detect iPhone / iPad / iPod on iOS WebKit
   */
  public isIOS(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
    const isIPadOS =
      navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
    return isAppleMobile || isIPadOS;
  }

  /**
   * Detect if running in Standalone Full-Screen iOS Home Screen mode
   */
  public isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Initialize global one-time AudioContext unlocker and visibility/WakeLock lifecycle listeners.
   */
  public initLifecycle(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if (!this.unlockListenersAttached) {
      this.unlockListenersAttached = true;
      const unlockHandler = () => {
        this.unlockAudioContext();
      };
      window.addEventListener('touchstart', unlockHandler, { passive: true, once: true });
      window.addEventListener('pointerdown', unlockHandler, { passive: true, once: true });
      window.addEventListener('click', unlockHandler, { passive: true, once: true });
      window.addEventListener('keydown', unlockHandler, { passive: true, once: true });
    }

    if (!this.visibilityListenerAttached) {
      this.visibilityListenerAttached = true;
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange();
      });
    }

    // Attempt initial WakeLock request
    void this.requestWakeLock();
  }

  /**
   * 1. AudioContext Unlocker:
   * Resumes webkitAudioContext / AudioContext and plays a 1-frame silent buffer
   * to unlock iOS hardware audio output immediately upon user gesture.
   */
  public unlockAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      const AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) return null;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextCtor();
      }

      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      // Play a 1-frame silent buffer to unlock iOS WebKit audio hardware
      const buffer = this.audioCtx.createBuffer(1, 1, 22050);
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start(0);

      // Warm up iOS SpeechSynthesis engine silently if available
      if ('speechSynthesis' in window && !this.audioUnlocked) {
        try {
          const silentUtterance = new SpeechSynthesisUtterance('');
          silentUtterance.volume = 0;
          window.speechSynthesis.speak(silentUtterance);
        } catch {
          // ignore
        }
      }

      this.audioUnlocked = true;
      this.notifyListeners();
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * 2. Persistent MediaStream (Microphone):
   * Requests getUserMedia({ audio }) ONLY ONCE per session and caches the MediaStream.
   * Subsequent calls reuse the live stream and toggle `track.enabled` to avoid repeated iOS prompts.
   */
  public async acquirePersistentMicStream(enableImmediately = true): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.micPermissionState = 'unsupported';
      this.notifyListeners();
      return null;
    }

    // Ensure AudioContext is unlocked
    this.unlockAudioContext();

    // Check if our cached stream is still active with live tracks
    if (this.persistentStream) {
      const tracks = this.persistentStream.getAudioTracks();
      const hasLiveTrack = tracks.some((t) => t.readyState === 'live');
      if (hasLiveTrack) {
        this.setMicTrackEnabled(enableImmediately);
        return this.persistentStream;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.persistentStream = stream;
      this.micPermissionState = 'granted';

      // Set initial track.enabled state
      this.setMicTrackEnabled(enableImmediately);

      // Connect stream to AnalyserNode for 60fps real-time waveform visualization
      if (this.audioCtx) {
        try {
          this.analyserNode = this.audioCtx.createAnalyser();
          this.analyserNode.fftSize = 64;
          this.analyserNode.smoothingTimeConstant = 0.75;
          this.mediaSourceNode = this.audioCtx.createMediaStreamSource(stream);
          this.mediaSourceNode.connect(this.analyserNode);
          this.frequencyBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);
        } catch {
          // ignore analyser setup error
        }
      }

      this.notifyListeners();
      return stream;
    } catch {
      this.micPermissionState = 'denied';
      this.micTrackEnabled = false;
      this.notifyListeners();
      return null;
    }
  }

  /**
   * Toggle persistent microphone tracks via `track.enabled = true/false`
   * without stopping the stream or re-triggering iOS WebKit permission dialogs.
   */
  public setMicTrackEnabled(enabled: boolean): void {
    this.micTrackEnabled = enabled;
    if (this.persistentStream) {
      const tracks = this.persistentStream.getAudioTracks();
      tracks.forEach((track) => {
        track.enabled = enabled;
      });
    }
    this.notifyListeners();
  }

  /**
   * Sample normalized [0.15 .. 1.0] frequency bar levels from the persistent mic stream
   * for GPU-accelerated AudioWaveform rendering.
   */
  public sampleMicWaveformLevels(barCount = 28): number[] | null {
    if (!this.analyserNode || !this.frequencyBuffer || !this.micTrackEnabled) {
      return null;
    }
    try {
      this.analyserNode.getByteFrequencyData(this.frequencyBuffer);
      const result: number[] = [];
      const binLen = this.frequencyBuffer.length;
      for (let i = 0; i < barCount; i++) {
        const idx = Math.min(binLen - 1, Math.floor((i / barCount) * (binLen * 0.75)));
        const normalized = this.frequencyBuffer[idx] / 255;
        result.push(Math.max(0.15, Math.min(0.98, 0.15 + normalized * 0.85)));
      }
      return result;
    } catch {
      return null;
    }
  }

  /**
   * 3. Screen Wake Lock API:
   * Prevents the iPhone screen from dimming during active Cloze / Speaking drills.
   */
  public async requestWakeLock(): Promise<boolean> {
    this.shouldKeepWakeLock = true;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      this.notifyListeners();
      return false;
    }

    try {
      if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
        this.notifyListeners();
        return true;
      }
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.addEventListener('release', () => {
          this.notifyListeners();
        });
      }
      this.notifyListeners();
      return true;
    } catch {
      this.notifyListeners();
      return false;
    }
  }

  public async releaseWakeLock(): Promise<void> {
    this.shouldKeepWakeLock = false;
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
      this.notifyListeners();
    }
  }

  /**
   * Visibility Change Handler:
   * When the user switches back to the app on iOS, cleanly re-acquire the Screen WakeLock
   * and verify/resume the AudioContext & persistent MediaStream state.
   */
  private handleVisibilityChange(): void {
    if (typeof document === 'undefined') return;

    if (document.visibilityState === 'visible') {
      // 1. Re-acquire WakeLock if active
      if (this.shouldKeepWakeLock) {
        void this.requestWakeLock();
      }

      // 2. Re-verify and resume AudioContext if iOS suspended it in background
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume().then(() => this.notifyListeners());
      }

      // 3. Re-verify persistent MediaStream tracks
      if (this.persistentStream) {
        const tracks = this.persistentStream.getAudioTracks();
        const allEnded = tracks.length > 0 && tracks.every((t) => t.readyState === 'ended');
        if (allEnded) {
          this.persistentStream = null;
          this.micTrackEnabled = false;
        } else {
          tracks.forEach((t) => {
            t.enabled = this.micTrackEnabled;
          });
        }
      }
      this.notifyListeners();
    } else {
      // App moved to background: mute mic track for privacy while preserving stream handle
      if (this.persistentStream && this.micTrackEnabled) {
        this.setMicTrackEnabled(false);
      }
    }
  }

  public getSnapshot(): IOSHardwareSnapshot {
    const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    const hasLiveTracks =
      Boolean(this.persistentStream) &&
      this.persistentStream!.getAudioTracks().some((t) => t.readyState === 'live');

    return {
      audioUnlocked: this.audioUnlocked,
      audioContextState: this.audioCtx ? this.audioCtx.state : 'uninitialized',
      micPermissionState: this.micPermissionState,
      micStreamReady: hasLiveTracks,
      micTrackEnabled: hasLiveTracks && this.micTrackEnabled,
      wakeLockActive: Boolean(this.wakeLockSentinel && !this.wakeLockSentinel.released),
      wakeLockSupported,
      isIOSDevice: this.isIOS(),
      isStandalonePWA: this.isStandalone(),
    };
  }

  public subscribe(listener: HardwareStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const iOSHardwareManager = new IOSHardwareManagerService();
