/**
 * Turns hub statistics into the markers the map draws: which hubs stand alone, which
 * merge into a group at this zoom, how big and what colour each pin is, and where its
 * label goes. Pure, so the live map and the static fallback draw exactly the same thing.
 */
import { poolStats, type HubStat, type SkillAgg, type StepId } from "@/lib/dash/model";
import { groupPoints, placeLabels, project, textWidth, type LabelSpec, type Placement } from "./cluster";

/** Pin diameter. The area grows with the number of linked skills in shortfall; 30 is the most any hub has. */
export const pinSize = (short: number) => Math.round(26 + 20 * Math.sqrt(Math.min(short, 30) / 30));
export const groupSize = (n: number) => Math.round(36 + 16 * Math.sqrt(Math.min(n, 12) / 12));

const DOHA_AREA = new Set(["Doha", "Al Rayyan", "Al Daayen"]);

export function groupName(members: HubStat[]): string {
  if (members.length === 2) return `${members[0].hub.short} & ${members[1].hub.short}`;
  const towns = members.map((m) => m.hub.municipality);
  if (towns.every((t) => DOHA_AREA.has(t))) {
    if (members.length >= 8) return "Greater Doha";
    if (towns.every((t) => t === "Doha")) return "Central Doha";
    const lead = [...members].sort((a, b) => b.total - a.total)[0];
    return `${lead.hub.short} area`;
  }
  return `${members.length} hubs`;
}

export interface MarkerSpec {
  /** hub id, or the member ids joined with "+" for a group */
  id: string;
  lng: number;
  lat: number;
  /** pixel position inside the map frame */
  x: number;
  y: number;
  /** one member = a hub, more = a group */
  members: HubStat[];
  size: number;
  step: StepId | null;
  total: number;
  short: number;
  severe: number;
  mean: number | null;
  skills: SkillAgg[];
  title: string;
  sub: string;
  label: Placement | null;
  selected: boolean;
  active: boolean;
  z: number;
}

export interface LayoutInput {
  stats: HubStat[];
  zoom: number;
  toPx: (lng: number, lat: number) => [number, number];
  frame: { w: number; h: number };
  selected: string | null;
  hover: string | null;
  /** second label line of a group */
  groupHint?: (n: number) => string;
}

const TITLE_CHAR = 6.5;
const SUB_CHAR = 5.6;
const LABEL_PAD = 16;

export function layoutMarkers({ stats, zoom, toPx, frame, selected, hover, groupHint = (n) => `${n} hubs · click to zoom in` }: LayoutInput): MarkerSpec[] {
  const byId = new Map(stats.map((s) => [s.hub.id, s]));
  const groups = groupPoints(
    stats.map((s) => s.hub),
    zoom,
    40,
    selected,
  );

  const markers: MarkerSpec[] = groups.map((g) => {
    const members = g.ids.map((id) => byId.get(id)!);
    const single = members.length === 1;
    const pooled = single ? members[0] : poolStats(members);
    const [x, y] = toPx(g.lng, g.lat);
    const isSelected = single && members[0].hub.id === selected;
    const active = hover !== null && g.ids.includes(hover);
    const size = single ? pinSize(pooled.short) : groupSize(members.length);
    return {
      id: g.id,
      lng: g.lng,
      lat: g.lat,
      x,
      y,
      members,
      size,
      step: pooled.step,
      total: pooled.total,
      short: pooled.short,
      severe: pooled.severe,
      mean: pooled.mean,
      skills: pooled.skills,
      title: single ? members[0].hub.short : groupName(members),
      sub: single ? members[0].hub.tag : groupHint(members.length),
      label: null,
      selected: isSelected,
      active,
      // small pins sit above large ones so none is hidden; hovered and selected pins go on top
      z: 100 - size + (active ? 200 : 0) + (isSelected ? 400 : 0),
    };
  });

  // Labels are placed most important first: selected, hovered, then by the number of shortfalls.
  const rank = (m: MarkerSpec) => (m.selected ? 2000 : 0) + (m.active ? 1000 : 0) + m.short + (m.members.length > 1 ? 100 : 0);
  const order = [...markers].sort((a, b) => rank(b) - rank(a));
  const specs: LabelSpec[] = order.map((m) => {
    const titleW = textWidth(m.title, TITLE_CHAR) + LABEL_PAD;
    return {
      id: m.id,
      cx: m.x,
      cy: m.y,
      r: m.size / 2,
      w: Math.max(titleW, textWidth(m.sub, SUB_CHAR) + LABEL_PAD),
      h: 36,
      compact: { w: titleW, h: 22 },
      force: m.selected || m.active,
    };
  });
  const placed = placeLabels(specs, frame);
  for (const m of markers) m.label = placed.get(m.id) ?? null;
  return markers;
}

/* ---------- a fixed camera for the static fallback ---------- */

export interface Camera {
  zoom: number;
  toPx: (lng: number, lat: number) => [number, number];
}

/** The same fit the live map makes on load: the bounds centred in the frame, inside the padding. */
export function fitCamera(bounds: [[number, number], [number, number]], frame: { w: number; h: number }, pad = 28): Camera {
  const [[w, s], [e, n]] = bounds;
  const [x0, y1] = project(w, s, 0);
  const [x1, y0] = project(e, n, 0);
  const scale = Math.min(Math.max(1, frame.w - pad * 2) / (x1 - x0), Math.max(1, frame.h - pad * 2) / (y1 - y0));
  const zoom = Math.log2(scale);
  const cx = ((x0 + x1) / 2) * scale;
  const cy = ((y0 + y1) / 2) * scale;
  return {
    zoom,
    toPx: (lng, lat) => {
      const [x, y] = project(lng, lat, zoom);
      return [x - cx + frame.w / 2, y - cy + frame.h / 2];
    },
  };
}
