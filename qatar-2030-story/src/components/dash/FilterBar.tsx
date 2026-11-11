"use client";
import { hubById } from "@/lib/hubs";
import { isDefault, type HorizonFilter } from "@/lib/dash/model";
import type { DashState } from "@/lib/dash/useFilters";
import { SCENARIOS, SCENARIO_IDS, SECTORS, SECTOR_IDS, type ScenarioId, type SectorId } from "@/lib/meta";
import { fmtInt } from "@/lib/format";
import { Icon } from "./icons";
import { SelectField, cx } from "./ui";

/** Shorter names for narrow screens, so the whole row of futures stays visible. */
const FUTURE_COMPACT: Record<ScenarioId, string> = { S1: "Diversification", S2: "Hydrocarbon", S3: "Green", S4: "Knowledge", S5: "Regional hub" };

const SECTOR_OPTIONS: { id: "all" | SectorId; label: string }[] = [{ id: "all", label: "All sectors" }, ...SECTOR_IDS.map((id) => ({ id, label: SECTORS[id].label }))];

const HORIZON_OPTIONS: { id: HorizonFilter; label: string }[] = [
  { id: "all", label: "Any timing" },
  { id: "near_term", label: "Needed in 2–3 years" },
  { id: "medium_term", label: "Needed by 2030" },
];

export function FilterBar({
  state,
  set,
  reset,
  matching,
}: {
  state: DashState;
  set: (patch: Partial<DashState>) => void;
  reset: () => void;
  /** number of skills in view, announced to screen readers when filters change */
  matching: number;
}) {
  const hub = state.hub ? hubById.get(state.hub) : undefined;
  const futures: ("all" | ScenarioId)[] = ["all", ...SCENARIO_IDS];

  return (
    <div className="no-print sticky top-14 z-30 border-y border-line bg-canvas/90 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <div className="dash flex items-center gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] md:flex-wrap md:overflow-visible">
        <div role="group" aria-label="Future" className="seg shrink-0">
          {futures.map((id) => (
            <button key={id} type="button" aria-pressed={state.future === id} title={id === "all" ? "Each skill in the future where its gap is largest, of of the five futures" : SCENARIOS[id].subtitle} onClick={() => set({ future: id })}>
              {id === "all" ? (
                "All futures"
              ) : (
                <>
                  <span className="min-[1600px]:hidden">{FUTURE_COMPACT[id]}</span>
                  <span className="hidden min-[1600px]:inline">{SCENARIOS[id].short}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <SelectField label="Sector" value={state.sector} options={SECTOR_OPTIONS} onChange={(sector) => set({ sector })} className="w-[156px] shrink-0" />
        <SelectField label="Timing" value={state.horizon} options={HORIZON_OPTIONS} onChange={(horizon) => set({ horizon })} className="w-[156px] shrink-0" />

        <button type="button" className="d-btn shrink-0" aria-pressed={state.priority} onClick={() => set({ priority: !state.priority })} title="Show only the skills flagged as a priority for Qatari nationals">
          <Icon name="star" size={15} className="text-gold" />
          Qatari-talent priority
        </button>

        {hub && (
          <button type="button" className="d-btn shrink-0" aria-pressed="true" onClick={() => set({ hub: null })} title="Clear the selected hub">
            <Icon name="pin" size={15} />
            <span className="max-w-[16ch] truncate">{hub.short}</span>
            <Icon name="x" size={14} />
            <span className="sr-only">Clear hub</span>
          </button>
        )}

        <label className="relative min-w-[150px] flex-1 shrink-0 md:min-w-[180px]">
          <span className="sr-only">Search skills</span>
          <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            value={state.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search skills"
            className={cx("d-field w-full pl-9", state.q && "pr-9")}
          />
          {state.q && (
            <button type="button" onClick={() => set({ q: "" })} className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-fg-3 hover:bg-surface-3 hover:text-fg" aria-label="Clear search">
              <Icon name="x" size={14} />
            </button>
          )}
        </label>

        <button type="button" className="d-btn d-btn-quiet shrink-0 disabled:opacity-40" onClick={reset} disabled={isDefault(state)}>
          <Icon name="reset" size={15} />
          Reset
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {fmtInt(matching)} skills match the current filters
        </span>
      </div>
    </div>
  );
}
