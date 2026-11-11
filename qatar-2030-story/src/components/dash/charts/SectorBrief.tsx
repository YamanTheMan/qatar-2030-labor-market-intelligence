"use client";
import { memo, useEffect, useRef, useState } from "react";
import { summary } from "@/lib/data";
import { RESPONSE_IDS, RESPONSES, hiringSignal, responseOf, type ResponseId, type SectorBrief as Brief, type SectorRow } from "@/lib/dash/demand";
import type { DashState } from "@/lib/dash/useFilters";
import { fmtInt, fmtPct, fmtScore } from "@/lib/format";
import { SCENARIOS, SECTORS, type SectorId } from "@/lib/meta";
import { Icon, KindIcon } from "../icons";
import { Card, EmptyState, TipBody, Value, cx, tip } from "../ui";
import { DemandBars, DemandKey, ResponseBar, ResponseTag } from "./response";

type Set = (patch: Partial<DashState>) => void;
const ads = (id: SectorId) => summary.postings.bySector.find((s) => s.sector === id);

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <div className="d-num text-[1.375rem] font-semibold leading-none tracking-[-0.02em] text-fg">{value}</div>
      <div className="mt-1 text-[0.75rem] leading-snug text-fg-2">{label}</div>
      {note && <div className="text-[0.6875rem] text-fg-3">{note}</div>}
    </div>
  );
}

/** Sector chips: the quickest way to switch the briefing. */
function SectorChips({ state, set }: { state: DashState; set: Set }) {
  const ids: ("all" | SectorId)[] = ["all", ...(Object.keys(SECTORS) as SectorId[])];
  const ref = useRef<HTMLDivElement>(null);
  // Keep the selected chip visible on narrow screens without scrolling the page.
  useEffect(() => {
    const box = ref.current;
    const el = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!box || !el) return;
    const left = el.offsetLeft - box.offsetLeft;
    if (left < box.scrollLeft || left + el.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = left - 8;
  }, [state.sector]);
  return (
    <div ref={ref} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Sector">
      {ids.map((id) => {
        const on = state.sector === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => set({ sector: id })}
            className={cx(
              "shrink-0 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
              on ? "border-transparent bg-[var(--invert)] text-[var(--on-invert)]" : "border-line text-fg-2 hover:border-[var(--line-strong)] hover:text-fg",
            )}
          >
            {id === "all" ? "All sectors" : SECTORS[id].short}
          </button>
        );
      })}
    </div>
  );
}

function Overview({ rows, set }: { rows: SectorRow[]; set: Set }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[0.8125rem]">
        <thead>
          <tr className="text-[0.71875rem] text-fg-3">
            {["Sector", "Skill areas", "Strong demand", "Not yet in hiring", "Job ads today", "How to meet the demand"].map((h, i) => (
              <th key={h} className={cx("border-b border-line px-3 py-2 font-medium", i === 0 && "pl-0", i > 0 && i < 5 && "text-right")}>
                {h}
              </th>
            ))}
            <th className="border-b border-line" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const a = ads(r.sector);
            return (
              <tr key={r.sector} className="cursor-pointer hover:bg-surface-2" onClick={() => set({ sector: r.sector })}>
                <td className="border-b border-line py-2.5 pr-3 font-medium text-fg">{SECTORS[r.sector].label}</td>
                <td className="d-num border-b border-line px-3 text-right text-fg-2">{fmtInt(r.total)}</td>
                <td className="d-num border-b border-line px-3 text-right text-fg-2">{fmtInt(r.strongDemand)}</td>
                <td className="d-num border-b border-line px-3 text-right text-fg">
                  <b className="font-semibold">{fmtInt(r.gap)}</b> <span className="text-fg-3">({fmtPct(r.total ? r.gap / r.total : 0)})</span>
                </td>
                <td className="d-num border-b border-line px-3 text-right text-fg-2">{a ? fmtInt(a.count) : "n/a"}</td>
                <td className="w-[30%] border-b border-line px-3">
                  <ResponseBar counts={r.responses} />
                </td>
                <td className="border-b border-line pl-1 text-fg-3">
                  <Icon name="chevron-right" size={14} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ResponseLegend className="mt-3" />
    </div>
  );
}

