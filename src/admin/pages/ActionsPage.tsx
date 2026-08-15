import type { ReactNode } from 'react';
import { useReport } from '@/admin/ReportContext';
import { ReportSkeleton } from '@/admin/widgets/PageHeading';
import { EFFORT_LABEL } from '@/lib/tier';

export function ActionsPage() {
  const { report, loading } = useReport();
  if (loading || !report) return <ReportSkeleton />;

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#78897B]">
          ACTION ITEMS · {report.meta.orgName.toUpperCase()}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#233226] mt-1">
          Two kinds of fix, and you need both
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed mt-1">
          Changing how work happens stops the pressure being created. Running sessions helps the people already carrying it. Doing only the second is how wellbeing programmes get a reputation for being decoration.
        </p>
      </header>

      {/* Part One: Policy & Culture Changes */}
      <section className="flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">PART ONE</p>
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226] mt-0.5">
            Change how the work happens
          </h2>
          <p className="max-w-2xl text-xs text-[#78897B] mt-1">
            These address the operational causes named in the report. Nothing here requires extra budget.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {report.cultureChanges.map((c, i) => (
            <article
              key={c.title}
              className="rounded-[28px] bg-white border border-[#EAE4D9] shadow-xs overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EAE4D9] bg-[#FAF7F2] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#405445] text-xs font-bold text-white mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#233226]">{c.title}</h3>
                    <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#56685A] leading-relaxed">{c.why}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-[#D9D2C5] bg-white px-3 py-1 text-[11px] font-medium text-[#3E4F42]">
                  {EFFORT_LABEL[c.effort]}
                </span>
              </div>

              {/* Card Body */}
              <div className="grid gap-6 p-6 sm:p-7 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">HOW TO IMPLEMENT</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-xs sm:text-sm leading-relaxed text-[#3E4F42]">
                    {c.how.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#405445]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">EXPECTED OUTCOME</p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#3E4F42]">{c.expected}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Part Two: Therapist Sessions & Company Rituals */}
      <section className="flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">PART TWO</p>
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[#233226] mt-0.5">
            Support the people carrying the weight
          </h2>
          <p className="max-w-2xl text-xs text-[#78897B] mt-1">
            MindSpace therapist-led workshops, group decompression circles, and complimentary wellness rituals matched to this month's findings.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {report.activities.map((s) => (
            <article
              key={s.title}
              className="rounded-[28px] bg-white border border-[#EAE4D9] shadow-xs p-7 sm:p-8 flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#FAF7F2] border border-[#D9D2C5] px-3 py-1 text-[11px] font-semibold text-[#405445]">
                    {s.format}
                  </span>
                  <span className="text-xs text-[#78897B]">{s.cadence}</span>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-normal text-[#233226]">{s.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#56685A] leading-relaxed">{s.description}</p>
                </div>

                <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-[#EAE4D9]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#78897B]">INTENDED OUTCOME</p>
                  <p className="mt-1 text-xs text-[#3E4F42] leading-relaxed">{s.outcome}</p>
                </div>
              </div>

              <div className="border-t border-[#EAE4D9] pt-4 flex items-center justify-between text-xs">
                <span className="text-[#78897B]">
                  {s.therapistLed ? 'Therapist-led · Complimentary' : 'Team ritual · Zero budget'}
                </span>
                <span className="font-semibold text-[#405445]">Ready to schedule</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
