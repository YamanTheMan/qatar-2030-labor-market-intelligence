/**
 * Dashboard model: filters, units and aggregation. Pure functions, unit-tested.
 *
 * Unit. A "skill" on the dashboard is one sector × skill pair (163 in the data).
 * Each pair has one row per future in which the strategies mention it.
 *
 * Value. With one future selected a skill's shortfall is that future's row.
 * With all futures it is the skill's largest shortfall in any future ("peak"),
 * so a skill counts as short if any plausible 2030 would leave it short.
 */
import { HUBS, hubById, hubLinksRow, type Hub } from "@/lib/hubs";
import { SCENARIO_IDS, SECTORS, SECTOR_IDS, type HorizonId, type PriorityId, type ScenarioId, type SectorId } from "@/lib/meta";
import type { GapRow } from "@/lib/types";

export type HorizonFilter = "all" | "near_term" | "medium_term";

export interface Filters {
  future: "all" | ScenarioId;
  sector: "all" | SectorId;
  horizon: HorizonFilter;
  /** only skills flagged as a priority for Qatari talent */
  priority: boolean;
  hub: string | null;
  q: string;
}

export const DEFAULT_FILTERS: Filters = { future: "all", sector: "all", horizon: "all", priority: false, hub: null, q: "" };

export const isDefault = (f: Filters) =>
  f.future === "all" && f.sector === "all" && f.horizon === "all" && !f.priority && !f.hub && f.q.trim() === "";

/** A skill is "in shortfall" from here up (the Notable and Severe bands). */
export const SHORT = 0.05;
export const SEVERE = 0.15;

/* ---------- colour steps: one diverging scale for every mark ---------- */

export const STEP_IDS = ["c2", "c1", "0", "1", "2", "3", "4"] as const;
export type StepId = (typeof STEP_IDS)[number];
/** Lower edge of each step after the first. */
export const STEP_EDGES = [-0.15, -0.05, 0.05, 0.15, 0.2, 0.3] as const;

export function stepOf(v: number): StepId {
  let i = 0;
  while (i < STEP_EDGES.length && v >= STEP_EDGES[i]) i++;
  return STEP_IDS[i];
}
export const stepFill = (s: StepId) => `var(--s-${s})`;
export const stepInk = (s: StepId) => `var(--s-${s}-ink)`;

export const STEP_LABELS: Record<StepId, string> = {
  c2: "Well covered: below −0.15",
  c1: "Covered: −0.15 to −0.05",
  "0": "In balance: −0.05 to 0.05",
  "1": "Gap 0.05 to 0.15",
  "2": "Large gap 0.15 to 0.20",
  "3": "Large gap 0.20 to 0.30",
  "4": "Large gap 0.30 or more",
};

