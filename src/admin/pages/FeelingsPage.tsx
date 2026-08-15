import { ShieldCheck } from 'lucide-react';
import { useReport } from '@/admin/ReportContext';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { PeopleGrid } from '@/admin/widgets/PeopleGrid';
import { ProportionBar } from '@/admin/widgets/ProportionBar';
import { asFraction } from '@/domain/wellbeing-report';

const DOT_COLORS: Record<string, string> = {
  thriving: '#405445',
  steady: '#7D9A83',
  strained: '#D97724',
  struggling: '#7C3426',
};

export function FeelingsPage() {
  const { report, snapshot, loading } = useReport();
  if (loading || !report || !snapshot) return <ReportSkeleton />;

  const strainedGroups = report.howPeopleFeel.filter((t) => t.tier === 'strained' || t.tier === 'struggling');
  const underStrain = strainedGroups.reduce((n, t) => n + t.peopleCount, 0);

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
          HOW PEOPLE FEEL · {report.meta.orgName.toUpperCase()}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">
          Four groups, not one average
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed mt-1">
          An average hides the people who are struggling behind the people who are fine. This page splits your workforce into the four states that actually need different responses from you.
        </p>
      </header>

      {/* 100-Figure Distribution Card */}
      <section className="rounded-[28px] bg-white p-7 sm:p-10 border border-[#EAE4D9] shadow-xs flex flex-col gap-8">
        <PeopleGrid segments={report.howPeopleFeel} />

        <div className="border-t border-[#EAE4D9] pt-6 flex flex-col gap-3">
          <ProportionBar segments={report.howPeopleFeel} />
          <p className="text-xs sm:text-sm leading-relaxed text-[#56685A]">
            <strong className="font-semibold text-[#233226]">{asFraction(underStrain / Math.max(1, report.meta.responses))}</strong> are stretched or worse — that's{' '}
            <strong className="font-semibold text-[#233226]">{underStrain}</strong> of the {report.meta.responses} people who answered.
          </p>
        </div>
      </section>

      {/* 4 Mood Tier Detail Cards */}
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
                  style={{ backgroundColor: DOT_COLORS[t.tier] ?? '#405445' }}
                />
                <h2 className="font-serif text-xl font-normal text-[#233226]">{t.label}</h2>
              </div>
              <span className="font-serif text-2xl font-bold text-[#233226]">{Math.round(t.share * 100)}%</span>
            </div>

            <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">{t.description}</p>

            <div className="mt-auto border-t border-[#EAE4D9] pt-3 text-[11px] font-medium text-[#78897B]">
              ~{t.peopleCount} {t.peopleCount === 1 ? 'person' : 'people'} of {report.meta.responses}
            </div>
          </article>
        ))}
      </section>

      {/* Team Breakdown with Anonymity Guarantee */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">
            By team
          </h2>
          <p className="mt-1 text-xs text-[#78897B]">
            Only teams with at least 5 respondents are shown. Others are masked for confidentiality.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.teams.map((tb) => (
            <div
              key={tb.team}
              className="rounded-[24px] bg-white p-6 border border-[#EAE4D9] shadow-xs flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-serif text-lg font-normal text-[#233226]">{tb.team}</span>
                {tb.masked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#D9D2C5] px-2 py-0.5 text-[10px] text-[#78897B]">
                    <ShieldCheck className="h-3 w-3" />
                    <span>&lt;5 responses</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-[#FAF7F2] border border-[#D9D2C5] px-2 py-0.5 text-[10px] text-[#56685A]">
                    {tb.responses} people
                  </span>
                )}
              </div>

              {tb.masked ? (
                <p className="text-xs text-[#78897B] leading-relaxed my-auto">
                  Responses are grouped into the whole-company total to preserve team anonymity.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#56685A]">Overall state</span>
                    <span className="font-semibold text-[#233226]">
                      {tb.strainShare > 0.4 ? 'Under strain' : tb.strainShare > 0.2 ? 'Holding steady' : 'Looking well'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#EAE4D9] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#405445]"
                      style={{ width: `${Math.round((1 - tb.strainShare) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Toughest Individual Items */}
      {snapshot.toughestSignals && snapshot.toughestSignals.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226]">
              Hardest individual signals
            </h2>
            <p className="mt-1 text-xs text-[#78897B]">
              Questions where the highest percentage of people answered “often” or “almost everyday”.
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4">
            {snapshot.toughestSignals.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-3 border-b border-[#EAE4D9] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3EEE5] text-xs font-semibold text-[#405445]">
                    {i + 1}
                  </span>
                  <span className="text-xs sm:text-sm text-[#233226] font-medium">{item.question}</span>
                </div>
                <span className="font-semibold text-xs sm:text-sm text-[#9E6B38] shrink-0">
                  {Math.round(item.share * 100)}% struggling
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
