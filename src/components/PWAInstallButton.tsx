import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  WifiOff,
  X,
  ShieldCheck,
  Volume2,
  Mic,
  Sun,
  Download,
} from 'lucide-react';
import { iOSHardwareManager, IOSHardwareSnapshot } from '../utils/iOSHardwareManager';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const ua = window.navigator.userAgent;
    const isIPadOS =
      navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const ios = (/iPad|iPhone|iPod/.test(ua) || isIPadOS) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIOSGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Show iOS Safari / standalone PWA guide modal
      setShowIOSGuide(true);
    }
  }, [deferredPrompt]);

  return {
    canInstall: !isInstalled,
    isInstalled,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    triggerInstall,
  };
}

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Ngoại tuyến (Offline)</span>
    </div>
  );
}

export const PWAInstallButton: React.FC<{
  onOpenBackupSection?: () => void;
}> = ({ onOpenBackupSection }) => {
  const { canInstall, isInstalled, showIOSGuide, setShowIOSGuide, triggerInstall } =
    usePWAInstall();

  const [hwState, setHwState] = useState<IOSHardwareSnapshot>(() =>
    iOSHardwareManager.getSnapshot()
  );

  useEffect(() => {
    return iOSHardwareManager.subscribe(setHwState);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        aria-label={
          isInstalled
            ? 'Đã cài đặt PWA (Xem thông số phần cứng)'
            : 'Cài đặt ứng dụng PWA lên iPhone'
        }
        className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all touch-target haptic-press shadow-2xs ${
          isInstalled
            ? 'material-thin text-emerald-600 dark:text-emerald-400'
            : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-sm'
        }`}
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">PWA Standalone</span>
            <span className="sm:hidden">PWA</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Cài App iPhone</span>
            <span className="sm:hidden">Cài App</span>
          </>
        )}
      </button>

      {/* iOS PWA Installation & Hardware Architecture Sheet (Functional Layer - Liquid Glass) */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-modal-title"
            className="relative w-full max-w-md liquid-glass-regular rounded-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.3)] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] dark:text-sky-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Native iOS WebKit Standalone Architecture</span>
                </div>
                <h3
                  id="ios-pwa-modal-title"
                  className="text-base sm:text-lg font-bold vibrancy-label font-serif-display mt-0.5"
                >
                  Cài Đặt Ứng Dụng Lên Màn Hình Chính iPhone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Đóng hướng dẫn"
                className="p-1.5 rounded-2xl material-thin vibrancy-secondary hover:vibrancy-label transition-all haptic-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Step iOS Safari Add to Home Screen Guide */}
            <ol className="space-y-2.5 text-xs">
              <li className="flex items-start gap-3 p-3 rounded-2xl material-thin">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0284C7] text-white font-bold text-xs">
                  1
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold vibrancy-label flex items-center gap-1.5">
                    <span>Nhấn biểu tượng Chia sẻ (Share) trên Safari</span>
                    <Share className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400" />
                  </div>
                  <p className="vibrancy-secondary">
                    Nằm ở thanh công cụ phía dưới màn hình iPhone.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl material-thin">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0284C7] text-white font-bold text-xs">
                  2
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold vibrancy-label flex items-center gap-1.5">
                    <span>Chọn “Thêm vào MH chính” (Add to Home Screen)</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="vibrancy-secondary">
                    Cuộn danh sách tùy chọn của Safari và nhấn vào mục có dấu cộng.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl material-thin">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  3
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold vibrancy-label flex items-center gap-1.5">
                    <span>Nhấn “Thêm” (Add) ở góc trên bên phải</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="vibrancy-secondary">
                    Mở LexiSpeak từ màn hình chính để chạy toàn màn hình (Standalone 120Hz ProMotion), Offline 100% và lưu trữ IndexedDB.
                  </p>
                </div>
              </li>
            </ol>

            {/* Live iOS WebKit Hardware & Media Lifecycle Status */}
            <div className="p-3.5 rounded-2xl material-thin space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold vibrancy-label">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Trạng Thái iOSHardwareManager & IndexedDB</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  ProMotion GPU
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl material-regular">
                  <div className="vibrancy-tertiary flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-sky-400" />
                    <span>WebAudio</span>
                  </div>
                  <div className="font-bold mt-1 vibrancy-label">
                    {hwState.audioUnlocked ? 'Đã Mở Khóa' : 'Chờ Chạm'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl material-regular">
                  <div className="vibrancy-tertiary flex items-center gap-1">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span>Mic Stream</span>
                  </div>
                  <div className="font-bold mt-1 vibrancy-label">
                    {hwState.micStreamReady ? 'Giữ Kết Nối' : 'Sẵn Sàng'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl material-regular">
                  <div className="vibrancy-tertiary flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>WakeLock</span>
                  </div>
                  <div className="font-bold mt-1 vibrancy-label">
                    {hwState.wakeLockActive ? 'Chống Tắt Màn' : 'Tự Động'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {onOpenBackupSection && (
                <button
                  type="button"
                  onClick={() => {
                    setShowIOSGuide(false);
                    onOpenBackupSection();
                  }}
                  className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline haptic-press"
                >
                  Sao lưu / Phục hồi JSON...
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="ml-auto px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all haptic-press shadow-sm"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
