import { useMemo } from 'react';
import { useReport } from '@/admin/ReportContext';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { PeopleGrid } from '@/admin/widgets/PeopleGrid';
import { ChartCard } from '@/admin/charts/ChartCard';
import { StackedShareBar } from '@/admin/charts/StackedShareBar';
import { RankedBarChart } from '@/admin/charts/RankedBarChart';
import { SmallMultiples } from '@/admin/charts/TrendChart';
import { TIER_VAR, pctLabel } from '@/admin/charts/chart-theme';
import { getWellbeingTrend } from '@/services/trend-service';
import { asFraction } from '@/domain/wellbeing-report';
import { CHECK_IN_DOMAINS } from '@/domain/check-in';
import { ASSESSMENT_METADATA } from '@/domain/assessments';
import type { MoodTier } from '@/domain/snapshot';

const TIER_LABEL_INK: Record<MoodTier, 'light' | 'dark'> = {
  thriving: 'light',
  steady: 'dark',
  strained: 'dark',
  struggling: 'light',
};

export function FeelingsPage() {
  const { report, snapshot, loading } = useReport();
  const trend = useMemo(() => getWellbeingTrend(), []);

  if (loading || !report || !snapshot) return <ReportSkeleton />;

  const underStrain = report.howPeopleFeel
    .filter((t) => t.tier === 'strained' || t.tier === 'struggling')
    .reduce((n, t) => n + t.peopleCount, 0);

  const segments = report.howPeopleFeel.map((t) => ({
    key: t.tier,
    label: t.label,
    count: t.peopleCount,
    share: t.share,
    color: TIER_VAR[t.tier as MoodTier],
    labelOnFill: TIER_LABEL_INK[t.tier as MoodTier],
  }));

  const visibleTeams = snapshot.teams.filter((t) => !t.masked);
  const avgStrain =
    visibleTeams.reduce((s, t) => s + t.strainShare, 0) / Math.max(1, visibleTeams.length);
  const maskedTeams = snapshot.teams.length - visibleTeams.length;

  // Per-domain severity over the quarter, faceted rather than drawn as three
  // converging lines on one axis.
  const domainPanels = CHECK_IN_DOMAINS.map((domain) => ({
    key: domain,
    title: ASSESSMENT_METADATA[domain].title.replace(' Assessment', ''),
  }));
  const domainSeries = trend.map((p) => ({
    label: p.label,
    ...Object.fromEntries(CHECK_IN_DOMAINS.map((d) => [d, Math.round(p.domainMeans[d] ?? 0)])),
  }));

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
          HOW PEOPLE FEEL · {report.meta.orgName.toUpperCase()}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">
          Four groups, not one average
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed mt-1">
          <strong className="font-semibold text-[#233226]">{asFraction(underStrain / Math.max(1, report.meta.responses))}</strong> are
          stretched or worse — {underStrain} of the {report.meta.responses} people who answered.
        </p>
      </header>

      {/* Distribution */}
      <ChartCard
        title="Where everyone sits"
        caption="Left to right: coping, then under strain. Each group needs a different response from you."
        table={{
          columns: ['Group', 'People', 'Share'],
          rows: report.howPeopleFeel.map((t) => [t.label, t.peopleCount, `${Math.round(t.share * 100)}%`]),
        }}
      >
        <div className="flex flex-col gap-7">
          <StackedShareBar segments={segments} total={report.meta.responses} />
          <div className="border-t border-[#EAE4D9] pt-6">
            <PeopleGrid segments={report.howPeopleFeel} />
            <p className="mt-3 text-[11px] text-[#78897B]">Each figure is one percent of everyone who answered.</p>
          </div>
        </div>
      </ChartCard>

      {/* Tier detail cards — the text that earns its place, because each group
          needs a different action and a bar can't say what that is. */}
      <section className="grid gap-5 sm:grid-cols-2">
        {report.howPeopleFeel.map((t) => (
          <article
            key={t.tier}
            className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: TIER_VAR[t.tier as MoodTier] }}
                  aria-hidden
                />
                <h2 className="font-serif text-xl font-normal text-[#233226]">{t.label}</h2>
              </div>
              <span className="text-2xl font-semibold text-[#233226]">{Math.round(t.share * 100)}%</span>
            </div>

            <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">{t.description}</p>

            <div className="mt-auto border-t border-[#EAE4D9] pt-3 text-[11px] font-medium text-[#78897B]">
              ~{t.peopleCount} {t.peopleCount === 1 ? 'person' : 'people'} of {report.meta.responses}
            </div>
          </article>
        ))}
      </section>

      {/* Team strain */}
      <ChartCard
        title="Strain by team"
        caption="Share of each team stretched or worse. The dashed line is the company average — the teams to the right of it are carrying more than their share."
        masked={{ k: 5, hiddenCount: maskedTeams }}
        table={{
          columns: ['Team', 'Responses', 'Under strain'],
          rows: snapshot.teams.map((t) =>
            t.masked ? [t.team, 'Withheld', 'Withheld'] : [t.team, t.responses, pctLabel(t.strainShare)],
          ),
        }}
      >
        <RankedBarChart
          maxValue={1}
          reference={{ value: avgStrain, label: `Company average, ${Math.round(avgStrain * 100)}%` }}
          data={snapshot.teams.map((t) => ({
            label: t.team,
            value: t.strainShare,
            display: pctLabel(t.strainShare),
            masked: t.masked,
            sub: t.masked
              ? undefined
              : `${t.responses} responses${t.topFeeling ? ` · mostly ${t.topFeeling.toLowerCase()}` : ''}`,
          }))}
        />
      </ChartCard>

      {/* Domain trends */}
      <ChartCard
        title="Each domain over the quarter"
        caption="Mean severity out of 100 for the three modules the check-in runs. Higher is worse."
        table={{
          columns: ['Week', ...domainPanels.map((p) => p.title)],
          rows: domainSeries.map((row) => [
            String(row.label),
            ...domainPanels.map((p) => Number(row[p.key as keyof typeof row] ?? 0)),
          ]),
        }}
      >
        <SmallMultiples
          panels={domainPanels}
          data={domainSeries}
          note="All three panels share one scale, so they are directly comparable."
        />
      </ChartCard>

      {/* Hardest items */}
      {snapshot.toughestSignals.length > 0 && (
        <ChartCard
          title="The questions people answer worst"
          caption="Share answering “often” or “almost everyday”. This is the layer that turns “morale is down” into “people aren't sleeping”."
          table={{
            columns: ['Question', 'Struggling'],
            rows: snapshot.toughestSignals.map((s) => [s.question, pctLabel(s.share)]),
          }}
        >
          <RankedBarChart
            maxValue={1}
            emphasiseFirst
            data={snapshot.toughestSignals.map((s) => ({
              label: s.question,
              value: s.share,
              display: pctLabel(s.share),
              sub: ASSESSMENT_METADATA[s.domain]?.title.replace(' Assessment', ''),
            }))}
          />
        </ChartCard>
      )}
    </div>
  );
}
