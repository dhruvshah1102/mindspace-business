import type { AssessmentType } from './assessments';
import { ASSESSMENT_METADATA, ASSESSMENT_TYPES } from './assessments';
import type { OrgSignal, OrgThemeSignal, OrgRollup } from './types';
import { computeCoreIndices, itemKey, type ByDomainMeans, type ByDomainBands, type ByItemMeans } from './indices';
import { cohortKey as buildCohortKey, isMasked, DEFAULT_K_ANONYMITY, COHORT_DIMENSIONS } from './cohorts';
import { rankDrivers, type DriverCandidate } from './drivers';
import type { Theme } from './themes';
import { THEME_TAXONOMY } from './themes';

/**
 * Pure aggregation: raw per-employee signals in → a rule-safe org_rollups row
 * out. No I/O. netlify/functions/rollup.ts is a thin wrapper that reads
 * org_signals/org_theme_signals, calls this, and writes org_rollups.
 */
export function computeRollup(params: {
  orgId: string;
  grain: OrgRollup['grain'];
  periodId: string;
  headcount: number;
  signals: OrgSignal[];
  themeSignals: OrgThemeSignal[];
  previousByDomain?: Record<string, number>;
  previousByItem?: Record<string, number>;
  previousByTheme?: Record<string, number>;
  previousByCohort?: Record<string, number>;
  k?: number;
}): OrgRollup {
  const { orgId, grain, periodId, headcount, signals, themeSignals } = params;
  const k = params.k ?? DEFAULT_K_ANONYMITY;

  const participants = new Set(signals.map((s) => s.pseudoId)).size;

  const byDomain: OrgRollup['byDomain'] = {};
  const byDomainMeans: ByDomainMeans = {};
  const byDomainBands: ByDomainBands = {};

  for (const domain of ASSESSMENT_TYPES) {
    const domainSignals = signals.filter((s) => s.domain === domain);
    if (domainSignals.length === 0) continue;
    const percentages = domainSignals.map((s) => s.percentage).sort((a, b) => a - b);
    const mean = mean1(percentages);
    const median = percentile(percentages, 0.5);
    const p90 = percentile(percentages, 0.9);
    const n = domainSignals.length;
    const bands = {
      low: share(domainSignals, (s) => s.level === 'Low'),
      moderate: share(domainSignals, (s) => s.level === 'Moderate'),
      high: share(domainSignals, (s) => s.level === 'High'),
    };
    const prevMean = params.previousByDomain?.[domain] ?? null;
    byDomain[domain] = { mean, median, p90, bands, n, delta: prevMean === null ? null : round1(mean - prevMean) };
    byDomainMeans[domain] = { meanPercentage: mean };
    byDomainBands[domain] = bands;
  }

  const byCohort = computeByCohort(signals, k, params.previousByCohort);

  const byItem: OrgRollup['byItem'] = {};
  const byItemMeansRaw: ByItemMeans = {};
  for (const domain of ASSESSMENT_TYPES) {
    const domainSignals = signals.filter((s) => s.domain === domain);
    const questionCount = ASSESSMENT_METADATA[domain].questions.length;
    for (let qid = 1; qid <= questionCount; qid++) {
      const scores = domainSignals
        .map((s) => s.items.find((i) => i.qid === qid)?.score)
        .filter((v): v is number => v !== undefined);
      if (scores.length === 0) continue;
      const key = itemKey(domain, qid);
      const meanRaw = mean1(scores);
      byItemMeansRaw[key] = meanRaw;
      const prev = params.previousByItem?.[key] ?? null;
      byItem[key] = { mean: meanRaw, delta: prev === null ? null : round2(meanRaw - prev), n: scores.length };
    }
  }

  const byTheme: OrgRollup['byTheme'] = {};
  const totalThemeSessions = themeSignals.length;
  for (const theme of THEME_TAXONOMY) {
    const mentions = themeSignals.filter((t) => t.themes.some((m) => m.theme === theme));
    if (mentions.length === 0) continue;
    const count = mentions.length;
    const themeShare = totalThemeSessions === 0 ? 0 : round3(count / totalThemeSessions);
    const severityMean = mean1(
      mentions.flatMap((t) => t.themes.filter((m) => m.theme === theme).map((m) => m.weight * 100)),
    );
    const prev = params.previousByTheme?.[theme] ?? null;
    byTheme[theme] = { count, share: themeShare, delta: prev === null ? null : round3(themeShare - prev), severityMean };
  }

  const byCohortTheme = computeByCohortTheme(themeSignals);

  // Driver correlations need a higher floor than the k-anonymity display
  // threshold: with 20 themes × 6 domains × several cohort dimensions, small
  // n produces spurious r² by chance alone (multiple-comparisons noise).
  const minDriverSamples = Math.max(k * 4, 20);
  const drivers = computeDrivers(signals, themeSignals, minDriverSamples);

  const indices = computeCoreIndices(byDomainMeans, byDomainBands, byItemMeansRaw);

  return {
    orgId,
    grain,
    periodId,
    headcount,
    participants,
    participationRate: headcount === 0 ? 0 : round3(participants / headcount),
    indices,
    byDomain,
    byCohort,
    byItem,
    byTheme,
    byCohortTheme,
    drivers,
    computedAt: new Date().toISOString(),
    version: 1,
  };
}

/** Groups a signal into its single-dimension slice keys, e.g. a signal with
 * cohort {department:'Operations', location:'Pune'} contributes to both the
 * "department:Operations" slice and the "location:Pune" slice independently —
 * that's what lets the Cohort Heatmap switch dimensions without re-fragmenting n. */
