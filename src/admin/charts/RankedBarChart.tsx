import { ShieldCheck } from 'lucide-react';
import { MAGNITUDE_HUE, MAGNITUDE_MUTED } from './chart-theme';

export interface RankedBarDatum {
  label: string;
  /** The plotted magnitude. */
  value: number;
  /** What to print at the bar tip. Defaults to the raw value. */
  display?: string;
  /** Status colour — only when the colour *means* something (severity),
   * never to re-encode the value the bar length already shows. */
  color?: string;
  /** Short status word rendered beside the label, so colour never stands alone. */
  status?: string;
  /** Below the k threshold — render the row as withheld, not as zero. */
  masked?: boolean;
  /** Secondary line under the label. */
  sub?: string;
}

/**
 * Horizontal ranked bars for nominal categories — teams, pressures, topics.
 *
 * Built from CSS rather than a plotting library on purpose: long category
 * labels are the norm here ("I need more support from my manager"), and every
 * chart library's answer to a label that doesn't fit is to clip it. Here the
 * label owns its own column and wraps, the value sits outside the bar tip
 * where it can never be cropped, and the bar is free to be exactly as thin as
 * the spec wants.
 *
 * One hue for every bar by default. Bar length already encodes magnitude, so
 * colouring bars by their value would spend the identity channel restating it.
 * A per-datum `color` is for *status* (severity), which is independent of
 * length — and it always ships with a `status` word beside the label.
 */
export function RankedBarChart({
  data,
  maxValue,
  reference,
  emphasiseFirst = false,
}: {
  data: RankedBarDatum[];
  /** Shared scale ceiling. Defaults to the largest value present. */
  maxValue?: number;
  /** A threshold marker — the company average, a target. Dashed, because it
   * is deliberately not data. */
  reference?: { value: number; label: string };
  /** Emphasis form: the top row keeps the hue, the rest recede to grey. */
  emphasiseFirst?: boolean;
}) {
  const ceiling = maxValue ?? Math.max(...data.map((d) => d.value), 0.0001);
  const refPct = reference ? Math.min(100, (reference.value / ceiling) * 100) : null;

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d, i) => {
        const pct = d.masked ? 0 : Math.min(100, (d.value / ceiling) * 100);
        const fill = d.masked
          ? 'transparent'
          : d.color ?? (emphasiseFirst && i > 0 ? MAGNITUDE_MUTED : MAGNITUDE_HUE);

        return (
          <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs font-medium text-[#233226] leading-snug">{d.label}</span>
                {d.status && <span className="text-[10px] font-medium text-[#78897B]">· {d.status}</span>}
              </div>
              {d.sub && <p className="text-[11px] text-[#78897B] leading-snug mt-0.5">{d.sub}</p>}
            </div>

            <span className="text-xs font-semibold text-[#233226] tabular-nums shrink-0">
              {d.masked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#78897B]">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Withheld
                </span>
              ) : (
                d.display ?? d.value
              )}
            </span>

            {/* Track spans both columns so every bar shares one baseline. */}
            <div className="col-span-2 relative h-2 w-full rounded-full bg-[#F1ECE2]">
              {d.masked ? (
                <div
                  className="absolute inset-0 rounded-full border border-dashed border-[#D9D2C5]"
                  aria-label="Withheld to protect anonymity"
                />
              ) : (
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: fill, minWidth: pct > 0 ? '6px' : 0 }}
                />
              )}
              {refPct !== null && (
                <span
                  aria-hidden
                  className="absolute inset-y-[-3px] w-px border-l border-dashed border-[#8A7B66]"
                  style={{ left: `${refPct}%` }}
                />
              )}
            </div>
          </div>
        );
      })}

      {reference && (
        <p className="flex items-center gap-1.5 text-[11px] text-[#78897B] pt-1">
          <span aria-hidden className="inline-block h-3 w-px border-l border-dashed border-[#8A7B66]" />
          <span>{reference.label}</span>
        </p>
      )}
    </div>
  );
}
