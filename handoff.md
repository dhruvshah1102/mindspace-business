# Handoff — MindSpace for Business

Context brief for a fresh chat. Paste this in, then read `implementation.md` in the same folder for the full spec.

---

## What we're building

A **white-labeled corporate mental-wellness platform** built on MindSpace. A company licenses it, branded as their own; their employees use TARA + the assessment suite; **HR gets an analytics console** that identifies what's actually wrong in the workforce.

- **Working dir:** `c:\Lucide Tech\mindspace-for-business`
- **Reference repo (READ-ONLY — never modify):** `c:\Lucide Tech\mindspace\mindspace-private-`
- **Full spec:** `implementation.md` in this folder (13 sections — data model, metrics, screen-by-screen, phases)

**Commercials:** flat subscription = unlimited assessments + TARA + analytics + wellness activities. Pay-as-you-use on top = therapist sessions (group online counseling ₹500/session/employee). 1:1 pricing and subscription pricing still TBD.

**Buyer's criteria:** team wellness ↑, productivity ↑, absenteeism ↓, engagement ↑, customization, culture, and — the main one — *tracking wellbeing and identifying core issues.*

---

## The one thing that must not be diluted

There are companies waiting to trial this. It wins or loses on **analytics depth**. Ordinary wellness dashboards (a mood score, a pie chart, a participation bar) lose the deal. Three layers make us different:

1. **Item-level analytics.** MindSpace already stores answers to all 60 individual questions (6 assessments × 10). Competitors keep only the total. We track every question as its own metric → *"'Trouble sleeping' is up 0.9 pts in 6 weeks while the total barely moved — that's an hours problem, not a mood problem."*
2. **Theme extraction from TARA** into a 20-item workplace-issue taxonomy (workload, long_hours, manager_relationship, recognition, role_clarity, job_insecurity, career_growth, sleep, financial_stress, …). **Labels only — transcripts are never stored in the tenant store.**
3. **Driver Analysis + Insight Feed** — ranks what explains each cohort's severity, then emits plain-English findings with a recommended action, an owner, and pre/post outcome tracking.

---

## Inherited from MindSpace (do not re-derive)

**Design system — "Eucalyptus & Oat", copy verbatim so both products look like one family:**

```
page #FAF7F0 · tint #EDE7DA · soft #C7D6C9 · mid #8FA894
deep #4F6B57 (primary) · deep-hover #3A5243 · base #2C3A30 (text) · dark #1F2B23
mint #A9CBAE · danger #E4574C · online #6FBE7A

font    Fira Sans (both serif + sans map to it; loaded from Google Fonts)
radius  0.75rem base · 18px cards · pill buttons
shadow  0 14px 32px -22px rgba(44,58,48,.22)
```

Same `--ds-*` CSS variables → shadcn HSL token mapping as the source repo's `src/index.css` and `tailwind.config.ts`.

**Chart palette (validated for colorblind-safety — don't substitute by eye):**
- Severity bands Low/Moderate/High → `#2F7F4C` / `#D19B12` / `#B23227` (light), `#309B7C` / `#B8881B` / `#CE4A55` (dark). Always ship with text labels — the ochre is below 3:1 on cream.
- Severity magnitude → single-hue **clay** ramp, never green (green means *good* in this brand).
- Deltas → diverging eucalyptus ↔ clay, neutral grey midpoint.

**Assessment engine:** 6 domains (anxiety, depression, stress, ptsd, relationship, ocd) × 10 questions. Options score 1.25 / 2.5 / 3.75 / 5 → max 50. Bands: Low ≤ 15, Moderate ≤ 35, High > 35 (**OCD differs: 20 / 36**).

**Stack:** Vite + React 18 + TS + Tailwind + shadcn/Radix + Firebase Auth/Firestore + Netlify Functions + Groq + Razorpay + Recharts (new).

---

## Privacy model — decided, and it's a selling point

Default `aggregate_only`:
- **Employee** sees their own full history.
- **HR** sees aggregates only, cohorts of **n ≥ 5** (k configurable up, never down). No names, no individual scores, no transcripts. Cells below k render "Not enough responses" — never zero.
- **Clinical Desk (MindSpace, licensed)** sees identified high-risk cases for outreach. Invisible to the employer.

A depressed employee → crisis resources → private consent-gated therapist offer → case opens on the Clinical Desk. HR sees *"7 high-risk cases, 3 concentrated in Ops, 5 accepted a session"* and zero identities. Imminent-harm escalation only, per signed consent, audit-logged.

Rationale is commercial, not just legal: if employees think HR reads their answers they stop being honest with TARA, and the analytics degrade to noise. `identified` mode exists as a tenant switch but we don't lead with it.

---

## Current state

**Done:** `implementation.md` (full spec). P0 scaffold — Vite/TS/Tailwind config, `src/domain/` (types, assessments, cohorts, indices, drivers, themes), `src/lib/` (tenant-theme, utils), `src/styles/index.css`, `main.tsx`. ~890 lines. Domain layer mirrors the spec's data model and metric formulas.

**Not built yet:** every UI surface (employee app, admin console, ops console), Netlify functions, Firestore rules, the demo seeder.

**`mindspace-private-` is untouched** and must stay that way.

---

## What to build next

Highest-value path: **the demo comes before the product.** A seeded demo tenant + the analytics screens on synthetic data is what goes in front of the waiting companies — no real employee needs to sign in.

1. `scripts/seed-demo-tenant.ts` — realistic synthetic org (~480 employees, 8 departments, 12 weeks of signals) with a deliberate story in the data: one department visibly deteriorating, driven by identifiable items and themes.
2. Admin console screens, in order: Overview (OWI + index tiles + Insight Feed) → Cohort Heatmap → Wellbeing Explorer with the item-level table → **Driver Analysis**.
3. Then Risk & Care, Programs/ROI, Settings/branding.

Remaining screens and the full metric catalogue (OWI, Burnout Composite, Focus Capacity, Absence Risk, Risk Density, Chronicity, Momentum, Volatility, Program Lift…) are specced in `implementation.md` §6 and §7.

---

## Open decisions (blocking nothing yet, but needed before pilot)

| # | Question | Recommendation |
|---|---|---|
| D1 | HR sees identities? | **No** — aggregate-only. Sell the privacy. |
| D3 | k-anonymity threshold | 5 |
| D4 | Cohort by manager? | Only when team ≥ 2k — otherwise it's a surveillance tool |
| D5 | Cadence | Monthly full suite + weekly 3-question pulse (pulse is what makes trends readable in a 90-day trial) |
| D6 | 1:1 session price, default payer | **Needed from founder** |
| D7 | Subscription pricing | **Needed from founder** |
| D9 | Therapist panel capacity | **Needed from founder** |