function sliceKeysFor(signal: OrgSignal): string[] {
  return COHORT_DIMENSIONS.filter((d) => signal.cohort[d]).map((d) => `${d}:${signal.cohort[d]}`);
}

function computeByCohortTheme(themeSignals: OrgThemeSignal[]): OrgRollup['byCohortTheme'] {
  const result: OrgRollup['byCohortTheme'] = {};

  const sliceGroups = new Map<string, OrgThemeSignal[]>();
  for (const t of themeSignals) {
    for (const dim of COHORT_DIMENSIONS) {
      if (!t.cohort[dim]) continue;
      const sliceKey = `${dim}:${t.cohort[dim]}`;
      const arr = sliceGroups.get(sliceKey) ?? [];
      arr.push(t);
      sliceGroups.set(sliceKey, arr);
    }
  }

  for (const [sliceKey, group] of sliceGroups) {
    const cell: Partial<Record<Theme, { count: number; share: number; severityMean: number }>> = {};
    const totalSessions = group.length;
    for (const theme of THEME_TAXONOMY) {
      const mentions = group.filter((t) => t.themes.some((m) => m.theme === theme));
      if (mentions.length === 0) continue;
      const severityMean = mean1(
        mentions.flatMap((t) => t.themes.filter((m) => m.theme === theme).map((m) => m.weight * 100)),
      );
      cell[theme] = {
        count: mentions.length,
        share: totalSessions === 0 ? 0 : round3(mentions.length / totalSessions),
        severityMean,
      };
    }
    result[sliceKey] = cell;
  }

  return result;
}

function computeByCohort(
  signals: OrgSignal[],
  k: number,
  previousByCohort?: Record<string, number>,
): OrgRollup['byCohort'] {
  const byCohort: OrgRollup['byCohort'] = {};

  const sliceGroups = new Map<string, OrgSignal[]>();
  for (const s of signals) {
    for (const sliceKey of sliceKeysFor(s)) {
      const arr = sliceGroups.get(sliceKey) ?? [];
      arr.push(s);
      sliceGroups.set(sliceKey, arr);
    }
  }

  for (const [sliceKey, group] of sliceGroups) {
    const cell: Partial<Record<AssessmentType, { mean: number; n: number; masked: boolean; delta: number | null }>> = {};
    for (const domain of ASSESSMENT_TYPES) {
      const domainGroup = group.filter((s) => s.domain === domain);
      if (domainGroup.length === 0) continue;
      const n = new Set(domainGroup.map((s) => s.pseudoId)).size;
      const masked = isMasked(n, k);
      const mean = masked ? 0 : round1(mean1(domainGroup.map((s) => s.percentage)));
      const prevKey = `${sliceKey}.${domain}`;
      const prev = previousByCohort?.[prevKey] ?? null;
      cell[domain] = { mean, n, masked, delta: masked || prev === null ? null : round1(mean - prev) };
    }
    byCohort[sliceKey] = cell;
  }

  return byCohort;
}

function computeDrivers(signals: OrgSignal[], themeSignals: OrgThemeSignal[], minSamples: number): OrgRollup['drivers'] {
  const drivers: OrgRollup['drivers'] = [];

  const sliceGroups = new Map<string, OrgSignal[]>();
  for (const s of signals) {
    for (const sliceKey of sliceKeysFor(s)) {
      const arr = sliceGroups.get(sliceKey) ?? [];
      arr.push(s);
      sliceGroups.set(sliceKey, arr);
    }
  }

  // Theme weight per (person, period) — matched to the same reporting period as
  // the domain signal it's meant to explain, not averaged across the whole
  // window, otherwise a person's trend drift over the period dilutes any real
  // same-week relationship between what they told TARA and how they scored.
  const themeWeightsByPseudoTs = new Map<string, Map<Theme, number[]>>();
  for (const t of themeSignals) {
    const key = `${t.pseudoId}|${t.ts}`;
    let byTheme = themeWeightsByPseudoTs.get(key);
    if (!byTheme) {
      byTheme = new Map();
      themeWeightsByPseudoTs.set(key, byTheme);
    }
    for (const m of t.themes) {
      const arr = byTheme.get(m.theme) ?? [];
      arr.push(m.weight);
      byTheme.set(m.theme, arr);
    }
  }

  for (const [sliceKey, group] of sliceGroups) {
    for (const domain of ASSESSMENT_TYPES) {
      const domainSignals = group.filter((s) => s.domain === domain);
      if (domainSignals.length < minSamples) continue;

      const candidates: DriverCandidate[] = THEME_TAXONOMY.map((theme) => ({
        kind: 'theme' as const,
        key: theme,
        label: theme,
        samples: domainSignals.map((s) => {
          const weights = themeWeightsByPseudoTs.get(`${s.pseudoId}|${s.ts}`)?.get(theme);
          const predictor = weights && weights.length > 0 ? weights.reduce((sum, w) => sum + w, 0) / weights.length : 0;
          return { predictor, outcome: s.percentage };
        }),
      }));

      const ranked = rankDrivers(candidates, minSamples).slice(0, 3);
      for (const d of ranked) {
        drivers.push({ cohortKey: sliceKey, domain, driver: d.key, strength: d.strength, direction: d.direction, n: d.n });
      }
    }
  }

  return drivers.sort((a, b) => b.strength - a.strength).slice(0, 50);
}

function mean1(nums: number[]): number {
  if (nums.length === 0) return 0;
  return round1(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return round1(sorted[idx]);
}

function share<T>(items: T[], pred: (t: T) => boolean): number {
  if (items.length === 0) return 0;
  return round3(items.filter(pred).length / items.length);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

export { buildCohortKey };
export type { AssessmentType, Theme };
