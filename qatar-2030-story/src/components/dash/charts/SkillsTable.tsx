"use client";
import { memo, useMemo, useState } from "react";
import { stepOf, type SkillAgg } from "@/lib/dash/model";
import { fmtInt, fmtPct, fmtScore, fmtShortfall } from "@/lib/format";
import { HORIZON_LABELS, PRIORITY_LABELS, SCENARIO_IDS, SCENARIOS, SECTORS } from "@/lib/meta";
import { RESPONSE_IDS, RESPONSES, responseOf } from "@/lib/dash/demand";
import { Icon } from "../icons";
import { ResponseTag } from "./response";
import { Card, EmptyState, Swatch, TipBody, Value, cx, tip } from "../ui";

type Col = "skill" | "sector" | "strategic" | "market" | "value" | "response" | "horizon";
const COLS: { id: Col; label: string; num?: boolean; hide?: string }[] = [
  { id: "skill", label: "Skill" },
  { id: "sector", label: "Sector", hide: "hidden md:table-cell" },
  { id: "strategic", label: "2030 demand", num: true, hide: "hidden sm:table-cell" },
  { id: "market", label: "Share of job ads", num: true, hide: "hidden sm:table-cell" },
  { id: "value", label: "Gap", num: true },
  { id: "response", label: "Response", hide: "hidden lg:table-cell" },
  { id: "horizon", label: "Needed", hide: "hidden xl:table-cell" },
];
const PAGE = 15;

const sortKey = (s: SkillAgg, c: Col): string | number =>
  c === "skill" ? s.skill.toLowerCase() : c === "sector" ? SECTORS[s.sector].label : c === "strategic" ? s.peak.strategic : c === "market" ? s.peak.market : c === "value" ? s.value : c === "response" ? RESPONSE_IDS.indexOf(responseOf(s)) : HORIZON_LABELS[s.horizon];

function toCsv(skills: SkillAgg[]): string {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["Skill", "Sector", "Future with largest gap", "2030 demand", "Share of job ads", "Gap", "Suggested response", "Priority", "Needed", ...SCENARIO_IDS.map((f) => `Gap: ${SCENARIOS[f].short}`)];
  const lines = skills.map((s) =>
    [s.skill, SECTORS[s.sector].label, SCENARIOS[s.peak.scenario].short, s.peak.strategic.toFixed(3), s.peak.market.toFixed(4), s.value.toFixed(3), RESPONSES[responseOf(s)].label, PRIORITY_LABELS[s.priority], HORIZON_LABELS[s.horizon], ...SCENARIO_IDS.map((f) => s.byScenario[f]?.shortfall.toFixed(3) ?? "")]
      .map(q)
      .join(","),
  );
  return [head.map(q).join(","), ...lines].join("\n");
}

