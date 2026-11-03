import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Volume2,
  Lock,
  Unlock,
  Award,
  RotateCcw,
  Edit3,
  Mic,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  HelpCircle,
  Play,
} from 'lucide-react';
import { SENTENCE_PATTERNS } from './data/patternsData';
import {
  CEFRLevel,
  SentencePattern,
  SentenceProgress,
  SentenceVariation,
  SpeakingEvaluationSummary,
  UserProfile,
} from './types/sla';
import { computeSequentialRoadmap } from './utils/progressionLogic';
import { TopBar, ActiveTab } from './components/TopBar';
import { ClozeExerciseCard } from './components/ClozeExerciseCard';
import { SpeakingDrillCard } from './components/SpeakingDrillCard';
import { SocraticArchitectureView } from './components/SocraticArchitectureView';
import { FamilyProfileManager } from './components/FamilyProfileManager';
import {
  CustomPatternOverride,
  SyntaxLexicalUpdaterModal,
} from './components/SyntaxLexicalUpdaterModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { playSpeech } from './utils/speechVoiceManager';
import { iOSHardwareManager } from './utils/iOSHardwareManager';
import {
  indexedDBStorage,
  validateAndParseBackupJson,
} from './utils/indexedDBStorage';

const PROFILES_STORAGE_KEY = 'lexispeak_vn_family_profiles_v2';
const ACTIVE_PROFILE_ID_KEY = 'lexispeak_vn_active_profile_id_v2';
const THEME_STORAGE_KEY = 'lexispeak_vn_dark_mode_v1';

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'toi',
    name: 'Tôi',
    avatar: '👨‍💼',
    roleDescription: 'Người dùng chính',
    targetLevel: 'A2',
    createdAt: 1700000000000,
  },
  {
    id: 'vo',
    name: 'Vợ',
    avatar: '👩‍💼',
    roleDescription: 'Vợ / Bạn đời',
    targetLevel: 'A2',
    createdAt: 1700000000001,
  },
  {
    id: 'con',
    name: 'Con',
    avatar: '🧑‍🎓',
    roleDescription: 'Con / Học sinh',
    targetLevel: 'A2',
    createdAt: 1700000000002,
  },
];

