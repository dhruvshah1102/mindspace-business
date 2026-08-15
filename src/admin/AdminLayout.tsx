import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Compass,
  FileText,
  HeartHandshake,
  Layers,
  LayoutDashboard,
  Link2,
  LogOut,
  Sparkles,
  TrendingUp,
  User,
  Users2,
  Smile,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/AuthContext';
import { useTenant } from '@/app/TenantContext';
import { ReportProvider } from '@/admin/ReportContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { to: '/admin/report', label: 'Report' },
  { to: '/admin/feelings', label: 'Feelings' },
  { to: '/admin/pressures', label: 'Pressures' },
  { to: '/admin/actions', label: 'Actions' },
];

const DETAIL_NAV = [
  { to: '/admin/data/heatmap', label: 'Cohort Heatmap', icon: Layers },
  { to: '/admin/data/explorer', label: 'Item Explorer', icon: Compass },
  { to: '/admin/data/drivers', label: 'Driver Analysis', icon: TrendingUp },
];

type AdminTheme = 'light' | 'dark';

function getStoredAdminTheme(): AdminTheme {
  try {
    const v = localStorage.getItem('mindspace_admin_theme');
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return 'light';
}

function setAdminTheme(theme: AdminTheme) {
  try {
    localStorage.setItem('mindspace_admin_theme', theme);
  } catch {
    /* ignore */
  }
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('admin-dark');
  } else {
    root.classList.remove('admin-dark');
  }
}

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
  const location = useLocation();
  const [theme, setTheme] = useState<AdminTheme>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredAdminTheme();
    setTheme(stored);
    setAdminTheme(stored);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    <div className="min-h-screen bg-[#FAF7F2] text-[#243327] flex flex-col justify-between selection:bg-[#E5ECE6] font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#EAE4D9]/80 bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="font-serif text-xl font-medium tracking-tight text-[#233226] hover:opacity-90">
              {organization.branding.appName}
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative px-3.5 py-2 text-xs font-medium transition-colors hover:text-[#233226]',
                      isActive ? 'text-[#233226] font-semibold' : 'text-[#56685A]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute inset-x-3.5 -bottom-[19px] h-[2px] bg-[#405445]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Detailed Data Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#56685A] hover:text-[#233226] transition-colors cursor-pointer">
                    <span>Analytics</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 rounded-2xl p-2 shadow-lg border-[#EAE4D9] bg-white">
                  <DropdownMenuLabel className="text-[10px] font-semibold text-[#78897B] uppercase tracking-wider px-2 py-1">
                    Deep analytics
                  </DropdownMenuLabel>
                  {DETAIL_NAV.map((item) => (
                    <DropdownMenuItem key={item.to} asChild className="rounded-xl text-xs cursor-pointer hover:bg-[#FAF7F2]">
                      <Link to={item.to} className="flex items-center gap-2 px-2 py-1.5 text-[#233226]">
                        <item.icon className="h-3.5 w-3.5 text-[#5A6D5E]" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => void copyCheckInLink()}
              title="Copy anonymous check-in link"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#D9D2C5] bg-white px-3 py-1.5 text-xs font-medium text-[#3E4F42] hover:bg-[#F3EFE8] transition-colors cursor-pointer shadow-xs"
            >
              <Link2 className="h-3 w-3 text-[#5A6D5E]" />
              <span>Share Link</span>
            </button>


            {/* Profile Dropdown (Desktop) */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#405445] text-xs font-semibold text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7D9A83] cursor-pointer">
                    {user?.name ? user.name.slice(0, 1) : 'P'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-[#EAE4D9] bg-white">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-[#233226]">{user?.name ?? 'Priya Raghavan'}</p>
                    <p className="text-[11px] text-[#78897B] truncate">{user?.email ?? 'hr@mindspace.example'}</p>
                  </div>
                  <DropdownMenuSeparator className="my-1 bg-[#EAE4D9]/80" />
                  <DropdownMenuItem onClick={() => void copyCheckInLink()} className="rounded-xl text-xs cursor-pointer hover:bg-[#FAF7F2]">
                    <Link2 className="mr-2 h-3.5 w-3.5 text-[#5A6D5E]" />
                    <span>Copy check-in link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl text-xs cursor-pointer hover:bg-[#FAF7F2]">
                    <Link to="/check-in">
                      <Sparkles className="mr-2 h-3.5 w-3.5 text-[#5A6D5E]" />
                      <span>Take check-in</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-[#EAE4D9]/80" />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="rounded-xl text-xs text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#D9D2C5] text-[#233226] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Clean Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#EAE4D9] bg-white px-4 py-4 shadow-lg animate-in slide-in-from-top duration-200">
            {/* Primary Navigation */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#78897B] px-3 py-1">
                EXECUTIVE REPORTS
              </p>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors',
                      isActive ? 'bg-[#405445] text-white font-semibold' : 'text-[#233226] hover:bg-[#FAF7F2]'
                    )
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Deep Analytics Sub-Section */}
            <div className="mt-3 pt-3 border-t border-[#EAE4D9]/80 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#78897B] px-3 py-1">
                ANALYTICS DRILLDOWN
              </p>
              {DETAIL_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
                      isActive ? 'bg-[#405445] text-white font-semibold' : 'text-[#233226] hover:bg-[#FAF7F2]'
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5 text-[#5A6D5E]" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Mobile Actions Footer */}
            <div className="mt-4 pt-3 border-t border-[#EAE4D9]/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  void copyCheckInLink();
                  setMobileMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAF7F2] border border-[#D9D2C5] py-2.5 text-xs font-medium text-[#233226] hover:bg-[#F3EFE8]"
              >
                <Link2 className="h-3.5 w-3.5 text-[#5A6D5E]" />
                <span>Share Check-in Link</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Admin View Container */}
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Outlet />
      </main>

      {/* Clean Footer */}
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
