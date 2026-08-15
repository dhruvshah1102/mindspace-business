# MindSpace for Business — Implementation Plan

**Product:** A white-labeled corporate mental-wellness platform built on MindSpace.
**Repo:** `c:\Lucide Tech\mindspace-for-business` (independent of `mindspace-private-`; that repo is read-only reference for design + assessment logic).
**Status:** Plan for review. No code written yet.
**Target:** Pilot-ready build for the companies already willing to trial.

---

## 1. What we are selling

A company (the **tenant**) licenses MindSpace, branded as their own. Their employees get TARA and the full assessment suite. HR gets an analytics console that tells them **what is actually wrong inside their workforce and what to do about it.**

**Included in the license (flat subscription)**
- Unlimited assessments for every employee
- TARA conversational support, unlimited
- Complimentary wellness activities (sessions, challenges, content)
- The full analytics console
- White-label branding

**Pay-as-you-use, on top**
- Therapist / counselor sessions. Group online counseling ~₹500 per session per employee; 1:1 priced separately. Company-sponsored, employee-paid, or split — configurable per tenant.

**The value chain we're selling to the buyer**

```
Assessments + TARA conversations
        ↓  (signal extraction)
Detailed analytics — not scores, but CAUSES
        ↓  (insight engine)
"Ops team stress is up 12 pts; sleep + workload are the drivers"
        ↓  (action layer)
HR intervenes on the real issue
        ↓
Team wellness ↑ · Productivity ↑ · Absenteeism ↓ · Engagement ↑ · Culture ↑
```

Every one of their stated buying criteria maps to a surface in this build:

| Their criterion | Where it lives in the product |
|---|---|
| Increase team wellness | Wellbeing Index + cohort heatmap + activity programs |
| Amplify productivity | Focus Capacity Index + burnout composite |
| Reduce absenteeism | Absence Risk Index + chronicity tracking |
| Employee engagement | Participation, depth, activity attendance panels |
| Customization & flexibility | Tenant config: branding, cohorts, cadence, policy, pricing |
| Elevate corporate culture | Culture & Safety panel, theme trends, manager-level signals |
| Track wellbeing, find core issues | **Driver Analysis + Item-Level Analytics — the differentiator** |

---

## 2. The thing that makes us win: analytics depth

Every competitor ships the same dashboard: a happiness score, a pie chart, a participation bar. That is not what we ship.

Our claim to the buyer: **"We don't tell you your team is stressed. We tell you which team, since when, by how much, driven by what, who's getting worse, and what to do this week."**

Three layers of depth nobody else has:

### Layer 1 — Item-level analytics
We already collect answers to every individual question (10 per assessment, 6 assessments, 4-point scale). Most platforms throw away everything except the total score. **We don't.** Every question becomes a tracked metric.

> *"In Engineering, the #1 escalating item is 'Trouble sleeping' (+0.9 pts in 6 weeks), followed by 'Feeling tired or having little energy'. Their total depression score barely moved — but the sleep/energy sub-signal is deteriorating fast. That's a workload-and-hours problem, not a mood problem."*

That single sentence is worth the contract.

### Layer 2 — Theme extraction from TARA
TARA conversations are classified into a fixed workplace-issue taxonomy. **Only the labels are stored, never the transcript.** We produce frequency and severity per theme, per cohort, over time.

Taxonomy: `workload`, `long_hours`, `manager_relationship`, `role_clarity`, `career_growth`, `recognition`, `compensation_stress`, `job_insecurity`, `interpersonal_conflict`, `discrimination_or_harassment`, `work_life_balance`, `remote_isolation`, `commute`, `sleep`, `physical_health`, `financial_stress`, `family_caregiving`, `bereavement`, `substance`, `self_esteem`.

### Layer 3 — Driver analysis (the "core issue" engine)
Correlate theme prevalence and item movement against domain severity **within each cohort**, and rank by explained variance.

> *"Workload and manager_relationship together account for the largest share of stress variance in Operations. Recognition is the top driver in Sales. These are different problems and need different fixes."*

Plus an **Insight Feed**: auto-generated, ranked, plain-English findings pushed weekly, each with a recommended action, an owner, and outcome tracking — so HR can prove the intervention worked.

---

## 3. Privacy model — a feature, not a compliance tax

This is the single most important design decision, and getting it right is *also* the strongest sales argument.

**If employees believe HR can see their individual answers, they will lie to TARA, and the analytics become worthless.** Data quality is downstream of trust. So:

