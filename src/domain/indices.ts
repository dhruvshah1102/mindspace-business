import type { AssessmentType } from './assessments';

/** `${domain}:${questionId}` — the addressing scheme for item-level rollups. */
export type ItemKey = `${AssessmentType}:${number}`;

export function itemKey(domain: AssessmentType, qid: number): ItemKey {
  return `${domain}:${qid}`;
}

/** Raw item scores run 1.25–5 (STANDARD_OPTIONS in domain/assessments.ts). */
const ITEM_SCORE_MIN = 1.25;
const ITEM_SCORE_MAX = 5;

/** 0–100, higher = more severe. */
function itemSeverity(meanRawScore: number): number {
  return ((meanRawScore - ITEM_SCORE_MIN) / (ITEM_SCORE_MAX - ITEM_SCORE_MIN)) * 100;
}

export interface DomainMeanInput {
  /** 0–100, higher = more severe (matches org_signals.percentage). */
  meanPercentage: number;
}

export interface BandShareInput {
  /** Fractions of the cohort in each band, should sum to ~1. */
  low: number;
  moderate: number;
  high: number;
}

export type ByDomainMeans = Partial<Record<AssessmentType, DomainMeanInput>>;
export type ByDomainBands = Partial<Record<AssessmentType, BandShareInput>>;
export type ByItemMeans = Partial<Record<ItemKey, number>>;

/** OWI weights — implementation.md §6. */
const OWI_WEIGHTS: Record<AssessmentType, number> = {
  depression: 0.25,
  anxiety: 0.25,
  stress: 0.25,
  ptsd: 0.1,
  ocd: 0.075,
  relationship: 0.075,
};

/**
 * Organizational Wellbeing Index: 100 − Σ(weight × domain severity).
 * Missing domains are excluded and remaining weights renormalized so a
 * partial rollup doesn't silently understate severity.
 */
export function computeOWI(byDomain: ByDomainMeans): number | null {
  const present = (Object.keys(OWI_WEIGHTS) as AssessmentType[]).filter((d) => byDomain[d]);
  if (present.length === 0) return null;
  const totalWeight = present.reduce((s, d) => s + OWI_WEIGHTS[d], 0);
  const weightedSeverity = present.reduce(
    (s, d) => s + (OWI_WEIGHTS[d] / totalWeight) * byDomain[d]!.meanPercentage,
    0,
  );
  return round1(100 - weightedSeverity);
}

/**
 * Burnout Composite (Maslach-mapped onto existing items), 0–100, higher = better:
 *  - Exhaustion: sleep + tired/energy items
 *  - Cynicism: interest/pleasure item
 *  - Efficacy loss: concentration + "failure" item
 */
const EXHAUSTION_ITEMS: ItemKey[] = ['depression:3', 'depression:4', 'stress:3', 'ptsd:5'];
const CYNICISM_ITEMS: ItemKey[] = ['depression:1'];
const EFFICACY_ITEMS: ItemKey[] = ['depression:7', 'depression:6'];

export function computeBurnoutComposite(byItem: ByItemMeans): number | null {
  const exhaustion = meanSeverityOf(byItem, EXHAUSTION_ITEMS);
  const cynicism = meanSeverityOf(byItem, CYNICISM_ITEMS);
  const efficacyLoss = meanSeverityOf(byItem, EFFICACY_ITEMS);
  const parts = [exhaustion, cynicism, efficacyLoss].filter((v): v is number => v !== null);
  if (parts.length === 0) return null;
  const burnoutSeverity = parts.reduce((s, v) => s + v, 0) / parts.length;
  return round1(100 - burnoutSeverity);
}

/** Focus Capacity Index (productivity proxy): concentration + energy + restlessness, inverted. */
const FOCUS_ITEMS: ItemKey[] = ['depression:7', 'depression:4', 'anxiety:5'];

export function computeFocusCapacityIndex(byItem: ByItemMeans): number | null {
  const severity = meanSeverityOf(byItem, FOCUS_ITEMS);
  return severity === null ? null : round1(100 - severity);
}

/**
 * Absence Risk Index, 0–100, higher = better (lower risk):
 * weighted composite of High-band depression share, High-band stress share,
 * sleep item severity, energy item severity.
 */
export function computeAbsenceRiskIndex(byDomain: ByDomainBands, byItem: ByItemMeans): number | null {
  const depHigh = byDomain.depression?.high;
  const stressHigh = byDomain.stress?.high;
  const sleepSeverity = meanSeverityOf(byItem, ['depression:3']);
  const energySeverity = meanSeverityOf(byItem, ['depression:4']);

  const weighted: { value: number; weight: number }[] = [];
  if (depHigh !== undefined) weighted.push({ value: depHigh * 100, weight: 0.3 });
  if (stressHigh !== undefined) weighted.push({ value: stressHigh * 100, weight: 0.3 });
  if (sleepSeverity !== null) weighted.push({ value: sleepSeverity, weight: 0.2 });
  if (energySeverity !== null) weighted.push({ value: energySeverity, weight: 0.2 });
  if (weighted.length === 0) return null;

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  const risk = weighted.reduce((s, w) => s + (w.weight / totalWeight) * w.value, 0);
  return round1(100 - risk);
}

/** % of participants with ≥1 High band this period. */
export function computeRiskDensity(byDomain: ByDomainBands): number | null {
  const domains = Object.values(byDomain).filter((d): d is BandShareInput => !!d);
  if (domains.length === 0) return null;
  // Approximation from independent per-domain High shares (upper bound via union not available
  // without per-participant data at rollup time); rollup.ts prefers the exact participant-level count when present.
  const maxHigh = Math.max(...domains.map((d) => d.high));
  return round1(maxHigh * 100);
}

function meanSeverityOf(byItem: ByItemMeans, keys: ItemKey[]): number | null {
  const values = keys.map((k) => byItem[k]).filter((v): v is number => v !== undefined);
  if (values.length === 0) return null;
  const meanRaw = values.reduce((s, v) => s + v, 0) / values.length;
  return itemSeverity(meanRaw);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface CoreIndices {
  owi: number | null;
  burnout: number | null;
  focus: number | null;
  absenceRisk: number | null;
  riskDensity: number | null;
}

export function computeCoreIndices(byDomain: ByDomainMeans, byDomainBands: ByDomainBands, byItem: ByItemMeans): CoreIndices {
  return {
    owi: computeOWI(byDomain),
    burnout: computeBurnoutComposite(byItem),
    focus: computeFocusCapacityIndex(byItem),
    absenceRisk: computeAbsenceRiskIndex(byDomainBands, byItem),
    riskDensity: computeRiskDensity(byDomainBands),
  };
}
