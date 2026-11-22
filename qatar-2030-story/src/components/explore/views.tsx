"use client";

import Link from "next/link";
import { withBase } from "@/lib/basePath";
import { useMemo, useState } from "react";
import { C } from "@/lib/colors";
import { gaps, sourceById, sources, summary } from "@/lib/data";
import { coefficients, postings, signals, weights } from "@/lib/data-full";
import { fmtInt, fmtPct, fmtScore, fmtShortfall, lowerFirst } from "@/lib/format";
import {
  DIRECTION_LABELS,
  HORIZON_LABELS,
  PRIORITY_SHORT,
  PUBLISHER_GROUPS,
  QUALITY_LABELS,
  SCENARIOS,
  SCENARIO_IDS,
  SECTORS,
  SECTOR_IDS,
  type ScenarioId,
  type SectorId,
} from "@/lib/meta";
import type { GapRow, MatrixCell } from "@/lib/types";
import { Dumbbell, DumbbellLegend } from "@/components/charts/Dumbbell";
import { Heatmap, HeatmapLegend } from "@/components/charts/Heatmap";
import { HBars } from "@/components/charts/HBars";
import { Pips, PipsLegend } from "@/components/charts/Pips";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { useSourceDrawer } from "@/components/ui/SourceDrawer";
import { Term } from "@/components/ui/Term";
import { downloadCsv } from "./state";

type SetFn = (p: Record<string, string | string[] | null>) => void;

const gapCsvRow = (g: GapRow) => ({
  future: SCENARIOS[g.scenario].name,
  sector: SECTORS[g.sector].label,
  skill: g.skill,
  strategic_demand: g.strategic,
  market_hiring_share: g.market,
  shortfall: g.shortfall,
  band: g.band,
  pipeline_label: g.pipelineLabel,
  qatari_talent: PRIORITY_SHORT[g.priority],
  horizon: HORIZON_LABELS[g.horizon],
  sources: g.sources.map((s) => sourceById.get(s)?.title ?? s),
  specific_skills: g.specificSkills,
});

/* ───────────────────────── Ranking ───────────────────────── */
export function RankingView({ rows, sp, set }: { rows: GapRow[]; sp: URLSearchParams; set: SetFn }) {
  const asc = sp.get("sort") === "asc";
  const robust = Number(sp.get("robust") ?? 0);
  const [limit, setLimit] = useState(25);
  const robustKeys = useMemo(() => new Set(summary.safeBets.map((b) => b.skillKey)), []);
  const filtered = robust >= 3 ? rows.filter((r) => robustKeys.has(r.skillKey)) : rows;
  const sorted = [...filtered].sort((a, b) => (asc ? a.shortfall - b.shortfall : b.shortfall - a.shortfall));
  const shown = sorted.slice(0, limit);
  const pos = filtered.filter((r) => r.shortfall > 0).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="chip" aria-pressed={!asc} onClick={() => set({ sort: null })}>
          Largest shortfall first
        </button>
        <button type="button" className="chip" aria-pressed={asc} onClick={() => set({ sort: "asc" })}>
          Most covered first
        </button>
        <button type="button" className="chip" aria-pressed={robust >= 3} onClick={() => set({ robust: robust >= 3 ? null : "3" })}>
          Only skills short in 3+ futures
        </button>
        <button type="button" className="chip ml-auto" onClick={() => downloadCsv("shortfalls-filtered.csv", sorted.map(gapCsvRow))}>
          Download these {sorted.length} rows (CSV)
        </button>
      </div>
      <ChartFrame
        title={
          sorted.length
            ? `${pos} of ${filtered.length} matching rows are shortfalls; the ${asc ? "most covered" : "largest"} is ${lowerFirst(sorted[0].skill)} (${fmtShortfall(sorted[0].shortfall)})`
            : "No rows match these filters"
        }
        howTo="Each row is one skill in one sector and future. The further apart the dots, the bigger the gap. Click a row for the skill's full detail."
        legend={<DumbbellLegend />}
        source={SRC.gap}
      >
        {sorted.length ? <DumbbellAny rows={shown} set={set} /> : <p className="py-10 text-center text-ink-2">Try clearing a filter.</p>}
      </ChartFrame>
      {sorted.length > limit ? (
        <button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + 50)}>
          Show more ({sorted.length - limit} remaining)
        </button>
      ) : null}
    </div>
  );
}

