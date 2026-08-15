import { Sparkles, CheckCircle2, AlertTriangle, Users, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CompanyExecutiveReport } from '@/domain/report-generator';

interface Props {
  report: CompanyExecutiveReport;
  orgName: string;
}

export function ExecutiveSummaryCard({ report, orgName }: Props) {
  const { executiveSummary, responseBreakdown } = report;

  return (
    <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-ds-tint/30 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40 bg-ds-tint/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ds-deep text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-ds-base">
                  Executive Sentiment Report
                </CardTitle>
                <Badge variant="outline" className="border-ds-mid/40 bg-ds-tint/60 text-xs text-ds-base font-normal">
                  <ShieldCheck className="mr-1 h-3 w-3 text-ds-deep inline" />
                  100% Anonymous · Aggregated (n={responseBreakdown.participants})
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Plain-English executive synthesis of how employees at {orgName} are feeling right now
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                executiveSummary.status === 'healthy'
                  ? 'low'
                  : executiveSummary.status === 'moderate_strain'
                  ? 'moderate'
                  : 'high'
              }
              className="px-3 py-1 text-xs font-medium"
            >
              {executiveSummary.statusLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex flex-col gap-5">
        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card p-3.5 shadow-2xs">
            <p className="text-xs text-muted-foreground">Workforce Surveyed</p>
            <p className="mt-1 text-xl font-bold text-ds-base tabular-nums">
              {responseBreakdown.participants}{' '}
              <span className="text-xs font-normal text-muted-foreground">/ {responseBreakdown.headcount}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[color:var(--viz-up)] font-medium">
              {(responseBreakdown.participationRate * 100).toFixed(0)}% Participation
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-3.5 shadow-2xs">
            <p className="text-xs text-muted-foreground">Thriving / Resilient</p>
            <p className="mt-1 text-xl font-bold text-[color:var(--viz-low)] tabular-nums">
              {responseBreakdown.sentimentDistribution[0].employeeCount + responseBreakdown.sentimentDistribution[1].employeeCount}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">
              {responseBreakdown.sentimentDistribution[0].percentage + responseBreakdown.sentimentDistribution[1].percentage}% of total workforce
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-3.5 shadow-2xs">
            <p className="text-xs text-muted-foreground">Under Workload Strain</p>
            <p className="mt-1 text-xl font-bold text-[color:var(--viz-moderate)] tabular-nums">
              {responseBreakdown.sentimentDistribution[2].employeeCount}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">
              {responseBreakdown.sentimentDistribution[2].percentage}% need pacing relief
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-3.5 shadow-2xs">
            <p className="text-xs text-muted-foreground">Clinical Outreach Band</p>
            <p className="mt-1 text-xl font-bold text-[color:var(--viz-high)] tabular-nums">
              {responseBreakdown.sentimentDistribution[3].employeeCount}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">
              Confidential therapist access
            </p>
          </div>
        </div>

        {/* Narrative Paragraphs */}
        <div className="rounded-xl border border-border/60 bg-ds-tint/15 p-4 text-sm leading-relaxed text-ds-base flex flex-col gap-2.5">
          <h3 className="font-semibold text-ds-deep text-base">
            {executiveSummary.headline}
          </h3>
          {executiveSummary.paragraphs.map((p, idx) => (
            <p key={idx} className="text-sm text-ds-base/90" dangerouslySetInnerHTML={{
              __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ds-base">$1</strong>')
            }} />
          ))}
        </div>

        {/* Positives & Key Areas of Concern in side-by-side cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-900/10 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm mb-2.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>What's Working Well</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-ds-base">
              {executiveSummary.quickHighlights.positive.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-900/10 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm mb-2.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Primary Attention Areas</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-ds-base">
              {executiveSummary.quickHighlights.concerns.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
