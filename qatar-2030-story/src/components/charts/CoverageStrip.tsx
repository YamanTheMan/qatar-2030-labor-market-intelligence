import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from "@/lib/meta";

/** Honesty strip: how much evidence each future rests on. */
export function CoverageStrip({ data }: { data: { scenario: ScenarioId; signals: number; rows: number; sources: number }[] }) {
  const max = Math.max(...data.map((d) => d.signals));
  return (
    <div className="space-y-2.5" role="list" aria-label="Evidence behind each future">
      {SCENARIO_IDS.map((id) => {
        const d = data.find((x) => x.scenario === id)!;
        const s = SCENARIOS[id];
        return (
          <div key={id} role="listitem" className="grid grid-cols-[minmax(110px,150px)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate font-medium" style={{ color: s.ink }}>
              {s.short}
              {id === "S1" ? <span className="ml-1 text-xs font-normal text-muted">(baseline)</span> : null}
            </span>
            <span className="relative h-3 rounded-full bg-paper-2" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(d.signals / max) * 100}%`, background: s.color }} />
            </span>
            <span className="tabular whitespace-nowrap text-xs text-ink-2">
              <b className="text-ink">{d.signals}</b> signals · {d.rows} skill rows · {d.sources} sources
            </span>
          </div>
        );
      })}
    </div>
  );
}
