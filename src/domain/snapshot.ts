import { ASSESSMENT_METADATA, type AssessmentType } from './assessments';
import { THEME_LABELS, type Theme } from './themes';
import { DEFAULT_K_ANONYMITY } from './cohorts';
import type { AnonymousCheckIn } from './check-in';
import { NOT_SAID } from './check-in';
import type { OrgRollup } from './types';

export type MoodTier = 'thriving' | 'steady' | 'strained' | 'struggling';

export const MOOD_TIER_LABELS: Record<MoodTier, string> = {
  thriving: 'Doing well',
  steady: 'Holding steady',
  strained: 'Running on empty',
  struggling: 'Needs real support',
};

export const MOOD_TIER_BLURBS: Record<MoodTier, string> = {
  thriving: 'Energy, focus and mood are all in a good place right now.',
  steady: 'Coping fine with the normal ups and downs of the job.',
  strained: 'Persistently tired and stretched — the warning stage, not a crisis.',
  struggling: 'Reporting symptoms severe enough that professional support matters.',
};

export interface SnapshotTeam {
  team: string;
  responses: number;
  /** Share of that team in the strained or struggling tiers. */
  strainShare: number;
  topFeeling: string | null;
  /** Below k-anonymity — never render a number for these. */
  masked: boolean;
}

export interface SnapshotTheme {
  theme: Theme;
  label: string;
  mentions: number;
  /** Share of respondents who raised it. */
  share: number;
  severityMean: number;
}

/**
 * The anonymised aggregate that both the local report writer and Gemini see.
 * Nothing here can be traced to a person: counts, shares and unlinked
 * sentences only. This object is the *only* thing that leaves the browser
 * when a report is generated.
 */
export interface FeelingSnapshot {
  source: 'live' | 'demo';
  periodLabel: string;
  orgName: string;
  headcount: number;
  responses: number;
  participationRate: number;
  moodTiers: { tier: MoodTier; count: number; share: number }[];
  domains: { domain: AssessmentType; label: string; strainedShare: number; mean: number; n: number }[];
  /** Item-level: the individual questions people answered worst. This is the
   * layer ordinary wellbeing tools throw away, and it's what turns "morale is
   * down" into "people aren't sleeping". */
  toughestSignals: { question: string; domain: AssessmentType; share: number }[];
  themes: SnapshotTheme[];
  teams: SnapshotTeam[];
  /** Anonymous free-text, verbatim but unlinked. Capped so a prompt stays sane. */
  voices: string[];
}

/** Severity band for one domain result, expressed 0-100 for comparability. */
function pct(score: number, maxScore: number): number {
  return (score / maxScore) * 100;
}

function tierForCheckIn(c: AnonymousCheckIn): MoodTier {
  if (c.domains.length === 0) return 'steady';
  const highs = c.domains.filter((d) => d.level === 'High').length;
  const moderates = c.domains.filter((d) => d.level === 'Moderate').length;
  const worst = Math.max(...c.domains.map((d) => pct(d.score, d.maxScore)));
  if (highs >= 2 || worst >= 80) return 'struggling';
  if (highs === 1 || moderates >= 2) return 'strained';
  if (moderates === 1) return 'steady';
  return worst <= 35 ? 'thriving' : 'steady';
}

const TIER_ORDER: MoodTier[] = ['thriving', 'steady', 'strained', 'struggling'];

/** Turns raw anonymous check-ins into the aggregate. Runs entirely client-side
 * in demo mode; the same function runs server-side once a tenant is live. */