/** Dumbbell needs strategic ≥ market for the line; it renders either way. */
function DumbbellAny({ rows, set }: { rows: GapRow[]; set: SetFn }) {
  return <Dumbbell rows={rows} ariaLabel="Shortfall ranking" onSelect={(g) => set({ view: "skill", skill: g.skillKey })} />;
}

/* ───────────────────────── Matrix ───────────────────────── */
export function MatrixView({ rows }: { rows: GapRow[] }) {
  const scen = SCENARIO_IDS.filter((s) => rows.some((r) => r.scenario === s));
  const secs = SECTOR_IDS.filter((s) => rows.some((r) => r.sector === s));
  const cells: MatrixCell[] = [];
  const overall: Record<string, number> = {};
  for (const sector of secs) {
    const sr = rows.filter((r) => r.sector === sector);
    overall[sector] = sr.reduce((a, r) => a + r.shortfall, 0) / sr.length;
    for (const scenario of scen) {
      const rr = sr.filter((r) => r.scenario === scenario);
      const avg = rr.length ? rr.reduce((a, r) => a + r.shortfall, 0) / rr.length : null;
      cells.push({ sector, scenario, avg, n: rr.length, max: rr.length ? Math.max(...rr.map((r) => r.shortfall)) : null, band: avg === null ? null : avg >= 0.15 ? "severe" : avg >= 0.05 ? "notable" : avg >= -0.05 ? "aligned" : "covered" });
    }
  }
  const order = [...secs].sort((a, b) => overall[b] - overall[a]);
  const top = order[0];
  return (
    <ChartFrame
      title={order.length ? `With these filters, ${SECTORS[top].label} has the largest average shortfall (${fmtShortfall(overall[top])})` : "No rows match these filters"}
      howTo="Average shortfall per sector and future for the filtered rows. Hatched = no evidence signal. Click a cell to list its skills."
      legend={<HeatmapLegend />}
      source={SRC.gap}
    >
      {order.length ? (
        <Heatmap cells={cells} sectors={order} scenarios={scen} overall={overall} linkFor={(s, f) => `/explore/?view=ranking&f=${f}&sec=${s}`} />
      ) : null}
    </ChartFrame>
  );
}

