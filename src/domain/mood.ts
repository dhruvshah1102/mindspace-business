export type Mood = 'energized' | 'calm' | 'okay' | 'stressed' | 'overwhelmed';

/** Coping → strain, left to right — same direction as MoodTier in snapshot.ts. */
export const MOOD_ORDER: Mood[] = ['energized', 'calm', 'okay', 'stressed', 'overwhelmed'];

export const MOOD_LABELS: Record<Mood, string> = {
  energized: 'Energized',
  calm: 'Calm',
  okay: 'Just Okay',
  stressed: 'Stressed',
  overwhelmed: 'Overwhelmed',
};