**Default policy (`aggregate_only`)**

| Role | Sees |
|---|---|
| Employee | Their own full history, always |
| HR / Org Admin | Aggregates only. Cohorts of **n ≥ 5** (configurable `k`). Never a name, never an individual score, never a transcript |
| Clinical Desk (MindSpace, licensed) | Identified high-risk cases, for outreach only. Never exposed to the employer |
| MindSpace Super Admin | Tenant config + billing. No clinical content |

**How a depressed employee is handled — the flow you asked for:**

```
Employee scores High on depression, or TARA detects risk language
        ↓
Immediate in-product response: crisis resources, coping content
        ↓
Private, consent-gated offer: "Talk to a therapist" → booking + payment
        ↓
Case opens on the MindSpace Clinical Desk (identified, licensed staff only)
        ↓
HR sees on their dashboard:
   • "High-risk cases this month: 7 (up from 4)"
   • "3 concentrated in Operations — n≥5, cohort-safe"
   • "5 accepted a session; 2 declined"
   • Zero names.
        ↓
Imminent-harm only: escalation to the tenant's named emergency contact,
per the consent employee signed at onboarding, logged in the audit trail.
```

**Optional policy (`identified`)** — available as a tenant switch for jurisdictions/contracts that permit it, and only with explicit per-employee opt-in shown at onboarding in plain language. **I recommend against selling this**, and recommend we position `aggregate_only` as a differentiator: *"Your employees will actually tell us the truth, which is why our data is better than anyone else's."* Flagged as open decision **D1**.

**Never stored, ever:** raw TARA transcripts in the tenant analytics store. Extraction happens server-side, and only `{theme, severity, timestamp, pseudo_id, cohort_key}` is written.

---

## 4. Architecture

Reuses the MindSpace stack so the team is instantly productive and the UI is identical by construction.

```
React 18 + TypeScript + Vite
Tailwind + shadcn/ui + Radix          ← same tokens as MindSpace
Firebase Auth (email + Google + SSO)
Firestore (multi-tenant, rule-isolated)
Netlify Functions (privileged writes, aggregation, exports)
Groq (TARA + theme classification)
Recharts (new — charting)
Razorpay (session payments; Cashfree/PayPal already proven in MindSpace)
PostHog (product analytics — ours, not the tenant's)
```

**Three apps, one codebase, one deploy**

| App | Route | Audience |
|---|---|---|
| Employee app | `/` | Employees — TARA, assessments, activities, booking |
| Admin console | `/admin` | HR / Org Admin — the analytics product |
| Ops console | `/ops` | MindSpace internal — tenant provisioning, clinical desk, billing |

Tenant resolution: subdomain (`acme.mindspace.app`) or custom domain (`wellness.acme.com`), falling back to the authenticated user's `orgId`.

**Aggregation strategy:** never compute analytics by reading raw docs in the browser. Scheduled Netlify Functions roll signals into `org_rollups` (hourly for today, nightly for full recompute). The console reads pre-computed rollups — fast, cheap, and rule-safe because rollups contain no individual rows.

---

## 5. Data model (Firestore)

