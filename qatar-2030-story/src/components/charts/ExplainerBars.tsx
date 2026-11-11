"use client";

import { C } from "@/lib/colors";
import { fmtScore, fmtShortfall } from "@/lib/format";
import { MARKET_WEIGHT, SCENARIOS, SECTORS } from "@/lib/meta";
import type { GapRow } from "@/lib/types";

/** Animated explainer of the shortfall metric for one row. */
export function ExplainerBars({ row, caption }: { row: GapRow; caption: string }) {
  const mkt = MARKET_WEIGHT * row.market;
  const pct = (v: number) => `${Math.max(0.6, v * 100)}%`;
  const short = row.shortfall;
  return (
    <div className="flex h-full flex-col justify-center gap-3 sm:gap-6">
      <div>
        <p className="kicker !text-ink-2">{SECTORS[row.sector].label} · {SCENARIOS[row.scenario].short} future</p>
        <p className="display mt-0.5 text-2xl text-ink sm:mt-1 sm:text-4xl">{row.skill}</p>
      </div>
      <div className="space-y-3 sm:space-y-5">
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">Strategic demand</span>
            <span className="tabular text-ink-2">{fmtScore(row.strategic)}</span>
          </div>
          <div className="mt-1 h-5 rounded bg-paper-2 sm:mt-1.5 sm:h-7">
            <div className="h-full rounded bg-maroon transition-[width] duration-700" style={{ width: pct(row.strategic) }} />
          </div>
          <p className="mt-1 hidden text-xs text-muted sm:block">How strongly the 33 source records call for it in this future (0–1)</p>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">Market hiring signal</span>
            <span className="tabular text-ink-2">
              {MARKET_WEIGHT} × {(row.market * 100).toFixed(1)}% of ads = {fmtScore(mkt)}
            </span>
          </div>
          <div className="mt-1 h-5 rounded bg-paper-2 sm:mt-1.5 sm:h-7">
            <div className="h-full rounded transition-[width] duration-700" style={{ width: pct(mkt), background: C.slate }} />
          </div>
          <p className="mt-1 hidden text-xs text-muted sm:block">The model counts each job-ad share twice (see methodology)</p>
        </div>
        <div className="rounded-xl border border-rule bg-card p-3 sm:p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-ink">Shortfall = demand − market signal</span>
            <span className="display tabular text-3xl sm:text-4xl" style={{ color: short >= 0 ? C.maroon : C.slate }}>
              {fmtShortfall(short)}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-2">{caption}</p>
        </div>
      </div>
    </div>
  );
}
