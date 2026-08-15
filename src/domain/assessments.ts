/**
 * Ported verbatim from mindspace-private- (reference repo) so scoring stays
 * identical between the consumer product and this one.
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

export type AssessmentType = 'anxiety' | 'depression' | 'stress' | 'ptsd' | 'relationship' | 'ocd';

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

export const ANXIETY_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Are you feeling nervous, anxious, or on edge?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Are you not being able to stop or control worrying?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Are you worrying too much about different things?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Are you having trouble relaxing?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Are you becoming so restless that it is hard to sit still?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Are you becoming easily annoyed or irritable?', options: STANDARD_OPTIONS },
  { id: 7, text: 'Are you feeling afraid as if something awful might happen?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Are you experiencing any difficulty in breathing?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Are you having a dry mouth or difficulty in swallowing?', options: STANDARD_OPTIONS },
  { id: 10, text: 'How often are you experiencing trembling or jitters?', options: STANDARD_OPTIONS },
];

export const DEPRESSION_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Little interest or pleasure in doing things', options: STANDARD_OPTIONS },
  { id: 2, text: 'Feeling down, depressed, or hopeless', options: STANDARD_OPTIONS },
  { id: 3, text: 'Trouble sleeping', options: STANDARD_OPTIONS },
  { id: 4, text: 'Feeling tired or having little energy', options: STANDARD_OPTIONS },
  { id: 5, text: 'Poor appetite or overeating', options: STANDARD_OPTIONS },
  { id: 6, text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down', options: STANDARD_OPTIONS },
  { id: 7, text: 'Trouble concentrating on things, such as reading the newspaper or watching television', options: STANDARD_OPTIONS },
  { id: 8, text: 'Feeling like crying', options: STANDARD_OPTIONS },
  { id: 9, text: 'Thoughts that you would be better off dead, or of hurting yourself', options: STANDARD_OPTIONS },
  { id: 10, text: 'Difficulty in doing your daily activities', options: STANDARD_OPTIONS },
];

export const STRESS_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you find yourself eating unhealthy foods or eating when you are not hungry, as a response to stress or difficult feelings?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Are you finding yourself sweating excessively when you are not exercising?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Are you having trouble sleeping?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Are you experiencing any digestive problems, such as indigestion, irritable bowel syndrome, or ulcers?', options: STANDARD_OPTIONS },
  { id: 5, text: 'Are you suffering from burnout, anxiety disorders, or depression?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Are you taking care of yourself?', options: STANDARD_OPTIONS },
  { id: 7, text: 'Do you have a supportive social network, and take time for relationships in your life?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Are you following regular exercise?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you find yourself smoking and/or drinking to excess as a way to deal with stress?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Do you often find yourself with tension headaches?', options: STANDARD_OPTIONS },
];

export const PTSD_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you get flashbacks of your trauma?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Do you get nightmares?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Do you experience physical sensations such as pain, sweat, nausea, or trembling?', options: STANDARD_OPTIONS },
  { id: 4, text: "Do you experience extreme alertness that sometimes and other times it's hard to concentrate?", options: STANDARD_OPTIONS },
  { id: 5, text: 'Disturbed or lack of sleep?', options: STANDARD_OPTIONS },
  { id: 6, text: 'Easily irritable or angry?', options: STANDARD_OPTIONS },
  { id: 7, text: 'Are you trying to avoid your feelings or memories?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Trying to keep yourself busy in order to avoid remembrance of the trauma?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Avoiding anything (people or situation) that reminds you of the trauma?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Being unable to remember details of what happened?', options: STANDARD_OPTIONS },
];

export const RELATIONSHIP_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Finds it hard to count on others', options: STANDARD_OPTIONS },
  { id: 2, text: 'It is important to feel independent', options: STANDARD_OPTIONS },
  { id: 3, text: 'Finds it easy to get emotionally close to others', options: STANDARD_OPTIONS },
  { id: 4, text: 'Worries about being hurt', options: STANDARD_OPTIONS },
  { id: 5, text: 'Comfortable without close relationships', options: STANDARD_OPTIONS },
  { id: 6, text: 'Wants to be completely close to others', options: STANDARD_OPTIONS },
  { id: 7, text: 'Worries about being alone', options: STANDARD_OPTIONS },
  { id: 8, text: 'Comfortable depending on others', options: STANDARD_OPTIONS },
  { id: 9, text: 'Difficult to trust others completely', options: STANDARD_OPTIONS },
  { id: 10, text: 'Comfortable having others depend on them', options: STANDARD_OPTIONS },
];

export const OCD_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: 'Do you have unwanted ideas, images, or impulses, that seem silly, nasty, or horrible?', options: STANDARD_OPTIONS },
  { id: 2, text: 'Do you worry excessively about dirt, germs, or chemicals?', options: STANDARD_OPTIONS },
  { id: 3, text: 'Are you constantly worried that something bad will happen because you forgot something important like locking the door or turning off appliances?', options: STANDARD_OPTIONS },
  { id: 4, text: 'Do you experience shortness of breath?', options: STANDARD_OPTIONS },
  { id: 5, text: "Are you afraid you will act or speak aggressively when you really don't want to?", options: STANDARD_OPTIONS },
  { id: 6, text: 'Do you have to check things over and over or repeat actions many times to be sure they are done properly?', options: STANDARD_OPTIONS },
  { id: 7, text: 'Do you experience "jelly" legs?', options: STANDARD_OPTIONS },
  { id: 8, text: 'Are there things you feel you must do excessively or thoughts you must think repeatedly to feel comfortable or ease anxiety?', options: STANDARD_OPTIONS },
  { id: 9, text: 'Do you wash yourself or things around you excessively?', options: STANDARD_OPTIONS },
  { id: 10, text: 'Do you avoid situations or people you worry about hurting by aggressive words or actions?', options: STANDARD_OPTIONS },
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
  anxiety: {
    id: 'anxiety', title: 'Anxiety Assessment', description: 'Evaluate anxiety levels and patterns',
    questions: ANXIETY_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  depression: {
    id: 'depression', title: 'Depression Assessment', description: 'Assess symptoms of depression and mood patterns',
    questions: DEPRESSION_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  stress: {
    id: 'stress', title: 'Stress Assessment', description: 'Evaluate stress levels',
    questions: STRESS_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  ptsd: {
    id: 'ptsd', title: 'PTSD Assessment', description: 'Screen for post-traumatic stress disorder symptoms',
    questions: PTSD_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  relationship: {
    id: 'relationship', title: 'Relationship Assessment', description: 'Assess relationship patterns and communication styles',
    questions: RELATIONSHIP_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 15, moderate: 35, high: 50 },
  },
  ocd: {
    id: 'ocd', title: 'OCD Assessment', description: 'Evaluate obsessive-compulsive disorder symptoms',
    questions: OCD_ASSESSMENT_QUESTIONS, maxScore: 50,
    levelRanges: { low: 20, moderate: 36, high: 50 },
  },
};

export const ASSESSMENT_TYPES: AssessmentType[] = ['anxiety', 'depression', 'stress', 'ptsd', 'relationship', 'ocd'];

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
