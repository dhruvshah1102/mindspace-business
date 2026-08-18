import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface OrgEmployeeStats {
  totalSignups: number;
  totalAssessments: number;
  totalBookings: number;
  /** False until `supabase/schema-employee.sql` has been run — lets the HR
   * console show a clear "not set up yet" state instead of silently zeroing. */
  live: boolean;
}

const EMPTY: OrgEmployeeStats = { totalSignups: 0, totalAssessments: 0, totalBookings: 0, live: false };

/**
 * The only read HR's dashboard ever performs against employee data: three
 * counts, via the `org_employee_stats` RPC (security definer, returns no
 * rows). Falls back to a "not live yet" state rather than throwing, so the
 * Engagement page keeps rendering before the SQL migration has been run.
 */
export async function getOrgEmployeeStats(orgId: string): Promise<OrgEmployeeStats> {
  if (!isSupabaseConfigured || !supabase) return EMPTY;

  try {
    const { data, error } = await supabase.rpc('org_employee_stats', { p_org_id: orgId });
    if (error || !data) {
      console.warn('[mindspace] org_employee_stats unavailable:', error);
      return EMPTY;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return EMPTY;
    return {
      totalSignups: row.total_signups ?? 0,
      totalAssessments: row.total_assessments ?? 0,
      totalBookings: row.total_bookings ?? 0,
      live: true,
    };
  } catch (err) {
    console.warn('[mindspace] org_employee_stats failed:', err);
    return EMPTY;
  }
}
