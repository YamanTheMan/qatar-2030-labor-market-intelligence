"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { gaps } from "@/lib/data";
import { HORIZON_IDS, PRIORITY_IDS, SCENARIO_IDS, SECTOR_IDS, type HorizonId, type PriorityId, type ScenarioId, type SectorId } from "@/lib/meta";
import type { GapRow } from "@/lib/types";

export const VIEWS = [
  { id: "ranking", label: "Shortfall ranking" },
  { id: "matrix", label: "Sector × future" },
  { id: "skill", label: "Skill detail" },
  { id: "source", label: "Source detail" },
  { id: "model", label: "Model transparency" },
  { id: "tables", label: "Data tables" },
] as const;
export type ViewId = (typeof VIEWS)[number]["id"];

export interface Filters {
  f: ScenarioId[];
  sec: SectorId[];
  p: PriorityId[];
  h: HorizonId[];
  q: string;
}

function list<T extends string>(v: string | null, allowed: readonly T[]): T[] {
  if (!v) return [];
  return v.split(",").filter((x): x is T => (allowed as readonly string[]).includes(x));
}

/** URL-encoded explorer state, so every view is shareable. */
export function useExplorerState() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const view = (VIEWS.find((v) => v.id === sp.get("view"))?.id ?? "ranking") as ViewId;
  const filters: Filters = useMemo(
    () => ({
      f: list(sp.get("f"), SCENARIO_IDS),
      sec: list(sp.get("sec"), SECTOR_IDS),
      p: list(sp.get("p"), PRIORITY_IDS),
      h: list(sp.get("h"), HORIZON_IDS),
      q: sp.get("q") ?? "",
    }),
    [sp],
  );

  const set = useCallback(
    (patch: Record<string, string | string[] | null | undefined>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        const s = Array.isArray(v) ? v.join(",") : v;
        if (s === null || s === undefined || s === "") next.delete(k);
        else next.set(k, s);
      }
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [sp, router, pathname],
  );

  return { sp, view, filters, set };
}

export function applyFilters(rows: GapRow[], f: Filters): GapRow[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter(
    (g) =>
      (!f.f.length || f.f.includes(g.scenario)) &&
      (!f.sec.length || f.sec.includes(g.sector)) &&
      (!f.p.length || f.p.includes(g.priority)) &&
      (!f.h.length || f.h.includes(g.horizon)) &&
      (!q || g.skill.toLowerCase().includes(q) || g.specificSkills.some((s) => s.toLowerCase().includes(q))),
  );
}

export const allGaps = gaps;

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("; ") : v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
