import type { ReactNode } from 'react';
import {
  Check,
  Quote,
  RefreshCw,
  TriangleAlert,
  Loader2,
  Database,
  ShieldCheck,
  Sparkles,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReport } from '@/admin/ReportContext';
import { PeopleGrid } from '@/admin/widgets/PeopleGrid';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';

export function ReportPage() {
  const { report, loading, isSyncing, syncAndRegenerate, liveCount, aiConfigured } = useReport();

  if (loading || !report) return <ReportSkeleton />;

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* Header Section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
            {report.meta.periodLabel.toUpperCase()} · {report.meta.orgName.toUpperCase()}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
            How your people are doing
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#56685A] leading-relaxed">
            Synthesized from {report.meta.responses} total responses ({liveCount} live from Supabase + {report.meta.headcount - liveCount} baseline). No names, no individual answers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCD5C8] bg-[#F3EEE5] px-3.5 py-1.5 text-xs font-normal text-[#526355]">
            <Database className="h-3 w-3 text-[#78897B]" />
            <span>{liveCount} live check-in{liveCount === 1 ? '' : 's'} in Supabase</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={isSyncing}
            onClick={() => void syncAndRegenerate()}
            className="rounded-full bg-white border border-[#D9D2C5] px-4 py-1.5 text-xs font-semibold text-[#3E4F42] shadow-xs hover:bg-[#F3EFE8] transition-colors cursor-pointer"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-[#5A6D5E]" />
                <span>Syncing with Gemini...</span>
              </>
            ) : (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-[#5A6D5E]" />
                <span>Sync & Regenerate Report</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* The Hero Executive Verdict Card */}
      <section className="rounded-[28px] bg-white p-7 sm:p-10 border border-[#EAE4D9] shadow-xs">
        {/* Top Status Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-6 border-b border-[#EAE4D9]/70">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-1 font-medium text-[#3E4F42]">
              {report.mood === 'good' ? (
                <Smile className="h-3.5 w-3.5 text-[#405445]" />
              ) : report.mood === 'okay' ? (
                <Meh className="h-3.5 w-3.5 text-[#5A6D5E]" />
              ) : (
                <Frown className="h-3.5 w-3.5 text-[#9E6B38]" />
              )}
              <span>{report.moodLabel}</span>
            </span>
            <span className="text-[#78897B]">
              {Math.round(report.meta.participationRate * 100)}% of the company answered ({report.meta.responses} responses)
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[#78897B]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#78897B]" />
            <span>Strictly anonymous (k ≥ 5)</span>
          </span>
        </div>

        {/* Big Editorial Headline */}
        <h2 className="font-serif text-2xl sm:text-3xl text-[#233226] font-normal leading-snug tracking-tight mt-6">
          {report.headline}
        </h2>

        {/* Narrative Paragraphs */}
        <div className="mt-6 flex flex-col gap-4 text-xs sm:text-sm leading-relaxed text-[#56685A] max-w-3xl">
          {report.summary.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* What This Means for Leadership Box */}
        <div className="mt-8 rounded-2xl bg-[#FAF7F2] p-6 border border-[#EAE4D9]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">
            WHAT THIS MEANS FOR LEADERSHIP
          </p>
          <p className="mt-2 text-xs sm:text-sm font-medium text-[#233226] leading-relaxed">
            {report.whatThisMeans}
          </p>
        </div>
      </section>

      {/* Distribution Grid: "A hundred of your people" */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">
            A hundred of your people
          </h2>
          <p className="mt-1 text-xs text-[#78897B]">
            Each figure is one percent of everyone who answered ({report.meta.responses} total responses).
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-8 sm:p-10 border border-[#EAE4D9] shadow-xs">
          <PeopleGrid segments={report.howPeopleFeel} />
        </div>
      </section>

      {/* Two Column Read: What's Working vs What Needs Attention */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* What's Working */}
        <div className="rounded-[28px] bg-white p-7 sm:p-8 border border-[#EAE4D9] shadow-xs flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#405445] text-white">
              <Check className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-xl font-normal text-[#233226]">What's working</h3>
          </div>
          <ul className="flex flex-col gap-3.5">
            {report.goingWell.map((item, i) => (
              <li key={i} className="flex gap-3 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#405445]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What Needs Attention */}
        <div className="rounded-[28px] bg-white p-7 sm:p-8 border border-[#EAE4D9] shadow-xs flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9E6B38] text-white">
              <TriangleAlert className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-xl font-normal text-[#233226]">What needs attention</h3>
          </div>
          <ul className="flex flex-col gap-3.5">
            {report.needsAttention.map((item, i) => (
              <li key={i} className="flex gap-3 text-xs sm:text-sm leading-relaxed text-[#56685A]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9E6B38]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Start With These Three Actions */}
      <section className="flex flex-col gap-3">
        <div className="rounded-[28px] bg-white p-8 sm:p-10 border border-[#EAE4D9] shadow-xs">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">
            Start with these three actions
          </h2>
          <p className="mt-1 text-xs text-[#78897B]">
            Immediate high-leverage steps for this week based on the latest responses.
          </p>

          <ol className="mt-7 flex flex-col gap-4">
            {report.doThisFirst.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#405445] text-xs font-semibold text-white mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-[#3E4F42]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* In Their Own Words */}
      {report.inTheirWords.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">
              In their own words
            </h2>
            <p className="mt-1 text-xs text-[#78897B]">
              Direct quotes extracted from employee notes, shared anonymously with no identity attached.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {report.inTheirWords.map((v, i) => (
              <blockquote
                key={i}
                className="relative rounded-[24px] border border-[#EAE4D9] bg-white p-6 shadow-xs"
              >
                <Quote className="h-4 w-4 text-[#C5BDB0] mb-3" aria-hidden />
                <p className="text-xs sm:text-sm leading-relaxed text-[#3E4F42]">“{v.quote}”</p>
                <footer className="mt-3 text-[11px] font-medium text-[#78897B]">{v.topic}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Footer Provenance */}
      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-[#78897B]">
        <Sparkles className="h-3.5 w-3.5 text-[#78897B]" aria-hidden />
        <span>
          {report.meta.writtenBy === 'gemini'
            ? 'Written by Gemini 2.5 Flash from the blended aggregate.'
            : aiConfigured
              ? 'Gemini was unavailable, so this was synthesized by the built-in rules engine.'
              : 'Written by the built-in rules engine.'}
        </span>
        <span aria-hidden>·</span>
        <span>{report.meta.source === 'live' ? 'Live Supabase check-ins blended with baseline' : 'Seeded demo dataset'}</span>
        <span aria-hidden>·</span>
        <time dateTime={report.meta.generatedAt}>
          {new Date(report.meta.generatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </footer>
    </div>
  );
}
