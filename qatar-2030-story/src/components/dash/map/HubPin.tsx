"use client";
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { stepFill, stepInk } from "@/lib/dash/model";
import { HUB_KINDS } from "@/lib/hubs";
import { fmtInt, plural } from "@/lib/format";
import { KindIcon } from "../icons";
import { Swatch, TipBody, Value, hideTip, tip } from "../ui";
import type { Side } from "./cluster";
import type { MarkerSpec } from "./layout";

const SIDE: Record<Side, CSSProperties> = {
  right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  below: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
  above: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
};

/** What the hover card says about a hub or a group of hubs. */
export function MarkerTip({ m, canZoom }: { m: MarkerSpec; canZoom: boolean }) {
  if (m.members.length > 1) {
    const shown = [...m.members].sort((a, b) => (b.mean ?? -9) - (a.mean ?? -9)).slice(0, 7);
    return (
      <TipBody title={m.title} hint={canZoom ? "Click to zoom in and see each hub" : "Pick a hub from the list to focus on it"}>
        <div>{plural(m.members.length, "hub")} at this zoom level</div>
        <ul className="mt-1.5 space-y-0.5">
          {shown.map((s) => (
            <li key={s.hub.id} className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-1.5 text-fg">
                <Swatch step={s.step} size={9} />
                <span className="truncate">{s.hub.short}</span>
              </span>
              <span className="d-num text-fg-3">{s.total ? `${fmtInt(s.short)} of ${fmtInt(s.total)}` : "no data"}</span>
            </li>
          ))}
        </ul>
        {m.members.length > shown.length && <div className="mt-1 text-fg-3">and {m.members.length - shown.length} more</div>}
      </TipBody>
    );
  }
  const { hub } = m.members[0];
  const top = m.skills.filter((s) => s.value >= 0.05).slice(0, 3);
  return (
    <TipBody
      title={hub.name}
      rows={
        m.total
          ? [
              ["Skills linked to this hub", fmtInt(m.total)],
              ["With a gap", `${fmtInt(m.short)} (${fmtInt(m.severe)} large)`],
              ["Average gap", <Value key="v" v={m.mean} />],
            ]
          : undefined
      }
      hint={m.selected ? "Click again to clear the selection" : "Click to focus the whole dashboard on this hub"}
    >
      <div>
        {HUB_KINDS[hub.kind]} · {hub.municipality}
      </div>
      <div className="mt-1 text-fg-3">{hub.anchors.slice(0, 3).join(" · ")}</div>
      {m.total === 0 && <div className="mt-1.5 text-fg">No linked skills under the current filters.</div>}
      {top.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-fg">
          {top.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <Swatch step={s.step} size={9} />
              <span className="truncate">{s.skill}</span>
            </li>
          ))}
        </ul>
      )}
    </TipBody>
  );
}

/** One pin with its label. Drawn the same way on the live map and on the static fallback. */
export function MarkerView({
  m,
  canZoom,
  dim,
  focusable = true,
  onClick,
  onHover,
}: {
  m: MarkerSpec;
  /** groups can be opened by zooming (live map only) */
  canZoom: boolean;
  dim?: boolean;
  /** false for pins outside the visible map, so the Tab key never scrolls the map sideways */
  focusable?: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
}) {
  // A pin can disappear under the pointer (hubs regroup as the zoom changes): no leave event fires then.
  const over = useRef(false);
  const leave = useRef(onHover);
  leave.current = onHover;
  useEffect(
    () => () => {
      if (!over.current) return;
      hideTip();
      leave.current(null);
    },
    [],
  );
  const group = m.members.length > 1;
  const empty = m.step === null;
  const t = tip(() => <MarkerTip m={m} canZoom={canZoom} />);
  const hubId = group ? null : m.members[0].hub.id;
  const style: CSSProperties = {
    width: m.size,
    height: m.size,
    opacity: dim ? 0.5 : 1,
    fontSize: group ? Math.round(m.size * 0.34) : undefined,
    ...(empty ? {} : { background: stepFill(m.step!), color: stepInk(m.step!), ["--pin" as string]: stepFill(m.step!) }),
  };
  const label = group
    ? `${m.title}: ${plural(m.members.length, "hub")}${canZoom ? ". Zoom in" : ""}`
    : `${m.members[0].hub.name}: ${m.total ? `${fmtInt(m.short)} of ${plural(m.total, "linked skill")} with a gap` : "no linked skills under these filters"}`;

  return (
    <>
      <button
        type="button"
        className="hub-pin dash-pin-in"
        style={style}
        aria-label={label}
        aria-pressed={group ? undefined : m.selected}
        data-active={m.active || undefined}
        data-cluster={group || undefined}
        data-empty={empty || undefined}
        tabIndex={focusable ? undefined : -1}
        onClick={onClick}
        onPointerEnter={(e: PointerEvent) => {
          t.onPointerEnter(e);
          if (e.pointerType === "touch") return;
          over.current = true;
          onHover(hubId);
        }}
        onPointerMove={t.onPointerMove}
        onPointerLeave={() => {
          t.onPointerLeave();
          over.current = false;
          onHover(null);
        }}
        onFocus={t.onFocus}
        onBlur={t.onBlur}
      >
        {group ? <span aria-hidden="true">{m.members.length}</span> : <KindIcon kind={m.members[0].hub.kind} size={Math.round(m.size * 0.46)} />}
      </button>
      {m.label && (
        <span className="hub-label" style={{ ...SIDE[m.label.side], opacity: dim ? 0.6 : 1 }} aria-hidden="true">
          <b>{m.title}</b>
          {!m.label.compact && <span>{m.sub}</span>}
        </span>
      )}
    </>
  );
}
