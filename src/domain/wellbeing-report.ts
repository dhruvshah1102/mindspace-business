import { z } from 'zod';
import { MOOD_TIER_BLURBS, MOOD_TIER_LABELS, type FeelingSnapshot, type MoodTier } from './snapshot';

/**
 * The report HR actually reads. Deliberately *not* a metric dump: every field
 * is a sentence a non-analyst can act on. Numbers appear only where they carry
 * meaning a word can't ("about 1 in 4 people"), never as an index score.
 *
 * Gemini fills this shape; `writeLocalReport` fills the same shape from rules
 * so the console is never blank when the API key is missing or the call fails.
 */

export const moodSchema = z.enum(['good', 'okay', 'strained', 'struggling']);

export const wellbeingReportSchema = z.object({
  mood: moodSchema,
  moodLabel: z.string(),
  headline: z.string(),
  summary: z.array(z.string()).min(1),
  whatThisMeans: z.string(),
  goingWell: z.array(z.string()),
  needsAttention: z.array(z.string()),
  howPeopleFeel: z.array(
    z.object({
      tier: z.enum(['thriving', 'steady', 'strained', 'struggling']),
      label: z.string(),
      peopleCount: z.number(),
      share: z.number(),
      description: z.string(),
    }),
  ),
  inTheirWords: z.array(z.object({ quote: z.string(), topic: z.string() })),
  whatsWeighing: z.array(
    z.object({
      title: z.string(),
      plainLanguage: z.string(),
      affected: z.number(),
      share: z.number(),
      whoMostly: z.array(z.string()),
      severity: z.enum(['low', 'moderate', 'high']),
      rootCause: z.string(),
    }),
  ),
  teamPulse: z.array(
    z.object({
      team: z.string(),
      mood: moodSchema,
      headline: z.string(),
      note: z.string(),
      masked: z.boolean().optional(),
    }),
  ),
  cultureChanges: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      how: z.array(z.string()),
      effort: z.enum(['low', 'medium', 'high']),
      expected: z.string(),
    }),
  ),
  activities: z.array(
    z.object({
      title: z.string(),
      format: z.string(),
      who: z.string(),
      description: z.string(),
      cadence: z.string(),
      therapistLed: z.boolean(),
      outcome: z.string(),
      cost: z.string().optional(),
    }),
  ),
  doThisFirst: z.array(z.string()),
});

export type WellbeingReportBody = z.infer<typeof wellbeingReportSchema>;
export type Mood = z.infer<typeof moodSchema>;

export interface WellbeingReport extends WellbeingReportBody {
  meta: {
    generatedAt: string;
    /** Where the words came from — surfaced in the UI so nobody mistakes the
     * rule-based fallback for the AI synthesis. */
    writtenBy: 'gemini' | 'local';
    model?: string;
    source: 'live' | 'demo';
    responses: number;
    headcount: number;
    participationRate: number;
    periodLabel: string;
    orgName: string;
  };
}

export const MOOD_LABELS: Record<Mood, string> = {
  good: 'In good shape',
  okay: 'Mostly okay',
  strained: 'Under strain',
  struggling: 'Struggling',
};

export function moodFromSnapshot(snapshot: FeelingSnapshot): Mood {
  const share = (tier: MoodTier) => snapshot.moodTiers.find((t) => t.tier === tier)?.share ?? 0;
  const pressured = share('strained') + share('struggling');
  if (share('struggling') >= 0.15 || pressured >= 0.45) return 'struggling';
  if (pressured >= 0.28) return 'strained';
  if (pressured >= 0.15) return 'okay';
  return 'good';
}

function people(n: number): string {
  return n === 1 ? '1 person' : `${n} people`;
}

/** "about 1 in 4" reads better to an HR lead than "24.3%". */
export function asFraction(share: number): string {
  if (share <= 0) return 'nobody';
  if (share >= 0.97) return 'almost everyone';
  const denominator = Math.max(2, Math.round(1 / share));
  if (denominator > 12) return 'a small number of people';
  if (denominator === 2) return 'about half of everyone';
  return `about 1 in ${denominator} people`;
}

