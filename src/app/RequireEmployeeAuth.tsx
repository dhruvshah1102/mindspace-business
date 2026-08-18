import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEmployeeAuth } from './EmployeeAuthContext';

/** Gate for everything under /app. Separate from `RequireHrAuth` on purpose —
 * employee sign-in and HR sign-in are different systems with different
 * identities, and neither guard should know the other exists. */
export function RequireEmployeeAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useEmployeeAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D9D2C5] border-t-[#4F6B57]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/app/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}
