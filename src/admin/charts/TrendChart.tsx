import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TooltipShell } from './ChartCard';
import { CHART_INK, MAGNITUDE_HUE, TREND_HUE, axisProps, gridProps } from './chart-theme';

/**
 * Single-series trend — the **emphasis** form.
 *
 * When the story is "this one moved", one line beats four. There is no legend
 * box, because there is only one colour on the plot and the card title already
 * names it. The value is direct-laboured at the endpoint, the axis carries the
 * rest, and the crosshair tooltip fills in any point on demand.
 */
export function TrendChart({
  data,
  valueKey,
  format,
  hue = TREND_HUE,
  height = 190,
  tooltipLabel,
}: {
  data: { label: string; [k: string]: string | number }[];
  valueKey: string;
  format: (v: number) => string;
  hue?: string;
  height?: number;
  tooltipLabel: string;
}) {
  const last = data[data.length - 1];

  return (
    <div className="flex flex-col gap-1">
      {/* The endpoint value, direct-labelled *above* the plot. Overlaying it on
          the plot's bottom-right would land it on top of the last x-axis tick. */}
      {last && (
        <p className="text-right text-[11px] text-[#78897B]">
          Latest ·{' '}
          <span className="font-semibold text-[#233226] tabular-nums">{format(Number(last[valueKey]))}</span>
        </p>
      )}

      {/* The container includes the x-axis band, so the card never grows a
          nested scrollbar to reach the tick labels. */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 44, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={`wash-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hue} stopOpacity={0.16} />
              <stop offset="100%" stopColor={hue} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axisProps} width={44} tickFormatter={(v: number) => format(v)} />

          <Tooltip
            cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipShell
                  title={String(label)}
                  rows={[{ label: tooltipLabel, value: format(Number(payload[0].value)), color: hue }]}
                />
              ) : null
            }
          />

          <Area
            type="monotone"
            dataKey={valueKey}
            stroke={hue}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#wash-${valueKey})`}
            // 2px surface ring keeps the end dot legible over the line.
            dot={false}
            activeDot={{ r: 4, fill: hue, stroke: CHART_INK.surface, strokeWidth: 2 }}
          />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Small multiples — the answer to "four series, one plot".
 *
 * Four categorical hues would need a validated four-slot palette this design
 * system doesn't define, and four converging lines on one axis is unreadable
 * anyway. Faceting keeps every panel single-hue and puts them on a **shared
 * y-scale**, so the panels are honestly comparable: a feature that barely
 * registers is *supposed* to look small next to one that doesn't.
 */
export function SmallMultiples({
  panels,
  data,
  height = 112,
  sharedScale = true,
  note,
}: {
  panels: { key: string; title: string; hue?: string }[];
  data: { label: string; [k: string]: string | number }[];
  height?: number;
  sharedScale?: boolean;
  note?: string;
}) {
  const ceiling = sharedScale
    ? Math.max(...data.flatMap((d) => panels.map((p) => Number(d[p.key]) || 0)), 1)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {panels.map((panel) => {
          const hue = panel.hue ?? MAGNITUDE_HUE;
          const latest = Number(data[data.length - 1]?.[panel.key] ?? 0);
          const peak = Math.max(...data.map((d) => Number(d[panel.key]) || 0));

          return (
            <div key={panel.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-[#233226]">{panel.title}</span>
                <span className="text-[11px] text-[#78897B] tabular-nums">
                  <span className="font-semibold text-[#233226]">{latest}</span> this week · peak {peak}
                </span>
              </div>
              <div style={{ width: '100%', height }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} tick={{ fill: CHART_INK.muted, fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis hide domain={ceiling ? [0, ceiling] : [0, 'auto']} />
                    <Tooltip
                      cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <TooltipShell
                            title={`${panel.title} · ${label}`}
                            rows={[{ label: 'People', value: String(payload[0].value), color: hue }]}
                          />
                        ) : null
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey={panel.key}
                      stroke={hue}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={false}
                      activeDot={{ r: 4, fill: hue, stroke: CHART_INK.surface, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
      {note && <p className="text-[11px] text-[#78897B]">{note}</p>}
    </div>
  );
}
