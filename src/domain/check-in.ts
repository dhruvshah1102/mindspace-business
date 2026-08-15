import type { AssessmentType, AssessmentLevel } from './assessments';
import type { Theme } from './themes';

/**
 * What an employee check-in actually stores. Deliberately identity-free:
 * there is no uid, email, name, or device fingerprint on this record, and
 * nothing links two submissions by the same person. HR literally cannot
 * de-anonymise it because the identifying column was never written.
 *
 * Coarse cohort fields (team / work pattern / tenure) are optional and always
 * offer "Prefer not to say" — they exist so the report can say "Operations is
 * carrying more than most", never to narrow down to a person.
 */
export interface CheckInDomainResult {
  domain: AssessmentType;
  score: number;
  maxScore: number;
  level: AssessmentLevel;
  items: { qid: number; score: number }[];
}

export interface AnonymousCheckIn {
  /** Random per-submission id. Not a person id — a second check-in gets a new one. */
  id: string;
  submittedAt: string;
  team: string;
  workPattern: string;
  tenureBand: string;
  domains: CheckInDomainResult[];
  /** Self-selected pressure chips, mapped onto the shared theme taxonomy. */
  feelings: Theme[];
  /** Optional free text, in the employee's own words. Unlinked to any identity. */
  note: string;
}

export const NOT_SAID = 'Prefer not to say';

export const TEAM_OPTIONS = [
  'Engineering',
  'Operations',
  'Sales',
  'Support',
  'Marketing',
  'Finance',
  'HR',
  'Logistics',
  NOT_SAID,
];

export const WORK_PATTERN_OPTIONS = ['Mostly on-site', 'Hybrid', 'Fully remote', 'Shift-based', NOT_SAID];

export const TENURE_OPTIONS = ['Less than a year', '1–3 years', '3–5 years', '5+ years', NOT_SAID];

/** Plain-language pressure chips. Employees pick what's weighing on them; each
 * maps to a taxonomy theme so free-text and chips aggregate into one signal. */
export const FEELING_CHIPS: { theme: Theme; label: string }[] = [
  { theme: 'workload', label: 'Too much on my plate' },
  { theme: 'long_hours', label: 'Working late too often' },
  { theme: 'sleep', label: "I'm not sleeping well" },
  { theme: 'work_life_balance', label: 'No room for life outside work' },
  { theme: 'manager_relationship', label: 'I need more support from my manager' },
  { theme: 'role_clarity', label: "I'm unclear what's expected of me" },
  { theme: 'recognition', label: 'My work goes unnoticed' },
  { theme: 'career_growth', label: "I can't see a path forward" },
  { theme: 'compensation_stress', label: 'Money worries' },
  { theme: 'interpersonal_conflict', label: 'Tension with people I work with' },
  { theme: 'job_insecurity', label: 'I feel uncertain about my job' },
  { theme: 'remote_isolation', label: 'I feel disconnected from the team' },
  { theme: 'commute', label: 'My commute drains me' },
  { theme: 'physical_health', label: 'My health is suffering' },
  { theme: 'family_caregiving', label: 'Caring for family at home' },
  { theme: 'self_esteem', label: 'I doubt myself a lot' },
];

/** The three domains the workplace check-in runs. The full six-domain suite
 * exists in the clinical product; asking 60 questions at a coffee-break kiosk
 * gets abandoned halfway, and a half-finished check-in is worse than none. */
export const CHECK_IN_DOMAINS: AssessmentType[] = ['stress', 'anxiety', 'depression'];

export function newCheckInId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `chk_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
