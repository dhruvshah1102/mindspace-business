import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Organization } from '@/domain/types';
import type { FeelingSnapshot, MoodTier } from '@/domain/snapshot';
import { ASSESSMENT_METADATA, ASSESSMENT_TYPES, type AssessmentType } from '@/domain/assessments';
import { THEME_LABELS, type Theme } from '@/domain/themes';
import { DEFAULT_K_ANONYMITY } from '@/domain/cohorts';
import { getOrgAssessmentBreakdown } from './org-analytics-service';
import { getOrgEmployeeStats } from './org-stats-service';

const TIER_ORDER: MoodTier[] = ['thriving', 'steady', 'strained', 'struggling'];

/**
 * The 4 assessment domains that double as workplace pressure themes — same
 * taxonomy as domain/themes.ts, so their real severity can feed the
 * Pressures page's root-cause writer directly. work_anxiety and work_mood
 * describe how someone feels, not an external pressure, so they stay out of
 * this list and inform moodTiers instead.
 */
const THEME_DOMAINS: AssessmentType[] = ['workload', 'manager_relationship', 'work_life_balance', 'career_growth'];

interface MoodTierRow {
  tier: MoodTier;
  n: number;
}

interface DomainSeverityRow {
  domain: AssessmentType;
  mean_pct: number;
  n: number;
}

interface ToughestItemRow {
  domain: AssessmentType;
  qid: number;
  mean_score: number;
  n: number;
}

async function getMoodTierCounts(orgId: string): Promise<MoodTierRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.rpc('org_mood_tiers', { p_org_id: orgId });
    if (error || !data) return [];
    return data as MoodTierRow[];
  } catch (err) {
    console.warn('[mindspace] org_mood_tiers failed:', err);
    return [];
  }
}

async function getDomainSeverity(orgId: string, k: number): Promise<DomainSeverityRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.rpc('org_domain_severity', { p_org_id: orgId, p_k: k });
    if (error || !data) return [];
    return data as DomainSeverityRow[];
  } catch (err) {
    console.warn('[mindspace] org_domain_severity failed:', err);
    return [];
  }
}

async function getToughestItemRows(orgId: string, k: number): Promise<ToughestItemRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.rpc('org_toughest_items', { p_org_id: orgId, p_k: k });
    if (error || !data) return [];
    return data as ToughestItemRow[];
  } catch (err) {
    console.warn('[mindspace] org_toughest_items failed:', err);
    return [];
  }
}

/**
 * Builds a FeelingSnapshot from real assessment_records — the six
 * employee-focused assessments — instead of the legacy anonymous check-in
 * flow. Team breakdown and free-text quotes come back empty: profiles has no
 * department field yet, and the new assessment flow doesn't collect a note,
 * so there is nothing real to show there rather than something fabricated.
 *
 * Returns null when nobody has taken an assessment yet, so the caller can
 * show a "not enough data" state instead of writing a report from zero
 * real responses.
 */
export async function getRealFeelingSnapshot(
  organization: Organization,
  periodLabel: string,
): Promise<FeelingSnapshot | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const orgId = organization.orgId;
  const k = organization.policy.kAnonymity || DEFAULT_K_ANONYMITY;

  const [tierRows, severityRows, toughestRows, breakdown, stats] = await Promise.all([
    getMoodTierCounts(orgId),
    getDomainSeverity(orgId, k),
    getToughestItemRows(orgId, k),
    getOrgAssessmentBreakdown(orgId, k),
    getOrgEmployeeStats(orgId),
  ]);

  const participants = tierRows.reduce((s, t) => s + t.n, 0);
  if (participants === 0) return null;

  const headcount = Math.max(stats.totalSignups, participants);

  const tierCounts = new Map<MoodTier, number>(TIER_ORDER.map((t) => [t, 0]));
  for (const row of tierRows) tierCounts.set(row.tier, row.n);
  const moodTiers = TIER_ORDER.map((tier) => {
    const count = tierCounts.get(tier) ?? 0;
    return { tier, count, share: participants ? count / participants : 0 };
  });

  const severityByDomain = new Map(severityRows.map((r) => [r.domain, r]));
  const domains = ASSESSMENT_TYPES.filter((d) => severityByDomain.has(d))
    .map((domain) => {
      const severity = severityByDomain.get(domain)!;
      const bucket = breakdown.byDomain[domain];
      const scored = bucket.levelMasked ? 0 : bucket.low + bucket.moderate + bucket.high;
      return {
        domain,
        label: ASSESSMENT_METADATA[domain].title,
        mean: Math.round(severity.mean_pct * 10) / 10,
        strainedShare: scored ? (bucket.moderate + bucket.high) / scored : 0,
        n: severity.n,
      };
    })
    .sort((a, b) => b.mean - a.mean);

  const toughestSignals = toughestRows
    // A row saved under a retired domain name has no entry in
    // ASSESSMENT_METADATA — drop it rather than show a generic "Question N".
    .filter((row) => ASSESSMENT_TYPES.includes(row.domain))
    .map((row) => ({
      domain: row.domain,
      question: ASSESSMENT_METADATA[row.domain].questions.find((q) => q.id === row.qid)?.text ?? `Question ${row.qid}`,
      share: Math.max(0, Math.min(1, (row.mean_score - 1.25) / (5 - 1.25))),
    }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 6);

  const totalThemeMentions = domains
    .filter((d) => THEME_DOMAINS.includes(d.domain))
    .reduce((s, d) => s + (breakdown.byDomain[d.domain].levelMasked ? 0 : breakdown.byDomain[d.domain].moderate + breakdown.byDomain[d.domain].high), 0) || 1;

  const themes = domains
    .filter((d) => THEME_DOMAINS.includes(d.domain))
    .map((d) => {
      const bucket = breakdown.byDomain[d.domain];
      const mentions = bucket.levelMasked ? 0 : bucket.moderate + bucket.high;
      return {
        theme: d.domain as unknown as Theme,
        label: THEME_LABELS[d.domain as unknown as Theme] ?? d.label,
        mentions,
        share: mentions / totalThemeMentions,
        severityMean: d.mean,
      };
    })
    .sort((a, b) => b.mentions - a.mentions);

  return {
    source: 'live',
    periodLabel,
    orgName: organization.name,
    headcount,
    responses: participants,
    participationRate: headcount ? Math.min(1, participants / headcount) : 0,
    moodTiers,
    domains,
    toughestSignals,
    themes,
    teams: [],
    voices: [],
  };
}
