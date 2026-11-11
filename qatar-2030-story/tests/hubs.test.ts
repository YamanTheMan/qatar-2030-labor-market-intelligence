import { describe, expect, it } from "vitest";
import gaps from "../src/data/gaps.json";
import region from "../src/data/geo/region.json";
import { HUBS, HUB_KINDS, MAP_VIEWS, QATAR_BOUNDS, hubsForRow, rowsForHub } from "../src/lib/hubs";
import { SECTOR_IDS } from "../src/lib/meta";
import type { GapRow } from "../src/lib/types";

const rows = gaps as GapRow[];

describe("hub reference layer", () => {
  it("has unique ids and a known kind", () => {
    expect(new Set(HUBS.map((h) => h.id)).size).toBe(HUBS.length);
    for (const h of HUBS) expect(Object.keys(HUB_KINDS)).toContain(h.kind);
  });

  it("places every hub inside Qatar", () => {
    const [[w, s], [e, n]] = QATAR_BOUNDS;
    for (const h of HUBS) {
      expect(h.lng, h.id).toBeGreaterThan(w);
      expect(h.lng, h.id).toBeLessThan(e);
      expect(h.lat, h.id).toBeGreaterThan(s);
      expect(h.lat, h.id).toBeLessThan(n);
    }
  });

  it("lists organisations and a description for every hub", () => {
    for (const h of HUBS) {
      expect(h.anchors.length, h.id).toBeGreaterThanOrEqual(2);
      expect(h.blurb.length, h.id).toBeGreaterThan(40);
    }
  });

  it("only uses sectors that exist, and every keyword matches a real skill", () => {
    for (const h of HUBS)
      for (const l of h.links) {
        expect(SECTOR_IDS).toContain(l.sector);
        for (const k of l.keywords ?? []) {
          expect(k, `${h.id}: keywords must be lower-case`).toBe(k.toLowerCase());
          const hits = rows.filter((r) => r.sector === l.sector && r.skillKey.toLowerCase().includes(k));
          expect(hits.length, `${h.id} · ${l.sector} · "${k}" matches no skill`).toBeGreaterThan(0);
        }
      }
  });

  it("links every hub to at least five skill rows", () => {
    for (const h of HUBS) expect(rowsForHub(h, rows).length, h.id).toBeGreaterThanOrEqual(5);
  });

  it("leaves only general cross-sector skills without a place", () => {
    const nationwide = rows.filter((r) => hubsForRow(r).length === 0);
    expect(new Set(nationwide.map((r) => r.sector))).toEqual(new Set(["cross_sector"]));
    expect(nationwide).toHaveLength(57);
  });

  it("gives every sector at least one hub", () => {
    for (const s of SECTOR_IDS) {
      const n = HUBS.filter((h) => h.links.some((l) => l.sector === s)).length;
      expect(n, s).toBeGreaterThan(0);
    }
  });
});

describe("map geometry", () => {
  it("ships Qatar plus its neighbours for the offline outline", () => {
    const names = region.features.map((f) => f.properties.name);
    expect(names).toContain("Qatar");
    expect(region.features.filter((f) => f.properties.home)).toHaveLength(1);
    expect(names.length).toBeGreaterThanOrEqual(4);
  });

  it("offers map views centred inside the region frame", () => {
    for (const v of MAP_VIEWS) {
      expect(v.center[0]).toBeGreaterThan(50);
      expect(v.center[0]).toBeLessThan(52);
      expect(v.center[1]).toBeGreaterThan(24);
      expect(v.center[1]).toBeLessThan(26.5);
    }
  });
});

describe("map labels", () => {
  it("gives every hub a short second line drawn from its organisations", async () => {
    const { HUBS } = await import("../src/lib/hubs");
    for (const h of HUBS) {
      expect(h.tag.length, h.id).toBeGreaterThan(8);
      expect(h.tag.length, h.id).toBeLessThanOrEqual(38);
      expect(h.tag, h.id).not.toBe(h.short);
    }
  });
});
