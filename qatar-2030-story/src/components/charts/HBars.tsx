"use client";

import type { ReactNode } from "react";

export interface HBarRow {
  key: string;
  label: ReactNode;
  value: number;
  color: string;
  note?: ReactNode;
  dim?: boolean;
  onClick?: () => void;
}

/** Horizontal bar list rendered in HTML so labels wrap naturally on any width. Bars animate between states. */
export function HBars({
  rows,
  max,
  format,
  labelWidth = "minmax(120px, 40%)",
  dense = false,
  ariaLabel,
}: {
  rows: HBarRow[];
  max?: number;
  format: (v: number) => string;
  labelWidth?: string;
  dense?: boolean;
  ariaLabel: string;
}) {
  const m = max ?? Math.max(...rows.map((r) => r.value), 1e-9);
  return (
    <ol className={dense ? "space-y-0 sm:space-y-1" : "space-y-1 sm:space-y-2"} aria-label={ariaLabel}>
      {rows.map((r) => {
        const Inner = (
          <>
            <span className={`${dense ? "text-[0.72rem] leading-tight sm:text-[0.8125rem] sm:leading-snug" : "text-[0.8125rem] leading-snug"} ${r.dim ? "text-muted" : "text-ink"}`}>{r.label}</span>
            <span className="relative flex items-center gap-2">
              <span className={`relative ${dense ? "h-2.5 sm:h-3" : "h-3.5 sm:h-4"} flex-1 overflow-hidden rounded-[3px] bg-paper-2`}>
                <span
                  className="absolute inset-y-0 left-0 rounded-[3px] transition-[width,background-color,opacity] duration-700 ease-out"
                  style={{ width: `${Math.max(0, (r.value / m) * 100)}%`, background: r.color, opacity: r.dim ? 0.35 : 1 }}
                />
              </span>
              <span className="tabular w-[4.4rem] shrink-0 text-right text-[0.7rem] text-ink-2 sm:text-xs">{format(r.value)}</span>
            </span>
            {r.note ? <span className="col-span-2 -mt-0.5 text-[0.72rem] text-muted">{r.note}</span> : null}
          </>
        );
        return (
          <li key={r.key}>
            {r.onClick ? (
              <button
                type="button"
                onClick={r.onClick}
                className="grid w-full items-center gap-x-3 rounded-md px-1 py-0.5 text-left hover:bg-paper-2/70"
                style={{ gridTemplateColumns: `${labelWidth} 1fr` }}
              >
                {Inner}
              </button>
            ) : (
              <div className="grid items-center gap-x-3 px-1 py-0.5" style={{ gridTemplateColumns: `${labelWidth} 1fr` }}>
                {Inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
