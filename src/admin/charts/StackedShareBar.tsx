/**
 * Part-to-whole in one bar — the four mood tiers across the workforce.
 *
 * A bar, not a donut: the tiers are an *ordered* scale (coping → struggling),
 * and order is exactly what a ring throws away. Reading left to right, the
 * eucalyptus end is coping and the clay end is under strain, so the shape of
 * the bar is the headline before a single number is read.
 *
 * Segments are separated by a 2px gap in the surface colour rather than by a
 * stroke around each one — white does the separating, so no ink is spent that
 * isn't data.
 */

export interface ShareSegment {
  key: string;
  label: string;
  count: number;
  share: number;
  color: string;
  /** Ink for a label printed *inside* the segment, picked for contrast against the fill. */
  labelOnFill?: 'light' | 'dark';
}

export function StackedShareBar({ segments, total }: { segments: ShareSegment[]; total: number }) {
  // A zero-share tier would still claim its 2px gap and render as a sliver of
  // colour that looks like a real (tiny) group. Drop it from the bar — the
  // legend below still lists it at 0, so nothing goes missing.
  const drawn = segments.filter((s) => s.share > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-full gap-[2px]" role="img" aria-label={describe(segments, total)}>
        {drawn.map((s, i) => {
          const pct = Math.max(0, s.share * 100);
          // Only print a label inside the fill when it comfortably fits.
          // Anything narrower relies on the legend and the table view — a
          // clipped label is worse than no label.
          const fits = pct >= 11;
          const first = i === 0;
          const last = i === drawn.length - 1;
          return (
            <div
              key={s.key}
              className="h-11 flex items-center justify-center transition-[flex-basis] duration-500"
              style={{
                flexBasis: `${pct}%`,
                backgroundColor: s.color,
                borderTopLeftRadius: first ? 8 : 0,
                borderBottomLeftRadius: first ? 8 : 0,
                borderTopRightRadius: last ? 8 : 0,
                borderBottomRightRadius: last ? 8 : 0,
              }}
            >
              {fits && (
                <span
                  className="text-[11px] font-semibold tabular-nums px-1"
                  style={{ color: s.labelOnFill === 'light' ? '#FFFFFF' : '#233226' }}
                >
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* The legend is the dependable identity channel — never colour alone. */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-[#56685A]">{s.label}</span>
            <span className="text-[11px] font-semibold text-[#233226] tabular-nums">
              {s.count} · {Math.round(s.share * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function describe(segments: ShareSegment[], total: number): string {
  const parts = segments.map((s) => `${s.label}: ${s.count} people, ${Math.round(s.share * 100)} percent`);
  return `Distribution across ${total} responses. ${parts.join('. ')}.`;
}