function download(skills: SkillAgg[]) {
  const url = URL.createObjectURL(new Blob(["﻿" + toCsv(skills)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "qatar-2030-skills.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Every skill in view, sortable, with its shortfall in each of the five futures. */
export const SkillsTable = memo(function SkillsTable({ skills, onOpen, className }: { skills: SkillAgg[]; onOpen: (key: string) => void; className?: string }) {
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 }>({ col: "value", dir: -1 });
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const out = [...skills];
    out.sort((a, b) => {
      const x = sortKey(a, sort.col);
      const y = sortKey(b, sort.col);
      const d = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return d * sort.dir || b.value - a.value;
    });
    return out;
  }, [skills, sort]);
  const shown = all ? sorted : sorted.slice(0, PAGE);
  const th = "sticky top-0 z-[1] border-b border-line bg-surface px-3 py-2 text-[0.71875rem] font-medium text-fg-3";

  return (
    <Card
      className={className}
      title="All skill areas"
      sub={`${fmtInt(skills.length)} skills match the filters. Select a row for the evidence behind it.`}
      actions={
        <button type="button" className="d-btn d-btn-sm" onClick={() => download(sorted)} disabled={!skills.length}>
          <Icon name="download" size={14} />
          Export CSV
        </button>
      }
      bodyClass="pb-3"
    >
      {skills.length === 0 ? (
        <div className="px-4 pb-2 sm:px-5">
          <EmptyState>No skills match these filters. Clear a filter to see more.</EmptyState>
        </div>
      ) : (
        <>
          <div className={cx("overflow-auto", all && "max-h-[640px]")}>
            <table className="w-full border-separate border-spacing-0 text-left text-[0.8125rem]">
              <thead>
                <tr>
                  {COLS.map((c) => {
                    const on = sort.col === c.id;
                    return (
                      <th key={c.id} scope="col" aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cx(th, c.hide, c.num && "text-right", c.id === "skill" && "pl-4 sm:pl-5")}>
                        <button
                          type="button"
                          className={cx("inline-flex items-center gap-1 rounded hover:text-fg", on && "text-fg")}
                          onClick={() => setSort(on ? { col: c.id, dir: sort.dir === 1 ? -1 : 1 } : { col: c.id, dir: c.num ? -1 : 1 })}
                        >
                          {c.label}
                          <Icon name={on && sort.dir === 1 ? "arrow-up" : "arrow-down"} size={12} className={on ? "" : "opacity-0"} />
                        </button>
                      </th>
                    );
                  })}
                  <th scope="col" className={cx(th, "hidden lg:table-cell")}>
                    In each future
                  </th>
                  <th className={cx(th, "w-8 pr-4")} />
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.key} className="group cursor-pointer hover:bg-surface-2" onClick={() => onOpen(s.key)}>
                    <td className="w-full max-w-0 border-b border-line py-2 pl-4 pr-3 sm:pl-5 lg:w-[34%]">
                      <button type="button" className="flex max-w-full items-center gap-1.5 rounded text-left font-medium text-fg" onClick={(e) => (e.stopPropagation(), onOpen(s.key))}>
                        <span className="truncate">{s.skill}</span>
                        {s.priority === "high" && <Icon name="star" size={11} className="shrink-0 text-gold" />}
                      </button>
                      <span className="block truncate text-[0.71875rem] text-fg-3 md:hidden">{SECTORS[s.sector].label}</span>
                    </td>
                    <td className="hidden border-b border-line px-3 py-2 text-fg-2 md:table-cell">{SECTORS[s.sector].label}</td>
                    <td className="d-num hidden border-b border-line px-3 py-2 text-right text-fg-2 sm:table-cell">{fmtScore(s.peak.strategic)}</td>
                    <td className="d-num hidden border-b border-line px-3 py-2 text-right text-fg-2 sm:table-cell">{fmtPct(s.peak.market, 1)}</td>
                    <td className="border-b border-line px-3 py-2 text-right">
                      <Value v={s.value} className="justify-end" />
                    </td>
                    <td className="hidden border-b border-line px-3 py-2 lg:table-cell">
                      <ResponseTag id={responseOf(s)} />
                    </td>
                    <td className="hidden border-b border-line px-3 py-2 text-fg-2 xl:table-cell">{HORIZON_LABELS[s.horizon]}</td>
                    <td className="hidden border-b border-line px-3 py-2 lg:table-cell">
                      <span className="flex gap-[3px]">
                        {SCENARIO_IDS.map((f) => {
                          const r = s.byScenario[f];
                          return (
                            <span key={f} className="grid h-6 w-6 place-items-center" {...tip(() => <TipBody title={SCENARIOS[f].short} rows={r ? [["Gap", fmtShortfall(r.shortfall, true)]] : undefined}>{r ? s.skill : "No strategy signal for this skill in this future"}</TipBody>)}>
                              <Swatch step={r ? stepOf(r.shortfall) : null} size={16} />
                            </span>
                          );
                        })}
                      </span>
                    </td>
                    <td className="border-b border-line py-2 pr-4 text-fg-3">
                      <Icon name="chevron-right" size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 text-[0.75rem] text-fg-3 sm:px-5">
            <span>
              Showing {fmtInt(shown.length)} of {fmtInt(sorted.length)}. Squares on the right: {SCENARIO_IDS.map((f) => SCENARIOS[f].short).join(", ")}.
            </span>
            {sorted.length > PAGE && (
              <button type="button" className="d-btn d-btn-sm" onClick={() => setAll(!all)}>
                {all ? "Show fewer" : `Show all ${fmtInt(sorted.length)}`}
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  );
});
