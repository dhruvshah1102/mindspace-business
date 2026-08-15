import type { Organization, Member, OrgRollup } from '@/domain/types';
import organization from '@/data/demo/organization.json';
import members from '@/data/demo/members.json';
import weeklyRollups from '@/data/demo/weekly-rollups.json';
import overallRollup from '@/data/demo/overall-rollup.json';

/**
 * Static demo tenant loaded directly into the bundle — no Firebase project
 * needed. This is what a trial conversation gets shown before a single real
 * employee has signed in (implementation.md §11, "sales-critical shortcut").
 * services/analytics-service.ts swaps this for live Firestore rollups once
 * a tenant is real.
 */
export function getDemoOrganization(): Organization {
  return organization as Organization;
}

export function getDemoMembers(): Member[] {
  return members as Member[];
}

export function getDemoWeeklyRollups(): OrgRollup[] {
  return weeklyRollups as OrgRollup[];
}

export function getDemoOverallRollup(): OrgRollup {
  return overallRollup as OrgRollup;
}
