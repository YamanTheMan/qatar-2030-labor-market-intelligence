"use client";

import { useSize } from "@/lib/hooks/useSize";

export interface WaffleCell {
  fill: string;
  stroke?: string;
  opacity?: number;
}

/** Unit chart. Cells keep their position; only colour/opacity transition between states. */
export function Waffle({ cells, cols, label, maxCell = 26 }: { cells: WaffleCell[]; cols: number; label: string; maxCell?: number }) {
  const { ref, width, height } = useSize<HTMLDivElement>();
  const rows = Math.ceil(cells.length / cols);
  const gapRatio = 0.22;
  const byW = width / (cols + (cols - 1) * gapRatio);
  const byH = height / (rows + (rows - 1) * gapRatio);
  const cell = Math.max(2, Math.min(maxCell, byW, byH || byW));
  const gap = cell * gapRatio;
  const W = cols * cell + (cols - 1) * gap;
  const H = rows * cell + (rows - 1) * gap;
  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center">
      {width > 0 ? (
        <svg width={W} height={H} role="img" aria-label={label}>
          {cells.map((c, i) => {
            const x = (i % cols) * (cell + gap);
            const y = Math.floor(i / cols) * (cell + gap);
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={cell * 0.18}
                fill={c.fill}
                stroke={c.stroke ?? "none"}
                strokeWidth={c.stroke ? Math.max(1.5, cell * 0.12) : 0}
                opacity={c.opacity ?? 1}
                style={{ transition: "fill 600ms ease, opacity 600ms ease, stroke 600ms ease", transitionDelay: `${(i % cols) * 6 + Math.floor(i / cols) * 4}ms` }}
              />
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
