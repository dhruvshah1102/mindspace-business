/**
 * Generates a realistic synthetic tenant so the analytics console is
 * demoable before a single real employee signs in — implementation.md §11
 * ("sales-critical shortcut"). Deterministic (seeded RNG) so the demo is
 * reproducible. Writes static JSON the frontend loads directly in demo mode.
 *
 * Run: npm run seed
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ASSESSMENT_METADATA, ASSESSMENT_TYPES, type AssessmentType } from '../src/domain/assessments';
import { computeRollup } from '../src/domain/rollup-engine';
import { cohortKey } from '../src/domain/cohorts';
import { THEME_TAXONOMY, type Theme } from '../src/domain/themes';
import type { OrgSignal, OrgThemeSignal, OrgRollup, Organization, Member } from '../src/domain/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../src/data/demo');

// ── seeded RNG (mulberry32) for reproducibility ──
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260815);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const randRange = (min: number, max: number) => min + rng() * (max - min);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const ORG_ID = 'demo-acme';
const DEPARTMENTS = ['Engineering', 'Operations', 'Sales', 'Support', 'Finance', 'HR', 'Marketing', 'Logistics'] as const;
const LOCATIONS = ['Pune', 'Bengaluru', 'Remote'] as const;
const TENURE_BANDS = ['<1y', '1-3y', '3-5y', '5y+'] as const;
const LEVELS = ['IC', 'Lead', 'Manager'] as const;

const HEADCOUNT_PER_DEPT: Record<(typeof DEPARTMENTS)[number], number> = {
  Engineering: 110,
  Operations: 95,
  Sales: 70,
  Support: 55,
  Logistics: 60,
  Marketing: 35,
  Finance: 30,
  HR: 25,
};

/** Per-department severity bias (0 = healthy, 1 = severe) and dominant themes —
 * this is what makes the Driver Analysis screen tell a coherent story.
 * Operations is the deliberate headline: a visibly deteriorating department
 * driven by identifiable items (sleep, energy) and themes (workload,
 * manager_relationship) — the exact "here's what's actually wrong" narrative
 * the analytics console exists to surface. */
const DEPT_PROFILE: Record<
  (typeof DEPARTMENTS)[number],
  { baseSeverity: number; trendPerWeek: number; themes: Theme[] }
> = {
  Operations: { baseSeverity: 0.4, trendPerWeek: 0.022, themes: ['workload', 'manager_relationship', 'long_hours'] },
  Engineering: { baseSeverity: 0.33, trendPerWeek: 0.008, themes: ['sleep', 'long_hours', 'workload'] },
  Logistics: { baseSeverity: 0.36, trendPerWeek: 0.007, themes: ['workload', 'physical_health', 'commute'] },
  Support: { baseSeverity: 0.37, trendPerWeek: 0.005, themes: ['workload', 'interpersonal_conflict', 'job_insecurity'] },
  Sales: { baseSeverity: 0.3, trendPerWeek: 0.002, themes: ['recognition', 'compensation_stress'] },
  Marketing: { baseSeverity: 0.27, trendPerWeek: 0.001, themes: ['role_clarity', 'career_growth'] },
  Finance: { baseSeverity: 0.22, trendPerWeek: -0.001, themes: ['financial_stress', 'role_clarity'] },
  HR: { baseSeverity: 0.2, trendPerWeek: -0.002, themes: ['career_growth', 'work_life_balance'] },
};

const WEEKS = 12;

interface SyntheticEmployee {
  pseudoId: string;
  department: (typeof DEPARTMENTS)[number];
  location: (typeof LOCATIONS)[number];
  tenureBand: (typeof TENURE_BANDS)[number];
  level: (typeof LEVELS)[number];
  personalOffset: number; // individual variance around dept baseline
}

function buildEmployees(): SyntheticEmployee[] {
  const employees: SyntheticEmployee[] = [];
  let idx = 0;
  for (const dept of DEPARTMENTS) {
    for (let i = 0; i < HEADCOUNT_PER_DEPT[dept]; i++) {
      employees.push({
        pseudoId: `p_${(idx++).toString(36)}`,
        department: dept,
        location: pick(LOCATIONS),
        tenureBand: pick(TENURE_BANDS),
        level: rng() < 0.15 ? 'Manager' : rng() < 0.35 ? 'Lead' : 'IC',
        personalOffset: randRange(-0.15, 0.15),
      });
    }
  }
  return employees;
}

