import type { OrgRollup } from '@/domain/types';
import { getDemoOverallRollup, getDemoWeeklyRollups } from './demo-data';
import { isFirebaseConfigured } from '@/lib/firebase';

/**
 * Admin console screens read from here, never from raw Firestore collections
 * directly — org_signals/org_theme_signals aren't even client-readable
 * (implementation.md §5, security rules principle 2). In demo mode this
 * returns the seeded static rollups; wired to a real tenant it will read
 * `organizations/{orgId}/org_rollups/{grain}/{periodId}`.
 */
export function getOverallRollup(): OrgRollup {
  if (!isFirebaseConfigured) return getDemoOverallRollup();
  return getDemoOverallRollup();
}

export function getWeeklyRollups(): OrgRollup[] {
  if (!isFirebaseConfigured) return getDemoWeeklyRollups();
  return getDemoWeeklyRollups();
}