```
organizations/{orgId}
  name, legalName, logoUrl, faviconUrl, primaryDomain, customDomain
  branding: { primary, accent, surface, logoLight, logoDark, appName, supportEmail }
  plan: { tier, seats, contractStart, contractEnd, trial: bool }
  policy: { identityMode: 'aggregate_only'|'identified', kAnonymity: 5,
            escalationContact, retentionDays, allowedCohortDims[] }
  pricing: { groupSessionPaise: 50000, individualSessionPaise: ...,
             payer: 'company'|'employee'|'split', splitPercent }
  status, createdAt

organizations/{orgId}/members/{uid}
  pseudoId            ← stable hash; the ONLY id used in analytics
  role: employee|hr_admin|hr_analyst|wellness_manager
  cohort: { department, subTeam, location, tenureBand, level,
            employmentType, shift, ageBand, gender? }
  status: invited|active|deactivated
  consent: { analytics, escalation, identified?, acceptedAt, version }

organizations/{orgId}/invites/{token}

org_signals/{signalId}                    ← one row per completed assessment
  orgId, pseudoId, cohortKey, ts
  domain: anxiety|depression|stress|ptsd|relationship|ocd
  score, maxScore, percentage, level
  items: [{ qid, score }]                 ← THE item-level gold
  source: 'assessment'

org_theme_signals/{id}                    ← one row per TARA session
  orgId, pseudoId, cohortKey, ts
  themes: [{ theme, weight, valence }]
  riskFlag: none|low|moderate|high
  NO TRANSCRIPT. NO TEXT.

org_rollups/{orgId}/{grain}/{periodId}    ← grain: day|week|month
  headcount, participants, participationRate
  indices: { owi, burnout, focus, absenceRisk, ... }
  byDomain: { [domain]: { mean, median, p90, bands{low,mod,high}, n, delta } }
  byCohort: { [cohortKey]: { ...same, n, masked: bool } }
  byItem:   { [domain.qid]: { mean, delta, n } }
  byTheme:  { [theme]: { count, share, delta, severityMean } }
  drivers:  [{ cohortKey, domain, driver, strength, direction }]
  computedAt, version

org_insights/{id}          headline, body, severity, cohort, evidence[],
                           recommendedActions[], status, owner, outcome

org_actions/{id}           insightId, title, owner, dueDate, status,
                           preMetric, postMetric, measuredAt

risk_cases/{id}            CLINICAL DESK ONLY — identified, rule-locked
                           uid, orgId, trigger, severity, contactAttempts[],
                           outcome, closedAt

bookings/{id}              orgId, pseudoId(+uid for clinical), type, therapistId,
                           slot, priceePaise, payer, paymentId, status

payments/{id}              orgId, bookingId, gateway, amount, status, invoiceId

audit_logs/{id}            actor, action, target, orgId, ts, ip
                           (every admin view of sensitive data is logged)
```

**Security rules principles**
1. No client can ever read another org's documents. `orgId` check on every rule.
2. No client can read `org_signals` or `org_theme_signals` at all — functions only.
3. HR roles read `org_rollups` and `org_insights` only.
4. `risk_cases` is invisible to every tenant role, without exception.
5. All writes to analytics collections go through Netlify Functions with Firebase Admin.

---

## 6. Metric definitions

All indices are **0–100, higher is better** so the dashboard reads consistently.

**Domain severity** — `percentage = score / 50 × 100` (matches existing MindSpace scoring: 10 questions × max 5, bands Low ≤ 15, Moderate ≤ 35, High > 35; OCD uses 20/36).

| Metric | Definition |
|---|---|
| **OWI** — Organizational Wellbeing Index | `100 − Σ(wᵢ × severityᵢ)`, weights: depression .25, anxiety .25, stress .25, ptsd .10, ocd .075, relationship .075 |
| **Burnout Composite** | Exhaustion (tired/energy + sleep items) + Cynicism (interest/pleasure items) + Efficacy loss (concentration + failure items), Maslach-mapped onto existing questions |
| **Focus Capacity Index** *(productivity proxy)* | Concentration item + energy item + restlessness item, inverted |
| **Absence Risk Index** | Weighted composite of High-band depression, High-band stress, sleep item, energy item; validated later against real HR absence data if the tenant uploads it |
| **Risk Density** | % of participants with ≥1 High band in the period |
| **Chronicity** | % High in ≥2 consecutive periods — *"who is not getting better"* |
| **Momentum** | Δ vs prior period, per domain / cohort / item, with significance test |
| **Volatility** | Std-dev of an individual's score across cycles, averaged per cohort |
| **Participation** | Distinct participants ÷ eligible headcount |
| **Engagement Depth** | Assessments + TARA sessions + activity attendance per active employee |
| **Theme Share** | % of TARA sessions mentioning a theme |
| **Driver Strength** | Correlation of theme/item against domain severity within cohort, ranked by explained variance |
| **Benchmark Delta** | vs. own baseline, vs. anonymized cross-tenant mean, vs. industry band |
| **Program Lift** | Pre/post score change for employees who attended an activity or session vs. those who didn't |

**Cohort dimensions:** department, sub-team, location, tenure band, job level, employment type, shift, age band, gender (optional). Any cell with `n < k` renders as **"Not enough responses"** — never as zero, never approximated.

---

## 7. Admin console — screen by screen

### 7.1 Executive Overview
- OWI gauge with 12-week sparkline and delta
- Four index tiles: Burnout, Focus Capacity, Absence Risk, Risk Density
- Participation + engagement strip
- **Insight Feed** — top 5 ranked findings, plain English, each with evidence and a recommended action
- "Needs attention" cohort list, ranked by deterioration
- Period selector (7d / 30d / 90d / custom), cohort filter, export

