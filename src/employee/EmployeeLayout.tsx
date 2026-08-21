import type { ComponentType } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  CalendarHeart,
  ClipboardList,
  LayoutGrid,
  MessageCircleHeart,
  User,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { useTenant } from '@/app/TenantContext';
import { AccentureLogo } from '@/components/AccentureLogo';
import { cn } from '@/lib/utils';

interface NavEntry {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV: NavEntry[] = [
  { to: '/app/home', label: 'Hub', icon: LayoutGrid },
  { to: '/app/tara', label: 'Tara', icon: MessageCircleHeart },
  { to: '/app/self-help', label: 'Self-Help', icon: HeartHandshake },
  { to: '/app/assessments', label: 'Assessments', icon: ClipboardList },
  { to: '/app/book', label: 'Book', icon: CalendarHeart },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export function EmployeeLayout() {
  const { organization } = useTenant();
  const { user } = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#243327] selection:bg-[#E5ECE6] font-sans">
      {/* Slim top bar with Accenture co-branding */}
      <header className="sticky top-0 z-30 border-b border-[#EAE4D9]/80 bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/app/home" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
            {/* MindSpace brand symbol */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#405445] text-xs font-bold text-white shadow-xs">
                M
              </div>
              <span className="hidden sm:inline font-serif text-lg font-medium tracking-tight text-[#233226]">
                MindSpace
              </span>
            </div>

            <span className="text-[#9AA79C] font-light text-sm">×</span>

            {/* Accenture Logo badge */}
            <AccentureLogo
              variant="badge"
              badgeClassName="bg-black px-2.5 py-1 text-xs rounded-md shadow-xs border border-neutral-800"
            />
          </Link>

          {/* Right side profile / badge */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#E8F0EA] px-3 py-1 text-[11px] font-semibold text-[#4F6B57]">
              <Sparkles className="h-3 w-3" />
              Accenture Wellbeing
            </span>

            <Link to="/app/profile" aria-label="Your profile" className="flex items-center gap-2">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-[#D9D2C5]" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#405445] text-xs font-semibold text-white shadow-xs">
                  {user?.name ? user.name.slice(0, 1) : 'A'}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Page content — bottom padding clears the floating/fixed nav */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 pb-28 sm:pb-32">
        <Outlet />
      </main>

      {/* Bottom nav — full-width tab bar on mobile, floating pill dock on larger screens */}
      <nav
        aria-label="Employee navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#EAE4D9] bg-white px-1 pb-[env(safe-area-inset-bottom)] sm:inset-x-0 sm:bottom-5 sm:mx-auto sm:h-auto sm:w-fit sm:justify-center sm:gap-1 sm:rounded-full sm:border sm:border-[#EAE4D9] sm:bg-white/95 sm:px-2.5 sm:py-2 sm:pb-2 sm:shadow-[0_14px_32px_-12px_rgba(44,58,48,.28)] sm:backdrop-blur-md"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-medium transition-colors sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-xs',
                isActive
                  ? 'text-[#4F6B57] sm:bg-[#405445] sm:text-white'
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

export default EmployeeLayout;
