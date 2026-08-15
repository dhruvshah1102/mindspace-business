import { NavLink, Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  Grid3x3,
  Search,
  GitBranch,
  Link2,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTenant } from '@/app/TenantContext';
import { useAuth } from '@/app/AuthContext';
import { ReportProvider } from '@/admin/ReportContext';
import { getStoredAdminTheme, setAdminTheme, type AdminTheme } from '@/lib/tenant-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { to: '/admin/feelings', label: 'People' },
  { to: '/admin/pressures', label: 'Insights' },
  { to: '/admin/report', label: 'Reports' },
  { to: '/admin/actions', label: 'Action Items' },
];

const DETAIL_NAV = [
  { to: '/admin/data/heatmap', label: 'Cohort heatmap', icon: Grid3x3 },
  { to: '/admin/data/explorer', label: 'Wellbeing explorer', icon: Search },
  { to: '/admin/data/drivers', label: 'Driver analysis', icon: GitBranch },
];

export function AdminLayout() {
  return (
    <ReportProvider>
      <AdminLayoutContent />
    </ReportProvider>
  );
}

function AdminLayoutContent() {
  const { organization } = useTenant();
  const { user, signOut } = useAuth();
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

  async function copyCheckInLink() {
    const url = `${window.location.origin}/check-in`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Check-in link copied — share it with your team.');
    } catch {
      toast.message(url);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#243327] flex flex-col justify-between selection:bg-[#E5ECE6]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#EAE4D9]/80 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="font-serif text-xl font-medium tracking-tight text-[#233226] hover:opacity-90">
              {organization.branding.appName}
            </Link>

            {/* Center Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative px-3.5 py-2 text-xs font-medium transition-colors hover:text-slate-900',
                      isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute inset-x-3.5 -bottom-[19px] h-[2px] bg-slate-900" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Detailed Data Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    <span>Analytics</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-lg border-slate-200">
                  <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Deep analytics
                  </DropdownMenuLabel>
                  {DETAIL_NAV.map((item) => (
                    <DropdownMenuItem key={item.to} asChild className="rounded-lg text-xs cursor-pointer">
                      <Link to={item.to} className="flex items-center gap-2 px-2 py-1.5">
                        <item.icon className="h-3.5 w-3.5 text-slate-500" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => void copyCheckInLink()}
              title="Copy anonymous check-in link"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Link2 className="h-3 w-3 text-slate-500" />
              <span>Share Check-in</span>
            </button>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D5243] text-xs font-semibold text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-400">
                  {user?.name ? user.name.slice(0, 1) : 'P'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-200">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-slate-900">{user?.name ?? 'Priya Raghavan'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email ?? 'hr@mindspace.example'}</p>
                </div>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem onClick={() => void copyCheckInLink()} className="rounded-lg text-xs cursor-pointer">
                  <Link2 className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Check-in link</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem onClick={() => void signOut()} className="rounded-lg text-xs text-red-600 focus:text-red-700 cursor-pointer">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Submenu Tabs */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 px-2 py-2 overflow-x-auto bg-white">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-500'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet />
      </main>

      {/* Clean Footer matching design */}
      <footer className="w-full border-t border-[#EAE4D9]/80 bg-transparent py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-[#78897B]">
          <p>© 2026 MindSpace. Empathetic Intelligence</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#233226] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#233226] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#233226] transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
