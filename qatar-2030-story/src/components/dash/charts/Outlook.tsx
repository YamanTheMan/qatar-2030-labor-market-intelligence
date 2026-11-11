"use client";
import { memo, useMemo } from "react";
import { RESPONSE_IDS, RESPONSES, responseCounts, responseOf, skillsToLearn } from "@/lib/dash/demand";
import type { SkillAgg } from "@/lib/dash/model";
import { fmtInt, fmtPct } from "@/lib/format";
import { SECTORS } from "@/lib/meta";
import { Icon } from "../icons";
import { Card, EmptyState, TipBody, tip } from "../ui";
import { ResponseBar } from "./response";

/** Four ways to meet the demand, each with its rule and the skills it covers. */
export const ResponseBoard = memo(function ResponseBoard({ skills, onOpen, className }: { skills: SkillAgg[]; onOpen: (key: string) => void; className?: string }) {
  const counts = useMemo(() => responseCounts(skills), [skills]);
  const total = skills.length;
  return (
    <Card className={className} title="How Qatar can meet the demand" sub="Each skill area gets one suggested response, from its gap, how soon it is needed, and whether it is a priority for Qatari nationals.">
      {total === 0 ? (
        <EmptyState>No skills match these filters.</EmptyState>
      ) : (
        <>
          <ResponseBar counts={counts} height={14} />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {RESPONSE_IDS.map((id) => {
              const r = RESPONSES[id];
              const own = skills.filter((s) => responseOf(s) === id).sort((a, b) => b.peak.strategic - a.peak.strategic);
              return (
                <section key={id} className="flex flex-col rounded-lg border border-line p-3.5">
                  <header className="flex items-start justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-[0.875rem] font-semibold leading-snug text-fg">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.fill }} aria-hidden="true" />
                      {r.label}
                    </h3>
                    <span className="d-num text-right">
                      <b className="block text-[1.25rem] font-semibold leading-none text-fg">{fmtInt(counts[id])}</b>
                      <span className="text-[0.6875rem] text-fg-3">{fmtPct(counts[id] / total)}</span>
                    </span>
                  </header>
                  <p className="mt-2 text-[0.75rem] leading-snug text-fg-2">{r.action}</p>
                  <p className="mt-1.5 text-[0.6875rem] text-fg-3">Rule: {r.rule}</p>
                  <ul className="mt-3 space-y-0.5 border-t border-line pt-2">
                    {own.slice(0, 4).map((s) => (
                      <li key={s.key}>
                        <button type="button" onClick={() => onOpen(s.key)} className="group flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left text-[0.75rem] hover:bg-surface-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-fg group-hover:underline">{s.skill}</span>
                            <span className="block truncate text-[0.6875rem] text-fg-3">{SECTORS[s.sector].label}</span>
                          </span>
                          <Icon name="chevron-right" size={12} className="shrink-0 text-fg-3" />
                        </button>
                      </li>
                    ))}
                    {own.length === 0 && <li className="px-1 py-1 text-[0.75rem] text-fg-3">None under these filters.</li>}
                  </ul>
                  {own.length > 4 && <p className="mt-1 px-1 text-[0.6875rem] text-fg-3">and {fmtInt(own.length - 4)} more</p>}
                </section>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
});

/** The specific skills named most often: what people will need to learn or change to. */
export const LearnCard = memo(function LearnCard({ skills, className }: { skills: SkillAgg[]; className?: string }) {
  const list = useMemo(() => skillsToLearn(skills, 14), [skills]);
  const max = Math.max(1, ...list.map((l) => l.areas));
  return (
    <Card className={className} title="Skills people need to learn" sub="The specific skills the sources name most often across the skill areas in view. These are the reskilling and training targets.">
      {list.length === 0 ? (
        <EmptyState>No specific skills are named under these filters.</EmptyState>
      ) : (
        <ul className="space-y-1.5">
          {list.map((l) => (
            <li
              key={l.name}
              tabIndex={0}
              className="rounded"
              {...tip(() => (
                <TipBody title={l.name} rows={[["Skill areas that name it", fmtInt(l.areas)], ["Of those, with a gap", fmtInt(l.gapAreas)], ["Sectors", l.sectors.map((s) => SECTORS[s].short).join(", ")]]} />
              ))}
            >
              <span className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                <span className="truncate text-fg">{l.name}</span>
                <span className="d-num shrink-0 text-fg-2">{fmtInt(l.areas)}</span>
              </span>
              <span className="mt-1 flex h-2 gap-[2px]" aria-hidden="true">
                <span className="h-full rounded-l-[2px]" style={{ width: `${(l.gapAreas / max) * 100}%`, background: "var(--accent)" }} />
                <span className="h-full rounded-r-[4px]" style={{ width: `${((l.areas - l.gapAreas) / max) * 100}%`, background: "var(--line-strong)" }} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.71875rem] text-fg-3">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-[2px]" style={{ background: "var(--accent)" }} />
          Skill areas with a gap
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-[2px]" style={{ background: "var(--line-strong)" }} />
          Already in hiring
        </span>
      </p>
    </Card>
  );
});

const WEF = "https://www.weforum.org/reports/the-future-of-jobs-report-2025/";
const BENCH: { figure: string; label: string; note: string }[] = [
  { figure: "46%", label: "of on-the-job skills in the Middle East and North Africa are expected to change by 2030", note: "39% worldwide" },
  { figure: "63%", label: "of employers name skill gaps as the biggest barrier to transforming their business", note: "Global, 2025–2030" },
  { figure: "85%", label: "of employers plan to prioritise upskilling their workforce", note: "70% also expect to hire people with new skills" },
  { figure: "59 in 100", label: "workers worldwide will need training by 2030", note: "11 of them are unlikely to receive it" },
];

/** Outside benchmarks for context. Not Qatar data, and labelled as such. */
export function Benchmarks({ className }: { className?: string }) {
  return (
    <Card
      className={className}
      title="The wider picture"
      sub="Regional and global benchmarks from the World Economic Forum's Future of Jobs Report 2025. Qatar is not reported separately, so these are context, not Qatar figures."
      actions={
        <a href={WEF} target="_blank" rel="noreferrer" className="d-btn d-btn-sm">
          WEF report
          <Icon name="external" size={13} />
        </a>
      }
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BENCH.map((b) => (
          <li key={b.figure} className="rounded-lg bg-surface-2 p-3.5">
            <div className="d-num text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-fg">{b.figure}</div>
            <p className="mt-2 text-[0.8125rem] leading-snug text-fg-2">{b.label}</p>
            <p className="mt-1 text-[0.71875rem] text-fg-3">{b.note}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
