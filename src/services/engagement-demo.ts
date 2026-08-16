import type { Organization } from '@/domain/types';
import type { FeelingSnapshot } from '@/domain/snapshot';
import { DEFAULT_K_ANONYMITY } from '@/domain/cohorts';
import { THEME_LABELS, type Theme } from '@/domain/themes';
import {
  FEATURE_LABELS,
  SESSION_LABELS,
  type BookingBreakdown,
  type EngagementFeature,
  type EngagementSummary,
  type EngagementWeek,
  type FeatureUsage,
  type FunnelStage,
  type TaraTopic,
  type TeamEngagement,
} from '@/domain/engagement';

/**
 * Demo engagement data for the HR console.
 *
 * The employee-side surfaces (login, Tara, booking) are not built yet, so
 * there is no real event stream to aggregate. This module synthesises one that
 * is *shaped* exactly like the real thing, so the console can be reviewed and
 * signed off before the employee app lands — and so that swapping in live data
 * later is a change of source, not a change of every chart.
 *
 * Two properties matter more than the specific numbers:
 *
 * 1. **Deterministic.** Seeded from the org id, so the dashboard shows the same
 *    figures on every render and every reload. A demo whose numbers drift when
 *    you switch tabs reads as broken.
 * 2. **Internally consistent.** Headcount, teams and pressure themes are taken
 *    from the same `FeelingSnapshot` the written report is built from, and the
 *    funnel is nested by construction. Nothing here can contradict the report
 *    sitting one tab over.
 */

/** mulberry32 — small, fast, and stable across engines. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Employees per team, inferred from the snapshot's response spread. */
function teamSizes(snapshot: FeelingSnapshot, rand: () => number): Map<string, number> {
  const sizes = new Map<string, number>();
  const totalResponses = snapshot.teams.reduce((n, t) => n + t.responses, 0) || 1;
  for (const team of snapshot.teams) {
    // Responses are a sample of the team, not the team — scale up by the
    // company-wide participation rate, with a little variance per team.
    const share = team.responses / totalResponses;
    const inferred = Math.round(snapshot.headcount * share * (0.85 + rand() * 0.4));
    sizes.set(team.team, Math.max(team.responses, inferred, 2));
  }
  return sizes;
}

