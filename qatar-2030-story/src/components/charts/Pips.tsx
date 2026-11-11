import { fmtShortfall } from "@/lib/format";
import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from "@/lib/meta";

/** Five scenario pips: filled = shortfall, ring = present but aligned/covered, dash = no signal. */
export function Pips({ values, size = 14 }: { values: Record<ScenarioId, number | null>; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={SCENARIO_IDS.map((s) => `${SCENARIOS[s].short}: ${describe(values[s])}`).join("; ")}>
      {SCENARIO_IDS.map((s) => {
        const v = values[s];
        const c = SCENARIOS[s].color;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
            <title>{`${SCENARIOS[s].short}: ${describe(v)}`}</title>
            {v === null ? (
              <line x1="4" x2="10" y1="7" y2="7" stroke="#B9B1A3" strokeWidth="1.6" strokeLinecap="round" />
            ) : v > 0 ? (
              <circle cx="7" cy="7" r="6" fill={c} />
            ) : (
              <circle cx="7" cy="7" r="5.2" fill="none" stroke={c} strokeWidth="1.6" />
            )}
          </svg>
        );
      })}
    </span>
  );
}

function describe(v: number | null) {
  if (v === null) return "no signal";
  return v > 0 ? `shortfall ${fmtShortfall(v)}` : `covered (${fmtShortfall(v)})`;
}

export function PipsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
      {SCENARIO_IDS.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: SCENARIOS[s].color }} aria-hidden="true" />
          {SCENARIOS[s].short}
        </span>
      ))}
      <span className="text-muted">● short · ○ covered · – no signal</span>
    </div>
  );
}