export function ResponseLegend({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-wrap gap-x-4 gap-y-1", className)}>
      {RESPONSE_IDS.map((id) => (
        <ResponseTag key={id} id={id} long />
      ))}
    </div>
  );
}

function BriefBody({ b, set, onOpen }: { b: Brief; set: Set; onOpen: (key: string) => void }) {
  const [pick, setPick] = useState<ResponseId | null>(null);
  useEffect(() => setPick(null), [b.sector]);
  const a = ads(b.sector);
  const list = b.skills.filter((s) => !pick || responseOf(s) === pick).sort((x, y) => y.peak.strategic - x.peak.strategic);
  const top = list.slice(0, 8);
  const max = Math.max(0.3, ...b.skills.map((s) => Math.max(s.peak.strategic, hiringSignal(s))));
  const maxDriver = Math.max(1, ...b.drivers.map((d) => d.n));

  if (!b.total) return <EmptyState>No skill areas in this sector match the filters. Clear a filter to see more.</EmptyState>;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Skill areas the strategies call for" value={fmtInt(b.total)} />
          <Stat label="With strong demand" value={fmtInt(b.strongDemand)} note="Demand of 0.20 or more" />
          <Stat label="Not yet in today's hiring" value={fmtInt(b.gap)} note={`${fmtPct(b.gap / b.total)} of the skill areas`} />
          <Stat label="Job ads in the sector today" value={a ? fmtInt(a.count) : "n/a"} note={a ? `${fmtPct(a.share, 1)} of all classified ads` : undefined} />
        </div>

        <h3 className="d-eyebrow mt-6">How Qatar can meet the demand</h3>
        <ResponseBar counts={b.responses} height={14} className="mt-2" active={pick} onPick={(id) => setPick(pick === id ? null : id)} />
        <ul className="mt-3 space-y-1">
          {RESPONSE_IDS.map((id) => {
            const r = RESPONSES[id];
            const on = pick === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={!b.responses[id]}
                  onClick={() => setPick(on ? null : id)}
                  className={cx("w-full rounded-md px-2 py-1.5 text-left hover:bg-surface-2 disabled:opacity-50", on && "bg-surface-2")}
                >
                  <span className="flex items-center justify-between gap-3">
                    <ResponseTag id={id} long className="text-[0.8125rem] font-medium text-fg" />
                    <span className="d-num text-[0.8125rem] font-semibold text-fg">{fmtInt(b.responses[id])}</span>
                  </span>
                  <span className="mt-0.5 block pl-3.5 text-[0.75rem] leading-snug text-fg-3">{r.action}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-w-0 lg:col-span-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="d-eyebrow">{pick ? `${RESPONSES[pick].label}: ${fmtInt(list.length)} skill areas` : "Skills to secure, by 2030 demand"}</h3>
          <DemandKey />
        </div>
        <ul className="mt-2">
          {top.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className="d-row-btn grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-4 px-2 py-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem]"
                onClick={() => onOpen(s.key)}
                {...tip(() => (
                  <TipBody
                    title={s.skill}
                    rows={[
                      ["2030 demand", fmtScore(s.peak.strategic)],
                      ["Share of job ads", fmtPct(s.peak.market, 1)],
                      ["Gap", <Value key="v" v={s.value} />],
                      ["Response", RESPONSES[responseOf(s)].label],
                    ]}
                    hint="Click for the evidence"
                  />
                ))}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-fg">
                    <span className="truncate">{s.skill}</span>
                    {s.priority === "high" && <Icon name="star" size={11} className="shrink-0 text-gold" />}
                  </span>
                  <DemandBars demand={s.peak.strategic} hiring={hiringSignal(s)} max={max} className="mt-1.5" />
                </span>
                <Value v={s.value} className="justify-end text-[0.8125rem]" />
                <ResponseTag id={responseOf(s)} className="hidden justify-self-start sm:inline-flex" />
              </button>
            </li>
          ))}
        </ul>
        {list.length > top.length && <p className="mt-1 px-2 text-[0.75rem] text-fg-3">{fmtInt(list.length - top.length)} more in the full table below.</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-line pt-5 md:grid-cols-3 lg:col-span-12">
        <div>
          <h3 className="d-eyebrow">Which futures drive the demand</h3>
          <ul className="mt-2 space-y-2">
            {b.drivers.map((d) => (
              <li key={d.id} className="text-[0.8125rem]" tabIndex={0} {...tip(() => <TipBody title={SCENARIOS[d.id].name} rows={[["Skill areas called for", fmtInt(d.n)], ["Evidence signals", fmtInt(d.signals)], ["Average demand", d.demand === null ? "n/a" : fmtScore(d.demand)]]}>{SCENARIOS[d.id].subtitle}</TipBody>)}>
                <span className="flex justify-between gap-3">
                  <span className="truncate text-fg-2">{SCENARIOS[d.id].short}</span>
                  <span className="d-num text-fg">{fmtInt(d.n)}</span>
                </span>
                <span className="mt-1 block h-2 rounded-r-[4px]" style={{ width: `${Math.max(d.n ? 3 : 0, (d.n / maxDriver) * 100)}%`, background: "var(--text-3)" }} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.71875rem] text-fg-3">Skill areas the strategies call for in each 2030 scenario.</p>
        </div>
        <div>
          <h3 className="d-eyebrow">Skills workers need to learn</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {b.learn.map((l) => (
              <li key={l.name} className="rounded-md bg-surface-2 px-2 py-1 text-[0.75rem] text-fg-2" title={`Named in ${l.areas} skill area${l.areas === 1 ? "" : "s"}`}>
                {l.name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.71875rem] text-fg-3">The specific skills the sources name most often in this sector. These are the reskilling targets.</p>
        </div>
        <div>
          <h3 className="d-eyebrow">Where it lands on the map</h3>
          {b.hubs.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {b.hubs.map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => set({ hub: h.id })} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[0.75rem] text-fg-2 hover:border-[var(--line-strong)] hover:text-fg">
                    <KindIcon kind={h.kind} size={12} />
                    {h.short}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[0.8125rem] text-fg-2">Applies nationwide, not to one hub.</p>
          )}
          <p className="mt-2 text-[0.71875rem] text-fg-3">Hubs that host this sector. A reference layer, not measured employers.</p>
        </div>
      </div>
    </div>
  );
}

/** The investment lens: pick a sector and see what its workforce needs before money goes in. */
export const SectorBriefCard = memo(function SectorBriefCard({
  brief,
  overview,
  state,
  set,
  onOpen,
  className,
}: {
  brief: Brief | null;
  overview: SectorRow[];
  state: DashState;
  set: Set;
  onOpen: (key: string) => void;
  className?: string;
}) {
  const b = brief;
  const title = b ? `If Qatar invests in ${SECTORS[b.sector].label}` : "Where Qatar's 2030 demand is, sector by sector";
  const sub = b
    ? b.total
      ? `The strategies call for ${fmtInt(b.total)} skill areas. ${fmtInt(b.gap)} are not yet reflected in today's hiring, and ${fmtInt(b.responses.recruit)} are needed now with a gap too large to train for in time.`
      : undefined
    : "Select a sector for its investment briefing: the skills it needs, the gap, and how to fill it.";
  return (
    <Card id="briefing" className={className} title={<span><span className="d-eyebrow mb-1 block">Investment briefing</span>{title}</span>} sub={sub}>
      <SectorChips state={state} set={set} />
      <div className="mt-4">{b ? <BriefBody b={b} set={set} onOpen={onOpen} /> : <Overview rows={overview} set={set} />}</div>
      <p className="mt-5 border-t border-line pt-3 text-[0.71875rem] leading-snug text-fg-3">
        Headcounts and costs need supply data, which comes in the next phase. The response is a rule on the gap, its timing and Qatari-talent priority, not a forecast.
      </p>
    </Card>
  );
});
