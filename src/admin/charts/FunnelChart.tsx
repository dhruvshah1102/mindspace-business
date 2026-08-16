import { ChevronDown } from 'lucide-react';
import type { FunnelStage } from '@/domain/engagement';
import { ORDINAL_RAMP } from './chart-theme';

/**
 * The support-seeking ladder.
 *
 * Stages are ordered and nested — each one is a subset of the stage above it —
 * so this takes a single-hue **ordinal** ramp rather than four categorical
 * hues: the reader should see the sequence in the colour. The ramp is
 * validated light→dark on the white card surface (monotone lightness, every
 * adjacent gap ≥ 0.06 L, lightest step 2.56:1 against the card).
 *
 * The drop-off between stages is the actual finding, so it is printed between
 * the bars rather than left for the reader to compute.
 */
export function FunnelChart({ stages, headcount }: { stages: FunnelStage[]; headcount: number }) {
  return (
    <div className="flex flex-col">
      {stages.map((stage, i) => {
        const pct = Math.max(0, Math.min(100, stage.ofWorkforce * 100));
        const color = ORDINAL_RAMP[Math.min(i, ORDINAL_RAMP.length - 1)];
        const next = stages[i + 1];

        return (
          <div key={stage.key}>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-xs font-medium text-[#233226]">{stage.label}</span>
                <span className="text-xs text-[#78897B] tabular-nums">
                  <span className="font-semibold text-[#233226]">{stage.employees}</span> of {headcount} ·{' '}
                  {Math.round(stage.ofWorkforce * 100)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#F1ECE2]">
                <div
                  className="h-3 rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? '8px' : 0 }}
                />
              </div>
            </div>

            {next && (
              <div className="flex items-center gap-1.5 py-2 pl-1 text-[11px] text-[#78897B]">
                <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />
                <span>{Math.round(Math.max(0, 1 - next.ofPrevious) * 100)}% don't take the next step</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
