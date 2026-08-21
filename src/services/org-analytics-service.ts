import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ASSESSMENT_TYPES, type AssessmentType } from '@/domain/assessments';

export interface DomainBreakdown {
  /** Never withheld — a raw headcount, same as the org-wide total. */
  total: number;
  low: number;
  moderate: number;
  high: number;
  /** Fewer than k people took this assessment — the low/moderate/high split is withheld. */
  levelMasked: boolean;
}

export interface OrgAssessmentBreakdown {
  live: boolean;
  byDomain: Record<AssessmentType, DomainBreakdown>;
}

export type BookingFormat = 'group' | '1:1';

export interface FormatBreakdown {
  /** Never withheld — a raw headcount, same as the org-wide total. */
  total: number;
  requested: number;
  confirmed: number;
  cancelled: number;
  /** Fewer than k people booked this format — the status split is withheld. */
  statusMasked: boolean;
}

export interface OrgBookingBreakdown {
  live: boolean;
  byFormat: Record<BookingFormat, FormatBreakdown>;
}

export interface WeeklyPoint {
  label: string;
  signups: number;
  assessments: number;
  bookings: number;
}

export interface OrgWeeklyTrend {
  live: boolean;
  weeks: WeeklyPoint[];
}

function emptyDomainBreakdown(): DomainBreakdown {
  return { total: 0, low: 0, moderate: 0, high: 0, levelMasked: false };
}

function emptyAssessmentBreakdown(): OrgAssessmentBreakdown {
  const byDomain = Object.fromEntries(
    ASSESSMENT_TYPES.map((t) => [t, emptyDomainBreakdown()]),
  ) as Record<AssessmentType, DomainBreakdown>;
  return { live: false, byDomain };
}

function emptyFormatBreakdown(): FormatBreakdown {
  return { total: 0, requested: 0, confirmed: 0, cancelled: 0, statusMasked: false };
}

function emptyBookingBreakdown(): OrgBookingBreakdown {
  return { live: false, byFormat: { group: emptyFormatBreakdown(), '1:1': emptyFormatBreakdown() } };
}

/**
 * Assessment counts by domain and severity, via the `org_assessment_breakdown`
 * RPC (security definer, returns no rows). The per-domain total is always a
 * real count; a domain with fewer than k responses comes back with its
 * low/moderate/high split withheld instead. See
 * supabase/schema-employee-analytics.sql.
 */
export async function getOrgAssessmentBreakdown(orgId: string, k = 5): Promise<OrgAssessmentBreakdown> {
  if (!isSupabaseConfigured || !supabase) return emptyAssessmentBreakdown();

  const orgIds = Array.from(new Set([orgId, 'demo-acme']));
  const byDomain = Object.fromEntries(
    ASSESSMENT_TYPES.map((t) => [t, emptyDomainBreakdown()]),
  ) as Record<AssessmentType, DomainBreakdown>;
  let anyLive = false;

  for (const id of orgIds) {
    try {
      const { data, error } = await supabase.rpc('org_assessment_breakdown', { p_org_id: id, p_k: k });
      if (error || !data) continue;
      anyLive = true;

      for (const row of data as {
        domain: string;
        total: number;
        level: string | null;
        n: number | null;
        level_masked: boolean;
      }[]) {
        const domain = row.domain as AssessmentType;
        if (!(domain in byDomain)) continue;
        const bucket = byDomain[domain];
        bucket.total += row.total ?? 0;
        if (row.level_masked) {
          bucket.levelMasked = true;
          continue;
        }
        const n = row.n ?? 0;
        if (row.level === 'Low') bucket.low += n;
        else if (row.level === 'Moderate') bucket.moderate += n;
        else if (row.level === 'High') bucket.high += n;
      }
    } catch (err) {
      console.warn('[mindspace] org_assessment_breakdown failed for id:', id, err);
    }
  }

  return { live: anyLive, byDomain };
}

/**
 * Booking counts by session format and status, via the `org_booking_breakdown`
 * RPC. Same rule as the assessment breakdown: the per-format total is always
 * real, only the requested/confirmed/cancelled split is withheld below k.
 */
export async function getOrgBookingBreakdown(orgId: string, k = 5): Promise<OrgBookingBreakdown> {
  if (!isSupabaseConfigured || !supabase) return emptyBookingBreakdown();

  const orgIds = Array.from(new Set([orgId, 'demo-acme']));
  const byFormat: Record<BookingFormat, FormatBreakdown> = {
    group: emptyFormatBreakdown(),
    '1:1': emptyFormatBreakdown(),
  };
  let anyLive = false;

  for (const id of orgIds) {
    try {
      const { data, error } = await supabase.rpc('org_booking_breakdown', { p_org_id: id, p_k: k });
      if (error || !data) continue;
      anyLive = true;

      for (const row of data as {
        session_format: string;
        total: number;
        status: string | null;
        n: number | null;
        status_masked: boolean;
      }[]) {
        const format = row.session_format as BookingFormat;
        if (!(format in byFormat)) continue;
        const bucket = byFormat[format];
        bucket.total += row.total ?? 0;
        if (row.status_masked) {
          bucket.statusMasked = true;
          continue;
        }
        const n = row.n ?? 0;
        if (row.status === 'requested') bucket.requested += n;
        else if (row.status === 'confirmed') bucket.confirmed += n;
        else if (row.status === 'cancelled') bucket.cancelled += n;
      }
    } catch (err) {
      console.warn('[mindspace] org_booking_breakdown failed for id:', id, err);
    }
  }

  return { live: anyLive, byFormat };
}

/**
 * Org-wide weekly counts of sign-ups, assessments and bookings, via the
 * `org_weekly_trend` RPC. Unmasked — same privacy grain as the all-time flat
 * totals, just cut by week.
 */
export async function getOrgWeeklyTrend(orgId: string, weeks = 8): Promise<OrgWeeklyTrend> {
  if (!isSupabaseConfigured || !supabase) return { live: false, weeks: [] };

  const orgIds = Array.from(new Set([orgId, 'demo-acme']));
  const weekMap = new Map<string, { label: string; signups: number; assessments: number; bookings: number }>();
  let anyLive = false;

  for (const id of orgIds) {
    try {
      const { data, error } = await supabase.rpc('org_weekly_trend', { p_org_id: id, p_weeks: weeks });
      if (error || !data) continue;
      anyLive = true;

      for (const row of data as { week_start: string; signups: number; assessments: number; bookings: number }[]) {
        const label = new Date(row.week_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const cur = weekMap.get(row.week_start) ?? { label, signups: 0, assessments: 0, bookings: 0 };
        cur.signups += row.signups ?? 0;
        cur.assessments += row.assessments ?? 0;
        cur.bookings += row.bookings ?? 0;
        weekMap.set(row.week_start, cur);
      }
    } catch (err) {
      console.warn('[mindspace] org_weekly_trend failed for id:', id, err);
    }
  }

  const sortedPoints = Array.from(weekMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([, pt]) => pt);

  return { live: anyLive, weeks: sortedPoints };
}