/**
 * Rule-based report writer. This is the fallback when Gemini is unavailable —
 * same shape, same tone, just less nuance in the prose.
 */
export function writeLocalReport(snapshot: FeelingSnapshot): WellbeingReport {
  const mood = moodFromSnapshot(snapshot);
  const tier = (t: MoodTier) => snapshot.moodTiers.find((x) => x.tier === t) ?? { tier: t, count: 0, share: 0 };
  const thriving = tier('thriving');
  const steady = tier('steady');
  const strained = tier('strained');
  const struggling = tier('struggling');
  const okShare = thriving.share + steady.share;
  const pressuredCount = strained.count + struggling.count;

  const topThemes = snapshot.themes.slice(0, 5);
  const hotTeams = snapshot.teams.filter((t) => !t.masked).slice(0, 5);
  const calmTeams = [...snapshot.teams].filter((t) => !t.masked).reverse().slice(0, 2);

  const severityFor = (share: number): 'low' | 'moderate' | 'high' =>
    share >= 0.3 ? 'high' : share >= 0.15 ? 'moderate' : 'low';

  const whatsWeighing = topThemes.map((t) => ({
    title: t.label,
    plainLanguage: THEME_PLAIN[t.theme] ?? `${t.label} is coming up repeatedly in what people tell us.`,
    affected: Math.round(t.share * snapshot.responses),
    share: t.share,
    whoMostly: hotTeams.filter((h) => h.topFeeling === t.label).map((h) => h.team).slice(0, 3),
    severity: severityFor(t.share),
    rootCause: THEME_ROOT[t.theme] ?? 'Worth asking about directly in the next round of 1:1s.',
  }));

  const cultureChanges = topThemes
    .slice(0, 3)
    .map((t) => CULTURE_PLAYS[t.theme])
    .filter((c): c is NonNullable<typeof c> => !!c);

  const report: WellbeingReport = {
    meta: {
      generatedAt: new Date().toISOString(),
      writtenBy: 'local',
      source: snapshot.source,
      responses: snapshot.responses,
      headcount: snapshot.headcount,
      participationRate: snapshot.participationRate,
      periodLabel: snapshot.periodLabel,
      orgName: snapshot.orgName,
    },
    mood,
    moodLabel: MOOD_LABELS[mood],
    headline:
      mood === 'good'
        ? 'Most of your people are in a good place, and a few pockets need a light touch.'
        : mood === 'okay'
          ? 'The majority are coping, but a visible minority are running low on reserves.'
          : mood === 'strained'
            ? `${asFraction(strained.share + struggling.share)} are running on empty. This is the stage where it is still cheap to fix.`
            : 'A significant share of your workforce is past coping and needs support now.',
    summary: [
      `${snapshot.responses} people at ${snapshot.orgName} checked in anonymously this cycle. ${asFraction(okShare)} say they are doing well or holding steady.`,
      pressuredCount > 0
        ? `${people(pressuredCount)} are telling us something different: persistent tiredness, difficulty switching off, and trouble concentrating. ${topThemes[0] ? `The thread running through their answers is ${topThemes[0].label.toLowerCase()}.` : ''}`
        : 'No meaningful cluster of strain showed up this cycle.',
      hotTeams.length
        ? `The pressure is not spread evenly. ${hotTeams[0].team} is carrying the most of it${calmTeams.length ? `, while ${calmTeams[0].team} reports a far steadier picture` : ''}.`
        : 'Pressure is spread fairly evenly across teams.',
    ],
    whatThisMeans:
      mood === 'good' || mood === 'okay'
        ? 'This is a maintenance situation, not a crisis. Protect what is working and address the one or two pockets before they spread.'
        : 'This is localised operational friction rather than a broken culture, which is good news because friction responds quickly to changes in how work is scheduled and acknowledged.',
    goingWell: [
      `${Math.round(snapshot.participationRate * 100)}% of the workforce chose to answer: people trust the process enough to be honest.`,
      thriving.count > 0 ? `${people(thriving.count)} report genuinely good energy, focus and mood.` : 'Participation held up across every team.',
      calmTeams.length ? `${calmTeams.map((t) => t.team).join(' and ')} show what a healthy load looks like here, worth studying and not just celebrating.` : 'No team is in crisis.',
    ],
    needsAttention: [
      topThemes[0] ? `${topThemes[0].label} is the single most-raised pressure, mentioned by ${asFraction(topThemes[0].share)}.` : 'No dominant pressure emerged.',
      hotTeams[0] ? `${hotTeams[0].team} carries noticeably more strain than the rest of the organisation.` : 'Strain is evenly distributed.',
      struggling.count > 0 ? `${people(struggling.count)} scored in a range where professional support genuinely matters. They stay anonymous to you; the clinical desk reaches out to them directly.` : 'Nobody landed in the highest-need band.',
    ],
    howPeopleFeel: snapshot.moodTiers.map((t) => ({
      tier: t.tier,
      label: MOOD_TIER_LABELS[t.tier],
      peopleCount: t.count,
      share: t.share,
      description: MOOD_TIER_BLURBS[t.tier],
    })),
    inTheirWords: snapshot.voices.slice(0, 6).map((quote) => ({ quote, topic: 'In an employee’s own words' })),
    whatsWeighing,
    teamPulse: snapshot.teams.slice(0, 8).map((t) => ({
      team: t.team,
      mood: t.masked ? 'okay' : t.strainShare >= 0.6 ? 'struggling' : t.strainShare >= 0.45 ? 'strained' : t.strainShare >= 0.3 ? 'okay' : 'good',
      headline: t.masked
        ? 'Not enough responses to report'
        : t.topFeeling
          ? `Mostly talking about ${t.topFeeling.toLowerCase()}`
          : 'No single dominant pressure',
      note: t.masked
        ? 'Fewer than five people answered here, so we show nothing at all rather than risk identifying someone.'
        : `${asFraction(t.strainShare)} in this team are stretched or worse.`,
      masked: t.masked,
    })),
    cultureChanges,
    activities: DEFAULT_ACTIVITIES,
    doThisFirst: [
      topThemes[0] && CULTURE_PLAYS[topThemes[0].theme]
        ? CULTURE_PLAYS[topThemes[0].theme]!.how[0]
        : 'Name what you heard in an all-hands: people answer honestly once, and only twice if something visibly changed.',
      hotTeams[0] ? `Sit down with ${hotTeams[0].team}'s leadership this week and walk through their picture together.` : 'Share this report with team leads.',
      'Open the confidential 1:1 counselling line and say out loud that HR cannot see who uses it.',
    ],
  };

  return report;
}

