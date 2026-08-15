import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  EyeOff,
  Sparkles,
  HeartHandshake,
  BarChart3,
  CheckCircle2,
  Lock,
  Building2,
  Clock,
  ChevronRight,
  Smile,
  Users2,
  Zap,
} from 'lucide-react';
import { useTenant } from '@/app/TenantContext';

export function LandingPage() {
  const { organization } = useTenant();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#243327] flex flex-col justify-between selection:bg-[#E5ECE6] relative overflow-x-hidden font-sans">
      {/* Soft Ambient Botanical Glows in Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-[500px] w-[500px] opacity-25 blur-3xl rounded-full"
        style={{ background: 'radial-gradient(circle, #8EA994 0%, #D4E0D6 50%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-[400px] h-[450px] w-[450px] opacity-20 blur-3xl rounded-full"
        style={{ background: 'radial-gradient(circle, #C2D4C5 0%, #E8EFE9 50%, transparent 70%)' }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#EAE4D9]/80 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#405445] text-xs font-bold text-white shadow-xs">
              M
            </div>
            <span className="font-serif text-xl font-medium tracking-tight text-[#233226]">
              {organization.branding.appName}
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#56685A]">
            <a href="#features" className="hover:text-[#233226] transition-colors">Platform Features</a>
            <a href="#therapy" className="hover:text-[#233226] transition-colors">1:1 Therapy</a>
            <a href="#pricing" className="hover:text-[#233226] transition-colors">Enterprise Pricing</a>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/check-in"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2C5] bg-white px-3.5 py-1.5 text-xs font-medium text-[#3E4F42] shadow-xs hover:bg-[#F3EFE8] transition-colors"
            >
              <EyeOff className="h-3 w-3 text-[#5A6D5E]" />
              <span>Employee Check-in</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#405445] hover:bg-[#334437] text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-105"
            >
              <Lock className="h-3 w-3" />
              <span>HR Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Original B2B Corporate Wellbeing Layout */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DCD5C8] bg-[#F3EEE5] px-3.5 py-1 text-xs text-[#526355] shadow-xs mb-5">
                <Sparkles className="h-3.5 w-3.5 text-[#405445]" />
                <span className="font-medium">Workplace Mental Wellbeing & Sentiment Platform</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] font-normal tracking-tight text-[#233226] leading-[1.14]">
                The wellbeing platform your employees will actually trust.
              </h1>

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-[#56685A] max-w-xl">
                Bridge anonymous employee check-ins with plain-English executive reports, 
                complimentary wellness rituals, and on-demand 1:1 confidential therapy at ₹500/session.
              </p>

              {/* Dual Action CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/check-in"
                  className="inline-flex items-center gap-2.5 rounded-full bg-[#405445] hover:bg-[#334437] text-white px-7 py-3.5 text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105"
                >
                  <span>Take Anonymous Check-in</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-[#D9D2C5] bg-white hover:bg-[#F3EFE8] px-6 py-3.5 text-xs sm:text-sm font-medium text-[#3E4F42] shadow-xs transition-colors"
                >
                  <Building2 className="h-4 w-4 text-[#5A6D5E]" />
                  <span>HR Analytics Dashboard</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-6 border-t border-[#E8E1D5] flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-[#657669]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#405445]" />
                  Zero PII Stored (k ≥ 5)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-[#405445]" />
                  Certified Psychologists
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#405445]" />
                  5-Minute Check-in
                </span>
              </div>
            </div>

            {/* Right Hero Visual: Live Product Preview Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-[#EAE4D9] flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F0EA] text-[#405445]">
                      <Smile className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-serif text-sm font-semibold text-[#233226]">Monthly Wellbeing Snapshot</span>
                  </div>
                  <span className="rounded-full bg-[#F3EEE5] px-2.5 py-0.5 text-[10px] font-semibold text-[#526355]">
                    Live Aggregate
                  </span>
                </div>

                <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-[#EAE4D9]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#78897B]">EXECUTIVE VERDICT</p>
                  <p className="font-serif text-base font-normal text-[#233226] mt-1 leading-snug">
                    “The majority are coping well, but operations carries strain from workload.”
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#FAF7F2] p-3 border border-[#EAE4D9]">
                    <p className="text-[10px] text-[#657669]">Participation</p>
                    <p className="text-lg font-bold text-[#233226]">99% answered</p>
                  </div>
                  <div className="rounded-xl bg-[#FAF7F2] p-3 border border-[#EAE4D9]">
                    <p className="text-[10px] text-[#657669]">1:1 Therapy</p>
                    <p className="text-lg font-bold text-[#9E6B38]">₹500 / session</p>
                  </div>
                </div>

                <Link
                  to="/check-in"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#405445] hover:bg-[#334437] text-white py-2.5 text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Experience Anonymous Check-In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Value Pillars */}
      <section id="features" className="py-16 border-t border-[#EAE4D9]/80 bg-white/70 backdrop-blur-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">CORE CAPABILITIES</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
              Three pillars for workplace wellbeing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[28px] bg-[#FAF7F2] p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E2EAF8] text-[#2C3E30] mb-5">
                  <EyeOff className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#233226]">Unlimited Check-Ins</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                  5-minute clinical assessments for stress, anxiety, and burnout with 16 workplace pressure chips. No individual responses are ever recorded.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#405445] mt-6 pt-4 border-t border-[#EAE4D9]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Zero PII stored
              </span>
            </div>

            <div className="rounded-[28px] bg-[#FAF7F2] p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EBE2] text-[#9E6B38] mb-5">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#233226]">1:1 Private Therapy</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                  Confidential video counseling with licensed psychologists. Pay-as-you-use at just ₹500 per session with 0 monthly retainer.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E6B38] mt-6 pt-4 border-t border-[#EAE4D9]">
                <Clock className="h-3.5 w-3.5" />
                ₹500 / 45-min session
              </span>
            </div>

            <div className="rounded-[28px] bg-[#FAF7F2] p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8EFF0] text-[#3D5C5F] mb-5">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#233226]">AI Executive Reports</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                  Words over raw numbers. Plain-English briefings written by occupational AI, complete with root causes and complimentary company rituals.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#405445] mt-6 pt-4 border-t border-[#EAE4D9]">
                <Sparkles className="h-3.5 w-3.5" />
                Executive-ready insights
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 1:1 Confidential Therapy Section */}
      <section id="therapy" className="py-16 bg-[#FAF7F2]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-8 sm:p-10 border border-[#EAE4D9] shadow-sm grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EEE5] px-3 py-1 text-xs font-semibold text-[#6E573B] self-start">
                <HeartHandshake className="h-3.5 w-3.5 text-[#9E6B38]" />
                CONFIDENTIAL THERAPY NETWORK
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] leading-tight">
                Direct access to licensed psychologists at ₹500/session
              </h2>

              <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
                When employees need support, they can book a private 1:1 session right from their check-in reflection. Your organization only pays when employees actually use the service.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-[#EAE4D9]">
                  <p className="font-serif text-xl font-bold text-[#233226]">₹500</p>
                  <p className="text-[11px] text-[#657669] mt-0.5">Pay-as-you-use per employee</p>
                </div>

                <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-[#EAE4D9]">
                  <p className="font-serif text-xl font-bold text-[#233226]">100% Privacy</p>
                  <p className="text-[11px] text-[#657669] mt-0.5">Zero session logs shared with HR</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-[24px] bg-gradient-to-br from-[#405445] to-[#2B3B2F] p-7 text-white flex flex-col justify-between min-h-[240px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">OCCUPATIONAL PSYCHOLOGY</p>
                <p className="font-serif text-xl font-normal mt-2 leading-snug">
                  “Support is not a dramatic crisis measure — it is a practical habit that protects performance.”
                </p>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
                <span>Certified Clinical Counselors</span>
                <span className="font-semibold text-white">45 min video</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section id="pricing" className="py-16 border-t border-[#EAE4D9]/80 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">SIMPLE PRICING</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1.5">
              Transparent enterprise pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Platform Plan Card */}
            <div className="rounded-[28px] bg-[#FAF7F2] p-7 sm:p-8 border-2 border-[#405445] shadow-md flex flex-col justify-between relative">
              <span className="absolute -top-3 left-6 rounded-full bg-[#405445] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                ANNUAL PLATFORM
              </span>

              <div>
                <h3 className="font-serif text-2xl font-normal text-[#233226]">White-Label Platform</h3>
                <p className="text-xs text-[#657669] mt-0.5">Enterprise dashboard for up to 500 active employees.</p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#233226]">₹1,20,000</span>
                  <span className="text-xs text-[#657669]">/ year</span>
                </div>
                <p className="text-[11px] text-[#78897B] mt-0.5">Just ₹20 / employee / month</p>

                <ul className="mt-5 flex flex-col gap-2.5 text-xs text-[#3E4F42] border-t border-[#EAE4D9] pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445] shrink-0" />
                    <span><strong>Unlimited Anonymous Check-Ins</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445]" />
                    <span><strong>AI Executive Sentiment Briefings</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445]" />
                    <span><strong>Complimentary Curated Wellness Rituals</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445]" />
                    <span>Dedicated HR Admin Console & shareable link</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EAE4D9]">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#405445] hover:bg-[#334437] text-white py-3 text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Sign In to HR Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 1:1 Therapy Card */}
            <div className="rounded-[28px] bg-[#FAF7F2] p-7 sm:p-8 border border-[#EAE4D9] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-2xl font-normal text-[#233226]">1:1 Private Therapy</h3>
                <p className="text-xs text-[#657669] mt-0.5">On-demand licensed clinical psychologist support.</p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#233226]">₹500</span>
                  <span className="text-xs text-[#657669]">/ session / employee</span>
                </div>
                <p className="text-[11px] text-[#78897B] mt-0.5">Pay-as-you-use (0 retainer commitment)</p>

                <ul className="mt-5 flex flex-col gap-2.5 text-xs text-[#3E4F42] border-t border-[#EAE4D9] pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445] shrink-0" />
                    <span>45-minute confidential video session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445]" />
                    <span>Pay only when employees book sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445]" />
                    <span>Complete employee confidentiality guaranteed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#405445]" />
                    <span>Bookable right from private check-in reflection</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EAE4D9]">
                <Link
                  to="/check-in"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D9D2C5] bg-white hover:bg-[#F3EFE8] text-[#3E4F42] py-3 text-xs font-semibold transition-colors"
                >
                  <span>Experience Employee Check-in</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#5A6D5E]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="w-full border-t border-[#EAE4D9]/80 bg-[#FAF7F2] py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 text-xs text-[#78897B]">
          <p>© 2026 MindSpace. Empathetic Intelligence.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#233226] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#233226] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#233226] transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
