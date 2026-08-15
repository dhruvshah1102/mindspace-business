import { useId } from 'react';
import type { MoodTier } from '@/domain/snapshot';

interface Segment {
  tier: MoodTier;
  label: string;
  peopleCount: number;
  share: number;
}

const DOT_COLORS: Record<MoodTier, string> = {
  thriving: '#405445',   // Eucalyptus Green (Doing well)
  steady: '#7D9A83',     // Sage Green (Holding steady)
  strained: '#D97724',   // Amber/Orange (Running on empty)
  struggling: '#7C3426', // Deep Rust (Needs real support)
};

/**
 * 100 circular dots arranged in a clean 10x10 matrix.
 * Accurately represents the workforce proportion at a single glance.
 * Fully responsive for mobile, tablet, and wide desktop screens.
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
    <figure className="flex flex-col gap-6 sm:gap-8 py-2 w-full">
      {/* 10x10 Matrix */}
      <div
        className="grid grid-cols-10 gap-y-2.5 sm:gap-y-3.5 gap-x-2.5 sm:gap-x-6 md:gap-x-8 max-w-xl mx-auto w-full justify-items-center"
        role="img"
        aria-label={ariaSummary(segments)}
      >
        {figures.map((s, i) => (
          <div
            key={`${id}-${i}`}
            className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 rounded-full transition-transform hover:scale-125"
            style={{ backgroundColor: DOT_COLORS[s.tier] }}
            title={`${s.label} (${Math.round(s.share * 100)}%)`}
          />
        ))}
      </div>

      {/* Legend below */}
      <figcaption className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2.5 border-t border-[#EAE4D9] pt-5 text-xs text-[#56685A]">
        {segments.map((s) => (
          <div key={s.tier} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
              style={{ backgroundColor: DOT_COLORS[s.tier] }}
              aria-hidden
            />
            <span className="text-[#233226] font-medium">{s.label}</span>
            <span className="text-[#78897B]">({Math.round(s.share * 100)}%)</span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

function ariaSummary(segments: Segment[]): string {
  const parts = segments.map((s) => `${Math.round(s.share * 100)}% ${s.label.toLowerCase()}`);
  return `Distribution of 100 people: ${parts.join(', ')}.`;
}
