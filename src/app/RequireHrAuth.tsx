import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

/** Gate for everything under /admin. The employee check-in is deliberately
 * outside it — asking people to log in to answer anonymously would defeat the
 * anonymity they're being promised. */
export function RequireHrAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ds-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ds-soft border-t-ds-deep" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}
