import {
  CEFRLevel,
  SpeakingEvaluationSummary,
  WordAccuracyStatus,
  WordEvaluationResult,
} from '../types/sla';

/**
 * Normalizes a text string into lowercase alphanumeric tokens while expanding
 * common English contractions so Web Speech API normalization quirks do not
 * falsely penalize the learner.
 */
const CONTRACTION_MAP: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "there's": 'there is',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "couldn't": 'could not',
  "wouldn't": 'would not',
  "shouldn't": 'should not',
  "haven't": 'have not',
  "hasn't": 'has not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
};

/**
 * Common homophone sets where browser ASR frequently substitutes an orthographically
 * different word despite identical acoustic production.
 */
const HOMOPHONE_GROUPS: string[][] = [
  ['to', 'too', 'two'],
  ['there', 'their', 'theyre'],
  ['your', 'youre'],
  ['right', 'write', 'rite'],
  ['know', 'no'],
  ['here', 'hear'],
  ['new', 'knew'],
  ['wear', 'where'],
  ['weather', 'whether'],
  ['peace', 'piece'],
  ['whole', 'hole'],
  ['role', 'roll'],
  ['cite', 'site', 'sight'],
  ['principal', 'principle'],
  ['complement', 'compliment'],
  ['break', 'brake'],
  ['week', 'weak'],
  ['meet', 'meat'],
];

export function cleanWordToken(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"“”‘’()[\]{}\-—]/g, '')
    .trim();
}

export function areHomophones(wordA: string, wordB: string): boolean {
  const a = cleanWordToken(wordA);
  const b = cleanWordToken(wordB);
  if (a === b) return true;
  return HOMOPHONE_GROUPS.some((group) => group.includes(a) && group.includes(b));
}

/**
 * Validates the user's answer in Stage 1 (Contextual Cloze).
 * Returns exact match status and diagnostic feedback if the user entered the
 * correct root word with the wrong morphological inflection (e.g. "concentrate" instead of "concentrating").
 */
export function validateClozeInput(
  userInput: string,
  targetWord: string
): {
  isCorrect: boolean;
  isMorphologicalNearMiss: boolean;
  feedbackVi: string;
} {
  const cleanUser = cleanWordToken(userInput);
  const cleanTarget = cleanWordToken(targetWord);

  if (!cleanUser) {
    return {
      isCorrect: false,
      isMorphologicalNearMiss: false,
      feedbackVi: 'Vui lòng nhập hoặc chọn từ vựng mục tiêu để hoàn thành cấu trúc câu.',
    };
  }

  if (cleanUser === cleanTarget) {
    return {
      isCorrect: true,
      isMorphologicalNearMiss: false,
      feedbackVi: 'Chính xác! Bạn đã nắm vững cả ngữ nghĩa lẫn hình thái từ (morphology) trong cấu trúc này.',
    };
  }

  // Check if learner typed the root stem or missed -ing / -ed / -s
  const stemTarget = cleanTarget.replace(/(ing|ed|es|s)$/, '');
  const stemUser = cleanUser.replace(/(ing|ed|es|s)$/, '');
  const similarity = calculateNormalizedSimilarity(cleanUser, cleanTarget);

  if (
    (stemTarget.length >= 3 && (cleanUser.startsWith(stemTarget) || stemTarget === stemUser)) ||
    similarity >= 0.75
  ) {
    return {
      isCorrect: false,
      isMorphologicalNearMiss: true,
      feedbackVi: `Gần đúng! Bạn đã nhớ đúng gốc từ nhưng cần chú ý hình thái ngữ pháp hoặc chính tả chuẩn trong mẫu câu này (Gợi ý: chú ý hậu tố như -ing, -ed, -s).`,
    };
  }

  return {
    isCorrect: false,
    isMorphologicalNearMiss: false,
    feedbackVi: 'Chưa chính xác. Hãy quan sát gợi ý nghĩa tiếng Việt, từ loại (POS) và phiên âm IPA để thử lại.',
  };
}

/**
 * Classic Levenshtein edit distance between two normalized strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;

  const dp: number[][] = Array.from({ length: s.length + 1 }, () =>
    new Array(t.length + 1).fill(0)
  );

  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[s.length][t.length];
}

export function calculateNormalizedSimilarity(a: string, b: string): number {
  const cleanA = cleanWordToken(a);
  const cleanB = cleanWordToken(b);
  if (!cleanA && !cleanB) return 1;
  if (!cleanA || !cleanB) return 0;
  if (cleanA === cleanB || areHomophones(cleanA, cleanB)) return 1;

  const maxLen = Math.max(cleanA.length, cleanB.length);
  const dist = levenshteinDistance(cleanA, cleanB);
  return Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * Detects whether a spoken word exhibits characteristic Vietnamese L1 phonetic interference:
 * 1. Final consonant / consonant cluster omission (e.g. "tasks" -> "task", "balancing" -> "balancin",
 *    "adjust" -> "adjus", "focused" -> "focus", "deadline" -> "deadli", "environment" -> "environmen")
 * 2. Initial/final dental fricative substitution (/θ/ -> /t/, /ð/ -> /d/)
 */
