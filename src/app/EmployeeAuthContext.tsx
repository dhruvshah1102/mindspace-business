import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useTenant } from '@/app/TenantContext';

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface EmployeeAuthContextValue {
  user: EmployeeProfile | null;
  /** False until the stored session has been checked, so guards don't bounce
   * a signed-in employee to the login screen on refresh. */
  ready: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextValue | null>(null);

function toProfile(user: User): EmployeeProfile {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: (meta.full_name as string) || (meta.name as string) || user.email || 'Employee',
    email: user.email ?? '',
    avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || undefined,
  };
}

/** Employee accounts run entirely on Supabase Auth — a deliberately separate
 * system from `AuthContext` (HR login). Keeping them apart means an employee's
 * Google identity never shares a session, a token, or a code path with the
 * HR console; the two are only ever joined by aggregate counts, server-side. */
export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const { organization } = useTenant();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Upsert a profile row the first time we see this employee, so
  // `org_employee_stats()` has a signup to count. Own-row only, per RLS.
  useEffect(() => {
    if (!supabase || !session?.user) return;
    void supabase
      .from('profiles')
      .upsert(
        {
          id: session.user.id,
          org_id: organization.orgId,
          display_name: toProfile(session.user).name,
          avatar_url: toProfile(session.user).avatarUrl ?? null,
        },
        { onConflict: 'id' },
      )
      .then(({ error }) => {
        if (error) console.warn('[mindspace] profile upsert failed:', error);
      });
  }, [session?.user, organization.orgId]);

  const signInWithGoogle = useMemo(
    () => async () => {
      if (!supabase) throw new Error('Sign-in is not available right now.');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (error) throw error;
    },
    [],
  );

  const signOut = useMemo(
    () => async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
      setSession(null);
    },
    [],
  );

  const value = useMemo<EmployeeAuthContextValue>(
    () => ({
      user: session?.user ? toProfile(session.user) : null,
      ready,
      signInWithGoogle,
      signOut,
      isConfigured: isSupabaseConfigured,
    }),
    [session, ready, signInWithGoogle, signOut],
  );

  return <EmployeeAuthContext.Provider value={value}>{children}</EmployeeAuthContext.Provider>;
}

export function useEmployeeAuth(): EmployeeAuthContextValue {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  return ctx;
}
