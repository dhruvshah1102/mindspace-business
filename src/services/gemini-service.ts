import type { FeelingSnapshot } from '@/domain/snapshot';
import {
  wellbeingReportSchema,
  writeLocalReport,
  type WellbeingReport,
} from '@/domain/wellbeing-report';

const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];
const CACHE_KEY = 'mindspace.business.report.v1';
const LATEST_CACHE_KEY = 'mindspace.business.report.latest';

/** Set in production so the key lives on the server, not in the bundle. */
const proxyEndpoint = import.meta.env.VITE_REPORT_ENDPOINT as string | undefined;
/** Dev/demo escape hatch — a browser-visible key. */
const directKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) as string | undefined;

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

Return ONLY valid JSON matching this schema:
{
  "mood": "good" | "okay" | "strained" | "struggling",
  "moodLabel": string (e.g. "Doing well", "Holding steady", "Running on empty", "Needs real support"),
  "headline": string (one sentence verdict, e.g. "The majority are coping, but operations carries strain from workload"),
  "summary": string[] (2-3 paragraphs, plain English narrative of workforce sentiment),
  "whatThisMeans": string (what executive leadership needs to understand),
  "goingWell": string[] (3-4 specific positive signals),
  "needsAttention": string[] (3-4 specific concerns),
  "howPeopleFeel": [
    {
      "tier": "thriving" | "steady" | "strained" | "struggling",
      "label": string,
      "peopleCount": number,
      "share": number,
      "description": string
    }
  ],
  "inTheirWords": [{ "quote": string, "topic": string }],
  "whatsWeighing": [
    {
      "title": string,
      "plainLanguage": string,
      "affected": number,
      "share": number,
      "whoMostly": string[],
      "severity": "low" | "moderate" | "high",
      "rootCause": string
    }
  ],
  "teamPulse": [
    {
      "team": string,
      "mood": "good" | "okay" | "strained" | "struggling",
      "headline": string,
      "note": string,
      "masked": boolean
    }
  ],
  "cultureChanges": [
    {
      "title": string,
      "why": string,
      "how": string[],
      "effort": "low" | "medium" | "high",
      "expected": string
    }
  ],
  "activities": [
    {
      "title": string,
      "format": string,
      "who": string,
      "description": string,
      "cadence": string,
      "therapistLed": boolean,
      "outcome": string
    }
  ],
  "doThisFirst": string[] (top 3 immediate priorities for this week)
}

howPeopleFeel must contain one entry per tier in moodTiers, with the same counts and shares.
whatsWeighing must cover the top 4-5 pressures. cultureChanges: 3-4. activities: 4-5, mixing therapist-led sessions with rituals the company can run itself.`;
}

interface GenerateOptions {
  /**
   * ONLY when true does this actually hit the Gemini API.
   * If false or omitted, it reads from cache or uses the deterministic local writer.
   */
  callGemini?: boolean;
  force?: boolean;
}

/**
 * Produces the report HR reads.
 * Guarantees ZERO API calls unless `callGemini: true` is explicitly provided.
 */
export async function generateWellbeingReport(
  snapshot: FeelingSnapshot,
  options: GenerateOptions = {},
): Promise<WellbeingReport> {
  const fingerprint = snapshotFingerprint(snapshot);

  // 1. If we have a cached report for this exact snapshot fingerprint, return it
  if (!options.force) {
    const cached = readCache(fingerprint);
    if (cached) return cached;
  }

  // 2. If Gemini is not explicitly requested (e.g. initial page load or background check-in save),
  // return existing cached report or generate local deterministic report (0 API calls!).
  if (!options.callGemini) {
    const latestCached = readLatestCache();
    if (latestCached) {
      // Update meta counts to match the live snapshot without hitting Gemini
      return {
        ...latestCached,
        meta: {
          ...latestCached.meta,
          responses: snapshot.responses,
          headcount: snapshot.headcount,
          participationRate: snapshot.participationRate,
        },
      };
    }
    return writeLocalReport(snapshot);
  }

  // 3. Gemini is explicitly triggered by HR clicking "Sync & Regenerate"
  if (!isGeminiConfigured) {
    const local = writeLocalReport(snapshot);
    writeCache(fingerprint, local);
    return local;
  }

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
    const fallback = writeLocalReport(snapshot);
    writeCache(fingerprint, fallback);
    return fallback;
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
  const key = directKey;
  if (!key) throw new Error('No Gemini key configured.');

  let lastError: unknown = null;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini ${model} HTTP ${res.status}: ${errBody}`);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Gemini ${model} returned empty response.`);
      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[mindspace] Model ${model} failed, trying next fallback:`, err);
    }
  }

  throw lastError ?? new Error('All Gemini models failed.');
}

function snapshotFingerprint(s: FeelingSnapshot): string {
  return `${s.orgName}:${s.periodLabel}:${s.responses}:${s.moodTiers.map((t) => `${t.tier}:${t.count}`).join(',')}`;
}

function readCache(fingerprint: string): WellbeingReport | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}:${fingerprint}`);
    return raw ? (JSON.parse(raw) as WellbeingReport) : null;
  } catch {
    return null;
  }
}

function readLatestCache(): WellbeingReport | null {
  try {
    const raw = localStorage.getItem(LATEST_CACHE_KEY);
    return raw ? (JSON.parse(raw) as WellbeingReport) : null;
  } catch {
    return null;
  }
}

function writeCache(fingerprint: string, report: WellbeingReport): void {
  try {
    localStorage.setItem(`${CACHE_KEY}:${fingerprint}`, JSON.stringify(report));
    localStorage.setItem(LATEST_CACHE_KEY, JSON.stringify(report));
  } catch {
    /* quota exceeded — safe to drop */
  }
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}
