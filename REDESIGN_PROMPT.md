# PROMPT — Redesign the "Qatar 2030 Labor Market Intelligence" dashboard as a data story

You are a senior data-journalism engineer and product designer (think NYT Graphics / The Pudding / Reuters Graphics quality) with strong TypeScript, React and D3 skills. Your job is to **completely redesign and rebuild** an existing analytics dashboard into a **narrative, scroll-driven data story with an embedded explorer**, so that a non-technical reader (a minister, a Qatar Foundation executive, a university dean, a parent, a student) understands the situation in Qatar's labour market in under 5 minutes, and an analyst can still drill into every number.

Work autonomously end to end. Do not ask me questions before starting; make sensible decisions, document them in a `DECISIONS.md`, and keep going. Finish with a working, deployable project.

---

## 1. Context: what exists today

The folder you have access to contains a Streamlit app (`app.py`, ~1,170 lines), a theme file (`.streamlit/config.toml`), a `README.md`, and a `data/` folder with CSVs and two PNGs. The live version is at
https://apptar-dashboard-hck3shi5tcffxmt9cjdsvy.streamlit.app/

It was built as a **CMU Tepper MSBA Capstone (2025)** for **Qatar Foundation's Higher Education Division — the "Qatar Human Capital Manara" initiative** (QF's flagship project, launched 2021, to understand the future of work and guide skills-based training across Education City universities). The analysis compares **what Qatar's strategic documents say the 2030 economy will need** against **what employers in Qatar are actually hiring for today**, across **5 future scenarios** and **8 sectors**.

### Why it needs a redesign (observed problems — fix all of them)
- It is a wall of 9 tabs, 5 KPI cards and ~25 charts with no narrative. A first-time viewer cannot tell what the point is.
- Jargon everywhere: "calibration score", "normalized adjusted weight", "signal-count penalty", "posting_freq", "S1/S2/S3…", snake_case labels (`technology_digital`, `near_term`) leak into the UI.
- Colour semantics are inconsistent and sometimes inverted (one heatmap uses **green = under-supplied / red = over-supplied**, the executive summary uses red for the biggest gap). Scenario colours (blue/orange/green/purple/red) collide with sector colours and with the red/amber/blue Qatarization colours.
- Dark theme with muddy maroon on navy; low contrast; small axis text; truncated labels (`str[:28]`).
- Filters live in a sidebar and silently change every chart, including the "Executive Summary" text, so the headline findings are unstable.
- Charts have no "so what" — titles describe the chart, not the insight.
- The methodology (how a gap score is computed) is buried in a "Guide & Definitions" tab that nobody opens.
- Static PNGs from the pipeline are embedded alongside interactive charts, duplicating content.
- Hard-coded numbers in the UI (`41` sources) disagree with the data (33 unique source IDs — see §3).

Your output must be unrecognisable from this in quality, while remaining 100% faithful to the underlying data and method.

---

## 2. The deliverable

