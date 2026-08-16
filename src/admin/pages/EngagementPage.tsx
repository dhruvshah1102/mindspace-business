import { useMemo } from 'react';
import { ShieldCheck, Sparkles, MessageCircleHeart, LifeBuoy, FlaskConical } from 'lucide-react';
import { useReport } from '@/admin/ReportContext';
import { useTenant } from '@/app/TenantContext';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { ChartCard } from '@/admin/charts/ChartCard';
import { StatTile, HeroFigure } from '@/admin/charts/StatTile';
import { RankedBarChart } from '@/admin/charts/RankedBarChart';
import { FunnelChart } from '@/admin/charts/FunnelChart';
import { SmallMultiples } from '@/admin/charts/TrendChart';
import { buildDemoEngagement } from '@/services/engagement-demo';
import { FEATURE_BLURBS, type EngagementFeature } from '@/domain/engagement';
import { formatCount, formatRupees } from '@/admin/charts/chart-theme';

/**
 * Platform engagement — is the support you're paying for reaching anyone?
 *
 * Deliberately separated from the wellbeing report. That report says how
 * people feel; this says whether they are using what you bought. A company can
 * have a calm workforce and dead engagement, or a strained workforce that is
 * actively reaching for help — and those two situations need opposite
 * responses from HR.
 *
 * Every number on this page is a headcount or a rate. Nothing here names a
 * person, and any cut with fewer than k participants is withheld rather than
 * estimated.
 */
