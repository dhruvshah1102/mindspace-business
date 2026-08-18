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

  try {
    const { data, error } = await supabase.rpc('org_assessment_breakdown', { p_org_id: orgId, p_k: k });
    if (error || !data) {
      console.warn('[mindspace] org_assessment_breakdown unavailable:', error);
      return emptyAssessmentBreakdown();
    }

    const byDomain = Object.fromEntries(
      ASSESSMENT_TYPES.map((t) => [t, emptyDomainBreakdown()]),
    ) as Record<AssessmentType, DomainBreakdown>;

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
      bucket.total = row.total ?? 0;
      if (row.level_masked) {
        bucket.levelMasked = true;
        continue;
      }
      const n = row.n ?? 0;
      if (row.level === 'Low') bucket.low = n;
      else if (row.level === 'Moderate') bucket.moderate = n;
      else if (row.level === 'High') bucket.high = n;
    }

    return { live: true, byDomain };
  } catch (err) {
    console.warn('[mindspace] org_assessment_breakdown failed:', err);
    return emptyAssessmentBreakdown();
  }
}

/**
 * Booking counts by session format and status, via the `org_booking_breakdown`
 * RPC. Same rule as the assessment breakdown: the per-format total is always
 * real, only the requested/confirmed/cancelled split is withheld below k.
 */
export async function getOrgBookingBreakdown(orgId: string, k = 5): Promise<OrgBookingBreakdown> {
  if (!isSupabaseConfigured || !supabase) return emptyBookingBreakdown();

  try {
    const { data, error } = await supabase.rpc('org_booking_breakdown', { p_org_id: orgId, p_k: k });
    if (error || !data) {
      console.warn('[mindspace] org_booking_breakdown unavailable:', error);
      return emptyBookingBreakdown();
    }

    const byFormat: Record<BookingFormat, FormatBreakdown> = {
      group: emptyFormatBreakdown(),
      '1:1': emptyFormatBreakdown(),
    };

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
      bucket.total = row.total ?? 0;
      if (row.status_masked) {
        bucket.statusMasked = true;
        continue;
      }
      const n = row.n ?? 0;
      if (row.status === 'requested') bucket.requested = n;
      else if (row.status === 'confirmed') bucket.confirmed = n;
      else if (row.status === 'cancelled') bucket.cancelled = n;
    }

    return { live: true, byFormat };
  } catch (err) {
    console.warn('[mindspace] org_booking_breakdown failed:', err);
    return emptyBookingBreakdown();
  }
}

/**
 * Org-wide weekly counts of sign-ups, assessments and bookings, via the
 * `org_weekly_trend` RPC. Unmasked — same privacy grain as the all-time flat
 * totals, just cut by week.
 */
export async function getOrgWeeklyTrend(orgId: string, weeks = 8): Promise<OrgWeeklyTrend> {
  if (!isSupabaseConfigured || !supabase) return { live: false, weeks: [] };

  try {
    const { data, error } = await supabase.rpc('org_weekly_trend', { p_org_id: orgId, p_weeks: weeks });
    if (error || !data) {
      console.warn('[mindspace] org_weekly_trend unavailable:', error);
      return { live: false, weeks: [] };
    }

    const points = (data as { week_start: string; signups: number; assessments: number; bookings: number }[]).map(
      (row) => ({
        label: new Date(row.week_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        signups: row.signups ?? 0,
        assessments: row.assessments ?? 0,
        bookings: row.bookings ?? 0,
      }),
    );

    return { live: true, weeks: points };
  } catch (err) {
    console.warn('[mindspace] org_weekly_trend failed:', err);
    return { live: false, weeks: [] };
  }
}
