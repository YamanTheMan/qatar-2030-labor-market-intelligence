import { interpolateRgb } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import type { BandId } from "./meta";

export const C = {
  paper: "#F4F5F7",
  paper2: "#EEF0F3",
  ink: "#14171F",
  ink2: "#475467",
  muted: "#5F6B7C",
  rule: "#E4E7EC",
  maroon: "#8A1538",
  maroonDeep: "#5C0E26",
  maroonSoft: "#F9ECF0",
  slate: "#4F7187",
  slateSoft: "#DCE6EC",
  gold: "#C9A227",
  goldInk: "#7A5E0B",
  goldSoft: "#F6EDCF",
  empty: "#E9ECF0",
} as const;

/** Sequential maroon for positive shortfall; separate cool slate for negative (covered). */
const pos = scaleLinear<string>()
  .domain([0, 0.12, 0.3, 1])
  .range(["#F7ECEE", "#D98DA2", C.maroon, "#4C0B1F"])
  .interpolate(interpolateRgb)
  .clamp(true);
const neg = scaleLinear<string>().domain([0, -0.3]).range(["#EEF2F4", C.slate]).interpolate(interpolateRgb).clamp(true);

export function shortfallFill(v: number): string {
  return v >= 0 ? pos(v) : neg(v);
}
/** text colour that stays legible on shortfallFill(v) */
export function shortfallText(v: number): string {
  return v >= 0.2 || v <= -0.2 ? "#FFFFFF" : C.ink;
}

export const BAND_COLORS: Record<BandId, string> = {
  severe: C.maroon,
  notable: "#C8798F",
  aligned: "#B7BCC6",
  covered: C.slate,
};
