import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Apple HIG Liquid Glass Error Boundary
 * Isolates runtime failures and prevents entire PWA crash to blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LexiSpeak System Guard] Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    // In browser context, attempt a clean reload if state recovery doesn't clear
    if (typeof window !== 'undefined') {
      try {
        window.location.reload();
      } catch {
        // Fallback
      }
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
          <div className="w-full max-w-md liquid-glass-regular rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200">
            {/* Shield / Alert Badge */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {this.props.fallbackTitle || 'Hệ thống đã tự động bảo vệ'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Đã phát hiện sự cố hiển thị giao diện. Dữ liệu học tập và hồ sơ của bạn vẫn được lưu trữ an toàn trong IndexedDB.
              </p>
            </div>

            {/* Diagnostic Details Accordion */}
            <div className="mb-6 rounded-2xl bg-slate-900/60 border border-white/5 overflow-hidden">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Mã chẩn đoán lỗi hệ thống
                </span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="p-3 bg-black/40 border-t border-white/5 text-[11px] font-mono text-rose-300/90 overflow-x-auto max-h-40 leading-relaxed select-all">
                  <div className="font-semibold text-rose-400 mb-1">
                    {this.state.error?.name}: {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <div className="text-slate-400 text-[10px] whitespace-pre-wrap">
                      {this.state.error.stack.slice(0, 500)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Khôi phục & Tiếp tục học</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
