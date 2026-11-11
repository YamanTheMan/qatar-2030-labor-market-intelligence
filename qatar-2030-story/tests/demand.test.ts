import { describe, expect, it } from "vitest";
import gaps from "../src/data/gaps.json";
import { DEMAND, demandOf, gapReason, responseCounts, responseOf, sectorBrief, sectorOverview, skillsToLearn } from "../src/lib/dash/demand";
import { SHORT, aggregateSkills } from "../src/lib/dash/model";
import type { GapRow } from "../src/lib/types";

const rows = gaps as GapRow[];
const skills = aggregateSkills(rows);

describe("demand levels", () => {
  it("cuts at 0.30, 0.20 and 0.10", () => {
    expect(demandOf(0.3)).toBe("very_strong");
    expect(demandOf(0.29)).toBe("strong");
    expect(demandOf(0.1)).toBe("moderate");
    expect(demandOf(0.05)).toBe("emerging");
    expect(demandOf(-0.1)).toBe("emerging");
    expect(DEMAND.strong.min).toBe(0.2);
  });
});

describe("talent response rule", () => {
  it("puts every skill in exactly one response", () => {
    const c = responseCounts(skills);
    expect(c.recruit + c.reskill + c.build + c.sustain).toBe(163);
  });

  it("matches the documented split for all futures", () => {
    expect(responseCounts(skills)).toEqual({ recruit: 59, reskill: 51, build: 19, sustain: 34 });
  });

  it("never asks to recruit or build for a skill without a gap", () => {
    for (const s of skills) if (s.value < SHORT) expect(responseOf(s)).toBe("sustain");
  });

  it("recruits only for large gaps needed now", () => {
    for (const s of skills.filter((k) => responseOf(k) === "recruit")) {
      expect(s.value).toBeGreaterThanOrEqual(0.15);
      expect(s.horizon).not.toBe("medium_term");
    }
  });
});

describe("plain-language reasons", () => {
  it("explains every skill in one or two sentences", () => {
    for (const s of skills) {
      const t = gapReason(s);
      expect(t.length).toBeGreaterThan(40);
      expect(t).toMatch(/job ads/);
    }
  });
});

describe("sector briefing", () => {
  it("adds up for energy", () => {
    const b = sectorBrief("energy_lng", rows, rows);
    expect(b.total).toBe(16);
    expect(Object.values(b.responses).reduce((a, n) => a + n, 0)).toBe(16);
    expect(b.drivers).toHaveLength(5);
    expect(b.hubs.length).toBeGreaterThan(0);
  });

  it("covers every skill in the overview", () => {
    const o = sectorOverview(skills);
    expect(o.reduce((a, r) => a + r.total, 0)).toBe(163);
  });

  it("ranks specific skills by how many areas list them", () => {
    const l = skillsToLearn(skills, 10);
    expect(l).toHaveLength(10);
    for (let i = 1; i < l.length; i++) expect(l[i - 1].areas).toBeGreaterThanOrEqual(l[i].areas);
  });
});
