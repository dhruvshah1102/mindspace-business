import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, ClipboardCheck, CalendarHeart } from 'lucide-react';
import { useTenant } from '@/app/TenantContext';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { ChartCard } from '@/admin/charts/ChartCard';
import { RankedBarChart } from '@/admin/charts/RankedBarChart';
import { StackedShareBar, type ShareSegment } from '@/admin/charts/StackedShareBar';
import { SmallMultiples } from '@/admin/charts/TrendChart';
import { formatCount } from '@/admin/charts/chart-theme';
import { bandColor } from '@/lib/viz-palette';
import { ASSESSMENT_TYPES, ASSESSMENT_METADATA, type AssessmentType } from '@/domain/assessments';
import { DEFAULT_K_ANONYMITY } from '@/domain/cohorts';
import { getOrgEmployeeStats, type OrgEmployeeStats } from '@/services/org-stats-service';
import {
  getOrgAssessmentBreakdown,
  getOrgBookingBreakdown,
  getOrgWeeklyTrend,
  type OrgAssessmentBreakdown,
  type OrgBookingBreakdown,
  type OrgWeeklyTrend,
  type DomainBreakdown,
  type BookingFormat,
} from '@/services/org-analytics-service';

const BOOKING_FORMATS: BookingFormat[] = ['group', '1:1'];
const FORMAT_LABEL: Record<BookingFormat, string> = { group: 'Group sessions', '1:1': '1:1 sessions' };

/**
 * The HR landing screen — what your people are actually using, built entirely
 * from the real employee schema (profiles, assessment_records,
 * therapy_bookings). Every cut is a headcount; anything below k people is
 * withheld at the database, never estimated.
 */
export function ReportPage() {
  const { organization } = useTenant();
  const k = organization.policy.kAnonymity || DEFAULT_K_ANONYMITY;

  const [liveStats, setLiveStats] = useState<OrgEmployeeStats | null>(null);
  const [assessments, setAssessments] = useState<OrgAssessmentBreakdown | null>(null);
  const [bookings, setBookings] = useState<OrgBookingBreakdown | null>(null);
  const [trend, setTrend] = useState<OrgWeeklyTrend | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getOrgEmployeeStats(organization.orgId),
      getOrgAssessmentBreakdown(organization.orgId, k),
      getOrgBookingBreakdown(organization.orgId, k),
      getOrgWeeklyTrend(organization.orgId, 8),
    ]).then(([stats, assessmentBreakdown, bookingBreakdown, weeklyTrend]) => {
      if (cancelled) return;
      setLiveStats(stats);
      setAssessments(assessmentBreakdown);
      setBookings(bookingBreakdown);
      setTrend(weeklyTrend);
    });
    return () => {
      cancelled = true;
    };
  }, [organization.orgId, k]);

  if (!liveStats || !assessments || !bookings || !trend) return <ReportSkeleton />;

  const bookingRows = BOOKING_FORMATS.map((format) => {
    const b = bookings.byFormat[format];
    return {
      label: FORMAT_LABEL[format],
      value: b.total,
      display: `${b.total} booked`,
      sub: b.statusMasked
        ? `Status withheld — fewer than ${k} bookings in this format`
        : `${b.requested} requested · ${b.confirmed} confirmed · ${b.cancelled} cancelled`,
    };
  });

  const weeklyData = trend.weeks.map((w) => ({
    label: w.label,
    signups: w.signups,
    assessments: w.assessments,
    bookings: w.bookings,
  }));

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
          {organization.branding.appName.toUpperCase()} · OVERVIEW
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">
          What your people are actually using
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed mt-1">
          Totals and shapes only — how many people signed up, took an assessment, or booked a session, and what
          those assessments look like in aggregate. You can never see which person did what.
        </p>
      </header>

      <section className="rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-normal text-[#233226]">Employee app — live</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B7D3BC] bg-[#EAF3EB] px-3 py-1 text-[11px] font-medium text-[#2F7F4C]">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            <span>{liveStats.live ? 'Live counts' : 'Not set up yet'}</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-[#78897B]">
          The three numbers you're allowed to see about your employees' accounts — totals only, never a name.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <LiveStat icon={UserPlus} label="Total sign-ups" value={liveStats.totalSignups} live={liveStats.live} />
          <LiveStat
            icon={ClipboardCheck}
            label="Assessments taken"
            value={liveStats.totalAssessments}
            live={liveStats.live}
          />
          <LiveStat
            icon={CalendarHeart}
            label="Therapy sessions booked"
            value={liveStats.totalBookings}
            live={liveStats.live}
          />
        </div>
        {!liveStats.live && (
          <p className="mt-4 text-[11px] text-[#9E6B38]">
            Run <code className="rounded bg-[#F3EEE5] px-1 py-0.5">supabase/schema-employee.sql</code> and{' '}
            <code className="rounded bg-[#F3EEE5] px-1 py-0.5">supabase/schema-employee-analytics.sql</code> in your
            Supabase project to turn this dashboard on.
          </p>
        )}
      </section>

      <ChartCard
        title="Assessments, by domain"
        caption="How many people have taken each assessment. The low/moderate/high split is withheld for a domain fewer than 5 people have tried — the number taken is always shown."
        table={{
          columns: ['Assessment', 'Taken', 'Low', 'Moderate', 'High'],
          rows: ASSESSMENT_TYPES.map((type) => {
            const d = assessments.byDomain[type];
            return d.levelMasked
              ? [ASSESSMENT_METADATA[type].title, d.total, 'Withheld', 'Withheld', 'Withheld']
              : [ASSESSMENT_METADATA[type].title, d.total, d.low, d.moderate, d.high];
          }),
        }}
      >
        <div className="flex flex-col gap-5">
          <NotLiveNote live={assessments.live} />
          {ASSESSMENT_TYPES.map((type) => (
            <DomainSeverityRow key={type} type={type} breakdown={assessments.byDomain[type]} k={k} />
          ))}
        </div>
      </ChartCard>

      <ChartCard
        title="Sessions booked, by format"
        caption="How people are choosing to get support. The requested/confirmed/cancelled split is withheld for a format fewer than 5 people have booked — the number booked is always shown."
        table={{
          columns: ['Format', 'Booked', 'Requested', 'Confirmed', 'Cancelled'],
          rows: BOOKING_FORMATS.map((format) => {
            const b = bookings.byFormat[format];
            return b.statusMasked
              ? [FORMAT_LABEL[format], b.total, 'Withheld', 'Withheld', 'Withheld']
              : [FORMAT_LABEL[format], b.total, b.requested, b.confirmed, b.cancelled];
          }),
        }}
      >
        <div className="flex flex-col gap-4">
          <NotLiveNote live={bookings.live} />
          <RankedBarChart data={bookingRows} />
        </div>
      </ChartCard>

      <ChartCard
        title="Last 8 weeks"
        caption="New sign-ups, assessments taken and sessions booked, week by week."
        table={{
          columns: ['Week', 'Sign-ups', 'Assessments', 'Bookings'],
          rows: trend.weeks.map((w) => [w.label, w.signups, w.assessments, w.bookings]),
        }}
      >
        <div className="flex flex-col gap-4">
          <NotLiveNote live={trend.live} />
          {trend.live && weeklyData.length > 0 && (
            <SmallMultiples
              data={weeklyData}
              panels={[
                { key: 'signups', title: 'Sign-ups' },
                { key: 'assessments', title: 'Assessments' },
                { key: 'bookings', title: 'Bookings' },
              ]}
            />
          )}
        </div>
      </ChartCard>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[11px] text-[#78897B]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        <span>
          Every number here is a headcount, never a name. Groups smaller than {k} are withheld everywhere on this
          page.
        </span>
      </footer>
    </div>
  );
}

