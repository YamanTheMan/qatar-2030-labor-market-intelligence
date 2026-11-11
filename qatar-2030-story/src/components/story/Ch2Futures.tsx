"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { summary } from "@/lib/data";
import { SCENARIOS, SCENARIO_IDS, SECTORS, type ScenarioId } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { CoverageStrip } from "@/components/charts/CoverageStrip";
import { Reveal } from "@/components/ui/Reveal";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";

function FutureCard({ id, i }: { id: ScenarioId; i: number }) {
  const s = SCENARIOS[id];
  const d = summary.byScenario.find((x) => x.scenario === id)!;
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <Reveal delay={i * 0.06} className="h-full">
      <article className="card flex h-full flex-col overflow-hidden">
        <div className="h-1.5" style={{ background: s.color }} aria-hidden="true" />
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.ink }}>
            Future {i + 1}
            {id === "S1" ? " · baseline" : ""}
          </p>
          <h3 className="display mt-1 text-[1.35rem] leading-tight text-ink">{s.name}</h3>
          <p className="mt-2 text-[0.95rem] text-ink-2">{s.subtitle}</p>
          <p className="tabular mt-3 text-xs text-muted">
            {d.signals} evidence signals · {d.sources} publications · {d.rows} skill rows
          </p>
          <div className="mt-4">
            <p className="text-xs font-semibold text-ink">Most important skills in this future</p>
            <ol className="mt-1.5 space-y-1 text-sm text-ink-2">
              {d.topSkills.map((t, k) => (
                <li key={t.skill} className="flex gap-2">
                  <span className="tabular w-4 shrink-0 text-muted">{k + 1}.</span>
                  <span>
                    {t.skill} <span className="text-xs text-muted">· {SECTORS[t.sector].short}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-auto pt-4">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="text-sm font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
              style={{ color: s.ink }}
            >
              {open ? "Close" : "What Doha looks like in 2030 if this happens"} {open ? "↑" : "↓"}
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.p
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden"
                >
                  <span className="mt-3 block border-l-2 pl-3 font-display text-[1.02rem] italic leading-relaxed text-ink" style={{ borderColor: s.color }}>
                    {s.vignette}
                  </span>
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function Ch2Futures() {
  const by = summary.byScenario;
  return (
    <Chapter id="futures" tone="tint">
      <div className="prose-story mb-10 max-w-2xl">
        <p>
          Scenario planning does not predict the future. It prepares for several. The capstone team defined five plausible versions of
          Qatar&rsquo;s economy in 2030 and asked, for each one, which skills the evidence says will matter. Each is a{" "}
          <Term k="future">future</Term> in this story.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {SCENARIO_IDS.map((id, i) => (
          <FutureCard key={id} id={id} i={i} />
        ))}
      </div>
      <div className="mt-14 max-w-4xl">
        <ChartFrame
          title="The baseline future rests on almost nine times more evidence than the two thinnest"
          howTo={
            <>
              Bars show how many <Term k="signal">evidence signals</Term> support each future. Findings for Knowledge economy and
              Regional hub rest on 18 signals each, so read them as directional.
            </>
          }
          source={SRC.signals}
          explore={{ href: "/explore/?view=model", label: "See how the model balances this" }}
        >
          <CoverageStrip data={by.map((b) => ({ scenario: b.scenario, signals: b.signals, rows: b.rows, sources: b.sources }))} />
          <p className="mt-4 text-sm text-ink-2">
            To stop well-evidenced futures from dominating, the model applies a{" "}
            <Term k="penalty">signal-count balance</Term>.{" "}
            <Link href="/methodology/#penalty" className="link">
              How it works
            </Link>
          </p>
        </ChartFrame>
      </div>
    </Chapter>
  );
}