export function buildSnapshotFromCheckIns(
  checkIns: AnonymousCheckIn[],
  opts: { orgName: string; headcount: number; periodLabel: string; k?: number },
): FeelingSnapshot {
  const k = opts.k ?? DEFAULT_K_ANONYMITY;
  const responses = checkIns.length;

  const tierCounts = new Map<MoodTier, number>(TIER_ORDER.map((t) => [t, 0]));
  const tierByCheckIn = new Map<string, MoodTier>();
  for (const c of checkIns) {
    const tier = tierForCheckIn(c);
    tierByCheckIn.set(c.id, tier);
    tierCounts.set(tier, (tierCounts.get(tier) ?? 0) + 1);
  }

  const moodTiers = TIER_ORDER.map((tier) => {
    const count = tierCounts.get(tier) ?? 0;
    return { tier, count, share: responses ? count / responses : 0 };
  });

  // Per-domain severity
  const domainAgg = new Map<AssessmentType, { sum: number; n: number; strained: number }>();
  for (const c of checkIns) {
    for (const d of c.domains) {
      const cur = domainAgg.get(d.domain) ?? { sum: 0, n: 0, strained: 0 };
      cur.sum += pct(d.score, d.maxScore);
      cur.n += 1;
      if (d.level !== 'Low') cur.strained += 1;
      domainAgg.set(d.domain, cur);
    }
  }
  const domains = [...domainAgg.entries()]
    .map(([domain, agg]) => ({
      domain,
      label: ASSESSMENT_METADATA[domain].title.replace(' Assessment', ''),
      mean: round1(agg.sum / agg.n),
      strainedShare: agg.strained / agg.n,
      n: agg.n,
    }))
    .sort((a, b) => b.mean - a.mean);

  // Item-level: which individual questions people scored worst on
  const itemAgg = new Map<string, { domain: AssessmentType; qid: number; hits: number; n: number }>();
  for (const c of checkIns) {
    for (const d of c.domains) {
      for (const item of d.items) {
        const key = `${d.domain}:${item.qid}`;
        const cur = itemAgg.get(key) ?? { domain: d.domain, qid: item.qid, hits: 0, n: 0 };
        cur.n += 1;
        if (item.score >= 3.75) cur.hits += 1; // "Often" or "Almost everyday"
        itemAgg.set(key, cur);
      }
    }
  }
  const toughestSignals = [...itemAgg.values()]
    .filter((i) => i.n >= k)
    .map((i) => ({
      domain: i.domain,
      question: ASSESSMENT_METADATA[i.domain].questions.find((q) => q.id === i.qid)?.text ?? `Question ${i.qid}`,
      share: i.hits / i.n,
    }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 6);

  // Themes from the pressure chips
  const themeCounts = new Map<Theme, { mentions: number; severitySum: number }>();
  for (const c of checkIns) {
    const worst = c.domains.length ? Math.max(...c.domains.map((d) => pct(d.score, d.maxScore))) : 50;
    for (const t of c.feelings) {
      const cur = themeCounts.get(t) ?? { mentions: 0, severitySum: 0 };
      cur.mentions += 1;
      cur.severitySum += worst;
      themeCounts.set(t, cur);
    }
  }
  const themes: SnapshotTheme[] = [...themeCounts.entries()]
    .map(([theme, agg]) => ({
      theme,
      label: THEME_LABELS[theme],
      mentions: agg.mentions,
      share: responses ? agg.mentions / responses : 0,
      severityMean: round1(agg.severitySum / agg.mentions),
    }))
    .sort((a, b) => b.mentions - a.mentions);

  // Teams, k-anonymity enforced
  const teamAgg = new Map<string, { n: number; strained: number; feelings: Map<Theme, number> }>();
  for (const c of checkIns) {
    if (!c.team || c.team === NOT_SAID) continue;
    const cur = teamAgg.get(c.team) ?? { n: 0, strained: 0, feelings: new Map<Theme, number>() };
    cur.n += 1;
    const tier = tierByCheckIn.get(c.id);
    if (tier === 'strained' || tier === 'struggling') cur.strained += 1;
    for (const f of c.feelings) cur.feelings.set(f, (cur.feelings.get(f) ?? 0) + 1);
    teamAgg.set(c.team, cur);
  }
  const teams: SnapshotTeam[] = [...teamAgg.entries()]
    .map(([team, agg]) => {
      const masked = agg.n < k;
      const top = [...agg.feelings.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        team,
        responses: agg.n,
        strainShare: masked ? 0 : agg.strained / agg.n,
        topFeeling: masked || !top ? null : THEME_LABELS[top[0]],
        masked,
      };
    })
    .sort((a, b) => b.strainShare - a.strainShare);

  const voices = checkIns
    .map((c) => c.note.trim())
    .filter((n) => n.length >= 12)
    .slice(-40);

  return {
    source: 'live',
    periodLabel: opts.periodLabel,
    orgName: opts.orgName,
    headcount: opts.headcount,
    responses,
    participationRate: opts.headcount ? Math.min(1, responses / opts.headcount) : 0,
    moodTiers,
    domains,
    toughestSignals,
    themes,
    teams,
    voices,
  };
}

/** Demo fallback: the seeded synthetic tenant, reshaped into the same
 * anonymised aggregate so every downstream surface has exactly one input
 * shape whether the data is real or seeded. */
export function buildSnapshotFromRollup(
  rollup: OrgRollup,
  opts: { orgName: string; periodLabel: string },
): FeelingSnapshot {
  const responses = rollup.participants;
  const riskDensity = (rollup.indices.riskDensity ?? 18) / 100;

  const strugglingShare = Math.max(0.05, riskDensity * 0.45);
  const strainedShare = 0.18;
  const steadyShare = 0.46;
  const thrivingShare = Math.max(0, 1 - strugglingShare - strainedShare - steadyShare);
  const shares: Record<MoodTier, number> = {
    thriving: thrivingShare,
    steady: steadyShare,
    strained: strainedShare,
    struggling: strugglingShare,
  };
  const moodTiers = TIER_ORDER.map((tier) => ({
    tier,
    count: Math.round(responses * shares[tier]),
    share: shares[tier],
  }));

  const domains = Object.entries(rollup.byDomain)
    .map(([domain, d]) => ({
      domain: domain as AssessmentType,
      label: ASSESSMENT_METADATA[domain as AssessmentType].title.replace(' Assessment', ''),
      mean: d.mean,
      strainedShare: d.bands.moderate + d.bands.high,
      n: d.n,
    }))
    .sort((a, b) => b.mean - a.mean);

  // Item means live on the 1.25 ("never") to 5 ("almost everyday") option
  // scale, not a 0-1 share — normalise across that full range so items with
  // genuinely different intensities don't all collapse to "about half".
  const toughestSignals = Object.entries(rollup.byItem)
    .map(([key, item]) => {
      const [domain, qid] = key.split(':');
      const meta = ASSESSMENT_METADATA[domain as AssessmentType];
      return {
        domain: domain as AssessmentType,
        question: meta?.questions.find((q) => q.id === Number(qid))?.text ?? key,
        share: Math.max(0, Math.min(1, (item.mean - 1.25) / (5 - 1.25))),
      };
    })
    .sort((a, b) => b.share - a.share)
    .slice(0, 6);

  const totalThemeMentions = Object.values(rollup.byTheme).reduce((s, t) => s + t.count, 0) || 1;
  const themes: SnapshotTheme[] = Object.entries(rollup.byTheme)
    .map(([theme, t]) => ({
      theme: theme as Theme,
      label: THEME_LABELS[theme as Theme] ?? theme,
      mentions: t.count,
      share: t.count / totalThemeMentions,
      severityMean: t.severityMean,
    }))
    .sort((a, b) => b.mentions - a.mentions);

  const teams: SnapshotTeam[] = Object.entries(rollup.byCohort)
    .filter(([key]) => key.startsWith('department:'))
    .map(([key, cell]) => {
      const cells = Object.values(cell).filter((v): v is NonNullable<typeof v> => !!v);
      const n = Math.max(...cells.map((c) => c.n), 0);
      const worst = cells.filter((c) => !c.masked).sort((a, b) => b.mean - a.mean)[0];
      const themeSlice = rollup.byCohortTheme[key] ?? {};
      const topTheme = Object.entries(themeSlice).sort((a, b) => (b[1]?.count ?? 0) - (a[1]?.count ?? 0))[0];
      return {
        team: key.split(':')[1],
        responses: n,
        strainShare: worst ? Math.min(1, worst.mean / 100) : 0,
        topFeeling: topTheme ? (THEME_LABELS[topTheme[0] as Theme] ?? topTheme[0]) : null,
        masked: !worst,
      };
    })
    .sort((a, b) => b.strainShare - a.strainShare);

  return {
    source: 'demo',
    periodLabel: opts.periodLabel,
    orgName: opts.orgName,
    headcount: rollup.headcount,
    responses,
    participationRate: rollup.participationRate,
    moodTiers,
    domains,
    toughestSignals,
    themes,
    teams,
    voices: [],
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
