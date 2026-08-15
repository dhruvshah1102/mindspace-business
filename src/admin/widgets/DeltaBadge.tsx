import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeltaBadgeProps {
  delta: number;
  /** Most rollup indices are "higher is better" already, so a positive delta
   * reads as improving by default. Pass false for raw severity numbers where
   * a rising value means things are getting worse. */
  higherIsBetter?: boolean;
  suffix?: string;
}

export function DeltaBadge({ delta, higherIsBetter = true, suffix = '' }: DeltaBadgeProps) {
  const flat = Math.abs(delta) < 0.05;
  const improving = flat ? null : higherIsBetter ? delta > 0 : delta < 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
        flat && 'text-muted-foreground',
        improving === true && 'text-[color:var(--viz-up)]',
        improving === false && 'text-[color:var(--viz-down)]',
      )}
    >
      {flat ? <Minus className="h-3 w-3" /> : delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}
      {suffix}
    </span>
  );
}
