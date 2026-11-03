import { SentencePattern } from '../types/sla';
import { A2_PATTERNS } from './a2PatternsData';
import { B1_PATTERNS } from './b1PatternsData';
import { B2_PATTERNS } from './b2PatternsData';
import { expandLevelTo60PatternsWith20Variations } from './lexicalSubstitutionBank';

export const A2_60_PATTERNS: SentencePattern[] = expandLevelTo60PatternsWith20Variations(
  A2_PATTERNS,
  'A2'
);

export const B1_60_PATTERNS: SentencePattern[] = expandLevelTo60PatternsWith20Variations(
  B1_PATTERNS,
  'B1'
);

export const B2_60_PATTERNS: SentencePattern[] = expandLevelTo60PatternsWith20Variations(
  B2_PATTERNS,
  'B2'
);

/**
 * Full 180 Sentence Patterns (60 patterns per CEFR level A2, B1, B2)
 * × 20 Contextual Variations per Pattern = 3,600 Real-World Sentences
 */
export const SENTENCE_PATTERNS: SentencePattern[] = [
  ...A2_60_PATTERNS,
  ...B1_60_PATTERNS,
  ...B2_60_PATTERNS,
];
