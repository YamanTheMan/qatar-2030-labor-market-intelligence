"use client";
import { useMemo, useState } from "react";
import { SEVERE, SHORT, STEP_IDS, type HubStat, type SkillAgg, type StepId } from "@/lib/dash/model";
import { fmtInt } from "@/lib/format";
import { HUB_KINDS, hubSectors } from "@/lib/hubs";
import { SECTORS } from "@/lib/meta";
import { Icon, KindIcon } from "./icons";
import { Segmented, StepBar, Value, cx } from "./ui";

type Sort = "mean" | "short";

function stepCounts(skills: SkillAgg[]): Record<StepId, number> {
  const out = Object.fromEntries(STEP_IDS.map((s) => [s, 0])) as Record<StepId, number>;
  for (const s of skills) out[s.step] += 1;
  return out;
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-surface-2 px-3 py-2">
    <div className="d-num text-[1.25rem] font-semibold leading-tight text-fg">{value}</div>
    <div className="text-[0.71875rem] text-fg-3">{label}</div>
  </div>
);

function HubDetail({ s, onBack, onOpenSkill }: { s: HubStat; onBack: () => void; onOpenSkill: (key: string) => void }) {
  const { hub } = s;
  const top = [...s.skills].sort((a, b) => b.value - a.value).slice(0, 6);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-3 sm:px-5">
        <button type="button" className="d-btn d-btn-quiet d-btn-sm -ml-2" onClick={onBack}>
          <Icon name="arrow-left" size={14} />
          All hubs
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 sm:px-5">
        <div className="d-eyebrow flex items-center gap-1.5">
          <KindIcon kind={hub.kind} size={13} />
          {HUB_KINDS[hub.kind]} · {hub.municipality}
        </div>
        <h2 className="mt-1 text-[1.125rem] font-semibold leading-snug tracking-[-0.01em] text-fg">{hub.name}</h2>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-fg-2">{hub.blurb}</p>

        <div className="d-eyebrow mt-4">Based here</div>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {hub.anchors.map((a) => (
            <li key={a} className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[0.75rem] text-fg-2">
              {a}
            </li>
          ))}
        </ul>

        {s.total === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-strong px-3 py-4 text-[0.8125rem] text-fg-3">No skills are linked to this hub under the current filters. Try another future or clear the filters.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="skills linked" value={fmtInt(s.total)} />
              <Stat label="with a gap" value={fmtInt(s.short)} />
              <Stat label="severe" value={fmtInt(s.severe)} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[0.8125rem] text-fg-2">
              <span>Average gap</span>
              <Value v={s.mean} />
            </div>
            <StepBar steps={stepCounts(s.skills)} height={8} className="mt-2" />

            <div className="d-eyebrow mt-4">Largest gaps here</div>
            <ul className="-mx-2 mt-1">
              {top.map((k) => (
                <li key={k.key}>
                  <button type="button" className="d-row-btn flex items-center justify-between gap-3 px-2 py-1.5" style={{ display: "flex" }} onClick={() => onOpenSkill(k.key)}>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8125rem] font-medium text-fg">{k.skill}</span>
                      <span className="block truncate text-[0.71875rem] text-fg-3">{SECTORS[k.sector].label}</span>
                    </span>
                    <Value v={k.value} className="text-[0.8125rem]" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-4 border-t border-line pt-3 text-[0.71875rem] leading-snug text-fg-3">
          Linked through {hubSectors(hub).map((id) => SECTORS[id].label).join(", ")}. The link is a rule by sector and skill name, not a count of jobs at this site.
        </p>
      </div>
    </div>
  );
}

export function HubRail({
  stats,
  selected,
  hover,
  onHover,
  onSelect,
  nationwide,
  onOpenSkill,
  className,
}: {
  stats: HubStat[];
  selected: string | null;
  hover: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  nationwide: SkillAgg[];
  onOpenSkill: (key: string) => void;
  className?: string;
}) {
  const [sort, setSort] = useState<Sort>("mean");
  const ranked = useMemo(
    () => [...stats].sort((a, b) => (sort === "mean" ? (b.mean ?? -9) - (a.mean ?? -9) : b.short - a.short) || b.short - a.short || a.hub.short.localeCompare(b.hub.short)),
    [stats, sort],
  );
  const current = selected ? stats.find((s) => s.hub.id === selected) : undefined;
  const nwShort = nationwide.filter((s) => s.value >= SHORT).length;
  const nwSevere = nationwide.filter((s) => s.value >= SEVERE).length;

  return (
    <section className={cx("d-card flex min-h-0 min-w-0 flex-col overflow-hidden", className)} aria-label="Hubs">
      {current ? (
        <HubDetail s={current} onBack={() => onSelect(null)} onOpenSkill={onOpenSkill} />
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pb-2 pt-4 sm:px-5">
            <div>
              <h2 className="d-h">Hubs and who is based there</h2>
              <p className="d-sub mt-0.5">{fmtInt(stats.length)} hubs. Pick one to focus the whole page on it.</p>
            </div>
            <Segmented<Sort>
              small
              label="Sort hubs"
              value={sort}
              onChange={setSort}
              options={[
                { id: "mean", label: "By average" },
                { id: "short", label: "By count" },
              ]}
            />
          </header>
          <ol className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 sm:px-3">
            {ranked.map((s, i) => (
              <li key={s.hub.id}>
                <button
                  type="button"
                  className="d-row-btn px-2 py-2"
                  data-active={hover === s.hub.id || undefined}
                  onClick={() => onSelect(s.hub.id)}
                  onPointerEnter={(e) => e.pointerType !== "touch" && onHover(s.hub.id)}
                  onPointerLeave={() => onHover(null)}
                  onFocus={() => onHover(s.hub.id)}
                  onBlur={() => onHover(null)}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="d-num w-4 shrink-0 text-right text-[0.71875rem] text-fg-3">{i + 1}</span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-3 text-fg-2">
                      <KindIcon kind={s.hub.kind} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[0.8125rem] font-semibold text-fg">{s.hub.short}</span>
                        {s.total ? <Value v={s.mean} className="text-[0.8125rem]" /> : <span className="text-[0.75rem] text-fg-3">no data</span>}
                      </span>
                      <span className="flex items-baseline justify-between gap-3 text-[0.71875rem] text-fg-3">
                        <span className="truncate">{s.hub.tag}</span>
                        {s.total > 0 && (
                          <span className="d-num shrink-0">
                            {fmtInt(s.short)} of {fmtInt(s.total)} with a gap
                          </span>
                        )}
                      </span>
                      <StepBar steps={stepCounts(s.skills)} height={5} className="mt-1.5" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="border-t border-line px-4 py-2.5 text-[0.71875rem] leading-snug text-fg-3 sm:px-5">
            {nationwide.length > 0
              ? `${fmtInt(nationwide.length)} general skills apply nationwide and are not tied to a hub (${fmtInt(nwShort)} with a gap, ${fmtInt(nwSevere)} large).`
              : "Every skill in view is linked to at least one hub."}
          </p>
        </>
      )}
    </section>
  );
}
