import type { AssessmentType } from './assessments';
import type { Theme } from './themes';

export interface PairedSample {
  predictor: number;
  outcome: number;
}

/** Pearson correlation coefficient, -1..1. Returns null with fewer than 3 samples. */
export function pearsonCorrelation(samples: PairedSample[]): number | null {
  const n = samples.length;
  if (n < 3) return null;

  const meanX = samples.reduce((s, p) => s + p.predictor, 0) / n;
  const meanY = samples.reduce((s, p) => s + p.outcome, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (const { predictor, outcome } of samples) {
    const dx = predictor - meanX;
    const dy = outcome - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

export interface DriverCandidate {
  kind: 'theme' | 'item';
  key: string; // theme name, or `${domain}:${qid}`
  label: string;
  samples: PairedSample[];
}

export interface RankedDriver {
  kind: 'theme' | 'item';
  key: string;
  label: string;
  /** r^2 — explained variance, 0..1. */
  strength: number;
  direction: 'positive' | 'negative';
  n: number;
}

/**
 * Rank candidate predictors (theme mentions, item scores) against a domain
 * severity outcome by explained variance (r²), within a single cohort.
 * This is what powers the Driver Analysis screen and the Insight Feed.
 */
export function rankDrivers(candidates: DriverCandidate[], minSamples = 5): RankedDriver[] {
  const ranked: RankedDriver[] = [];
  for (const c of candidates) {
    if (c.samples.length < minSamples) continue;
    const r = pearsonCorrelation(c.samples);
    if (r === null) continue;
    ranked.push({
      kind: c.kind,
      key: c.key,
      label: c.label,
      strength: round3(r * r),
      direction: r >= 0 ? 'positive' : 'negative',
      n: c.samples.length,
    });
  }
  return ranked.sort((a, b) => b.strength - a.strength);
}

export interface CohortDriverResult {
  cohortKey: string;
  domain: AssessmentType;
  drivers: RankedDriver[];
}

/** Movers: items/themes whose mean shifted the most between two periods. */
export interface Mover {
  key: string;
  label: string;
  delta: number;
  direction: 'worsening' | 'improving';
}

export function rankMovers(
  current: Record<string, number>,
  previous: Record<string, number>,
  labels: Record<string, string>,
  higherIsWorse = true,
): Mover[] {
  const movers: Mover[] = [];
  for (const key of Object.keys(current)) {
    if (!(key in previous)) continue;
    const delta = current[key] - previous[key];
    if (delta === 0) continue;
    const worsening = higherIsWorse ? delta > 0 : delta < 0;
    movers.push({ key, label: labels[key] ?? key, delta: round3(Math.abs(delta)), direction: worsening ? 'worsening' : 'improving' });
  }
  return movers.sort((a, b) => b.delta - a.delta);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export type { Theme };
