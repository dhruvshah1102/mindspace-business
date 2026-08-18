import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flower2, Smile, Layers, ShieldAlert, Users, RefreshCw, type LucideIcon } from 'lucide-react';
import { ASSESSMENT_METADATA, ASSESSMENT_TYPES, type AssessmentType } from '@/domain/assessments';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { listMyAssessments, type EmployeeAssessmentRecord } from '@/services/employee-assessment-service';

const TYPE_ICON: Record<AssessmentType, LucideIcon> = {
  anxiety: Flower2,
  depression: Smile,
  stress: Layers,
  ptsd: ShieldAlert,
  relationship: Users,
  ocd: RefreshCw,
};

export function AssessmentsPage() {
  const { user } = useEmployeeAuth();
  const [history, setHistory] = useState<EmployeeAssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listMyAssessments(user.id).then((records) => {
      if (!cancelled) {
        setHistory(records);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const latestByType = useMemo(() => {
    const map = new Map<AssessmentType, EmployeeAssessmentRecord>();
    for (const record of history) {
      if (!map.has(record.domain)) map.set(record.domain, record);
    }
    return map;
  }, [history]);

  const completedCount = latestByType.size;
  const totalCount = ASSESSMENT_TYPES.length;
  const overallProgress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-12 items-start">
      <div className="flex flex-col gap-6 md:sticky md:top-8">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#233226]">Check in with yourself</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#56685A]">
            Six short, private check-ins, about five minutes each. Answer for how things have felt over the last two
            weeks, not just today.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#EAE4D9] pt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-[0.1em] text-[#78897B]">Completed</span>
            <span className="font-semibold text-[#233226] tabular-nums">
              {completedCount} of {totalCount}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#EAE4D9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#4F6B57] transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#78897B] border-t border-[#EAE4D9] pt-5">
          There are no right answers, and none of this is a diagnosis. Your results stay private to you.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-h-[calc(100vh-26rem)] md:max-h-[calc(100vh-14rem)] overflow-y-auto pr-2 pb-2">
        {ASSESSMENT_TYPES.map((type) => {
          const meta = ASSESSMENT_METADATA[type];
          const latest = latestByType.get(type);
          const completed = !loading && !!latest;
          const progress = completed ? 100 : 0;
          const Icon = TYPE_ICON[type];

          return (
            <div key={type} className="rounded-[24px] bg-white p-6 shadow-[0_1px_3px_rgba(35,50,38,0.08),0_8px_24px_-12px_rgba(35,50,38,0.12)] flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F3EEE5] text-[#4F6B57]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#233226]">{meta.title}</h2>
                    <p className="mt-0.5 text-xs text-[#78897B]">{meta.questions.length} questions · 5-7 min</p>
                  </div>
                </div>

                <Link
                  to={`/app/assessments/${type}`}
                  className="shrink-0 inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer bg-[#4F6B57] hover:bg-[#3F5646] text-white"
                >
                  {completed ? 'Completed' : 'Start'}
                </Link>
              </div>

              <p className="text-sm text-[#56685A] leading-relaxed">{meta.description}</p>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#78897B]">
                  <span>Progress</span>
                  <span className="font-semibold text-[#233226] tabular-nums">{progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EAE4D9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4F6B57] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
