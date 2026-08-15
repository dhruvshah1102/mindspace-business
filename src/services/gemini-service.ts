import type { FeelingSnapshot } from '@/domain/snapshot';
import {
  wellbeingReportSchema,
  writeLocalReport,
  type WellbeingReport,
} from '@/domain/wellbeing-report';

const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];
const CACHE_KEY = 'mindspace.business.report.v1';

/** Set in production so the key lives on the server, not in the bundle. */
const proxyEndpoint = import.meta.env.VITE_REPORT_ENDPOINT as string | undefined;
/** Dev/demo escape hatch — a browser-visible key. */
const directKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const isGeminiConfigured = Boolean(proxyEndpoint || directKey);

export const SYSTEM_BRIEF = `You are an occupational psychologist writing the monthly wellbeing report for a company's HR lead.

The reader is NOT an analyst. They will not read index scores, percentages to one decimal place, or statistical language, and they will disengage if you write any. Your job is to tell them, in plain English, how their people feel, why they feel that way, and what the company should change.

Rules:
- Write like a thoughtful human being, not a dashboard. Short sentences. No corporate filler, no "leverage", no "synergies", no emoji.
- Never invent a number. Only use counts and shares present in the data given to you, and prefer phrasings like "about 1 in 4 people" over "24.3%".
- The data is fully anonymous and aggregated. Never speculate about who an individual might be, and never write anything that could single out a person. Teams marked masked must be reported as "not enough responses".
- Diagnose causes, not symptoms: "people are working late because commitments are made without a capacity check" beats "burnout is elevated".
- Recommended changes must be things this company can actually do: how work is scheduled, how managers behave, what rituals exist, what sessions to run. Be concrete enough that someone could put it in a calendar on Monday.
- Where the news is good, say so plainly and say what is producing it.
- Every quote in inTheirWords must be taken from the provided anonymous notes, lightly cleaned for typos only. If no notes were provided, return an empty array.`;

export function buildPrompt(snapshot: FeelingSnapshot): string {
  return `${SYSTEM_BRIEF}

Here is this cycle's anonymised aggregate for ${snapshot.orgName} (${snapshot.periodLabel}):

${JSON.stringify(
  {
    responses: snapshot.responses,
    headcount: snapshot.headcount,
    participationRate: snapshot.participationRate,
    moodTiers: snapshot.moodTiers,
    domains: snapshot.domains,
    hardestIndividualQuestions: snapshot.toughestSignals,
    pressuresRaised: snapshot.themes.slice(0, 10),
    teams: snapshot.teams,
    anonymousNotes: snapshot.voices,
  },
  null,
  1,
)}

Return ONLY a JSON object with exactly this shape:
{
  "mood": "good" | "okay" | "strained" | "struggling",
  "moodLabel": "three-to-four word verdict",
  "headline": "one sentence an executive could read alone and act on",
  "summary": ["2-4 short paragraphs telling the story of this cycle"],
  "whatThisMeans": "one paragraph interpreting what the picture implies for the business",
  "goingWell": ["3 specific positives"],
  "needsAttention": ["3 specific concerns"],
  "howPeopleFeel": [{"tier":"thriving|steady|strained|struggling","label":"plain-English name for this group","peopleCount":number,"share":number,"description":"what life looks like for this group right now"}],
  "inTheirWords": [{"quote":"an anonymous employee's own words","topic":"2-4 word topic"}],
  "whatsWeighing": [{"title":"the pressure, in plain words","plainLanguage":"what it feels like day to day","affected":number,"share":number,"whoMostly":["team names, or empty"],"severity":"low|moderate|high","rootCause":"the likely underlying cause"}],
  "teamPulse": [{"team":"name","mood":"good|okay|strained|struggling","headline":"short verdict","note":"one sentence of context","masked":boolean}],
  "cultureChanges": [{"title":"the change","why":"why it addresses what the data shows","how":["2-4 concrete steps"],"effort":"low|medium|high","expected":"what should improve and roughly how fast"}],
  "activities": [{"title":"name","format":"e.g. Therapist-led group session","who":"who it is for","description":"what happens in it","cadence":"duration and frequency","therapistLed":boolean,"outcome":"what it should achieve","cost":"optional"}],
  "doThisFirst": ["3 actions to take this week, most important first"]
}

howPeopleFeel must contain one entry per tier in moodTiers, with the same counts and shares.
whatsWeighing must cover the top 4-5 pressures. cultureChanges: 3-4. activities: 4-5, mixing therapist-led sessions with rituals the company can run itself.`;
}

