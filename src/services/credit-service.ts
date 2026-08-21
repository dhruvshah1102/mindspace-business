import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface OrgCreditBalance {
  live: boolean;
  planName: string;
  totalCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
}

const EMPTY: OrgCreditBalance = { live: false, planName: '', totalCredits: 0, creditsUsed: 0, creditsRemaining: 0 };

/**
 * What HR's Overview page reads: the org's Tara credit plan and how much of
 * it remains. Tries the tenant's own org_id first, falling back to the demo
 * account — same "not set up yet" shape as org-stats-service, so the tile
 * degrades gracefully before schema-credits-workshops.sql has been run.
 */
export async function getOrgCreditBalance(orgId: string): Promise<OrgCreditBalance> {
  if (!isSupabaseConfigured || !supabase) return EMPTY;

  const orgIds = Array.from(new Set([orgId, 'demo-acme']));
  for (const id of orgIds) {
    try {
      const { data, error } = await supabase.rpc('org_credit_balance', { p_org_id: id });
      if (error || !data) continue;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) continue;
      return {
        live: true,
        planName: row.plan_name,
        totalCredits: row.total_credits ?? 0,
        creditsUsed: row.credits_used ?? 0,
        creditsRemaining: row.credits_remaining ?? 0,
      };
    } catch (err) {
      console.warn('[mindspace] org_credit_balance failed for id:', id, err);
    }
  }
  return EMPTY;
}

/** Thrown by startTaraSession when the org's credit pool is exhausted, so the
 * caller can show a specific "out of credits" message instead of a generic error. */
export class OutOfCreditsError extends Error {}

/**
 * Starts a Tara conversation: logs the session and atomically deducts one
 * credit from the org's pool via start_tara_session(). Fails open (returns
 * null, lets the call proceed) if the credit system isn't configured or the
 * RPC errors for an unrelated reason — a wellbeing support line shouldn't go
 * down because of a billing edge case.
 */
export async function startTaraSession(
  orgId: string,
): Promise<{ creditsRemaining: number; totalCredits: number } | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.rpc('start_tara_session', { p_org_id: orgId });
  if (error) {
    if (error.message?.includes('No Tara credits remaining')) {
      throw new OutOfCreditsError('Your organization has used all its Tara credits for this period.');
    }
    console.warn('[mindspace] start_tara_session failed:', error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row ? { creditsRemaining: row.credits_remaining, totalCredits: row.total_credits } : null;
}
