# MindSpace for Business — AI / LLM Context & Architecture Guide

> **Quick Summary for AI Agents & LLMs:**
> MindSpace for Business is a white-labeled workplace mental wellbeing platform. It bridges employee anonymous check-ins with an actionable HR executive report. Instead of presenting raw clinical statistics or confusing index numbers, it translates workforce sentiment into plain English diagnoses, exact anonymous response headcounts, and concrete interventions (organizational policy shifts, therapist-led group sessions, and culture rituals).

---

## 1. Core Product Philosophy & Tenets

1. **Words Over Raw Metrics**: HR leads and company executives are not statisticians. They do not want to parse $p$-values, $r^2$ coefficients, or abstract composite indices. The system explains what employees are feeling, why they feel that way, and what leadership can do on Monday morning.
2. **Privacy by Construction (True Anonymity)**:
   - Check-ins do **not** collect `uid`, email, name, IP, or device fingerprints.
   - Coarse cohort attributes (department, work pattern, tenure) are optional and always include *"Prefer not to say"*.
   - The $k$-anonymity threshold ($k \ge 5$) is strictly enforced: any cohort with fewer than 5 responses is masked as *"Not enough responses"* rather than estimated or revealed.
   - In Firestore, `anonymous_checkins` is a write-only collection for employees; HR consoles only read aggregated snapshots.
3. **Diagnose Root Causes, Not Symptoms**:
   - *"People are working late because commitments are made without a capacity check"* beats *"Burnout is up 12%"*.
4. **Two Kinds of Fixes (Both Required)**:
   - **Part 1 — Policy & Workflow Changes**: Change how work is planned, bounded, and recognized (e.g., hard cutoff for after-hours messaging, visible sprint capacity caps).
   - **Part 2 — Therapist Sessions & Company Rituals**: Provide off-ramps and recovery (MindSpace therapist-led workshops, confidential group therapy circles @ ₹500/seat, private 1:1 counseling, and peer recognition rituals).

---

## 2. System Architecture & User Flows

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPLOYEE FLOW (/check-in)                │
│  - Pressure & Body (Stress assessment, 10 items)           │
│  - Worry & Restlessness (Anxiety assessment, 10 items)      │
│  - Mood & Energy (Depression assessment, 10 items)          │
│  - Pressure Chips (16 workplace themes)                    │
│  - Unlinked anonymous free-text note (optional)             │
│  - Private "Just for you" reflection + Therapist outreach   │
└──────────────────────────────┬──────────────────────────────┘
                               │ saveCheckIn()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              ANONYMOUS RESPONSE STORE (Local / Firestore)   │
