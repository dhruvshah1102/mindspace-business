import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { useTenant } from '@/app/TenantContext';
import { ASSESSMENT_METADATA, ASSESSMENT_TYPES, calculateAssessmentResult, type AssessmentType } from '@/domain/assessments';
import { saveMyAssessment } from '@/services/employee-assessment-service';

const LEVEL_COPY: Record<string, string> = {
  Low: 'Looking steady',
  Moderate: 'Some strain',
  High: 'Worth talking to someone',
};

const LEVEL_COLOR: Record<string, string> = {
  Low: '#4F6B57',
  Moderate: '#9E6B38',
  High: '#7C3426',
};

export function AssessmentRunnerPage() {
  const { type } = useParams<{ type: string }>();
  const { user } = useEmployeeAuth();
  const { organization } = useTenant();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = !!type && ASSESSMENT_TYPES.includes(type as AssessmentType);
  const domain = valid ? (type as AssessmentType) : 'anxiety';
  const meta = ASSESSMENT_METADATA[domain];

  const question = meta.questions[step];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((step / meta.questions.length) * 100);
  const isLast = step === meta.questions.length - 1;
  const result = done ? calculateAssessmentResult(answers, domain) : null;

  async function submit(finalAnswers: Record<number, string>) {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = calculateAssessmentResult(finalAnswers, domain);
      await saveMyAssessment(user.id, organization.orgId, {
        domain,
        score: r.score,
        maxScore: r.maxScore,
        level: r.level,
        items: meta.questions.map((q) => ({
          qid: q.id,
          score: q.options.find((o) => o.value === finalAnswers[q.id])?.score ?? 0,
        })),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function choose(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (isLast) {
      void submit(next);
    } else {
      setStep((s) => s + 1);
    }
  }

  useEffect(() => {
    if (!valid || done || submitting) return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) {
        choose(question.options[n - 1].value);
      } else if (e.key === 'ArrowLeft' && step > 0) {
        setStep((s) => s - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, done, submitting, step, question]);

  if (!valid) {
    return <Navigate to="/app/assessments" replace />;
  }

  if (done && result) {
    return (
      <section className="flex flex-col gap-8 max-w-2xl">
        <div className="flex flex-col items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F6B57] text-white shadow-xs">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226]">{meta.title} — done</h1>
        </div>

        <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-[#FAF7F2] p-4 border border-[#EAE4D9]">
            <span className="text-sm font-medium text-[#233226]">Your result</span>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
              style={{ backgroundColor: LEVEL_COLOR[result.level] }}
            >
              {LEVEL_COPY[result.level]}
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-[#56685A]">
            This is private to you — {organization.name} only ever sees that an assessment was taken, never this
            score. You can retake this any time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/assessments"
            className="inline-flex items-center gap-2 rounded-full bg-[#4F6B57] hover:bg-[#3F5646] text-white px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105"
          >
            <span>Back to assessments</span>
          </Link>
          <Link to="/app/book" className="text-xs font-semibold text-[#56685A] hover:text-[#233226] underline underline-offset-4">
            Book a therapist instead
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-14 items-start max-w-4xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">{meta.title}</h1>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#78897B]">
            Question <span className="text-[#233226]">{step + 1}</span> of {meta.questions.length}
          </p>
          <p className="text-3xl font-semibold text-[#4F6B57] tabular-nums">{progress}%</p>
          <div className="h-1.5 w-full rounded-full bg-[#EAE4D9] overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-[#4F6B57] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#78897B]">There are no right answers - go with your first instinct.</p>

        <p className="text-xs text-[#78897B]">
          Press <span className="font-semibold text-[#56685A]">1–{question.options.length}</span> to answer
        </p>

        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={cn(
            'inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
            step === 0
              ? 'border-[#EAE4D9] text-[#B7BEB9] cursor-not-allowed'
              : 'border-[#D9D2C5] text-[#56685A] hover:border-[#4F6B57] hover:text-[#233226] cursor-pointer',
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Previous question</span>
        </button>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-[28px] bg-white p-7 sm:p-10 border border-[#EAE4D9] shadow-xs flex flex-col gap-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal leading-snug text-[#233226]">{question.text}</h2>

        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const selected = answers[question.id] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={submitting}
                onClick={() => choose(opt.value)}
                className={cn(
                  'flex items-center gap-4 rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all cursor-pointer',
                  selected
                    ? 'border-[#4F6B57] bg-[#F3EFE8]'
                    : 'border-[#EAE4D9] bg-white hover:border-[#D9D2C5] hover:bg-[#FAF7F2]',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold border',
                    selected ? 'bg-[#4F6B57] text-white border-[#4F6B57]' : 'bg-[#F3EEE5] text-[#4F6B57] border-[#EAE4D9]',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-[#233226]">{opt.label}</span>
                {submitting && selected && <Loader2 className="ml-auto h-4 w-4 animate-spin text-[#4F6B57]" />}
              </button>
            );
          })}
        </div>
      </div>

      <p className="md:col-span-2 text-xs text-[#78897B] tabular-nums">
        {answeredCount} of {meta.questions.length} answered
      </p>
    </section>
  );
}
