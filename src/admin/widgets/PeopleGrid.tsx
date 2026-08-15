import { useId } from 'react';
import type { MoodTier } from '@/domain/snapshot';

interface Segment {
  tier: MoodTier;
  label: string;
  peopleCount: number;
  share: number;
}

const DOT_COLORS: Record<MoodTier, string> = {
  thriving: '#1B3B2B',   // Dark Forest Green (Doing well)
  steady: '#8EBFA0',     // Sage Green (Holding steady)
  strained: '#D97724',   // Amber/Orange (Running on empty)
  struggling: '#6E2819', // Deep Rust/Brown (Needs real support)
};

/**
 * 100 circular dots arranged in a clean 10x10 matrix.
 * Accurately represents the workforce proportion at a single glance.
 */
export function PeopleGrid({ segments }: { segments: Segment[] }) {
  const id = useId();

  // Largest-remainder allocation so the figures always total exactly 100.
  const raw = segments.map((s) => s.share * 100);
  const floors = raw.map(Math.floor);
  let remaining = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const counts = [...floors];
  for (const { i } of order) {
    if (remaining <= 0) break;
    counts[i] += 1;
    remaining -= 1;
  }

  const figures = segments.flatMap((s, i) => Array.from({ length: counts[i] }, () => s));

  return (
    <figure className="flex flex-col gap-8 py-2">
      {/* 10x10 Grid */}
      <div
        className="grid grid-cols-10 gap-y-3.5 gap-x-5 sm:gap-x-8 max-w-xl mx-auto w-full justify-items-center"
        role="img"
        aria-label={ariaSummary(segments)}
      >
        {figures.map((s, i) => (
          <div
            key={`${id}-${i}`}
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full transition-transform hover:scale-125"
            style={{ backgroundColor: DOT_COLORS[s.tier] }}
            title={`${s.label} (${Math.round(s.share * 100)}%)`}
          />
        ))}
      </div>

      {/* Legend below */}
      <figcaption className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-slate-100 pt-6 text-xs text-slate-600">
        {segments.map((s) => (
          <span key={s.tier} className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: DOT_COLORS[s.tier] }}
              aria-hidden
            />
            <span className="font-semibold text-slate-800">{s.label}</span>
            <span className="tabular-nums text-slate-500 font-normal">
              {s.peopleCount} {s.peopleCount === 1 ? 'person' : 'people'}
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function ariaSummary(segments: Segment[]): string {
  return `How people feel: ${segments
    .map((s) => `${s.label}, ${s.peopleCount} people, ${Math.round(s.share * 100)} percent`)
    .join('; ')}.`;
}
