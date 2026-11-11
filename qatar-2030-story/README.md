# Qatar 2030 Skills Intelligence

An executive dashboard that compares **what Qatar's 2030 strategy documents say the economy will need** with **what employers in Qatar hire for today**, across **5 possible futures**, **8 sectors** and **17 economic hubs** on an interactive map of Qatar.

It is the redesign of the *Qatar 2030 Labor Market Intelligence* Streamlit dashboard. It was built as a **CMU Tepper MSBA Capstone (2025)** for **Qatar Foundation's Higher Education Division, Qatar Human Capital Manara**.

| Page | What it is |
|---|---|
| `/` | The platform: headline figures, the map of hubs, an investment briefing for each sector (skills needed, gap, why, and a suggested talent response), skills in demand, skills people need to learn, a sortable table with CSV export, WEF benchmarks, and an evidence panel for every skill. The URL keeps the state, so any view can be shared. Light and dark themes. |
| `/methodology` | Plain-language method, exact formulas, data caveats, glossary, and how to update the data |
| `/sources` | All 33 source records with their evidence quotes |
| `/story`, `/explore`, `/brief` | The earlier scroll story, explorer and print brief. Kept, but no longer in the navigation. |

**The map is a reference layer.** The data has no location or employer columns: it is by future, sector and skill. The 17 hubs and the organisations named at each are curated in `src/lib/hubs.ts` and linked to the data by a rule on sector and skill name. See `DECISIONS.md` section 8.

The site is fully static: no backend, no analytics or cookies. The only runtime network call is the map background (tiles from OpenFreeMap). Without a connection the map falls back to a built-in outline of Qatar and everything else works.

---

## Run it locally

Requires Node.js 20 or newer.

```bash
cd qatar-2030-story
npm install
npm run dev          # http://localhost:3000
```

| Command | Does |
|---|---|
| `npm run build:data` | Reads `data/*.csv` → writes typed JSON to `src/data/`, and copies the CSVs to `public/data/` for download |
| `npm test` | Unit tests for the data pipeline: row counts, 224 shortfalls, 33 sources, the shortfall formula, label completeness |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm run export` | `build:data`, then a static export to `out/` |
| `npm start` | Serves `out/` locally |

## Update the data (no coding needed)

1. On GitHub, open `qatar-2030-story/data/`.
2. Click **Add file → Upload files** and upload the new pipeline CSVs. Keep the **same file names and columns**.
3. Click **Commit changes**.

The site rebuilds and redeploys by itself (Vercel), usually within a couple of minutes, and every number in the story is recomputed.

If the new data contains a **new** sector, future, publisher or label, the build stops on purpose and names what is missing. Add a human-readable label for it in `src/lib/meta.ts`. This guarantees that codes like `technology_digital` never appear on the page.

Two things are **not** in the CSVs:
- The national context figures (Chapters 1 and 8) live in `src/data/context.json`, each with its source link and date.
- The future names and descriptions live in `src/lib/meta.ts`.

## Deploy

**Vercel (recommended):**
1. Import the GitHub repository in Vercel.
2. Set **Root Directory** to `qatar-2030-story`.
3. Deploy. `vercel.json` already sets the build command, and Next.js static export is detected automatically.

Every push to the main branch redeploys.

**Any static host** (GitHub Pages, Netlify, S3, an intranet server): run `npm run build` and upload the `out/` folder.

**CI:** `.github/workflows/ci.yml` runs the data build, tests, type check and static build on every push. If this folder stays inside the original `qatar-dashboard` repository, move the workflow file to the **repository root** `.github/workflows/`. It already uses `working-directory: qatar-2030-story`.

## How it's built

- **Next.js 16 (App Router), TypeScript, Tailwind CSS v4**, static export (`output: "export"`)
- **D3** (`d3-scale`, `d3-shape`, `d3-force`) for layout, rendered as React SVG
- **Motion** for count-ups, transitions and the progress bar; everything respects `prefers-reduced-motion`
- **Radix** primitives (shadcn-style, vendored) for glossary popovers and the source drawer
- A small `IntersectionObserver` hook for scrollytelling
- Fonts: Fraunces (headlines), Inter (text), IBM Plex Sans Arabic (Arabic), self-hosted at build time

```
qatar-2030-story/
  data/                    pipeline CSVs (copied unchanged from ../data)
  scripts/pipeline.ts      CSV → JSON logic (pure, tested)
  scripts/build-data.ts    CLI wrapper: writes src/data/*.json
  src/app/                 routes: / · /explore · /methodology · /sources · /brief
  src/components/story/    one component per chapter
  src/components/charts/   reusable chart components (used by the story and the explorer)
  src/components/explore/  explorer views, filter bar, URL state
  src/lib/                 labels & colours (meta.ts), glossary, i18n, formatters
  src/data/context.json    hand-verified national context figures
  tests/                   Vitest pipeline tests
  DECISIONS.md             every judgement call, including the data caveats
```

Read **`DECISIONS.md`** before changing anything analytical. It records what the data showed that differed from the brief or the old dashboard. The most important item: the shortfall is `calibration_score − 2 × posting_freq`.

## Credits

CMU Tepper MSBA Capstone 2025 for Qatar Foundation, Qatar Human Capital Manara.

Aiko Kikuchi · Akhmed Sungurov · Arshia Sabdar · Dima Polukhin · Malak Alseaf

Advised by Professor Ganesh Mani.
