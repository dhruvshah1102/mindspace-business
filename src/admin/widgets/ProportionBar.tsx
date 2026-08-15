import type { MoodTier } from '@/domain/snapshot';
import { TIER_COLOR } from '@/lib/tier';

interface Segment {
  tier: MoodTier;
  label: string;
  share: number;
  peopleCount: number;
}

/** A single stacked bar, thin, with a 2px surface gap between segments so the
 * boundaries read without borders. Direct labels sit beneath — the bar shows
 * proportion, the text carries identity. */
export function ProportionBar({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex w-full gap-[2px] overflow-hidden">
      {segments
        .filter((s) => s.share > 0)
        .map((s, i, arr) => (
          <div
            key={s.tier}
            className="h-2.5"
            style={{
              width: `${s.share * 100}%`,
              backgroundColor: TIER_COLOR[s.tier],
              borderTopLeftRadius: i === 0 ? 4 : 0,
              borderBottomLeftRadius: i === 0 ? 4 : 0,
              borderTopRightRadius: i === arr.length - 1 ? 4 : 0,
              borderBottomRightRadius: i === arr.length - 1 ? 4 : 0,
            }}
            title={`${s.label}: ${s.peopleCount} people`}
          />
        ))}
    </div>
  );
}

/** Single-measure magnitude bar on the clay ramp. Used for "how many people
 * raised this" — one hue, one meaning. */
export function MagnitudeBar({ share, color, label }: { share: number; color: string; label: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-ds-tint" title={label}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.max(2, Math.min(100, share * 100))}%`, backgroundColor: color }}
      />
    </div>
  );
}
