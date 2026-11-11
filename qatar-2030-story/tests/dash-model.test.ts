import { describe, expect, it } from "vitest";
import gaps from "../src/data/gaps.json";
import { DEFAULT_FILTERS, SHORT, aggregateSkills, byFuture, bySector, filterRows, hubRows, hubStats, kpisOf, matrixOf, nationwideSkills, splitsOf, stepOf } from "../src/lib/dash/model";
import { bandOf } from "../src/lib/meta";
import type { GapRow } from "../src/lib/types";

const rows = gaps as GapRow[];
const all = aggregateSkills(rows);

describe("colour steps", () => {
  it("nest inside the named bands", () => {
    for (const r of rows) {
      const step = stepOf(r.shortfall);
      const band = bandOf(r.shortfall);
      if (band === "severe") expect(["2", "3", "4"]).toContain(step);
      if (band === "notable") expect(step).toBe("1");
      if (band === "aligned") expect(step).toBe("0");
      if (band === "covered") expect(["c1", "c2"]).toContain(step);
    }
  });
  it("puts each edge in the upper step", () => {
    expect(stepOf(0.05)).toBe("1");
    expect(stepOf(0.0499)).toBe("0");
    expect(stepOf(0.3)).toBe("4");
    expect(stepOf(-0.15)).toBe("c1");
    expect(stepOf(-0.2)).toBe("c2");
  });
});

describe("skills", () => {
  it("has one row per future inside each sector × skill pair", () => {
    expect(all).toHaveLength(163);
    for (const s of all) expect(new Set(s.rows.map((r) => r.scenario)).size).toBe(s.rows.length);
    expect(all.reduce((a, s) => a + s.rows.length, 0)).toBe(rows.length);
  });
  it("takes the largest shortfall across futures as the headline value", () => {
    for (const s of all) expect(s.value).toBe(Math.max(...s.rows.map((r) => r.shortfall)));
    expect(all[0].value).toBeGreaterThanOrEqual(all[1].value);
  });
  it("produces the headline numbers shown on first load", () => {
    const k = kpisOf(all);
    expect(k.total).toBe(163);
    expect(k.short).toBe(129);
    expect(k.severe).toBe(74);
    expect(k.short + k.balanced + k.covered).toBe(k.total);
    expect(k.top?.skillKey).toBe("digital transformation");
    expect(k.priorityShare).toBeGreaterThan(0.5);
  });
});

describe("filters", () => {
  it("returns everything by default", () => {
    expect(filterRows(rows, DEFAULT_FILTERS)).toHaveLength(rows.length);
  });
  it("narrows by future, sector and priority", () => {
    const f = { ...DEFAULT_FILTERS, future: "S3" as const, sector: "energy_lng" as const, priority: true };
    const out = filterRows(rows, f);
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) expect([r.scenario, r.sector, r.priority]).toEqual(["S3", "energy_lng", "high"]);
    expect(filterRows(rows, f, ["sector"]).length).toBeGreaterThan(out.length);
  });
  it("treats 'now and through 2030' as part of both horizons", () => {
    const near = filterRows(rows, { ...DEFAULT_FILTERS, horizon: "near_term" });
    expect(near.every((r) => r.horizon !== "medium_term")).toBe(true);
    expect(near.some((r) => r.horizon === "both")).toBe(true);
  });
  it("searches skill names, specific skills and sector names", () => {
    expect(filterRows(rows, { ...DEFAULT_FILTERS, q: "cybersecurity" }).length).toBeGreaterThan(0);
    expect(filterRows(rows, { ...DEFAULT_FILTERS, q: "healthcare" }).length).toBeGreaterThan(10);
    expect(filterRows(rows, { ...DEFAULT_FILTERS, q: "zzzz" })).toHaveLength(0);
  });
});

describe("hubs", () => {
  it("keeps every hub comparable and consistent with the hub filter", () => {
    const stats = hubStats(rows);
    expect(stats).toHaveLength(17);
    for (const s of stats) {
      expect(s.total).toBeGreaterThan(0);
      expect(s.step).not.toBeNull();
      expect(aggregateSkills(hubRows(rows, s.hub.id))).toHaveLength(s.total);
    }
    expect(hubRows(rows, "no-such-hub")).toHaveLength(rows.length);
  });
  it("accounts for every skill as either placed or nationwide", () => {
    const placed = new Set(hubStats(rows).flatMap((s) => s.skills.map((k) => k.key)));
    const nation = nationwideSkills(rows);
    expect(placed.size + nation.length).toBe(163);
    expect(nation.every((s) => s.sector === "cross_sector")).toBe(true);
  });
});

describe("chart data", () => {
  it("builds the full 8 × 5 matrix with empty cells marked", () => {
    const m = matrixOf(rows);
    expect(m).toHaveLength(40);
    expect(m.filter((c) => c.n > 0)).toHaveLength(29);
    for (const c of m) expect(c.mean === null).toBe(c.n === 0);
  });
  it("counts rows per future and skills per sector", () => {
    expect(byFuture(rows).map((f) => f.n)).toEqual([137, 25, 82, 18, 18]);
    expect(bySector(all).reduce((a, s) => a + s.n, 0)).toBe(163);
  });
  it("splits the skills in shortfall by priority and timing", () => {
    const s = splitsOf(all);
    expect(s.n).toBe(all.filter((k) => k.value >= SHORT).length);
    expect(s.priority.high + s.priority.medium + s.priority.low).toBe(s.n);
    expect(s.horizon.near_term + s.horizon.both + s.horizon.medium_term).toBe(s.n);
  });
});
