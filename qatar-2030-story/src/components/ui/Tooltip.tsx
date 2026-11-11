"use client";

import type { ReactNode } from "react";

/** Positioned chart tooltip; place inside a `relative` container. Flips to stay within width. */
export function ChartTooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const W = Math.min(300, width - 16);
  const left = Math.max(8, Math.min(x - W / 2, width - W - 8));
  const above = y > 170;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-30 rounded-xl border border-rule bg-card p-3 text-xs leading-relaxed text-ink-2 shadow-[0_12px_32px_-12px_rgba(27,26,23,0.4)]"
      style={{ left, top: above ? undefined : y + 16, bottom: above ? `calc(100% - ${y - 12}px)` : undefined, width: W }}
    >
      {children}
    </div>
  );
}