const THEME_PLAIN: Partial<Record<string, string>> = {
  workload: 'People are being handed more than fits in a working day, and the overflow lands in their evenings.',
  long_hours: 'The working day keeps stretching past its edges, so nobody fully switches off.',
  sleep: 'People are waking up unrested, which shows up the next afternoon as fog and irritability.',
  work_life_balance: 'Work is eating into the hours people rely on to recover.',
  manager_relationship: 'People want clearer priorities and more supportive check-ins from their manager.',
  role_clarity: 'People are unsure what good looks like in their role, so they overwork to be safe.',
  recognition: 'Effort is going in without any visible acknowledgement coming back.',
  career_growth: 'People cannot see where this job leads them next.',
  compensation_stress: 'Money worries are following people into the working day.',
  interpersonal_conflict: 'Friction between colleagues is costing people energy they need for the work.',
  job_insecurity: 'Uncertainty about job stability is sitting in the background of everything.',
  remote_isolation: 'Remote and hybrid colleagues feel out of the loop and out of the room.',
  commute: 'The journey to work is taking a real bite out of daily energy.',
  physical_health: 'Physical health problems are compounding the mental load.',
  family_caregiving: 'People are carrying caring responsibilities at home alongside a full workload.',
  self_esteem: 'People are doubting whether they are good enough at their job.',
};

