"use client";
import { useCallback, useEffect, useState } from "react";
import { hubById } from "@/lib/hubs";
import { SCENARIO_IDS, SECTOR_IDS, type ScenarioId, type SectorId } from "@/lib/meta";
import { DEFAULT_FILTERS, type Filters } from "./model";

/** Everything the page can be linked to: the filters plus the open skill panel. */
export interface DashState extends Filters {
  /** key of the skill shown in the detail panel ("sector|skill") */
  skill: string | null;
}

export const DEFAULT_STATE: DashState = { ...DEFAULT_FILTERS, skill: null };

export function parseState(search: string): DashState {
  const p = new URLSearchParams(search);
  const future = p.get("future");
  const sector = p.get("sector");
  const when = p.get("when");
  const hub = p.get("hub");
  return {
    future: (SCENARIO_IDS as readonly string[]).includes(future ?? "") ? (future as ScenarioId) : "all",
    sector: (SECTOR_IDS as readonly string[]).includes(sector ?? "") ? (sector as SectorId) : "all",
    horizon: when === "near_term" || when === "medium_term" ? when : "all",
    priority: p.get("priority") === "1",
    hub: hub && hubById.has(hub) ? hub : null,
    q: (p.get("q") ?? "").slice(0, 80),
    skill: p.get("skill") || null,
  };
}

export function serializeState(s: DashState): string {
  const p = new URLSearchParams();
  if (s.future !== "all") p.set("future", s.future);
  if (s.sector !== "all") p.set("sector", s.sector);
  if (s.horizon !== "all") p.set("when", s.horizon);
  if (s.priority) p.set("priority", "1");
  if (s.hub) p.set("hub", s.hub);
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.skill) p.set("skill", s.skill);
  return p.toString();
}

/**
 * Filter state kept in the address bar, so any view can be shared as a link.
 * The page is statically exported, so the URL is read after mount (no
 * `useSearchParams`, which would force a Suspense fallback for the whole page).
 */
export function useDashState() {
  const [state, setState] = useState<DashState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(parseState(window.location.search));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const qs = serializeState(state);
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(window.history.state, "", url);
  }, [state, ready]);

  const set = useCallback((patch: Partial<DashState>) => setState((s) => ({ ...s, ...patch })), []);
  /** Clears the filters but leaves an open skill panel alone. */
  const reset = useCallback(() => setState((s) => ({ ...DEFAULT_STATE, skill: s.skill })), []);

  return { state, set, reset, ready };
}