interface GenerateOptions {
  /** Ignore the cached report and regenerate. */
  force?: boolean;
}

/**
 * Produces the report HR reads. Tries Gemini (via a server proxy when
 * configured, otherwise directly), validates the response against the schema,
 * and falls back to the rule-based writer on any failure — a missing key, a
 * quota error and malformed JSON all degrade to a usable console rather than
 * an error screen. `meta.writtenBy` records which path produced the words.
 */
export async function generateWellbeingReport(
  snapshot: FeelingSnapshot,
  options: GenerateOptions = {},
): Promise<WellbeingReport> {
  const fingerprint = snapshotFingerprint(snapshot);

  if (!options.force) {
    const cached = readCache(fingerprint);
    if (cached) return cached;
  }

  if (!isGeminiConfigured) return writeLocalReport(snapshot);

  try {
    const { text, modelUsed } = proxyEndpoint
      ? { text: await callProxy(snapshot), modelUsed: 'proxy' }
      : await callGeminiDirect(snapshot);

    const parsed = wellbeingReportSchema.parse(JSON.parse(stripFences(text)));
    const report: WellbeingReport = {
      ...parsed,
      meta: {
        generatedAt: new Date().toISOString(),
        writtenBy: 'gemini',
        model: modelUsed,
        source: snapshot.source,
        responses: snapshot.responses,
        headcount: snapshot.headcount,
        participationRate: snapshot.participationRate,
        periodLabel: snapshot.periodLabel,
        orgName: snapshot.orgName,
      },
    };
    writeCache(fingerprint, report);
    return report;
  } catch (err) {
    console.warn('[mindspace] Gemini report generation failed, using local writer:', err);
    return writeLocalReport(snapshot);
  }
}

async function callProxy(snapshot: FeelingSnapshot): Promise<string> {
  const res = await fetch(proxyEndpoint as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot }),
  });
  if (!res.ok) throw new Error(`Report proxy returned ${res.status}`);
  const data = await res.json();
  if (typeof data.text !== 'string') throw new Error('Report proxy returned no text');
  return data.text;
}

async function callGeminiDirect(snapshot: FeelingSnapshot): Promise<{ text: string; modelUsed: string }> {
  const prompt = buildPrompt(snapshot);
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': directKey as string },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json', maxOutputTokens: 8192 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini ${model} returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      if (!text) throw new Error(`Gemini ${model} returned an empty response`);

      return { text, modelUsed: model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[mindspace] Attempt with model ${model} failed, trying next...`, err);
    }
  }

  throw lastError ?? new Error('All Gemini models failed');
}

/** Models occasionally wrap JSON in a markdown fence despite the mime type. */
function stripFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
}

/** Content hash — the report only needs regenerating when the aggregate
 * actually moves. */
function snapshotFingerprint(snapshot: FeelingSnapshot): string {
  const basis = JSON.stringify([
    snapshot.source,
    snapshot.responses,
    snapshot.periodLabel,
    snapshot.moodTiers.map((t) => t.count),
    snapshot.themes.slice(0, 8).map((t) => [t.theme, t.mentions]),
    snapshot.voices.length,
  ]);
  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash * 31 + basis.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function readCache(fingerprint: string): WellbeingReport | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { fingerprint: string; report: WellbeingReport };
    if (parsed.fingerprint !== fingerprint) return null;
    return wellbeingReportSchema.parse(parsed.report) ? parsed.report : null;
  } catch {
    return null;
  }
}

function writeCache(fingerprint: string, report: WellbeingReport): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fingerprint, report }));
  } catch {}
}

export function clearReportCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