const THEMATIC_GROUP_SHORT_LABELS: Record<CEFRLevel, Record<number, string>> = {
  A2: {
    1: '1. Chào hỏi & Làm quen (1–10)',
    2: '2. Hỏi & Xác nhận (11–20)',
    3: '3. Nhờ hỗ trợ văn phòng (21–30)',
    4: '4. Lịch hẹn, Điện thoại, Email (31–40)',
    5: '5. Báo cáo tiến độ & Thời gian (41–50)',
    6: '6. Đời sống & Công tác (51–60)',
  },
  B1: {
    1: '1. Quan điểm & Phản biện (1–10)',
    2: '2. Họp hành & Thảo luận (11–20)',
    3: '3. Tuyển dụng & Nhân sự (21–30)',
    4: '4. Xử lý sự cố phát sinh (31–40)',
    5: '5. Email & Liên phòng ban (41–50)',
    6: '6. Giao tiếp mở rộng (51–60)',
  },
  B2: {
    1: '1. Điều hành họp & Thuyết trình (1–10)',
    2: '2. Đàm phán & Thương lượng (11–20)',
    3: '3. Đánh giá & Quản trị nhân sự (21–30)',
    4: '4. Quản lý dự án & Báo cáo KPI (31–40)',
    5: '5. Xử lý khủng hoảng & Ngoại giao (41–50)',
    6: '6. Chiến lược & Phân tích sâu (51–60)',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [studioSubMode, setStudioSubMode] = useState<'cloze' | 'speaking'>('cloze');

  // Multi-user Profiles (Tôi, Vợ, Con)
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'toi';
  });

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, activeProfileId]);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return true;
  });

  // Current level and pattern state per active user profile
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(() => {
    try {
      const saved = localStorage.getItem(`lexispeak_level_${activeProfileId}`);
      if (saved === 'A2' || saved === 'B1' || saved === 'B2') return saved;
    } catch {
      // ignore
    }
    return activeProfile.targetLevel || 'A2';
  });

  const [selectedPatternId, setSelectedPatternId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`lexispeak_pattern_${activeProfileId}`);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return SENTENCE_PATTERNS[0].id;
  });

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0); // 0 to 19
  const [enforceSequentialLock, setEnforceSequentialLock] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`lexispeak_seq_${activeProfileId}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return false;
  });
  const [isUpdaterModalOpen, setIsUpdaterModalOpen] = useState<boolean>(false);
  const [selectedThematicGroup, setSelectedThematicGroup] = useState<number | 'ALL'>(1);
  const [patternSearchQuery, setPatternSearchQuery] = useState<string>('');
  const [levelBannerNote, setLevelBannerNote] = useState<string | null>(null);

  // Progress Map per active profile
  const [progressMap, setProgressMap] = useState<Record<string, SentenceProgress>>(() => {
    try {
      const raw = localStorage.getItem(`lexispeak_progress_${activeProfileId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {};
  });

  // Custom Overrides per active profile
  const [customOverrides, setCustomOverrides] = useState<Record<string, CustomPatternOverride>>(() => {
    try {
      const raw = localStorage.getItem(`lexispeak_overrides_${activeProfileId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {};
  });

  // Initialize iOSHardwareManager (AudioContext unlocker + Visibility/WakeLock lifecycle)
  // and hydrate from IndexedDB on initial mount
  useEffect(() => {
    iOSHardwareManager.initLifecycle();

    void indexedDBStorage.hydrateInitialAppState(DEFAULT_PROFILES).then((hydrated) => {
      if (!hydrated) return;
      if (hydrated.profiles && hydrated.profiles.length > 0) {
        setProfiles(hydrated.profiles);
      }
      if (hydrated.progressMap && Object.keys(hydrated.progressMap).length > 0) {
        setProgressMap((prev) => ({ ...hydrated.progressMap, ...prev }));
      }
      if (hydrated.customOverrides && Object.keys(hydrated.customOverrides).length > 0) {
        setCustomOverrides((prev) => ({ ...hydrated.customOverrides, ...prev }));
      }
    });
  }, []);

  // Sync active profile state changes to localStorage & IndexedDB
  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // ignore
    }
    void indexedDBStorage.saveProfiles(profiles, activeProfileId, isDarkMode);
  }, [profiles, activeProfileId, isDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PROFILE_ID_KEY, activeProfileId);
    } catch {
      // ignore
    }
    // Reload user-specific data from localStorage first, then merge IndexedDB
    try {
      const rawProg = localStorage.getItem(`lexispeak_progress_${activeProfileId}`);
      setProgressMap(rawProg ? JSON.parse(rawProg) : {});

      const rawOver = localStorage.getItem(`lexispeak_overrides_${activeProfileId}`);
      setCustomOverrides(rawOver ? JSON.parse(rawOver) : {});

      const savedLvl = localStorage.getItem(`lexispeak_level_${activeProfileId}`);
      if (savedLvl === 'A2' || savedLvl === 'B1' || savedLvl === 'B2') {
        setSelectedLevel(savedLvl);
      }

      const savedSeq = localStorage.getItem(`lexispeak_seq_${activeProfileId}`);
      if (savedSeq !== null) {
        setEnforceSequentialLock(JSON.parse(savedSeq));
      }

      const savedPat = localStorage.getItem(`lexispeak_pattern_${activeProfileId}`);
      if (savedPat) setSelectedPatternId(savedPat);
      setCurrentSentenceIndex(0);
      setStudioSubMode('cloze');
    } catch {
      // ignore
    }

    void indexedDBStorage.loadProfileBundle(activeProfileId).then((bundle) => {
      if (bundle.progressMap && Object.keys(bundle.progressMap).length > 0) {
        setProgressMap((prev) => ({ ...bundle.progressMap, ...prev }));
      }
      if (bundle.customOverrides && Object.keys(bundle.customOverrides).length > 0) {
        setCustomOverrides((prev) => ({ ...bundle.customOverrides, ...prev }));
      }
    });
  }, [activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lexispeak_progress_${activeProfileId}`, JSON.stringify(progressMap));
    } catch {
      // ignore
    }
    void indexedDBStorage.saveProfileProgress(activeProfileId, progressMap);
  }, [progressMap, activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lexispeak_overrides_${activeProfileId}`, JSON.stringify(customOverrides));
    } catch {
      // ignore
    }
    void indexedDBStorage.saveProfileOverrides(activeProfileId, customOverrides);
  }, [customOverrides, activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(`lexispeak_level_${activeProfileId}`, selectedLevel);
      localStorage.setItem(`lexispeak_seq_${activeProfileId}`, JSON.stringify(enforceSequentialLock));
      localStorage.setItem(`lexispeak_pattern_${activeProfileId}`, selectedPatternId);
    } catch {
      // ignore
    }
    void indexedDBStorage.saveProfileSettings(activeProfileId, {
      selectedLevel,
      selectedPatternId,
      enforceSequentialLock,
    });
  }, [selectedLevel, enforceSequentialLock, selectedPatternId, activeProfileId]);

  // Dark Mode html class
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isDarkMode));
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Merge base patterns with active user custom overrides
  const mergedPatterns: SentencePattern[] = useMemo(() => {
    return SENTENCE_PATTERNS.map((pat) => {
      const override = customOverrides[pat.id];
      if (!override) return pat;
      const mergedSentences = pat.sentences.map((s) => {
        const varOverride = override.variationOverrides?.[s.index];
        return varOverride ? { ...s, ...varOverride } : s;
      });
      return {
        ...pat,
        patternTitle: override.patternTitle || pat.patternTitle,
        formula: override.formula || pat.formula,
        vietnameseMeaning: override.vietnameseMeaning || pat.vietnameseMeaning,
        pragmaticUsage: override.pragmaticUsage || pat.pragmaticUsage,
        sentences: mergedSentences,
      };
    });
  }, [customOverrides]);

  const roadmap = useMemo(() => {
    return computeSequentialRoadmap(
      mergedPatterns,
      progressMap,
      enforceSequentialLock
    );
  }, [mergedPatterns, progressMap, enforceSequentialLock]);

  const patternsForSelectedLevel = useMemo(() => {
    return mergedPatterns.filter((p) => p.cefrLevel === selectedLevel);
  }, [mergedPatterns, selectedLevel]);

  const filteredPatternsForDisplay = useMemo(() => {
    const q = patternSearchQuery.trim().toLowerCase();
    return patternsForSelectedLevel.filter((p) => {
      const matchesGroup =
        selectedThematicGroup === 'ALL' ||
        p.thematicGroupId === selectedThematicGroup;
      if (!matchesGroup) return false;
      if (!q) return true;
      return (
        p.patternTitle.toLowerCase().includes(q) ||
        p.vietnameseMeaning.toLowerCase().includes(q) ||
        p.formula.toLowerCase().includes(q) ||
        String(p.patternNumberInLevel).includes(q)
      );
    });
  }, [patternsForSelectedLevel, selectedThematicGroup, patternSearchQuery]);

  const activePattern: SentencePattern = useMemo(() => {
    return (
      mergedPatterns.find((p) => p.id === selectedPatternId) ||
      patternsForSelectedLevel[0] ||
      mergedPatterns[0]
    );
  }, [mergedPatterns, selectedPatternId, patternsForSelectedLevel]);

  const currentVariation: SentenceVariation = useMemo(() => {
    return (
      activePattern.sentences[currentSentenceIndex] || activePattern.sentences[0]
    );
  }, [activePattern, currentSentenceIndex]);

  const currentProgress: SentenceProgress = useMemo(() => {
    return (
      progressMap[currentVariation.id] || {
        sentenceId: currentVariation.id,
        clozeCompleted: false,
        clozeAttempts: 0,
        speakingCompleted: false,
        bestSpeakingScore: 0,
      }
    );
  }, [progressMap, currentVariation.id]);

  const patternMetrics = useMemo(() => {
    const st = roadmap.patternStatsMap[activePattern.id];
    return {
      clozeDone: st?.clozeCompletedCount || 0,
      speakingDone: st?.speakingCompletedCount || 0,
      avgScore: st?.averageScore || 0,
      isMastered: st?.isMastered || false,
    };
  }, [roadmap, activePattern.id]);

  // Switch Active Profile (Tôi, Vợ, Con)
  const handleSelectProfile = (pId: string) => {
    setActiveProfileId(pId);
  };

  const handleAddProfile = (
    name: string,
    avatar: string,
    relation: string,
    targetLevel: CEFRLevel
  ) => {
    const newId = `user_${Date.now()}`;
    const newProfile: UserProfile = {
      id: newId,
      name,
      avatar,
      roleDescription: relation,
      targetLevel,
      createdAt: Date.now(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
  };

  const handleUpdateProfile = (profileId: string, updates: Partial<UserProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, ...updates } : p))
    );
  };

  const getProfileStats = (profileId: string) => {
    try {
      const raw = localStorage.getItem(`lexispeak_progress_${profileId}`);
      if (raw) {
        const pMap: Record<string, SentenceProgress> = JSON.parse(raw);
        const entries = Object.values(pMap);
        const speakingEntries = entries.filter((e) => e.speakingCompleted);
        const sumScores = speakingEntries.reduce((acc, cur) => acc + cur.bestSpeakingScore, 0);
        return {
          completedSentences: entries.filter((e) => e.clozeCompleted).length,
          speakingCount: speakingEntries.length,
          averageScore: speakingEntries.length > 0 ? Math.round(sumScores / speakingEntries.length) : 0,
          masteredCount: speakingEntries.filter((e) => e.bestSpeakingScore >= 85).length,
        };
      }
    } catch {
      // ignore
    }
    return {
      completedSentences: 0,
      speakingCount: 0,
      averageScore: 0,
      masteredCount: 0,
    };
  };

  const handleSelectLevel = (level: CEFRLevel, forceUnlock = false) => {
    const summary = roadmap.levelSummaries[level];
    if (enforceSequentialLock && !forceUnlock && summary && !summary.isUnlocked) {
      setLevelBannerNote(
        `${summary.unlockRequirementVi} (Hoặc nhấn "Chuyển sang Học Tự Do" để mở khóa ngay trình độ ${level}).`
      );
      return;
    }
    setLevelBannerNote(null);
    setSelectedLevel(level);
    setSelectedThematicGroup(1);
    const firstPatternInLevel = mergedPatterns.find((p) => p.cefrLevel === level);
    if (firstPatternInLevel) {
      setSelectedPatternId(firstPatternInLevel.id);
      setCurrentSentenceIndex(0);
      setStudioSubMode('cloze');
    }
  };

  const handleSelectPattern = (pattern: SentencePattern) => {
    setSelectedLevel(pattern.cefrLevel);
    if (pattern.thematicGroupId && selectedThematicGroup !== 'ALL') {
      setSelectedThematicGroup(pattern.thematicGroupId);
    }
    setSelectedPatternId(pattern.id);
    setCurrentSentenceIndex(0);
    setStudioSubMode('cloze');
    setActiveTab('studio');
  };

  const handleStepPattern = (delta: number) => {
    const idx = patternsForSelectedLevel.findIndex((p) => p.id === activePattern.id);
    if (idx === -1) return;
    const nextIdx = Math.max(0, Math.min(patternsForSelectedLevel.length - 1, idx + delta));
    const targetPattern = patternsForSelectedLevel[nextIdx];
    if (targetPattern) {
      handleSelectPattern(targetPattern);
    }
  };

  const handleClozeUnlock = (attempts: number) => {
    setProgressMap((prev) => {
      const existing = prev[currentVariation.id];
      return {
        ...prev,
        [currentVariation.id]: {
          sentenceId: currentVariation.id,
          clozeCompleted: true,
          clozeAttempts: (existing?.clozeAttempts || 0) + attempts,
          speakingCompleted: existing?.speakingCompleted || false,
          bestSpeakingScore: existing?.bestSpeakingScore || 0,
          lastTranscript: existing?.lastTranscript,
        },
      };
    });
  };

  const handleSpeakingComplete = (summary: SpeakingEvaluationSummary) => {
    setProgressMap((prev) => {
      const existing = prev[currentVariation.id];
      const bestScore = Math.max(existing?.bestSpeakingScore || 0, summary.overallScore);
      return {
        ...prev,
        [currentVariation.id]: {
          sentenceId: currentVariation.id,
          clozeCompleted: true,
          clozeAttempts: existing?.clozeAttempts || 1,
          speakingCompleted: true,
          bestSpeakingScore: bestScore,
          lastTranscript: summary.transcript,
        },
      };
    });
  };

  const handleAdvanceNextStep = () => {
    if (currentSentenceIndex < 19) {
      setCurrentSentenceIndex((prev) => prev + 1);
      setStudioSubMode('cloze');
      return;
    }

    const currentGlobalIdx = mergedPatterns.findIndex((p) => p.id === activePattern.id);
    if (currentGlobalIdx !== -1 && currentGlobalIdx < mergedPatterns.length - 1) {
      const nextPattern = mergedPatterns[currentGlobalIdx + 1];
      setSelectedLevel(nextPattern.cefrLevel);
      if (nextPattern.thematicGroupId && selectedThematicGroup !== 'ALL') {
        setSelectedThematicGroup(nextPattern.thematicGroupId);
      }
      setSelectedPatternId(nextPattern.id);
      setCurrentSentenceIndex(0);
      setStudioSubMode('cloze');
    }
  };

  const handleSavePatternSyntax = (
    patternId: string,
    updates: {
      patternTitle: string;
      formula: string;
      vietnameseMeaning: string;
      pragmaticUsage: string;
    }
  ) => {
    setCustomOverrides((prev) => ({
      ...prev,
      [patternId]: {
        ...prev[patternId],
        ...updates,
      },
    }));
  };

  const handleSaveVariationLexical = (
    patternId: string,
    variationIndex: number,
    updates: Partial<SentenceVariation>
  ) => {
    setCustomOverrides((prev) => {
      const existingPat = prev[patternId] || {};
      const existingVars = existingPat.variationOverrides || {};
      return {
        ...prev,
        [patternId]: {
          ...existingPat,
          variationOverrides: {
            ...existingVars,
            [variationIndex]: {
              ...(existingVars[variationIndex] || {}),
              ...updates,
            },
          },
        },
      };
    });
  };

  const handleResetPatternOverrides = (patternId: string) => {
    setCustomOverrides((prev) => {
      const copy = { ...prev };
      delete copy[patternId];
      return copy;
    });
  };

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleSpeakQuick = (sentenceText: string) => {
    void playSpeech({
      text: sentenceText,
      rate: 1.0,
    });
  };

  const levels: CEFRLevel[] = ['A2', 'B1', 'B2'];

  const levelDescriptions: Record<
    CEFRLevel,
    { title: string; subtitle: string; badgeColor: string }
  > = {
    A2: {
      title: 'CEFR A2 — Elementary (Sơ Cấp)',
      subtitle:
        'Giao tiếp cơ bản & tác nghiệp hàng ngày tại văn phòng (Chào hỏi, hỏi thông tin, nhờ hỗ trợ, lịch hẹn, báo cáo tiến độ).',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    B1: {
      title: 'CEFR B1 — Intermediate (Trung Cấp)',
      subtitle:
        'Thảo luận công việc, trình bày quan điểm, phản biện lịch sự, phỏng vấn nhân sự & xử lý sự cố phát sinh.',
      badgeColor: 'bg-sky-100 dark:bg-sky-950/80 text-[#0284C7] dark:text-sky-300 border-sky-300 dark:border-sky-800',
    },
    B2: {
      title: 'CEFR B2 — Upper-Intermediate (Trung Cao Cấp)',
      subtitle:
        'Điều hành cuộc họp, đàm phán thương lượng, quản trị dự án KPI, xử lý khủng hoảng & phân tích chiến lược chuyên sâu.',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
  };

  return (
    <div className={`h-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col h-full bg-[#F2F2F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-white transition-colors overflow-hidden">
        {/* Functional Layer: Floating Liquid Glass TopBar */}
        <TopBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
        />

        {/* Content Layer: Main Container with Standard Materials */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* TAB 1: 🎙️ LUYỆN TẬP (Bước 1: Điền Từ Cloze → Bước 2: Luyện Nói & Chấm Điểm) */}
          {activeTab === 'studio' && (
            <div className="h-full flex flex-col p-2.5 sm:p-4 md:p-6 overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col max-w-5xl mx-auto w-full gap-3">
                {/* Compact Context Banner: Standard Regular Material with Continuous Curves */}
                <div className="shrink-0 p-3 sm:p-4 material-regular rounded-3xl shadow-sm flex flex-col gap-2.5">
                  {/* Row 1: Quick CEFR Level Pills (A2 | B1 | B2) + Sequential Mode Switch + Pattern Nav */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Quick CEFR Level Selector Pills (Segmented Material Control) */}
                      <div
                        className="inline-flex items-center p-1 rounded-2xl material-thin shrink-0"
                        role="group"
                        aria-label="Chọn trình độ CEFR"
                      >
                        {levels.map((lvl) => {
                          const isSelected = activePattern.cefrLevel === lvl;
                          const lvlSum = roadmap.levelSummaries[lvl];
                          const isLocked = enforceSequentialLock && lvlSum && !lvlSum.isUnlocked;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleSelectLevel(lvl)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all haptic-press ${
                                isSelected
                                  ? 'material-regular vibrancy-label shadow-xs'
                                  : isLocked
                                  ? 'vibrancy-tertiary hover:vibrancy-secondary'
                                  : 'vibrancy-secondary hover:vibrancy-label'
                              }`}
                            >
                              {isLocked && <Lock className="w-2.5 h-2.5" />}
                              <span>{lvl}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Sequential vs Free Mode Quick Pill */}
                      <button
                        type="button"
                        onClick={() => {
                          setEnforceSequentialLock((prev) => !prev);
                          setLevelBannerNote(null);
                        }}
                        title="Chuyển đổi giữa Học tuần tự (A2→B1→B2) và Học tự do"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[11px] font-semibold border transition-all shrink-0 haptic-press ${
                          enforceSequentialLock
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {enforceSequentialLock ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Tuần tự</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Tự do</span>
                          </>
                        )}
                      </button>

                      {/* Pattern Title on Desktop */}
                      <span className="hidden md:inline text-xs sm:text-sm font-bold vibrancy-label truncate max-w-md">
                        Mẫu #{activePattern.patternNumberInLevel}/60: {activePattern.formula}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepPattern(-1)}
                        disabled={(activePattern.patternNumberInLevel || 1) <= 1}
                        aria-label="Mẫu câu trước"
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-2xl material-thin vibrancy-label hover:opacity-90 disabled:opacity-30 haptic-press"
                      >
                        ← Mẫu #{Math.max(1, (activePattern.patternNumberInLevel || 1) - 1)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepPattern(1)}
                        disabled={(activePattern.patternNumberInLevel || 1) >= 60}
                        aria-label="Mẫu câu kế tiếp"
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-2xl material-thin vibrancy-label hover:opacity-90 disabled:opacity-30 haptic-press"
                      >
                        Mẫu #{Math.min(60, (activePattern.patternNumberInLevel || 1) + 1)} →
                      </button>
                    </div>
                  </div>

                  {/* Mobile Pattern Title Line */}
                  <div className="md:hidden text-xs font-bold vibrancy-label truncate">
                    Mẫu #{activePattern.patternNumberInLevel}/60 ({activePattern.cefrLevel}): {activePattern.formula}
                  </div>

                  {/* Optional Sequential Lock Notice Banner */}
                  {levelBannerNote && (
                    <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 dark:text-amber-200">
                      <span>{levelBannerNote}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEnforceSequentialLock(false);
                            setLevelBannerNote(null);
                          }}
                          className="px-3 py-1 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 haptic-press shadow-2xs"
                        >
                          Chuyển sang Học Tự Do
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('levels')}
                          className="underline font-semibold haptic-press"
                        >
                          Xem Thẻ Trình Độ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 20-Variation Horizontal Strip (1-20) */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-x-auto flex items-center gap-1.5 py-0.5 no-scrollbar">
                      {activePattern.sentences.map((s, idx) => {
                        const isCurrent = idx === currentSentenceIndex;
                        const prog = progressMap[s.id];
                        const isSpeakingDone = prog?.speakingCompleted;
                        const isClozeDone = prog?.clozeCompleted;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setCurrentSentenceIndex(idx);
                              setStudioSubMode('cloze');
                            }}
                            aria-label={`Biến thể ${s.index}/20`}
                            className={`h-7.5 min-w-[36px] px-2.5 rounded-xl font-mono text-xs font-bold tabular-nums transition-all flex items-center justify-center shrink-0 haptic-press ${
                              isCurrent
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-black scale-105 shadow-xs'
                                : isSpeakingDone
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : isClozeDone
                                ? 'bg-sky-500/15 text-[#0284C7] dark:text-sky-300 border border-sky-500/30'
                                : 'material-thin vibrancy-secondary hover:vibrancy-label'
                            }`}
                          >
                            #{s.index}
                          </button>
                        );
                      })}
                    </div>

                    {/* Stepper Arrow Nav */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={currentSentenceIndex === 0}
                        onClick={() => {
                          setCurrentSentenceIndex((prev) => Math.max(0, prev - 1));
                          setStudioSubMode('cloze');
                        }}
                        aria-label="Biến thể trước"
                        className="p-2 rounded-xl material-thin vibrancy-label hover:opacity-90 disabled:opacity-30 touch-target haptic-press"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleAdvanceNextStep}
                        aria-label="Biến thể kế tiếp"
                        className="p-2 rounded-xl material-thin vibrancy-label hover:opacity-90 touch-target haptic-press"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-mode Tab Toggle: Bước 1 (Điền Từ Cloze) ĐỨNG TRƯỚC Bước 2 (Luyện Nói & Chấm Điểm) */}
                <div className="shrink-0 flex items-center justify-between gap-2 px-1">
                  <div className="inline-flex p-1 rounded-2xl material-thin">
                    {/* BƯỚC 1: ĐIỀN TỪ CLOZE (Đứng trước bên trái) */}
                    <button
                      type="button"
                      onClick={() => setStudioSubMode('cloze')}
                      className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all touch-target haptic-press ${
                        studioSubMode === 'cloze'
                          ? 'material-regular vibrancy-label shadow-xs'
                          : 'vibrancy-secondary hover:vibrancy-label'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        1. ✍️ Điền Từ Cloze ({currentProgress.clozeCompleted ? 'Đã Xong' : 'Chưa Điền'})
                      </span>
                    </button>

                    {/* BƯỚC 2: LUYỆN NÓI & CHẤM ĐIỂM (Đứng sau bên phải) */}
                    <button
                      type="button"
                      onClick={() => setStudioSubMode('speaking')}
                      className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all touch-target haptic-press ${
                        studioSubMode === 'speaking'
                          ? 'material-regular vibrancy-label shadow-xs'
                          : 'vibrancy-secondary hover:vibrancy-label'
                      }`}
                    >
                      {enforceSequentialLock && !currentProgress.clozeCompleted ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-300 shrink-0" />
                      )}
                      <span>2. 🎙️ Luyện Nói & Chấm Điểm</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('levels')}
                      title="Chọn trình độ A2, B1, B2 & Chế độ học tuần tự"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-2xl material-thin vibrancy-label hover:opacity-90 touch-target haptic-press"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400" />
                      <span className="hidden md:inline">Trình Độ A2·B1·B2</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsUpdaterModalOpen(true)}
                      aria-label="Sửa cú pháp và từ vựng"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-2xl material-thin text-[#0284C7] dark:text-sky-300 hover:opacity-90 touch-target haptic-press"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sửa Câu</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Card Content Container */}
                <div className="flex-1 min-h-0 overflow-y-auto rounded-3xl">
                  {studioSubMode === 'cloze' ? (
                    <ClozeExerciseCard
                      variation={currentVariation}
                      isUnlocked={currentProgress.clozeCompleted}
                      onUnlockSuccess={handleClozeUnlock}
                      onProceedToSpeaking={() => setStudioSubMode('speaking')}
                    />
                  ) : (
                    <SpeakingDrillCard
                      variation={currentVariation}
                      cefrLevel={activePattern.cefrLevel}
                      isUnlocked={!enforceSequentialLock || currentProgress.clozeCompleted}
                      onEvaluationComplete={handleSpeakingComplete}
                      onNextSentence={handleAdvanceNextStep}
                      hasNextSentence={true}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB MỚI: 🎯 TRÌNH ĐỘ A2 · B1 · B2 & TÙY CHỌN HỌC TUẦN TỰ HOẶC TỰ DO */}
          {activeTab === 'levels' && (
            <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto">
              <div className="max-w-5xl mx-auto w-full space-y-4 pb-6">
                {/* Card 1: Chế độ học Tuần tự vs Tự do */}
                <div className="p-5 sm:p-6 material-regular rounded-3xl space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] dark:text-sky-400">
                        <Layers className="w-4 h-4" />
                        <span>Lộ Trình CEFR A2 · B1 · B2 (180 Mẫu Câu · 3,600 Câu Giao Tiếp)</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold vibrancy-label font-serif-display mt-1">
                        Chọn Trình Độ & Chế Độ Học Tập
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('studio')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] dark:bg-sky-600 rounded-2xl hover:bg-[#0369A1] self-start sm:self-auto haptic-press shadow-sm"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Quay Lại Phòng Luyện Tập ({selectedLevel})</span>
                    </button>
                  </div>

                  {/* 2 Option Cards: Học Tự Do vs Học Tuần Tự */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        setEnforceSequentialLock(false);
                        setLevelBannerNote(null);
                      }}
                      className={`p-4 rounded-2xl text-left transition-all flex items-start gap-3.5 haptic-press ${
                        !enforceSequentialLock
                          ? 'material-regular ring-2 ring-emerald-500 border-emerald-500/40 shadow-sm'
                          : 'material-thin hover:opacity-90'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <Unlock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold vibrancy-label">
                            Chế Độ Học Tự Do (Mở Khóa A2, B1, B2)
                          </span>
                          {!enforceSequentialLock && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
                              Đang bật
                            </span>
                          )}
                        </div>
                        <p className="text-xs vibrancy-secondary leading-relaxed">
                          Cho phép chuyển đổi tự do giữa mọi trình độ <strong>A2, B1, B2</strong> và luyện nói bất kỳ câu nào mà không bắt buộc hoàn thành tuần tự.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnforceSequentialLock(true)}
                      className={`p-4 rounded-2xl text-left transition-all flex items-start gap-3.5 haptic-press ${
                        enforceSequentialLock
                          ? 'material-regular ring-2 ring-amber-500 border-amber-500/40 shadow-sm'
                          : 'material-thin hover:opacity-90'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold vibrancy-label">
                            Chế Độ Học Tuần Tự (A2 → B1 → B2)
                          </span>
                          {enforceSequentialLock && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-600 text-white">
                              Đang bật
                            </span>
                          )}
                        </div>
                        <p className="text-xs vibrancy-secondary leading-relaxed">
                          Yêu cầu hoàn thành <strong>Bước 1 (Điền từ Cloze)</strong> trước khi mở khóa <strong>Bước 2 (Luyện nói)</strong>, và hoàn thành hết trình độ A2 mới mở khóa lên B1, B2.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Card 2: 3 Thẻ Trình Độ CEFR A2, B1, B2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {levels.map((lvl) => {
                    const summary = roadmap.levelSummaries[lvl];
                    const desc = levelDescriptions[lvl];
                    const isCurrentLevel = selectedLevel === lvl;
                    const isLocked = enforceSequentialLock && !summary.isUnlocked;

                    return (
                      <div
                        key={lvl}
                        className={`p-5 rounded-3xl flex flex-col justify-between gap-4 transition-all ${
                          isCurrentLevel
                            ? 'material-regular ring-2 ring-sky-500 border-sky-500/40 shadow-md'
                            : 'material-regular shadow-xs'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${desc.badgeColor}`}>
                              Trình độ {lvl}
                            </span>

                            {isCurrentLevel ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] dark:text-sky-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Đang chọn</span>
                              </span>
                            ) : isLocked ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Khóa tuần tự</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Đã mở khóa</span>
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base font-bold vibrancy-label">
                              {desc.title}
                            </h3>
                            <p className="text-xs vibrancy-secondary mt-1 leading-relaxed">
                              {desc.subtitle}
                            </p>
                          </div>

                          {/* Progress bar & counters */}
                          <div className="p-3.5 rounded-2xl material-thin space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="vibrancy-secondary">Tiến độ luyện nói:</span>
                              <span className="font-mono font-bold vibrancy-label">
                                {summary.completedSentences} / {summary.totalSentences} câu ({summary.completionPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.1] overflow-hidden">
                              <div
                                className="h-full bg-[#0284C7] dark:bg-sky-500 transition-all"
                                style={{ width: `${Math.max(2, summary.completionPercent)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] vibrancy-secondary pt-1">
                              <span>Mẫu câu hoàn thành:</span>
                              <span className="font-mono font-semibold vibrancy-label">
                                {summary.masteredPatterns} / {summary.totalPatterns} mẫu
                              </span>
                            </div>
                          </div>

                          {/* 6 Thematic Groups Preview */}
                          <div className="space-y-1">
                            <div className="text-[11px] font-semibold vibrancy-secondary">
                              6 Chủ điểm giao tiếp ({lvl}):
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-xs vibrancy-label">
                              {[1, 2, 3, 4, 5, 6].map((gId) => (
                                <div key={gId} className="truncate">
                                  • {THEMATIC_GROUP_SHORT_LABELS[lvl][gId]}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                setEnforceSequentialLock(false);
                              }
                              handleSelectLevel(lvl, true);
                              setActiveTab('studio');
                            }}
                            className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all haptic-press shadow-xs ${
                              isCurrentLevel
                                ? 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                                : 'bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>
                              {isLocked
                                ? `Mở Khóa & Học Trình Độ ${lvl}`
                                : `Vào Luyện Tập Trình Độ ${lvl}`}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                setEnforceSequentialLock(false);
                              }
                              handleSelectLevel(lvl, true);
                              setActiveTab('library');
                            }}
                            className="w-full py-2 px-3 rounded-2xl text-xs font-semibold material-thin vibrancy-label hover:opacity-90 flex items-center justify-center gap-1.5 haptic-press"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Xem 60 Mẫu Câu {lvl}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 📚 60 MẪU CÂU (Thư Viện 60 Mẫu x 3 Cấp Độ A2, B1, B2) */}
          {activeTab === 'library' && (
            <div className="h-full flex flex-col p-3 sm:p-6 overflow-hidden">
              <div className="max-w-5xl mx-auto w-full h-full flex flex-col gap-3">
                {/* Header Controls: CEFR Level & Thematic Groups */}
                <div className="shrink-0 p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
                        Thư Viện 60 Mẫu Câu ({selectedLevel})
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chọn bất kỳ mẫu câu nào để chuyển thẳng sang phòng luyện nói 20 biến thể.
                      </p>
                    </div>

                    {/* Level Switcher */}
                    <div className="flex items-center gap-1.5">
                      {levels.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleSelectLevel(lvl)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all touch-target ${
                            selectedLevel === lvl
                              ? 'bg-[#0284C7] dark:bg-sky-600 text-white border-transparent shadow-xs'
                              : 'bg-slate-50 dark:bg-[#151F32] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          CEFR {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6 Thematic Groups + Search */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {[1, 2, 3, 4, 5, 6].map((gId) => (
                        <button
                          key={gId}
                          type="button"
                          onClick={() => setSelectedThematicGroup(gId)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border whitespace-nowrap shrink-0 transition-colors touch-target ${
                            selectedThematicGroup === gId
                              ? 'bg-slate-900 dark:bg-sky-500 text-white border-slate-900 dark:border-sky-400'
                              : 'bg-slate-50 dark:bg-[#151F32] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {THEMATIC_GROUP_SHORT_LABELS[selectedLevel][gId]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedThematicGroup('ALL')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border whitespace-nowrap shrink-0 transition-colors touch-target ${
                          selectedThematicGroup === 'ALL'
                            ? 'bg-slate-900 dark:bg-sky-500 text-white border-slate-900 dark:border-sky-400'
                            : 'bg-slate-50 dark:bg-[#151F32] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Tất cả 60
                      </button>
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={patternSearchQuery}
                        onChange={(e) => setPatternSearchQuery(e.target.value)}
                        placeholder="Tìm mẫu câu..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 60 Patterns Scrollable Grid inside Tab — Auto rows, zero overlap */}
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-1 auto-rows-max">
                  {filteredPatternsForDisplay.map((p) => {
                    const isSelected = p.id === activePattern.id;
                    const pStats = roadmap.patternStatsMap[p.id];
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPattern(p)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 shrink-0 ${
                          isSelected
                            ? 'bg-sky-50/90 dark:bg-sky-950/90 border-[#0284C7] dark:border-sky-400 shadow-sm ring-1 ring-[#0284C7]/30'
                            : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="w-full space-y-1.5">
                          <div className="flex items-center justify-between text-xs w-full">
                            <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 font-mono font-bold text-[#0284C7] dark:text-sky-300 text-[11px]">
                              Mẫu #{String(p.patternNumberInLevel).padStart(2, '0')}/60
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {pStats?.speakingCompletedCount || 0}/20 câu
                            </span>
                          </div>

                          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
                            {p.formula}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {p.vietnameseMeaning}
                          </p>
                        </div>

                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-[#0284C7] dark:text-sky-400 font-semibold">
                          <span>Luyện 20 biến thể</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 📋 20 BIẾN THỂ CỦA MẪU HIỆN TẠI */}
          {activeTab === 'matrix' && (
            <div className="h-full flex flex-col p-3 sm:p-6 overflow-hidden">
              <div className="max-w-5xl mx-auto w-full h-full flex flex-col gap-3">
                <div className="shrink-0 p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
                      20 Biến Thể Của Mẫu #{activePattern.patternNumberInLevel}/60 ({activePattern.cefrLevel})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mẫu gốc: “{activePattern.formula}” — {activePattern.vietnameseMeaning}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('studio')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-xl"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Vào Phòng Luyện Nói</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 pr-1">
                  {activePattern.sentences.map((s, idx) => {
                    const prog = progressMap[s.id];
                    const isCurrent = idx === currentSentenceIndex;
                    return (
                      <div
                        key={s.id}
                        className={`p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#151F32] transition-colors ${
                          isCurrent ? 'bg-sky-50/50 dark:bg-sky-950/40' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-[#0284C7] dark:text-sky-400">
                              Biến thể #{s.index}/20:
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {s.targetWord}
                            </span>
                            <span className="font-ipa text-[11px] text-sky-600 dark:text-sky-300">
                              {s.ipa}
                            </span>
                            <span className="text-[11px] text-slate-500">({s.vietnameseHint})</span>
                          </div>

                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                            {s.fullSentence}
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {s.vietnameseTranslation}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSpeakQuick(s.fullSentence)}
                            aria-label="Nghe đọc mẫu"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 touch-target"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentSentenceIndex(idx);
                              setActiveTab('studio');
                            }}
                            className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 rounded-xl hover:bg-slate-800 touch-target"
                          >
                            Luyện Câu #{s.index}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ✍️ CÚ PHÁP & TỪ VỰNG TÙY CHỈNH */}
          {activeTab === 'syntax' && (
            <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto w-full space-y-4">
                <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
                    Cập Nhật Cú Pháp & Từ Vựng Cá Nhân Hóa Cho botkeep.xyz
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Bạn có thể tùy biến công thức mẫu câu và từ vựng của biến thể hiện tại để phục vụ công việc hàng ngày của bạn.
                  </p>
                </div>

                <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0284C7] dark:text-sky-400">
                      Mẫu #{activePattern.patternNumberInLevel}/60 ({activePattern.cefrLevel})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUpdaterModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] dark:bg-sky-600 rounded-xl shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Mở Trình Chỉnh Sửa Chi Tiết</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs text-slate-500">Khung cú pháp hiện tại:</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {activePattern.formula}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Nghĩa tiếng Việt: {activePattern.vietnameseMeaning}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs text-slate-500">Biến thể #{currentVariation.index}/20:</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {currentVariation.fullSentence}
                    </div>
                    <div className="text-xs text-[#0284C7] dark:text-sky-300 font-ipa">
                      {currentVariation.targetWord} · {currentVariation.ipa} ({currentVariation.partOfSpeech})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 👨‍👩‍👧 HỒ SƠ GIA ĐÌNH (Tôi, Vợ, Con) + SAO LƯU / KHÔI PHỤC JSON INDEXEDDB */}
          {activeTab === 'profiles' && (
            <FamilyProfileManager
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectProfile={handleSelectProfile}
              onAddProfile={handleAddProfile}
              onUpdateProfile={handleUpdateProfile}
              getProfileStats={getProfileStats}
              onExportBackupJson={() =>
                indexedDBStorage.exportAllDataAsJson(profiles, activeProfileId, isDarkMode)
              }
              onImportBackupJson={async (rawJson: string) => {
                const check = validateAndParseBackupJson(rawJson);
                if (!check.valid || !check.payload) {
                  return {
                    ok: false,
                    messageVi: check.errorVi || 'Dữ liệu JSON không hợp lệ.',
                  };
                }
                await indexedDBStorage.importAllDataFromPayload(check.payload);
                setProfiles(check.payload.profiles);
                setActiveProfileId(check.payload.activeProfileId);
                setIsDarkMode(check.payload.isDarkMode);
                const activeProg =
                  check.payload.progressByProfile[check.payload.activeProfileId] || {};
                const activeOver =
                  check.payload.overridesByProfile[check.payload.activeProfileId] || {};
                setProgressMap(activeProg);
                setCustomOverrides(activeOver);
                return {
                  ok: true,
                  messageVi: `Khôi phục thành công ${check.payload.profiles.length} hồ sơ gia đình vào IndexedDB & bộ nhớ máy!`,
                };
              }}
            />
          )}

          {/* TAB 6: ℹ️ HỌC THUẬT SLA & SOCRATIC */}
          {activeTab === 'pedagogy' && (
            <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto">
              <SocraticArchitectureView
                mode="pedagogy"
                activePattern={activePattern}
                onReturnToStudio={() => setActiveTab('studio')}
              />
            </div>
          )}
        </main>

        {/* Custom Syntax & Lexical Updater Modal */}
        <SyntaxLexicalUpdaterModal
          isOpen={isUpdaterModalOpen}
          onClose={() => setIsUpdaterModalOpen(false)}
          activePattern={activePattern}
          currentVariation={currentVariation}
          onSavePatternSyntax={handleSavePatternSyntax}
          onSaveVariationLexical={handleSaveVariationLexical}
          onResetPatternOverrides={handleResetPatternOverrides}
          hasCustomOverrides={Boolean(customOverrides[activePattern.id])}
        />

        {/* Global Voice Settings Modal (Google Gemini Audio TTS vs Samantha / Siri Voice) */}
        <VoiceSettingsModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
        />
      </div>
    </div>
  );
}
