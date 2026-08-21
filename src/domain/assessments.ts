/**
 * Six employee-focused assessment domains. Each is framed around the job,
 * not generic life circumstances, so the questions map directly onto the
 * pressures taxonomy the rest of the app already reports on (see
 * domain/themes.ts and the THEME_PLAIN/THEME_ROOT tables in
 * domain/wellbeing-report.ts): workload, manager relationship, work-life
 * balance, career growth. Scoring style (4-point frequency scale, 0-50)
 * carries over from the original clinical-scale version so history and
 * severity bands stay comparable.
 */

export interface AssessmentQuestion {
  id: number;
  text: string;
  options: {
    value: 'never' | 'rarely' | 'often' | 'almost_everyday';
    label: string;
    score: number;
  }[];
}

export type AssessmentType =
  | 'workload'
  | 'work_anxiety'
  | 'work_mood'
  | 'manager_relationship'
  | 'work_life_balance'
  | 'career_growth';

export type AssessmentLevel = 'Low' | 'Moderate' | 'High';

export interface AssessmentResult {
  score: number;
  maxScore: number;
  level: AssessmentLevel;
  percentage: number;
}

const STANDARD_OPTIONS = [
  { value: 'never' as const, label: 'Never', score: 1.25 },
  { value: 'rarely' as const, label: 'Rarely', score: 2.5 },
  { value: 'often' as const, label: 'Often', score: 3.75 },
  { value: 'almost_everyday' as const, label: 'Almost everyday', score: 5 },
];

export const WORKLOAD_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you feel emotionally drained by the end of your workday?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Is your workload more than you can realistically get done in your working hours?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Do you find yourself working late or through breaks just to keep up?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do you feel a sense of dread before checking your work messages or inbox?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Are you skipping meals or breaks because of work demands?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Do you feel less effective at your job than you used to?', options: STANDARD_OPTIONS },
  { id: 7, text: 'Do you find yourself becoming cynical or checked out about your work?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Are you feeling physically exhausted or run down because of work?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you struggle to switch off from work once your day is done?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Do you feel like you have little control over your workload or priorities?', options: STANDARD_OPTIONS },
];

export const WORK_ANXIETY_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you feel nervous, anxious, or on edge about your job or workload?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Do you find it hard to stop worrying about deadlines or unfinished tasks?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Are you worrying too much about how your work is being judged by others?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do you have trouble relaxing, even outside work hours, because of job stress?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Do you feel restless or unable to sit still before a big meeting or deadline?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Are you becoming easily annoyed or irritable because of pressure at work?', options: STANDARD_OPTIONS },
  { id: 7, text: "Do you feel afraid something will go wrong with a project you're responsible for?", options: STANDARD_OPTIONS },
  { id: 8, text: 'Do you notice physical tension, like a tight chest or shallow breathing, when thinking about work?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you get a racing heart or dry mouth before presentations or performance reviews?', options: STANDARD_OPTIONS },
  { id: 10, text: 'How often do you feel shaky or on edge during a typical workday?', options: STANDARD_OPTIONS },
];

export const WORK_MOOD_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Have you lost interest or enthusiasm in work you used to enjoy?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Do you feel down, discouraged, or low most days at work?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Is work affecting your sleep, either falling asleep or staying asleep?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do you feel tired or low on energy during your workday?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Has your appetite changed noticeably because of work stress?', options: STANDARD_OPTIONS },
  { id: 6, text: "Do you feel like you're falling short or letting your team down?", options: STANDARD_OPTIONS },
  { id: 7, text: 'Do you find it hard to concentrate on tasks or meetings?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Do you feel overwhelmed or close to tears during the workday?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you dread going into work, or think about not going at all?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Is it hard to get through your daily tasks because of how you feel?', options: STANDARD_OPTIONS },
];

export const MANAGER_RELATIONSHIP_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you feel your manager gives you clear priorities and direction?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Is it hard to get support from your manager when you need it?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Do you feel comfortable raising concerns with your manager?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do you feel recognized or appreciated by your manager for your work?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Is there friction or tension with a colleague that affects your day?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Do you feel like a valued part of your team?', options: STANDARD_OPTIONS },
  { id: 7, text: 'Do you worry about how your manager perceives your performance?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Do you feel your manager trusts you to do your job without micromanaging?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Is it difficult to get honest feedback from your manager or team?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Do you feel left out of decisions that affect your own work?', options: STANDARD_OPTIONS },
];

