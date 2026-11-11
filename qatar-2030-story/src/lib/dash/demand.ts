/**
 * Demand-first reading of the data: how strongly the 2030 strategies call for a
 * skill, whether today's hiring already reflects it, and a suggested talent
 * response. Pure functions, unit-tested in tests/demand.test.ts.
 *
 * Every figure for a skill comes from one row (the future with its largest
 * shortfall, or the selected future), so demand − 2 × hiring = the gap shown.
 *
 * The talent response is a transparent decision rule on three fields of the
 * data (gap, timing, Qatari-talent priority). It is not a forecast and it does
 * not use any supply data: that arrives in a later phase.
 */
import { HUBS, hubLinksRow, type Hub } from "@/lib/hubs";
import { MARKET_WEIGHT, SCENARIO_IDS, SECTOR_IDS, type ScenarioId, type SectorId } from "@/lib/meta";
import type { GapRow } from "@/lib/types";
import { SEVERE, SHORT, aggregateSkills, type SkillAgg } from "./model";

/* ---------- demand level ---------- */

export const DEMAND_IDS = ["very_strong", "strong", "moderate", "emerging"] as const;
export type DemandId = (typeof DEMAND_IDS)[number];

export const DEMAND: Record<DemandId, { label: string; min: number; note: string }> = {
  very_strong: { label: "Very strong", min: 0.3, note: "0.30 or more" },
  strong: { label: "Strong", min: 0.2, note: "0.20 to 0.30" },
  moderate: { label: "Moderate", min: 0.1, note: "0.10 to 0.20" },
  emerging: { label: "Emerging", min: -Infinity, note: "below 0.10" },
};

export const demandOf = (strategic: number): DemandId => DEMAND_IDS.find((d) => strategic >= DEMAND[d].min) ?? "emerging";

/* ---------- talent response ---------- */

export const RESPONSE_IDS = ["recruit", "reskill", "build", "sustain"] as const;
export type ResponseId = (typeof RESPONSE_IDS)[number];

export const RESPONSES: Record<ResponseId, { label: string; short: string; rule: string; action: string; fill: string }> = {
  recruit: {
    label: "Recruit internationally now",
    short: "Recruit",
    rule: "Needed now, and the gap is large (0.15 or more).",
    action: "Local training cannot close a gap this size in time. Hire experienced people from abroad, and train Qataris alongside them.",
    fill: "var(--r-recruit)",
  },
  reskill: {
    label: "Reskill the current workforce",
    short: "Reskill",
    rule: "A smaller gap, or not a Qatari-talent priority.",
    action: "Upskill people already working in nearby roles. Short courses and on-the-job programmes can close a gap of this size.",
    fill: "var(--r-reskill)",
  },
  build: {
    label: "Build Qatari talent",
    short: "Build",
    rule: "Needed by 2030 and flagged as a priority for Qatari nationals.",
    action: "There is time to grow the pipeline: degrees, scholarships and national programmes aimed at Qatari graduates.",
    fill: "var(--r-build)",
  },
  sustain: {
    label: "Already in today's hiring",
    short: "In hiring",
    rule: "Gap below 0.05.",
    action: "Employers already advertise for it at about the level the strategies expect. Keep the current pipeline going.",
    fill: "var(--line-strong)",
  },
};

const neededNow = (s: SkillAgg) => s.horizon === "near_term" || s.horizon === "both";

export function responseOf(s: SkillAgg): ResponseId {
  if (s.value < SHORT) return "sustain";
  if (neededNow(s)) return s.value >= SEVERE ? "recruit" : "reskill";
  return s.priority === "high" ? "build" : "reskill";
}

export type ResponseCounts = Record<ResponseId, number>;

export function responseCounts(skills: SkillAgg[]): ResponseCounts {
  const out: ResponseCounts = { recruit: 0, reskill: 0, build: 0, sustain: 0 };
  for (const s of skills) out[responseOf(s)]++;
  return out;
}

/* ---------- plain-language reason for the gap ---------- */

const pct = (v: number) => (v < 0.001 && v > 0 ? "under 0.1%" : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`);

/** Why a skill has (or has no) gap, from the two numbers behind it. */
export function gapReason(s: SkillAgg): string {
  const m = s.peak.market;
  if (s.value < SHORT) return `Employers already ask for it in ${pct(m)} of job ads, which is about what the strategies expect or more.`;
  if (m < 0.005)
    return `Hardly any job ads in Qatar ask for it today (${pct(m)}). The strategies expect it to matter by 2030, so employers have not started hiring for it and no local pipeline is visible yet.`;
  return `Employers already ask for it in ${pct(m)} of job ads, but the strategies expect demand to grow well beyond today's hiring.`;
}