### 2.1 Recommended stack (use this unless something is impossible)
- **Next.js (App Router) + TypeScript + Tailwind CSS** — static export, no backend, deployable to Vercel (or any static host) in one command.
- **Charts:** **D3** (scales, shapes, layouts) rendered as React SVG components (you may use **visx** as the React wrapper) for all bespoke narrative charts; **Recharts** (via shadcn/ui charts) is acceptable only for standard bar/line charts in the explorer section.
- **Scrollytelling:** `react-scrollama` (or Motion's `useScroll`/`useInView`) for step-triggered chart state changes with a sticky graphic.
- **Motion** (`motion` / framer-motion) for number count-ups, chart transitions, section reveals, and a top progress bar.
- **shadcn/ui** for tabs, tooltips, popovers, select, sheet/drawer, table, toggle.
- **Data:** a build-time script (`scripts/build-data.ts`, run with `tsx`) that reads every CSV in `data/`, cleans labels, computes all aggregates the story needs, and writes typed JSON into `src/data/*.json`. No CSV parsing at runtime. Keep the original `data/` folder untouched.
- Fonts: a serif display face for headlines (e.g., Fraunces or Newsreader) + a humanist sans for body/UI (e.g., Inter or IBM Plex Sans). Arabic-compatible fallbacks (IBM Plex Sans Arabic / Noto Naskh Arabic) so that any Arabic strings render well.
- Lighthouse ≥ 90 on Performance/Accessibility/Best Practices; WCAG AA contrast; full keyboard navigation; `prefers-reduced-motion` respected.

Fallback (only if explicitly required to stay on Streamlit Cloud): a single-page Streamlit app with custom components. If you take this route, say so in `DECISIONS.md` and still implement the narrative structure below.

### 2.2 Project structure (indicative)
```
qatar-2030-story/
  data/                      # original CSVs, untouched
  scripts/build-data.ts      # CSV -> JSON pipeline (typed, tested)
  src/
    app/                     # Next.js routes: / (story), /explore, /methodology, /sources
    components/story/        # one component per chapter
    components/charts/       # D3/visx chart components
    components/ui/           # shadcn
    data/                    # generated JSON + context.json (see §5)
    lib/                     # labels, colours, formatters, glossary
  DECISIONS.md
  README.md                  # how to run, how to update data, how to deploy
```

---

## 3. The data (read this carefully; verify every claim by inspecting the CSVs yourself)

All files are in `data/`.

| File | Rows | What it is |
|---|---|---|
| `scenario_gap_analysis.csv` | 280 | **Primary table.** One row per (scenario, sector, skill_category). Columns: `calibration_score` (0–1, strategic demand from sources), `posting_freq` (share of job postings mentioning this skill), `gap_score` = calibration − posting_freq (−1..1), `demand_label`, `qatarization_relevance` (high/medium/low), `time_horizon` (near_term/medium_term/both), `supporting_sources`, `source_titles`. |
| `scenario_skill_matrix.csv` | 280 | Strategy-side only. `normalized_score` (0–1 within scenario), `signal_count`, `all_specific_skills` (long comma lists of concrete skills — great for tooltips / "what does this skill actually mean"). |
| `scenario_skill_weights.csv` | 276 | Per-scenario skill importance: `normalized_weight` (0–1), `penalty`, `adjusted_weight`, `sector`, `scenario_label`. |
| `scenario_coefficients.csv` | 74 | Per (scenario, source): `total_weighted`, `signal_count`, `avg_quality`, `avg_scenario_w`, `publisher`, `data_quality`. Model transparency. |
| `scenario_sources_raw.csv` | 321 | **Audit trail.** One row per skill signal extracted from a publication: `source_id`, `source_title`, `source_publisher`, `source_year`, `source_url`, `scenario`, `sector`, `skill_category`, `specific_skills`, `demand_direction`, `demand_score`, `demand_rationale`, `evidence_quote`, `data_quality`, `quality_weight`, `scenario_weight`, `weighted_score`. |
| `scenario_calibration.csv` | 368 | Calibration lookup (adds `naics_prefix`, `sector_label`). |
| `sector_function_distribution.csv` | 285 | Job-posting side: count and % of postings by `sector` × `jobFunction`. Sums to 1,848 postings (not 5,067 — see caveats). |
| `scenario_skill_weights.png`, `scenario_coefficient_report.png` | — | Static matplotlib exports from the pipeline. Do **not** embed; rebuild everything interactively. |

### Key facts already computed from the data (re-verify)
- 280 scenario×sector×skill combinations; **224 have a positive gap** (strategy expects more than the market hires); 56 are aligned or over-supplied.
- **160 distinct skill categories**, 8 sectors, 5 scenarios.
- Rows per scenario are very uneven: S1 = 137, S3 = 82, S2 = 25, S4 = 18, S5 = 18. Show this honestly (coverage differs; S4/S5 findings rest on fewer signals).
- `gap_score` distribution: median 0.09, 75th percentile 0.17, max **0.989** (digital transformation, Technology & Digital, S1). Only 2 rows are "↑↑ Strong increase" (≥0.6); 73 are "↑ Moderate" (0.2–0.6); 205 "→ Stable".
- Average gap by sector (all rows): Technology & Digital 0.196 › Healthcare 0.121 › Energy & LNG 0.108 › Education 0.085 › Cross-sector 0.079 › Finance 0.069 › Tourism 0.005 › Construction −0.010.
- Average gap by scenario: S4 Knowledge Economy 0.171 › S5 Regional Hub 0.119 › S3 Green 0.094 › S1 Diversification 0.092 › S2 Hydrocarbon 0.091.
- Top gaps: digital transformation (0.99 S1, 0.78 S3), digital literacy & data skills (0.43 S3), data analytics & AI (0.39 S1), clean energy integration (0.38 S3), AI/ML (0.38 S3), R&D (0.38 S1), fintech & digital banking (0.37 S1), cybersecurity (0.35 S1), logistics analytics / digital logistics (0.33 S5), green hydrogen production (0.31 S3), digital literacy & AI competency training in Education (0.31 S4).
- Over-supplied (market hires far more than strategy emphasises): cultural tourism management (−0.27), construction project management (−0.27), energy operations management (−0.20), digital infrastructure management (−0.17), international education management (−0.17). Frame these as "the market is already doing this — no intervention needed", not as "bad".
- Qatarization relevance: 204 high / 74 medium / 2 low. Time horizon: 179 both / 72 medium-term / 29 near-term.
- Job postings by sector (from `sector_function_distribution`): Healthcare 685, Technology 356, Tourism 250, Energy 135, Cross-sector 129, Construction 111, Finance 107, Education 75.
- Sources: **33 unique `source_id`s** / 321 signals. Publishers include QNV 2030, NDS3, Ministry of Labour (Qatarization policy), PSA Labour Force Survey 2023, Qatar Tourism Strategy 2030, Qatar National Health Strategy 2024-30, Qatar Logistics 2030, QFZA, QSTP, HBKU, Sidra, QF Higher-Ed strategy, IMF/World Bank, ILO, OECD, UNESCO, IEA, IRENA, WEF (2), McKinsey, Kearney, Strategy&, Deloitte, Oxford Economics, Goldman Sachs, Morgan Stanley, RAND, Brookings. Demand direction: 203 strong increase, 116 moderate increase, 2 moderate decrease.

### Data caveats you must handle (and disclose in the methodology page)
1. The UI and README say **41 sources**, but the data has **33 unique `source_id`s**, and two pairs are duplicates (`QNDS2`/`QNDS3` both titled "Qatar Third National Development Strategy 2024-2030"; `QF_EDU_STRATEGY`/`QF_EDU_WEBSITE` both "Education for a New Era"). Count from the data and label precisely, e.g. "33 publications · 321 evidence signals". If you keep "41" anywhere, footnote why.
2. README says 5,067 job postings; the posting-side file sums to 1,848. Use "5,067 Qatar job postings analysed" only as a methodology statement from the team; the chart of posting mix should say "1,848 classified postings shown".
3. `gap_score` is a difference of two very differently scaled quantities (strategic demand 0–1 vs posting share mostly 0–0.17). Explain it in plain words; never present it as a percentage.
4. Snake_case codes must be mapped to human labels everywhere: sectors (`technology_digital` → "Technology & Digital"), horizons (`near_term` → "Next 2–3 years", `medium_term` → "By 2030", `both` → "Now and through 2030"), relevance (`high` → "Priority for Qatari talent").
5. Some `specific_skills` strings are duplicated/semicolon-joined; de-duplicate for display.
6. A U.S. historical benchmark dataset (`historical_skillasign_0406_2.zip`) is mentioned in the README but is **not** in the folder; skip that tab unless the file is provided.

---

## 4. The story — chapter by chapter

Build a single long-scroll page (`/`) with a fixed, slim chapter navigator (dots or numbered rail) and a reading-progress bar. Each chapter = a sticky graphic on one side with scroll-stepped text on the other (desktop), stacked on mobile. Every chart has: an **insight title** (a sentence stating the finding), a one-line subtitle explaining how to read it, a source footnote with hover detail, and an "Explore this →" link that deep-links into the explorer with the matching filters.

Use a **plain-language vocabulary** throughout, with the technical term available on hover (glossary tooltip):
- `gap_score` → **"Shortfall"** ("how far hiring lags behind the strategy", −1 to +1)
- `calibration_score` → **"Strategic demand"** (0 = no source mentions it, 1 = strongest, most-cited need)
- `posting_freq` → **"Market hiring today"** (share of job ads asking for the skill)
- `qatarization_relevance` → **"Priority for Qatari talent"**
- `normalized_weight` → **"Importance within this future"**
- Scenarios → "Five futures", each with a plain subtitle (below).

### Chapter 0 — Cover
Full-bleed opening: title in the spirit of *"Qatar is building a 2030 economy. Is it hiring for it?"*, one-paragraph standfirst, byline (CMU Tepper MSBA Capstone 2025 for Qatar Foundation's Qatar Human Capital Manara; names from README), a quiet animated background (e.g., 280 small dots that will later become the gap chart), and three animated headline numbers: **224 skill shortfalls**, **8 sectors**, **5 futures**. CTA: "Scroll to begin" and "Skip to the explorer".

### Chapter 1 — The country in one screen (context layer, see §5)
Set the scene in 4–5 scroll steps with one evolving graphic (a stacked unit chart of the labour force):
- 3.1 million people; labour force ~2.2 million; **94% of workers are non-Qatari** (23 non-Qataris for every Qatari).
- Of ~127,000 Qataris in the labour force, **~10,000 (under 1%) work in the private sector**; most Qataris work in government.
- The economy is already ~two-thirds non-hydrocarbon, yet exports and revenue still lean on gas; LNG capacity is being expanded from 77 to 142 Mtpa by 2030.
- The state's answer: **NDS3 (2024–2030)** targets — >20% of Qataris in private/mixed sectors (from 17%), >46% of the workforce in skilled/high-skilled jobs, >18% of graduates in STEM, 2% annual productivity growth; a 2024 private-sector nationalisation law; a Ministry of Labour workforce strategy aiming to place ~16,000 Qataris in the private sector.
- The question this project answers: *are employers hiring for that future yet?*

### Chapter 2 — Five futures
Explain scenario thinking in one sentence ("we don't know which Qatar arrives in 2030, so we tested five"). Present the five as cards that expand into a mini-vignette ("What Doha looks like in 2030 if…"), each with its colour, its plain subtitle, how many evidence signals support it, and its top 3 skills:
- **S1 Diversification Acceleration** — "The National Vision stays on track; every sector grows."
- **S2 Hydrocarbon Dominance** — "Gas pays for everything a while longer."
- **S3 Green Transition Pressure** — "Decarbonisation arrives faster than planned."
- **S4 Knowledge Economy Leap** — "Qatar becomes a research and AI hub."
- **S5 Regional Hub & Geopolitical Pivot** — "Qatar as the Gulf's logistics, finance and diplomacy centre."
Make S1 visibly the baseline and show evidence coverage per scenario (137/82/25/18/18 rows) as a small honesty strip.

### Chapter 3 — What the strategy asks for
Sticky graphic: a "library" of 33 publications (small tiles grouped by publisher type: Qatar government · Qatar Foundation entities · international organisations · consultancies/banks), sized by number of signals, colour by data quality. Steps: how skills were extracted (an evidence quote → skill → direction → weight), then morph into the **top 15 skills by scenario** (from `scenario_skill_weights`). Let the reader click a tile to see its real `evidence_quote`s from `scenario_sources_raw.csv`.

### Chapter 4 — What employers are hiring for today
Sticky graphic: posting mix by sector (Healthcare 685, Technology 356, Tourism 250 …) then by job function. Message: today's job ads are dominated by healthcare delivery, hospitality and operations/management roles; digital and research roles are a thin slice.

### Chapter 5 — The gap (the hero reveal)
1. **Animated explainer** of the shortfall metric: two horizontal bars for one skill (digital transformation): strategic demand 1.00 vs market hiring 0.005 → shortfall 0.99. Then a second, aligned example (construction project management: 0.06 vs 0.17 → −0.27, "market already covers this").
2. **Dumbbell/connected-dot chart** for the top 20 shortfalls: left dot = market hiring, right dot = strategic demand, line length = shortfall, coloured by sector, labelled in plain language, hover shows `all_specific_skills` and which publications support it.
3. The 280 dots from the cover reassemble into a **beeswarm/strip plot of all shortfalls** by sector, so the reader sees distribution, not just the top 20 (most gaps are modest; a handful are extreme).

### Chapter 6 — Where it hurts most
Redesigned **sector × scenario matrix**: a clean heatmap, single sequential colour scale (light → deep maroon = bigger shortfall; a distinct cool tint for negative/over-supplied), big readable cells with the number and a plain word ("Severe / Notable / Aligned / Covered"), sorted by average. Insight title along the lines of: *"Technology & Digital is behind in every future; Tourism and Construction are already covered."*

### Chapter 7 — Safe bets (no-regret moves)
Skills that are a shortfall in **4 or 5 of the 5 futures** — robust to uncertainty. Show as a ranked chart with 5 small scenario pips per skill. Message: "Whatever 2030 looks like, these are needed." Pair with "Scenario-specific bets" (shortfalls that appear in only one future, e.g., green hydrogen in S3, diplomatic communication in S5).

### Chapter 8 — The Qatari talent lens
73% of shortfalls are flagged high-priority for Qatari talent. Show the share, then the top high-priority shortfalls, and connect to the national targets from Chapter 1 (20% private-sector Qatari target; the ~7,900 Qataris already placed vs the 16,000 goal — from the context layer). Add one human paragraph: surveys show most young Qataris still prefer public-sector careers and feel under-informed about private-sector requirements — the shortfall is partly an information and pathways problem, which is exactly Manara's remit.

### Chapter 9 — What this means for Manara (recommendations)
Action cards grouped by horizon (Next 2–3 years / By 2030) and by type (new programmes · curriculum changes · bridge/upskilling · research), each tied to specific shortfalls and the publications that support them. Derive these from the data (e.g., top high-priority, multi-scenario shortfalls) — do not invent policies. Include a one-click "Download the executive brief (PDF)" that renders Chapters 5–9 as a clean 2-page print stylesheet.

### Chapter 10 — Explore the evidence yourself (`/explore`, also reachable by scrolling)
The full interactive explorer, redesigned:
- Global filter bar at the top (not a sidebar): futures (multi-select chips), sectors, priority for Qatari talent, horizon, text search. Filters never change the story text above; they only drive the explorer. URL-encoded state so views are shareable.
- Views: Shortfall ranking · Sector × future matrix · Skill detail (drill into one skill: all scenarios, all sources, specific skills, evidence quotes) · Source detail · Model transparency (source contributions per scenario, quality weights, the signal-count penalty, from `scenario_coefficients.csv`) · Data tables with CSV download.
- `/methodology`: plain-language explanation plus the exact formulas (demand score +2/+1/0/−1/−2; quality weights 1.5/1.0/0.5; scenario weights; `sqrt(scenario_signals/max_signals)` penalty; normalisation; gap = calibration − posting share), the data caveats from §3, and how to update the data (drop new CSVs into `data/`, run the build script).
- `/sources`: the 33 publications with links, years, publishers, quality, number of signals, and expandable evidence quotes.

---

## 5. Context layer (new, small, verified — do not over-scope)

Keep the capstone data as the analytical core. Add only a **thin layer of hand-verified public figures** for scene-setting, stored in `src/data/context.json` with `{value, label, source, url, asOf}` for each item and rendered with a visible source footnote. Mark them clearly as "national context", never as outputs of the model. Use these (re-check the numbers against the linked sources when you build):

| Fact | Value | Source |
|---|---|---|
| Population (2023) | 3.1 million | IMF 2024 Article IV (Feb 2025) — https://www.imf.org/en/news/articles/2025/02/11/pr25034-qatar-imf-executive-board-concludes-the-2024-article-iv-consultation |
| Non-hydrocarbon share of GDP (2025 proj.) | ~64% | IMF Article IV staff report tables — https://www.elibrary.imf.org/view/journals/002/2025/047/article-A001-en.xml |
| Labour force 15+ (2024), Qataris vs non-Qataris | 2,240,506 total; 127,477 Qatari; 2,113,029 non-Qatari | NPC Labour Force Survey 2024 via GLMM — https://gulfmigration.grc.net/qatar-economically-active-population-aged-15-years-and-above-by-nationality-qatari-non-qatari-and-activity-sector-2024/ |
| Qataris in the private sector (2024) | 10,223 of 1,775,873 private-sector workers (0.6%) | same |
| Non-Qataris per Qatari in labour force | ~23 to 1; Qatari women LFPR 43% vs men 66% | ILO Qatar factsheet, Aug 2025 — https://www.ilo.org/sites/default/files/2025-10/Qatar_Employment_Environment_Factsheet_v5.pdf |
| NDS3 2030 targets | >20% of Qataris in private & mixed sectors (17% in 2023); >46% of workforce in skilled/high-skilled jobs; >18% STEM graduates; 2% productivity growth; PISA 483 | NPC NDS3 — https://www.npc.qa/en/planning/nds3/Pages/strategicalnationaloutcome.aspx?index=0 and https://www.moph.gov.qa/english/NHS/Documents/QNDS3_EN.pdf |
| Ministry of Labour workforce strategy 2024–2030 | 3 phases (2024-25 foundations, 2026-27 capacity, 2028-30 transformation); ~16,000 Qataris into private sector; high-skilled expat share 20%→24% | QNA, 4 Nov 2024 — https://qna.org.qa/en/news-bulletins-details?date=4%2F11%2F2024&id=0088-minister-of-labour%C2%A0launches%C2%A0national-strategy-for-effective-and-highly-productive-workforce-2024---2030 |
| Qataris placed in private sector so far | 7,861 (as of Feb 2026); Law No. 12 of 2024 on private-sector nationalisation | QNA, 17 Feb 2026 — https://qna.org.qa/en/news/news-details?date=17%2F02%2F2026&id=under-patronage-of-prime-minister-mol-launches-qatar-nationalisation-award-for-private-sector |
| Digital Agenda 2030 | 26,000 new ICT jobs and QAR 40bn digital-economy impact by 2030; 64% of tech firms report hiring difficulty; digital workforce ~21k (2021) | MCIT DA2030 — https://www.mcit.gov.qa/-/media/c9e7d93950d140aeb750303886c67494.ashx |
| LNG expansion | 77 → 142 Mtpa by 2030 (North Field East/South/West); ~65,000 workers for the build-out; Tawteen targets 5,000+ white-collar local jobs | QatarEnergy / Gulf Times — https://www.qatarenergy.qa/en/whoweare/Pages/WhatIsLNG.aspx ; https://www.gulf-times.com/story/684253/ |
| External validation of the findings | WEF Future of Jobs 2025: AI & big data, networks & cybersecurity and technological literacy are the fastest-growing skills globally and in MENA; 46% of on-the-job skills in MENA expected to change by 2030 vs 39% globally | https://www.weforum.org/publications/the-future-of-jobs-report-2025/ |
| Human angle | Qatar Foundation + ILO partnership (Dec 2025) on skills mismatch and talent retention; QCDC 2025: 3,800 students in job-shadowing across 13 sectors; surveys show ~70% of young Qataris prefer public-sector work | https://www.ilo.org/resource/news/qatar-foundation-and-international-labour-organization-partner-help-shape ; https://qcdc.org.qa/news/qcdc-releases-2025-annual-report/ |

Optional (only if time permits, behind a feature flag): pull one time-series from Qatar Open Data — "Economically Active Population (15+) by Nationality, Gender & Occupation, 2017–2025" (https://www.data.gov.qa/explore/dataset/economically-active-population-15-years-and-above-by-nationality-gender-and-occupation/) — to show how the occupational mix of Qataris has shifted. Do not add any other external datasets.

---

## 6. Visual identity

- **Light, editorial, premium.** Off-white paper background (#FAF7F2 or similar), near-black text, generous whitespace, large type, a maximum content width ~1200px with full-bleed graphics where it helps.
- **Primary accent: Qatar maroon (#8A1538)** for shortfall intensity and emphasis; warm sand/gold (#C9A227) sparingly for Qatari-talent priority; a cool slate/teal only for "already covered / over-supplied" values. Negative values must never be green-vs-red "good/bad".
- **Scenario palette** (5 distinct, print-safe, colour-blind-safe hues that do not clash with maroon — e.g., a muted Okabe-Ito-style set) used **only** for scenarios. **Sector palette**: a separate, lower-saturation set used only for sectors. Never use the same hue for two different categorical dimensions.
- Number formatting: shortfall to 2 decimals, percentages with % sign, thousands separators; consistent across story and explorer.
- Micro-interactions: count-ups on first view, chart elements transition (not re-mount) between scroll steps, hover tooltips with the real `evidence_quote`, focus states visible.
- Mobile: single column, sticky graphic becomes a top-pinned 45vh panel, tap-to-reveal tooltips, no horizontal scroll.
- Optional but valued: an `EN | ع` toggle that switches the chapter titles and the glossary to Arabic (provide Arabic copy for titles, subtitles and glossary only; keep charts in English). RTL layout not required.

---

## 7. Copywriting rules

- Headlines state findings ("Technology skills are asked for 20× more often by strategy than by job ads"), not chart types.
- One idea per scroll step; ≤ 45 words per step.
- No unexplained acronyms on first use (QNV 2030, NDS3, LNG, STEM, QF).
- Every number in prose must be traceable: either computed from `data/` (link to explorer) or from `context.json` (footnote).
- Tone: confident, calm, non-partisan, respectful of Qatar's institutions; this will be shown to Qatar Foundation and possibly government stakeholders.

---

## 8. Engineering requirements

- `npm run build:data` regenerates all JSON from `data/*.csv`; `npm run dev`, `npm run build`, `npm run export` work from a clean clone. Include unit tests for the data pipeline (row counts, the 224 positive-gap count, the 33 unique sources, label mapping completeness).
- All chart components are typed, accept data via props, and are reusable in both the story and the explorer.
- No runtime network calls (fully static). No analytics or third-party trackers.
- Deployment: Vercel-ready; include a `vercel.json` if needed and a GitHub Actions workflow that runs tests and build on push. Document "how to update the data" for a non-developer (drop CSVs in `data/`, push, auto-deploy).
- Write `README.md` (what it is, how to run, how to update data, how to deploy, credits) and `DECISIONS.md` (every judgment call, especially around the data caveats in §3).
- QA before you finish: run through the story on desktop and mobile widths; check every chapter's numbers against the CSVs; run Lighthouse; check keyboard navigation and reduced motion; make sure no snake_case label or raw code (S1, near_term, technology_digital) is visible anywhere in the UI.

---

## 9. Definition of done

- A stakeholder with no data background can scroll the home page and state, in their own words: what the five futures are, what a "shortfall" is, which three skills matter most regardless of the future, which sector is furthest behind, and what Manara should do first.
- An analyst can reproduce every headline number from the explorer and download the underlying rows.
- Every chart has an insight title, a how-to-read line, and a source.
- Build, tests and Lighthouse pass; the site deploys as a static export.

Start by reading every file in `data/`, confirming the facts in §3, then write `DECISIONS.md` with your plan, then build the data pipeline, then the chapters in order, then the explorer, then polish. Go.
