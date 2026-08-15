/** Reads the current theme's data-viz tokens (light/dark aware, tenant-safe —
 * never hardcode hexes in a chart component). Falls back to the light
 * defaults when no DOM is available (e.g. server-side report generation). */

const FALLBACK: Record<string, string> = {
  low: '#2F7F4C',
  moderate: '#D19B12',
  high: '#B23227',
  sev1: '#F1DDCE',
  sev2: '#E3BB9C',
  sev3: '#CE9468',
  sev4: '#AD6B3E',
  sev5: '#7C4423',
  up: '#4F6B57',
  down: '#AD6B3E',
  flat: '#9AA39C',
};

const VAR_NAMES: Record<string, string> = {
  low: '--viz-low',
  moderate: '--viz-moderate',
  high: '--viz-high',
  sev1: '--viz-sev-1',
  sev2: '--viz-sev-2',
  sev3: '--viz-sev-3',
  sev4: '--viz-sev-4',
  sev5: '--viz-sev-5',
  up: '--viz-up',
  down: '--viz-down',
  flat: '--viz-flat',
};

export type VizToken = keyof typeof FALLBACK;

export function getVizColor(token: VizToken): string {
  if (typeof document === 'undefined') return FALLBACK[token];
  const value = getComputedStyle(document.documentElement).getPropertyValue(VAR_NAMES[token]).trim();
  return value || FALLBACK[token];
}

export function bandColor(level: 'Low' | 'Moderate' | 'High'): string {
  if (level === 'Low') return getVizColor('low');
  if (level === 'Moderate') return getVizColor('moderate');
  return getVizColor('high');
}

/** 0-100 severity → clay-ramp bucket. */
export function severityColor(percentage: number): string {
  if (percentage < 20) return getVizColor('sev1');
  if (percentage < 40) return getVizColor('sev2');
  if (percentage < 60) return getVizColor('sev3');
  if (percentage < 80) return getVizColor('sev4');
  return getVizColor('sev5');
}

export function deltaColor(delta: number): string {
  if (delta > 0.5) return getVizColor('up');
  if (delta < -0.5) return getVizColor('down');
  return getVizColor('flat');
}
