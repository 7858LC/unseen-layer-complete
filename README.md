# The Unseen Layer — Complete Sermon Intelligence Platform v1.0
## Uzima Amka Ventures · UA-TOOL-001-2026

The complete sermon preparation platform. 14 diagnostic hermeneutical agents + Foundations + Sermon Brief + Original Language Word Studies. Built by a preacher, for preachers.

---

## WHAT YOU HAVE

### Stage 1 — The Unseen Layer (14 Agents)
Surfaces what the text withholds — the silence that speaks, the omission that is the sermon.

**Mode 1: Narrative (T1–T9)**
- T1 Conspicuous Non-Response — who should have spoken and didn't?
- T2 Unmentioned Condition — what did God not mention in the instruction?
- T3 Withheld Power — what could He have done that He didn't?
- T4 Curated Memory — what did they choose not to remember?
- T5 Unnecessary Announcement — why is God stating the obvious?
- T6 Quantified Devotion — what does the arithmetic reveal?
- T7 Indefensible Equity — why does this text bother us?
- T8 Homiletical Bridge — the interior the text omits (controlled eisegesis)
- T9 Canonical Typology — where does God operate by the same structural principle?

**Mode 2: Pauline / Epistolary (M1–M5)**
- M1 Undefended Premise — what does the author argue from without proving?
- M2 Uncited Source — the OT text behind the NT word
- M3 Biographical Silence — what his history supplies
- M4 Confirmatory Canon — the author ratifying himself
- M5 Withheld Conclusion — the argument he doesn't finish

### Stage 2 — Foundations
Pericope, Greek/Hebrew key terms, movement structure, theological tensions, first mention principle, cross-reference map.

### Stage 3 — Sermon Brief
Big idea, key tension, congregation need, 3-point alliterative structure, the turn, illustration seed, supporting passages, closing question for the pastor.

### Stage 4 — Word Studies
3–5 original language studies per passage. Root meaning, semantic range, first mention, key uses in Scripture, homiletical weight, one preachable insight per word.

All 4 stages run automatically on every analysis. Results appear progressively.

---

## SETUP (one time)

1. Install Node.js from https://nodejs.org (LTS version)
2. Clone or download this repo
3. In the project folder: `npm install`

---

## ADD YOUR API KEY

Create a `.env` file in the root with:
```
ANTHROPIC_API_KEY=your_api_key_here
```
Get your key at https://console.anthropic.com

---

## RUN IT

```
npm run dev
```

Open your browser to: http://localhost:5173

---

## DEPLOY TO VERCEL

1. Push to GitHub (already done)
2. Connect at vercel.com — import this repo
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy — the `api/anthropic.js` serverless function handles all Claude calls server-side

---

## CHURCH CONTEXT

Click **⚙ Context** in the header to set:
- Pastor name
- Church name and location
- Denomination
- Typical attendance
- Preferred Bible translation

Context is saved locally and personalizes the Sermon Brief and Word Studies for your congregation.

---

## ARCHITECTURE

```
src/
  App.jsx          — Main app (all 3 screens + 7 components)
  constants.js     — Taxonomies, modes, traditions, church context defaults
  prompts.js       — All 7 system prompts (agents, basics, brief, word studies)
  main.jsx         — React entry point
api/
  anthropic.js     — Vercel serverless proxy (API key never hits the browser)
```

---

## NEXT STEPS

1. Auth: clerk.dev (free tier, 10k users)
2. Database: supabase.com (persist sermon history server-side)
3. Payments: stripe.com (3 tiers already designed in the UI)
4. Custom domain: tool.uzimaamka.com

---

UA-TOOL-001-2026 · v1.0 · © 2026 Uzima Amka Ventures