/** Distinguishes "genuinely zero" from "this RPC hasn't been deployed yet" —
 * without it the two look identical and read as a broken dashboard. */
function NotLiveNote({ live }: { live: boolean }) {
  if (live) return null;
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-[#9E6B38]">
      <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
      <span>
        Not set up yet — run{' '}
        <code className="rounded bg-[#F3EEE5] px-1 py-0.5">supabase/schema-employee-analytics.sql</code> in your
        Supabase project to turn this on.
      </span>
    </p>
  );
}

function LiveStat({
  icon: Icon,
  label,
  value,
  live,
}: {
  icon: typeof UserPlus;
  label: string;
  value: number | undefined;
  live: boolean | undefined;
}) {
  return (
    <div className="rounded-[20px] bg-[#FAF7F2] border border-[#EAE4D9] p-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0EA] text-[#405445]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-2xl font-semibold text-[#233226] tabular-nums">
          {live === undefined ? '—' : formatCount(value ?? 0)}
        </p>
        <p className="text-xs text-[#78897B] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function DomainSeverityRow({ type, breakdown, k }: { type: AssessmentType; breakdown: DomainBreakdown; k: number }) {
  const meta = ASSESSMENT_METADATA[type];
  const segments: ShareSegment[] = [
    {
      key: 'low',
      label: 'Low',
      count: breakdown.low,
      share: breakdown.total ? breakdown.low / breakdown.total : 0,
      color: bandColor('Low'),
      labelOnFill: 'light',
    },
    {
      key: 'moderate',
      label: 'Moderate',
      count: breakdown.moderate,
      share: breakdown.total ? breakdown.moderate / breakdown.total : 0,
      color: bandColor('Moderate'),
      labelOnFill: 'dark',
    },
    {
      key: 'high',
      label: 'High',
      count: breakdown.high,
      share: breakdown.total ? breakdown.high / breakdown.total : 0,
      color: bandColor('High'),
      labelOnFill: 'light',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[#233226]">{meta.title}</span>
        <span className="text-[11px] text-[#78897B] tabular-nums">{formatCount(breakdown.total)} taken</span>
      </div>
      {breakdown.levelMasked ? (
        <div className="flex items-center gap-1.5 h-11 rounded-lg border border-dashed border-[#D9D2C5] px-3 text-[11px] text-[#78897B]">
          <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
          <span>Severity split withheld — fewer than {k} people have taken this.</span>
        </div>
      ) : breakdown.total === 0 ? (
        <p className="text-[11px] text-[#9AA79C] italic py-2">No responses yet.</p>
      ) : (
        <StackedShareBar segments={segments} total={breakdown.total} />
      )}
    </div>
  );
}
