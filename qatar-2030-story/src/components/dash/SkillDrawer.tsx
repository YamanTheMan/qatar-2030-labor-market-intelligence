"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { gaps, sourceById } from "@/lib/data";
import { aggregateSkills, hubsOfSkill, skillKeyOf, stepFill, stepOf } from "@/lib/dash/model";
import type { DashState } from "@/lib/dash/useFilters";
import { fmtInt, fmtPct, fmtScore, plural } from "@/lib/format";
import { HORIZON_LABELS, PRIORITY_LABELS, QUALITY_LABELS, SCENARIO_IDS, SCENARIOS, SECTORS } from "@/lib/meta";
import type { Signal } from "@/lib/types";
import { RESPONSES, gapReason, responseOf } from "@/lib/dash/demand";
import { ResponseTag } from "./charts/response";
import { Icon, KindIcon } from "./icons";
import { Value, cx } from "./ui";

function useSignals(skillKey: string | null): Signal[] | null {
  const [all, setAll] = useState<Signal[] | null>(null);
  useEffect(() => {
    if (!skillKey || all) return;
    let live = true;
    import("@/data/signals.json").then((m) => live && setAll(m.default as Signal[]));
    return () => {
      live = false;
    };
  }, [skillKey, all]);
  return useMemo(() => (all && skillKey ? all.filter((s) => skillKeyOf(s) === skillKey) : null), [all, skillKey]);
}

