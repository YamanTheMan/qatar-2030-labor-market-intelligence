import { describe, expect, it } from "vitest";
import { boundsOf, groupPoints, labelBox, placeLabels, project, zoomBucket, zoomToSeparate, type LabelSpec } from "../src/components/dash/map/cluster";
import { HUBS } from "../src/lib/hubs";

const sizes = (zoom: number, keep: string | null = null) =>
  groupPoints(HUBS, zoom, 40, keep)
    .map((g) => g.ids.length)
    .sort((a, b) => b - a);

describe("map projection", () => {
  it("matches Web Mercator at known points", () => {
    expect(project(0, 0, 0)).toEqual([256, 256]);
    expect(project(-180, 0, 1)[0]).toBe(0);
    const [x1] = project(51, 25, 8);
    const [x2] = project(52, 25, 8);
    expect(x2 - x1).toBeCloseTo((512 * 2 ** 8) / 360, 6);
  });
});

describe("hub grouping", () => {
  it("shows Doha as one group and the south-east coast as another at the national view", () => {
    const groups = groupPoints(HUBS, 8.5);
    expect(sizes(8.5)).toEqual([12, 2, 1, 1, 1]);
    const doha = groups.find((g) => g.ids.length === 12)!;
    expect(doha.ids).toContain("west-bay");
    expect(doha.ids).toContain("lusail");
    expect(doha.ids).not.toContain("mesaieed");
    expect(groups.find((g) => g.ids.length === 2)!.ids.sort()).toEqual(["hamad-port", "mesaieed"]);
  });
  it("separates every hub once zoomed in", () => {
    expect(sizes(13)).toEqual(HUBS.map(() => 1));
  });
  it("splits into more groups as the zoom rises", () => {
    let last = 0;
    for (const z of [8, 9, 10, 11, 12, 13]) {
      const n = groupPoints(HUBS, z).length;
      expect(n).toBeGreaterThanOrEqual(last);
      last = n;
    }
  });
  it("does not depend on the order of the hubs", () => {
    const a = groupPoints(HUBS, 10.5).map((g) => [...g.ids].sort().join()).sort();
    const b = groupPoints([...HUBS].reverse(), 10.5).map((g) => [...g.ids].sort().join()).sort();
    expect(a).toEqual(b);
  });
  it("keeps the selected hub on its own", () => {
    const groups = groupPoints(HUBS, 8.5, 40, "west-bay");
    expect(groups.find((g) => g.ids.includes("west-bay"))!.ids).toEqual(["west-bay"]);
    expect(groups.reduce((a, g) => a + g.ids.length, 0)).toBe(HUBS.length);
  });
  it("places a group at the centre of its members", () => {
    const g = groupPoints(HUBS, 8.5).find((x) => x.ids.length === 2)!;
    const [[w, s], [e, n]] = boundsOf(HUBS.filter((h) => g.ids.includes(h.id)));
    expect(g.lng).toBeCloseTo((w + e) / 2, 6);
    expect(g.lat).toBeCloseTo((s + n) / 2, 6);
  });
});

describe("zoom helpers", () => {
  it("finds a zoom at which a selected hub stands clear of its neighbours", () => {
    for (const h of HUBS) {
      const z = zoomToSeparate(h, HUBS);
      expect(z).toBeGreaterThanOrEqual(10.5);
      expect(z).toBeLessThanOrEqual(13);
      const alone = groupPoints(HUBS, z, 40).find((g) => g.ids.includes(h.id))!;
      if (z < 13) expect(alone.ids, h.id).toEqual([h.id]);
    }
    expect(zoomToSeparate(HUBS.find((h) => h.id === "dukhan")!, HUBS)).toBe(10.5);
    expect(zoomToSeparate(HUBS.find((h) => h.id === "qstp")!, HUBS)).toBeGreaterThan(11.5);
  });
  it("buckets zoom in quarter steps", () => {
    expect(zoomBucket(8.61)).toBe(8.5);
    expect(zoomBucket(8.63)).toBe(8.75);
  });
});

describe("label placement", () => {
  const frame = { w: 400, h: 300 };
  const spec = (id: string, cx: number, cy: number, extra: Partial<LabelSpec> = {}): LabelSpec => ({ id, cx, cy, r: 15, w: 90, h: 30, ...extra });
  it("prefers the right side and falls back when it is taken or outside the frame", () => {
    expect(placeLabels([spec("a", 100, 100)], frame).get("a")).toEqual({ side: "right", compact: false });
    expect(placeLabels([spec("a", 350, 100)], frame).get("a")?.side).toBe("left");
    // b's pin sits where a's label would go on the right, so a moves to the left
    const two = placeLabels([spec("a", 150, 100), spec("b", 200, 100)], frame);
    expect(two.get("a")?.side).toBe("left");
    expect(two.get("b")?.side).toBe("right");
  });
  it("never lets two labels overlap, and drops the ones that do not fit", () => {
    const crowd = Array.from({ length: 9 }, (_, i) => spec(`p${i}`, 120 + (i % 3) * 34, 100 + Math.floor(i / 3) * 34));
    const placed = placeLabels(crowd, frame);
    expect(placed.size).toBeLessThan(9);
    expect(placed.size).toBeGreaterThan(0);
  });
  it("falls back to the compact label before giving up", () => {
    // room for a 60 px label between the pin and the frame edge, not for a 90 px one
    const tight = { w: 200, h: 60 };
    const placed = placeLabels([spec("a", 100, 30, { compact: { w: 60, h: 20 } })], tight);
    expect(placed.get("a")).toEqual({ side: "right", compact: true });
  });
  it("keeps every placed label clear of the others and of other pins", () => {
    const specs = Array.from({ length: 8 }, (_, i) => spec(`p${i}`, 60 + i * 44, 80 + (i % 2) * 70));
    const wide = { w: 480, h: 300 };
    const placed = placeLabels(specs, wide);
    const boxes = specs.filter((l) => placed.has(l.id)).map((l) => ({ id: l.id, ...labelBox(l, l, placed.get(l.id)!.side) }));
    const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (const a of boxes) {
      for (const b of boxes) if (a.id !== b.id) expect(hit(a, b), `${a.id} over ${b.id}`).toBe(false);
      for (const l of specs) if (l.id !== a.id) expect(hit(a, { x: l.cx - l.r, y: l.cy - l.r, w: l.r * 2, h: l.r * 2 }), `${a.id} over pin ${l.id}`).toBe(false);
    }
    expect(boxes.length).toBeGreaterThan(3);
  });
  it("always shows a forced label", () => {
    const crowd = Array.from({ length: 9 }, (_, i) => spec(`p${i}`, 120 + (i % 3) * 34, 100 + Math.floor(i / 3) * 34, { force: i === 4 }));
    expect(placeLabels(crowd, frame).has("p4")).toBe(true);
  });
});