### 7.2 Wellbeing Explorer
- Six domain cards: mean, band distribution stacked bar, trend, delta
- Drill into a domain → distribution histogram, cohort ranking, **item-level table** (per-question mean, delta, movers highlighted)
- Compare mode: any two cohorts or two periods side by side

### 7.3 Cohort Heatmap
- Matrix: cohort (rows) × domain (columns)
- Cell = severity color + delta arrow + n; masked cells greyed with the reason
- Switch to any cohort dimension; sort by severity, delta, or size
- Click a cell → filtered explorer view

### 7.4 Driver Analysis — *the core-issue screen*
- Ranked drivers per cohort with strength bars
- Theme prevalence over time, stacked area
- Theme × domain correlation matrix
- "What changed" — items and themes that moved most this period
- Narrative summary generated per cohort

### 7.5 Risk & Escalation
- High-risk case counts and trend (**counts only, zero identity**)
- Cohort concentration, k-masked
- Outreach funnel: flagged → offered → accepted → session held → follow-up
- Time-to-contact SLA
- Crisis-resource utilization

### 7.6 Engagement & Participation
- Participation funnel: invited → activated → assessed → repeat
- Cohorts with low participation (a leading indicator of disengagement in itself)
- TARA usage patterns, time-of-day heatmap (late-night usage is a real burnout signal)
- Activity attendance and completion

### 7.7 Programs & ROI
- Activity catalog with attendance and satisfaction
- **Program Lift**: pre/post comparison for attendees vs non-attendees
- Session spend, budget tracking, cost per employee helped
- Estimated absenteeism-days avoided, with the model's assumptions stated openly

### 7.8 Benchmarks
- Own baseline, cross-tenant anonymized mean, industry band
- Percentile position per domain

### 7.9 Reports
- Scheduled PDF/CSV: weekly pulse, monthly board deck, quarterly review
- Board-ready export with charts and the narrative summary
- Every export watermarked and audit-logged

### 7.10 Settings
- Branding (logo, colors, app name, support contact) with live preview
- Cohort dimension config + employee CSV/HRIS import
- Assessment cadence and reminder policy
- Privacy policy controls (`k`, identity mode, retention) — **shown to HR so they understand the limits are deliberate**
- Roles and seats, session pricing and payer model, billing

---

## 8. Employee app

Same MindSpace experience, tenant-branded, plus:
- Org-aware onboarding (invite/SSO, consent screen in plain language)
- Assessment cadence nudges
- Activities feed (webinars, challenges, guided content)
- **Book a therapist** — slot picker, transparent pricing, Razorpay checkout, "your employer will never see this booking"
- Personal insights: their own trends, private, always

**Non-negotiable UX rule:** every screen that collects data states who can see it, in one plain sentence. Trust is the input to data quality.

---

## 9. Design system — inherited verbatim from MindSpace

**Eucalyptus & Oat**, copied exactly so the two products are visibly one family.

```
page        #FAF7F0     mint     #A9CBAE
tint        #EDE7DA     danger   #E4574C
soft        #C7D6C9     online   #6FBE7A
mid         #8FA894
deep        #4F6B57     ← primary
deep-hover  #3A5243
base        #2C3A30     ← text
dark        #1F2B23

font       Fira Sans (serif + sans both mapped to it)
radius     0.75rem base · 18px cards · pill buttons
shadow     0 14px 32px -22px rgba(44,58,48,.22)
gradient   linear-gradient(172deg, #9FB79A → #3A5540)
```

Same `--ds-*` CSS variables, same shadcn HSL token mapping, same `tailwind.config.ts` extension block, same card/button idiom (`rounded-[18px]`, icon circle in `bg-ds-tint`, pill CTA in `bg-ds-deep`).

**Two additions this product needs:**
1. **A dark admin surface option.** Analytics consoles get stared at for an hour at a time. The dark variant keeps the same hues at inverted lightness. Tenant-switchable.
2. **A data-viz palette** derived from the brand — sequential greens for severity, a diverging eucalyptus↔terracotta ramp for delta, and a categorical set that stays distinguishable in both themes and for color-vision deficiency. Severity color is always reinforced with a label, never color alone.

**White-label mechanics:** brand tokens are CSS variables injected at runtime from the tenant document. Swapping a tenant's palette is one Firestore write — no rebuild.

---

## 10. Repo structure

