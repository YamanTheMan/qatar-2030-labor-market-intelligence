"use client";

import { useMemo } from "react";
import { FilterBar } from "./FilterBar";
import { VIEWS, allGaps, applyFilters, useExplorerState } from "./state";
import { MatrixView, ModelView, RankingView, SkillView, SourceView, TablesView } from "./views";

export function Explorer() {
  const { sp, view, filters, set } = useExplorerState();
  const rows = useMemo(() => applyFilters(allGaps, filters), [filters]);
  const usesFilters = view === "ranking" || view === "matrix" || view === "skill" || view === "tables";
  return (
    <div className="space-y-6">
      <nav aria-label="Explorer views" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-rule">
          {VIEWS.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                aria-current={v.id === view ? "page" : undefined}
                onClick={() => set({ view: v.id })}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${v.id === view ? "border-maroon font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {usesFilters ? (
        <FilterBar filters={filters} set={set} matching={rows.length} total={allGaps.length} />
      ) : null}
      <section aria-live="polite" aria-labelledby="explorer-results">
        <h2 id="explorer-results" className="sr-only">
          {VIEWS.find((v) => v.id === view)?.label}
        </h2>
        {view === "ranking" && <RankingView rows={rows} sp={sp} set={set} />}
        {view === "matrix" && <MatrixView rows={rows} />}
        {view === "skill" && <SkillView rows={rows} sp={sp} set={set} />}
        {view === "source" && <SourceView sp={sp} set={set} />}
        {view === "model" && <ModelView sp={sp} set={set} />}
        {view === "tables" && <TablesView rows={rows} sp={sp} set={set} />}
      </section>
    </div>
  );
}