const THEME_ROOT: Partial<Record<string, string>> = {
  workload: 'Usually planning, not effort: commitments are being made without a capacity check.',
  long_hours: 'Usually an expectations problem: nobody said when the day is allowed to end.',
  sleep: 'Frequently downstream of late-night work, on-call rotas or evening notifications.',
  work_life_balance: 'Usually caused by meetings and requests colonising the edges of the day.',
  manager_relationship: 'Often managers with too many direct reports and no time to prioritise for their team.',
  role_clarity: 'Usually a job description that drifted while nobody rewrote it.',
  recognition: 'Rarely about money. It is about work being seen by the people who matter.',
  career_growth: 'Usually an absence of any visible progression conversation, not an absence of roles.',
  compensation_stress: 'Financial literacy support and predictable pay cycles help more than raises alone.',
  interpersonal_conflict: 'Often unresolved handoff disputes between teams rather than personality clashes.',
  job_insecurity: 'Usually a communication vacuum: people fill silence with the worst explanation.',
  remote_isolation: 'Usually meeting habits that favour whoever is physically in the room.',
  commute: 'Shift timing and start-time flexibility move this more than anything else.',
  physical_health: 'Sedentary shift patterns and skipped breaks are the usual contributors.',
  family_caregiving: 'Predictable schedules matter more to carers than extra leave days.',
  self_esteem: 'Frequently follows unclear expectations and sparse feedback.',
};

type CultureChange = WellbeingReportBody['cultureChanges'][number];

const CULTURE_PLAYS: Partial<Record<string, CultureChange>> = {
  workload: {
    title: 'Make capacity a visible number before work is committed',
    why: 'Workload is the most-raised pressure, and it is almost always a planning artefact rather than a motivation problem.',
    how: [
      'Cap committed work per sprint or shift at a stated capacity, and make anything above it an explicit trade-off conversation.',
      'Give every team a standing weekly 30 minutes to drop or defer work, not just to add it.',
      'Ask leads to report "what we chose not to do" alongside what shipped.',
    ],
    effort: 'medium',
    expected: 'People stop absorbing overflow silently. Expect the strain share to fall over two to three cycles.',
  },
  long_hours: {
    title: 'Give the working day a hard edge',
    why: 'People are not choosing to work late; they are responding to signals nobody meant to send.',
    how: [
      'Agree a no-pings-after window and have leadership visibly obey it first.',
      'Schedule-send anything written after hours instead of firing it immediately.',
      'Make late deployments and shift overruns something a lead has to justify, not something quietly rewarded.',
    ],
    effort: 'low',
    expected: 'Evenings become recoverable again, the fastest single lever on fatigue and sleep.',
  },
  sleep: {
    title: 'Treat rest as an operating input, not a personal habit',
    why: 'Sleep debt is the mechanism through which workload becomes lost productivity the following day.',
    how: [
      'Move on-call and late-deploy rotas so no one takes them two weeks running.',
      'Run a short sleep-recovery session for the worst-affected teams.',
      'Stop scheduling 9am meetings after a planned late release.',
    ],
    effort: 'low',
    expected: 'Afternoon focus recovers first, usually within a fortnight.',
  },
  recognition: {
    title: 'Make good work visible on a schedule',
    why: 'Recognition gaps are cheap to close and expensive to ignore: they drive quiet quitting more reliably than pay does.',
    how: [
      'Institute a fortnightly ritual where peers, not just managers, name specific wins.',
      'Ask leads to send one specific thank-you per week: specific, not generic.',
      'Celebrate the unglamorous saves as loudly as the deals.',
    ],
    effort: 'low',
    expected: 'Sentiment and retention intent move quickly; this is usually the first visible win.',
  },
  manager_relationship: {
    title: 'Give managers time to actually manage',
    why: 'People asking for support from a manager are usually asking for prioritisation, and their manager has no slack to give it.',
    how: [
      'Protect a weekly 1:1 that cannot be reassigned to delivery work.',
      'Train leads on one thing only: helping someone decide what not to do.',
      'Review any span of control above eight people.',
    ],
    effort: 'medium',
    expected: 'Clarity improves within a cycle; trust follows a cycle later.',
  },
  role_clarity: {
    title: 'Write down what good looks like',
    why: 'When expectations are vague, conscientious people overwork to be safe, and burn out first.',
    how: [
      'Rewrite the three vaguest role definitions with the people doing the job.',
      'Define what "done" and "good enough" mean for recurring work.',
      'End every 1:1 by naming the single most important thing for the coming week.',
    ],
    effort: 'medium',
    expected: 'Reduces anxious over-delivery and the self-doubt that comes with it.',
  },
  work_life_balance: {
    title: 'Protect recovery time deliberately',
    why: 'Recovery is what converts effort into sustained output; without it, effort just compounds into fatigue.',
    how: [
      'Declare two meeting-free blocks a week that are genuinely respected.',
      'Stop the drift of "quick calls" into lunch hours and evenings.',
      'Make taking full leave visible and normal, starting with leadership.',
    ],
    effort: 'low',
    expected: 'A quick, cheap improvement in how sustainable the job feels.',
  },
};

