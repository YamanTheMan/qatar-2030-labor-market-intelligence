# Decisions log

Every judgement call made while rebuilding the *Qatar 2030 Labor Market Intelligence* Streamlit dashboard as a narrative data story. Grouped by topic; most important first.

## 1. Data findings that changed the story

| # | What the brief or old dashboard said | What the data says | What we did |
|---|---|---|---|
| D1 | Shortfall (`gap_score`) = strategic demand − posting share | In **all 280 rows**, `gap_score = calibration_score − 2 × posting_freq` (max residual 0.00005). | We disclose the factor everywhere the metric is explained: the Chapter 5 explainer, the glossary and `/methodology`. The "market" bar in the explainer is drawn as **2 × share of job ads**. The pipeline test asserts the identity. **Action for the team:** confirm the ×2 against `Qatar_Scenario_Pipeline_v15.ipynb`. If it is a bug, fix it upstream; the site will follow on the next `build:data`. |
| D2 | "Safe bets" = shortfall in **4 or 5** of 5 futures | No skill category is a shortfall in more than **3** futures. Nine skills reach 3. Coverage is uneven: Hydrocarbon, Knowledge economy and Regional hub have only 18–27 signals each and different skill vocabularies. | Chapter 7 says this plainly. It ranks the **nine skills that are short in three futures** and adds a *family* view: digital, data & AI skills are short in **all five** futures. The family keyword rule is shown on `/methodology`. |
| D3 | "Technology & Digital is behind in every future" | Behind in 4 of 5 futures. Regional hub has a single Technology row (cybersecurity research, −0.01). Technology & Digital has the highest average overall and the highest row in 3 of 5 futures. | The headline says "the largest shortfall overall" and the matrix shows the exception. |
| D4 | 73% of shortfalls are high-priority for Qatari talent | 204/280 rows (72.9%) are high priority, but among the **224 shortfalls** it is **165 (73.7%, rounds to 74%)**. | We say "74% of shortfalls (165 of 224)". |
| D5 | Today's job ads are dominated by "healthcare delivery" roles | Healthcare *employers* post 37% of classified ads (685/1,848), but only **38 ads (2%)** have a clinical job function. The largest functions are management & operations (20%), IT & digital (16%), unspecified "Other" (16%) and sales/business development (13%). Research & science is **13 ads (0.7%)**. | Chapter 4 separates *who is hiring* (sector) from *what for* (function). Its headline is about the research/digital slice. |
| D6 | 41 sources | **33 unique `source_id`s**, of which two pairs share a title (`QNDS2`/`QNDS3`; `QF_EDU_STRATEGY`/`QF_EDU_WEBSITE`). That is 31 distinct documents. | We print "33 source records · 321 evidence signals" with a footnote explaining the 31. We keep both records of each pair because the pipeline weights them separately, and we flag them as duplicates on `/sources`. "41" appears nowhere. |
| D7 | 5,067 job postings | The posting-side file sums to **1,848** classified postings. | "5,067 job postings analysed" appears only as a methodology statement attributed to the team. Every chart says "1,848 classified postings shown". |
| D8 | Sector × scenario matrix | Only **29 of 40** sector × future cells have any signal. | Empty cells are drawn hatched and labelled "no signal", never zero. |
| D9 | Strategic demand: "1 = the strongest, most-cited need in that future" | `calibration_score` = (weighted sum ÷ largest in its future) × signal-count balance. So only the baseline future reaches 1. The top skill elsewhere scores 0.79 (Green), 0.41 (Hydrocarbon) or 0.34 (Knowledge economy, Regional hub). | The glossary and methodology say exactly this. It also explains why thinly evidenced futures show smaller shortfalls. |
| D10 | Every signal has an evidence quote | **141 of 321** signals have an empty `evidence_quote`. | The story says "for 180 of them, the quote it rests on". Quote-less signals show their rationale. |

## 2. Context layer (national figures)

- Stored in `src/data/context.json` as `{value, label, source, url, asOf, verified, note}`. Only `verified: true` facts render. Each is footnoted and visibly labelled *national context*.
- Verified on 2026-11-08:
  - population 3.1m (IMF);
  - labour force 2,240,506, of which 127,477 Qatari and 10,223 Qatari private-sector workers (NPC LFS 2024 via GLMM);
  - Qatari women 43% vs men 66% participation (ILO);
  - LNG 77 → 142 Mtpa (QatarEnergy);
  - MoL strategy: 16,000 Qataris, 3 phases, 20% → 24% (QNA);
  - 7,861 placed (QNA Feb 2026);
  - NDS3 17% → 20% (QNA), > 46% skilled and ≥ 18% STEM and 2% productivity (Invest Qatar and Gulf Times, because npc.qa failed TLS);
  - Digital Agenda 26,000 ICT jobs and QAR 40bn (MCIT launch page);
  - WEF 2025 top-3 skills (secondary reports);
  - QF–ILO partnership (ILO, Dec 2025).