function scoreForOption(severity01: number): { value: string; score: number } {
  // Small residual item-level noise, on top of the shared per-person-week
  // noise already folded into severity01 by the caller.
  const noise = randRange(-0.03, 0.03);
  const s = clamp(severity01 + noise, 0, 1);
  const bucket = Math.min(3, Math.floor(s * 4));
  const options = [
    { value: 'never', score: 1.25 },
    { value: 'rarely', score: 2.5 },
    { value: 'often', score: 3.75 },
    { value: 'almost_everyday', score: 5 },
  ];
  return options[bucket];
}

function levelFor(score: number, type: AssessmentType): 'Low' | 'Moderate' | 'High' {
  const ranges = ASSESSMENT_METADATA[type].levelRanges;
  if (score <= ranges.low) return 'Low';
  if (score <= ranges.moderate) return 'Moderate';
  return 'High';
}

function generateSignal(
  emp: SyntheticEmployee,
  domain: AssessmentType,
  weekIdx: number,
  ts: string,
  weekNoise: number,
): OrgSignal {
  const profile = DEPT_PROFILE[emp.department];
  // weekNoise is shared with this person's TARA theme signal for the same
  // week, so a real week-to-week wellbeing swing shows up consistently in
  // both channels — that shared variance is what the driver correlation
  // is supposed to detect.
  const weekSeverity = clamp(profile.baseSeverity + profile.trendPerWeek * weekIdx + emp.personalOffset + weekNoise, 0.03, 0.95);

  const meta = ASSESSMENT_METADATA[domain];
  const items = meta.questions.map((q) => {
    // sleep/energy/concentration items run hotter for departments whose theme profile includes them
    const isHotItem =
      (domain === 'work_mood' && [1, 3, 4, 6, 7].includes(q.id) && (profile.themes.includes('sleep') || profile.themes.includes('workload'))) ||
      (domain === 'work_anxiety' && q.id === 5 && profile.themes.includes('long_hours'));
    const itemSeverity = clamp(weekSeverity + (isHotItem ? 0.12 : 0), 0.03, 0.97);
    const opt = scoreForOption(itemSeverity);
    return { qid: q.id, score: opt.score };
  });

  const score = Math.round(items.reduce((s, i) => s + i.score, 0) * 100) / 100;
  const percentage = Math.round((score / meta.maxScore) * 100);
  const level = levelFor(score, domain);

  return {
    id: `sig_${emp.pseudoId}_${domain}_${weekIdx}`,
    orgId: ORG_ID,
    pseudoId: emp.pseudoId,
    cohortKey: cohortKey(empCohortAttrs(emp)),
    cohort: empCohortAttrs(emp),
    ts,
    domain,
    score,
    maxScore: meta.maxScore,
    percentage,
    level,
    items,
    source: 'assessment',
  };
}

function empCohortAttrs(emp: SyntheticEmployee) {
  return { department: emp.department, location: emp.location, tenureBand: emp.tenureBand, level: emp.level };
}