export function detectVietnameseL1Interference(
  expected: string,
  spoken: string
): {
  isL1FinalConsonantIssue: boolean;
  explanationVi: string;
} {
  const exp = cleanWordToken(expected);
  const spk = cleanWordToken(spoken);

  if (!exp || !spk || exp === spk) {
    return { isL1FinalConsonantIssue: false, explanationVi: '' };
  }

  // Case 1: Spoken word is a prefix of expected word missing 1-3 trailing letters (e.g. -s, -ed, -st, -nt, -kt, -l)
  if (exp.length >= 4 && exp.startsWith(spk) && exp.length - spk.length <= 3) {
    const missingEnding = exp.slice(spk.length);
    return {
      isL1FinalConsonantIssue: true,
      explanationVi: `Thiếu âm cuối "-${missingEnding}" (Final Consonant Omission). Tiếng Việt không bật âm tắc/xát cuối từ, nên máy nhận diện nghe thành "${spk}". Hãy giữ luồng hơi bật nhẹ âm cuối của "${exp}".`,
    };
  }

  // Case 2: Expected ends with -ing and spoken ends with -in
  if (exp.endsWith('ing') && spk === exp.slice(0, -1)) {
    return {
      isL1FinalConsonantIssue: true,
      explanationVi: `Âm mũi ngạc mềm /-ŋ/ ("-ing") bị giảm nhẹ thành /-n/. Hãy nâng gốc lưỡi chạm ngạc mềm ở cuối từ "${exp}".`,
    };
  }

  // Case 3: High similarity (>= 0.72) with mismatch in final 2 characters
  const sim = calculateNormalizedSimilarity(exp, spk);
  if (
    exp.length >= 4 &&
    spk.length >= 3 &&
    sim >= 0.72 &&
    exp.slice(0, 3) === spk.slice(0, 3)
  ) {
    return {
      isL1FinalConsonantIssue: true,
      explanationVi: `Nguyên âm chính đạt nhưng khẩu hình âm cuối của "${exp}" chưa rõ (nghe giống "${spk}"). Hãy chú ý giữ khẩu hình đến hết từ.`,
    };
  }

  return { isL1FinalConsonantIssue: false, explanationVi: '' };
}

/**
 * CEFR-calibrated acoustic thresholds:
 * - A2 prioritizes communicative intelligibility (more forgiving of minor L1 transfer).
 * - B1 balances intelligibility with morphosyntactic suffixes (-ed, -s).
 * - B2 demands high articulatory precision on consonant clusters and unstressed syllables.
 */
export function getCefrThresholds(level: CEFRLevel): {
  accurateMin: number;
  minorMin: number;
} {
  switch (level) {
    case 'A2':
      return { accurateMin: 0.86, minorMin: 0.62 };
    case 'B1':
      return { accurateMin: 0.90, minorMin: 0.68 };
    case 'B2':
      return { accurateMin: 0.94, minorMin: 0.74 };
  }
}

/**
 * Evaluates a learner's spoken transcript against the target sentence with
 * word-by-word alignment, CEFR-level tolerance calibration, and Vietnamese L1 diagnostics.
 */
