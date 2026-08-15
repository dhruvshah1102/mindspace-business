/** Fixed workplace-issue taxonomy TARA conversations are classified into.
 * Only labels are ever stored — never transcripts. See implementation.md §3. */
export const THEME_TAXONOMY = [
  'workload',
  'long_hours',
  'manager_relationship',
  'role_clarity',
  'career_growth',
  'recognition',
  'compensation_stress',
  'job_insecurity',
  'interpersonal_conflict',
  'discrimination_or_harassment',
  'work_life_balance',
  'remote_isolation',
  'commute',
  'sleep',
  'physical_health',
  'financial_stress',
  'family_caregiving',
  'bereavement',
  'substance',
  'self_esteem',
] as const;

export type Theme = (typeof THEME_TAXONOMY)[number];

export const THEME_LABELS: Record<Theme, string> = {
  workload: 'Workload',
  long_hours: 'Long hours',
  manager_relationship: 'Manager relationship',
  role_clarity: 'Role clarity',
  career_growth: 'Career growth',
  recognition: 'Recognition',
  compensation_stress: 'Compensation stress',
  job_insecurity: 'Job insecurity',
  interpersonal_conflict: 'Interpersonal conflict',
  discrimination_or_harassment: 'Discrimination or harassment',
  work_life_balance: 'Work-life balance',
  remote_isolation: 'Remote isolation',
  commute: 'Commute',
  sleep: 'Sleep',
  physical_health: 'Physical health',
  financial_stress: 'Financial stress',
  family_caregiving: 'Family / caregiving',
  bereavement: 'Bereavement',
  substance: 'Substance use',
  self_esteem: 'Self-esteem',
};

export type Valence = 'negative' | 'neutral' | 'positive';
export type RiskFlag = 'none' | 'low' | 'moderate' | 'high';

export interface ThemeMention {
  theme: Theme;
  weight: number; // 0-1, classifier confidence/salience
  valence: Valence;
}