export function buildDemoEngagement(
  organization: Organization,
  snapshot: FeelingSnapshot,
): EngagementSummary {
  const k = organization.policy.kAnonymity || DEFAULT_K_ANONYMITY;
  const rand = seededRandom(hashString(organization.orgId + snapshot.periodLabel));
  const headcount = snapshot.headcount;

  // ── The engagement ladder ────────────────────────────────────────────────
  // Nested by construction: every stage is a subset of the one above it, so
  // the funnel cannot show a stage growing. This is depth of support-seeking,
  // not a marketing conversion funnel.
  //
  // The anonymous check-in is deliberately NOT a stage here. It needs no
  // login, so its responses routinely outnumber signed-in employees, and
  // slotting it into a nested funnel would either break the nesting or (worse)
  // silently clamp it and show a meaningless 100% step. It lives in the
  // feature-reach chart instead, counted in responses.
  const activated = Math.round(headcount * (0.74 + rand() * 0.08));
  const assessed = Math.round(activated * (0.68 + rand() * 0.09));
  const taraUsers = Math.round(assessed * (0.44 + rand() * 0.1));
  const therapyUsers = Math.round(taraUsers * (0.21 + rand() * 0.07));

  const funnelRaw: { key: string; label: string; employees: number }[] = [
    { key: 'activated', label: 'Signed in to MindSpace', employees: activated },
    { key: 'assessed', label: 'Ran a full assessment', employees: assessed },
    { key: 'tara', label: 'Opened up to Tara', employees: taraUsers },
    { key: 'therapy', label: 'Booked a human therapist', employees: therapyUsers },
  ];

  const funnel: FunnelStage[] = funnelRaw.map((stage, i) => ({
    ...stage,
    ofWorkforce: headcount ? stage.employees / headcount : 0,
    ofPrevious: i === 0 ? 1 : funnelRaw[i - 1].employees ? stage.employees / funnelRaw[i - 1].employees : 0,
  }));

  // ── Per-feature reach ────────────────────────────────────────────────────
  // Check-in is measured in responses (it is unlinked, so unique people is not
  // a number that exists); everything else is login-gated and counts people.
  const countByFeature: Record<EngagementFeature, number> = {
    checkin: snapshot.responses,
    assessment: assessed,
    tara: taraUsers,
    therapy: therapyUsers,
  };
  const unitByFeature: Record<EngagementFeature, FeatureUsage['unit']> = {
    checkin: 'responses',
    assessment: 'people',
    tara: 'people',
    therapy: 'people',
  };
  // Repeat use — the number that says whether a feature is a habit or a
  // one-off. Tara is conversational, so it earns the highest multiple.
  const repeatRate: Record<EngagementFeature, number> = {
    checkin: 1,
    assessment: 1.3,
    tara: 4.6,
    therapy: 1.6,
  };

  const features: FeatureUsage[] = (['checkin', 'assessment', 'tara', 'therapy'] as EngagementFeature[]).map(
    (feature) => {
      const count = countByFeature[feature];
      return {
        feature,
        label: FEATURE_LABELS[feature],
        count,
        unit: unitByFeature[feature],
        totalEvents: Math.round(count * repeatRate[feature] * (0.9 + rand() * 0.2)),
        reach: headcount ? Math.min(1, count / headcount) : 0,
        delta: Math.round((rand() - 0.3) * count * 0.22),
      };
    },
  );

  const activeEmployees = activated;

  // ── Eight-week trend ─────────────────────────────────────────────────────
  // Weekly uniques, trending gently upward toward the current cycle totals so
  // the last point agrees with the tiles above it.
  const weekly: EngagementWeek[] = [];
  // Truncated to midnight so the series is stable within a day — carrying the
  // current millisecond made two calls seconds apart produce different data,
  // which is exactly the drift this module exists to avoid.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7);
    // Ramp from ~55% of current volume up to 100% over the eight weeks.
    const ramp = 0.55 + ((7 - i) / 7) * 0.45;
    const jitter = () => 0.88 + rand() * 0.24;
    weekly.push({
      label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      weekStart: weekStart.toISOString(),
      checkin: Math.round((snapshot.responses / 8) * ramp * jitter()),
      assessment: Math.round((assessed / 6) * ramp * jitter()),
      tara: Math.round((taraUsers / 3) * ramp * jitter()),
      therapy: Math.round((therapyUsers / 4) * ramp * jitter()),
    });
  }

  // ── Bookings by format ───────────────────────────────────────────────────
  const groupEmployees = Math.round(therapyUsers * 0.52);
  const privateEmployees = Math.round(therapyUsers * 0.31);
  const workshopEmployees = Math.max(0, therapyUsers - groupEmployees - privateEmployees);
  const { groupSessionPaise, individualSessionPaise } = organization.pricing;

  const bookingsRaw: { format: BookingBreakdown['format']; employees: number; seatMultiple: number; unitPaise: number }[] = [
    { format: 'group_circle', employees: groupEmployees, seatMultiple: 1.7, unitPaise: groupSessionPaise },
    { format: 'private_1to1', employees: privateEmployees, seatMultiple: 1.4, unitPaise: individualSessionPaise },
    { format: 'workshop', employees: workshopEmployees, seatMultiple: 1.1, unitPaise: groupSessionPaise },
  ];

  const bookings: BookingBreakdown[] = bookingsRaw.map((b) => {
    const masked = b.employees > 0 && b.employees < k;
    const seats = Math.round(b.employees * b.seatMultiple);
    return {
      format: b.format,
      label: SESSION_LABELS[b.format],
      employees: masked ? 0 : b.employees,
      seats: masked ? 0 : seats,
      spendPaise: masked ? 0 : seats * b.unitPaise,
      masked,
    };
  });

  // ── Per-team engagement, k-masked ────────────────────────────────────────
  const sizes = teamSizes(snapshot, rand);
  const byTeam: TeamEngagement[] = snapshot.teams
    .map((team) => {
      const size = sizes.get(team.team) ?? team.responses;
      // Teams under more strain reach for support slightly more often — the
      // pattern HR should actually be looking for on this chart.
      const baseRate = 0.42 + team.strainShare * 0.3 + rand() * 0.16;
      const active = Math.min(size, Math.round(size * Math.min(0.95, baseRate)));
      const masked = team.masked || active < k;
      return {
        team: team.team,
        activeEmployees: masked ? 0 : active,
        engagementRate: masked ? 0 : active / size,
        masked,
      };
    })
    .sort((a, b) => b.engagementRate - a.engagementRate);

  // ── What people bring to Tara ────────────────────────────────────────────
  // Classified onto the same theme taxonomy the check-in chips use, so the
  // topics line up with the pressures on the report. Never transcript text.
  const totalTaraConversations = Math.round(taraUsers * repeatRate.tara);
  const topThemes = snapshot.themes.slice(0, 6);
  const themeWeights = topThemes.map((t, i) => t.mentions * (1 - i * 0.06) * (0.85 + rand() * 0.3));
  const weightTotal = themeWeights.reduce((s, w) => s + w, 0) || 1;
  const taraTopics: TaraTopic[] = topThemes
    .map((t, i) => {
      const share = themeWeights[i] / weightTotal;
      return {
        theme: t.theme as Theme,
        label: THEME_LABELS[t.theme as Theme] ?? t.label,
        conversations: Math.round(totalTaraConversations * share),
        share,
      };
    })
    .sort((a, b) => b.conversations - a.conversations);

  return {
    source: 'demo',
    periodLabel: snapshot.periodLabel,
    orgName: snapshot.orgName,
    headcount,
    activeEmployees,
    activationRate: headcount ? activeEmployees / headcount : 0,
    activeDelta: Math.round(activeEmployees * (0.06 + rand() * 0.06)),
    features,
    funnel,
    weekly,
    bookings,
    byTeam,
    taraTopics,
    taraMedianTurns: 7 + Math.round(rand() * 4),
    taraEscalations: Math.max(1, Math.round(totalTaraConversations * 0.04)),
    k,
  };
}
