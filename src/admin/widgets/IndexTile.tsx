import { Card, CardContent } from '@/components/ui/card';
import { DeltaBadge } from './DeltaBadge';
import { cn } from '@/lib/utils';

interface IndexTileProps {
  label: string;
  value: number | null;
  delta?: number | null;
  suffix?: string;
  hint?: string;
}

export function IndexTile({ label, value, delta, suffix = '', hint }: IndexTileProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={cn('text-3xl font-semibold tabular-nums', value === null && 'text-muted-foreground')}>
            {value === null ? '—' : `${value}${suffix}`}
          </span>
          {delta !== undefined && delta !== null && <DeltaBadge delta={delta} />}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