export const WORK_LIFE_BALANCE_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Is work spilling into your evenings, weekends, or personal time?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Do you feel guilty taking time off or stepping away from work?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Are you finding it hard to fully switch off after work hours?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do work messages or notifications interrupt your personal time?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Do you have enough energy left for your life outside of work?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Is your commute or work schedule cutting into time you need for yourself?', options: STANDARD_OPTIONS },
  { id: 7, text: "Do you feel you're missing out on personal or family commitments because of work?", options: STANDARD_OPTIONS },
  { id: 8, text: 'Are you skipping exercise, hobbies, or rest because of work demands?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you feel your working hours are respected by your team or manager?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Do you struggle to take a proper lunch break or pause during the day?', options: STANDARD_OPTIONS },
];

export const CAREER_GROWTH_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you feel your work goes unnoticed or unacknowledged?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Is it unclear what you need to do to grow or get promoted here?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Do you feel stuck or stagnant in your current role?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do you feel you lack opportunities to learn new skills at work?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Do you feel underpaid for the work you do?', options: STANDARD_OPTIONS },
  { id: 6, text: "Do you doubt whether you're good enough for your role?", options: STANDARD_OPTIONS },
  { id: 7, text: "Is there a lack of feedback on how you're doing at work?", options: STANDARD_OPTIONS },
  { id: 8, text: 'Do you worry about job security or the stability of your role?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you feel your contributions go unvalued by leadership?', options: STANDARD_OPTIONS },
  { id: 10, text: "Do you feel there's no path forward for you at this company?", options: STANDARD_OPTIONS },
];

export interface AssessmentMetadata {
  id: AssessmentType;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  maxScore: number;
  levelRanges: { low: number; moderate: number; high: number };
}

export const ASSESSMENT_METADATA: Record<AssessmentType, AssessmentMetadata> = {
  workload: {
    id: 'workload', title: 'Workload & Burnout', description: 'How manageable your workload feels, and whether you’re running on empty',
    questions: WORKLOAD_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  work_anxiety: {
    id: 'work_anxiety', title: 'Work-Related Anxiety', description: 'How much worry and tension your job is carrying day to day',
    questions: WORK_ANXIETY_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  work_mood: {
    id: 'work_mood', title: 'Work Mood & Engagement', description: 'How engaged and motivated you feel in your role right now',
    questions: WORK_MOOD_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  manager_relationship: {
    id: 'manager_relationship', title: 'Manager & Team Relationship', description: 'How supported and heard you feel by your manager and team',
    questions: MANAGER_RELATIONSHIP_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  work_life_balance: {
    id: 'work_life_balance', title: 'Work-Life Balance', description: 'Whether work is leaving room for the rest of your life',
    questions: WORK_LIFE_BALANCE_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  career_growth: {
    id: 'career_growth', title: 'Career Growth & Recognition', description: 'Whether you feel seen, valued, and able to grow here',
    questions: CAREER_GROWTH_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
};

export const ASSESSMENT_TYPES: AssessmentType[] = [
  'workload',
  'work_anxiety',
  'work_mood',
  'manager_relationship',
  'work_life_balance',
  'career_growth',
];

export function calculateAssessmentScore(
  answers: Record<number, string>,
  questions: AssessmentQuestion[],
): number {
  let total = 0;
  for (const q of questions) {
    const val = answers[q.id];
    const opt = q.options.find((o) => o.value === val);
    if (opt) total += opt.score;
  }
  return Math.round(total * 100) / 100;
}

export function calculateAssessmentLevel(score: number, type: AssessmentType): AssessmentLevel {
  const meta = ASSESSMENT_METADATA[type];
  if (score <= meta.levelRanges.low) return 'Low';
  if (score <= meta.levelRanges.moderate) return 'Moderate';
  return 'High';
}

export function calculateAssessmentResult(
  answers: Record<number, string>,
  type: AssessmentType,
): AssessmentResult {
  const meta = ASSESSMENT_METADATA[type];
  const score = calculateAssessmentScore(answers, meta.questions);
  const level = calculateAssessmentLevel(score, type);
  const percentage = Math.round((score / meta.maxScore) * 100);
  return { score, maxScore: meta.maxScore, level, percentage };
}

export function getAssessmentQuestions(type: AssessmentType): AssessmentQuestion[] {
  return ASSESSMENT_METADATA[type].questions;
}
