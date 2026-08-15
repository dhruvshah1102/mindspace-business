import type { AnonymousCheckIn } from '@/domain/check-in';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db, isFirebaseConfigured } from '@/lib/firebase';

const KEY = 'mindspace.business.checkins.v1';

/**
 * Loads check-ins from localStorage synchronously (used for initial fast render / offline fallback).
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
 * Asynchronously loads live check-ins from Supabase (if configured).
 * Supabase is treated as the primary source of truth.
 */
export async function loadCheckInsAsync(orgId?: string): Promise<AnonymousCheckIn[]> {
  if (!isSupabaseConfigured || !supabase) {
    return loadCheckIns();
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
      return loadCheckIns();
    }

    const remoteCheckIns: AnonymousCheckIn[] = (data || []).map((row: any) => ({
      id: row.id,
      submittedAt: row.submitted_at,
      team: row.team,
      workPattern: row.work_pattern,
      tenureBand: row.tenure_band,
      domains: typeof row.domains === 'string' ? JSON.parse(row.domains) : row.domains ?? [],
      feelings: typeof row.feelings === 'string' ? JSON.parse(row.feelings) : row.feelings ?? [],
      note: row.note ?? '',
    }));

    // Keep localStorage strictly synced to remote database state
    try {
      localStorage.setItem(KEY, JSON.stringify(remoteCheckIns));
    } catch {}

    return remoteCheckIns;
  } catch (err) {
    console.warn('[mindspace] Supabase fetch failed:', err);
    return loadCheckIns();
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
        domains: JSON.stringify(checkIn.domains),
        feelings: JSON.stringify(checkIn.feelings),
        note: checkIn.note || '',
      });
      if (error) {
        console.warn('[mindspace] Supabase insert warning:', error);
      }
    } catch (err) {
      console.warn('[mindspace] Supabase insert failed:', err);
    }
  }

  // 2. Firebase write-only fallback (if configured)
  if (isFirebaseConfigured && db) {
    try {
      const { collection, doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(collection(db, 'tenants', orgId, 'responses'), checkIn.id), {
        ...checkIn,
        orgId,
      });
    } catch (err) {
      console.warn('[mindspace] Firebase insert failed:', err);
    }
  }
}
