import path from "node:path";
import { describe, expect, it } from "vitest";
import { build, splitDedupe } from "../scripts/pipeline";
import {
  DIRECTION_LABELS,
  MARKET_WEIGHT,
  HORIZON_IDS,
  HORIZON_LABELS,
  PRIORITY_IDS,
  PRIORITY_LABELS,
  SCENARIOS,
  SCENARIO_IDS,
  SECTORS,
  SECTOR_IDS,
  SOURCE_GROUP,
  SOURCE_SHORT,
} from "../src/lib/meta";
import context from "../src/data/context.json";

const out = build(path.resolve(__dirname, "..", "data"));
const { gaps, signals, sources, weights, coefficients, postings, summary } = out;

describe("row counts", () => {
  it("matches the CSVs", () => {
    expect(gaps).toHaveLength(280);
    expect(signals).toHaveLength(321);
    expect(weights).toHaveLength(276);
    expect(coefficients).toHaveLength(74);
    expect(postings).toHaveLength(285);
  });
  it("rows per future are uneven, as documented", () => {
    const per = Object.fromEntries(SCENARIO_IDS.map((s) => [s, gaps.filter((g) => g.scenario === s).length]));
    expect(per).toEqual({ S1: 137, S2: 25, S3: 82, S4: 18, S5: 18 });
  });
});

describe("headline facts", () => {
  it("224 positive shortfalls, 56 aligned or covered", () => {
    expect(summary.counts.shortfalls).toBe(224);
    expect(summary.counts.alignedOrCovered).toBe(56);
  });
  it("160 skills, 8 sectors, 5 futures", () => {
    expect(summary.counts.skills).toBe(160);
    expect(summary.counts.sectors).toBe(8);
    expect(summary.counts.scenarios).toBe(5);
  });
  it("33 unique source records, 31 distinct titles, 321 signals", () => {
    expect(summary.counts.sourceRecords).toBe(33);
    expect(summary.counts.distinctTitles).toBe(31);
    expect(summary.counts.signals).toBe(321);
  });
  it("flags the two duplicate-title pairs", () => {
    const pairs = sources.filter((s) => s.sameTitleAs).map((s) => s.id).sort();
    expect(pairs).toEqual(["QF_EDU_STRATEGY", "QF_EDU_WEBSITE", "QNDS2", "QNDS3"]);
  });
  it("posting side sums to 1,848", () => {
    expect(summary.counts.postingsClassified).toBe(1848);
    const hc = summary.postings.bySector.find((s) => s.sector === "healthcare");
    expect(hc?.count).toBe(685);
  });
  it("max shortfall is digital transformation in Technology & Digital under Diversification", () => {
    expect(summary.distribution.max).toBeCloseTo(0.9891, 4);
    expect(summary.top20[0]).toBe("S1|technology_digital|digital transformation");
  });
  it("Technology & Digital has the highest average shortfall, Construction the lowest", () => {
    expect(summary.bySector[0].sector).toBe("technology_digital");
    expect(summary.bySector[summary.bySector.length - 1].sector).toBe("construction_real_estate");
  });
  it("priority & horizon distributions", () => {
    expect(summary.priority).toEqual({ high: 204, medium: 74, low: 2 });
    expect(summary.horizon).toEqual({ near_term: 29, medium_term: 72, both: 179 });
    expect(summary.priorityLens.highShortfalls).toBe(165);
  });
  it("no skill is a shortfall in more than 3 futures (safe-bet threshold)", () => {
    expect(Math.max(...summary.safeBets.map((a) => a.shortIn))).toBe(3);
    expect(summary.safeBets).toHaveLength(9);
  });
  it("digital, data & AI skills are short in every future", () => {
    for (const s of SCENARIO_IDS) {
      const f = summary.familyByScenario.find((x) => x.family === "digital" && x.scenario === s)!;
      expect(f.shortfalls).toBeGreaterThan(0);
    }
  });
  it("signal-count penalty equals sqrt(signals / max signals)", () => {
    for (const s of summary.byScenario) {
      const w = weights.find((x) => x.scenario === s.scenario)!;
      expect(w.penalty).toBeCloseTo(s.penalty, 3);
    }
  });
  it("gap = strategic − 2 × market for every row (factor inferred from the data, see DECISIONS.md)", () => {
    for (const g of gaps) expect(g.shortfall).toBeCloseTo(g.strategic - MARKET_WEIGHT * g.market, 3);
  });
});

describe("label mapping completeness", () => {
  it("every sector, future, priority, horizon has a human label", () => {
    for (const g of gaps) {
      expect(SECTORS[g.sector]?.label).toBeTruthy();
      expect(SCENARIOS[g.scenario]?.name).toBeTruthy();
      expect(PRIORITY_LABELS[g.priority]).toBeTruthy();
      expect(HORIZON_LABELS[g.horizon]).toBeTruthy();
    }
    expect(Object.keys(SECTORS).sort()).toEqual([...SECTOR_IDS].sort());
    expect(Object.keys(PRIORITY_LABELS).sort()).toEqual([...PRIORITY_IDS].sort());
    expect(Object.keys(HORIZON_LABELS).sort()).toEqual([...HORIZON_IDS].sort());
  });
  it("every source has a publisher group and a short name", () => {
    for (const s of sources) {
      expect(SOURCE_GROUP[s.id]).toBeTruthy();
      expect(SOURCE_SHORT[s.id]).toBeTruthy();
    }
  });
  it("every demand direction has a label", () => {
    for (const s of signals) expect(DIRECTION_LABELS[s.direction]).toBeTruthy();
  });
  it("skill labels contain no snake_case", () => {
    for (const g of gaps) expect(g.skill).not.toMatch(/_/);
  });
  it("every supporting source on a gap row exists in the audit trail", () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const g of gaps) for (const s of g.sources) expect(ids.has(s)).toBe(true);
  });
});

describe("cleaning", () => {
  it("de-duplicates specific skills", () => {
    expect(splitDedupe("a, b; A ,c;; b")).toEqual(["a", "b", "c"]);
    for (const g of gaps) {
      const lower = g.specificSkills.map((s) => s.toLowerCase());
      expect(new Set(lower).size).toBe(lower.length);
    }
  });
});

describe("context layer", () => {
  it("every fact has value, label, source, url and asOf", () => {
    for (const f of context.facts) {
      expect(f.value).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(f.source).toBeTruthy();
      expect(f.url).toMatch(/^https:\/\//);
      expect(f.asOf).toBeTruthy();
      expect(typeof f.verified).toBe("boolean");
    }
  });
});