export function evaluateSpokenSentence(
  expectedSentence: string,
  spokenTranscript: string,
  cefrLevel: CEFRLevel,
  durationSeconds = 4.2
): SpeakingEvaluationSummary {
  const rawExpectedWords = expectedSentence.trim().split(/\s+/);
  const rawSpokenWords = spokenTranscript
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Also create an expanded spoken array in case contractions differ
  const normalizedSpokenWords: string[] = [];
  for (const w of rawSpokenWords) {
    const clean = cleanWordToken(w);
    if (CONTRACTION_MAP[clean]) {
      normalizedSpokenWords.push(...CONTRACTION_MAP[clean].split(' '));
    } else {
      normalizedSpokenWords.push(w);
    }
  }

  const thresholds = getCefrThresholds(cefrLevel);
  const usedSpokenIndices = new Set<number>();
  const wordResults: WordEvaluationResult[] = [];

  for (let i = 0; i < rawExpectedWords.length; i++) {
    const expWord = rawExpectedWords[i];
    const cleanExp = cleanWordToken(expWord);
    const expandedExp = CONTRACTION_MAP[cleanExp];

    // Look within a local window [i - 2, i + 3] in rawSpokenWords for the best match
    let bestMatchIdx = -1;
    let bestSimilarity = -1;

    const searchStart = Math.max(0, i - 2);
    const searchEnd = Math.min(rawSpokenWords.length - 1, i + 3);

    for (let j = searchStart; j <= searchEnd; j++) {
      if (usedSpokenIndices.has(j)) continue;
      const candidate = rawSpokenWords[j];
      const sim = calculateNormalizedSimilarity(cleanExp, candidate);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatchIdx = j;
      }
    }

    // Check if contraction expansion matches (e.g. expected "I'm" and user said "I am")
    if (bestSimilarity < 1 && expandedExp) {
      const parts = expandedExp.split(' ');
      const joinedNormalized = normalizedSpokenWords.join(' ').toLowerCase();
      if (joinedNormalized.includes(expandedExp)) {
        bestSimilarity = 1;
      } else if (parts.length > 0) {
        bestSimilarity = Math.max(bestSimilarity, 0.9);
      }
    }

    if (bestMatchIdx !== -1 && bestSimilarity >= 0.35) {
      usedSpokenIndices.add(bestMatchIdx);
      const matchedSpoken = rawSpokenWords[bestMatchIdx];
      const cleanSpk = cleanWordToken(matchedSpoken);
      const l1Check = detectVietnameseL1Interference(cleanExp, cleanSpk);

      let status: WordAccuracyStatus = 'error';
      let issueType: WordEvaluationResult['issueType'] = 'mispronounced';
      let diagnosticNoteVi = `Phát âm chưa rõ (nghe thành "${matchedSpoken}"). Hãy nghe lại mẫu 0.8x để điều chỉnh trọng âm và nguyên âm.`;
      let effectiveSimilarity = bestSimilarity;

      if (l1Check.isL1FinalConsonantIssue) {
        status = 'minor';
        issueType = 'final_consonant_omission';
        effectiveSimilarity = Math.min(bestSimilarity, 0.82);
        diagnosticNoteVi = l1Check.explanationVi;
      } else if (bestSimilarity >= thresholds.accurateMin) {
        status = 'accurate';
        issueType = cleanExp === cleanSpk ? 'exact' : 'homophone_accepted';
        diagnosticNoteVi = 'Phát âm chuẩn xác, rõ âm đầu và âm cuối.';
      } else if (bestSimilarity >= thresholds.minorMin) {
        status = 'minor';
        issueType = 'vowel_reduction';
        diagnosticNoteVi = `Khẩu hình gần đúng (${Math.round(bestSimilarity * 100)}%), cần giữ rõ âm cuối và độ mở nguyên âm của từ "${expWord}".`;
      }

      wordResults.push({
        expectedWord: expWord,
        spokenWord: matchedSpoken,
        cleanExpected: cleanExp,
        cleanSpoken: cleanSpk,
        similarity: Number(effectiveSimilarity.toFixed(2)),
        status,
        diagnosticNoteVi,
        issueType,
      });
    } else {
      wordResults.push({
        expectedWord: expWord,
        spokenWord: null,
        cleanExpected: cleanExp,
        cleanSpoken: '',
        similarity: 0,
        status: 'error',
        diagnosticNoteVi: `Từ "${expWord}" bị bỏ sót hoặc đọc lướt quá nhanh khiến hệ thống không thu nhận được âm thanh.`,
        issueType: 'omitted',
      });
    }
  }

  const accurateCount = wordResults.filter((w) => w.status === 'accurate').length;
  const minorCount = wordResults.filter((w) => w.status === 'minor').length;
  const totalWords = Math.max(1, wordResults.length);

  const phoneticAccuracyScore = Math.round(
    (wordResults.reduce((acc, item) => acc + item.similarity, 0) / totalWords) * 100
  );

  const completenessScore = Math.round(
    ((accurateCount + minorCount * 0.72) / totalWords) * 100
  );

  const safeDuration = Math.max(1.5, durationSeconds);
  const estimatedWpm = Math.round((rawSpokenWords.length / safeDuration) * 60);

  // Target conversational speech rate for learners: 105 - 155 WPM
  let fluencyScore = 92;
  if (rawSpokenWords.length === 0) {
    fluencyScore = 0;
  } else if (estimatedWpm < 75) {
    fluencyScore = Math.max(55, 75 - Math.round((75 - estimatedWpm) * 0.5));
  } else if (estimatedWpm > 180) {
    fluencyScore = Math.max(68, 90 - Math.round((estimatedWpm - 180) * 0.4));
  } else {
    fluencyScore = Math.min(96, 82 + Math.round((completenessScore / 100) * 14));
  }

  const overallScore =
    rawSpokenWords.length === 0
      ? 0
      : Math.round(
          phoneticAccuracyScore * 0.5 +
            completenessScore * 0.3 +
            fluencyScore * 0.2
        );

  const finalConsonantIssues = wordResults.filter(
    (w) => w.issueType === 'final_consonant_omission'
  );
  const omittedWords = wordResults.filter((w) => w.issueType === 'omitted');

  let coachFeedbackVi = '';
  let l1RemediationActionVi = '';

  if (overallScore >= 88 && finalConsonantIssues.length === 0) {
    coachFeedbackVi =
      'Xuất sắc! Nhịp điệu câu tự nhiên, nguyên âm mở tốt và các phụ âm cuối (final consonants) được bật rõ ràng.';
    l1RemediationActionVi =
      'Thử thách nâng cao: Hãy tập nối âm (linking sounds) giữa phụ âm cuối và nguyên âm đầu của từ kế tiếp ở tốc độ 1.0x.';
  } else if (overallScore >= 70) {
    coachFeedbackVi =
      'Khá tốt! Cấu trúc câu đã trôi chảy và dễ hiểu, tuy nhiên một số âm cuối hoặc cụm phụ âm (consonant clusters) còn bị nuốt âm.';
    l1RemediationActionVi =
      finalConsonantIssues.length > 0
        ? `Chú ý đặc biệt vào âm cuối của các từ: ${finalConsonantIssues
            .map((w) => `"${w.expectedWord}"`)
            .join(', ')}. Hãy nghe tốc độ 0.8x và lặp lại chậm rãi.`
        : 'Hãy chạm vào các từ màu vàng để xem hướng dẫn khẩu hình chi tiết và thu âm lại một lần nữa.';
  } else {
    coachFeedbackVi =
      'Cần luyện tập thêm. Một số từ khóa quan trọng bị đọc lướt hoặc phát âm chưa đúng trọng âm khiến câu mất đi độ rõ nét.';
    l1RemediationActionVi =
      omittedWords.length > 0
        ? `Bạn đã bỏ sót hoặc đọc quá nhỏ các từ: ${omittedWords
            .slice(0, 4)
            .map((w) => `"${w.expectedWord}"`)
            .join(', ')}. Hãy bấm "Nghe 0.8x" để nắm nhịp ngắt câu (chunking) trước khi đọc.`
        : 'Hãy chia câu thành từng cụm 3–4 từ (thought groups), đọc rõ từng từ rồi ghép lại cả câu.';
  }

  return {
    overallScore,
    phoneticAccuracyScore,
    fluencyScore,
    completenessScore,
    estimatedWpm,
    cefrLevelApplied: cefrLevel,
    transcript: spokenTranscript,
    wordResults,
    coachFeedbackVi,
    l1RemediationActionVi,
  };
}

