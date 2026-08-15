import type { AnonymousCheckIn } from '@/domain/check-in';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db, isFirebaseConfigured } from '@/lib/firebase';

const KEY = 'mindspace.business.checkins.v1';

/**
 * Loads check-ins from localStorage synchronously (used for initial fast render / fallback).
 */
export function loadCheckIns(): AnonymousCheckIn[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnonymousCheckIn[]) : [];
  } catch {
    return [];
  }
}

/**
 * Asynchronously loads live check-ins from Supabase (if configured),
 * merging with any local check-ins stored on the client.
 */
export async function loadCheckInsAsync(orgId?: string): Promise<AnonymousCheckIn[]> {
  const local = loadCheckIns();

  if (!isSupabaseConfigured || !supabase) {
    return local;
  }

  try {
    let query = supabase
      .from('anonymous_checkins')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[mindspace] Supabase load error, using local fallback:', error);
      return local;
    }

    if (!data || data.length === 0) {
      return local;
    }

    const remoteCheckIns: AnonymousCheckIn[] = data.map((row: any) => ({
      id: row.id,
      submittedAt: row.submitted_at,
      team: row.team,
      workPattern: row.work_pattern,
      tenureBand: row.tenure_band,
      domains: typeof row.domains === 'string' ? JSON.parse(row.domains) : row.domains ?? [],
      feelings: typeof row.feelings === 'string' ? JSON.parse(row.feelings) : row.feelings ?? [],
      note: row.note ?? '',
    }));

    // Merge remote and local by id
    const map = new Map<string, AnonymousCheckIn>();
    for (const item of local) map.set(item.id, item);
    for (const item of remoteCheckIns) map.set(item.id, item);

    const merged = Array.from(map.values());
    // Keep localStorage in sync
    try {
      localStorage.setItem(KEY, JSON.stringify(merged));
    } catch {}

    return merged;
  } catch (err) {
    console.warn('[mindspace] Supabase fetch failed:', err);
    return local;
  }
}

/**
 * Saves a new anonymous check-in to Supabase and localStorage.
 */
export async function saveCheckIn(checkIn: AnonymousCheckIn, orgId: string): Promise<void> {
  const existing = loadCheckIns();
  const next = [...existing.filter((c) => c.id !== checkIn.id), checkIn];

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}

  // 1. Supabase persistence
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('anonymous_checkins').insert({
        id: checkIn.id,
        org_id: orgId,
        submitted_at: checkIn.submittedAt,
        team: checkIn.team,
        work_pattern: checkIn.workPattern,
        tenure_band: checkIn.tenureBand,
        domains: checkIn.domains,
        feelings: checkIn.feelings,
        note: checkIn.note,
      });
      if (error) {
        console.warn('[mindspace] Failed to insert into Supabase:', error);
      }
    } catch (err) {
      console.warn('[mindspace] Supabase insert threw:', err);
    }
  }

  // 2. Firebase persistence (if configured)
  if (isFirebaseConfigured && db) {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'organizations', orgId, 'anonymous_checkins'), checkIn);
    } catch {}
  }
}

export function clearCheckIns(): void {
  localStorage.removeItem(KEY);
}
