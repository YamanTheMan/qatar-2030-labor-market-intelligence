import type { Recommendation } from "./types";

export const REC_TYPE: Record<Recommendation["type"], { label: string; color: string }> = {
  programme: { label: "New specialist programme", color: "#8A1538" },
  curriculum: { label: "Curriculum change", color: "#4F7187" },
  bridge: { label: "Bridge & upskilling", color: "#7A5E0B" },
  research: { label: "Research capacity", color: "#4A463F" },
};

export const skillHref = (skillKey: string) => `/explore/?view=skill&skill=${encodeURIComponent(skillKey)}`;
