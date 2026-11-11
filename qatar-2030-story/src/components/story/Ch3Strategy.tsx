"use client";

import { useState } from "react";
import { sources, summary } from "@/lib/data";
import { fmtScore, lowerFirst } from "@/lib/format";
import { DIRECTION_LABELS, SCENARIOS, SCENARIO_IDS, SECTORS, type PublisherGroup, type ScenarioId } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { HBars } from "@/components/charts/HBars";
import { LibraryLegend, SourceLibrary } from "@/components/charts/SourceLibrary";
import { useSourceDrawer } from "@/components/ui/SourceDrawer";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";
import { Scrolly } from "./Scrolly";

const EXAMPLE = summary.exampleSignal;

function SignalFlow({ emphasis }: { emphasis: "flow" | "weights" }) {
  const src = sources.find((s) => s.id === EXAMPLE.sourceId)!;
  const box = "card px-4 py-3";
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 sm:gap-3">
      <p className="kicker !text-ink-2">One evidence signal, start to finish</p>
      <div className={box}>
        <p className="text-xs text-muted">Publication</p>
        <p className="font-semibold text-ink">{src.title}</p>
      </div>
      <Arrow />
      <div className={box}>
        <p className="text-xs text-muted">Evidence quote</p>
        <p className="font-display text-lg italic text-ink">&ldquo;{EXAMPLE.quote}&rdquo;</p>
      </div>
      <Arrow />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className={box}>
          <p className="text-xs text-muted">Skill</p>
          <p className="font-semibold text-ink">{EXAMPLE.skill}</p>
          <p className="text-xs text-ink-2">{SECTORS[EXAMPLE.sector].label}</p>
        </div>
        <div className={box}>
          <p className="text-xs text-muted">Direction</p>
          <p className="font-semibold text-ink">{DIRECTION_LABELS[EXAMPLE.direction]}</p>
          <p className="text-xs text-ink-2">in the {SCENARIOS[EXAMPLE.scenario].short} future</p>
        </div>
      </div>
      <Arrow />
      <div className={`${box} transition-colors duration-500 ${emphasis === "weights" ? "border-maroon bg-maroon-soft" : ""}`}>
        <p className="text-xs text-muted">Weight of this signal</p>
        <p className="tabular mt-0.5 text-sm text-ink sm:text-base">
          <b>+{EXAMPLE.demandScore}</b> demand × <b>{EXAMPLE.qualityWeight}</b> source quality × <b>{EXAMPLE.scenarioWeight}</b> relevance to
          this future = <b className="text-maroon">{fmtScore(EXAMPLE.weightedScore)}</b>
        </p>
        {emphasis === "weights" ? (
          <p className="mt-1.5 text-xs text-ink-2">
            Demand: +2 strong increase … −2 strong decrease. Quality: 1.5 high, 1.0 medium, 0.5 lower. Relevance: 0–1, set per source and
            future.
          </p>
        ) : null}
      </div>
    </div>
  );
}
const Arrow = () => (
  <span className="mx-auto block h-3 w-px bg-ink/30" aria-hidden="true" />
);

function TopSkills({ scenario, setScenario }: { scenario: ScenarioId; setScenario: (s: ScenarioId) => void }) {
  const rows = summary.topWeights[scenario];
  const s = SCENARIOS[scenario];
  return (
    <ChartFrame
      title={`In the ${s.short} future, ${lowerFirst(rows[0].skill)} matters most`}
      howTo={
        <>
          Top 15 skills by <Term k="importance">importance within this future</Term> (1 = the most important skill). Pick a future:
        </>
      }
      legend={
        <div role="group" aria-label="Choose a future" className="flex flex-wrap gap-1.5">
          {SCENARIO_IDS.map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={id === scenario} onClick={() => setScenario(id)}>
              <span className="h-2 w-2 rounded-full" style={{ background: SCENARIOS[id].color }} aria-hidden="true" />
              {SCENARIOS[id].short}
            </button>
          ))}
        </div>
      }
      source={SRC.weights}
      explore={{ href: `/explore/?view=model&f=${scenario}`, label: "Model detail" }}
    >
      <div className="h-full overflow-y-auto pr-1">
        <HBars
          dense
          ariaLabel={`Top skills in the ${s.short} future`}
          rows={rows.map((r) => ({
            key: r.skillKey,
            label: (
              <>
                {r.skill} <span className="text-[0.7rem] text-muted">· {SECTORS[r.sector].short}</span>
              </>
            ),
            value: r.weight,
            color: s.color,
          }))}
          max={1}
          format={fmtScore}
          labelWidth="minmax(130px, 48%)"
        />
      </div>
    </ChartFrame>
  );
}

export function Ch3Strategy() {
  const { openSource } = useSourceDrawer();
  const [chosen, setChosen] = useState<ScenarioId | null>(null);
  const groupSignals = (g: PublisherGroup) => sources.filter((s) => s.group === g).reduce((a, s) => a + s.signals, 0);
  const c = summary.counts;

  return (
    <Chapter id="strategy">
      <Scrolly
        label="What the strategy asks for"
        side="left"
        graphic={(step) => {
          if (step <= 1)
            return (
              <ChartFrame
                title={step === 0 ? "33 source records, from Qatar's own plans to global banks" : "No single kind of publisher dominates the evidence"}
                howTo="Each tile is one source record. Tap a tile to read its evidence quotes."
                legend={<LibraryLegend />}
                source={SRC.signals}
                explore={{ href: "/sources/", label: "All sources" }}
              >
                <SourceLibrary sources={sources} onOpen={(id) => openSource(id)} highlight={step === 1 ? (s) => s.group === "gov" : undefined} />
              </ChartFrame>
            );
          if (step <= 3) return <SignalFlow emphasis={step === 3 ? "weights" : "flow"} />;
          return <TopSkills scenario={chosen ?? (step >= 5 ? "S4" : "S1")} setScenario={setChosen} />;
        }}
        steps={[
          <p key="0">
            The strategy side of the analysis is a library of <b className="text-ink">{c.sourceRecords} source records</b>: national strategies,
            Qatar Foundation plans, international organisations and private-sector research. Two pairs share a title, so they cover {c.distinctTitles}{" "}
            distinct documents.
          </p>,
          <p key="1">
            The evidence is balanced. Qatar&rsquo;s government publications supply {groupSignals("gov")} signals, international organisations{" "}
            {groupSignals("intl")}, consultancies, banks and think tanks {groupSignals("private")}, and Qatar Foundation entities {groupSignals("qf")}.
          </p>,
          <p key="2">
            Each publication was read for statements about skills. Every statement became an <Term k="signal">evidence signal</Term>: the skill it
            points to, whether demand will rise or fall, and (for {c.signals - c.signalsWithoutQuote} of them) the quote it rests on. There are{" "}
            <b className="text-ink">{c.signals}</b> in all.
          </p>,
          <p key="3">
            Not all evidence counts equally. A signal&rsquo;s weight is <b className="text-ink">how strong the claim is, times how reliable the source is, times how relevant
            it is to that future</b>.
          </p>,
          <p key="4">
            Add the weighted signals up and each future gets its own ranking. In the baseline <b className="text-ink">Diversification</b> future, digital
            transformation leads, followed by data analytics &amp; AI and fintech.
          </p>,
          <p key="5">
            The list changes with the future. Carbon management and LNG operations top the Hydrocarbon future, and AI development leads the Knowledge
            economy. Use the buttons to compare.
          </p>,
        ]}
      />
    </Chapter>
  );
}
