import type { Organization } from '@/domain/types';
import {
  buildSnapshotFromCheckIns,
  buildSnapshotFromRollup,
  type FeelingSnapshot,
  type MoodTier,
} from '@/domain/snapshot';
import { DEFAULT_K_ANONYMITY } from '@/domain/cohorts';
import type { AnonymousCheckIn } from '@/domain/check-in';
import { THEME_LABELS, type Theme } from '@/domain/themes';
import { getOverallRollup } from './analytics-service';
import { loadCheckIns, loadCheckInsAsync } from './response-store';

export function currentPeriodLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function liveCheckInCount(): number {
  return loadCheckIns().length;
}

/**
 * Calculates mood tier for a single check-in.
 */
function tierForCheckIn(c: AnonymousCheckIn): MoodTier {
  if (c.domains.length === 0) return 'steady';
  const highs = c.domains.filter((d) => d.level === 'High').length;
  const moderates = c.domains.filter((d) => d.level === 'Moderate').length;
  const worst = Math.max(...c.domains.map((d) => (d.score / d.maxScore) * 100));
  if (highs >= 2 || worst >= 80) return 'struggling';
  if (highs === 1 || moderates >= 2) return 'strained';
  if (moderates === 1) return 'steady';
  return worst <= 35 ? 'thriving' : 'steady';
}

/**
 * Blends baseline demo rollup data with live check-ins.
 * This guarantees the dashboard stays populated for demonstrations while immediately
 * reflecting every newly submitted assessment!
 */
export function blendSnapshotWithCheckIns(
  base: FeelingSnapshot,
  checkIns: AnonymousCheckIn[],
): FeelingSnapshot {
  if (checkIns.length === 0) return base;

  const totalResponses = base.responses + checkIns.length;
  const headcount = Math.max(base.headcount, totalResponses);
  const participationRate = Math.min(1, totalResponses / headcount);

  // 1. Blend Mood Tiers
  const tierCounts: Record<MoodTier, number> = {
    thriving: base.moodTiers.find((t) => t.tier === 'thriving')?.count ?? 0,
    steady: base.moodTiers.find((t) => t.tier === 'steady')?.count ?? 0,
    strained: base.moodTiers.find((t) => t.tier === 'strained')?.count ?? 0,
    struggling: base.moodTiers.find((t) => t.tier === 'struggling')?.count ?? 0,
  };

  for (const c of checkIns) {
    const tier = tierForCheckIn(c);
    tierCounts[tier] += 1;
  }

  const moodTiers = (['thriving', 'steady', 'strained', 'struggling'] as MoodTier[]).map((tier) => ({
    tier,
    count: tierCounts[tier],
    share: totalResponses ? tierCounts[tier] / totalResponses : 0,
  }));

  // 2. Blend Themes / Pressures
  const themeMap = new Map<Theme, { mentions: number; label: string; severityMean: number }>();
  for (const t of base.themes) {
    themeMap.set(t.theme, { mentions: t.mentions, label: t.label, severityMean: t.severityMean });
  }

  for (const c of checkIns) {
    for (const f of c.feelings) {
      const cur = themeMap.get(f) ?? {
        mentions: 0,
        label: THEME_LABELS[f] ?? f,
        severityMean: 45,
      };
      cur.mentions += 1;
      themeMap.set(f, cur);
    }
  }

  const totalThemeMentions = Array.from(themeMap.values()).reduce((sum, item) => sum + item.mentions, 0) || 1;
  const themes = Array.from(themeMap.entries())
    .map(([theme, item]) => ({
      theme,
      label: item.label,
      mentions: item.mentions,
      share: item.mentions / totalThemeMentions,
      severityMean: item.severityMean,
    }))
    .sort((a, b) => b.mentions - a.mentions);

  // 3. Blend Voices (Employee Notes)
  const liveNotes = checkIns
    .map((c) => c.note?.trim())
    .filter((n): n is string => Boolean(n && n.length >= 5));

  const voices = [...liveNotes, ...base.voices].slice(0, 30);

  // 4. Blend Teams
  const teamMap = new Map(base.teams.map((t) => [t.team, { ...t }]));
  for (const c of checkIns) {
    if (c.team && c.team !== 'Prefer not to say') {
      const cur = teamMap.get(c.team) ?? {
        team: c.team,
        responses: 0,
        strainShare: 0.2,
        topFeeling: null,
        masked: false,
      };
      cur.responses += 1;
      const tier = tierForCheckIn(c);
      if (tier === 'strained' || tier === 'struggling') {
        cur.strainShare = Math.min(1, cur.strainShare + 0.05);
      }
      if (c.feelings.length > 0) {
        cur.topFeeling = THEME_LABELS[c.feelings[0]] ?? c.feelings[0];
      }
      cur.masked = false;
      teamMap.set(c.team, cur);
    }
  }

  const teams = Array.from(teamMap.values()).sort((a, b) => b.strainShare - a.strainShare);

  return {
    ...base,
    source: checkIns.length > 0 ? 'live' : base.source,
    responses: totalResponses,
    headcount,
    participationRate,
    moodTiers,
    themes,
    teams,
    voices,
  };
}

/**
 * Synchronous snapshot getter for fast initial render.
 */
export function getFeelingSnapshot(organization: Organization): FeelingSnapshot {
  const checkIns = loadCheckIns();
  const periodLabel = currentPeriodLabel();
  const base = buildSnapshotFromRollup(getOverallRollup(), { orgName: organization.name, periodLabel });
  return blendSnapshotWithCheckIns(base, checkIns);
}

/**
 * Asynchronous snapshot getter that loads live check-ins from Supabase.
 */
export async function getFeelingSnapshotAsync(organization: Organization): Promise<FeelingSnapshot> {
  const checkIns = await loadCheckInsAsync(organization.orgId);
  const periodLabel = currentPeriodLabel();
  const base = buildSnapshotFromRollup(getOverallRollup(), { orgName: organization.name, periodLabel });
  return blendSnapshotWithCheckIns(base, checkIns);
}
