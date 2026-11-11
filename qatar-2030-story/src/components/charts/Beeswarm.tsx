"use client";

import { forceCollide, forceSimulation, forceX, forceY } from "d3-force";
import { scaleLinear } from "d3-scale";
import { useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { C, shortfallFill } from "@/lib/colors";
import { fmtShortfall } from "@/lib/format";
import { useSize } from "@/lib/hooks/useSize";
import { SECTORS, type SectorId } from "@/lib/meta";
import type { GapRow } from "@/lib/types";
import { ChartTooltip } from "@/components/ui/Tooltip";
import { GapTooltipBody } from "./Dumbbell";

interface Node {
  g: GapRow;
  x: number;
  y: number;
  tx: number;
  ty: number;
  half: number;
}

/** Strip/beeswarm of every shortfall, one band per sector. Dots fly in from scattered positions. */
export function Beeswarm({
  rows,
  sectorOrder,
  ariaLabel,
  annotate = true,
  highlight,
}: {
  rows: GapRow[];
  sectorOrder: SectorId[];
  ariaLabel: string;
  annotate?: boolean;
  highlight?: (g: GapRow) => boolean;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const inViewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(inViewRef, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<{ n: Node } | null>(null);
  const narrow = width < 640;
  const labelW = narrow ? 0 : 168;
  const top = narrow ? 30 : 28;
  // Band height grows with the number of dots in the sector so dense bands don't spill.
  const counts = sectorOrder.map((s) => rows.filter((g) => g.sector === s).length);
  const bands = counts.map((n) => (narrow ? Math.max(56, Math.min(120, 26 + n * 0.75)) : Math.max(50, Math.min(100, 24 + n * 0.5))));
  const bandTop = bands.map((_, i) => top + bands.slice(0, i).reduce((a, b) => a + b, 0));
  const H = top + bands.reduce((a, b) => a + b, 0) + 30;
  const r = narrow ? 3.4 : 4.6;
  const lo = Math.min(-0.3, ...rows.map((d) => d.shortfall));
  const x = useMemo(
    () => scaleLinear().domain([lo, 1]).range([labelW + 12, Math.max(labelW + 60, width - 12)]),
    [labelW, width, lo],
  );

  const nodes = useMemo<Node[]>(() => {
    if (!width) return [];
    const ns: Node[] = rows.map((g, i) => {
      const bi = sectorOrder.indexOf(g.sector);
      const ty = bandTop[bi] + bands[bi] / 2 + (narrow ? 8 : 0);
      return { g, x: x(g.shortfall), y: ty + ((i * 37) % 9) - 4, tx: x(g.shortfall), ty, half: bands[bi] / 2 };
    });
    const sim = forceSimulation(ns as never[])
      .force("x", forceX<Node>((d) => d.tx).strength(1))
      .force("y", forceY<Node>((d) => d.ty).strength(0.12))
      .force("c", forceCollide(r + 0.7))
      .stop();
    for (let i = 0; i < 160; i++) sim.tick();
    for (const n of ns) n.y = Math.max(n.ty - n.half + r + 2 + (narrow ? 8 : 0), Math.min(n.ty + n.half - r - 2 - (narrow ? 8 : 0), n.y));
    return ns;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sectorOrder, width, x, top, r, narrow]);

  const ticks = [-0.25, 0, 0.25, 0.5, 0.75, 1];
  const animate = inView || reduce;
  const maxNode = nodes.reduce<Node | null>((m, n) => (!m || n.g.shortfall > m.g.shortfall ? n : m), null);

  return (
    <div ref={inViewRef}>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
        {width > 0 ? (
          <svg width={width} height={H} role="img" aria-label={ariaLabel}>
            <g className="axis" fontSize={11}>
              {ticks.map((t) => (
                <g key={t} transform={`translate(${x(t)},0)`}>
                  <line y1={top - 4} y2={H - 26} stroke={t === 0 ? C.ink2 : C.rule} strokeDasharray={t === 0 ? "3 3" : undefined} />
                  <text y={H - 10} textAnchor="middle" className="tabular">
                    {fmtShortfall(t)}
                  </text>
                </g>
              ))}
              <text x={x(0) - 6} y={top - 10} textAnchor="end" fill={C.slate} fontWeight={600}>
                {narrow ? "← covered" : "← market already covers it"}
              </text>
              <text x={x(0) + 6} y={top - 10} fill={C.maroon} fontWeight={600}>
                {narrow ? "shortfall →" : "strategy asks for more →"}
              </text>
            </g>
            {sectorOrder.map((s, i) => (
              <g key={s}>
                {i > 0 ? <line x1={0} x2={width} y1={bandTop[i]} y2={bandTop[i]} stroke={C.rule} strokeOpacity={0.6} /> : null}
                <text
                  x={0}
                  y={narrow ? bandTop[i] + 13 : bandTop[i] + bands[i] / 2 + 4}
                  fontSize={narrow ? 11.5 : 12.5}
                  fontWeight={600}
                  className="chart-label"
                  fill={C.ink}
                >
                  {SECTORS[s].label}
                </text>
              </g>
            ))}
            {nodes.map((n, i) => {
              const dim = highlight ? !highlight(n.g) : false;
              const sx = animate ? n.x : ((i * 97) % Math.max(1, width)) + 0.5;
              const sy = animate ? n.y : ((i * 53) % Math.max(1, H - 40)) + 10;
              return (
                <circle
                  key={n.g.id}
                  cx={0}
                  cy={0}
                  r={hover?.n === n ? r + 2 : r}
                  fill={shortfallFill(n.g.shortfall)}
                  stroke={n.g.shortfall >= 0.3 ? "#fff" : C.ink}
                  strokeOpacity={n.g.shortfall >= 0.3 ? 0.9 : 0.18}
                  strokeWidth={0.8}
                  opacity={animate ? (dim ? 0.18 : 1) : 0}
                  style={{
                    transform: `translate(${sx}px, ${sy}px)`,
                    transition: reduce ? undefined : `transform 1100ms cubic-bezier(.16,1,.3,1) ${(i % 40) * 12}ms, opacity 600ms ease ${(i % 40) * 12}ms`,
                  }}
                  onMouseEnter={() => setHover({ n })}
                  onClick={() => setHover({ n })}
                  aria-hidden="true"
                />
              );
            })}
            {annotate && maxNode && animate ? (
              <g fontSize={11.5} className="chart-label" pointerEvents="none">
                <line x1={maxNode.x} x2={maxNode.x - 18} y1={maxNode.y - r - 1} y2={maxNode.y - 22} stroke={C.ink2} />
                <text x={maxNode.x - 20} y={maxNode.y - 25} textAnchor="end" fill={C.ink} fontWeight={600}>
                  {maxNode.g.skill} ({fmtShortfall(maxNode.g.shortfall)})
                </text>
              </g>
            ) : null}
          </svg>
        ) : (
          <div style={{ height: 520 }} />
        )}
        {hover ? (
          <ChartTooltip x={hover.n.x} y={hover.n.y} width={width}>
            <GapTooltipBody g={hover.n.g} />
          </ChartTooltip>
        ) : null}
      </div>
    </div>
  );
}