```
mindspace-for-business/
├─ implementation.md
├─ src/
│  ├─ app/            routing, tenant resolver, providers
│  ├─ employee/       pages + components (ports MindSpace screens)
│  ├─ admin/          the analytics console
│  │  ├─ pages/       Overview, Explorer, Heatmap, Drivers, Risk,
│  │  │               Engagement, Programs, Benchmarks, Reports, Settings
│  │  ├─ charts/      Recharts wrappers on the brand viz palette
│  │  └─ widgets/     IndexTile, DeltaBadge, CohortHeatmap, InsightCard,
│  │                  MaskedCell, DriverBar, ItemTable
│  ├─ ops/            MindSpace internal console + clinical desk
│  ├─ components/ui/  shadcn — copied from MindSpace
│  ├─ domain/         assessments, scoring, indices, themes (pure, testable)
│  ├─ services/       firestore accessors
│  ├─ lib/            firebase, auth, tenant, formatters, viz palette
│  └─ styles/         index.css with the ds tokens
├─ netlify/functions/
│  ├─ ingest-assessment.ts     validate → pseudonymize → write signal
│  ├─ classify-session.ts      Groq → themes only, transcript discarded
│  ├─ rollup.ts                scheduled aggregation
│  ├─ insights.ts              driver analysis + insight generation
│  ├─ export-report.ts
│  ├─ booking.ts / payment-webhook.ts
│  └─ provision-tenant.ts
├─ scripts/seed-demo-tenant.ts  ← the pilot demo data generator
└─ firestore.rules
```

---

## 11. Build phases

| Phase | Deliverable | Est. |
|---|---|---|
| **P0 — Foundation** | Repo scaffold, design system ported, tenant model, auth + roles, branding engine, security rules | 1 wk |
| **P1 — Employee app** | Assessments + TARA ported and org-aware, consent flow, invites/CSV import, signal ingestion | 1–1.5 wk |
| **P2 — Analytics core** | Rollup pipeline, Overview, Wellbeing Explorer, Cohort Heatmap, k-anonymity masking | 1.5–2 wk |
| **P3 — Depth** ⭐ | Item-level analytics, theme extraction, Driver Analysis, Insight Feed, Benchmarks. **This is the demo.** | 2 wk |
| **P4 — Risk + revenue** | Risk pathway, clinical desk, therapist booking, Razorpay, payer models | 1.5 wk |
| **P5 — Programs + reports** | Activities, Program Lift/ROI, scheduled exports, board deck | 1 wk |
| **P6 — Pilot hardening** | Audit logs, retention jobs, load test, seeded demo tenant, onboarding docs | 1 wk |

**Sales-critical shortcut:** P0 + a seeded demo tenant + P2/P3 screens running on realistic synthetic data gives a **fully demoable product in ~3 weeks**, before a single real employee has signed in. Build the seeder early — you can walk into those trial conversations with the analytics already live.

---

## 12. Open decisions

| # | Decision | My recommendation |
|---|---|---|
| **D1** | Can HR see individual identities? | **No.** `aggregate_only` default; sell the privacy as the reason our data is trustworthy. Identified mode exists as a contract-level switch but we don't lead with it. |
| **D2** | White-label depth at launch | Runtime theming + custom domain on one shared deploy. Per-tenant deployments only if a contract demands it. |
| **D3** | `k` for anonymity | 5. Configurable up, never down. |
| **D4** | Cohort by *manager* | Powerful and dangerous — small teams break anonymity and it becomes a manager-surveillance tool. Enable only when team size ≥ 2k, and gate behind a contract flag. |
| **D5** | Assessment cadence | Monthly full suite + optional weekly 3-question pulse. Pulse data is what makes trends readable inside a 90-day trial. |
| **D6** | Session pricing model | Group ₹500/session/employee confirmed. Need your number for 1:1, and the default payer (company / employee / split). |
| **D7** | Subscription price | Per-employee-per-month vs. slab pricing — need your target ACV to model it. |
| **D8** | HRIS integration | CSV import at launch; API integrations post-pilot. |
| **D9** | Therapist supply | Do we have the counselor panel and booking capacity ready for pay-as-you-use demand? |

---

## 13. What I need from you to start

1. **D1 confirmed** — aggregate-only, or identified? Everything in the analytics layer branches on this.
2. **D6/D7** — 1:1 session price, default payer, and subscription pricing.
3. **Cohort dimensions the trial companies actually track** — department and location are safe assumptions; tell me if they want shift, level, or anything else.
4. **Trial timeline** — when do you need to demo?
5. **Green light on the phase order** — or tell me to jump straight to P3 screens on seeded data if the demo comes first.

Answer 1, 2 and 5 and I'll start building.