/**
 * Generates realistic simulated transcripts for pedagogical demonstration and
 * testing when a physical microphone is unavailable or when comparing L1 interference profiles.
 */
export function buildSimulatedTranscript(
  expectedSentence: string,
  profile: 'native_accurate' | 'vn_l1_final_consonant' | 'hesitant_omission'
): string {
  const words = expectedSentence.trim().split(/\s+/);

  if (profile === 'native_accurate') {
    return words.map((w) => cleanWordToken(w)).join(' ');
  }

  if (profile === 'vn_l1_final_consonant') {
    return words
      .map((w) => {
        const clean = cleanWordToken(w);
        if (clean.endsWith('ing') && clean.length >= 5) {
          return clean.slice(0, -1); // -ing -> -in
        }
        if (
          (clean.endsWith('ed') ||
            clean.endsWith('st') ||
            clean.endsWith('nt') ||
            clean.endsWith('ts') ||
            clean.endsWith('ks') ||
            clean.endsWith('rd') ||
            clean.endsWith('ce')) &&
          clean.length >= 4
        ) {
          return clean.slice(0, -1);
        }
        if (clean.endsWith('s') && clean.length >= 5) {
          return clean.slice(0, -1);
        }
        return clean;
      })
      .join(' ');
  }

  // 'hesitant_omission': drops ~25% of longer/middle words and alters endings
  return words
    .filter((_, idx) => idx % 4 !== 2)
    .map((w) => {
      const clean = cleanWordToken(w);
      if (clean.length >= 6) {
        return clean.slice(0, -2);
      }
      return clean;
    })
    .join(' ');
}
