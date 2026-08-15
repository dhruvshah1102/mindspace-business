import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Grid3x3, Search, GitBranch, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/app/TenantContext';
import { getStoredAdminTheme, setAdminTheme, type AdminTheme } from '@/lib/tenant-theme';

const NAV = [
  { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/heatmap', label: 'Cohort Heatmap', icon: Grid3x3 },
  { to: '/admin/explorer', label: 'Wellbeing Explorer', icon: Search },
  { to: '/admin/drivers', label: 'Driver Analysis', icon: GitBranch },
];

export function AdminLayout() {
  const { organization, isDemoMode } = useTenant();
  const [theme, setTheme] = useState<AdminTheme>('light');

  useEffect(() => {
    const stored = getStoredAdminTheme();
    setTheme(stored);
    setAdminTheme(stored);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setAdminTheme(next);
  }

  return (
    <div className="flex min-h-dvh w-full bg-ds-page text-ds-base">
      <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-card px-4 py-6">
        <div className="flex items-center gap-2 px-2">
          <div className="ds-icon-circle h-9 w-9 text-ds-deep font-semibold">
            {organization.branding.appName.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-semibold">{organization.branding.appName}</p>
            <p className="text-xs text-muted-foreground">Analytics console</p>
          </div>
        </div>

        {isDemoMode && (
          <div className="rounded-lg border border-dashed border-ds-mid/60 bg-ds-tint/60 px-3 py-2 text-xs text-ds-base">
            Demo mode — seeded synthetic tenant, no live employees.
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-ds-deep text-white' : 'text-ds-base hover:bg-ds-tint',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Dark surface</span>
          <button
            onClick={toggleTheme}
            className="ds-icon-circle h-8 w-8 text-ds-base hover:bg-ds-soft"
            aria-label="Toggle admin theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