export function EngagementPage() {
  const { snapshot, loading } = useReport();
  const { organization } = useTenant();

  const engagement = useMemo(
    () => (snapshot ? buildDemoEngagement(organization, snapshot) : null),
    [organization, snapshot],
  );

  if (loading || !snapshot || !engagement) return <ReportSkeleton />;

  const byFeature = Object.fromEntries(engagement.features.map((f) => [f.feature, f])) as Record<
    EngagementFeature,
    (typeof engagement.features)[number]
  >;

  const totalSpend = engagement.bookings.reduce((sum, b) => sum + b.spendPaise, 0);
  const totalSeats = engagement.bookings.reduce((sum, b) => sum + b.seats, 0);
  const maskedBookings = engagement.bookings.filter((b) => b.masked).length;
  const maskedTeams = engagement.byTeam.filter((t) => t.masked).length;

  // Weekly series for the sparklines on the tiles.
  const sparkFor = (key: keyof (typeof engagement.weekly)[number]) =>
    engagement.weekly.map((w) => Number(w[key]) || 0);

  const avgTeamRate =
    engagement.byTeam.filter((t) => !t.masked).reduce((s, t) => s + t.engagementRate, 0) /
    Math.max(1, engagement.byTeam.filter((t) => !t.masked).length);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
          PLATFORM ENGAGEMENT · {engagement.orgName.toUpperCase()}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">
          Who is actually reaching for help
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed mt-1">
          Headcounts only. You can see that {byFeature.tara.count} people talked to Tara and{' '}
          {byFeature.therapy.count} booked a therapist — you cannot see which people, and neither can we show you.
        </p>
      </header>

      {/* Demo-data notice — this page is a preview until the employee app ships. */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-[#DCD5C8] bg-[#F3EEE5] px-4 py-3">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9E6B38]" aria-hidden />
        <p className="text-[11px] leading-relaxed text-[#56685A]">
          <strong className="font-semibold text-[#233226]">Preview with sample data.</strong> Employee sign-in, Tara
          and session booking aren't live yet, so these figures are modelled on your real headcount and teams to show
          the shape of the reporting. Every chart is wired to the live event stream the day those surfaces ship.
        </p>
      </div>

      {/* Hero + KPI row */}
      <section className="rounded-[28px] bg-white p-7 sm:p-8 border border-[#EAE4D9] shadow-xs">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <HeroFigure
            label="Employees using MindSpace"
            value={String(engagement.activeEmployees)}
            sub={`${Math.round(engagement.activationRate * 100)}% of ${engagement.headcount} people, in ${engagement.periodLabel}`}
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-1.5 text-[11px] text-[#56685A]">
            <ShieldCheck className="h-3 w-3 text-[#78897B]" aria-hidden />
            <span>Anonymous · counts only, k ≥ {engagement.k}</span>
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Talked to Tara"
          value={formatCount(byFeature.tara.count)}
          sub={`${byFeature.tara.totalEvents} conversations`}
          delta={byFeature.tara.delta}
          deltaLabel="vs last cycle"
          trend={sparkFor('tara')}
        />
        <StatTile
          label="Ran an assessment"
          value={formatCount(byFeature.assessment.count)}
          sub={`${Math.round(byFeature.assessment.reach * 100)}% of the company`}
          delta={byFeature.assessment.delta}
          deltaLabel="vs last cycle"
          trend={sparkFor('assessment')}
        />
        <StatTile
          label="Booked a therapy session"
          value={formatCount(byFeature.therapy.count)}
          sub={`${totalSeats} seats taken`}
          delta={byFeature.therapy.delta}
          deltaLabel="vs last cycle"
          trend={sparkFor('therapy')}
        />
        <StatTile
          label="Spent on sessions"
          value={formatRupees(totalSpend)}
          sub="Company-funded this cycle"
        />
      </section>

      {/* The ladder */}
      <ChartCard
        title="How far people go for support"
        caption="Each step is a subset of the one above it. The drop-off between steps is where the programme is losing people."
        table={{
          columns: ['Step', 'People', 'Of workforce', 'Of previous step'],
          rows: engagement.funnel.map((s) => [
            s.label,
            s.employees,
            `${Math.round(s.ofWorkforce * 100)}%`,
            `${Math.round(s.ofPrevious * 100)}%`,
          ]),
        }}
      >
        <FunnelChart stages={engagement.funnel} headcount={engagement.headcount} />
      </ChartCard>

      {/* Weekly movement, faceted */}
      <ChartCard
        title="Week by week"
        caption="Distinct people using each feature, over the last eight weeks."
        table={{
          columns: ['Week', 'Check-in', 'Assessment', 'Tara', 'Therapy'],
          rows: engagement.weekly.map((w) => [w.label, w.checkin, w.assessment, w.tara, w.therapy]),
        }}
      >
        <SmallMultiples
          data={engagement.weekly.map((w) => ({
            label: w.label,
            checkin: w.checkin,
            assessment: w.assessment,
            tara: w.tara,
            therapy: w.therapy,
          }))}
          panels={[
            { key: 'checkin', title: 'Anonymous check-in' },
            { key: 'assessment', title: 'Full assessment' },
            { key: 'tara', title: 'Tara conversations' },
            { key: 'therapy', title: 'Therapy bookings' },
          ]}
          note="All four panels share one scale, so the panels are directly comparable — a small line means genuinely fewer people, not a different axis."
        />
      </ChartCard>

      {/* Tara */}
      <ChartCard
        title="What people bring to Tara"
        caption="Conversations are classified onto the same pressure taxonomy the check-in uses. Transcripts are never stored, and never shown to anyone."
        figure={
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#78897B]">
            <MessageCircleHeart className="h-3.5 w-3.5" aria-hidden />
            <span>{byFeature.tara.totalEvents} conversations</span>
          </span>
        }
        table={{
          columns: ['Topic', 'Conversations', 'Share'],
          rows: engagement.taraTopics.map((t) => [t.label, t.conversations, `${Math.round(t.share * 100)}%`]),
        }}
      >
        <RankedBarChart
          data={engagement.taraTopics.map((t) => ({
            label: t.label,
            value: t.conversations,
            display: `${t.conversations} · ${Math.round(t.share * 100)}%`,
          }))}
        />
      </ChartCard>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[22px] bg-white border border-[#EAE4D9] shadow-xs p-5 flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EEE5]">
            <Sparkles className="h-4 w-4 text-[#4F6B57]" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#233226]">
              {engagement.taraMedianTurns} messages per conversation
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#78897B]">
              The median exchange. Short conversations would mean people bounce off Tara; this depth means they stay
              and actually talk.
            </p>
          </div>
        </div>
        <div className="rounded-[22px] bg-white border border-[#EAE4D9] shadow-xs p-5 flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EEE5]">
            <LifeBuoy className="h-4 w-4 text-[#9E6B38]" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#233226]">
              {engagement.taraEscalations} handovers to a human
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#78897B]">
              Conversations where Tara surfaced the route to a real therapist. Escalation is a success, not a failure —
              it means the AI knew its limit.
            </p>
          </div>
        </div>
      </section>

      {/* Bookings */}
      <ChartCard
        title="Sessions booked, by format"
        caption="Seats taken and what the company spent on each. Formats booked by fewer than five people are withheld."
        masked={{ k: engagement.k, hiddenCount: maskedBookings }}
        table={{
          columns: ['Format', 'People', 'Seats', 'Spend'],
          rows: engagement.bookings.map((b) =>
            b.masked
              ? [b.label, 'Withheld', 'Withheld', 'Withheld']
              : [b.label, b.employees, b.seats, formatRupees(b.spendPaise)],
          ),
        }}
      >
        <RankedBarChart
          data={engagement.bookings.map((b) => ({
            label: b.label,
            value: b.seats,
            display: `${b.seats} seats · ${formatRupees(b.spendPaise)}`,
            masked: b.masked,
            sub: b.masked ? undefined : `${b.employees} ${b.employees === 1 ? 'person' : 'people'}`,
          }))}
        />
      </ChartCard>

      {/* By team */}
      <ChartCard
        title="Engagement by team"
        caption="Share of each team using any part of MindSpace. A team well below the average usually means the manager hasn't passed it on — not that they're fine."
        masked={{ k: engagement.k, hiddenCount: maskedTeams }}
        table={{
          columns: ['Team', 'People using MindSpace', 'Share of team'],
          rows: engagement.byTeam.map((t) =>
            t.masked
              ? [t.team, 'Withheld', 'Withheld']
              : [t.team, t.activeEmployees, `${Math.round(t.engagementRate * 100)}%`],
          ),
        }}
      >
        <RankedBarChart
          maxValue={1}
          reference={{ value: avgTeamRate, label: `Company average, ${Math.round(avgTeamRate * 100)}%` }}
          data={engagement.byTeam.map((t) => ({
            label: t.team,
            value: t.engagementRate,
            display: `${Math.round(t.engagementRate * 100)}%`,
            masked: t.masked,
            sub: t.masked ? undefined : `${t.activeEmployees} people`,
          }))}
        />
      </ChartCard>

      {/* Feature reach, all four side by side */}
      <ChartCard
        title="Reach of each feature"
        caption="What share of the whole company has used each part of the platform at least once this cycle."
        table={{
          columns: ['Feature', 'Count', 'Counted as', 'Reach', 'Total uses'],
          rows: engagement.features.map((f) => [
            f.label,
            f.count,
            f.unit,
            `${Math.round(f.reach * 100)}%`,
            f.totalEvents,
          ]),
        }}
      >
        <RankedBarChart
          maxValue={1}
          data={engagement.features
            .slice()
            .sort((a, b) => b.reach - a.reach)
            .map((f) => ({
              label: f.label,
              value: f.reach,
              display: `${Math.round(f.reach * 100)}%`,
              status: `${f.count} ${f.unit}`,
              sub: FEATURE_BLURBS[f.feature],
            }))}
        />
      </ChartCard>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[11px] text-[#78897B]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        <span>
          Engagement is counted against a rotating pseudonymous id, never a name, email or employee number. Groups
          smaller than {engagement.k} are withheld everywhere on this page.
        </span>
      </footer>
    </div>
  );
}
