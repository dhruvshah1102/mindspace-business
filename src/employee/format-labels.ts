import type { SessionFormat } from '@/services/booking-service';

/** Labels for the two bookable formats. Deliberately a distinct, smaller set
 * from `domain/engagement.ts`'s `SESSION_LABELS` (group_circle/private_1to1/workshop)
 * — that taxonomy is for HR's aggregate reporting; this is what an employee
 * actually picks when booking. */
export const SESSION_LABELS_BY_FORMAT: Record<SessionFormat, string> = {
  group: 'Group decompression circle',
  '1:1': 'Private 1:1 counselling',
};
