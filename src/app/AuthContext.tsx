import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

export interface HrUser {
  email: string;
  name: string;
  title: string;
}

interface AuthContextValue {
  user: HrUser | null;
  /** False until the stored session has been checked, so guards don't bounce
   * an authenticated user to the login screen on refresh. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isDemoAuth: boolean;
}

const SESSION_KEY = 'mindspace.business.hr-session.v1';

/** Demo tenant accounts, used only when no Firebase project is configured.
 * With Firebase wired up these are ignored entirely and the HR console
 * authenticates against Firebase Auth with an hr_admin custom claim. */
const DEMO_ACCOUNTS: (HrUser & { password: string })[] = [
  { email: 'hr@mindspace.example', password: 'wellbeing2026', name: 'Priya Raghavan', title: 'Head of People, MindSpace' },
  { email: 'people@mindspace.example', password: 'wellbeing2026', name: 'Daniel Okafor', title: 'People Operations Lead' },
];

export const DEMO_LOGIN_HINT = { email: 'hr@mindspace.example', password: 'wellbeing2026' };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HrUser | null>(null);
  const [ready, setReady] = useState(false);
  const isDemoAuth = !isFirebaseConfigured;

  useEffect(() => {
    if (isDemoAuth) {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) setUser(JSON.parse(raw) as HrUser);
      } catch {
        // Corrupt session — treat as signed out.
      }
      setReady(true);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      if (cancelled || !auth) return;
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setUser(
          fbUser
            ? { email: fbUser.email ?? '', name: fbUser.displayName ?? fbUser.email ?? 'HR', title: 'People team' }
            : null,
        );
        setReady(true);
      });
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isDemoAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();

      if (isDemoAuth) {
        const match = DEMO_ACCOUNTS.find((a) => a.email === normalized && a.password === password);
        if (!match) throw new Error('That email and password combination is not recognised.');
        const { password: _password, ...profile } = match;
        localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
        setUser(profile);
        return;
      }

      const { signInWithEmailAndPassword } = await import('firebase/auth');
      if (!auth) throw new Error('Authentication is not available.');
      await signInWithEmailAndPassword(auth, normalized, password);
    },
    [isDemoAuth],
  );

  const signOut = useCallback(async () => {
    if (isDemoAuth) {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      return;
    }
    const { signOut: fbSignOut } = await import('firebase/auth');
    if (auth) await fbSignOut(auth);
    setUser(null);
  }, [isDemoAuth]);

  const value = useMemo(
    () => ({ user, ready, signIn, signOut, isDemoAuth }),
    [user, ready, signIn, signOut, isDemoAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
