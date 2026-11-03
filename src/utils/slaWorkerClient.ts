/**
 * Non-Blocking Web Worker Client (`slaWorkerClient.ts`)
 * Dispatches heavy phonetic scoring and progression calculations to `slaProcessor.worker.ts`
 * with automatic fallback to synchronous execution if Web Workers are unavailable.
 */

import { CEFRLevel, SpeakingEvaluationSummary } from '../types/sla';
import { evaluateSpokenSentence } from './phoneticScoring';

class SLAWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >();
  private reqCounter = 0;

  private getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return null;
    }
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(
        new URL('../workers/slaProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.onmessage = (event) => {
        const { id, ok, result, error } = event.data || {};
        const entry = this.pending.get(id);
        if (!entry) return;
        this.pending.delete(id);
        if (ok) {
          entry.resolve(result);
        } else {
          entry.reject(new Error(error || 'Worker error'));
        }
      };
      this.worker.onerror = () => {
        // Fallback gracefully if worker fails
        this.worker = null;
      };
      return this.worker;
    } catch {
      return null;
    }
  }

  public async evaluateSentenceAsync(
    expectedSentence: string,
    transcript: string,
    cefrLevel: CEFRLevel,
    durationSeconds: number
  ): Promise<SpeakingEvaluationSummary> {
    const w = this.getWorker();
    if (!w) {
      return evaluateSpokenSentence(
        expectedSentence,
        transcript,
        cefrLevel,
        durationSeconds
      );
    }

    const id = `req_${++this.reqCounter}_${Date.now()}`;
    return new Promise<SpeakingEvaluationSummary>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          resolve(
            evaluateSpokenSentence(
              expectedSentence,
              transcript,
              cefrLevel,
              durationSeconds
            )
          );
        }
      }, 600);

      this.pending.set(id, {
        resolve: (res: SpeakingEvaluationSummary) => {
          window.clearTimeout(timeoutId);
          resolve(res);
        },
        reject: () => {
          window.clearTimeout(timeoutId);
          resolve(
            evaluateSpokenSentence(
              expectedSentence,
              transcript,
              cefrLevel,
              durationSeconds
            )
          );
        },
      });

      w.postMessage({
        id,
        type: 'EVALUATE_SPEAKING',
        payload: {
          expectedSentence,
          transcript,
          cefrLevel,
          durationSeconds,
        },
      });
    });
  }
}

export const slaWorkerClient = new SLAWorkerClient();