- **Changed from the brief:**
  - "23 non-Qataris for every Qatari": the ILO factsheet says this, but it contradicts the factsheet's own 94% (≈ 16:1). We use the ratio implied by the 2024 counts, **≈ 17:1**.
  - "Law No. 12 of 2024": the QNA release names the 2024 nationalisation law without a number, so we cite it without one.
  - Not rendered (could not verify): the ~64% non-hydrocarbon GDP share, WEF's MENA percentages (46% / 39%), "~70% of young Qataris prefer public-sector work" (stated qualitatively instead), QCDC 3,800 job-shadowing students, and the Tawteen and 65,000-worker figures.
- The optional Qatar Open Data time series was **not** added. It is behind no flag, to keep the site fully static and the scope tight.

## 3. Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**, `output: "export"`. Fully static, with no analytics or trackers. The one runtime network call is the dashboard map background (section 8). Fonts are self-hosted by `next/font` at build time.
- **Charts:** D3 (`d3-scale`, `d3-shape`, `d3-array`, `d3-force`) computes layouts and React renders the SVG. No Recharts, because every chart is bespoke and the explorer reuses the story's components.
- **Scrollytelling:** a ~60-line `IntersectionObserver` hook (`useScrollSteps`) instead of `react-scrollama`. Scrollama's last release predates React 19 and needs a polyfill. The hook gives step-triggered state with a sticky graphic and is easy to audit.
- **Motion** (`motion/react`) handles count-ups, section reveals, chart transitions and the progress bar. Everything is gated by `useReducedMotion`.
- **UI primitives:** shadcn/ui is a copy-paste library built on Radix. We vendored only what we use (Popover for glossary terms and tooltips, Dialog for the source drawer) in `src/components/ui/`, styled to the site. This avoids the CLI and the unused components it adds.
- **Data:** `scripts/build-data.ts` (run with `tsx`) → `src/data/*.json`. It also copies the CSVs into `public/data/` for download. The pipeline is pure (`scripts/pipeline.ts`) and unit-tested with Vitest. No CSV parsing happens at runtime.
- **Executive brief:** `/brief` is a print-stylesheet page (2 × A4) covering Chapters 5–9. "Download the executive brief (PDF)" opens it and calls `window.print()`, so the reader saves it as a PDF. A static site cannot generate a binary PDF without a headless browser in CI, and print CSS keeps the output identical to the site.

### Performance

The site was measured with Lighthouse 12 (mobile emulation) against the static export served with compression, which is what Vercel does.

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | 90 | 100 | 100 | 100 |
| `/explore` | 94 | 100 | 100 | 100 |
| `/methodology` | 93 | 100 | 100 | 100 |

What it took:
- **Split data loading.** The story loads only the light tables (shortfall rows, summary, sources). Evidence signals are loaded on demand by the source drawer, and the explorer and `/sources` load the heavy tables.
- **Mount heavy charts near the viewport** (`LazyMount`). Text is still server-rendered. This cut home-page blocking time from 1.4 s to 40 ms.
- **Cover dots** drift in 6 animated groups rather than 280 individually animated elements.
- **Fonts:** the Arabic font is not preloaded.

Remaining Lighthouse notes are host-dependent (cache headers) or come from the framework (legacy-JS polyfills).

## 4. Vocabulary & labels

- **Plain language:**
  - `gap_score` → **Shortfall**;
  - `calibration_score` → **Strategic demand**;
  - `posting_freq` → **Market hiring today**;
  - `qatarization_relevance: high` → **Priority for Qatari talent**;
  - `normalized_weight` → **Importance within this future**.
  - Every technical term is available in a glossary popover.
