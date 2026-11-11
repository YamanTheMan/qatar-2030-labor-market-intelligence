/**
 * CSV → typed JSON pipeline. Pure functions (no file writes) so they can be unit-tested.
 * Every number the story prints is computed here from data/*.csv.
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import {
  BANDS,
  FAMILY_IDS,
  FUNCTION_FAMILIES,
  HORIZON_IDS,
  PRIORITY_IDS,
  PUBLISHER_GROUPS,
  QUALITY_IDS,
  SCENARIO_IDS,
  SECTOR_IDS,
  SOURCE_GROUP,
  SOURCE_SHORT,
  bandOf,
  familyOf,
  functionFamilyOf,
  skillLabel,
  type FamilyId,
  type HorizonId,
  type PriorityId,
  type PublisherGroup,
  type QualityId,
  type ScenarioId,
  type SectorId,
} from "../src/lib/meta";
import type {
  Coefficient,
  GapRow,
  MatrixCell,
  PostingRow,
  Recommendation,
  Signal,
  SkillAggregate,
  Source,
  Summary,
  Weight,
} from "../src/lib/types";

/** Methodology statement from the capstone team (not derivable from data/). */
export const POSTINGS_ANALYSED = 5067;

type Raw = Record<string, string>;

export function readCsv(dir: string, file: string): Raw[] {
  const text = fs.readFileSync(path.join(dir, file), "utf8");
  const parsed = Papa.parse<Raw>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  if (parsed.errors.length) {
    const e = parsed.errors[0];
    throw new Error(`${file}: CSV parse error on row ${e.row}: ${e.message}`);
  }
  return parsed.data;
}

const num = (v: string | undefined, field: string, file: string): number => {
  const n = Number(v);
  if (v === undefined || v === "" || Number.isNaN(n)) throw new Error(`${file}: non-numeric ${field}: "${v}"`);
  return n;
};

function assertIn<T extends string>(v: string, allowed: readonly T[], field: string, file: string): T {
  if (!(allowed as readonly string[]).includes(v)) {
    throw new Error(`${file}: unknown ${field} "${v}". Add a label for it in src/lib/meta.ts`);
  }
  return v as T;
}

