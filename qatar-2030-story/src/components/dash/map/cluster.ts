/**
 * Screen-space grouping of hubs, so pins never pile up at low zoom.
 * Pure functions (Web Mercator maths, no map instance), unit-tested.
 */
export interface Pt {
  id: string;
  lng: number;
  lat: number;
}

export interface Group {
  /** member ids joined with "+", stable for a given membership */
  id: string;
  ids: string[];
  lng: number;
  lat: number;
}

/** MapLibre's world is 512 px wide at zoom 0. */
const WORLD = 512;

export function project(lng: number, lat: number, zoom: number): [number, number] {
  const scale = WORLD * 2 ** zoom;
  const s = Math.sin((lat * Math.PI) / 180);
  return [((lng + 180) / 360) * scale, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale];
}

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Hubs closer than `radius` screen pixels at `zoom` join one group, and groups chain
 * (single linkage), so the result does not depend on the order of the input.
 * `keep` (the selected hub) always stands alone.
 */
export function groupPoints(points: Pt[], zoom: number, radius = 40, keep: string | null = null): Group[] {
  const xy = points.map((p) => project(p.lng, p.lat, zoom));
  const parent = points.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < points.length; i++) {
    if (points[i].id === keep) continue;
    for (let j = i + 1; j < points.length; j++) {
      if (points[j].id === keep) continue;
      if (dist(xy[i], xy[j]) < radius) parent[find(j)] = find(i);
    }
  }
  const members = new Map<number, Pt[]>();
  points.forEach((p, i) => {
    const root = find(i);
    const list = members.get(root);
    if (list) list.push(p);
    else members.set(root, [p]);
  });
  return [...members.values()].map((list) => ({
    id: list.map((p) => p.id).join("+"),
    ids: list.map((p) => p.id),
    lng: list.reduce((a, p) => a + p.lng, 0) / list.length,
    lat: list.reduce((a, p) => a + p.lat, 0) / list.length,
  }));
}

/** Lowest zoom at which `target` sits at least `px` pixels from every other point. */
export function zoomToSeparate(target: Pt, points: Pt[], px = 44, min = 10.5, max = 13): number {
  const t = project(target.lng, target.lat, 0);
  let nearest = Infinity;
  for (const p of points) {
    if (p.id === target.id) continue;
    nearest = Math.min(nearest, dist(t, project(p.lng, p.lat, 0)));
  }
  if (!Number.isFinite(nearest) || nearest === 0) return min;
  return Math.min(max, Math.max(min, Math.log2(px / nearest)));
}

/** [[west, south], [east, north]] of a set of points. */
export function boundsOf(points: Pt[]): [[number, number], [number, number]] {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/** Zoom buckets: groups are recomputed only when the zoom moves into another quarter step. */
export const zoomBucket = (zoom: number) => Math.round(zoom * 4) / 4;

/* ---------- label placement ---------- */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Side = "right" | "left" | "below" | "above";
export interface LabelSpec {
  id: string;
  /** pin centre in pixels */
  cx: number;
  cy: number;
  /** pin radius in pixels */
  r: number;
  w: number;
  h: number;
  /** a smaller version (title only), tried when the full label fits nowhere */
  compact?: { w: number; h: number };
  /** always shown, even if it overlaps (selected or hovered pin) */
  force?: boolean;
}
export interface Placement {
  side: Side;
  compact: boolean;
}

const overlaps = (a: Box, b: Box, pad = 2) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

export function labelBox(l: Pick<LabelSpec, "cx" | "cy" | "r">, size: { w: number; h: number }, side: Side, gap = 6): Box {
  const { w, h } = size;
  if (side === "right") return { x: l.cx + l.r + gap, y: l.cy - h / 2, w, h };
  if (side === "left") return { x: l.cx - l.r - gap - w, y: l.cy - h / 2, w, h };
  if (side === "below") return { x: l.cx - w / 2, y: l.cy + l.r + gap, w, h };
  return { x: l.cx - w / 2, y: l.cy - l.r - gap - h, w, h };
}

const SIDES: Side[] = ["right", "left", "below", "above"];

/**
 * Greedy placement in the order given (most important first): try right, left, below,
 * above with the full label, then with the compact one; a label that fits nowhere is
 * left out. Labels never cover a pin or each other and stay inside the frame.
 */
export function placeLabels(labels: LabelSpec[], frame: { w: number; h: number }, sides: Side[] = SIDES): Map<string, Placement> {
  const pins: Box[] = labels.map((l) => ({ x: l.cx - l.r, y: l.cy - l.r, w: l.r * 2, h: l.r * 2 }));
  const placed: Box[] = [];
  const out = new Map<string, Placement>();
  const inside = (b: Box) => b.x >= 4 && b.y >= 4 && b.x + b.w <= frame.w - 4 && b.y + b.h <= frame.h - 4;
  labels.forEach((l, i) => {
    const free = (b: Box) => inside(b) && !placed.some((t) => overlaps(b, t)) && !pins.some((t, k) => k !== i && overlaps(b, t));
    const variants = [{ size: { w: l.w, h: l.h }, compact: false }, ...(l.compact ? [{ size: l.compact, compact: true }] : [])];
    for (const v of variants) {
      const side = sides.find((s) => free(labelBox(l, v.size, s)));
      if (side) {
        placed.push(labelBox(l, v.size, side));
        out.set(l.id, { side, compact: v.compact });
        return;
      }
    }
    if (l.force) {
      const side = sides.find((s) => inside(labelBox(l, l, s))) ?? sides[0];
      placed.push(labelBox(l, l, side));
      out.set(l.id, { side, compact: false });
    }
  });
  return out;
}

/** Rough pixel width of a label line, good enough for collision tests. */
export const textWidth = (text: string, pxPerChar: number) => Math.ceil(text.length * pxPerChar);
