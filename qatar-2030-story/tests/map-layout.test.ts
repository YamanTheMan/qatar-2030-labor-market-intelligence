import { describe, expect, it } from "vitest";
import { labelBox } from "../src/components/dash/map/cluster";
import { fitCamera, groupName, groupSize, layoutMarkers, pinSize } from "../src/components/dash/map/layout";
import { DEFAULT_FILTERS, filterRows, hubStats, poolStats } from "../src/lib/dash/model";
import { gaps } from "../src/lib/data";
import { HUBS, QATAR_BOUNDS } from "../src/lib/hubs";

const stats = hubStats(filterRows(gaps, DEFAULT_FILTERS));
const frame = { w: 820, h: 640 };
const cam = fitCamera(QATAR_BOUNDS, frame);
const layout = (over: Partial<Parameters<typeof layoutMarkers>[0]> = {}) => layoutMarkers({ stats, zoom: cam.zoom, toPx: cam.toPx, frame, selected: null, hover: null, ...over });

describe("fixed camera", () => {
  it("fits Qatar inside the frame, centred", () => {
    const [[w, s], [e, n]] = QATAR_BOUNDS;
    const [x0, y1] = cam.toPx(w, s);
    const [x1, y0] = cam.toPx(e, n);
    expect(Math.min(x0, y0)).toBeGreaterThanOrEqual(27.9);
    expect(x1).toBeLessThanOrEqual(frame.w - 27.9);
    expect(y1).toBeLessThanOrEqual(frame.h - 27.9);
    expect((x0 + x1) / 2).toBeCloseTo(frame.w / 2, 6);
    expect((y0 + y1) / 2).toBeCloseTo(frame.h / 2, 6);
    expect(cam.zoom).toBeGreaterThan(7);
    expect(cam.zoom).toBeLessThan(9);
  });
});

describe("pin sizes", () => {
  it("grow with the number of shortfalls and stay touch-sized", () => {
    expect(pinSize(0)).toBe(26);
    expect(pinSize(30)).toBe(46);
    expect(pinSize(90)).toBe(46);
    expect(pinSize(8)).toBeGreaterThan(pinSize(3));
    expect(groupSize(12)).toBeGreaterThan(groupSize(2));
  });
});

describe("markers at the national view", () => {
  const markers = layout();
  it("draws Doha as one group and names the groups", () => {
    expect(markers).toHaveLength(5);
    const titles = markers.map((m) => m.title).sort();
    expect(titles).toEqual(["Al Kharsaah", "Dukhan", "Greater Doha", "Mesaieed & Hamad Port", "Ras Laffan"]);
    const doha = markers.find((m) => m.title === "Greater Doha")!;
    expect(doha.members).toHaveLength(12);
    expect(doha.sub).toBe("12 hubs · click to zoom in");
    expect(doha.total).toBe(poolStats(doha.members).total);
    expect(doha.total).toBeLessThan(doha.members.reduce((a, m) => a + m.total, 0));
  });
  it("covers every hub exactly once and keeps every pin inside the frame", () => {
    expect(markers.flatMap((m) => m.members.map((s) => s.hub.id)).sort()).toEqual(HUBS.map((h) => h.id).sort());
    for (const m of markers) {
      expect(m.x).toBeGreaterThan(0);
      expect(m.x).toBeLessThan(frame.w);
      expect(m.y).toBeGreaterThan(0);
      expect(m.y).toBeLessThan(frame.h);
    }
  });
  it("labels every marker without overlap", () => {
    expect(markers.every((m) => m.label)).toBe(true);
    const boxes = markers.map((m) => ({ id: m.id, ...labelBox({ cx: m.x, cy: m.y, r: m.size / 2 }, { w: 60, h: 22 }, m.label!.side) }));
    for (const a of boxes) for (const b of boxes) if (a.id !== b.id) expect(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y, `${a.id} / ${b.id}`).toBe(false);
  });
});

describe("selection and hover", () => {
  it("pulls the selected hub out of its group and puts it on top", () => {
    const markers = layout({ selected: "west-bay" });
    const own = markers.find((m) => m.id === "west-bay")!;
    expect(own.selected).toBe(true);
    expect(own.members).toHaveLength(1);
    expect(own.label).not.toBeNull();
    expect(Math.max(...markers.map((m) => m.z))).toBe(own.z);
    expect(markers.find((m) => m.title === "Greater Doha")!.members).toHaveLength(11);
  });
  it("marks the group that holds the hovered hub", () => {
    const markers = layout({ hover: "katara" });
    expect(markers.filter((m) => m.active).map((m) => m.title)).toEqual(["Greater Doha"]);
  });
  it("greys a hub with no skills under the filters", () => {
    const s2 = hubStats(filterRows(gaps, { ...DEFAULT_FILTERS, future: "S2" }));
    const markers = layoutMarkers({ stats: s2, zoom: 13, toPx: fitCamera(QATAR_BOUNDS, frame).toPx, frame, selected: null, hover: null });
    expect(markers).toHaveLength(17);
    expect(markers.filter((m) => m.step === null).length).toBeGreaterThan(5);
    expect(markers.filter((m) => m.step === null).every((m) => m.size === 26)).toBe(true);
  });
});

describe("group names", () => {
  const pick = (...ids: string[]) => ids.map((id) => stats.find((s) => s.hub.id === id)!);
  it("names groups after what they contain", () => {
    expect(groupName(pick("mesaieed", "hamad-port"))).toBe("Mesaieed & Hamad Port");
    expect(groupName(pick("education-city", "qstp", "sidra"))).toBe("Education City area");
    expect(groupName(pick("msheireb", "west-bay", "hmc", "corniche"))).toBe("Central Doha");
    expect(groupName(pick("ras-laffan", "dukhan", "mesaieed"))).toBe("3 hubs");
  });
});