const DEFAULT_ACTIVITIES: WellbeingReportBody['activities'] = [
  {
    title: 'Sleep & recovery masterclass',
    format: 'Interactive workshop',
    who: 'Open to the teams reporting the most fatigue',
    description:
      'A 45-minute session with a MindSpace sleep psychologist on wind-down routines, shift recovery, screen and caffeine cut-offs. Practical, not lecture-style.',
    cadence: '45 minutes · virtual or on-site',
    therapistLed: true,
    outcome: 'Daytime alertness and focus typically recover before the underlying workload does.',
    cost: 'Included in the MindSpace Business plan',
  },
  {
    title: 'Decompression circle',
    format: 'Therapist-led group session',
    who: 'Open to anyone, max 15 per group, attendance never reported to HR',
    description:
      'A licensed counsellor runs a confidential group on breathing, reframing and containment techniques people can use mid-shift.',
    cadence: '60 minutes · weekly cohorts',
    therapistLed: true,
    outcome: 'Gives people in the strained band a real off-ramp before they reach the struggling band.',
    cost: '₹500 per seat · company-sponsored or split',
  },
  {
    title: 'Confidential 1:1 counselling',
    format: 'Private clinical support',
    who: 'Company-wide, fully confidential',
    description:
      'Employees book video sessions with certified therapists directly. You see a utilisation count and nothing else. No names, ever.',
    cadence: '45 minutes per session · on demand',
    therapistLed: true,
    outcome: 'High-need cases get care without anyone having to disclose to their employer.',
    cost: 'Configurable: commonly 2 sponsored sessions per person per year',
  },
  {
    title: 'Win spotlight ritual',
    format: 'Culture ritual · run it yourselves',
    who: 'Any team where recognition came up',
    description:
      'Fifteen minutes every fortnight where peers name specific things colleagues did well. No slides, no awards budget, no manager monologue.',
    cadence: '15 minutes · every second week',
    therapistLed: false,
    outcome: 'The cheapest reliable lift in team sentiment available to you.',
  },
  {
    title: 'Walk-and-talk 1:1s',
    format: 'Manager habit · run it yourselves',
    who: 'On-site teams',
    description:
      'Move one 1:1 a week outdoors. Movement and the absence of a screen consistently surface things that never come up across a desk.',
    cadence: '30 minutes · weekly',
    therapistLed: false,
    outcome: 'Earlier warning of problems, at zero cost.',
  },
];