│  - Storage: localStorage (demo) or Firestore write-only doc │
│  - Zero personal identifiers written                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ buildSnapshotFromCheckIns()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           ANONYMISED AGGREGATE (FeelingSnapshot)            │
│  - Headcount, participation rate, and 4 mood tiers          │
│  - Toughest individual question items across workforce      │
│  - Ranked themes + k-masked team breakdowns                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ generateWellbeingReport()
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
┌───────────────────────────────┐           ┌───────────────────────────────┐
│     GEMINI 2.5 FLASH AI       │           │      LOCAL RULES ENGINE       │
│  - Netlify Function proxy or  │ (fallback)│  - Deterministic synthesis    │
│    direct API call            │──────────>│  - Zero API dependency        │
│  - Returns WellbeingReport    │           │  - Guaranteed uptime          │
└───────────────┬───────────────┘           └───────────────┬───────────────┘
                │                                           │
                └─────────────────────┬─────────────────────┘
                                      │ Cached in localStorage (fingerprinted)
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  HR ADMIN CONSOLE (/admin)                  │
│  1. /admin/report    - The Verdict, Narrative & Priorities │
│  2. /admin/feelings  - 4 Groups & Team Breakdown            │
│  3. /admin/pressures - Ranked Root-Cause Pressures          │
│  4. /admin/actions   - Policy Changes & Therapist Sessions  │
│  5. /admin/data/*    - Deep Analytics (Heatmap/Drivers)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Application Routing & Pages

| Route | Component | Audience | Description |
|---|---|---|---|
| `/` | `src/pages/LandingPage.tsx` | All / Public | Main landing page highlighting unlimited assessments, ₹500 pay-as-you-use therapy, ₹1,20,000/yr enterprise platform pricing, and dual CTAs. |
| `/check-in` | `src/employee/CheckInPage.tsx` | Employees | 5-minute anonymous check-in with 3 core clinical modules, feeling chips, optional note, and private self-reflection. |
| `/login` | `src/pages/LoginPage.tsx` | HR / People Team | Authentication screen with floating white card on organic green background. |
| `/admin/report` | `src/admin/pages/ReportPage.tsx` | HR Admins | The Executive Verdict: Plain-English executive briefing, 100-person visual grid, What's working vs. What needs attention, unattributed employee voices, and top 3 priorities. |
| `/admin/feelings` | `src/admin/pages/FeelingsPage.tsx` | HR Admins | Workforce breakdown across 4 mood tiers (Doing well, Holding steady, Running on empty, Needs real support), team-by-team status, and hardest individual survey items. |
| `/admin/pressures` | `src/admin/pages/PressuresPage.tsx` | HR Admins | Ranked workplace pressures (Workload, Sleep, Long hours, Recognition, Manager alignment), severity badges, affected employee headcounts, and root-cause explanations. |
| `/admin/actions` | `src/admin/pages/ActionsPage.tsx` | HR Admins | Action plan divided into: (1) Organizational policy changes (capacity caps, no-ping windows), and (2) Hostable company workshops, therapist-led decompression circles, and private 1:1 counseling. |
| `/admin/data/heatmap` | `src/admin/pages/CohortHeatmapPage.tsx` | HR Analysts | Detailed cross-cohort domain matrix ($k$-masked). |
| `/admin/data/explorer`| `src/admin/pages/WellbeingExplorerPage.tsx` | HR Analysts | Item-level question scoring distributions and delta shifts. |
| `/admin/data/drivers` | `src/admin/pages/DriverAnalysisPage.tsx` | HR Analysts | Cohort-level theme prevalence and explained variance ($r^2$). |

---

## 4. Key Domain Types & Data Contracts

### 4.1 Anonymous Check-In (`src/domain/check-in.ts`)
```typescript
export interface AnonymousCheckIn {
  id: string;              // Random submission UUID (not a user ID)
  submittedAt: string;     // ISO timestamp
  team: string;            // e.g. "Engineering", "Operations", or "Prefer not to say"
  workPattern: string;     // e.g. "Mostly on-site", "Hybrid", "Fully remote", "Shift-based"
  tenureBand: string;      // e.g. "Less than a year", "1–3 years", "5+ years"
  domains: CheckInDomainResult[]; // Assessment scores for stress, anxiety, depression
  feelings: Theme[];       // Selected pressure chips mapped to Theme taxonomy
  note: string;            // Unattributed free-text note (max 600 chars)
}
```

### 4.2 Aggregated Snapshot (`src/domain/snapshot.ts`)
The anonymous rollup sent to the report generation engine:
- `moodTiers`: Counts and shares for `thriving`, `steady`, `strained`, `struggling`.
- `toughestSignals`: Top individual survey questions with highest severity rates.
- `themes`: Theme mention counts, shares, and severity means.
- `teams`: Team responses, strain shares, and top feeling (with `masked: true` if $n < 5$).
- `voices`: Array of unattributed note strings.

### 4.3 Synthesized Wellbeing Report (`src/domain/wellbeing-report.ts`)
Validated by Zod (`wellbeingReportSchema`):
- `mood`: `'good' | 'okay' | 'strained' | 'struggling'`
- `headline`: Single-sentence executive takeaway.
- `summary`: 2–4 paragraphs telling the story of this cycle.
- `whatThisMeans`: Business impact interpretation.
- `goingWell`: 3 specific positive achievements.
- `needsAttention`: 3 specific friction areas.
- `howPeopleFeel`: Headcounts and descriptions for the 4 mood tiers.
- `inTheirWords`: Quotes extracted from anonymous notes.
- `whatsWeighing`: Ranked workplace pressures with `plainLanguage`, `affected`, `whoMostly`, and `rootCause`.
- `teamPulse`: Team-by-team sentiment verdict with $k$-anonymity enforcement.
- `cultureChanges`: Concrete organizational changes with steps and effort level.
- `activities`: Hostable sessions (Therapist-led workshops, decompression circles, culture rituals).
- `doThisFirst`: Top 3 immediate actions for the current week.

---

## 5. AI Synthesis & Dual-Engine Fallback

The reporting layer uses a resilient dual-engine approach (`src/services/gemini-service.ts`):
1. **Primary (Gemini 2.5 Flash)**:
   - In production, calls `netlify/functions/generate-report.mts` (keeping `GEMINI_API_KEY` server-side).
   - In local dev, can use `VITE_GEMINI_API_KEY` or the proxy endpoint.
   - Output is strictly validated against `wellbeingReportSchema` using Zod.
2. **Fallback (`writeLocalReport`)**:
   - If Gemini is unconfigured, rate-limited, or returns invalid JSON, the built-in deterministic rules engine writes the report instantly using pre-tested occupational health templates.
   - The UI displays provenance (`writtenBy: 'gemini' | 'local'`) transparently.
3. **Caching**:
   - Reports are hashed by snapshot fingerprint and cached in `localStorage` under `mindspace.business.report.v1`.

---

## 6. Directory Map & Key Files

```
c:\Lucide Tech\mindspace-for-business\
├── netlify/
│   └── functions/
│       └── generate-report.mts     # Serverless Gemini proxy for report synthesis
├── scripts/
│   └── seed-demo-tenant.ts         # Generates synthetic tenant data for demos
├── src/
│   ├── admin/
│   │   ├── AdminLayout.tsx         # Sidebar navigation, theme toggle, copy link
│   │   ├── ReportContext.tsx       # Shared report & snapshot state across tabs
│   │   ├── pages/
│   │   │   ├── ReportPage.tsx      # Main executive wellbeing report
│   │   │   ├── FeelingsPage.tsx    # 4 mood tiers & team breakdown
│   │   │   ├── PressuresPage.tsx   # Ranked workplace issues & root causes
│   │   │   ├── ActionsPage.tsx     # Policy changes & therapist session catalog
│   │   │   ├── CohortHeatmapPage.tsx # Cohort x Domain matrix (detailed data)
│   │   │   ├── WellbeingExplorerPage.tsx # Item-level question browser (detailed data)
│   │   │   └── DriverAnalysisPage.tsx # Correlation & driver ranking (detailed data)
│   │   └── widgets/
│   │       ├── MoodMark.tsx        # Visual mood badge & status indicator
│   │       ├── PageHeading.tsx     # Standardized page headers & skeleton loaders
│   │       ├── PeopleGrid.tsx      # 100-figure icon grid representing workforce %
│   │       └── ProportionBar.tsx   # Color-coded tier & magnitude progress bars
│   ├── app/
│   │   ├── AuthContext.tsx         # HR authentication state & demo accounts
│   │   ├── RequireHrAuth.tsx       # Route guard redirecting to /login
│   │   └── TenantContext.tsx       # Organization branding & policy provider
│   ├── components/
│   │   └── ui/                     # shadcn-compatible Radix UI primitives (Button, Card, Badge, etc.)
│   ├── data/
│   │   └── demo/                   # Seeded organization, members, and rollups
│   ├── domain/
│   │   ├── assessments.ts          # Clinical assessment questions (Stress, Anxiety, Depression, etc.)
│   │   ├── check-in.ts             # Check-in model, feeling chips, and domain framing
│   │   ├── cohorts.ts              # Cohort dimensions and k-anonymity constants
│   │   ├── snapshot.ts             # Anonymized aggregate builder from raw check-ins
│   │   ├── themes.ts               # 20-theme workplace issue taxonomy & labels
│   │   ├── types.ts                # Organization, Member, OrgRollup interfaces
│   │   └── wellbeing-report.ts     # WellbeingReport schema & rule-based local writer
│   ├── employee/
│   │   └── CheckInPage.tsx         # Multi-step anonymous employee check-in experience
│   ├── lib/
│   │   ├── firebase.ts             # Firebase Auth & Firestore client configuration
│   │   ├── tenant-theme.ts         # Runtime CSS variable theme engine (Eucalyptus & Oat)
│   │   ├── tier.ts                 # Mood tier colors, labels, and helper formatters
│   │   └── utils.ts                # cn() classname merger
│   ├── pages/
│   │   └── LoginPage.tsx           # HR team login page with pre-filled demo hint
│   ├── services/
│   │   ├── analytics-service.ts    # Rollup loader (swaps demo and live Firestore data)
│   │   ├── demo-data.ts            # Static demo tenant loader
│   │   ├── gemini-service.ts       # AI report generator with prompt & caching
│   │   ├── response-store.ts       # Anonymous check-in persistence (localStorage / Firestore)
│   │   └── snapshot-service.ts     # Snapshot provider (swaps demo & live data based on k >= 5)
│   ├── styles/
│   │   └── index.css               # Eucalyptus & Oat design system tokens (light/dark)
│   ├── App.tsx                     # Top-level React Router routes & providers
│   └── main.tsx                    # React DOM entry point
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 7. Environment Variables & Demo Accounts

### 7.1 Environment Configuration (`.env`)
```bash
# Production Gemini Proxy
VITE_REPORT_ENDPOINT=/.netlify/functions/generate-report

# Server-Side API Key for Netlify Function
GEMINI_API_KEY=your_gemini_api_key

# Optional: Local direct Gemini key (demo only)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional: Firebase Config (leave empty to use built-in demo mode)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

### 7.2 Built-In Demo Accounts (Active when Firebase is unconfigured)
- **Email:** `hr@mindspace.example`
- **Password:** `wellbeing2026`
- **Name:** Priya Raghavan (Head of People)
- **Alternate:** `people@mindspace.example` / `wellbeing2026` (Daniel Okafor)

---

## 8. Common Developer Workflows

- **Run Dev Server:** `npm run dev` (starts on `http://localhost:5174`)
- **Typecheck Codebase:** `npm run typecheck` (`tsc -b --noEmit`)
- **Simulate Real Check-Ins:**
  1. Open `http://localhost:5174/check-in` in an incognito window or normal tab.
  2. Complete 5 or more check-ins with different teams and answers.
  3. The HR console at `http://localhost:5174/admin/report` will automatically transition from the seeded demo dataset to live anonymous check-ins!
- **Force Rewrite Report:** Click **"Rewrite report"** on `/admin/report` to clear the cache and re-trigger Gemini / the rules engine.