const emptySteps = (): Record<StepId, number> => ({ c2: 0, c1: 0, "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 });
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/* ---------- filtering ---------- */

export type Dim = "future" | "sector" | "horizon" | "priority" | "q";

function matchesQuery(r: GapRow, q: string): boolean {
  return (
    r.skill.toLowerCase().includes(q) ||
    r.skillKey.toLowerCase().includes(q) ||
    SECTORS[r.sector].label.toLowerCase().includes(q) ||
    r.specificSkills.some((s) => s.toLowerCase().includes(q))
  );
}

/** `skip` lets a chart that controls a filter keep showing every option of it. */
export function filterRows(rows: GapRow[], f: Filters, skip: Dim[] = []): GapRow[] {
  const on = (d: Dim) => !skip.includes(d);
  const q = on("q") ? f.q.trim().toLowerCase() : "";
  return rows.filter(
    (r) =>
      (!on("future") || f.future === "all" || r.scenario === f.future) &&
      (!on("sector") || f.sector === "all" || r.sector === f.sector) &&
      (!on("horizon") || f.horizon === "all" || r.horizon === f.horizon || r.horizon === "both") &&
      (!on("priority") || !f.priority || r.priority === "high") &&
      (!q || matchesQuery(r, q)),
  );
}

export function hubRows(rows: GapRow[], hubId: string | null): GapRow[] {
  const hub = hubId ? hubById.get(hubId) : undefined;
  return hub ? rows.filter((r) => hubLinksRow(hub, r)) : rows;
}

/* ---------- skills ---------- */

export interface SkillAgg {
  key: string;
  sector: SectorId;
  skillKey: string;
  skill: string;
  rows: GapRow[];
  byScenario: Partial<Record<ScenarioId, GapRow>>;
  /** the row with the largest shortfall among the futures in view */
  peak: GapRow;
  value: number;
  step: StepId;
  nFutures: number;
  nShort: number;
  priority: PriorityId;
  horizon: HorizonId;
  sources: string[];
  signalCount: number;
  specificSkills: string[];
}

export const skillKeyOf = (r: Pick<GapRow, "sector" | "skillKey">) => `${r.sector}|${r.skillKey}`;
const PRIORITY_RANK: Record<PriorityId, number> = { high: 0, medium: 1, low: 2 };

export function aggregateSkills(rows: GapRow[]): SkillAgg[] {
  const groups = new Map<string, GapRow[]>();
  for (const r of rows) {
    const k = skillKeyOf(r);
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  const out: SkillAgg[] = [];
  for (const [key, g] of groups) {
    const peak = g.reduce((a, b) => (b.shortfall > a.shortfall ? b : a));
    const byScenario: Partial<Record<ScenarioId, GapRow>> = {};
    for (const r of g) byScenario[r.scenario] = r;
    const specific = new Map<string, string>();
    for (const r of g) for (const s of r.specificSkills) if (!specific.has(s.toLowerCase())) specific.set(s.toLowerCase(), s);
    out.push({
      key,
      sector: peak.sector,
      skillKey: peak.skillKey,
      skill: peak.skill,
      rows: g,
      byScenario,
      peak,
      value: peak.shortfall,
      step: stepOf(peak.shortfall),
      nFutures: g.length,
      nShort: g.filter((r) => r.shortfall >= SHORT).length,
      priority: g.reduce((a, b) => (PRIORITY_RANK[b.priority] < PRIORITY_RANK[a.priority] ? b : a)).priority,
      horizon: peak.horizon,
      sources: [...new Set(g.flatMap((r) => r.sources))],
      signalCount: g.reduce((a, r) => a + r.signalCount, 0),
      specificSkills: [...specific.values()],
    });
  }
  return out.sort((a, b) => b.value - a.value || a.skill.localeCompare(b.skill));
}

export interface Kpis {
  total: number;
  short: number;
  severe: number;
  balanced: number;
  covered: number;
  steps: Record<StepId, number>;
  /** skills in shortfall that are a priority for Qatari talent */
  priorityShort: number;
  priorityShare: number | null;
  top: SkillAgg | null;
  mean: number | null;
}

export function kpisOf(skills: SkillAgg[]): Kpis {
  const steps = emptySteps();
  for (const s of skills) steps[s.step]++;
  const short = skills.filter((s) => s.value >= SHORT);
  const priorityShort = short.filter((s) => s.priority === "high").length;
  return {
    total: skills.length,
    short: short.length,
    severe: skills.filter((s) => s.value >= SEVERE).length,
    balanced: steps["0"],
    covered: steps.c1 + steps.c2,
    steps,
    priorityShort,
    priorityShare: short.length ? priorityShort / short.length : null,
    top: skills[0] ?? null,
    mean: mean(skills.map((s) => s.value)),
  };
}

/* ---------- hubs ---------- */

export interface HubStat {
  hub: Hub;
  skills: SkillAgg[];
  total: number;
  short: number;
  severe: number;
  mean: number | null;
  step: StepId | null;
}

/** Computed on the rows before the hub filter, so every hub stays comparable on the map. */
export function hubStats(base: GapRow[], hubs: Hub[] = HUBS): HubStat[] {
  return hubs.map((hub) => {
    const skills = aggregateSkills(base.filter((r) => hubLinksRow(hub, r)));
    const m = mean(skills.map((s) => s.value));
    return {
      hub,
      skills,
      total: skills.length,
      short: skills.filter((s) => s.value >= SHORT).length,
      severe: skills.filter((s) => s.value >= SEVERE).length,
      mean: m,
      step: m === null ? null : stepOf(m),
    };
  });
}

/** Skills linked to no hub: general capabilities that apply across the country. */
/** One summary for several hubs drawn as a single map marker. A skill linked to two of them counts once. */
export function poolStats(stats: HubStat[]): Omit<HubStat, "hub"> {
  const seen = new Map<string, SkillAgg>();
  for (const st of stats) for (const s of st.skills) seen.set(s.key, s);
  const skills = [...seen.values()].sort((a, b) => b.value - a.value || a.skill.localeCompare(b.skill));
  const m = mean(skills.map((s) => s.value));
  return {
    skills,
    total: skills.length,
    short: skills.filter((s) => s.value >= SHORT).length,
    severe: skills.filter((s) => s.value >= SEVERE).length,
    mean: m,
    step: m === null ? null : stepOf(m),
  };
}

export function nationwideSkills(base: GapRow[], hubs: Hub[] = HUBS): SkillAgg[] {
  return aggregateSkills(base.filter((r) => !hubs.some((h) => hubLinksRow(h, r))));
}

/* ---------- charts ---------- */

export interface Cell {
  sector: SectorId;
  scenario: ScenarioId;
  n: number;
  short: number;
  mean: number | null;
  step: StepId | null;
}

/** Every sector × future cell, including the ones with no evidence (n = 0). */
export function matrixOf(rows: GapRow[]): Cell[] {
  const out: Cell[] = [];
  for (const sector of SECTOR_IDS)
    for (const scenario of SCENARIO_IDS) {
      const vs = rows.filter((r) => r.sector === sector && r.scenario === scenario).map((r) => r.shortfall);
      const m = mean(vs);
      out.push({ sector, scenario, n: vs.length, short: vs.filter((v) => v >= SHORT).length, mean: m, step: m === null ? null : stepOf(m) });
    }
  return out;
}

export interface GroupStat<K extends string> {
  id: K;
  n: number;
  short: number;
  mean: number | null;
  steps: Record<StepId, number>;
}

function groupStat<K extends string>(id: K, values: number[]): GroupStat<K> {
  const steps = emptySteps();
  for (const v of values) steps[stepOf(v)]++;
  return { id, n: values.length, short: values.filter((v) => v >= SHORT).length, mean: mean(values), steps };
}

/** One entry per future: each row is one skill in that future. */
export function byFuture(rows: GapRow[]): GroupStat<ScenarioId>[] {
  return SCENARIO_IDS.map((s) => groupStat(s, rows.filter((r) => r.scenario === s).map((r) => r.shortfall)));
}

export function bySector(skills: SkillAgg[]): GroupStat<SectorId>[] {
  return SECTOR_IDS.map((s) => groupStat(s, skills.filter((k) => k.sector === s).map((k) => k.value)));
}

export interface Splits {
  n: number;
  priority: Record<PriorityId, number>;
  horizon: Record<HorizonId, number>;
}

/** How the skills in shortfall divide by Qatari-talent priority and by timing. */
export function splitsOf(skills: SkillAgg[]): Splits {
  const short = skills.filter((s) => s.value >= SHORT);
  const priority: Record<PriorityId, number> = { high: 0, medium: 0, low: 0 };
  const horizon: Record<HorizonId, number> = { near_term: 0, both: 0, medium_term: 0 };
  for (const s of short) {
    priority[s.priority]++;
    horizon[s.horizon]++;
  }
  return { n: short.length, priority, horizon };
}

/** Hubs a skill is linked to (empty = applies nationwide). */
export function hubsOfSkill(s: Pick<SkillAgg, "sector" | "skillKey">, hubs: Hub[] = HUBS): Hub[] {
  return hubs.filter((h) => hubLinksRow(h, s));
}
