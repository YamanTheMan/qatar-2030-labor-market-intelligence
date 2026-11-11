"use client";
import { memo, useMemo, useState } from "react";
import { SHORT, type SkillAgg } from "@/lib/dash/model";
import { DEMAND, demandOf, gapReason, gapShort, hiringSignal, responseOf, RESPONSES } from "@/lib/dash/demand";
import { fmtInt, fmtPct, fmtScore } from "@/lib/format";
import { HORIZON_LABELS, SCENARIOS, SECTORS } from "@/lib/meta";
import { Icon } from "../icons";
import { Card, EmptyState, Segmented, TipBody, Value, tip } from "../ui";
import { DemandBars, DemandKey, ResponseTag } from "./response";

type Sort = "demand" | "gap";
const N = 12;

/** The skills Qatar's 2030 plans call for most, each next to today's hiring and the gap between them. */
export const DemandList = memo(function DemandList({ skills, onOpen, className }: { skills: SkillAgg[]; onOpen: (key: string) => void; className?: string }) {
  const [sort, setSort] = useState<Sort>("demand");
  const list = useMemo(
    () => (sort === "demand" ? [...skills].sort((a, b) => b.peak.strategic - a.peak.strategic) : skills.filter((s) => s.value >= SHORT).sort((a, b) => b.value - a.value)),
    [skills, sort],
  );
  const top = list.slice(0, N);
  const max = Math.max(0.3, ...top.map((s) => Math.max(s.peak.strategic, hiringSignal(s))));

  return (
    <Card
      className={className}
      title="Skills in demand for 2030"
      sub="What the strategies call for (maroon) against what employers advertise today (grey). The space between the two bars is the gap."
      actions={
        <Segmented<Sort>
          small
          label="Rank skills by"
          value={sort}
          onChange={setSort}
          options={[
            { id: "demand", label: "Highest demand" },
            { id: "gap", label: "Largest gap" },
          ]}
        />
      }
      bodyClass="px-2 pb-3 sm:px-3 sm:pb-4"
    >
      {top.length === 0 ? (
        <div className="px-2">
          <EmptyState>No skills match these filters.</EmptyState>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[1.5rem_minmax(0,1fr)_4.25rem_6.75rem_1rem] gap-x-3 px-2 pb-1 text-[0.6875rem] text-fg-3 sm:grid">
            <span />
            <span>Skill area · why the gap</span>
            <span className="text-right">Gap</span>
            <span>Response</span>
            <span />
          </div>
          <ol>
            {top.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  className="d-row-btn grid grid-cols-[1.5rem_minmax(0,1fr)_4.25rem_1rem] items-center gap-x-3 px-2 py-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_4.25rem_6.75rem_1rem]"
                  onClick={() => onOpen(s.key)}
                  {...tip(() => (
                    <TipBody
                      title={s.skill}
                      rows={[
                        ["2030 demand", `${fmtScore(s.peak.strategic)} · ${DEMAND[demandOf(s.peak.strategic)].label}`],
                        ["Share of job ads today", fmtPct(s.peak.market, 1)],
                        ["Gap", <Value key="v" v={s.value} />],
                        ["Needed", HORIZON_LABELS[s.horizon]],
                        ["Response", RESPONSES[responseOf(s)].label],
                      ]}
                      hint="Click for the evidence and sources"
                    >
                      {gapReason(s)}
                    </TipBody>
                  ))}
                >
                  <span className="d-num text-[0.75rem] text-fg-3">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-fg">
                      <span className="truncate">{s.skill}</span>
                      {s.priority === "high" && <Icon name="star" size={11} className="shrink-0 text-gold" />}
                    </span>
                    <span className="block truncate text-[0.71875rem] text-fg-3">
                      {SECTORS[s.sector].label} · {gapShort(s)} · {SCENARIOS[s.peak.scenario].short}
                    </span>
                    <DemandBars demand={s.peak.strategic} hiring={hiringSignal(s)} max={max} className="mt-1.5" />
                  </span>
                  <Value v={s.value} className="justify-end text-[0.8125rem]" />
                  <ResponseTag id={responseOf(s)} className="hidden sm:inline-flex" />
                  <Icon name="chevron-right" size={14} className="text-fg-3" />
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2">
            <DemandKey />
            <span className="text-[0.71875rem] text-fg-3">
              <Icon name="star" size={10} className="mr-1 inline text-gold" />
              Priority for Qatari talent · {fmtInt(Math.max(0, list.length - N))} more in the table
            </span>
          </div>
        </>
      )}
    </Card>
  );
});
