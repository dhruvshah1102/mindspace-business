import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircleHeart,
  ClipboardList,
  CalendarHeart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Smile,
  Meh,
  Frown,
  Flame,
  SunMedium,
  Heart,
  Wind,
  PhoneCall,
  CheckCircle2,
  Lock,
  HeartHandshake,
  Palette,
} from 'lucide-react';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { useTenant } from '@/app/TenantContext';
import { AccentureLogo } from '@/components/AccentureLogo';
import { cn } from '@/lib/utils';
import { listMyAssessments, type EmployeeAssessmentRecord } from '@/services/employee-assessment-service';
import { ASSESSMENT_TYPES } from '@/domain/assessments';
import { WorkshopRequestCard } from '@/employee/WorkshopRequestCard';

const MOODS = [
  { id: 'energized', label: 'Energized', icon: Flame, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'calm', label: 'Calm', icon: SunMedium, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'okay', label: 'Just Okay', icon: Smile, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { id: 'stressed', label: 'Stressed', icon: Meh, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: Frown, color: 'text-rose-500 bg-rose-50 border-rose-200' },
];

export function EmployeeDashboardPage() {
  const { user } = useEmployeeAuth();
  const { organization } = useTenant();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [completedAssessments, setCompletedAssessments] = useState<number>(0);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    if (!user) return;
    listMyAssessments(user.id).then((records) => {
      const uniqueTypes = new Set(records.map((r) => r.domain));
      setCompletedAssessments(uniqueTypes.size);
    });
  }, [user]);

  // Simple breathing timer effect
  useEffect(() => {
    if (!breathingActive) return;
    const interval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [breathingActive]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="flex flex-col gap-8 pb-12 font-sans">
      {/* Top Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1E2922] via-[#2A3B30] to-[#1A261D] p-6 sm:p-10 text-white shadow-[0_20px_50px_-20px_rgba(20,35,25,0.45)] border border-[#3D5243]/50">
        {/* Ambient subtle glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A100FF 0%, #4F6B57 60%, transparent 80%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <AccentureLogo variant="badge" badgeClassName="bg-black/80 px-2.5 py-1 text-xs border-neutral-700" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                Accenture Employee Wellbeing Hub
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white mt-1">
              Welcome back, <span className="italic text-[#C5DBC8]">{firstName}</span>.
            </h1>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
              Your confidential sanctuary for mental health and calm. Speak with Tara, track your wellbeing, or connect with a dedicated therapist.
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4 text-[#A9CBAE] shrink-0" />
              <span>100% Confidential · Covered under Accenture Global Wellbeing Program</span>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex flex-row lg:flex-col gap-3 shrink-0">
            <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10 flex flex-col justify-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">Check-ins</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {completedAssessments} <span className="text-xs font-normal text-white/60">/ {ASSESSMENT_TYPES.length} done</span>
              </p>
            </div>
            <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10 flex flex-col justify-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">1:1 Therapy</p>
              <p className="text-sm font-semibold text-[#A9CBAE] mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-[#A9CBAE]" /> Sponsored
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mood Pulse Check-in */}
      <section className="rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#233226]">How are you feeling right now?</h2>
            <p className="text-xs text-[#78897B] mt-0.5">Take a micro-moment to check in with yourself.</p>
          </div>
          <span className="text-xs font-medium text-[#4F6B57] bg-[#E8F0EA] px-3 py-1 rounded-full">Private</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(isSelected ? null : mood.id)}
                className={cn(
                  'flex flex-col items-center gap-2.5 rounded-2xl p-4 border transition-all cursor-pointer text-center',
                  isSelected
                    ? `${mood.color} ring-2 ring-[#4F6B57] shadow-sm scale-102`
                    : 'border-[#EAE4D9] bg-[#FAF7F2]/50 hover:bg-[#F3EFE8] text-[#233226]'
                )}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', isSelected ? 'bg-white/80' : 'bg-white')}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold">{mood.label}</span>
              </button>
            );
          })}
        </div>

        {selectedMood && (
          <div className="mt-2 rounded-2xl bg-[#F4F8F5] border border-[#D5E5D8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <p className="text-xs sm:text-sm text-[#233226]">
              Thank you for acknowledging your feeling. Would you like to chat with <strong>Tara</strong> or try <strong>Self-Help & Zen Doodling</strong>?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/app/self-help"
                className="inline-flex items-center gap-1 rounded-xl bg-[#4F6B57] hover:bg-[#3E5545] text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Self-Help & Doodling</span>
              </Link>
              <Link
                to="/app/tara"
                className="inline-flex items-center gap-1 rounded-xl bg-white hover:bg-[#F3EFE8] text-[#243327] border border-[#D9D2C5] px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <span>Talk to Tara</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Main Core Features Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Feature 1: Self-Help & Zen Doodling Sanctuary */}
        <div className="group relative rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-[#4F6B57]/40">
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8E7DBE] to-[#59446B] text-white shadow-xs">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-normal text-[#233226]">Self-Help Sanctuary</h3>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">ZEN DOODLE</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                Instant crisis relief, 5-4-3-2-1 grounding, paced breathing, and an interactive Zen Doodling pad to release tension.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EAE4D9]">
            <Link
              to="/app/self-help"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE8] text-[#233226] border border-[#D9D2C5] py-3 text-xs font-semibold shadow-xs transition-all group-hover:scale-[1.01]"
            >
              <span>Explore Self-Help Tools</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature 2: Tara Voice Companion */}
        <div className="group relative rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-[#4F6B57]/40">
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F6B57] to-[#344B3B] text-white shadow-xs">
              <MessageCircleHeart className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-normal text-[#233226]">Tara Voice AI</h3>
                <span className="rounded-full bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-bold text-[#4F6B57]">24/7 LIVE</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                A judgment-free voice space. Vent, unpack your day, or work through stress in real-time.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EAE4D9]">
            <Link
              to="/app/tara"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F6B57] hover:bg-[#3E5545] text-white py-3 text-xs font-semibold shadow-xs transition-all group-hover:scale-[1.01]"
            >
              <span>Talk to Tara now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature 3: Clinical Self-Assessments */}
        <div className="group relative rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-[#4F6B57]/40">
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5E7A67] to-[#435C4B] text-white shadow-xs">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-normal text-[#233226]">Private Check-ins</h3>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">CLINICAL</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                6 evidence-based assessments (GAD-7, PHQ-9, Burnout, Sleep) to understand your mental state.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EAE4D9]">
            <Link
              to="/app/assessments"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE8] text-[#233226] border border-[#D9D2C5] py-3 text-xs font-semibold shadow-xs transition-all group-hover:scale-[1.01]"
            >
              <span>View assessments ({completedAssessments}/{ASSESSMENT_TYPES.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature 3: 1:1 Confidential Therapy */}
        <div className="group relative rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-[#4F6B57]/40">
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#735A88] to-[#543E69] text-white shadow-xs">
              <CalendarHeart className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-normal text-[#233226]">1:1 Licensed Therapy</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">100% COVERED</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                Connect with professional psychologists and certified coaches, fully sponsored by Accenture.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EAE4D9]">
            <Link
              to="/app/book"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE8] text-[#233226] border border-[#D9D2C5] py-3 text-xs font-semibold shadow-xs transition-all group-hover:scale-[1.01]"
            >
              <span>Book a session</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Workshop Request */}
      <WorkshopRequestCard />

      {/* Interactive Micro-Calm Breathing Widget & Accenture Helpline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Breathing Exercise Card */}
        <div className="lg:col-span-7 rounded-[28px] bg-gradient-to-br from-[#FAF7F2] to-[#F1ECE3] p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B57] text-white">
                <Wind className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-normal text-[#233226]">Box Breathing Moment</h3>
                <p className="text-xs text-[#78897B]">4-4-4 technique for instant nervous system reset</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBreathingActive((b) => !b)}
              className="rounded-full bg-[#4F6B57] hover:bg-[#3E5545] text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {breathingActive ? 'Stop' : 'Start'}
            </button>
          </div>

          {breathingActive ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#4F6B57]/15 animate-pulse">
                <span className="font-serif text-lg font-medium text-[#233226]">{breathPhase}</span>
              </div>
              <p className="text-xs text-[#78897B]">Breathe steadily with the rhythm</p>
            </div>
          ) : (
            <p className="text-xs text-[#56685A] leading-relaxed">
              Take 60 seconds before your next meeting or after intense client deliverables to lower cortisol levels and regain mental clarity.
            </p>
          )}
        </div>

        {/* Accenture Support & Privacy Assurance */}
        <div className="lg:col-span-5 rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#78897B]">
              <Lock className="h-3.5 w-3.5 text-[#4F6B57]" />
              Accenture Privacy Guarantee
            </div>
            <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
              Accenture receives only anonymized, aggregated demographic data (minimum 5-person k-anonymity). Your personal responses, notes, and sessions remain completely private.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#EAE4D9] text-xs">
            <span className="text-[#78897B]">Need urgent support?</span>
            <a
              href="mailto:wellbeing@accenture.com"
              className="font-medium text-[#4F6B57] hover:underline flex items-center gap-1"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Accenture EAP Desk</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboardPage;
