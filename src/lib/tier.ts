import type { MoodTier } from '@/domain/snapshot';
import type { Mood } from '@/domain/wellbeing-report';

/**
 * The mood ramp is a diverging scale (coping ↔ strained), not a categorical
 * one. Colour never carries meaning alone here — every surface that uses these
 * ships a text label beside the swatch, because the lighter steps sit below
 * 3:1 on the page surface.
 */
export const TIER_COLOR: Record<MoodTier, string> = {
  thriving: 'var(--tier-thriving)',
  steady: 'var(--tier-steady)',
  strained: 'var(--tier-strained)',
  struggling: 'var(--tier-struggling)',
};

export const TIER_ORDER: MoodTier[] = ['thriving', 'steady', 'strained', 'struggling'];

/** Overall verdict → the tier whose colour represents it. */
export const MOOD_TO_TIER: Record<Mood, MoodTier> = {
  good: 'thriving',
  okay: 'steady',
  strained: 'strained',
  struggling: 'struggling',
};

export function moodColor(mood: Mood): string {
  return TIER_COLOR[MOOD_TO_TIER[mood]];
}

/** Severity of a named pressure → the single-hue clay ramp. Magnitude is
 * sequential; it must not borrow the eucalyptus end of the mood ramp, because
 * green already means "good" everywhere else in this product. */
export const SEVERITY_COLOR: Record<'low' | 'moderate' | 'high', string> = {
  low: 'var(--viz-sev-2)',
  moderate: 'var(--viz-sev-3)',
  high: 'var(--viz-sev-5)',
};

export const SEVERITY_LABEL: Record<'low' | 'moderate' | 'high', string> = {
  low: 'Worth watching',
  moderate: 'Needs attention',
  high: 'Act on this',
};

export const EFFORT_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Quick to do',
  medium: 'Some coordination',
  high: 'A real project',
};
