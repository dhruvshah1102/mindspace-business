import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const WORKSHOP_TOPICS = [
  'Stress management',
  'Mindfulness & meditation',
  'Work-life balance',
  'Sleep & recovery',
  'Team building & connection',
  'Burnout recovery',
  'Financial wellness',
  'Parenting & caregiving',
  'Other',
] as const;

export type WorkshopTopic = (typeof WORKSHOP_TOPICS)[number];

/**
 * An employee's request for a workshop topic — owner-only in Supabase (see
 * schema-credits-workshops.sql). HR never reads this table directly, only
 * the aggregate counts from getOrgWorkshopRequestSummary below.
 */
export async function submitWorkshopRequest(
  userId: string,
  orgId: string,
  request: { topic: WorkshopTopic; details?: string },
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Workshop requests cannot be sent right now — please try again in a moment.');
  }

  const { error } = await supabase.from('workshop_requests').insert({
    user_id: userId,
    org_id: orgId,
    topic: request.topic,
    details: request.details ?? '',
  });

  if (error) throw error;
}

export interface WorkshopRequestSummary {
  live: boolean;
  byTopic: { topic: string; total: number }[];
}

/**
 * Org-wide counts of workshop requests by topic, via org_workshop_request_summary().
 * A topic with fewer than k requests is folded into "Other" in the database
 * itself, not just in this UI — the count never leaves masked.
 */
export async function getOrgWorkshopRequestSummary(orgId: string, k = 5): Promise<WorkshopRequestSummary> {
  if (!isSupabaseConfigured || !supabase) return { live: false, byTopic: [] };

  const orgIds = Array.from(new Set([orgId, 'demo-acme']));
  const totals = new Map<string, number>();
  let anyLive = false;

  for (const id of orgIds) {
    try {
      const { data, error } = await supabase.rpc('org_workshop_request_summary', { p_org_id: id, p_k: k });
      if (error || !data) continue;
      anyLive = true;
      for (const row of data as { topic: string; total: number }[]) {
        totals.set(row.topic, (totals.get(row.topic) ?? 0) + (row.total ?? 0));
      }
    } catch (err) {
      console.warn('[mindspace] org_workshop_request_summary failed for id:', id, err);
    }
  }

  const byTopic = Array.from(totals.entries())
    .map(([topic, total]) => ({ topic, total }))
    .sort((a, b) => b.total - a.total);

  return { live: anyLive, byTopic };
}
