export type CEFRLevel = 'A2' | 'B1' | 'B2';

export type WordAccuracyStatus = 'accurate' | 'minor' | 'error';

export interface PhoneticFocusNote {
  phoneme: string;
  exampleWord: string;
  vietnameseTrap: string;
  articulationTip: string;
}

export interface SentenceVariation {
  id: string;
  index: number; // 1 to 20 within module
  levelSentenceNumber?: number; // 1 to 60 within CEFR level
  patternTemplate?: string; // Original pattern with [...] slot if applicable
  fullSentence: string;
  /** Sentence with ___ where targetWord belongs */
  clozeTemplate: string;
  targetWord: string;
  distractors: string[]; // 3 plausible contextual distractors for scaffolded mode
  partOfSpeech: string; // e.g., "Verb (V-ing)", "Noun", "Adjective"
  ipa: string; // e.g., "/ˈkɒn.sən.treɪ.tɪŋ/"
  vietnameseHint: string; // Meaning of targetWord in context
  vietnameseTranslation: string; // Full sentence translation
  pragmaticContext: string; // e.g., "1. Chào hỏi, Giới thiệu & Làm quen (1 – 10)"
  l1PhoneticTrap: PhoneticFocusNote;
}

export interface SentencePattern {
  id: string;
  cefrLevel: CEFRLevel;
  patternNumberInLevel?: number; // 1 to 60 within each CEFR level
  thematicGroupId?: number; // 1 to 6
  thematicGroupTitle?: string; // e.g., "1. Chào hỏi, Giới thiệu & Làm quen (1 – 10)"
  patternTitle: string;
  formula: string;
  vietnameseMeaning: string;
  slaRationale: string;
  pragmaticUsage: string;
  l1InterferenceOverview: string;
  sentences: SentenceVariation[]; // Strictly 20 contextual variations per pattern
}

export interface WordEvaluationResult {
  expectedWord: string;
  spokenWord: string | null;
  cleanExpected: string;
  cleanSpoken: string;
  similarity: number; // 0 to 1
  status: WordAccuracyStatus;
  diagnosticNoteVi: string;
  issueType?: 'exact' | 'final_consonant_omission' | 'vowel_reduction' | 'homophone_accepted' | 'mispronounced' | 'omitted';
}

export interface SpeakingEvaluationSummary {
  overallScore: number; // 0 to 100
  phoneticAccuracyScore: number; // 0 to 100
  fluencyScore: number; // 0 to 100
  completenessScore: number; // 0 to 100
  estimatedWpm: number;
  cefrLevelApplied: CEFRLevel;
  transcript: string;
  wordResults: WordEvaluationResult[];
  coachFeedbackVi: string;
  l1RemediationActionVi: string;
}

export interface SentenceProgress {
  sentenceId: string;
  clozeCompleted: boolean;
  clozeAttempts: number;
  speakingCompleted: boolean;
  bestSpeakingScore: number;
  lastTranscript?: string;
}

export interface UserProfile {
  id: string; // 'toi', 'vo', 'con', etc.
  name: string; // 'Tôi', 'Vợ', 'Con', or custom
  avatar: string; // '👨‍💼', '👩‍💼', '🧑‍🎓', etc.
  roleDescription: string; // 'Người dùng chính', 'Vợ / Bạn đời', 'Con / Học sinh'
  targetLevel: CEFRLevel;
  createdAt: number;
}

