import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  EyeOff,
  Heart,
  Loader2,
  Compass,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTenant } from '@/app/TenantContext';
import {
  ASSESSMENT_METADATA,
  calculateAssessmentResult,
  type AssessmentType,
} from '@/domain/assessments';
import {
  CHECK_IN_DOMAINS,
  FEELING_CHIPS,
  NOT_SAID,
  TEAM_OPTIONS,
  TENURE_OPTIONS,
  WORK_PATTERN_OPTIONS,
  newCheckInId,
  type AnonymousCheckIn,
  type CheckInDomainResult,
} from '@/domain/check-in';
import type { Theme } from '@/domain/themes';
import { saveCheckIn } from '@/services/response-store';

/** Plain-English framing for each clinical domain */
const DOMAIN_FRAMING: Record<AssessmentType, { title: string; blurb: string }> = {
  stress: { title: 'Pressure and your body', blurb: 'How the last two weeks have felt physically.' },
  anxiety: { title: 'Worry and restlessness', blurb: 'How settled your mind has been lately.' },
  depression: { title: 'Mood and energy', blurb: 'How much you have had in the tank.' },
  ptsd: { title: 'Difficult memories', blurb: 'How the past has been sitting with you.' },
  relationship: { title: 'Closeness with others', blurb: 'How connection has felt recently.' },
  ocd: { title: 'Intrusive thoughts and routines', blurb: 'Patterns that have been hard to let go of.' },
};

type Step = 'welcome' | 'context' | 'questions' | 'feelings' | 'note' | 'done';

