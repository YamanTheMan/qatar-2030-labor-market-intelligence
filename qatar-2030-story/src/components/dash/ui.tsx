"use client";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { STEP_IDS, STEP_LABELS, stepFill, stepOf, type StepId } from "@/lib/dash/model";
import { fmtShortfall } from "@/lib/format";
import { Icon } from "./icons";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------- card ---------- */

export function Card({
  title,
  sub,
  actions,
  children,
  className,
  bodyClass = "px-4 pb-4 sm:px-5 sm:pb-5",
  id,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cx("d-card flex min-w-0 flex-col", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0 max-w-[62ch]">
          <h2 className="d-h">{title}</h2>
          {sub && <p className="d-sub mt-0.5">{sub}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cx("min-h-0 flex-1", bodyClass)}>{children}</div>
    </section>
  );
}

/* ---------- controls ---------- */

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  small,
  className,
}: {
  label: string;
  value: T;
  options: { id: T; label: ReactNode; title?: string }[];
  onChange: (id: T) => void;
  small?: boolean;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("seg", small && "seg-sm", className)}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} title={o.title} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  className?: string;
}) {
  const active = value !== options[0]?.id;
  return (
    <label className={cx("relative inline-flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cx("d-field w-full cursor-pointer appearance-none truncate pr-8", active && "font-semibold")}
        style={active ? { borderColor: "var(--text)" } : undefined}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={15} className="pointer-events-none absolute right-2.5 text-fg-3" />
    </label>
  );
}

/* ---------- shortfall scale ---------- */

export const Swatch = ({ step, size = 10, className }: { step: StepId | null; size?: number; className?: string }) => (
  <span
    aria-hidden="true"
    className={cx("inline-block shrink-0 rounded-[3px]", step === null && "d-hatch border border-line", className)}
    style={{ width: size, height: size, background: step === null ? undefined : stepFill(step) }}
  />
);

/** A shortfall value: colour swatch for the step, number in normal ink. */
export function Value({ v, className, signed = true }: { v: number | null; className?: string; signed?: boolean }) {
  if (v === null) return <span className={cx("text-fg-3", className)}>n/a</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <Swatch step={stepOf(v)} />
      <span className="d-num font-semibold text-fg">{fmtShortfall(v, signed)}</span>
    </span>
  );
}

const EDGE_LABELS = ["−0.15", "−0.05", "+0.05", "+0.15", "+0.20", "+0.30"];

/** The one colour scale used by every mark on the page. */
export function ScaleLegend({ className, compact }: { className?: string; compact?: boolean }) {
  const w = compact ? 26 : 34;
  return (
    <div className={cx("select-none", className)} role="img" aria-label="Colour scale: blue means today's job ads already cover the skill, grey means in balance, red means a gap. Darker red is a larger gap.">
      <div className="mb-1 flex justify-between text-[10.5px] font-medium text-fg-2">
        <span>Covered</span>
        <span>Gap</span>
      </div>
      <div className="flex gap-[2px]">
        {STEP_IDS.map((s) => (
          <span key={s} title={STEP_LABELS[s]} className="h-2.5 first:rounded-l-[3px] last:rounded-r-[3px]" style={{ width: w, background: stepFill(s) }} />
        ))}
      </div>
      <div className="relative mt-1 h-3 text-[9.5px] text-fg-3">
        {EDGE_LABELS.map((l, i) => (
          <span key={l} className="d-num absolute -translate-x-1/2" style={{ left: (i + 1) * (w + 2) - 1 }}>
            {compact && i % 2 === 1 ? "" : l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A 100% bar split by colour step, with a 2px surface gap between segments. */
export function StepBar({ steps, height = 8, className }: { steps: Record<StepId, number>; height?: number; className?: string }) {
  const total = STEP_IDS.reduce((a, s) => a + steps[s], 0);
  if (!total) return <div className={cx("d-hatch rounded-[3px] border border-line", className)} style={{ height }} />;
  // red (largest shortfall) on the left so the eye lands on the problem first
  const order = [...STEP_IDS].reverse().filter((s) => steps[s] > 0);
  return (
    <div className={cx("flex gap-[2px] overflow-hidden rounded-[3px]", className)} style={{ height }}>
      {order.map((s) => (
        <span key={s} style={{ flexGrow: steps[s], flexBasis: 0, minWidth: 2, background: stepFill(s) }} />
      ))}
    </div>
  );
}

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="grid h-full min-h-32 place-items-center rounded-lg border border-dashed border-line-strong px-6 py-8 text-center text-[0.8125rem] text-fg-3">{children}</div>
);

/* ---------- tooltip: one floating layer for every chart ---------- */

interface TipState {
  x: number;
  y: number;
  node: ReactNode;
  /** anchored to an element (keyboard focus) instead of following the pointer */
  anchored?: boolean;
}

let tipState: TipState | null = null;
const tipListeners = new Set<() => void>();
function setTip(next: TipState | null) {
  if (next === null && tipState === null) return;
  tipState = next;
  tipListeners.forEach((l) => l());
}
const subscribeTip = (l: () => void) => {
  tipListeners.add(l);
  return () => {
    tipListeners.delete(l);
  };
};

/** Spread onto any mark: shows `render()` on mouse hover and on keyboard focus. */
export function tip(render: () => ReactNode) {
  const move = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    setTip({ x: e.clientX, y: e.clientY, node: render() });
  };
  return {
    onPointerEnter: move,
    onPointerMove: move,
    onPointerLeave: () => setTip(null),
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.matches(":focus-visible")) return;
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2, y: r.bottom, node: render(), anchored: true });
    },
    onBlur: () => setTip(null),
  };
}

export const hideTip = () => setTip(null);

export function TipLayer() {
  const state = useSyncExternalStore(subscribeTip, () => tipState, () => null);
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!state || !el) {
      setPos(null);
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = state.anchored ? state.x - width / 2 : state.x + 14;
    let top = state.y + (state.anchored ? 8 : 16);
    if (left + width > vw - 8) left = state.anchored ? vw - 8 - width : state.x - 14 - width;
    if (top + height > vh - 8) top = state.y - (state.anchored ? 44 : 12) - height;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [state]);

  useEffect(() => {
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, { capture: true });
      window.removeEventListener("resize", hide);
    };
  }, []);

  if (!state || typeof document === "undefined") return null;
  return createPortal(
    <div ref={ref} role="tooltip" className="d-tip" style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}>
      {state.node}
    </div>,
    document.body,
  );
}

/** Standard tooltip body: a title, optional lines, optional hint about what a click does. */
export function TipBody({ title, rows, hint, children }: { title: ReactNode; rows?: [string, ReactNode][]; hint?: string; children?: ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-fg">{title}</div>
      {children && <div className="mt-0.5 text-fg-2">{children}</div>}
      {rows && rows.length > 0 && (
        <dl className="mt-1.5 grid grid-cols-[auto_auto] justify-between gap-x-5 gap-y-0.5">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-fg-3">{k}</dt>
              <dd className="d-num text-right font-medium text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {hint && <div className="mt-1.5 border-t border-line pt-1.5 text-[0.7rem] text-fg-3">{hint}</div>}
    </div>
  );
}
