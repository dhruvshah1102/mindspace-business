import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_LOGIN_HINT } from '@/app/AuthContext';
import { useTenant } from '@/app/TenantContext';

export function LoginPage() {
  const { user, signIn, isDemoAuth } = useAuth();
  const { organization } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.');
    } finally {
      setBusy(false);
    }
  }

  function useDemoAccount() {
    setEmail(DEMO_LOGIN_HINT.email);
    setPassword(DEMO_LOGIN_HINT.password);
  }

  return (
    <div className="relative min-h-screen w-full bg-[#526B59] bg-gradient-to-br from-[#5C7563] via-[#526B59] to-[#455B4C] text-white flex flex-col justify-between p-6 sm:p-10 lg:px-16 lg:py-12 selection:bg-white/20 font-sans">
      {/* Top Header Logo */}
      <header className="w-full max-w-7xl mx-auto flex items-center">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white backdrop-blur-xs shadow-xs">
            {organization.branding.appName.slice(0, 1)}
          </div>
          <span className="font-serif text-2xl font-medium tracking-tight text-white">
            {organization.branding.appName}
          </span>
        </Link>
      </header>

      {/* Main Grid: Well-balanced Layout */}
      <main className="w-full max-w-7xl mx-auto my-auto grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center py-8 sm:py-12">
        {/* Left Column: Hero Narrative */}
        <div className="flex flex-col gap-6 lg:col-span-7 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
            FOR THE PEOPLE TEAM
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.65rem] font-normal leading-[1.12] tracking-tight text-white">
            You don't need another chart.
            <br />
            You need to know how your people actually feel.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-white/85 max-w-xl">
            Every month your team answers honestly, and anonymously. We read all of it and write you a plain-English report: what's weighing on people, why, and what to change about the way work happens here.
          </p>

          {/* Quote Callout with Left Border Accent */}
          <div className="border-l-2 border-white/40 pl-4 py-1 max-w-lg">
            <p className="font-serif italic text-sm sm:text-base text-white/95 leading-snug">
              “Operations is running late three nights a week and it's showing up as sleep loss.”
            </p>
            <p className="text-xs text-white/60 mt-1">
              — the kind of sentence this report gives you, instead of a score of 58.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4 shrink-0 text-white/80" />
            <span>Aggregate-only by default. You will never see who said what — that's the point.</span>
          </div>
        </div>

        {/* Right Column: Floating White Sign-in Card */}
        <div className="flex flex-col items-center lg:items-end lg:col-span-5">
          <div className="w-full max-w-[440px]">
            <div className="rounded-[32px] bg-white p-8 sm:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] text-slate-900">
              <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-slate-900">
                Sign in to your report
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                For {organization.name} HR and people leaders.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hr@mindspace.example"
                    className="w-full rounded-xl bg-[#EDF2FA] border border-transparent px-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#445b49] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl bg-[#EDF2FA] border border-transparent px-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#445b49] pr-10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-red-50 border border-red-200/80 p-3 text-xs text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 w-full rounded-xl bg-[#445B49] hover:bg-[#384C3C] text-white py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  <span>Sign in</span>
                </button>

                {isDemoAuth && (
                  <div className="mt-2 rounded-2xl bg-[#F4F6FC] border border-[#E6ECF8] p-4 text-xs text-slate-600 flex flex-col gap-1">
                    <p className="font-semibold text-slate-800 text-xs">Demo tenant</p>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Pre-filled with seeded demo data.
                    </p>
                    <button
                      type="button"
                      onClick={useDemoAccount}
                      className="text-xs text-left font-medium text-slate-700 hover:text-slate-900 mt-1 underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      Fill in demo credentials
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Link outside card */}
            <div className="mt-6 flex flex-col items-start px-2">
              <p className="text-xs text-white/70">Not from the people team?</p>
              <Link
                to="/check-in"
                className="mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white hover:underline transition-all"
              >
                <span>Take the anonymous check-in instead</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pt-6 text-xs text-white/50">
        <p>© 2026 MindSpace. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white/80 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white/80 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white/80 transition-colors">Security</a>
          <a href="#" className="hover:text-white/80 transition-colors">Help Center</a>
        </div>
      </footer>
    </div>
  );
}
