"use client";
import { RESPONSE_IDS, RESPONSES, type ResponseCounts, type ResponseId } from "@/lib/dash/demand";
import { fmtInt, fmtPct } from "@/lib/format";
import { TipBody, cx, tip } from "../ui";

/** A coloured dot plus the response name: identity is never colour alone. */
export function ResponseTag({ id, className, long }: { id: ResponseId; className?: string; long?: boolean }) {
  const r = RESPONSES[id];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap text-[0.75rem] text-fg-2", className)}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.fill }} aria-hidden="true" />
      {long ? r.label : r.short}
    </span>
  );
}

/** One 100% bar split by response. `onPick` makes each segment a filter. */
export function ResponseBar({
  counts,
  height = 10,
  active,
  onPick,
  className,
}: {
  counts: ResponseCounts;
  height?: number;
  active?: ResponseId | null;
  onPick?: (id: ResponseId) => void;
  className?: string;
}) {
  const total = RESPONSE_IDS.reduce((a, id) => a + counts[id], 0);
  const shown = RESPONSE_IDS.filter((id) => counts[id] > 0);
  if (!total) return <div className={cx("rounded-[3px] bg-surface-3", className)} style={{ height }} />;
  return (
    <div className={cx("flex gap-[2px]", className)} style={{ height }}>
      {shown.map((id, i) => {
        const r = RESPONSES[id];
        const radius = `${i === 0 ? 4 : 0}px ${i === shown.length - 1 ? 4 : 0}px ${i === shown.length - 1 ? 4 : 0}px ${i === 0 ? 4 : 0}px`;
        const style = {
          flexGrow: counts[id],
          flexBasis: 0,
          minWidth: 4,
          background: r.fill,
          borderRadius: radius,
          opacity: active && active !== id ? 0.35 : 1,
        };
        const body = () => <TipBody title={r.label} rows={[["Skill areas", fmtInt(counts[id])], ["Share", fmtPct(counts[id] / total)]]} hint={onPick ? "Click to list only these" : undefined} />;
        return onPick ? (
          <button key={id} type="button" aria-label={`${r.label}: ${counts[id]}`} aria-pressed={active === id} style={style} onClick={() => onPick(id)} {...tip(body)} />
        ) : (
          <span key={id} tabIndex={0} aria-label={`${r.label}: ${counts[id]}`} style={style} {...tip(body)} />
        );
      })}
    </div>
  );
}

/** Demand and today's hiring on one scale, as two thin bars. */
export function DemandBars({ demand, hiring, max, className }: { demand: number; hiring: number; max: number; className?: string }) {
  const w = (v: number) => `${Math.max(1, Math.min(100, (Math.max(0, v) / max) * 100))}%`;
  return (
    <span className={cx("block space-y-[2px]", className)} aria-hidden="true">
      <span className="block h-2 rounded-r-[4px]" style={{ width: w(demand), background: "var(--accent)" }} />
      <span className="block h-2 rounded-r-[4px]" style={{ width: w(hiring), background: "var(--text-3)" }} />
    </span>
  );
}

export function DemandKey({ className }: { className?: string }) {
  return (
    <span className={cx("flex flex-wrap gap-x-4 gap-y-1 text-[0.71875rem] text-fg-3", className)}>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-4 rounded-[2px]" style={{ background: "var(--accent)" }} />
        2030 demand (strategies)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-4 rounded-[2px]" style={{ background: "var(--text-3)" }} />
        Today&apos;s hiring (job ads, ×2)
      </span>
    </span>
  );
}
