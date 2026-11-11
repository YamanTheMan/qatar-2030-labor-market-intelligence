"use client";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { gaps, summary } from "@/lib/data";
import { sectorBrief, sectorOverview } from "@/lib/dash/demand";
import { aggregateSkills, filterRows, hubRows, hubStats, kpisOf, nationwideSkills } from "@/lib/dash/model";
import { useDashboardTheme, useTheme } from "@/lib/dash/theme";
import { useDashState } from "@/lib/dash/useFilters";
import { fmtInt } from "@/lib/format";
import { DemandList } from "./charts/DemandList";
import { Benchmarks, LearnCard, ResponseBoard } from "./charts/Outlook";
import { SectorBriefCard } from "./charts/SectorBrief";
import { SkillsTable } from "./charts/SkillsTable";
import { FilterBar } from "./FilterBar";
import { HubRail } from "./HubRail";
import { Icon } from "./icons";
import { KpiStrip } from "./KpiStrip";
import { QatarMap } from "./map/QatarMap";
import { SkillDrawer } from "./SkillDrawer";
import { TipLayer } from "./ui";

const TERMS: [string, string][] = [
  ["2030 demand", "How strongly Qatar's strategy documents call for a skill area, on a scale up to 1. It combines how many sources mention it, how good those sources are, and how strongly they say demand will rise."],
  ["Today's hiring", `The share of ${fmtInt(summary.counts.postingsClassified)} classified Qatar job ads that ask for the skill. The pipeline counts it twice when comparing it with demand.`],
  ["Gap", "2030 demand minus twice the share of job ads. From 0.05 there is a gap, from 0.15 it is large. Below 0.05 today's hiring already reflects the demand."],
  ["Suggested response", "A rule on the gap, its timing and Qatari-talent priority: recruit internationally, reskill current workers, build Qatari talent, or keep the current pipeline. It is not a forecast."],
  ["Futures", "Five scenarios for Qatar in 2030. “All futures” shows each skill in the future where its gap is largest."],
  ["Hubs on the map", "The data is by sector, not by place. Each hub is linked to the skills of the sectors it hosts. The organisations listed are for orientation, not measured employers."],
];

function HowToRead() {
  return (
    <Popover.Root>
      <Popover.Trigger className="d-btn d-btn-sm">
        <Icon name="info" size={14} />
        How to read this
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} collisionPadding={12} className="d-card z-[60] max-h-[80vh] w-[min(92vw,460px)] overflow-y-auto p-5 text-[0.8125rem] leading-relaxed text-fg-2 shadow-[var(--shadow-lg)] outline-none">
          <h2 className="d-h">How to read this platform</h2>
          <dl className="mt-3 space-y-2.5">
            {TERMS.map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold text-fg">{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-fg-3">Supply data (graduates, workers by skill) comes in the next phase. Until then the page measures future demand against today&apos;s job ads.</p>
          <Link href="/methodology/" className="d-link mt-2 inline-block">
            Full methodology and caveats
          </Link>
          <Popover.Arrow className="fill-[var(--surface)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function Dashboard() {
  useDashboardTheme();
  const theme = useTheme();
  const { state, set, reset } = useDashState();
  const [hoverHub, setHoverHub] = useState<string | null>(null);

  // `base` ignores the selected hub so every hub stays comparable on the map.
  const base = useMemo(() => filterRows(gaps, state), [state]);
  const rows = useMemo(() => hubRows(base, state.hub), [base, state.hub]);
  const skills = useMemo(() => aggregateSkills(rows), [rows]);
  const kpis = useMemo(() => kpisOf(skills), [skills]);
  const stats = useMemo(() => hubStats(base), [base]);
  const nationwide = useMemo(() => nationwideSkills(base), [base]);

  // The briefing sets the sector itself, so its overview ignores the sector filter.
  const overview = useMemo(() => sectorOverview(aggregateSkills(hubRows(filterRows(gaps, state, ["sector"]), state.hub))), [state]);
  const brief = useMemo(
    () => (state.sector === "all" ? null : sectorBrief(state.sector, rows, hubRows(filterRows(gaps, state, ["future"]), state.hub))),
    [state, rows],
  );

  const openSkill = useCallback((key: string) => set({ skill: key }), [set]);
  const selectHub = useCallback((id: string | null) => set({ hub: id }), [set]);

  return (
    <>
      <div className="dash flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-4 pt-5 sm:pt-6">
        <div className="min-w-0">
          <div className="d-eyebrow">Qatar National Vision 2030 · Workforce demand</div>
          <h1 className="mt-1 text-[1.375rem] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[1.75rem]">What skills Qatar&apos;s economy will need by 2030</h1>
          <p className="mt-1 max-w-[80ch] text-[0.875rem] leading-snug text-fg-2">
            What the national strategies call for, where today&apos;s hiring falls short, and how to close the gap: by sector, by hub and by future.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-fg-2">
          <span>
            <b className="font-semibold text-fg">31</b> strategy publications
          </span>
          <span>
            <b className="font-semibold text-fg">{fmtInt(summary.counts.signals)}</b> evidence signals
          </span>
          <span>
            <b className="font-semibold text-fg">{fmtInt(summary.counts.postingsClassified)}</b> job ads
          </span>
          <HowToRead />
        </div>
      </div>

      <FilterBar state={state} set={set} reset={reset} matching={skills.length} />

      <div className="dash space-y-4 pt-4">
        <KpiStrip kpis={kpis} skills={skills} />
        <div className="grid grid-cols-1 gap-4 lg:h-[clamp(560px,72vh,800px)] lg:grid-cols-12 lg:grid-rows-1">
          <QatarMap className="h-[min(74vh,640px)] min-h-[460px] lg:col-span-7 lg:h-auto lg:min-h-0 xl:col-span-8" stats={stats} selected={state.hub} hover={hoverHub} onHover={setHoverHub} onSelect={selectHub} theme={theme} />
          <HubRail className="max-h-[640px] lg:col-span-5 lg:max-h-none xl:col-span-4" stats={stats} selected={state.hub} hover={hoverHub} onHover={setHoverHub} onSelect={selectHub} nationwide={nationwide} onOpenSkill={openSkill} />
        </div>
        <SectorBriefCard brief={brief} overview={overview} state={state} set={set} onOpen={openSkill} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <DemandList className="lg:col-span-7 xl:col-span-8" skills={skills} onOpen={openSkill} />
          <LearnCard className="lg:col-span-5 xl:col-span-4" skills={skills} />
        </div>
        <ResponseBoard skills={skills} onOpen={openSkill} />
        <SkillsTable skills={skills} onOpen={openSkill} />
        <Benchmarks />
      </div>
      <SkillDrawer skillKey={state.skill} state={state} set={set} />
      <TipLayer />
    </>
  );
}
