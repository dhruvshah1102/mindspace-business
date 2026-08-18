import type { ComponentType } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { CalendarHeart, ClipboardList, MessageCircleHeart, User } from 'lucide-react';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { useTenant } from '@/app/TenantContext';
import { cn } from '@/lib/utils';

interface NavEntry {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV: NavEntry[] = [
  { to: '/app/tara', label: 'Tara', icon: MessageCircleHeart },
  { to: '/app/assessments', label: 'Assessments', icon: ClipboardList },
  { to: '/app/book', label: 'Book', icon: CalendarHeart },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export function EmployeeLayout() {
  const { organization } = useTenant();
  const { user } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#243327] selection:bg-[#E5ECE6] font-sans">
      {/* Slim top bar */}
      <header className="sticky top-0 z-30 border-b border-[#EAE4D9]/80 bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/app/tara" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4F6B57] text-xs font-bold text-white shadow-xs">
              {organization.branding.appName.slice(0, 1)}
            </div>
            <span className="font-serif text-base font-medium tracking-tight text-[#233226]">
              {organization.branding.appName}
            </span>
          </Link>

          <Link to="/app/profile" aria-label="Your profile">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F6B57] text-xs font-semibold text-white shadow-xs">
                {user?.name ? user.name.slice(0, 1) : 'Y'}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Page content — bottom padding clears the floating/fixed nav */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 pb-28 sm:pb-32">
        <Outlet />
      </main>

      {/* Bottom nav — full-width tab bar on mobile, floating pill dock on larger screens */}
      <nav
        aria-label="Employee navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#EAE4D9] bg-white px-1 pb-[env(safe-area-inset-bottom)] sm:inset-x-0 sm:bottom-5 sm:mx-auto sm:h-auto sm:w-fit sm:justify-center sm:gap-1 sm:rounded-full sm:border sm:border-[#EAE4D9] sm:bg-white/95 sm:px-2 sm:py-2 sm:pb-2 sm:shadow-[0_14px_32px_-12px_rgba(44,58,48,.28)] sm:backdrop-blur-md"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-medium transition-colors sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs',
                isActive
                  ? 'text-[#4F6B57] sm:bg-[#4F6B57] sm:text-white'
                  : 'text-[#78897B] hover:text-[#233226] sm:hover:bg-[#F3EFE8]',
              )
            }
          >
            <item.icon className="h-5 w-5 sm:h-4 sm:w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
