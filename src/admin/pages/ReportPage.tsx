import { useMemo } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReport } from '@/admin/ReportContext';
import { useTenant } from '@/app/TenantContext';
import { PeopleGrid } from '@/admin/widgets/PeopleGrid';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { ChartCard } from '@/admin/charts/ChartCard';
import { StatTile } from '@/admin/charts/StatTile';
import { StackedShareBar } from '@/admin/charts/StackedShareBar';
import { TrendChart } from '@/admin/charts/TrendChart';
import { TIER_VAR, pctLabel } from '@/admin/charts/chart-theme';
import { getWellbeingTrend, trendDelta } from '@/services/trend-service';
import { buildDemoEngagement } from '@/services/engagement-demo';
import type { MoodTier } from '@/domain/snapshot';

/** Ink for the percentage printed inside each tier segment, picked against the fill. */
const TIER_LABEL_INK: Record<MoodTier, 'light' | 'dark'> = {
  thriving: 'light',
  steady: 'dark',
  strained: 'dark',
  struggling: 'light',
};

export function ReportPage() {
  const { report, snapshot, loading, isSyncing, syncAndRegenerate, liveCount, aiConfigured } = useReport();
  const { organization } = useTenant();

  const trend = useMemo(() => getWellbeingTrend(), []);
  const engagement = useMemo(
    () => (snapshot ? buildDemoEngagement(organization, snapshot) : null),
    [organization, snapshot],
  );

  if (loading || !report || !snapshot) return <ReportSkeleton />;

  const underStrain = report.howPeopleFeel
    .filter((t) => t.tier === 'strained' || t.tier === 'struggling')
    .reduce((n, t) => n + t.peopleCount, 0);
  const strainShare = report.meta.responses ? underStrain / report.meta.responses : 0;

  const strainMove = trendDelta(trend, 'strainShare');
  const segments = report.howPeopleFeel.map((t) => ({
    key: t.tier,
    label: t.label,
    count: t.peopleCount,
    share: t.share,
    color: TIER_VAR[t.tier as MoodTier],
    labelOnFill: TIER_LABEL_INK[t.tier as MoodTier],
  }));

  const MoodIcon = report.mood === 'good' ? Smile : report.mood === 'okay' ? Meh : Frown;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
            {report.meta.periodLabel.toUpperCase()} · {report.meta.orgName.toUpperCase()}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-2">
            How your people are doing
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#56685A] leading-relaxed">
            {report.meta.responses} responses · no names, no individual answers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCD5C8] bg-[#F3EEE5] px-3.5 py-1.5 text-xs font-normal text-[#526355]">
            <Database className="h-3 w-3 text-[#78897B]" />
            <span>{liveCount} live check-in{liveCount === 1 ? '' : 's'}</span>
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
                <span>Syncing…</span>
              </>
            ) : (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-[#5A6D5E]" />
                <span>Sync & Regenerate</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* The verdict — one sentence, kept above the charts. */}
      <section className="rounded-[28px] bg-white p-7 sm:p-9 border border-[#EAE4D9] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-5 border-b border-[#EAE4D9]/70">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-1 font-medium text-[#3E4F42]">
            <MoodIcon className="h-3.5 w-3.5 text-[#5A6D5E]" aria-hidden />
            <span>{report.moodLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#78897B]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            <span>Strictly anonymous (k ≥ 5)</span>
          </span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl text-[#233226] font-normal leading-snug tracking-tight mt-5">
          {report.headline}
        </h2>

        <div className="mt-5 rounded-2xl bg-[#FAF7F2] p-5 border border-[#EAE4D9]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">
            WHAT THIS MEANS FOR LEADERSHIP
          </p>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#233226] leading-relaxed">
            {report.whatThisMeans}
          </p>
        </div>
      </section>

      {/* Headline numbers */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="People who answered"
          value={String(report.meta.responses)}
          sub={`${Math.round(report.meta.participationRate * 100)}% of the company`}
          trend={trend.map((p) => p.participants)}
        />
        <StatTile
          label="Stretched or worse"
          value={pctLabel(strainShare)}
          sub={`${underStrain} people`}
          delta={Math.round(strainMove * 100)}
          deltaLabel="pts vs 12 weeks ago"
          upIsGood={false}
          trend={trend.map((p) => Math.round(p.strainShare * 100))}
        />
        <StatTile
          label="Needing real support"
          value={String(report.howPeopleFeel.find((t) => t.tier === 'struggling')?.peopleCount ?? 0)}
          sub="The group to act on first"
        />
        {engagement && (
          <StatTile
            label="Using MindSpace"
            value={String(engagement.activeEmployees)}
            sub={`${Math.round(engagement.activationRate * 100)}% signed in this cycle`}
            delta={engagement.activeDelta}
            deltaLabel="vs last cycle"
          />
        )}
      </section>

      {/* Distribution — the chart that replaces four paragraphs */}
      <ChartCard
        title="The workforce, split four ways"
        caption="An average hides the people struggling behind the people who are fine. Left to right: coping, then under strain."
        table={{
          columns: ['Group', 'People', 'Share'],
          rows: report.howPeopleFeel.map((t) => [t.label, t.peopleCount, `${Math.round(t.share * 100)}%`]),
        }}
      >
        <div className="flex flex-col gap-7">
          <StackedShareBar segments={segments} total={report.meta.responses} />
          <div className="border-t border-[#EAE4D9] pt-6">
            <PeopleGrid segments={report.howPeopleFeel} />
            <p className="mt-3 text-[11px] text-[#78897B]">
              Each figure is one percent of everyone who answered.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Trend */}
      <ChartCard
        title="Strain over the last twelve weeks"
        caption={`Share of responses in the moderate or high band. ${
          strainMove > 0.005
            ? 'The line is climbing — this is a trend, not a bad week.'
            : strainMove < -0.005
              ? 'The line is falling — whatever changed recently is working.'
              : 'Broadly flat across the quarter.'
        }`}
        table={{
          columns: ['Week', 'Under strain', 'Participation', 'Responses'],
          rows: trend.map((p) => [
            p.label,
            pctLabel(p.strainShare),
            pctLabel(p.participationRate),
            p.participants,
          ]),
        }}
      >
        <TrendChart
          data={trend.map((p) => ({ label: p.label, strain: Math.round(p.strainShare * 100) }))}
          valueKey="strain"
          format={(v) => `${v}%`}
          tooltipLabel="Under strain"
        />
      </ChartCard>

      {/* What's working vs what needs attention */}
      <section className="grid gap-6 md:grid-cols-2">
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

      {/* Three actions */}
      <section className="rounded-[28px] bg-white p-8 sm:p-10 border border-[#EAE4D9] shadow-xs">
        <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">
          Start with these three actions
        </h2>
        <p className="mt-1 text-xs text-[#78897B]">
          Immediate high-leverage steps for this week.
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
      </section>

      {/* The full narrative, available but no longer the first thing on the page. */}
      {report.summary.length > 0 && (
        <details className="group rounded-[28px] bg-white border border-[#EAE4D9] shadow-xs">
          <summary className="flex cursor-pointer items-center justify-between gap-3 p-7 sm:p-8 list-none">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#233226]">Read the full write-up</h2>
              <p className="mt-1 text-xs text-[#78897B]">
                The same cycle in prose — {report.summary.length} paragraphs, for the board pack.
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[#78897B] transition-transform group-open:rotate-90"
              aria-hidden
            />
          </summary>
          <div className="flex flex-col gap-4 px-7 sm:px-8 pb-8 text-xs sm:text-sm leading-relaxed text-[#56685A] max-w-3xl">
            {report.summary.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </details>
      )}

      {/* In their own words */}
      {report.inTheirWords.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">In their own words</h2>
            <p className="mt-1 text-xs text-[#78897B]">
              Direct quotes from employee notes, with no identity attached.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {report.inTheirWords.map((v, i) => (
              <blockquote key={i} className="relative rounded-[24px] border border-[#EAE4D9] bg-white p-6 shadow-xs">
                <Quote className="h-4 w-4 text-[#C5BDB0] mb-3" aria-hidden />
                <p className="text-xs sm:text-sm leading-relaxed text-[#3E4F42]">“{v.quote}”</p>
                <footer className="mt-3 text-[11px] font-medium text-[#78897B]">{v.topic}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Provenance */}
      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs text-[#78897B]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        <span>
          {report.meta.writtenBy === 'gemini'
            ? 'Written by Gemini 2.5 Flash from the blended aggregate.'
            : aiConfigured
              ? 'Gemini was unavailable, so this was synthesized by the built-in rules engine.'
              : 'Written by the built-in rules engine.'}
        </span>
        <span aria-hidden>·</span>
        <span>{report.meta.source === 'live' ? 'Live check-ins blended with baseline' : 'Seeded demo dataset'}</span>
        <span aria-hidden>·</span>
        <time dateTime={report.meta.generatedAt}>
          {new Date(report.meta.generatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </footer>
    </div>
  );
}
