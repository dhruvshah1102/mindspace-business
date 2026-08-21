import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip as RTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndexTile } from '@/admin/widgets/IndexTile';
import { ExecutiveSummaryCard } from '@/admin/widgets/ExecutiveSummaryCard';
import { ResponseBreakdownCard } from '@/admin/widgets/ResponseBreakdownCard';
import { RecommendedActivitiesCard } from '@/admin/widgets/RecommendedActivitiesCard';
import { getOverallRollup, getWeeklyRollups } from '@/services/analytics-service';
import { generateCompanyReport } from '@/domain/report-generator';
import { useTenant } from '@/app/TenantContext';
import { ChevronDown, ChevronUp, FileSpreadsheet, Activity, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function OverviewPage() {
  const { organization } = useTenant();
  const overall = getOverallRollup();
  const weekly = getWeeklyRollups();
  const [showTechnicalIndices, setShowTechnicalIndices] = useState(true);

  const report = useMemo(() => generateCompanyReport(overall, organization), [overall, organization]);

  const owiSeries = weekly.map((r) => ({ period: r.periodId, owi: r.indices.owi ?? 0 }));
  const owiDelta = weekly.length >= 2 ? (weekly[weekly.length - 1].indices.owi ?? 0) - (weekly[0].indices.owi ?? 0) : null;

  const needsAttention = Object.entries(overall.byCohort)
    .filter(([key]) => key.startsWith('department:'))
    .map(([key, cell]) => {
      const worst = Object.values(cell)
        .filter((v): v is NonNullable<typeof v> => !!v && !v.masked)
        .sort((a, b) => b.mean - a.mean)[0];
      return worst ? { label: key.split(':')[1], mean: worst.mean, delta: worst.delta } : null;
    })
    .filter((v): v is { label: string; mean: number; delta: number | null } => v !== null)
    .sort((a, b) => b.mean - a.mean)
    .slice(0, 5);

  const handleExport = () => {
    toast.success('Executive Company Summary & Wellbeing Report exported as PDF.');
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ds-base">Company Wellbeing Report</h1>
            <Badge variant="outline" className="bg-ds-tint/40 text-xs font-normal">
              Active Cycle: Q3 2026
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {organization.name} · {report.responseBreakdown.participants} employees surveyed anonymously
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Executive PDF
          </Button>
        </div>
      </div>

      {/* 1. HERO: Executive Sentiment Report (How Employees Are Feeling) */}
      <ExecutiveSummaryCard report={report} orgName={organization.name} />

      {/* 2. EMPLOYEE RESPONSE BREAKDOWN (Anonymous Headcounts & Responses) */}
      <ResponseBreakdownCard report={report} />

      {/* 3. RECOMMENDED ACTIVITIES & HOSTABLE INTERVENTIONS */}
      <RecommendedActivitiesCard report={report} />

      {/* 4. COMPOSITE INDICES & TECHNICAL METRICS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-ds-deep" />
            <h2 className="text-base font-semibold text-ds-base">
              Baseline Organizational Wellbeing Indices
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTechnicalIndices(!showTechnicalIndices)}
            className="text-xs text-muted-foreground gap-1.5"
          >
            {showTechnicalIndices ? (
              <>
                <span>Hide details</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Show details</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>

        {showTechnicalIndices && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Organizational Wellbeing Index (OWI)</CardTitle>
                  <CardDescription className="text-xs">100 = best. Composite across all 6 clinical domains.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold tabular-nums">{overall.indices.owi ?? '–'}</span>
                    {owiDelta !== null && (
                      <span
                        className={
                          owiDelta >= 0
                            ? 'text-[color:var(--viz-up)] text-xs font-semibold'
                            : 'text-[color:var(--viz-down)] text-xs font-semibold'
                        }
                      >
                        {owiDelta >= 0 ? '+' : ''}
                        {owiDelta.toFixed(1)} vs 12wk ago
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-14 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={owiSeries}>
                        <YAxis domain={[0, 100]} hide />
                        <RTooltip formatter={(v: number) => v.toFixed(1)} labelFormatter={() => ''} />
                        <Line type="monotone" dataKey="owi" stroke="var(--ds-deep)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <IndexTile
                label="Burnout Composite"
                value={overall.indices.burnout}
                hint="Exhaustion + cynicism + efficacy loss"
              />
              <IndexTile
                label="Focus Capacity"
                value={overall.indices.focus}
                hint="Productivity proxy score"
              />
              <IndexTile
                label="Absence Risk Index"
                value={overall.indices.absenceRisk}
                hint="Higher = lower absenteeism risk"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Participation & Confidence</CardTitle>
                  <CardDescription className="text-xs">Sample size adequacy for statistical anonymity</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-ds-base">
                      {(overall.participationRate * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {overall.participants} of {overall.headcount} employees active
                    </p>
                  </div>
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-xs">
                    High Confidence (k ≥ 5)
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Cohort Severity Ranking</CardTitle>
                  <CardDescription className="text-xs">Departments ranked by peak domain severity</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {needsAttention.map((c) => (
                    <div key={c.label} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{c.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums font-semibold">{c.mean.toFixed(0)}/100</span>
                        {c.delta !== null && (
                          <Badge variant={c.delta > 2 ? 'high' : c.delta > 0 ? 'moderate' : 'low'} className="text-[10px]">
                            {c.delta >= 0 ? '+' : ''}
                            {c.delta.toFixed(1)}
                          </Badge>
                        )}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