function generateThemeSignal(emp: SyntheticEmployee, weekIdx: number, ts: string, weekNoise: number): OrgThemeSignal | null {
  // Not everyone talks to TARA every week
  if (rng() > 0.4) return null;
  const profile = DEPT_PROFILE[emp.department];
  const themeCount = 1 + Math.floor(rng() * 2);
  const chosen = new Set<Theme>();
  while (chosen.size < themeCount) {
    // 70% chance to pick from the department's dominant themes, else random
    const theme = rng() < 0.7 ? pick(profile.themes) : pick(THEME_TAXONOMY);
    chosen.add(theme);
  }
  const weekSeverity = clamp(profile.baseSeverity + profile.trendPerWeek * weekIdx + emp.personalOffset + weekNoise, 0.05, 0.95);
  const riskFlag: OrgThemeSignal['riskFlag'] = weekSeverity > 0.75 ? 'high' : weekSeverity > 0.55 ? 'moderate' : weekSeverity > 0.35 ? 'low' : 'none';

  return {
    id: `theme_${emp.pseudoId}_${weekIdx}`,
    orgId: ORG_ID,
    pseudoId: emp.pseudoId,
    cohortKey: cohortKey(empCohortAttrs(emp)),
    cohort: empCohortAttrs(emp),
    ts,
    themes: [...chosen].map((theme) => ({ theme, weight: clamp(weekSeverity + randRange(-0.03, 0.03), 0.1, 1), valence: 'negative' as const })),
    riskFlag,
  };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const employees = buildEmployees();
  const headcount = employees.length;

  const organization: Organization = {
    orgId: ORG_ID,
    name: 'MindSpace',
    legalName: 'MindSpace Technologies Pvt Ltd',
    primaryDomain: 'mindspace',
    branding: {
      primary: '#2D6A4F',
      accent: '#A9CBAE',
      surface: '#FAF7F0',
      appName: 'MindSpace',
      supportEmail: 'wellness@mindspace.example',
    },
    plan: { tier: 'pilot', seats: headcount, contractStart: '2026-06-01', trial: true },
    policy: { identityMode: 'aggregate_only', kAnonymity: 5, escalationContact: 'safety@mindspace.example', retentionDays: 730, allowedCohortDims: ['department', 'location', 'tenureBand', 'level'] },
    pricing: { groupSessionPaise: 50000, individualSessionPaise: 150000, payer: 'split', splitPercent: 50 },
    status: 'trial',
    createdAt: '2026-06-01T00:00:00.000Z',
  };

  const members: Member[] = employees.map((e) => ({
    uid: e.pseudoId,
    pseudoId: e.pseudoId,
    role: 'employee',
    cohort: { department: e.department, location: e.location, tenureBand: e.tenureBand, level: e.level },
    status: 'active',
    consent: { analytics: true, escalation: true, acceptedAt: '2026-06-01T00:00:00.000Z', version: '1.0' },
  }));

  const allSignals: OrgSignal[] = [];
  const allThemeSignals: OrgThemeSignal[] = [];
  const weeklyRollups: OrgRollup[] = [];

  const now = new Date('2026-08-15T00:00:00.000Z');

  let prevByDomain: Record<string, number> | undefined;
  let prevByItem: Record<string, number> | undefined;
  let prevByTheme: Record<string, number> | undefined;
  let prevByCohort: Record<string, number> | undefined;

  for (let w = 0; w < WEEKS; w++) {
    const weekDate = new Date(now.getTime() - (WEEKS - 1 - w) * 7 * 24 * 3600 * 1000);
    const ts = weekDate.toISOString();
    const periodId = isoWeek(weekDate);

    const weekSignals: OrgSignal[] = [];
    const weekThemeSignals: OrgThemeSignal[] = [];

    for (const emp of employees) {
      // How this person's wellbeing actually swung this specific week, shared
      // by both the assessment they may take and the TARA session they may
      // have — real correlated signal for Driver Analysis to find.
      const weekNoise = randRange(-0.06, 0.06);

      // Monthly full suite: only ~25% of employees assessed in any given week (spreads the monthly cadence)
      if (rng() < 0.28) {
        const domain = pick(ASSESSMENT_TYPES);
        weekSignals.push(generateSignal(emp, domain, w, ts, weekNoise));
      }
      const themeSig = generateThemeSignal(emp, w, ts, weekNoise);
      if (themeSig) weekThemeSignals.push(themeSig);
    }

    allSignals.push(...weekSignals);
    allThemeSignals.push(...weekThemeSignals);

    const rollup = computeRollup({
      orgId: ORG_ID,
      grain: 'week',
      periodId,
      headcount,
      signals: weekSignals,
      themeSignals: weekThemeSignals,
      previousByDomain: prevByDomain,
      previousByItem: prevByItem,
      previousByTheme: prevByTheme,
      previousByCohort: prevByCohort,
    });
    weeklyRollups.push(rollup);

    prevByDomain = Object.fromEntries(Object.entries(rollup.byDomain).map(([k, v]) => [k, v.mean]));
    prevByItem = Object.fromEntries(Object.entries(rollup.byItem).map(([k, v]) => [k, v.mean]));
    prevByTheme = Object.fromEntries(Object.entries(rollup.byTheme).map(([k, v]) => [k, v.share]));
    prevByCohort = {};
    for (const [sliceKey, cell] of Object.entries(rollup.byCohort)) {
      for (const [domain, stats] of Object.entries(cell)) {
        if (stats && !stats.masked) prevByCohort[`${sliceKey}.${domain}`] = stats.mean;
      }
    }
  }

  // Full 90-day rollup (all signals) for the Overview/Explorer default view
  const overallRollup = computeRollup({
    orgId: ORG_ID,
    grain: 'month',
    periodId: '2026-08',
    headcount,
    signals: allSignals,
    themeSignals: allThemeSignals,
  });

  writeFileSync(resolve(OUT_DIR, 'organization.json'), JSON.stringify(organization, null, 2));
  writeFileSync(resolve(OUT_DIR, 'members.json'), JSON.stringify(members, null, 2));
  writeFileSync(resolve(OUT_DIR, 'weekly-rollups.json'), JSON.stringify(weeklyRollups, null, 2));
  writeFileSync(resolve(OUT_DIR, 'overall-rollup.json'), JSON.stringify(overallRollup, null, 2));

  console.log(`Seeded demo tenant "${ORG_ID}": ${headcount} employees, ${allSignals.length} assessment signals, ${allThemeSignals.length} TARA theme signals across ${WEEKS} weeks.`);
  console.log(`Written to ${OUT_DIR}`);
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

main();