- **Horizons:** `near_term` → "Next 2–3 years", `medium_term` → "By 2030", `both` → "Now and through 2030".
- **Futures** are always named, never "S1…S5". The baseline (Diversification) is marked.
- **Skill categories** are sentence-cased, keeping acronyms (AI, LNG, CCUS).
- **Specific skills** are split on `,`/`;`, trimmed, and de-duplicated case-insensitively.
- **Display bands** for shortfall, on one scale for cells and rows: Severe ≥ 0.15 · Notable 0.05–0.15 · Aligned −0.05 to 0.05 · Covered < −0.05. The pipeline's own label (↑↑ ≥ 0.6, ↑ 0.2–0.6, → otherwise) is still shown in the explorer as "Pipeline label". Its thresholds leave only 2 "strong" rows, which hides the structure.
- **Over-supplied skills** are framed as "the market already covers this", never as bad.
- **Job functions** (143 raw strings) are grouped into 12 families by an ordered keyword rule (`FUNCTION_FAMILIES` in `src/lib/meta.ts`). The raw function is always visible in the explorer.
- **Publisher groups** for the source library are a hand mapping of all 33 ids (`SOURCE_GROUP`). A test fails if a new source id appears without one.

## 5. Colour

- **Paper** `#FAF7F2`, **ink** `#1B1A17`.
- **Shortfall:** a single sequential maroon ramp (`#F5E6EA` → `#8A1538` → `#4C0B1F`).
- **Covered / over-supplied:** a separate cool slate (`#4F7187`). There is no red-vs-green good/bad anywhere.
- **Gold** `#C9A227` is used only for "priority for Qatari talent" (text uses the darker `#7A5E0B` for AA contrast).
- **Scenario palette** (scenarios only): blue `#2F6DB0`, burnt orange `#C8611F`, green `#1E8A63`, purple `#8A55A6`, sky `#3C97C9`. These are muted Okabe-Ito derivatives and each has an AA-passing `ink` variant for text.
- **Sector palette** (sectors only): eight low-saturation earth tones. With 5 scenario hues, maroon, gold and slate already taken, eight fully distinct hues are not possible. So sectors are never colour-coded in the same chart as scenarios, and sector identity is always also carried by a text label.

## 6. Recommendations (Chapter 9): how they are derived

These are not policies we invented. They are a transparent rule over the data:

1. **Candidates:** skills with at least one positive, high-priority shortfall.
2. **Ranking:** by the sum of positive shortfalls across futures. This rewards size and robustness together.
3. **Type**, by an ordered keyword rule:
   - *research*: skill contains research / R&D / innovation;
   - *curriculum change*: Education sector, pedagogy or curriculum;
   - *bridge & upskilling*: literacy, reskilling, leadership, management or training;
   - otherwise *new specialist programme*.
4. **Mix:** the top 4 programmes, 2 curriculum, 2 bridge and 2 research skills, so the list is not all one type.
5. **Horizon:** "Next 2–3 years" if any shortfall row is near-term or "now and through 2030", otherwise "By 2030".
6. **Wording:** each card's action sentence comes from a fixed template per type, and the card lists the shortfall, the futures it appears in and the supporting publications.

## 7. Things deliberately not done

- The U.S. historical benchmark tab: `historical_skillasign_0406_2.zip` is not in the folder.
- The two pipeline PNGs: they are not embedded, and everything is rebuilt interactively.
- `scenario_calibration.csv`: it duplicates the gap table at NAICS-prefix level. It is downloadable but not charted.
- RTL layout: the `EN | ع` toggle switches chapter titles, standfirsts and glossary to Arabic. Charts stay in English, as the brief allows.
- The original Streamlit app (`../app.py`) is left untouched. This project lives in `qatar-2030-story/` with its own copy of the CSVs in `data/`, and the originals in `../data/` are untouched.

## 8. The dashboard (home page)

The client asked for a map-first executive dashboard in place of the scroll story. The story, explorer and brief are kept at `/story`, `/explore` and `/brief`.

**Geography is a modelled reference layer, not data.**
- The dataset has no location and no employer columns (280 rows by future × sector × skill, 321 signals, 1,848 classified job ads).
- `src/lib/hubs.ts` lists 17 real economic hubs with coordinates, a kind, and the anchor organisations commonly associated with each. A hub is linked to a data row by a rule: the row's sector is one the hub hosts, optionally narrowed by keywords in the skill name. The rule is unit-tested in `tests/hubs.test.ts`.
- A hub therefore shows "the skills of the sectors it hosts". It does not show jobs or vacancies at that site, and the organisations are for orientation only. This is stated in the "How to read this" popover, the map footer, the hub panel and `/methodology`.
- Skills linked to no hub are reported as "apply nationwide" under the hub list.
- Coordinates were checked against OpenStreetMap (Nominatim) on 2026-11-10. Al Kharsaah solar plant was placed from its Wikipedia and Global Energy Monitor entries.

