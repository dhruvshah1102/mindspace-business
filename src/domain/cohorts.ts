export const COHORT_DIMENSIONS = [
  'department',
  'subTeam',
  'location',
  'tenureBand',
  'level',
  'employmentType',
  'shift',
  'ageBand',
  'gender',
] as const;

export type CohortDimension = (typeof COHORT_DIMENSIONS)[number];

export type CohortAttributes = Partial<Record<CohortDimension, string>>;

/** Stable, sorted key so `{department:'Ops',location:'Pune'}` and any
 * re-ordering of the same attrs always collide to the same cohort row. */
export function cohortKey(attrs: CohortAttributes): string {
  const dims = COHORT_DIMENSIONS.filter((d) => attrs[d]);
  if (dims.length === 0) return 'org:all';
  return dims.map((d) => `${d}:${attrs[d]}`).join('|');
}

export const DEFAULT_K_ANONYMITY = 5;

/** Never render a masked cell as zero or an approximation — the caller must
 * show the literal "Not enough responses" message instead. */
export function isMasked(n: number, k: number = DEFAULT_K_ANONYMITY): boolean {
  return n < k;
}

export interface MaskableValue<T> {
  n: number;
  masked: boolean;
  value: T | null;
}

export function maskIfSmall<T>(n: number, value: T, k: number = DEFAULT_K_ANONYMITY): MaskableValue<T> {
  const masked = isMasked(n, k);
  return { n, masked, value: masked ? null : value };
}
