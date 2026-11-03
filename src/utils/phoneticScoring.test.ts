import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateClozeInput,
  levenshteinDistance,
  calculateNormalizedSimilarity,
  detectVietnameseL1Interference,
  evaluateSpokenSentence,
  buildSimulatedTranscript,
} from './phoneticScoring';
import { computeSequentialRoadmap } from './progressionLogic';
import { SENTENCE_PATTERNS } from '../data/patternsData';
import { SentenceProgress } from '../types/sla';

test('dataset integrity: 180 CEFR patterns (60 per level A2, B1, B2) each contain strictly 20 contextual variations (3,600 sentences total)', () => {
  assert.equal(SENTENCE_PATTERNS.length, 180);
  const a2Patterns = SENTENCE_PATTERNS.filter((p) => p.cefrLevel === 'A2');
  const b1Patterns = SENTENCE_PATTERNS.filter((p) => p.cefrLevel === 'B1');
  const b2Patterns = SENTENCE_PATTERNS.filter((p) => p.cefrLevel === 'B2');

  assert.equal(a2Patterns.length, 60, 'Must have 60 patterns for A2');
  assert.equal(b1Patterns.length, 60, 'Must have 60 patterns for B1');
  assert.equal(b2Patterns.length, 60, 'Must have 60 patterns for B2');

  for (const pattern of SENTENCE_PATTERNS) {
    assert.equal(
      pattern.sentences.length,
      20,
      `Pattern ${pattern.id} must have 20 variations`
    );
    const uniqueSentences = new Set(pattern.sentences.map((s) => s.fullSentence));
    assert.equal(
      uniqueSentences.size,
      20,
      `Pattern ${pattern.id} must have 20 distinct fullSentence strings`
    );
    pattern.sentences.forEach((s, idx) => {
      assert.equal(s.index, idx + 1);
      assert.ok(s.clozeTemplate.includes('___'), `Sentence ${s.id} must have ___ blank`);
      assert.ok(
        s.fullSentence.toLowerCase().includes(s.targetWord.toLowerCase()),
        `Sentence ${s.id} ("${s.fullSentence}") must contain targetWord "${s.targetWord}"`
      );
      assert.equal(s.distractors.length, 3);
    });
  }
});

test('sequential progression: B1 unlocks only after all A2 patterns are completed when sequential lock is active', () => {
  const emptyProgress: Record<string, SentenceProgress> = {};
  const initialRoadmap = computeSequentialRoadmap(SENTENCE_PATTERNS, emptyProgress, true);

  assert.equal(initialRoadmap.levelSummaries.A2.isUnlocked, true);
  assert.equal(initialRoadmap.levelSummaries.B1.isUnlocked, false);
  assert.equal(initialRoadmap.levelSummaries.B2.isUnlocked, false);

  // Simulate completing all 60 sentences of A2
  const a2CompletedProgress: Record<string, SentenceProgress> = {};
  for (const p of SENTENCE_PATTERNS.filter((pat) => pat.cefrLevel === 'A2')) {
    for (const s of p.sentences) {
      a2CompletedProgress[s.id] = {
        sentenceId: s.id,
        clozeCompleted: true,
        clozeAttempts: 1,
        speakingCompleted: true,
        bestSpeakingScore: 90,
      };
    }
  }

  const afterA2Roadmap = computeSequentialRoadmap(
    SENTENCE_PATTERNS,
    a2CompletedProgress,
    true
  );
  assert.equal(afterA2Roadmap.levelSummaries.A2.isLevelCompleted, true);
  assert.equal(afterA2Roadmap.levelSummaries.B1.isUnlocked, true);
  assert.equal(afterA2Roadmap.levelSummaries.B2.isUnlocked, false);
});

test('validateClozeInput handles exact matches, punctuation, and morphological near-misses', () => {
  const exact = validateClozeInput('  Concentrating! ', 'concentrating');
  assert.equal(exact.isCorrect, true);
  assert.equal(exact.isMorphologicalNearMiss, false);

  const rootOnly = validateClozeInput('concentrate', 'concentrating');
  assert.equal(rootOnly.isCorrect, false);
  assert.equal(rootOnly.isMorphologicalNearMiss, true);

  const wrong = validateClozeInput('decorating', 'concentrating');
  assert.equal(wrong.isCorrect, false);
});

test('levenshteinDistance and homophone normalization work accurately', () => {
  assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
  assert.equal(calculateNormalizedSimilarity('two', 'to'), 1);
  assert.equal(calculateNormalizedSimilarity('write', 'right'), 1);
});

test('detectVietnameseL1Interference catches final consonant cluster omission and -ing reduction', () => {
  const clusterDrop = detectVietnameseL1Interference('adjusting', 'adjustin');
  assert.equal(clusterDrop.isL1FinalConsonantIssue, true);

  const pluralDrop = detectVietnameseL1Interference('milestones', 'milestone');
  assert.equal(pluralDrop.isL1FinalConsonantIssue, true);

  const exactMatch = detectVietnameseL1Interference('concentrating', 'concentrating');
  assert.equal(exactMatch.isL1FinalConsonantIssue, false);
});

test('evaluateSpokenSentence scores accurate vs. L1 final consonant omission vs. omission', () => {
  const target = "I'm having a hard time concentrating in this noisy office.";

  const nativeSim = buildSimulatedTranscript(target, 'native_accurate');
  const evalNative = evaluateSpokenSentence(target, nativeSim, 'A2', 4.0);
  assert.ok(evalNative.overallScore >= 90, `Expected >= 90, got ${evalNative.overallScore}`);
  assert.ok(evalNative.wordResults.every((w) => w.status === 'accurate'));

  const vnSim = buildSimulatedTranscript(target, 'vn_l1_final_consonant');
  const evalVn = evaluateSpokenSentence(target, vnSim, 'A2', 4.5);
  assert.ok(
    evalVn.wordResults.some((w) => w.status === 'minor'),
    'Should flag final consonant / -ing reductions as minor (Yellow)'
  );
  assert.ok(evalVn.overallScore >= 70 && evalVn.overallScore < 98);

  const hesitantSim = buildSimulatedTranscript(target, 'hesitant_omission');
  const evalHesitant = evaluateSpokenSentence(target, hesitantSim, 'B2', 5.5);
  assert.ok(
    evalHesitant.wordResults.some((w) => w.status === 'error'),
    'Should flag omitted words as error (Red)'
  );
  assert.ok(evalHesitant.overallScore < evalVn.overallScore);
});