**Units and thresholds.**
- A "skill" is one sector × skill pair: 163 in the data. (The story counted 160 skill names.)
- With "All futures", a skill takes its largest shortfall in any future, so a skill counts as short if any plausible 2030 leaves it short.
- In shortfall from 0.05, severe from 0.15: the pipeline's own band edges. Colour steps add cuts at 0.20 and 0.30 and mirror at −0.05 and −0.15.
- "Priority for Qatari talent" is 71% here (91 of 129 skills in shortfall). The story's 74% counted rows, not skills.
- A group of hubs drawn as one map marker pools its skills and counts each skill once.
- A chart that sets a filter ignores that filter itself, so its other options stay visible. Hub figures ignore the selected hub so hubs stay comparable.
- Job-ad charts do not change with the future selected: ads describe today.

**Map.**
- MapLibre GL JS 6.17 (pinned), loaded only on the home page. Background tiles come from OpenFreeMap (OpenMapTiles schema, OpenStreetMap data), styled in-house in `map/mapStyle.ts` for both themes. Attribution is shown under the map.
- If tiles or WebGL are unavailable, a built-in SVG outline (Natural Earth, public domain, in `src/data/geo/region.json`) shows with the same pins.
- Nearby hubs merge into one marker until the zoom separates them (single linkage at 40 px). Zoom needs ⌘/Ctrl + scroll so the page still scrolls over the map.

**Colour and theme.** One diverging scale for every mark: blue = covered by today's hiring, grey = in balance, red = shortfall. Text is never coloured by value; a swatch sits beside the number. Gold marks Qatari-talent priority only. Light is the default; the dark theme has its own steps.

**State.** Filters, the selected hub and the open skill live in the URL (`future`, `sector`, `when`, `priority`, `hub`, `q`, `skill`). The map's pan and zoom do not.

## 9. Demand-first redesign (2026-11-11)

The client asked for a platform that answers "if Qatar invests in this sector, what does its workforce need?", focused on future demand. Supply data (graduates, workers by skill) comes in a later phase.

- **Page order:** headline figures → map → investment briefing by sector → skills in demand → skills people need to learn → how to meet the demand → full table → outside benchmarks. The sector × future grid, the job-ads-by-sector chart, the futures bars and the priority/timing bars were removed from the page to cut clutter.
- **Words:** "shortfall" is now "gap" everywhere on the dashboard; "strategic demand" is "2030 demand". The numbers are unchanged.
- **2030 demand levels:** very strong ≥ 0.30, strong ≥ 0.20, moderate ≥ 0.10, emerging below. Cut points chosen on the distribution of the 163 skill areas (median 0.18, 90th percentile 0.34).
- **Suggested response** (`src/lib/dash/demand.ts`, tested in `tests/demand.test.ts`). A decision rule, not a forecast:
  1. gap below 0.05 → already in today's hiring;
  2. needed now (next 2–3 years, or now and through 2030) and gap ≥ 0.15 → recruit internationally now;
  3. needed now and a smaller gap → reskill the current workforce;
  4. needed by 2030 and a priority for Qatari talent → build Qatari talent;
  5. otherwise → reskill the current workforce.
  With all futures: 59 recruit, 51 reskill, 19 build, 34 already in hiring.
- **Why the gap:** generated from the two inputs. Under 0.5% of job ads → "almost no job ads yet"; otherwise "hiring, but below 2030 demand". The skill panel adds the rationale of the strongest source signal.
- **Skills people need to learn:** the specific skills named in the source signals, ranked by how many skill areas in view list them.
- **No headcounts or costs.** An investment amount cannot be turned into jobs without employment and supply data, so the briefing does not take one.
- **Benchmarks** come from the WEF *Future of Jobs Report 2025* (MENA: 46% of skills expected to change by 2030 versus 39% worldwide; 63% of employers name skill gaps as the top barrier; 85% plan upskilling; 59 in 100 workers need training). Qatar is not reported separately in that report, so these are shown as context, not Qatar figures.
- **Source count:** the header says 31 publications (33 source IDs, two of them duplicates), not 41.
- **Colours:** the three response hues were checked with the dataviz palette validator in light and dark (all checks pass); "already in hiring" uses the neutral line colour.
