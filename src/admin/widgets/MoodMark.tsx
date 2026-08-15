import { CircleAlert, CircleCheck, CircleDot, TriangleAlert } from 'lucide-react';
import type { Mood } from '@/domain/wellbeing-report';
import { MOOD_LABELS } from '@/domain/wellbeing-report';
import { moodColor } from '@/lib/tier';
import { cn } from '@/lib/utils';

const ICONS: Record<Mood, typeof CircleCheck> = {
  good: CircleCheck,
  okay: CircleDot,
  strained: TriangleAlert,
  struggling: CircleAlert,
};

/** Status is never colour alone: icon + word + colour, every time. */
export function MoodMark({ mood, label, className }: { mood: Mood; label?: string; className?: string }) {
  const Icon = ICONS[mood];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-ds-base',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" style={{ color: moodColor(mood) }} aria-hidden />
      {label ?? MOOD_LABELS[mood]}
    </span>
  );
}
