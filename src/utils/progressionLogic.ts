import { CEFRLevel, SentencePattern, SentenceProgress } from '../types/sla';

export interface PatternCompletionStats {
  patternId: string;
  cefrLevel: CEFRLevel;
  totalSentences: number;
  clozeCompletedCount: number;
  speakingCompletedCount: number;
  averageScore: number;
  isMastered: boolean;
}

export interface LevelProgressionSummary {
  level: CEFRLevel;
  totalPatterns: number;
  masteredPatterns: number;
  totalSentences: number;
  completedSentences: number;
  completionPercent: number;
  isUnlocked: boolean;
  isLevelCompleted: boolean;
  unlockRequirementVi: string;
}

/**
 * A pattern is considered mastered when the learner completes all 20 sentences
 * (or reaches the mastery threshold in sequential mode).
 */
export function computePatternStats(
  pattern: SentencePattern,
  progressMap: Record<string, SentenceProgress>
): PatternCompletionStats {
  let clozeCompletedCount = 0;
  let speakingCompletedCount = 0;
  let totalScore = 0;

  for (const s of pattern.sentences) {
    const p = progressMap[s.id];
    if (p?.clozeCompleted) {
      clozeCompletedCount++;
    }
    if (p?.speakingCompleted) {
      speakingCompletedCount++;
      totalScore += p.bestSpeakingScore;
    }
  }

  const totalSentences = pattern.sentences.length;
  const averageScore =
    speakingCompletedCount > 0 ? Math.round(totalScore / speakingCompletedCount) : 0;

  // Mastered when all 20 sentences have completed Cloze + Speaking (or Cloze completed across all 20)
  const isMastered = speakingCompletedCount >= totalSentences;

  return {
    patternId: pattern.id,
    cefrLevel: pattern.cefrLevel,
    totalSentences,
    clozeCompletedCount,
    speakingCompletedCount,
    averageScore,
    isMastered,
  };
}

/**
 * Evaluates sequential mastery across A2 -> B1 -> B2.
 * - A2 is always unlocked.
 * - B1 unlocks automatically once all A2 patterns are mastered (or if free-exploration override is enabled).
 * - B2 unlocks automatically once all B1 patterns are mastered (or if free-exploration override is enabled).
 */
export function computeSequentialRoadmap(
  patterns: SentencePattern[],
  progressMap: Record<string, SentenceProgress>,
  enforceSequentialLock: boolean
): {
  levelSummaries: Record<CEFRLevel, LevelProgressionSummary>;
  patternStatsMap: Record<string, PatternCompletionStats>;
  nextRecommendedPatternId: string;
} {
  const patternStatsMap: Record<string, PatternCompletionStats> = {};
  for (const p of patterns) {
    patternStatsMap[p.id] = computePatternStats(p, progressMap);
  }

  const levels: CEFRLevel[] = ['A2', 'B1', 'B2'];
  const rawSummaries: Record<string, Omit<LevelProgressionSummary, 'isUnlocked' | 'unlockRequirementVi'>> = {};

  for (const lvl of levels) {
    const lvlPatterns = patterns.filter((p) => p.cefrLevel === lvl);
    const totalPatterns = lvlPatterns.length;
    let masteredPatterns = 0;
    let totalSentences = 0;
    let completedSentences = 0;

    for (const p of lvlPatterns) {
      const st = patternStatsMap[p.id];
      if (st.isMastered) masteredPatterns++;
      totalSentences += st.totalSentences;
      completedSentences += st.speakingCompletedCount;
    }

    const completionPercent =
      totalSentences > 0 ? Math.round((completedSentences / totalSentences) * 100) : 0;
    const isLevelCompleted = totalPatterns > 0 && masteredPatterns === totalPatterns;

    rawSummaries[lvl] = {
      level: lvl,
      totalPatterns,
      masteredPatterns,
      totalSentences,
      completedSentences,
      completionPercent,
      isLevelCompleted,
    };
  }

  const a2Done = rawSummaries['A2'].isLevelCompleted;
  const b1Done = rawSummaries['B1'].isLevelCompleted;

  const levelSummaries: Record<CEFRLevel, LevelProgressionSummary> = {
    A2: {
      ...rawSummaries['A2'],
      isUnlocked: true,
      unlockRequirementVi: 'Cấp độ nền tảng — Mở sẵn để bắt đầu lộ trình',
    },
    B1: {
      ...rawSummaries['B1'],
      isUnlocked: !enforceSequentialLock || a2Done,
      unlockRequirementVi: a2Done
        ? 'Đã mở khóa! Bạn đã hoàn thành toàn bộ mẫu câu trình độ A2.'
        : `Hoàn thành 3 mẫu câu trình độ A2 (${rawSummaries['A2'].completedSentences}/${rawSummaries['A2'].totalSentences} câu) để nâng cấp lên B1.`,
    },
    B2: {
      ...rawSummaries['B2'],
      isUnlocked: !enforceSequentialLock || (a2Done && b1Done),
      unlockRequirementVi:
        a2Done && b1Done
          ? 'Đã mở khóa! Bạn đã chinh phục A2 và B1.'
          : `Hoàn thành trình độ A2 và B1 (${rawSummaries['B1'].completedSentences}/${rawSummaries['B1'].totalSentences} câu B1) để nâng cấp lên B2.`,
    },
  };

  // Find the first unmastered pattern in sequential order
  const firstIncomplete = patterns.find((p) => !patternStatsMap[p.id].isMastered);
  const nextRecommendedPatternId = firstIncomplete
    ? firstIncomplete.id
    : patterns[patterns.length - 1].id;

  return {
    levelSummaries,
    patternStatsMap,
    nextRecommendedPatternId,
  };
}
