import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getOverallRollup } from '@/services/analytics-service';
import { THEME_LABELS, type Theme } from '@/domain/themes';
import { ASSESSMENT_METADATA } from '@/domain/assessments';

export function DriverAnalysisPage() {
  const rollup = getOverallRollup();

  const departmentSlices = useMemo(
    () => Object.keys(rollup.byCohortTheme).filter((k) => k.startsWith('department:')).map((k) => k.slice('department:'.length)),
    [rollup],
  );
  const [department, setDepartment] = useState(departmentSlices[0] ?? '');
  const sliceKey = `department:${department}`;

  const themeRows = useMemo(() => {
    const cell = rollup.byCohortTheme[sliceKey] ?? {};
    return (Object.entries(cell) as [Theme, { count: number; share: number; severityMean: number }][])
      .sort((a, b) => b[1].share - a[1].share)
      .slice(0, 8);
  }, [rollup, sliceKey]);

  const drivers = useMemo(
    () => rollup.drivers.filter((d) => d.cohortKey === sliceKey).sort((a, b) => b.strength - a.strength),
    [rollup, sliceKey],
  );

  const orgTopThemes = useMemo(
    () => Object.entries(rollup.byTheme).sort((a, b) => b[1].share - a[1].share).slice(0, 3).map(([t]) => t),
    [rollup],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ds-base">Driver Analysis</h1>
          <p className="text-sm text-muted-foreground">What's actually driving severity in this cohort — not just the score.</p>
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentSlices.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme prevalence — {department}</CardTitle>
          <CardDescription>Share of TARA sessions mentioning each theme, vs the org-wide top themes ({orgTopThemes.map((t) => THEME_LABELS[t as Theme]).join(', ')}).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {themeRows.length === 0 && <p className="text-sm text-muted-foreground">Not enough TARA sessions in this cohort yet.</p>}
          {themeRows.map(([theme, stats]) => (
            <div key={theme} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm">{THEME_LABELS[theme]}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-ds-tint">
                <div
                  className="h-full rounded-full bg-ds-deep"
                  style={{ width: `${Math.min(100, stats.share * 100 * 2.5)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {(stats.share * 100).toFixed(0)}%
              </span>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">n={stats.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranked drivers — {department}</CardTitle>
          <CardDescription>Theme correlation against domain severity (r², within-cohort). Higher = more of that domain's variance explained by this theme.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {drivers.length === 0 && (
            <p className="text-sm text-muted-foreground">Not enough same-period samples to rank drivers for this cohort yet.</p>
          )}
          {drivers.map((d, i) => (
            <div key={`${d.domain}-${d.driver}-${i}`} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{ASSESSMENT_METADATA[d.domain].title.replace(' Assessment', '')}</span>
              <span className="w-40 shrink-0 text-sm">{THEME_LABELS[d.driver as Theme] ?? d.driver}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ds-tint">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, d.strength * 100 * 2)}%`,
                    backgroundColor: d.direction === 'positive' ? 'var(--viz-down)' : 'var(--viz-up)',
                  }}
                />
              </div>
              <Badge variant="outline">r²={d.strength.toFixed(2)}</Badge>
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">n={d.n}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