/** The two inputs of the gap on one scale: demand and today's hiring (× the pipeline's weight). */
export const hiringSignal = (s: SkillAgg) => MARKET_WEIGHT * s.peak.market;

/* ---------- skills workers need to learn ---------- */

export interface LearnSkill {
  name: string;
  /** skill areas that list it */
  areas: number;
  /** of those, areas with a gap */
  gapAreas: number;
  sectors: SectorId[];
}

/** Specific skills named in the sources, ranked by how many skill areas in view call for them. */
export function skillsToLearn(skills: SkillAgg[], limit = 16): LearnSkill[] {
  const m = new Map<string, LearnSkill>();
  for (const s of skills)
    for (const raw of s.specificSkills) {
      const k = raw.trim().toLowerCase();
      if (!k) continue;
      const e = m.get(k) ?? { name: raw.trim().replace(/^./, (c) => c.toUpperCase()), areas: 0, gapAreas: 0, sectors: [] };
      e.areas++;
      if (s.value >= SHORT) e.gapAreas++;
      if (!e.sectors.includes(s.sector)) e.sectors.push(s.sector);
      m.set(k, e);
    }
  return [...m.values()].sort((a, b) => b.areas - a.areas || b.gapAreas - a.gapAreas || a.name.localeCompare(b.name)).slice(0, limit);
}

/* ---------- sector briefing ---------- */

export interface Driver {
  id: ScenarioId;
  /** skill areas the strategies call for in this future */
  n: number;
  signals: number;
  /** mean strategic demand of those skill areas */
  demand: number | null;
}

export interface SectorBrief {
  sector: SectorId;
  skills: SkillAgg[];
  total: number;
  gap: number;
  strongDemand: number;
  responses: ResponseCounts;
  drivers: Driver[];
  hubs: Hub[];
  learn: LearnSkill[];
  /** mean demand of the skills in view */
  demand: number | null;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * `rows` are already filtered (future, timing, priority, search, hub).
 * `allFutures` are the same rows without the future filter, for the drivers chart.
 */
export function sectorBrief(sector: SectorId, rows: GapRow[], allFutures: GapRow[], hubs: Hub[] = HUBS): SectorBrief {
  const skills = aggregateSkills(rows.filter((r) => r.sector === sector));
  const own = allFutures.filter((r) => r.sector === sector);
  return {
    sector,
    skills,
    total: skills.length,
    gap: skills.filter((s) => s.value >= SHORT).length,
    strongDemand: skills.filter((s) => s.peak.strategic >= DEMAND.strong.min).length,
    responses: responseCounts(skills),
    drivers: SCENARIO_IDS.map((id) => {
      const rs = own.filter((r) => r.scenario === id);
      return { id, n: rs.length, signals: rs.reduce((a, r) => a + r.signalCount, 0), demand: mean(rs.map((r) => r.strategic)) };
    }),
    hubs: hubs.filter((h) => own.some((r) => hubLinksRow(h, r))),
    learn: skillsToLearn(skills, 10),
    demand: mean(skills.map((s) => s.peak.strategic)),
  };
}

export interface SectorRow {
  sector: SectorId;
  total: number;
  gap: number;
  strongDemand: number;
  demand: number | null;
  responses: ResponseCounts;
}

/** One line per sector for the overview, largest number of strongly demanded skills first. */
export function sectorOverview(skills: SkillAgg[]): SectorRow[] {
  return SECTOR_IDS.map((sector) => {
    const ss = skills.filter((s) => s.sector === sector);
    return {
      sector,
      total: ss.length,
      gap: ss.filter((s) => s.value >= SHORT).length,
      strongDemand: ss.filter((s) => s.peak.strategic >= DEMAND.strong.min).length,
      demand: mean(ss.map((s) => s.peak.strategic)),
      responses: responseCounts(ss),
    };
  })
    .filter((r) => r.total > 0)
    .sort((a, b) => (b.demand ?? 0) - (a.demand ?? 0));
}

/** Three-word version of `gapReason`, for lists. */
export function gapShort(s: SkillAgg): string {
  if (s.value < SHORT) return "Already in hiring";
  return s.peak.market < 0.005 ? "Almost no job ads yet" : "Hiring, but below 2030 demand";
}
