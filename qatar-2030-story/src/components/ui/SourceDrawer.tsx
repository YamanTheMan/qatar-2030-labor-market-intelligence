"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sourceById } from "@/lib/data";
import type { Signal } from "@/lib/types";
import { DIRECTION_LABELS, PUBLISHER_GROUPS, QUALITY_LABELS, SCENARIOS, SECTORS } from "@/lib/meta";

interface Ctx {
  openSource: (id: string, focusSkill?: string) => void;
}
const DrawerCtx = createContext<Ctx>({ openSource: () => {} });
export const useSourceDrawer = () => useContext(DrawerCtx);

export function SourceDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ id: string; focusSkill?: string } | null>(null);
  const openSource = useCallback((id: string, focusSkill?: string) => setState({ id, focusSkill }), []);
  const value = useMemo(() => ({ openSource }), [openSource]);
  const src = state ? sourceById.get(state.id) : undefined;
  // Evidence signals are loaded on first open, keeping them out of the story bundle.
  const [allSignals, setAllSignals] = useState<Signal[] | null>(null);
  useEffect(() => {
    if (state && !allSignals) import("@/data/signals.json").then((m) => setAllSignals(m.default as Signal[]));
  }, [state, allSignals]);
  const sigs = useMemo(() => {
    if (!state || !allSignals) return [];
    const all = allSignals.filter((x) => x.sourceId === state.id);
    if (!state.focusSkill) return all;
    return [...all].sort((a, b) => Number(b.skillKey === state.focusSkill) - Number(a.skillKey === state.focusSkill));
  }, [state, allSignals]);

  return (
    <DrawerCtx.Provider value={value}>
      {children}
      <Dialog.Root open={!!src} onOpenChange={(o) => !o && setState(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[560px] flex-col bg-paper shadow-2xl outline-none">
            {src ? (
              <>
                <div className="border-b border-rule px-5 pb-4 pt-5 sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <p className="kicker">{PUBLISHER_GROUPS[src.group]}</p>
                    <Dialog.Close className="-mr-2 -mt-1 rounded-full px-3 py-1 text-sm text-ink-2 hover:bg-paper-2" aria-label="Close">
                      Close ✕
                    </Dialog.Close>
                  </div>
                  <Dialog.Title className="display mt-1 text-2xl">{src.title}</Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-ink-2">
                    {src.publisher} · {src.year} · {QUALITY_LABELS[src.quality]} · {src.signals} evidence signal{src.signals === 1 ? "" : "s"}
                  </Dialog.Description>
                  {src.sameTitleAs ? (
                    <p className="mt-2 rounded-lg bg-gold-soft px-3 py-2 text-xs text-gold-ink">
                      Shares its title with another source record ({sourceById.get(src.sameTitleAs)?.short}). The pipeline treats them as two records. See methodology.
                    </p>
                  ) : null}
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-block text-sm">
                    Open the publication ↗
                  </a>
                </div>
                {!allSignals ? <p className="px-7 py-6 text-sm text-ink-2">Loading evidence…</p> : null}
                <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
                  {sigs.map((s) => (
                    <li key={s.i} className={`card p-4 ${state?.focusSkill === s.skillKey ? "ring-2 ring-maroon/40" : ""}`}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: SCENARIOS[s.scenario].color }} aria-hidden="true" />
                          {SCENARIOS[s.scenario].short}
                        </span>
                        <span>·</span>
                        <span>{SECTORS[s.sector].label}</span>
                        <span>·</span>
                        <span>{DIRECTION_LABELS[s.direction]}</span>
                      </div>
                      <p className="mt-1 font-semibold text-ink">{s.skill}</p>
                      {s.quote ? (
                        <blockquote className="mt-2 border-l-2 border-maroon pl-3 font-display text-[1.02rem] italic text-ink">
                          &ldquo;{s.quote}&rdquo;
                        </blockquote>
                      ) : null}
                      {s.rationale ? <p className="mt-2 text-sm text-ink-2">{s.rationale}</p> : null}
                      {s.specificSkills.length ? (
                        <p className="mt-2 text-xs text-muted">Specific skills: {s.specificSkills.join(", ")}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DrawerCtx.Provider>
  );
}
