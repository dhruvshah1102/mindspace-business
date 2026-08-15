import { Lightbulb } from 'lucide-react';
import { useReport } from '@/admin/ReportContext';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { MagnitudeBar } from '@/admin/widgets/ProportionBar';
import { SEVERITY_COLOR, SEVERITY_LABEL } from '@/lib/tier';
import { asFraction } from '@/domain/wellbeing-report';

export function PressuresPage() {
  const { report, loading } = useReport();
  if (loading || !report) return <ReportSkeleton />;

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
          WHAT'S WEIGHING · {report.meta.orgName.toUpperCase()}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">
          The reasons behind the mood
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed mt-1">
          Ranked by how many people raised each pressure. Each includes the likely underlying cause, because you cannot fix a feeling — you can only fix the thing producing it.
        </p>
      </header>

      {/* Ranked Pressure Cards */}
      <div className="flex flex-col gap-6">
        {report.whatsWeighing.map((p, i) => {
          const pct = Math.round(p.share * 100);
          return (
            <article
              key={p.title}
              className="rounded-[28px] bg-white p-7 sm:p-9 border border-[#EAE4D9] shadow-xs grid gap-8 lg:grid-cols-[1.6fr_1fr]"
            >
              {/* Left Content */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3EEE5] text-xs font-bold text-[#405445]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#233226]">{p.title}</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2C5] bg-[#FAF7F2] px-2.5 py-0.5 text-[11px] font-medium text-[#3E4F42]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLOR[p.severity] }}
                      aria-hidden
                    />
                    {SEVERITY_LABEL[p.severity]}
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-[#56685A] max-w-2xl">{p.plainLanguage}</p>

                {/* Likely Cause Box */}
                <div className="rounded-2xl bg-[#FAF7F2] p-5 border border-[#EAE4D9] mt-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#78897B]">
                    <Lightbulb className="h-3 w-3 text-[#9E6B38]" aria-hidden />
                    LIKELY UNDERLYING CAUSE
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#233226] leading-relaxed">{p.rootCause}</p>
                </div>
              </div>

              {/* Right Meta Column */}
              <div className="flex flex-col justify-between rounded-2xl bg-[#FAF7F2] p-6 border border-[#EAE4D9]">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">AFFECTED WORKFORCE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-bold text-[#233226]">{pct}%</span>
                    <span className="text-xs text-[#657669]">
                      (~{p.affected} people · {asFraction(p.share)})
                    </span>
                  </div>
                  <div className="mt-1">
                    <MagnitudeBar share={p.share} color={SEVERITY_COLOR[p.severity]} label={`${pct}% of people`} />
                  </div>
                </div>

                {p.whoMostly.length > 0 && (
                  <div className="mt-6 border-t border-[#EAE4D9] pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">MOST REPORTED IN</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.whoMostly.map((team) => (
                        <span
                          key={team}
                          className="rounded-full bg-white border border-[#D9D2C5] px-2.5 py-1 text-[11px] font-medium text-[#3E4F42]"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
