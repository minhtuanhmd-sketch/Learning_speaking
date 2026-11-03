/**
 * Web Worker for Non-Blocking SLA Phonetic Scoring & Roadmap Calculation
 * Offloads Levenshtein alignment, L1 Vietnamese phonetic rules, and 3,600-sentence
 * progression state calculations from the main iPhone UI thread to maintain 60fps/120fps ProMotion smoothness.
 */

import { evaluateSpokenSentence } from '../utils/phoneticScoring';
import { computeSequentialRoadmap } from '../utils/progressionLogic';
import { CEFRLevel, SentencePattern, SentenceProgress } from '../types/sla';

export type SLAWorkerRequest =
  | {
      id: string;
      type: 'EVALUATE_SPEAKING';
      payload: {
        expectedSentence: string;
        transcript: string;
        cefrLevel: CEFRLevel;
        durationSeconds: number;
      };
    }
  | {
      id: string;
      type: 'COMPUTE_ROADMAP';
      payload: {
        patterns: SentencePattern[];
        progressMap: Record<string, SentenceProgress>;
        enforceSequentialLock: boolean;
      };
    };

self.onmessage = (event: MessageEvent<SLAWorkerRequest>) => {
  const msg = event.data;
  if (!msg || !msg.id) return;

  try {
    if (msg.type === 'EVALUATE_SPEAKING') {
      const { expectedSentence, transcript, cefrLevel, durationSeconds } = msg.payload;
      const result = evaluateSpokenSentence(
        expectedSentence,
        transcript,
        cefrLevel,
        durationSeconds
      );
      self.postMessage({ id: msg.id, ok: true, result });
      return;
    }

    if (msg.type === 'COMPUTE_ROADMAP') {
      const { patterns, progressMap, enforceSequentialLock } = msg.payload;
      const result = computeSequentialRoadmap(
        patterns,
        progressMap,
        enforceSequentialLock
      );
      self.postMessage({ id: msg.id, ok: true, result });
      return;
    }
  } catch (err: any) {
    self.postMessage({
      id: msg.id,
      ok: false,
      error: err?.message || 'Worker calculation error',
    });
  }
};
