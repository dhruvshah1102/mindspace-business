import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaskedCell } from '@/admin/widgets/MaskedCell';
import { getOverallRollup } from '@/services/analytics-service';
import { useTenant } from '@/app/TenantContext';
import { ASSESSMENT_TYPES, ASSESSMENT_METADATA, type AssessmentType } from '@/domain/assessments';
import { severityColor } from '@/lib/viz-palette';
import { cn } from '@/lib/utils';

const DIMENSIONS = [
  { key: 'department', label: 'Department' },
  { key: 'location', label: 'Location' },
  { key: 'tenureBand', label: 'Tenure' },
  { key: 'level', label: 'Level' },
] as const;

export function CohortHeatmapPage() {
  const { organization } = useTenant();
  const rollup = getOverallRollup();
  const [dimension, setDimension] = useState<(typeof DIMENSIONS)[number]['key']>('department');
  const [sortDomain, setSortDomain] = useState<AssessmentType>('work_mood');

  const rows = useMemo(() => {
    const prefix = `${dimension}:`;
    const entries = Object.entries(rollup.byCohort).filter(([key]) => key.startsWith(prefix));
    return entries
      .map(([key, cell]) => ({ label: key.slice(prefix.length), cell }))
      .sort((a, b) => {
        const aVal = a.cell[sortDomain]?.masked ? -1 : (a.cell[sortDomain]?.mean ?? -1);
        const bVal = b.cell[sortDomain]?.masked ? -1 : (b.cell[sortDomain]?.mean ?? -1);
        return bVal - aVal;
      });
  }, [rollup, dimension, sortDomain]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ds-base">Cohort Heatmap</h1>
        <p className="text-sm text-muted-foreground">
          Severity by cohort × domain. Cells below n={organization.policy.kAnonymity} are masked, never approximated.
        </p>
      </div>

      <Tabs value={dimension} onValueChange={(v) => setDimension(v as typeof dimension)}>
        <TabsList>
          {DIMENSIONS.map((d) => (
            <TabsTrigger key={d.key} value={d.key}>
              {d.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Severity matrix</CardTitle>
          <CardDescription>Sorted by {ASSESSMENT_METADATA[sortDomain].title}. Click a column header to re-sort.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                    {DIMENSIONS.find((d) => d.key === dimension)?.label}
                  </th>
                  {ASSESSMENT_TYPES.map((domain) => (
                    <th
                      key={domain}
                      className="cursor-pointer p-2 text-center text-xs font-medium text-muted-foreground hover:text-ds-base"
                      onClick={() => setSortDomain(domain)}
                    >
                      {ASSESSMENT_METADATA[domain].title.replace(' Assessment', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td className="whitespace-nowrap p-2 text-sm font-medium">{row.label}</td>
                    {ASSESSMENT_TYPES.map((domain) => {
                      const stats = row.cell[domain];
                      if (!stats) return <td key={domain} className="p-2" />;
                      if (stats.masked) {
                        return (
                          <td key={domain} className="min-w-[7rem] rounded-lg bg-ds-tint/40 p-2 text-center">
                            <MaskedCell k={organization.policy.kAnonymity} />
                          </td>
                        );
                      }
                      return (
                        <td
                          key={domain}
                          className={cn('min-w-[7rem] rounded-lg p-2 text-center text-white')}
                          style={{ backgroundColor: severityColor(stats.mean) }}
                        >
                          <div className="text-sm font-semibold">{stats.mean.toFixed(0)}</div>
                          <div className="text-[10px] opacity-90">
                            n={stats.n}
                            {stats.delta !== null && (stats.delta >= 0 ? ` +${stats.delta.toFixed(1)}` : ` ${stats.delta.toFixed(1)}`)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