/* ───────────────────────── Skill detail ───────────────────────── */
export function SkillView({ sp, set, rows }: { sp: URLSearchParams; set: SetFn; rows: GapRow[] }) {
  const { openSource } = useSourceDrawer();
  const options = useMemo(() => {
    const m = new Map<string, { key: string; label: string; max: number }>();
    for (const g of rows) {
      const cur = m.get(g.skillKey);
      if (!cur || g.shortfall > cur.max) m.set(g.skillKey, { key: g.skillKey, label: g.skill, max: g.shortfall });
    }
    return [...m.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);
  const key = sp.get("skill") ?? summary.safeBets[0]?.skillKey ?? gaps[0].skillKey;
  const its = gaps.filter((g) => g.skillKey === key);
  const sig = signals.filter((s) => s.skillKey === key);
  const agg = summary.safeBets.find((b) => b.skillKey === key);
  const byScenario = Object.fromEntries(
    SCENARIO_IDS.map((s) => {
      const r = its.filter((g) => g.scenario === s);
      return [s, r.length ? Math.max(...r.map((x) => x.shortfall)) : null];
    }),
  ) as Record<ScenarioId, number | null>;
  const specific = [...new Set(its.flatMap((g) => g.specificSkills.map((x) => x.toLowerCase())))];
  const srcIds = [...new Set(its.flatMap((g) => g.sources))];
  if (!its.length) return <p className="text-ink-2">Unknown skill.</p>;
  const label = its[0].skill;
  return (
    <div className="space-y-6">
      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-ink">Skill</span>
        <select
          value={key}
          onChange={(e) => set({ skill: e.target.value })}
          className="max-w-full rounded-full border border-rule bg-card px-4 py-2 text-sm focus:border-maroon focus:outline-none"
        >
          {!options.some((o) => o.key === key) ? <option value={key}>{label}</option> : null}
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label} ({fmtShortfall(o.max)})
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">{options.length} skills match your filters</span>
      </label>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <p className="kicker">Skill</p>
          <h2 className="display mt-1 text-3xl text-ink">{label}</h2>
          <p className="mt-2 text-sm text-ink-2">
            {[...new Set(its.map((g) => SECTORS[g.sector].label))].join(", ")} · in {its.length} future × sector row{its.length === 1 ? "" : "s"}
            {agg ? " · a safe bet (short in 3 futures)" : ""}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Pips values={byScenario} size={16} />
            <PipsLegend />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs text-muted">
                  <th className="py-2 font-medium">Future</th>
                  <th className="py-2 font-medium">Sector</th>
                  <th className="py-2 text-right font-medium"><Term k="strategic">Demand</Term></th>
                  <th className="py-2 text-right font-medium"><Term k="market">Hiring</Term></th>
                  <th className="py-2 text-right font-medium"><Term k="shortfall">Shortfall</Term></th>
                  <th className="py-2 pl-3 font-medium">Horizon</th>
                </tr>
              </thead>
              <tbody>
                {its
                  .sort((a, b) => b.shortfall - a.shortfall)
                  .map((g) => (
                    <tr key={g.id} className="border-b border-rule/60">
                      <td className="py-2" style={{ color: SCENARIOS[g.scenario].ink }}>{SCENARIOS[g.scenario].short}</td>
                      <td className="py-2">{SECTORS[g.sector].label}</td>
                      <td className="tabular py-2 text-right">{fmtScore(g.strategic)}</td>
                      <td className="tabular py-2 text-right">{fmtPct(g.market, 1)}</td>
                      <td className="tabular py-2 text-right font-semibold" style={{ color: g.shortfall >= 0 ? C.maroon : C.slate }}>{fmtShortfall(g.shortfall)}</td>
                      <td className="py-2 pl-3 text-xs text-ink-2">{HORIZON_LABELS[g.horizon]} · {PRIORITY_SHORT[g.priority]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink">What the skill means in practice</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{specific.length ? specific.join(" · ") : "No specific skills recorded."}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink">Supporting publications ({srcIds.length})</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {srcIds.map((id) => (
                <button key={id} type="button" className="chip !text-xs hover:border-maroon" onClick={() => openSource(id, key)}>
                  {sourceById.get(id)?.short ?? id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="display text-2xl text-ink">Evidence ({sig.length} signals)</h3>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {sig.map((s) => (
            <li key={s.i} className="card p-4 text-sm">
              <p className="text-xs text-muted">
                <button type="button" className="font-semibold text-ink hover:text-maroon" onClick={() => openSource(s.sourceId, key)}>
                  {sourceById.get(s.sourceId)?.title}
                </button>{" "}
                · {SCENARIOS[s.scenario].short} · {DIRECTION_LABELS[s.direction]} · weight {fmtScore(s.weightedScore)}
              </p>
              {s.quote ? <blockquote className="mt-2 border-l-2 border-maroon pl-3 font-display italic text-ink">&ldquo;{s.quote}&rdquo;</blockquote> : <p className="mt-2 text-xs italic text-muted">No quote recorded for this signal.</p>}
              {s.rationale ? <p className="mt-2 text-ink-2">{s.rationale}</p> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ───────────────────────── Source detail ───────────────────────── */
export function SourceView({ sp, set }: { sp: URLSearchParams; set: SetFn }) {
  const id = sp.get("src") ?? sources[0].id;
  const s = sourceById.get(id) ?? sources[0];
  const sig = signals.filter((x) => x.sourceId === s.id);
  const coef = coefficients.filter((c) => c.sourceId === s.id);
  return (
    <div className="space-y-6">
      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-ink">Source</span>
        <select value={s.id} onChange={(e) => set({ src: e.target.value })} className="max-w-full rounded-full border border-rule bg-card px-4 py-2 text-sm focus:border-maroon focus:outline-none">
          {[...sources].sort((a, b) => a.title.localeCompare(b.title)).map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} ({o.year})
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <p className="kicker">{PUBLISHER_GROUPS[s.group]}</p>
          <h2 className="display mt-1 text-3xl text-ink">{s.title}</h2>
          <p className="mt-2 text-sm text-ink-2">
            {s.publisher} · {s.year} · {QUALITY_LABELS[s.quality]} · {s.signals} signals
          </p>
          {s.sameTitleAs ? (
            <p className="mt-2 rounded-lg bg-gold-soft px-3 py-2 text-xs text-gold-ink">
              Shares its title with {sourceById.get(s.sameTitleAs)?.short}. The pipeline counts them as separate records.
            </p>
          ) : null}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-block text-sm">
            Open the publication ↗
          </a>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink">Contribution to each future</p>
          <p className="mt-1 text-xs text-muted">Total weighted score this source adds per future</p>
          <div className="mt-3">
            <HBars
              dense
              ariaLabel="Contribution per future"
              rows={SCENARIO_IDS.map((f) => ({
                key: f,
                label: SCENARIOS[f].short,
                value: coef.find((c) => c.scenario === f)?.totalWeighted ?? 0,
                color: SCENARIOS[f].color,
              }))}
              format={(v) => (v ? v.toFixed(1) : "–")}
              labelWidth="minmax(100px, 38%)"
            />
          </div>
        </div>
      </div>
      <ol className="grid gap-3 md:grid-cols-2">
        {sig.map((x) => (
          <li key={x.i} className="card p-4 text-sm">
            <p className="text-xs text-muted">
              {SCENARIOS[x.scenario].short} · {SECTORS[x.sector].label} · {DIRECTION_LABELS[x.direction]}
            </p>
            <button type="button" onClick={() => set({ view: "skill", skill: x.skillKey })} className="mt-0.5 text-left font-semibold text-ink hover:text-maroon">
              {x.skill} →
            </button>
            {x.quote ? <blockquote className="mt-2 border-l-2 border-maroon pl-3 font-display italic text-ink">&ldquo;{x.quote}&rdquo;</blockquote> : null}
            {x.rationale ? <p className="mt-2 text-ink-2">{x.rationale}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────── Model transparency ───────────────────────── */
export function ModelView({ sp, set }: { sp: URLSearchParams; set: SetFn }) {
  const f = (SCENARIO_IDS.find((x) => x === sp.get("f")) ?? "S1") as ScenarioId;
  const rows = coefficients.filter((c) => c.scenario === f).sort((a, b) => b.totalWeighted - a.totalWeighted);
  const by = summary.byScenario;
  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink">Demand score</p>
          <ul className="tabular mt-2 space-y-1 text-sm text-ink-2">
            <li>Strong increase: +2</li>
            <li>Moderate increase: +1</li>
            <li>Stable: 0</li>
            <li>Moderate decrease: −1</li>
            <li>Strong decrease: −2</li>
          </ul>
          <p className="mt-2 text-xs text-muted">
            In the data: {summary.directions.strong_increase} strong, {summary.directions.moderate_increase} moderate increases, {summary.directions.moderate_decrease ?? 0} moderate decreases.
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink">Source quality weight</p>
          <ul className="tabular mt-2 space-y-1 text-sm text-ink-2">
            <li>High: 1.5× ({summary.quality.high} signals)</li>
            <li>Medium: 1.0× ({summary.quality.medium} signals)</li>
            <li>Lower: 0.5× ({summary.quality.low} signals)</li>
          </ul>
        </div>
        <div className="card p-5" id="penalty">
          <p className="text-sm font-semibold text-ink">
            <Term k="penalty">Signal-count balance</Term>
          </p>
          <ul className="tabular mt-2 space-y-1 text-sm text-ink-2">
            {by.map((b) => (
              <li key={b.scenario} className="flex justify-between gap-2">
                <span style={{ color: SCENARIOS[b.scenario].ink }}>{SCENARIOS[b.scenario].short}</span>
                <span>
                  √({b.signals}/{Math.max(...by.map((x) => x.signals))}) = {b.penalty.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ChartFrame
        title={`${sourceById.get(rows[0]?.sourceId ?? "")?.short ?? "–"} contributes most evidence to the ${SCENARIOS[f].short} future`}
        howTo="Total weighted score each source adds to the chosen future (sum of demand × quality × relevance over its signals). Pick a future:"
        legend={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a future">
            {SCENARIO_IDS.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={s === f} onClick={() => set({ f: s })}>
                <span className="h-2 w-2 rounded-full" style={{ background: SCENARIOS[s].color }} aria-hidden="true" />
                {SCENARIOS[s].short}
              </button>
            ))}
          </div>
        }
        source={SRC.coef}
      >
        <HBars
          dense
          ariaLabel="Source contributions"
          rows={rows.map((r) => ({
            key: r.sourceId,
            label: (
              <>
                {sourceById.get(r.sourceId)?.short ?? r.sourceId}
                <span className="text-[0.7rem] text-muted"> · {r.signalCount} signals · avg relevance {r.avgScenarioWeight.toFixed(2)}</span>
              </>
            ),
            value: r.totalWeighted,
            color: SCENARIOS[f].color,
            onClick: () => set({ view: "source", src: r.sourceId }),
          }))}
          format={(v) => v.toFixed(1)}
          labelWidth="minmax(160px, 50%)"
        />
      </ChartFrame>
      <ChartFrame
        title="How importance is computed in the chosen future"
        howTo={
          <>
            For each skill: sum of signal weights → × signal-count balance → divided by the largest in the future = <Term k="importance">importance</Term>{" "}
            (0–1). Top 15 shown.
          </>
        }
        source={SRC.weights}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs text-muted">
                <th className="py-2 font-medium">Skill</th>
                <th className="py-2 text-right font-medium">Signals</th>
                <th className="py-2 text-right font-medium">Weighted sum</th>
                <th className="py-2 text-right font-medium">× balance</th>
                <th className="py-2 text-right font-medium">Importance</th>
              </tr>
            </thead>
            <tbody>
              {weights
                .filter((w) => w.scenario === f)
                .sort((a, b) => b.normalizedWeight - a.normalizedWeight)
                .slice(0, 15)
                .map((w) => (
                  <tr key={w.skillKey + w.sector} className="border-b border-rule/60">
                    <td className="py-1.5">{w.skill}</td>
                    <td className="tabular py-1.5 text-right">{w.signalCount}</td>
                    <td className="tabular py-1.5 text-right">{w.totalWeighted.toFixed(2)}</td>
                    <td className="tabular py-1.5 text-right">{w.adjustedWeight.toFixed(2)}</td>
                    <td className="tabular py-1.5 text-right font-semibold">{w.normalizedWeight.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </ChartFrame>
    </div>
  );
}

/* ───────────────────────── Tables ───────────────────────── */
const TABLES = {
  gaps: { label: "Shortfalls (gap analysis)", file: "scenario_gap_analysis.csv" },
  signals: { label: "Evidence signals", file: "scenario_sources_raw.csv" },
  weights: { label: "Skill importance by future", file: "scenario_skill_weights.csv" },
  coefficients: { label: "Source contributions", file: "scenario_coefficients.csv" },
  postings: { label: "Job postings by sector & function", file: "sector_function_distribution.csv" },
  sources: { label: "Source records", file: "scenario_sources_raw.csv" },
} as const;
type TableId = keyof typeof TABLES;

export function TablesView({ sp, set, rows }: { sp: URLSearchParams; set: SetFn; rows: GapRow[] }) {
  const t = (Object.keys(TABLES).includes(sp.get("t") ?? "") ? sp.get("t") : "gaps") as TableId;
  const [page, setPage] = useState(0);
  const keep = new Set(rows.map((r) => r.id));
  const fScen = new Set(rows.map((r) => r.scenario));
  const fSec = new Set(rows.map((r) => r.sector));
  const data: Record<string, unknown>[] = useMemo(() => {
    switch (t) {
      case "gaps":
        return gaps.filter((g) => keep.has(g.id)).map(gapCsvRow);
      case "signals":
        return signals
          .filter((s) => fScen.has(s.scenario) && fSec.has(s.sector))
          .map((s) => ({
            source: sourceById.get(s.sourceId)?.title,
            future: SCENARIOS[s.scenario].name,
            sector: SECTORS[s.sector].label,
            skill: s.skill,
            direction: DIRECTION_LABELS[s.direction],
            demand_score: s.demandScore,
            quality_weight: s.qualityWeight,
            relevance_weight: s.scenarioWeight,
            weighted_score: s.weightedScore,
            quote: s.quote,
            rationale: s.rationale,
          }));
      case "weights":
        return weights
          .filter((w) => fScen.has(w.scenario) && fSec.has(w.sector))
          .map((w) => ({
            future: SCENARIOS[w.scenario].name,
            skill: w.skill,
            sector: SECTORS[w.sector].label,
            signals: w.signalCount,
            weighted_sum: w.totalWeighted,
            balance_factor: w.penalty,
            adjusted: w.adjustedWeight,
            importance: w.normalizedWeight,
          }));
      case "coefficients":
        return coefficients
          .filter((c) => fScen.has(c.scenario))
          .map((c) => ({ future: SCENARIOS[c.scenario].name, source: sourceById.get(c.sourceId)?.title, publisher: c.publisher, signals: c.signalCount, total_weighted: c.totalWeighted, avg_quality: c.avgQuality, avg_relevance: c.avgScenarioWeight }));
      case "postings":
        return postings
          .filter((p) => fSec.has(p.sector))
          .map((p) => ({ sector: SECTORS[p.sector].label, job_function: p.fn, count: p.count, pct_of_sector: p.pct }));
      case "sources":
        return sources.map((s) => ({ title: s.title, publisher: s.publisher, year: s.year, type: PUBLISHER_GROUPS[s.group], quality: s.quality, signals: s.signals, url: s.url, same_title_as: s.sameTitleAs ? sourceById.get(s.sameTitleAs)?.short : "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, rows]);
  const PER = 50;
  const cols = data.length ? Object.keys(data[0]) : [];
  const pageRows = data.slice(page * PER, page * PER + PER);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(TABLES) as TableId[]).map((id) => (
          <button key={id} type="button" className="chip" aria-pressed={id === t} onClick={() => { setPage(0); set({ t: id }); }}>
            {TABLES[id].label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="tabular text-ink-2">
          <b className="text-ink">{fmtInt(data.length)}</b> rows {t === "sources" ? "" : "(future and sector filters applied)"}
        </span>
        <button type="button" className="btn btn-primary !py-1.5 !text-sm" onClick={() => downloadCsv(`${t}-view.csv`, data)}>
          Download this view (CSV)
        </button>
        <a href={withBase(`/data/${TABLES[t].file}`)} download className="link text-sm">
          Original file: {TABLES[t].file}
        </a>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-paper-2">
            <tr>
              {cols.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-3 py-2 text-left font-semibold text-ink-2">
                  {c.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i} className="border-t border-rule/70 align-top">
                {cols.map((c) => {
                  const v = r[c];
                  const s = Array.isArray(v) ? v.join("; ") : typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(3)) : String(v ?? "");
                  return (
                    <td key={c} className={`px-3 py-1.5 ${typeof v === "number" ? "tabular text-right" : ""} ${s.length > 60 ? "min-w-[260px]" : "whitespace-nowrap"}`}>
                      {s.length > 220 ? `${s.slice(0, 220)}…` : s}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > PER ? (
        <div className="flex items-center gap-3 text-sm">
          <button type="button" className="chip" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="tabular text-ink-2">
            Page {page + 1} of {Math.ceil(data.length / PER)}
          </span>
          <button type="button" className="chip" disabled={(page + 1) * PER >= data.length} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      ) : null}
      <p className="text-xs text-muted">
        Column names are plain-language versions of the pipeline fields; see <Link href="/methodology/" className="link">methodology</Link> for the mapping.
      </p>
    </div>
  );
}

export type { SectorId };
