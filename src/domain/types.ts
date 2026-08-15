import type { AssessmentType } from './assessments';
import type { Theme, RiskFlag } from './themes';
import type { CohortAttributes } from './cohorts';

/** Mirrors implementation.md §5 (Firestore data model). Kept here so the
 * domain layer, seeder, and Netlify functions all share one shape. */

export type Role = 'employee' | 'hr_admin' | 'hr_analyst' | 'wellness_manager' | 'ops_admin' | 'clinical_desk';
export type IdentityMode = 'aggregate_only' | 'identified';
export type Payer = 'company' | 'employee' | 'split';

export interface OrganizationBranding {
  primary: string;
  accent: string;
  surface: string;
  logoLight?: string;
  logoDark?: string;
  appName: string;
  supportEmail: string;
}

export interface OrganizationPolicy {
  identityMode: IdentityMode;
  kAnonymity: number;
  escalationContact: string;
  retentionDays: number;
  allowedCohortDims: string[];
}

export interface OrganizationPricing {
  groupSessionPaise: number;
  individualSessionPaise: number;
  payer: Payer;
  splitPercent?: number;
}

export interface Organization {
  orgId: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryDomain: string;
  customDomain?: string;
  branding: OrganizationBranding;
  plan: { tier: string; seats: number; contractStart: string; contractEnd?: string; trial: boolean };
  policy: OrganizationPolicy;
  pricing: OrganizationPricing;
  status: 'active' | 'trial' | 'suspended';
  createdAt: string;
}

export interface Member {
  uid: string;
  pseudoId: string;
  role: Role;
  cohort: CohortAttributes;
  status: 'invited' | 'active' | 'deactivated';
  consent: { analytics: boolean; escalation: boolean; identified?: boolean; acceptedAt: string; version: string };
}

export interface OrgSignal {
  id: string;
  orgId: string;
  pseudoId: string;
  /** Full compound key (all dims joined) — the identity of this employee's cell. */
  cohortKey: string;
  /** Raw attrs, so the rollup can slice by any single dimension independently
   * ("switch to any cohort dimension" — implementation.md §7.3) without
   * fragmenting sample sizes across the full compound key. */
  cohort: CohortAttributes;
  ts: string;
  domain: AssessmentType;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'Low' | 'Moderate' | 'High';
  items: { qid: number; score: number }[];
  source: 'assessment';
}

export interface OrgThemeSignal {
  id: string;
  orgId: string;
  pseudoId: string;
  cohortKey: string;
  cohort: CohortAttributes;
  ts: string;
  themes: { theme: Theme; weight: number; valence: 'negative' | 'neutral' | 'positive' }[];
  riskFlag: RiskFlag;
}

export type RollupGrain = 'day' | 'week' | 'month';

export interface OrgRollup {
  orgId: string;
  grain: RollupGrain;
  periodId: string;
  headcount: number;
  participants: number;
  participationRate: number;
  indices: {
    owi: number | null;
    burnout: number | null;
    focus: number | null;
    absenceRisk: number | null;
    riskDensity: number | null;
  };
  byDomain: Record<string, { mean: number; median: number; p90: number; bands: { low: number; moderate: number; high: number }; n: number; delta: number | null }>;
  /** Keyed by single-dimension slice (`department:Operations`, `location:Pune`, …) so the
   * Cohort Heatmap can switch dimensions without fragmenting sample sizes across the full
   * compound cohortKey. Cell = per-domain severity for that slice. */
  byCohort: Record<string, Partial<Record<AssessmentType, { mean: number; n: number; masked: boolean; delta: number | null }>>>;
  byItem: Record<string, { mean: number; delta: number | null; n: number }>;
  byTheme: Record<string, { count: number; share: number; delta: number | null; severityMean: number }>;
  /** Theme prevalence within a single-dimension cohort slice — "Operations mentions
   * workload 3x more often than the org average" is a far more robust, demo-legible
   * signal than a single-theme correlation coefficient on sparse per-session data. */
  byCohortTheme: Record<string, Partial<Record<Theme, { count: number; share: number; severityMean: number }>>>;
  /** Ranked per single-dimension cohort slice (e.g. "department:Operations"), not the full
   * compound key — keeps sample sizes large enough for the correlation to mean something. */
  drivers: { cohortKey: string; domain: AssessmentType; driver: string; strength: number; direction: 'positive' | 'negative'; n: number }[];
  computedAt: string;
  version: number;
}

export interface OrgInsight {
  id: string;
  orgId: string;
  headline: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  cohort?: string;
  evidence: string[];
  recommendedActions: string[];
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved';
  owner?: string;
  outcome?: string;
}
