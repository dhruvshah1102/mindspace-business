import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip as RTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndexTile } from '@/admin/widgets/IndexTile';
import { getOverallRollup, getWeeklyRollups } from '@/services/analytics-service';
import { generateInsights } from '@/domain/insights';
import { useTenant } from '@/app/TenantContext';

export function OverviewPage() {
  const { organization } = useTenant();
  const overall = getOverallRollup();
  const weekly = getWeeklyRollups();
  const insights = useMemo(() => generateInsights(overall, organization.policy.kAnonymity), [overall, organization]);

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ds-base">Executive Overview</h1>
        <p className="text-sm text-muted-foreground">{organization.name} · last 12 weeks</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organizational Wellbeing Index</CardTitle>
            <CardDescription>100 = best. Weighted composite across all six domains.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-semibold tabular-nums">{overall.indices.owi ?? '—'}</span>
              {owiDelta !== null && (
                <span className={owiDelta >= 0 ? 'text-[color:var(--viz-up)] text-sm' : 'text-[color:var(--viz-down)] text-sm'}>
                  {owiDelta >= 0 ? '+' : ''}
                  {owiDelta.toFixed(1)} vs 12wk ago
                </span>
              )}
            </div>
            <div className="mt-3 h-16 w-full">
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

        <IndexTile label="Burnout Composite" value={overall.indices.burnout} hint="Exhaustion + cynicism + efficacy loss" />
        <IndexTile label="Focus Capacity" value={overall.indices.focus} hint="Productivity proxy" />
        <IndexTile label="Absence Risk" value={overall.indices.absenceRisk} hint="Higher = lower risk" />
        <IndexTile
          label="Risk Density"
          value={overall.indices.riskDensity}
          suffix="%"
          hint="Participants with ≥1 High band"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participation</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold tabular-nums">{(overall.participationRate * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                {overall.participants} of {overall.headcount} employees
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Departments ranked by worst domain severity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {needsAttention.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-sm">
                <span>{c.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{c.mean.toFixed(0)}</span>
                  {c.delta !== null && (
                    <Badge variant={c.delta > 2 ? 'high' : c.delta > 0 ? 'moderate' : 'low'}>
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

      <Card>
        <CardHeader>
          <CardTitle>Insight Feed</CardTitle>
          <CardDescription>Ranked, plain-English findings with a recommended action for each.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {insights.length === 0 && <p className="text-sm text-muted-foreground">No findings above threshold this period.</p>}
          {insights.map((insight) => (
            <div key={insight.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ds-base">{insight.headline}</p>
                <Badge variant={insight.severity === 'critical' ? 'high' : insight.severity === 'warning' ? 'moderate' : 'default'}>
                  {insight.severity}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{insight.body}</p>
              <p className="mt-2 text-xs font-medium text-ds-deep">→ {insight.recommendedAction}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
