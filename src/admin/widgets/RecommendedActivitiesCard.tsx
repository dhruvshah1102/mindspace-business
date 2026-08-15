import { useState } from 'react';
import { Sparkles, CalendarPlus, HeartHandshake, CheckCircle, Clock, ShieldCheck, ArrowUpRight, BookOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CompanyExecutiveReport } from '@/domain/report-generator';

interface Props {
  report: CompanyExecutiveReport;
}

export function RecommendedActivitiesCard({ report }: Props) {
  const { recommendedActions } = report;
  const [filter, setFilter] = useState<'all' | 'workshops' | 'therapist' | 'policy' | 'ritual'>('all');
  const [scheduledActions, setScheduledActions] = useState<Record<string, boolean>>({});

  const filteredActions = recommendedActions.filter((act) => {
    if (filter === 'all') return true;
    if (filter === 'workshops') return act.type === 'company_workshop';
    if (filter === 'therapist') return act.type === 'therapist_session';
    if (filter === 'policy') return act.type === 'policy_change';
    if (filter === 'ritual') return act.type === 'culture_ritual';
    return true;
  });

  const handleAction = (id: string, title: string, type: string) => {
    setScheduledActions((prev) => ({ ...prev, [id]: true }));
    if (type === 'therapist_session') {
      toast.success(`Therapist session request initiated: "${title}". MindSpace Clinical Desk will coordinate slots.`);
    } else if (type === 'company_workshop') {
      toast.success(`Workshop scheduled: "${title}". Calendar invites prepared for target teams.`);
    } else if (type === 'policy_change') {
      toast.success(`Policy guidance drafted: "${title}". Ready for management sign-off.`);
    } else {
      toast.success(`Culture ritual activated: "${title}".`);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ds-deep text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">Recommended Interventions & Hostable Activities</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Targeted workshops, therapist programs, and policy changes to resolve employee-reported friction
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-ds-tint/40 p-1 border border-border/40">
            {(
              [
                { key: 'all', label: 'All Actions' },
                { key: 'workshops', label: 'Workshops' },
                { key: 'therapist', label: 'Therapist Programs' },
                { key: 'policy', label: 'Policy Changes' },
                { key: 'ritual', label: 'Culture Rituals' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-card text-ds-base shadow-xs'
                    : 'text-muted-foreground hover:text-ds-base'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredActions.map((act) => {
            const isScheduled = scheduledActions[act.id];

            return (
              <div
                key={act.id}
                className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-ds-deep/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-ds-mid/40 bg-ds-tint/40 text-[11px]">
                        {act.typeLabel}
                      </Badge>
                      {act.therapistLed && (
                        <Badge variant="default" className="bg-ds-deep/15 text-ds-deep hover:bg-ds-deep/20 text-[10px] flex items-center gap-1">
                          <HeartHandshake className="h-3 w-3" />
                          Therapist-Led
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {act.durationOrCadence}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-ds-base mt-1">{act.title}</h4>
                    <p className="text-xs text-ds-deep font-medium mt-0.5">Target: {act.targetDepartment}</p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{act.description}</p>

                  <div className="rounded-lg bg-ds-tint/25 p-2.5 mt-2 border border-border/40">
                    <p className="text-[11px] font-medium text-ds-base flex items-center gap-1.5">
                      <ArrowUpRight className="h-3.5 w-3.5 text-[color:var(--viz-up)] shrink-0" />
                      <span><strong>Expected Impact:</strong> {act.expectedOutcome}</span>
                    </p>
                    {act.costInfo && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Pricing: {act.costInfo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">{act.objective}</span>
                  {isScheduled ? (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-600 border-emerald-600/30" disabled>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Scheduled
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAction(act.id, act.title, act.type)}
                      className="gap-1.5 text-xs bg-ds-deep hover:bg-ds-deep-hover text-white"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      {act.type === 'therapist_session'
                        ? 'Book Therapist Session'
                        : act.type === 'company_workshop'
                        ? 'Host Workshop'
                        : act.type === 'policy_change'
                        ? 'Implement Policy'
                        : 'Activate Ritual'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
