import type { Theme } from './themes';

/**
 * Platform engagement — how many people actually *used* MindSpace this cycle.
 *
 * This is a deliberately different question from the wellbeing snapshot. The
 * snapshot says how people feel; this says whether the support you are paying
 * for is reaching anyone. Both are anonymous by construction, but they are
 * anonymous for different reasons:
 *
 * - A check-in is *unlinked* — no identity was ever written, and two check-ins
 *   by the same person cannot be tied together.
 * - Engagement has to count *unique people* ("14 employees talked to Tara"),
 *   so it counts against a pseudonymous id and never against a name, email or
 *   uid. HR sees headcounts and rates. HR never sees who.
 *
 * Every cut below company level carries the same k-anonymity threshold the
 * rest of the console uses: a team with fewer than k participants is masked
 * rather than estimated, because "1 of the 3 people in Legal booked therapy"
 * identifies a person.
 */

export type EngagementFeature = 'checkin' | 'assessment' | 'tara' | 'therapy';

export const FEATURE_LABELS: Record<EngagementFeature, string> = {
  checkin: 'Anonymous check-in',
  assessment: 'Full assessment',
  tara: 'Tara, the AI companion',
  therapy: 'Therapy session booked',
};

/** One-line explanation of what the number actually counts, shown under each tile. */
export const FEATURE_BLURBS: Record<EngagementFeature, string> = {
  checkin: 'Pulse-check submissions. Counted as responses, not people — check-ins are unlinked by design.',
  assessment: 'Finished a full clinical assessment module.',
  tara: 'Held at least one conversation with the AI companion.',
  therapy: 'Booked time with a therapist — group circle or private 1:1.',
};

export interface FeatureUsage {
  feature: EngagementFeature;
  label: string;
  /** The headline count. Read it through `unit` — it is not always people. */
  count: number;
  /**
   * What `count` actually counts.
   *
   * Login-gated features ('people') can be counted per person, because there
   * is a pseudonymous id to count against. The anonymous check-in cannot:
   * nothing links two submissions by the same person, by construction, so the
   * only honest number is 'responses'. Reporting it as unique people would
   * quietly claim a tracking capability the product deliberately does not have.
   */
  unit: 'people' | 'responses';
  /** Total times it was used — repeat use is the signal that it's landing. */
  totalEvents: number;
  /** count / headcount. */
  reach: number;
  /** Change vs the previous cycle, in the same unit. */
  delta: number;
}

/** An ordered drop-off sequence — each stage is a subset of the one above it. */
export interface FunnelStage {
  key: string;
  label: string;
  employees: number;
  /** Share of the whole workforce. */
  ofWorkforce: number;
  /** Share of the stage immediately above — the actual drop-off rate. */
  ofPrevious: number;
}

export interface EngagementWeek {
  /** Short axis label, e.g. "12 Jul". */
  label: string;
  weekStart: string;
  checkin: number;
  assessment: number;
  tara: number;
  therapy: number;
}

export type SessionFormat = 'group_circle' | 'private_1to1' | 'workshop';

export const SESSION_LABELS: Record<SessionFormat, string> = {
  group_circle: 'Group decompression circle',
  private_1to1: 'Private 1:1 counselling',
  workshop: 'Therapist-led workshop',
};

export interface BookingBreakdown {
  format: SessionFormat;
  label: string;
  /** Distinct employees who booked this format. */
  employees: number;
  /** Seats taken across all sittings of this format. */
  seats: number;
  /** Cost to the company this cycle, in paise, per the tenant's pricing. */
  spendPaise: number;
  /** True when fewer than k people booked it — the count is withheld. */
  masked: boolean;
}

export interface TeamEngagement {
  team: string;
  /** People on the team who used any feature. */
  activeEmployees: number;
  /** activeEmployees / team size. */
  engagementRate: number;
  masked: boolean;
}

/** What people bring to Tara, aggregated across conversations. Topics are
 * classified onto the shared theme taxonomy, never stored as transcript text. */
export interface TaraTopic {
  theme: Theme;
  label: string;
  conversations: number;
  share: number;
}

export interface EngagementSummary {
  source: 'live' | 'demo';
  periodLabel: string;
  orgName: string;
  headcount: number;
  /** Distinct people who touched *any* feature this cycle. */
  activeEmployees: number;
  /** activeEmployees / headcount. */
  activationRate: number;
  activeDelta: number;
  features: FeatureUsage[];
  funnel: FunnelStage[];
  weekly: EngagementWeek[];
  bookings: BookingBreakdown[];
  byTeam: TeamEngagement[];
  taraTopics: TaraTopic[];
  /** Median conversation length, in turns — a shallow read means Tara isn't landing. */
  taraMedianTurns: number;
  /** Conversations where Tara surfaced the escalation pathway to a human. */
  taraEscalations: number;
  /** The k-anonymity threshold every cut above was masked against. */
  k: number;
}
