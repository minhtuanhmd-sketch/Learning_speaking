import React, { useState, useEffect } from 'react';
import { Moon, Sun, Users, ChevronDown, Check, Volume2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types/sla';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton';
import { getCurrentVoiceOption, VoiceOptionId } from '../utils/speechVoiceManager';

export type ActiveTab = 'studio' | 'levels' | 'library' | 'matrix' | 'syntax' | 'profiles' | 'pedagogy';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  profiles: UserProfile[];
  activeProfile: UserProfile;
  onSelectProfile: (profileId: string) => void;
  onOpenVoiceSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenVoiceSettings,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<VoiceOptionId>(getCurrentVoiceOption());

  useEffect(() => {
    const handleVoiceChange = (e: Event) => {
      const custom = e as CustomEvent<VoiceOptionId>;
      if (custom.detail) {
        setCurrentVoice(custom.detail);
      }
    };
    window.addEventListener('lexispeak:voice_changed', handleVoiceChange);
    return () => window.removeEventListener('lexispeak:voice_changed', handleVoiceChange);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'studio', label: 'Luyện Tập', icon: '🎙️' },
    { id: 'levels', label: 'Trình Độ A2·B1·B2', icon: '🎯' },
    { id: 'library', label: '60 Mẫu Câu', icon: '📚' },
    { id: 'matrix', label: '20 Biến Thể', icon: '📋' },
    { id: 'syntax', label: 'Cú Pháp & Từ', icon: '✍️' },
    { id: 'profiles', label: 'Gia Đình', icon: '👨‍👩‍👧' },
    { id: 'pedagogy', label: 'Nguyên Lý SLA', icon: 'ℹ️' },
  ];

  return (
    <header className="shrink-0 sticky top-0 z-40 pt-safe transition-colors liquid-glass-regular border-b border-black/[0.08] dark:border-white/[0.12]">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 max-w-7xl mx-auto w-full">
        {/* Brand & Wordmark with Continuous Curves */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('studio');
            }}
            className="text-lg sm:text-xl font-bold tracking-tight vibrancy-label font-serif-display whitespace-nowrap haptic-press"
          >
            LexiSpeak VN
          </a>

          {/* Quick Profile Switcher Dropdown (Tôi, Vợ, Con) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-label="Chọn người học trong gia đình"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold material-thin hover:opacity-90 active:scale-[0.97] transition-all duration-150 vibrancy-label touch-target shadow-2xs"
            >
              <span className="text-base">{activeProfile.avatar}</span>
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{activeProfile.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-60 rounded-3xl liquid-glass-regular border border-black/[0.08] dark:border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.15)] py-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1 text-[11px] font-semibold vibrancy-tertiary uppercase tracking-wider">
                    Đổi người học (Không cần đăng nhập)
                  </div>
                  {profiles.map((p) => {
                    const isSelected = p.id === activeProfile.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectProfile(p.id);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors haptic-press ${
                          isSelected
                            ? 'bg-sky-500/15 text-[#0284C7] dark:text-sky-300'
                            : 'vibrancy-label hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{p.avatar}</span>
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] vibrancy-tertiary font-normal">
                            ({p.roleDescription})
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0284C7] dark:text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                  <div className="pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('profiles');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-[#0284C7] dark:text-sky-400 hover:underline flex items-center gap-1.5 haptic-press"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Quản lý hồ sơ gia đình...</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs — Segmented Liquid Glass Control */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-1 p-1 material-thin rounded-2xl"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 haptic-press ${
                  isActive
                    ? 'material-regular vibrancy-label shadow-xs'
                    : 'vibrancy-secondary hover:vibrancy-label'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action: Voice Selector, Offline status, iOS PWA Install & Hardware Modal, and Dark/Light Mode toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenVoiceSettings && (
            <button
              type="button"
              onClick={onOpenVoiceSettings}
              aria-label="Chọn giọng đọc TTS"
              title={`Đang dùng: ${
                currentVoice === 'gemini_audio'
                  ? 'Google Gemini Audio TTS'
                  : 'Samantha (Enhanced) / Siri Voice'
              }`}
              className="px-2.5 sm:px-3 py-1.5 rounded-2xl material-thin hover:opacity-90 active:scale-[0.97] transition-all duration-150 vibrancy-label text-xs font-semibold flex items-center gap-1.5 touch-target shadow-2xs"
            >
              {currentVoice === 'gemini_audio' ? (
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {currentVoice === 'gemini_audio' ? 'Gemini TTS' : 'Samantha'}
              </span>
            </button>
          )}
          <OfflineIndicator />
          <PWAInstallButton onOpenBackupSection={() => onSelectTab('profiles')} />
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-2xl material-thin hover:opacity-90 active:scale-[0.97] transition-all duration-150 vibrancy-label text-xs font-semibold flex items-center gap-1.5 touch-target shadow-2xs"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Tối</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="hidden sm:inline">Sáng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Top Navigation Tab Bar (Liquid Glass horizontal strip with smooth continuous curvature) */}
      <div className="md:hidden flex items-center gap-1 px-2.5 py-1.5 overflow-x-auto border-t border-black/[0.06] dark:border-white/[0.08] no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 touch-target haptic-press ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'vibrancy-secondary hover:vibrancy-label material-thin'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
