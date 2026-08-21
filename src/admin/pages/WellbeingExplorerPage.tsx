import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOverallRollup } from '@/services/analytics-service';
import { ASSESSMENT_TYPES, ASSESSMENT_METADATA, type AssessmentType } from '@/domain/assessments';
import { itemKey } from '@/domain/indices';
import { cn } from '@/lib/utils';

export function WellbeingExplorerPage() {
  const rollup = getOverallRollup();
  const [selected, setSelected] = useState<AssessmentType>('work_mood');

  const meta = ASSESSMENT_METADATA[selected];
  const domainStats = rollup.byDomain[selected];

  const itemRows = useMemo(() => {
    return meta.questions
      .map((q) => {
        const key = itemKey(selected, q.id);
        const stats = rollup.byItem[key];
        return stats ? { question: q.text, qid: q.id, ...stats } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  }, [meta, selected, rollup]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ds-base">Wellbeing Explorer</h1>
        <p className="text-sm text-muted-foreground">Item-level detail: the individual questions behind every domain score.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {ASSESSMENT_TYPES.map((domain) => {
          const stats = rollup.byDomain[domain];
          return (
            <Card
              key={domain}
              onClick={() => setSelected(domain)}
              className={cn(
                'cursor-pointer transition-shadow hover:shadow-lg',
                selected === domain && 'ring-2 ring-ds-deep',
              )}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{ASSESSMENT_METADATA[domain].title.replace(' Assessment', '')}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{stats?.mean ?? '–'}</p>
                {stats && (
                  <div className="mt-1 flex gap-1 text-[10px] text-muted-foreground">
                    <span>n={stats.n}</span>
                    {stats.delta !== null && <span>{stats.delta >= 0 ? '+' : ''}{stats.delta.toFixed(1)}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}: item-level table</CardTitle>
          <CardDescription>
            Domain mean {domainStats?.mean ?? '–'} · median {domainStats?.median ?? '–'} · p90 {domainStats?.p90 ?? '–'} · n={domainStats?.n ?? 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead className="text-right">Mean score</TableHead>
                <TableHead className="text-right">Δ</TableHead>
                <TableHead className="text-right">n</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemRows.map((row) => {
                const isMover = row.delta !== null && Math.abs(row.delta) >= 0.4;
                return (
                  <TableRow key={row.qid}>
                    <TableCell className="max-w-md">
                      <div className="flex items-center gap-2">
                        {row.question}
                        {isMover && <Badge variant={row.delta! > 0 ? 'high' : 'low'}>mover</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.mean.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.delta === null ? '–' : `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.n}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

