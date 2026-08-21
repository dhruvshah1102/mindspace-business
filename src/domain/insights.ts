import type { OrgRollup } from './types';
import { THEME_LABELS, type Theme } from './themes';
import { ASSESSMENT_METADATA, type AssessmentType } from './assessments';
import { DEFAULT_K_ANONYMITY } from './cohorts';

export interface GeneratedInsight {
  id: string;
  headline: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  cohortLabel: string | null;
  recommendedAction: string;
}

const DOMAIN_LABELS: Record<AssessmentType, string> = {
  anxiety: 'anxiety',
  depression: 'depression',
  stress: 'stress',
  ptsd: 'PTSD symptoms',
  relationship: 'relationship strain',
  ocd: 'OCD symptoms',
};

function labelSlice(sliceKey: string): string {
  const [dim, ...rest] = sliceKey.split(':');
  const value = rest.join(':');
  const dimLabel = dim === 'subTeam' ? 'sub-team' : dim === 'tenureBand' ? 'tenure' : dim;
  return `${value} (${dimLabel})`;
}

/**
 * Auto-generated, ranked, plain-English findings, each with a recommended
 * action — implementation.md §2 ("Insight Feed") and §7.1 (Overview screen,
 * top 5). Pure/deterministic so the same rollup always produces the same
 * feed; no LLM call needed for the structured cases below.
 */
export function generateInsights(rollup: OrgRollup, k: number = DEFAULT_K_ANONYMITY): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // 1) Cohorts with the worst severity per domain, above a "worth flagging" bar.
  for (const [sliceKey, cell] of Object.entries(rollup.byCohort)) {
    for (const [domain, stats] of Object.entries(cell) as [AssessmentType, typeof cell[AssessmentType]][]) {
      if (!stats || stats.masked || stats.n < k) continue;
      if (stats.mean < 55) continue;
      const worseningTail = stats.delta !== null && stats.delta > 3 ? ` and rising (+${stats.delta.toFixed(1)} pts)` : '';
      insights.push({
        id: `severity_${sliceKey}_${domain}`,
        headline: `${labelSlice(sliceKey)} is running high on ${DOMAIN_LABELS[domain]}`,
        body: `Mean ${DOMAIN_LABELS[domain]} severity is ${stats.mean.toFixed(0)}/100 across ${stats.n} respondents${worseningTail}.`,
        severity: stats.mean >= 65 ? 'critical' : 'warning',
        cohortLabel: labelSlice(sliceKey),
        recommendedAction: `Review workload and manager support in ${labelSlice(sliceKey)}; consider a targeted pulse check.`,
      });
    }
  }

  // 2) Cohort-level dominant themes, well above their org-wide share.
  const orgThemeShare: Partial<Record<Theme, number>> = Object.fromEntries(
    Object.entries(rollup.byTheme).map(([theme, v]) => [theme, v.share]),
  );
  for (const [sliceKey, cell] of Object.entries(rollup.byCohortTheme)) {
    const entries = Object.entries(cell) as [Theme, { count: number; share: number; severityMean: number }][];
    const top = entries.filter(([, v]) => v.count >= k).sort((a, b) => b[1].share - a[1].share)[0];
    if (!top) continue;
    const [theme, stats] = top;
    const orgShare = orgThemeShare[theme] ?? 0;
    if (orgShare === 0 || stats.share < orgShare * 1.5 || stats.share < 0.15) continue;
    insights.push({
      id: `theme_${sliceKey}_${theme}`,
      headline: `${THEME_LABELS[theme]} is the #1 issue in ${labelSlice(sliceKey)}`,
      body: `${(stats.share * 100).toFixed(0)}% of TARA sessions in ${labelSlice(sliceKey)} mention ${THEME_LABELS[theme].toLowerCase()}, vs ${(orgShare * 100).toFixed(0)}% org-wide (n=${stats.count}).`,
      severity: stats.share > 0.35 ? 'critical' : 'warning',
      cohortLabel: labelSlice(sliceKey),
      recommendedAction: recommendedActionForTheme(theme, labelSlice(sliceKey)),
    });
  }

  // 3) Item-level movers — the "Trouble sleeping is up 0.9 pts" differentiator.
  for (const [key, stats] of Object.entries(rollup.byItem)) {
    if (stats.delta === null || Math.abs(stats.delta) < 0.4) continue;
    const [domain, qidStr] = key.split(':') as [AssessmentType, string];
    const question = ASSESSMENT_METADATA[domain]?.questions.find((q) => q.id === Number(qidStr));
    if (!question) continue;
    insights.push({
      id: `item_${key}`,
      headline: `"${question.text}" is ${stats.delta > 0 ? 'escalating' : 'improving'} in ${DOMAIN_LABELS[domain]}`,
      body: `This item moved ${stats.delta > 0 ? '+' : ''}${stats.delta.toFixed(2)} pts (n=${stats.n}) while the overall ${DOMAIN_LABELS[domain]} average moved less, a sub-signal worth investigating on its own.`,
      severity: Math.abs(stats.delta) > 0.7 ? 'warning' : 'info',
      cohortLabel: null,
      recommendedAction: 'Cross-check against the Driver Analysis screen for the theme most correlated with this item.',
    });
  }

  return insights
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 8);
}

function severityRank(s: GeneratedInsight['severity']): number {
  return s === 'critical' ? 2 : s === 'warning' ? 1 : 0;
}

function recommendedActionForTheme(theme: Theme, cohortLabel: string): string {
  const map: Partial<Record<Theme, string>> = {
    workload: `Audit staffing levels and sprint/shift load in ${cohortLabel}.`,
    manager_relationship: `Run a 1:1 manager-effectiveness check-in with ${cohortLabel} leads.`,
    long_hours: `Review overtime patterns and after-hours expectations in ${cohortLabel}.`,
    recognition: `Introduce a recognition ritual for ${cohortLabel} this cycle.`,
    compensation_stress: `Benchmark ${cohortLabel} compensation against market before the next review cycle.`,
    sleep: `Promote the sleep/recovery content track to ${cohortLabel}.`,
    job_insecurity: `Communicate role stability plans directly to ${cohortLabel}.`,
    career_growth: `Open a career-pathing conversation cadence for ${cohortLabel}.`,
  };
  return map[theme] ?? `Investigate ${THEME_LABELS[theme].toLowerCase()} drivers in ${cohortLabel} with a targeted follow-up.`;
}