/** The evidence behind one skill: its numbers in each future, where it lands, and what the sources say. */
export function SkillDrawer({ skillKey, state, set }: { skillKey: string | null; state: DashState; set: (patch: Partial<DashState>) => void }) {
  const skill = useMemo(() => (skillKey ? (aggregateSkills(gaps.filter((r) => skillKeyOf(r) === skillKey))[0] ?? null) : null), [skillKey]);
  const signals = useSignals(skill ? skillKey : null);
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [skillKey]);
  const hubs = skill ? hubsOfSkill(skill) : [];
  const max = skill ? Math.max(0.3, ...skill.rows.map((r) => Math.max(r.strategic, 2 * r.market))) : 1;
  const quotes = signals ? [...signals].sort((a, b) => b.weightedScore - a.weightedScore) : [];
  const shown = more ? quotes : quotes.slice(0, 4);

  return (
    <Dialog.Root open={!!skillKey} onOpenChange={(o) => !o && set({ skill: null })}>
      <Dialog.Portal>
        <Dialog.Overlay className="dash-overlay fixed inset-0 z-[70] bg-black/35" />
        <Dialog.Content className="dash-sheet fixed inset-y-0 right-0 z-[71] flex w-[min(100vw,520px)] flex-col border-l border-line bg-surface shadow-[var(--shadow-lg)] outline-none" aria-describedby={undefined}>
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5">
            <div className="min-w-0">
              <div className="d-eyebrow">{skill ? SECTORS[skill.sector].label : "Skill"}</div>
              <Dialog.Title className="mt-1 text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em] text-fg">{skill ? skill.skill : "Skill not found"}</Dialog.Title>
              {skill && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.75rem]">
                  {skill.priority === "high" && (
                    <span className="d-badge-gold">
                      <Icon name="star" size={11} />
                      {PRIORITY_LABELS.high}
                    </span>
                  )}
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-fg-2">{HORIZON_LABELS[skill.horizon]}</span>
                </div>
              )}
            </div>
            <Dialog.Close className="d-btn d-btn-quiet d-icon shrink-0" aria-label="Close">
              <Icon name="x" size={16} />
            </Dialog.Close>
          </header>

          {!skill ? (
            <p className="p-5 text-[0.875rem] text-fg-2">This link points to a skill that is not in the data.</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Largest gap", <Value key="v" v={skill.value} />],
                  ["Gap in", `${fmtInt(skill.nShort)} of ${plural(skill.nFutures, "future")}`],
                  ["Evidence", plural(skill.signalCount, "signal")],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-surface-2 px-3 py-2">
                    <div className="d-num text-[0.9375rem] font-semibold text-fg">{v}</div>
                    <div className="text-[0.71875rem] text-fg-3">{k}</div>
                  </div>
                ))}
              </div>

              <h3 className="d-eyebrow mt-6">Why the gap</h3>
              <p className="mt-1.5 text-[0.875rem] leading-relaxed text-fg">{gapReason(skill)}</p>
              {quotes[0] && <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-fg-2">Why demand rises: {quotes[0].rationale}</p>}

              <div className="mt-4 rounded-lg border border-line p-3.5">
                <div className="d-eyebrow">Suggested response</div>
                <ResponseTag id={responseOf(skill)} long className="mt-1.5 text-[0.9375rem] font-semibold text-fg" />
                <p className="mt-1 text-[0.8125rem] leading-snug text-fg-2">{RESPONSES[responseOf(skill)].action}</p>
                <p className="mt-1.5 text-[0.71875rem] text-fg-3">Rule: {RESPONSES[responseOf(skill)].rule} A decision rule on the data, not a forecast.</p>
              </div>

              <h3 className="d-eyebrow mt-6">In each future</h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.71875rem] text-fg-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-[2px]" style={{ background: "var(--accent)" }} />
                  2030 demand
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-[2px]" style={{ background: "var(--text-3)" }} />2 × share of job ads
                </span>
              </div>
              <ul className="mt-2 divide-y divide-[var(--line)]">
                {SCENARIO_IDS.map((f) => {
                  const r = skill.byScenario[f];
                  const on = state.future === f;
                  return (
                    <li key={f} className={cx("grid grid-cols-[minmax(0,1fr)_4.25rem] items-center gap-x-4 py-2.5", on && "-mx-2 rounded-md bg-surface-2 px-2")}>
                      <div className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                          <span className="truncate font-medium text-fg">{SCENARIOS[f].short}</span>
                          {r && (
                            <span className="d-num shrink-0 text-[0.71875rem] text-fg-3">
                              {fmtScore(r.strategic)} demand · {fmtPct(r.market, 1)} of ads
                            </span>
                          )}
                        </div>
                        {r ? (
                          <div className="mt-1.5 space-y-[2px]" aria-hidden="true">
                            <div className="h-2 rounded-r-[4px]" style={{ width: `${Math.max(1, (r.strategic / max) * 100)}%`, background: "var(--accent)" }} />
                            <div className="h-2 rounded-r-[4px]" style={{ width: `${Math.max(1, ((2 * r.market) / max) * 100)}%`, background: "var(--text-3)" }} />
                          </div>
                        ) : (
                          <div className="mt-1 text-[0.75rem] text-fg-3">No strategy source calls for it in this future.</div>
                        )}
                      </div>
                      {r ? (
                        <span className="flex items-center justify-end gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: stepFill(stepOf(r.shortfall)) }} />
                          <span className="d-num text-[0.8125rem] font-semibold text-fg">{r.shortfall >= 0 ? "+" : "−"}{Math.abs(r.shortfall).toFixed(2)}</span>
                        </span>
                      ) : (
                        <span className="text-right text-[0.75rem] text-fg-3">n/a</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[0.71875rem] leading-snug text-fg-3">Gap = 2030 demand − 2 × share of job ads. The space between the two bars is the gap.</p>

              <h3 className="d-eyebrow mt-6">Where it lands</h3>
              {hubs.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {hubs.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[0.75rem] text-fg-2 hover:border-[var(--line-strong)] hover:text-fg"
                        onClick={() => set({ hub: h.id, skill: null })}
                        title={`Focus the dashboard on ${h.name}`}
                      >
                        <KindIcon kind={h.kind} size={12} />
                        {h.short}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-[0.8125rem] text-fg-2">A general skill that applies nationwide. It is not tied to one hub.</p>
              )}

              {skill.specificSkills.length > 0 && (
                <>
                  <h3 className="d-eyebrow mt-6">Specific skills named in the sources</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {skill.specificSkills.slice(0, 14).map((s) => (
                      <li key={s} className="rounded-md bg-surface-2 px-2 py-1 text-[0.75rem] text-fg-2">
                        {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className="d-eyebrow mt-6">What the sources say</h3>
              {!signals ? (
                <p className="mt-2 text-[0.8125rem] text-fg-3">Loading the evidence…</p>
              ) : quotes.length === 0 ? (
                <p className="mt-2 text-[0.8125rem] text-fg-3">No individual signals are recorded for this skill.</p>
              ) : (
                <>
                  <ul className="mt-2 space-y-2.5">
                    {shown.map((s) => {
                      const src = sourceById.get(s.sourceId);
                      return (
                        <li key={s.i} className="rounded-lg border border-line p-3">
                          {s.quote && <blockquote className="border-l-2 border-[var(--line-strong)] pl-2.5 text-[0.8125rem] italic leading-snug text-fg">“{s.quote}”</blockquote>}
                          <p className={cx("text-[0.8125rem] leading-snug text-fg-2", s.quote && "mt-1.5")}>{s.rationale}</p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.71875rem] text-fg-3">
                            {src?.url ? (
                              <a href={src.url} target="_blank" rel="noreferrer" className="d-link inline-flex items-center gap-1">
                                {src.short}
                                <Icon name="external" size={11} />
                              </a>
                            ) : (
                              <span className="font-medium text-fg-2">{src?.short ?? s.sourceId}</span>
                            )}
                            {src && <span>{src.year}</span>}
                            <span>· {SCENARIOS[s.scenario].short}</span>
                            <span>· {QUALITY_LABELS[s.quality]}</span>
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                  {quotes.length > 4 && (
                    <button type="button" className="d-btn d-btn-sm mt-3" onClick={() => setMore(!more)}>
                      {more ? "Show fewer" : `Show all ${fmtInt(quotes.length)} signals`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
