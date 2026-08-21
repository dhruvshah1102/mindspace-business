/**
 * Shared chart tokens.
 *
 * Charts never hardcode a hex. Every colour here is either a CSS custom
 * property from the design system (so the tenant theme and the dark surface
 * swap in one place) or a validated step from a ramp documented below.
 *
 * The colour rules this console follows, in short:
 * - **Mood tiers** are an *ordered diverging* ramp (coping ↔ strained), never a
 *   categorical set. Defined in `styles/index.css`, already CVD-validated.
 * - **Severity** is a *status* scale with reserved meaning. It always ships
 *   with a text label beside it — never colour alone.
 * - **Magnitude on nominal categories** (teams, pressures, topics) gets ONE
 *   hue for every bar. Bar length already encodes the value; spending the
 *   identity channel on it too would double-encode.
 * - **Ordered stages** (the engagement funnel) get a single-hue ordinal ramp,
 *   monotone in lightness, validated so the lightest step still clears 2:1 on
 *   the white card surface.
 */

/** Chart chrome. Gridlines and axes are solid hairlines one step off the surface. */
export const CHART_INK = {
  surface: '#FFFFFF',
  grid: '#EFE9DE',
  axis: '#DCD5C8',
  /** Axis ticks and secondary labels. */
  muted: '#78897B',
  secondary: '#56685A',
  primary: '#233226',
} as const;

/**
 * Single-hue ordinal ramp for ordered stages (the engagement ladder).
 * Validated light→dark on the white card surface: monotone lightness, every
 * adjacent gap ≥ 0.06 L, lightest step 2.56:1 vs surface, hue spread 3°.
 */
export const ORDINAL_RAMP = ['#8FA894', '#6E8874', '#4F6B57', '#2C3A30'] as const;

/** The one hue every nominal-category magnitude bar uses — the same brand
 * green as everywhere else in the app (#2D6A4F). */
export const MAGNITUDE_HUE = '#2D6A4F';
/** Its de-emphasised twin, for the "everything else" bars in an emphasis chart. */
export const MAGNITUDE_MUTED = '#C3D0C6';

/** Trend line for a single series — the emphasis form, no legend needed. */
export const TREND_HUE = '#9E6B38';
export const TREND_WASH = 'rgba(158, 107, 56, 0.10)';

export const TIER_VAR = {
  thriving: 'var(--tier-thriving)',
  steady: 'var(--tier-steady)',
  strained: 'var(--tier-strained)',
  struggling: 'var(--tier-struggling)',
} as const;

/** Recharts axis props, applied identically everywhere so charts read as one system. */
export const axisProps = {
  stroke: CHART_INK.axis,
  tick: { fill: CHART_INK.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART_INK.axis },
} as const;

export const gridProps = {
  stroke: CHART_INK.grid,
  strokeWidth: 1,
  vertical: false,
} as const;

/** Bars are capped rather than filling their band — the leftover is air. */
export const MAX_BAR_SIZE = 22;

export function pctLabel(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/** Rupees, from paise, compacted the way an Indian finance team reads them. */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(1)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)} L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}k`;
  return `₹${Math.round(rupees)}`;
}

/** Compact counts for stat-tile values (1,284 / 12.9K). */
export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}
