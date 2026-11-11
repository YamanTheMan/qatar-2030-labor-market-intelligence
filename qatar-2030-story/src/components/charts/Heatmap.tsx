"use client";

import Link from "next/link";
import { shortfallFill, shortfallText } from "@/lib/colors";
import { fmtShortfall } from "@/lib/format";
import { BANDS, SCENARIOS, SECTORS, type ScenarioId, type SectorId } from "@/lib/meta";
import type { MatrixCell } from "@/lib/types";

const BAND_LABEL = Object.fromEntries(BANDS.map((b) => [b.id, b.label])) as Record<string, string>;

export function HeatmapLegend() {
  const stops = [-0.25, -0.1, 0, 0.05, 0.1, 0.15, 0.2, 0.3];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
      <span className="flex items-center gap-1" aria-hidden="true">
        {stops.map((s) => (
          <span key={s} className="h-3 w-5 rounded-[2px]" style={{ background: shortfallFill(s) }} />
        ))}
      </span>
      <span>
        <b className="text-slate">Covered</b> &lt; −0.05 · <b>Aligned</b> ±0.05 · <b className="text-maroon">Notable</b> 0.05–0.15 ·{" "}
        <b className="text-maroon">Severe</b> ≥ 0.15
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="hatch h-3 w-5 rounded-[2px] border border-rule" aria-hidden="true" /> no signal in this future
      </span>
    </div>
  );
}

/**
 * Sector × future matrix as an accessible table. Rows sorted by overall average.
 */
export function Heatmap({
  cells,
  sectors,
  scenarios,
  overall,
  linkFor,
}: {
  cells: MatrixCell[];
  sectors: SectorId[];
  scenarios: ScenarioId[];
  overall?: Record<string, number>;
  linkFor?: (sector: SectorId, scenario: ScenarioId) => string;
}) {
  const get = (s: SectorId, f: ScenarioId) => cells.find((c) => c.sector === s && c.scenario === f);
  return (
    <div className="-mx-1 px-1">
      <table className="w-full table-fixed border-separate border-spacing-[2px] text-sm sm:border-spacing-[3px]">
        <caption className="sr-only">Average shortfall by sector (rows) and future (columns). Empty cells mean no evidence signal.</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[23%] pb-1 text-left align-bottom text-[0.65rem] font-medium text-muted sm:w-[20%] sm:text-xs">
              Sector
            </th>
            {scenarios.map((f) => (
              <th key={f} scope="col" className="hyphens-auto break-words pb-1 text-center align-bottom text-[0.58rem] font-semibold leading-tight sm:text-xs" style={{ color: SCENARIOS[f].ink }}>
                <span className="mx-auto mb-1 block h-1 w-6 rounded-full" style={{ background: SCENARIOS[f].color }} aria-hidden="true" />
                {SCENARIOS[f].short.replace("Diversification", "Diversi\u00ADfication").replace("Hydrocarbon", "Hydro\u00ADcarbon")}
              </th>
            ))}
            {overall ? (
              <th scope="col" className="pb-1 text-center align-bottom text-[0.58rem] font-semibold leading-tight text-ink sm:text-xs">
                All futures
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sectors.map((s) => (
            <tr key={s}>
              <th scope="row" className="hyphens-auto break-words pr-1 text-left text-[0.68rem] font-semibold leading-tight text-ink sm:pr-2 sm:text-sm">
                {SECTORS[s].label}
              </th>
              {scenarios.map((f) => {
                const c = get(s, f);
                if (!c || c.avg === null)
                  return (
                    <td key={f} className="hatch h-14 rounded-md text-center text-[0.65rem] text-muted sm:h-16">
                      <span className="sr-only">No signal</span>
                      <span aria-hidden="true" className="hidden sm:inline">no signal</span>
                    </td>
                  );
                const body = (
                  <>
                    <span className="tabular block text-[0.78rem] font-semibold sm:text-base">{fmtShortfall(c.avg)}</span>
                    <span className="hidden text-[0.68rem] opacity-85 sm:block">
                      {BAND_LABEL[c.band!]} · {c.n} skill{c.n === 1 ? "" : "s"}
                    </span>
                  </>
                );
                return (
                  <td
                    key={f}
                    className="h-14 rounded-md p-0 text-center align-middle sm:h-16"
                    style={{ background: shortfallFill(c.avg), color: shortfallText(c.avg) }}
                    title={`${SECTORS[s].label} · ${SCENARIOS[f].name}: average shortfall ${fmtShortfall(c.avg)} across ${c.n} skills`}
                  >
                    {linkFor ? (
                      <Link href={linkFor(s, f)} className="flex h-full w-full flex-col items-center justify-center rounded-md px-1 hover:ring-2 hover:ring-ink/50">
                        {body}
                      </Link>
                    ) : (
                      <span className="flex h-full flex-col items-center justify-center px-1">{body}</span>
                    )}
                  </td>
                );
              })}
              {overall ? (
                <td className="h-14 rounded-md border-2 text-center align-middle sm:h-16" style={{ borderColor: shortfallFill(overall[s]), color: "#1B1A17" }}>
                  <span className="tabular block text-[0.78rem] font-semibold sm:text-base">{fmtShortfall(overall[s])}</span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
