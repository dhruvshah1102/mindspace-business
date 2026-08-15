/**
 * Server-side Gemini proxy so the API key never reaches the browser.
 *
 * Point the client at it with VITE_REPORT_ENDPOINT=/.netlify/functions/generate-report
 * and set GEMINI_API_KEY in the Netlify environment. The client posts only the
 * anonymised aggregate — no identities exist in the payload to begin with.
 */

const MODEL = 'gemini-2.5-flash';

const SYSTEM_BRIEF = `You are an occupational psychologist writing the monthly wellbeing report for a company's HR lead.

The reader is NOT an analyst. They will not read index scores, percentages to one decimal place, or statistical language, and they will disengage if you write any. Your job is to tell them, in plain English, how their people feel, why they feel that way, and what the company should change.

Rules:
- Write like a thoughtful human being, not a dashboard. Short sentences. No corporate filler, no emoji.
- Never invent a number. Only use counts and shares present in the data given to you, and prefer "about 1 in 4 people" over "24.3%".
- The data is fully anonymous and aggregated. Never speculate about individuals. Teams marked masked must be reported as "not enough responses".
- Diagnose causes, not symptoms.
- Recommended changes must be concrete enough to put in a calendar on Monday.
- Where the news is good, say so plainly and say what is producing it.
- Every quote in inTheirWords must come from the provided anonymous notes, lightly cleaned for typos only. If none were provided, return an empty array.`;

const SHAPE = `{
  "mood": "good" | "okay" | "strained" | "struggling",
  "moodLabel": string,
  "headline": string,
  "summary": string[],
  "whatThisMeans": string,
  "goingWell": string[],
  "needsAttention": string[],
  "howPeopleFeel": [{"tier":"thriving|steady|strained|struggling","label":string,"peopleCount":number,"share":number,"description":string}],
  "inTheirWords": [{"quote":string,"topic":string}],
  "whatsWeighing": [{"title":string,"plainLanguage":string,"affected":number,"share":number,"whoMostly":string[],"severity":"low|moderate|high","rootCause":string}],
  "teamPulse": [{"team":string,"mood":"good|okay|strained|struggling","headline":string,"note":string,"masked":boolean}],
  "cultureChanges": [{"title":string,"why":string,"how":string[],"effort":"low|medium|high","expected":string}],
  "activities": [{"title":string,"format":string,"who":string,"description":string,"cadence":string,"therapistLed":boolean,"outcome":string,"cost":string}],
  "doThisFirst": string[]
}`;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'GEMINI_API_KEY is not configured' }, 500);

  let snapshot: unknown;
  try {
    ({ snapshot } = await request.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!snapshot || typeof snapshot !== 'object') {
    return json({ error: 'Missing snapshot' }, 400);
  }

  const prompt = `${SYSTEM_BRIEF}

Here is this cycle's anonymised aggregate:

${JSON.stringify(snapshot, null, 1)}

Return ONLY a JSON object with exactly this shape:
${SHAPE}

howPeopleFeel must contain one entry per tier in moodTiers with the same counts and shares. whatsWeighing: the top 4-5 pressures. cultureChanges: 3-4. activities: 4-5, mixing therapist-led sessions with rituals the company can run itself.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json', maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    return json({ error: `Gemini returned ${res.status}`, detail: await res.text() }, 502);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

  if (!text) return json({ error: 'Gemini returned an empty response' }, 502);

  return json({ text });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