export function CheckInPage() {
  const { organization } = useTenant();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('welcome');
  const [domainIndex, setDomainIndex] = useState(0);
  const [team, setTeam] = useState(NOT_SAID);
  const [workPattern, setWorkPattern] = useState(NOT_SAID);
  const [tenure, setTenure] = useState(NOT_SAID);
  const [answers, setAnswers] = useState<Record<AssessmentType, Record<number, string>>>(
    () => ({}) as Record<AssessmentType, Record<number, string>>,
  );
  const [feelings, setFeelings] = useState<Theme[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const domain = CHECK_IN_DOMAINS[domainIndex];
  const questions = ASSESSMENT_METADATA[domain]?.questions ?? [];
  const domainAnswers = answers[domain] ?? {};
  const answeredInDomain = questions.filter((q) => domainAnswers[q.id]).length;
  const domainComplete = answeredInDomain === questions.length;

  const totalQuestions = CHECK_IN_DOMAINS.reduce((n, d) => n + ASSESSMENT_METADATA[d].questions.length, 0);
  const totalAnswered = CHECK_IN_DOMAINS.reduce((n, d) => n + Object.keys(answers[d] ?? {}).length, 0);

  const progress = useMemo(() => {
    if (step === 'welcome') return 0;
    if (step === 'context') return 10;
    if (step === 'questions') return 15 + (totalAnswered / totalQuestions) * 65;
    if (step === 'feelings') return 85;
    if (step === 'note') return 95;
    return 100;
  }, [step, totalAnswered, totalQuestions]);

  const results = useMemo<CheckInDomainResult[]>(
    () =>
      CHECK_IN_DOMAINS.filter((d) => Object.keys(answers[d] ?? {}).length > 0).map((d) => {
        const result = calculateAssessmentResult(answers[d] ?? {}, d);
        const meta = ASSESSMENT_METADATA[d];
        return {
          domain: d,
          score: result.score,
          maxScore: result.maxScore,
          level: result.level,
          items: meta.questions
            .filter((q) => (answers[d] ?? {})[q.id])
            .map((q) => ({
              qid: q.id,
              score: q.options.find((o) => o.value === (answers[d] ?? {})[q.id])?.score ?? 0,
            })),
        };
      }),
    [answers],
  );

  function setAnswer(d: AssessmentType, qid: number, value: string) {
    setAnswers((prev) => ({ ...prev, [d]: { ...(prev[d] ?? {}), [qid]: value } }));
  }

  function toggleFeeling(theme: Theme) {
    setFeelings((prev) => (prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    const checkIn: AnonymousCheckIn = {
      id: newCheckInId(),
      submittedAt: new Date().toISOString(),
      team,
      workPattern,
      tenureBand: tenure,
      domains: results,
      feelings,
      note: note.trim(),
    };
    try {
      await saveCheckIn(checkIn, organization.orgId);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'We could not send your check-in. Please try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#243327] flex flex-col justify-between selection:bg-[#E5ECE6] relative overflow-x-hidden font-sans">
      {/* Background Ambient Glows */}
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

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#EAE4D9]/80 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#405445] text-xs font-bold text-white shadow-xs">
              {organization.branding.appName.slice(0, 1)}
            </div>
            <span className="font-serif text-lg font-medium tracking-tight text-[#233226]">
              {organization.branding.appName}
            </span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCD5C8] bg-[#F3EEE5] px-3.5 py-1 text-xs font-normal text-[#526355]">
            <EyeOff className="h-3.5 w-3.5 text-[#5A6D5E]" />
            <span>Anonymous</span>
          </span>
        </div>

        {/* Progress Bar */}
        {step !== 'welcome' && (
          <div className="h-1 w-full bg-[#EAE4D9]/60">
            <div
              className="h-full bg-[#405445] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12 z-10">
        {/* Step 0: Welcome / Landing */}
        {step === 'welcome' && (
          <Welcome
            orgName={organization.name}
            onStart={() => {
              setStep('context');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogin={() => navigate('/login')}
          />
        )}

        {/* Step 1: Context Questions */}
        {step === 'context' && (
          <section className="flex flex-col gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
                FIRST, SOME CONTEXT
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
                Three optional questions about your work
              </h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                This is the only thing we ask about you, and it stays deliberately vague. It lets us say “the night shift is struggling” without ever being able to say who. Skip any of it.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <ChoiceCard label="Which team are you closest to?" options={TEAM_OPTIONS} value={team} onChange={setTeam} />
              <ChoiceCard label="How do you usually work?" options={WORK_PATTERN_OPTIONS} value={workPattern} onChange={setWorkPattern} />
              <ChoiceCard label="How long have you been here?" options={TENURE_OPTIONS} value={tenure} onChange={setTenure} />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-[#EAE4D9] pt-6 mt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('welcome');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#56685A] hover:text-[#233226] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('questions');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#405445] hover:bg-[#334437] text-white px-7 py-3 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                <span>Start the check-in</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Assessment Questions */}
        {step === 'questions' && (
          <section className="flex flex-col gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
                PART {domainIndex + 1} OF {CHECK_IN_DOMAINS.length}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
                {DOMAIN_FRAMING[domain].title}
              </h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                {DOMAIN_FRAMING[domain].blurb} Think about the last two weeks. There are no right answers — the honest one is the useful one.
              </p>
            </div>

            {/* Questions List */}
            <ol className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <li
                  key={q.id}
                  className="rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3EEE5] text-xs font-semibold text-[#405445] mt-0.5 border border-[#EAE4D9]">
                      {i + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#233226]">{q.text}</p>
                  </div>

                  {/* 4 Option Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                    {q.options.map((opt) => {
                      const selected = domainAnswers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswer(domain, q.id, opt.value)}
                          className={cn(
                            'rounded-xl py-3 px-2 text-xs font-medium transition-all text-center cursor-pointer',
                            selected
                              ? 'bg-[#405445] text-white shadow-xs font-semibold'
                              : 'bg-white border border-[#D9D2C5] text-[#3E4F42] hover:border-[#405445] hover:bg-[#F3EFE8]',
                          )}
                          aria-pressed={selected}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between border-t border-[#EAE4D9] pt-6">
              <button
                type="button"
                onClick={() => {
                  if (domainIndex === 0) setStep('context');
                  else setDomainIndex((i) => i - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#56685A] hover:text-[#233226] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-4">
                <span className="text-xs text-[#657669] tabular-nums">
                  {answeredInDomain} of {questions.length} answered
                </span>
                <button
                  type="button"
                  disabled={!domainComplete}
                  onClick={() => {
                    if (domainIndex === CHECK_IN_DOMAINS.length - 1) setStep('feelings');
                    else setDomainIndex((i) => i + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs sm:text-sm font-semibold transition-all',
                    domainComplete
                      ? 'bg-[#405445] hover:bg-[#334437] text-white shadow-xs hover:scale-105 cursor-pointer'
                      : 'bg-[#EAE4D9] text-[#8C9B8F] cursor-not-allowed',
                  )}
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Workplace Feelings Chips */}
        {step === 'feelings' && (
          <section className="flex flex-col gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
                ALMOST THERE
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
                What's weighing on you at work?
              </h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                Pick as many as apply, or none. This is what turns scores into concrete changes your company can make.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-7 sm:p-8 border border-[#EAE4D9] shadow-xs flex flex-wrap gap-2.5">
              {FEELING_CHIPS.map((chip) => {
                const selected = feelings.includes(chip.theme);
                return (
                  <button
                    key={chip.theme}
                    type="button"
                    onClick={() => toggleFeeling(chip.theme)}
                    aria-pressed={selected}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium transition-all cursor-pointer',
                      selected
                        ? 'bg-[#405445] text-white shadow-xs'
                        : 'bg-[#FAF7F2] border border-[#D9D2C5] text-[#3E4F42] hover:border-[#405445] hover:bg-[#F3EFE8]',
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-[#EAE4D9] pt-6">
              <button
                type="button"
                onClick={() => {
                  setStep('questions');
                  setDomainIndex(CHECK_IN_DOMAINS.length - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#56685A] hover:text-[#233226] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('note');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#405445] hover:bg-[#334437] text-white px-7 py-3 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 4: Optional Anonymous Note */}
        {step === 'note' && (
          <section className="flex flex-col gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
                LAST QUESTION
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
                Anything you'd want the company to know?
              </h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                Optional and genuinely anonymous — this text is never linked to you, your email, or your device. If it makes it into the report, it appears as an unattributed sentence.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-7 sm:p-8 border border-[#EAE4D9] shadow-xs flex flex-col gap-3">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={600}
                placeholder="What would make next month better? What's making this month hard?"
                className="min-h-[160px] text-xs sm:text-sm border-[#D9D2C5] rounded-xl focus:border-[#405445] focus:ring-1 focus:ring-[#405445]"
              />
              <p className="text-right text-[11px] text-[#78897B]">{note.length}/600</p>
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
                {submitError}
              </p>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-[#EAE4D9] pt-6">
              <button
                type="button"
                onClick={() => {
                  setStep('feelings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#56685A] hover:text-[#233226] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#405445] hover:bg-[#334437] text-white px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                <span>{submitting ? 'Sending…' : 'Send my check-in'}</span>
              </button>
            </div>
          </section>
        )}

        {/* Step 5: Submission Complete & Private Reflection */}
        {step === 'done' && <Done results={results} supportEmail={organization.branding.supportEmail} onRestart={() => setStep('welcome')} />}
      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-[#EAE4D9]/80 bg-[#FAF7F2] py-6 z-10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 text-xs text-[#78897B]">
          <p>© 2026 MindSpace. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#233226] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#233226] transition-colors">Support</a>
            <a href="#" className="hover:text-[#233226] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** The Welcome Landing Screen */
function Welcome({
  orgName,
  onStart,
  onLogin,
}: {
  orgName: string;
  onStart: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 max-w-4xl mx-auto">
      {/* Eyebrow */}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
        MONTHLY CHECK-IN · {orgName.toUpperCase()}
      </p>

      {/* Hero Headline */}
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-normal tracking-tight text-[#233226] mt-3 leading-[1.12]">
        How have the last two weeks <span className="italic font-serif">actually</span> been?
      </h1>

      {/* Hero Subtitle */}
      <p className="mt-4 max-w-xl text-xs sm:text-sm text-[#56685A] leading-relaxed">
        Around five minutes. Nobody at {orgName} will ever see your answers — not your manager, not HR, not the
        person who sent you this link. Your responses join everyone else's and become one anonymous report about how
        the company is doing.
      </p>

      {/* 3 Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-12 text-left">
        <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0EA] text-[#405445]">
              <EyeOff className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#233226] mt-5">No name attached</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#56685A]">
              We don't ask who you are, and we don't record it. There is no field to leak.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0EA] text-[#405445]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#233226] mt-5">Never reported alone</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#56685A]">
              Nothing is shown to your company unless at least five people answered it.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0EA] text-[#405445]">
              <Compass className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#233226] mt-5">It leads somewhere</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#56685A]">
              The report comes with specific changes your company is asked to make.
            </p>
          </div>
        </div>
      </div>

      {/* Main CTA */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-[#405445] hover:bg-[#334437] text-white px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 cursor-pointer"
        >
          <span>Start my check-in</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="text-xs text-[#56685A] hover:text-[#233226] underline underline-offset-4 cursor-pointer transition-colors"
        >
          I'm from the people team
        </button>
      </div>
    </div>
  );
}

/** Choice card with pill tags */
function ChoiceCard({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-3.5">
      <p className="text-xs font-semibold text-[#233226]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={selected}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium transition-all cursor-pointer',
                selected
                  ? 'bg-[#405445] text-white shadow-xs font-semibold'
                  : 'bg-[#FAF7F2] border border-[#D9D2C5] text-[#3E4F42] hover:bg-[#F3EFE8] hover:border-[#405445]',
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Done screen with private reflection */
function Done({
  results,
  supportEmail,
  onRestart,
}: {
  results: CheckInDomainResult[];
  supportEmail: string;
  onRestart: () => void;
}) {
  const needsSupport = results.some((r) => r.level === 'High');

  return (
    <section className="flex flex-col gap-8 max-w-2xl mx-auto py-4">
      <div className="flex flex-col items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#405445] text-white shadow-xs">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226]">
          Thank you — that's it.
        </h1>
        <p className="text-xs sm:text-sm leading-relaxed text-[#56685A]">
          Your answers are in, unattached to your name. They'll be read alongside everyone else's and turned into an executive report your company receives this month.
        </p>
      </div>

      <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-normal text-[#233226]">Just for you</h2>
          <p className="mt-1 text-xs text-[#78897B]">
            A private reflection on what you told us. This part is never sent anywhere.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          {results.map((r) => (
            <div key={r.domain} className="flex items-center justify-between gap-4 rounded-xl bg-[#FAF7F2] p-3.5 border border-[#EAE4D9]">
              <span className="text-xs sm:text-sm font-medium text-[#233226]">{DOMAIN_FRAMING[r.domain].title}</span>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                style={{
                  backgroundColor:
                    r.level === 'Low' ? '#405445' : r.level === 'Moderate' ? '#9E6B38' : '#7C3426',
                }}
              >
                {r.level === 'Low' ? 'Looking steady' : r.level === 'Moderate' ? 'Some strain' : 'Worth talking to someone'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-[#56685A] mt-2">
          {needsSupport
            ? 'Some of what you described is heavy to carry alone. Talking to a professional is a practical step, not a dramatic one — and your company never finds out that you did.'
            : 'Nothing here suggests you are in difficulty, but the small things still add up. Protecting your evenings and sleep is the highest-return habit.'}
        </p>
      </div>

      <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-3">
        <h2 className="font-serif text-xl font-normal text-[#233226]">If you'd like to talk to someone</h2>
        <p className="text-xs sm:text-sm leading-relaxed text-[#56685A]">
          Confidential 1:1 sessions with a licensed therapist are available through your company's plan at ₹500/session. Bookings are private — your employer sees a usage count and nothing else.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Button asChild className="rounded-full bg-[#405445] hover:bg-[#334437] text-white text-xs font-semibold px-6 py-2.5">
            <a href={`mailto:${supportEmail}`}>Ask about a confidential session</a>
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="text-xs text-[#56685A] hover:text-[#233226] underline underline-offset-4 self-start cursor-pointer"
      >
        Back to the start
      </button>
    </section>
  );
}
