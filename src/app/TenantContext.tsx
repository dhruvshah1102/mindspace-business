import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Organization } from '@/domain/types';
import { getDemoOrganization } from '@/services/demo-data';
import { isFirebaseConfigured } from '@/lib/firebase';
import { applyTenantBranding } from '@/lib/tenant-theme';

interface TenantContextValue {
  organization: Organization;
  isDemoMode: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Resolves the active tenant. No Firebase project configured (VITE_FIREBASE_*
 * unset) → falls back to the seeded demo tenant so the console is viewable
 * with zero setup. Once a real project is wired up, this reads
 * `organizations/{orgId}` by subdomain/custom-domain/authenticated orgId
 * (implementation.md §4).
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const isDemoMode = !isFirebaseConfigured;

  const organization = useMemo<Organization>(() => {
    if (isDemoMode) return getDemoOrganization();
    // TODO(P0 follow-up): resolve real tenant from Firestore by subdomain/custom domain.
    return getDemoOrganization();
  }, [isDemoMode]);

  useEffect(() => {
    applyTenantBranding(organization.branding);
  }, [organization]);

  const value = useMemo(() => ({ organization, isDemoMode }), [organization, isDemoMode]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider');
  return ctx;
}
