import { CHECK_IN_DOMAINS } from '@/domain/check-in';
import type { AssessmentType } from '@/domain/assessments';
import { getWeeklyRollups } from './analytics-service';

/**
 * Week-over-week wellbeing movement, derived from the seeded weekly rollups.
 *
 * Everything here is computed from `org_rollups` rather than synthesised, so
 * the trend agrees with the cohort heatmap and the item explorer, which read
 * the same rollups. A "share under strain" figure is the moderate + high bands
 * averaged across the three check-in domains — the same definition the mood
 * tiers use, so the line and the bar cannot tell different stories.
 */

export interface WellbeingTrendPoint {
  /** Short axis label, e.g. "W30". */
  label: string;
  periodId: string;
  participationRate: number;
  participants: number;
  /** Share of responses in the moderate or high band, averaged across domains. */
  strainShare: number;
  /** Per-domain mean severity, 0-100. */
  domainMeans: Partial<Record<AssessmentType, number>>;
}

export function getWellbeingTrend(): WellbeingTrendPoint[] {
  const weeks = getWeeklyRollups();

  return weeks.map((w) => {
    const domainMeans: Partial<Record<AssessmentType, number>> = {};
    let strainSum = 0;
    let strainCount = 0;

    for (const domain of CHECK_IN_DOMAINS) {
      const cell = w.byDomain[domain];
      if (!cell) continue;
      domainMeans[domain] = cell.mean;
      strainSum += cell.bands.moderate + cell.bands.high;
      strainCount += 1;
    }

    return {
      label: shortWeekLabel(w.periodId),
      periodId: w.periodId,
      participationRate: w.participationRate,
      participants: w.participants,
      strainShare: strainCount ? strainSum / strainCount : 0,
      domainMeans,
    };
  });
}

/** "2026-W30" → "W30". The year is already on the page heading. */
function shortWeekLabel(periodId: string): string {
  const match = /W(\d+)$/.exec(periodId);
  return match ? `W${match[1]}` : periodId;
}

/** Change between the first and last week, as a signed share. */
export function trendDelta(points: WellbeingTrendPoint[], key: 'strainShare' | 'participationRate'): number {
  if (points.length < 2) return 0;
  return points[points.length - 1][key] - points[0][key];
}
