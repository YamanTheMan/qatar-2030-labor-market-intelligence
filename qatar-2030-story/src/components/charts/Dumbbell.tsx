"use client";

import { scaleLinear } from "d3-scale";
import { useState } from "react";
import { C } from "@/lib/colors";
import { sourceById } from "@/lib/data";
import { fmtPct, fmtScore, fmtShortfall } from "@/lib/format";
import { useSize } from "@/lib/hooks/useSize";
import { MARKET_WEIGHT, PRIORITY_SHORT, SCENARIOS, SECTORS } from "@/lib/meta";
import type { GapRow } from "@/lib/types";
import { ChartTooltip } from "@/components/ui/Tooltip";

export function DumbbellLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="#fff" stroke={C.slate} strokeWidth="2.5" /></svg>
        Market hiring signal (2 × share of job ads)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill={C.maroon} /></svg>
        Strategic demand
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="26" height="8" aria-hidden="true"><line x1="2" x2="24" y1="4" y2="4" stroke={C.maroon} strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" /></svg>
        Line length = shortfall
      </span>
    </div>
  );
}

export function GapTooltipBody({ g }: { g: GapRow }) {
  return (
    <>
      <p className="font-semibold text-ink">{g.skill}</p>
      <p className="text-muted">
        {SECTORS[g.sector].label} · {SCENARIOS[g.scenario].short} future · {PRIORITY_SHORT[g.priority]} for Qatari talent
      </p>
      <p className="tabular mt-1.5">
        Strategic demand <b className="text-ink">{fmtScore(g.strategic)}</b> · Market hiring{" "}
        <b className="text-ink">{fmtPct(g.market, 1)}</b> of ads · Shortfall{" "}
        <b style={{ color: g.shortfall >= 0 ? C.maroon : C.slate }}>{fmtShortfall(g.shortfall)}</b>
      </p>
      {g.specificSkills.length ? (
        <p className="mt-1.5">
          <span className="text-muted">What it means: </span>
          {g.specificSkills.slice(0, 7).join(", ")}
          {g.specificSkills.length > 7 ? "…" : ""}
        </p>
      ) : null}
      {g.sources.length ? (
        <p className="mt-1.5">
          <span className="text-muted">Backed by: </span>
          {g.sources.map((s) => sourceById.get(s)?.short ?? s).join(" · ")}
        </p>
      ) : null}
    </>
  );
}

export function Dumbbell({
  rows,
  onSelect,
  showFuture = true,
  ariaLabel,
}: {
  rows: GapRow[];
  onSelect?: (g: GapRow) => void;
  showFuture?: boolean;
  ariaLabel: string;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<{ g: GapRow; x: number; y: number } | null>(null);
  const narrow = width < 640;
  const labelW = narrow ? 0 : Math.min(320, width * 0.4);
  const rowH = narrow ? 46 : 32;
  const top = 26;
  const H = top + rows.length * rowH + 8;
  const x0 = labelW + (narrow ? 16 : 16);
  const x = scaleLinear().domain([0, 1]).range([x0, Math.max(x0 + 50, width - 18)]);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 ? (
        <svg width={width} height={H} role="img" aria-label={ariaLabel}>
          <g className="axis" fontSize={11}>
            {ticks.map((t) => (
              <g key={t} transform={`translate(${x(t)},0)`}>
                <line y1={top - 6} y2={H - 4} stroke={C.rule} />
                <text y={top - 12} textAnchor="middle" className="tabular">
                  {t.toFixed(2)}
                </text>
              </g>
            ))}
          </g>
          {rows.map((g, i) => {
            const y = top + i * rowH + (narrow ? 30 : rowH / 2);
            const mx = x(Math.min(1, MARKET_WEIGHT * g.market));
            const sx = x(g.strategic);
            const active = hover?.g.id === g.id;
            return (
              <g
                key={g.id}
                tabIndex={0}
                role="button"
                aria-label={`${g.skill}, ${SECTORS[g.sector].label}, ${SCENARIOS[g.scenario].short} future: strategic demand ${fmtScore(g.strategic)}, market hiring ${fmtPct(g.market, 1)} of ads, shortfall ${fmtShortfall(g.shortfall)}`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover({ g, x: (mx + sx) / 2, y })}
                onFocus={() => setHover({ g, x: (mx + sx) / 2, y })}
                onBlur={() => setHover(null)}
                onClick={() => (onSelect ? onSelect(g) : setHover({ g, x: (mx + sx) / 2, y }))}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && onSelect) {
                    e.preventDefault();
                    onSelect(g);
                  }
                }}
              >
                <rect x={0} y={top + i * rowH} width={width} height={rowH} fill={active ? C.paper2 : "transparent"} rx={6} />
                {narrow ? (
                  (() => {
                    const budget = Math.floor((width - 8) / 6.3);
                    const name = truncate(g.skill, Math.floor(budget * 0.62));
                    const meta = `${SECTORS[g.sector].short}${showFuture ? ` · ${SCENARIOS[g.scenario].short}` : ""}`;
                    const left = Math.floor((budget - name.length * 1.15) * 1.0);
                    return (
                      <text x={4} y={top + i * rowH + 15} fontSize={12.5} className="chart-label" fill={C.ink}>
                        <tspan fontWeight={600} fill={C.ink}>{name}</tspan>
                        {left > 6 ? (
                          <tspan fill={C.muted} fontSize={11}>
                            {"  "}
                            {truncate(meta, left)}
                          </tspan>
                        ) : null}
                      </text>
                    );
                  })()
                ) : (
                  <>
                    <rect x={0} y={y - 5} width={4} height={10} rx={1} fill={SECTORS[g.sector].color} />
                    <text x={10} y={y - 1} fontSize={13} className="chart-label" fill={C.ink} fontWeight={600}>
                      {truncate(g.skill, Math.floor(labelW / 7.4))}
                    </text>
                    <text x={10} y={y + 12} fontSize={11} className="chart-label" fill={C.muted}>
                      {SECTORS[g.sector].label}
                      {showFuture ? ` · ${SCENARIOS[g.scenario].short}` : ""}
                    </text>
                  </>
                )}
                <line x1={mx} x2={sx} y1={y} y2={y} stroke={C.maroon} strokeOpacity={active ? 0.6 : 0.3} strokeWidth={6} strokeLinecap="round" />
                <circle cx={mx} cy={y} r={5} fill="#fff" stroke={C.slate} strokeWidth={2.5} />
                <circle cx={sx} cy={y} r={6} fill={C.maroon} />
                <text x={Math.min(sx + 10, width - 4)} y={y + 4} fontSize={11.5} className="tabular chart-label" fill={C.maroon} fontWeight={600} textAnchor={sx + 44 > width ? "end" : "start"} dx={sx + 44 > width ? -18 : 0}>
                  {fmtShortfall(g.shortfall)}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ height: rows.length * 32 }} />
      )}
      {hover && width > 0 ? (
        <ChartTooltip x={hover.x} y={hover.y} width={width}>
          <GapTooltipBody g={hover.g} />
        </ChartTooltip>
      ) : null}
    </div>
  );
}

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, Math.max(4, n - 1)).trimEnd()}…` : s;
}