/** Split a comma/semicolon joined list, trim, and de-duplicate case-insensitively. */
export function splitDedupe(s: string | undefined, sep: RegExp = /[;,]/): string[] {
  if (!s) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of s.split(sep)) {
    const t = part.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

const round = (v: number, d = 4) => Math.round(v * 10 ** d) / 10 ** d;
const mean = (a: number[]) => (a.length ? a.reduce((p, c) => p + c, 0) / a.length : 0);

function quantile(sorted: number[], p: number): number {
  // linear interpolation (same as numpy/pandas default)
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const key = (scenario: string, sector: string, skill: string) => `${scenario}|${sector}|${skill}`;

export interface BuildOutput {
  gaps: GapRow[];
  signals: Signal[];
  sources: Source[];
  weights: Weight[];
  coefficients: Coefficient[];
  postings: PostingRow[];
  summary: Summary;
}

export function build(dataDir: string): BuildOutput {
  const F = {
    gap: "scenario_gap_analysis.csv",
    matrix: "scenario_skill_matrix.csv",
    weights: "scenario_skill_weights.csv",
    coef: "scenario_coefficients.csv",
    raw: "scenario_sources_raw.csv",
    sector: "sector_function_distribution.csv",
  };
  const gapRaw = readCsv(dataDir, F.gap);
  const matrixRaw = readCsv(dataDir, F.matrix);
  const weightsRaw = readCsv(dataDir, F.weights);
  const coefRaw = readCsv(dataDir, F.coef);
  const sigRaw = readCsv(dataDir, F.raw);
  const postRaw = readCsv(dataDir, F.sector);

  // ── Strategy-side matrix, used to enrich gap rows ─────────────────────────
  const matrixByKey = new Map<string, Raw>();
  for (const r of matrixRaw) matrixByKey.set(key(r.scenario, r.sector, r.skill_category), r);

  // ── Gap rows ──────────────────────────────────────────────────────────────
  const gaps: GapRow[] = gapRaw.map((r) => {
    const scenario = assertIn(r.scenario, SCENARIO_IDS, "scenario", F.gap);
    const sector = assertIn(r.sector, SECTOR_IDS, "sector", F.gap);
    const k = key(scenario, sector, r.skill_category);
    const m = matrixByKey.get(k);
    const shortfall = num(r.gap_score, "gap_score", F.gap);
    return {
      id: k,
      scenario,
      sector,
      skillKey: r.skill_category.trim(),
      skill: skillLabel(r.skill_category),
      strategic: num(r.calibration_score, "calibration_score", F.gap),
      market: num(r.posting_freq, "posting_freq", F.gap),
      shortfall,
      band: bandOf(shortfall),
      pipelineLabel: r.demand_label.replace(/^[^A-Za-z]+/, "").trim(),
      priority: assertIn(r.qatarization_relevance, PRIORITY_IDS, "qatarization_relevance", F.gap),
      horizon: assertIn(r.time_horizon, HORIZON_IDS, "time_horizon", F.gap),
      sources: splitDedupe(r.supporting_sources, /;/),
      specificSkills: splitDedupe(m?.all_specific_skills),
      signalCount: m ? num(m.signal_count, "signal_count", F.matrix) : 0,
      family: familyOf(r.skill_category),
    };
  });

  // ── Signals (audit trail) ─────────────────────────────────────────────────
  const signals: Signal[] = sigRaw.map((r, i) => ({
    i,
    sourceId: r.source_id.trim(),
    scenario: assertIn(r.scenario, SCENARIO_IDS, "scenario", F.raw),
    sector: assertIn(r.sector, SECTOR_IDS, "sector", F.raw),
    skillKey: r.skill_category.trim(),
    skill: skillLabel(r.skill_category),
    specificSkills: splitDedupe(r.specific_skills),
    direction: r.demand_direction,
    demandScore: num(r.demand_score, "demand_score", F.raw),
    rationale: (r.demand_rationale ?? "").trim(),
    quote: (r.evidence_quote ?? "").trim(),
    quality: assertIn(r.data_quality, QUALITY_IDS, "data_quality", F.raw),
    qualityWeight: num(r.quality_weight, "quality_weight", F.raw),
    scenarioWeight: num(r.scenario_weight, "scenario_weight", F.raw),
    weightedScore: round(num(r.weighted_score, "weighted_score", F.raw)),
    priority: assertIn(r.qatarization_relevance, PRIORITY_IDS, "qatarization_relevance", F.raw),
    horizon: assertIn(r.time_horizon, HORIZON_IDS, "time_horizon", F.raw),
  }));

  // ── Sources ───────────────────────────────────────────────────────────────
  const srcMap = new Map<string, Source>();
  for (const r of sigRaw) {
    const id = r.source_id.trim();
    if (!SOURCE_GROUP[id]) throw new Error(`${F.raw}: source "${id}" has no publisher group in src/lib/meta.ts`);
    let s = srcMap.get(id);
    if (!s) {
      s = {
        id,
        title: r.source_title.trim(),
        short: SOURCE_SHORT[id] ?? r.source_title.trim(),
        publisher: r.source_publisher.trim(),
        year: num(r.source_year, "source_year", F.raw),
        url: r.source_url.trim(),
        quality: r.data_quality as QualityId,
        group: SOURCE_GROUP[id],
        signals: 0,
        scenarios: [],
        sectors: [],
        sameTitleAs: null,
      };
      srcMap.set(id, s);
    }
    s.signals += 1;
    if (!s.scenarios.includes(r.scenario as ScenarioId)) s.scenarios.push(r.scenario as ScenarioId);
    if (!s.sectors.includes(r.sector as SectorId)) s.sectors.push(r.sector as SectorId);
  }
  const sources = [...srcMap.values()];
  for (const s of sources) {
    s.scenarios.sort();
    const twin = sources.find((o) => o.id !== s.id && o.title.toLowerCase() === s.title.toLowerCase());
    s.sameTitleAs = twin ? twin.id : null;
  }
  sources.sort((a, b) => b.signals - a.signals || a.id.localeCompare(b.id));

  // ── Weights & coefficients ────────────────────────────────────────────────
  const weights: Weight[] = weightsRaw.map((r) => ({
    scenario: assertIn(r.scenario, SCENARIO_IDS, "scenario", F.weights),
    skillKey: r.skill_category.trim(),
    skill: skillLabel(r.skill_category),
    sector: assertIn(r.sector, SECTOR_IDS, "sector", F.weights),
    totalWeighted: round(num(r.total_weighted, "total_weighted", F.weights)),
    signalCount: num(r.signal_count, "signal_count", F.weights),
    avgDemand: round(num(r.avg_demand_score, "avg_demand_score", F.weights)),
    avgQuality: round(num(r.avg_quality, "avg_quality", F.weights)),
    sources: splitDedupe(r.sources, /,/),
    penalty: round(num(r.penalty, "penalty", F.weights)),
    adjustedWeight: round(num(r.adjusted_weight, "adjusted_weight", F.weights)),
    normalizedWeight: round(num(r.normalized_weight, "normalized_weight", F.weights)),
  }));

  const coefficients: Coefficient[] = coefRaw.map((r) => ({
    scenario: assertIn(r.scenario, SCENARIO_IDS, "scenario", F.coef),
    sourceId: r.source_id.trim(),
    totalWeighted: round(num(r.total_weighted, "total_weighted", F.coef)),
    signalCount: num(r.signal_count, "signal_count", F.coef),
    avgQuality: round(num(r.avg_quality, "avg_quality", F.coef)),
    avgScenarioWeight: round(num(r.avg_scenario_w, "avg_scenario_w", F.coef)),
    publisher: r.publisher.trim(),
    quality: assertIn(r.data_quality, QUALITY_IDS, "data_quality", F.coef),
  }));

  // ── Postings ──────────────────────────────────────────────────────────────
  const postings: PostingRow[] = postRaw.map((r) => ({
    sector: assertIn(r.sector, SECTOR_IDS, "sector", F.sector),
    fn: r.jobFunction.trim(),
    family: functionFamilyOf(r.jobFunction),
    count: num(r.count, "count", F.sector),
    pct: num(r.pct, "pct", F.sector),
  }));
  const postingsTotal = postings.reduce((a, r) => a + r.count, 0);
  const postingsBySector = SECTOR_IDS.map((sector) => {
    const count = postings.filter((p) => p.sector === sector).reduce((a, r) => a + r.count, 0);
    return { sector, count, share: round(count / postingsTotal) };
  }).sort((a, b) => b.count - a.count);
  const postingsByFamily = FUNCTION_FAMILIES.map((f) => {
    const count = postings.filter((p) => p.family === f.id).reduce((a, r) => a + r.count, 0);
    return { family: f.id, label: f.label, count, share: round(count / postingsTotal) };
  })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  // ── Summary ───────────────────────────────────────────────────────────────
  const byId = new Map(gaps.map((g) => [g.id, g]));
  const sortedShort = gaps.map((g) => g.shortfall).sort((a, b) => a - b);
  const countBy = <T extends string>(arr: { [k: string]: unknown }[], field: string, keys?: readonly T[]) => {
    const out: Record<string, number> = {};
    if (keys) for (const k of keys) out[k] = 0;
    for (const r of arr) out[String(r[field])] = (out[String(r[field])] ?? 0) + 1;
    return out as Record<T, number>;
  };

  const bySector = SECTOR_IDS.map((sector) => {
    const rows = gaps.filter((g) => g.sector === sector);
    return {
      sector,
      avg: round(mean(rows.map((r) => r.shortfall))),
      n: rows.length,
      shortfalls: rows.filter((r) => r.shortfall > 0).length,
      postings: postingsBySector.find((p) => p.sector === sector)?.count ?? 0,
    };
  }).sort((a, b) => b.avg - a.avg);

  const maxSignals = Math.max(...SCENARIO_IDS.map((s) => signals.filter((x) => x.scenario === s).length));
  const topWeights = {} as Summary["topWeights"];
  for (const s of SCENARIO_IDS) {
    topWeights[s] = weights
      .filter((w) => w.scenario === s)
      .sort((a, b) => b.normalizedWeight - a.normalizedWeight || b.signalCount - a.signalCount || a.skill.localeCompare(b.skill))
      .slice(0, 15)
      .map((w) => ({ skillKey: w.skillKey, skill: w.skill, sector: w.sector, weight: w.normalizedWeight, signals: w.signalCount }));
  }

  const byScenario = SCENARIO_IDS.map((scenario) => {
    const rows = gaps.filter((g) => g.scenario === scenario);
    const sig = signals.filter((x) => x.scenario === scenario);
    return {
      scenario,
      avg: round(mean(rows.map((r) => r.shortfall))),
      rows: rows.length,
      shortfalls: rows.filter((r) => r.shortfall > 0).length,
      signals: sig.length,
      sources: new Set(sig.map((x) => x.sourceId)).size,
      penalty: round(Math.sqrt(sig.length / maxSignals)),
      topSkills: topWeights[scenario].slice(0, 3).map((t) => ({ skill: t.skill, weight: t.weight, sector: t.sector })),
    };
  });

  const matrix: MatrixCell[] = [];
  for (const sector of SECTOR_IDS)
    for (const scenario of SCENARIO_IDS) {
      const rows = gaps.filter((g) => g.sector === sector && g.scenario === scenario);
      const avg = rows.length ? round(mean(rows.map((r) => r.shortfall))) : null;
      matrix.push({
        sector,
        scenario,
        avg,
        n: rows.length,
        max: rows.length ? Math.max(...rows.map((r) => r.shortfall)) : null,
        band: avg === null ? null : bandOf(avg),
      });
    }

  const ranked = [...gaps].sort((a, b) => b.shortfall - a.shortfall || a.id.localeCompare(b.id));
  const top20 = ranked.slice(0, 20).map((g) => g.id);
  const overSupplied = [...gaps]
    .filter((g) => g.shortfall < 0)
    .sort((a, b) => a.shortfall - b.shortfall)
    .slice(0, 8)
    .map((g) => g.id);

  const explainerBig = ranked[0].id;
  const explainerCovered =
    gaps.find((g) => g.scenario === "S1" && g.sector === "construction_real_estate" && g.skillKey === "project management")?.id ??
    overSupplied[0];

  // Skill aggregates (across futures)
  const aggMap = new Map<string, SkillAggregate>();
  for (const g of gaps) {
    let a = aggMap.get(g.skillKey);
    if (!a) {
      a = {
        skillKey: g.skillKey,
        skill: g.skill,
        family: g.family,
        sectors: [],
        byScenario: { S1: null, S2: null, S3: null, S4: null, S5: null },
        presentIn: 0,
        shortIn: 0,
        meanShortfall: 0,
        maxShortfall: -Infinity,
        sumPositive: 0,
        anyHigh: false,
        horizons: [],
        sources: [],
      };
      aggMap.set(g.skillKey, a);
    }
    if (!a.sectors.includes(g.sector)) a.sectors.push(g.sector);
    const prev = a.byScenario[g.scenario];
    a.byScenario[g.scenario] = prev === null ? g.shortfall : Math.max(prev, g.shortfall);
    if (g.priority === "high" && g.shortfall > 0) a.anyHigh = true;
    if (!a.horizons.includes(g.horizon)) a.horizons.push(g.horizon);
    for (const s of g.sources) if (!a.sources.includes(s)) a.sources.push(s);
  }
  const aggs = [...aggMap.values()].map((a) => {
    const vals = SCENARIO_IDS.map((s) => a.byScenario[s]).filter((v): v is number => v !== null);
    const pos = vals.filter((v) => v > 0);
    return {
      ...a,
      presentIn: vals.length,
      shortIn: pos.length,
      meanShortfall: round(mean(vals)),
      maxShortfall: Math.max(...vals),
      sumPositive: round(pos.reduce((p, c) => p + c, 0)),
    };
  });

  const maxShortIn = Math.max(...aggs.map((a) => a.shortIn));
  const safeBets = aggs
    .filter((a) => a.shortIn >= 3)
    .sort((a, b) => b.meanShortfall - a.meanShortfall || a.skill.localeCompare(b.skill));

  const familyByScenario: Summary["familyByScenario"] = [];
  for (const family of FAMILY_IDS)
    for (const scenario of SCENARIO_IDS) {
      const rows = gaps.filter((g) => g.family === family && g.scenario === scenario);
      const short = rows.filter((r) => r.shortfall > 0).sort((a, b) => b.shortfall - a.shortfall);
      familyByScenario.push({
        family,
        scenario,
        rows: rows.length,
        shortfalls: short.length,
        max: rows.length ? Math.max(...rows.map((r) => r.shortfall)) : null,
        topSkill: short[0]?.skill ?? null,
      });
    }

  const scenarioSpecific = SCENARIO_IDS.map((scenario) => ({
    scenario,
    rowIds: gaps
      .filter((g) => g.scenario === scenario && g.shortfall > 0 && aggMap.get(g.skillKey) && aggs.find((a) => a.skillKey === g.skillKey)!.presentIn === 1)
      .sort((a, b) => b.shortfall - a.shortfall)
      .slice(0, 3)
      .map((g) => g.id),
  }));

  const positives = gaps.filter((g) => g.shortfall > 0);
  const highPos = positives.filter((g) => g.priority === "high");
  const priorityTop: string[] = [];
  const seenSkill = new Set<string>();
  for (const g of [...highPos].sort((a, b) => b.shortfall - a.shortfall)) {
    if (seenSkill.has(g.skillKey)) continue;
    seenSkill.add(g.skillKey);
    priorityTop.push(g.id);
    if (priorityTop.length === 10) break;
  }

  // Recommendations: high-priority shortfalls, ranked by total shortfall across futures.
  // Type rule (first match wins) — documented in DECISIONS.md and /methodology.
  const recType = (a: SkillAggregate): Recommendation["type"] => {
    const s = a.skillKey.toLowerCase();
    if (/research|r&d|innovation/.test(s) || a.family === "research") return "research";
    if (a.sectors.includes("education") || /pedagog|curriculum/.test(s)) return "curriculum";
    if (/literacy|reskilling|upskilling|leadership|management|training/.test(s)) return "bridge";
    return "programme";
  };
  const QUOTA: Record<Recommendation["type"], number> = { programme: 4, curriculum: 2, bridge: 2, research: 2 };
  // Templates take the raw skill category, which is lower-case except for acronyms (AI, LNG…).
  const ACTION: Record<Recommendation["type"], (skill: string) => string> = {
    programme: (s) => `Build a specialist track in ${s}`,
    curriculum: (s) => `Build ${s} into teacher education and existing degrees`,
    bridge: (s) => `Offer short bridge courses in ${s} for graduates and mid-career Qataris`,
    research: (s) => `Expand ${s} capacity`,
  };
  const taken: Record<Recommendation["type"], number> = { programme: 0, curriculum: 0, bridge: 0, research: 0 };
  const recommendations: Recommendation[] = aggs
    .filter((a) => a.anyHigh && a.sumPositive > 0)
    .sort((a, b) => b.sumPositive - a.sumPositive || a.skill.localeCompare(b.skill))
    .filter((a) => {
      const t = recType(a);
      if (taken[t] >= QUOTA[t]) return false;
      taken[t] += 1;
      return true;
    })
    .map((a) => {
      const rows = gaps.filter((g) => g.skillKey === a.skillKey && g.shortfall > 0);
      const nowish = rows.some((r) => r.horizon === "near_term" || r.horizon === "both");
      const type = recType(a);
      return {
        skillKey: a.skillKey,
        skill: a.skill,
        type,
        horizonGroup: nowish ? "now" : "2030",
        action: ACTION[type](a.skillKey),
        maxShortfall: a.maxShortfall,
        shortIn: a.shortIn,
        sectors: a.sectors,
        sources: a.sources,
      };
    });

  const sourceGroups = Object.fromEntries(
    (Object.keys(PUBLISHER_GROUPS) as PublisherGroup[]).map((g) => [g, sources.filter((s) => s.group === g).length]),
  ) as Record<PublisherGroup, number>;

  const exampleSignal =
    signals.find((x) => x.sourceId === "QNDS3" && x.skillKey === "digital transformation" && x.scenario === "S1" && x.quote) ??
    signals.find((x) => x.quote)!;

  const summary: Summary = {
    exampleSignal,
    counts: {
      rows: gaps.length,
      shortfalls: positives.length,
      alignedOrCovered: gaps.length - positives.length,
      skills: new Set(gaps.map((g) => g.skillKey)).size,
      sectors: new Set(gaps.map((g) => g.sector)).size,
      scenarios: new Set(gaps.map((g) => g.scenario)).size,
      sourceRecords: sources.length,
      distinctTitles: new Set(sources.map((s) => s.title.toLowerCase())).size,
      signals: signals.length,
      signalsWithoutQuote: signals.filter((x) => !x.quote).length,
      postingsClassified: postingsTotal,
      postingsAnalysed: POSTINGS_ANALYSED,
      jobFunctions: new Set(postings.map((p) => p.fn)).size,
    },
    distribution: {
      min: sortedShort[0],
      median: round(quantile(sortedShort, 0.5)),
      p75: round(quantile(sortedShort, 0.75)),
      max: sortedShort[sortedShort.length - 1],
    },
    pipelineLabels: countBy(gaps as never, "pipelineLabel"),
    priority: countBy(gaps as never, "priority", PRIORITY_IDS),
    horizon: countBy(gaps as never, "horizon", HORIZON_IDS),
    directions: countBy(signals as never, "direction"),
    quality: countBy(signals as never, "quality", QUALITY_IDS),
    bySector,
    byScenario,
    matrix,
    top20,
    overSupplied,
    explainer: { big: explainerBig, covered: explainerCovered },
    safeBets,
    familyByScenario,
    scenarioSpecific,
    priorityLens: {
      highShortfalls: highPos.length,
      shortfalls: positives.length,
      share: round(highPos.length / positives.length),
      top: priorityTop,
    },
    recommendations,
    postings: { total: postingsTotal, bySector: postingsBySector, byFamily: postingsByFamily },
    sourceGroups,
    topWeights,
  };

  // sanity: every id referenced in summary exists
  for (const id of [...top20, ...overSupplied, ...priorityTop, explainerBig, explainerCovered])
    if (!byId.has(id)) throw new Error(`summary references unknown row ${id}`);
  void maxShortIn;
  void BANDS;

  return { gaps, signals, sources, weights, coefficients, postings, summary };
}

export type { FamilyId, HorizonId, PriorityId };
