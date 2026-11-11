"use client";

import { C } from "@/lib/colors";
import { Footnote } from "@/components/ui/Footnote";
import { Waffle, type WaffleCell } from "@/components/charts/Waffle";
import { Chapter } from "./Chapter";
import { Scrolly } from "./Scrolly";

// Each square = 10,000 people (rounded). Population 3.1m → 310; labour force 2.24m → 224;
// Qataris in labour force 127,477 → 13; Qataris in private sector 10,223 → 1.
const POP = 310;
const LF = 224;
const QAT = 13;

function cellsFor(step: number): WaffleCell[] {
  return Array.from({ length: POP }, (_, i) => {
    const inLF = i < LF;
    const qatari = i < QAT;
    const qPrivate = i === 0;
    if (step === 0) return { fill: "#B9B1A2" };
    if (step === 1) return { fill: inLF ? "#6E685D" : "#E6E0D4" };
    if (step === 2) return { fill: qatari ? C.gold : inLF ? "#9AA9B3" : "#ECE7DD" };
    // step 3+
    if (qPrivate) return { fill: C.maroon, stroke: C.maroonDeep };
    return { fill: qatari ? "#E7D49A" : inLF ? "#C3CDD3" : "#EFEAE1" };
  });
}

const CAPTIONS = [
  { big: "3.1 million", small: "people in Qatar (2023)" },
  { big: "2.24 million", small: "in the labour force, aged 15+ (2024)" },
  { big: "94%", small: "of the labour force is non-Qatari" },
  { big: "1 square", small: "≈ 10,000 Qataris in private-sector jobs" },
];

function Graphic({ step }: { step: number }) {
  const waffleStep = Math.min(step, 3);
  const showWaffle = step <= 3;
  return (
    <div className="relative flex h-full flex-col">
      <div className={`flex h-full flex-col transition-opacity duration-500 ${showWaffle ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!showWaffle}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
          <p>
            <span className="display text-2xl text-ink sm:text-3xl">{CAPTIONS[waffleStep].big}</span>{" "}
            <span className="text-sm text-ink-2">{CAPTIONS[waffleStep].small}</span>
          </p>
          <p className="text-xs text-muted">Each square ≈ 10,000 people · national context</p>
        </div>
        <div className="min-h-0 flex-1">
          <Waffle
            cells={cellsFor(waffleStep)}
            cols={20}
            label="Unit chart: 310 squares for Qatar's population, 224 of them the labour force, 13 Qatari, and 1 Qatari in the private sector"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-hidden="true">
          {waffleStep >= 2 ? (
            <>
              <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px]" style={{ background: C.gold }} /> Qatari workers (≈127,000)</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px] bg-[#9AA9B3]" /> Non-Qatari workers (≈2.1m)</span>
            </>
          ) : null}
          {waffleStep >= 3 ? (
            <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px] bg-maroon" /> Qataris in the private sector (≈10,000)</span>
          ) : null}
        </div>
      </div>

      {/* LNG panel */}
      <div className={`absolute inset-0 flex flex-col justify-center gap-6 transition-opacity duration-500 ${step === 4 ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={step !== 4}>
        <p className="kicker !text-ink-2">LNG production capacity · million tonnes a year · national context</p>
        {[
          { label: "Today", v: 77 },
          { label: "By end-2030", v: 142 },
        ].map((d) => (
          <div key={d.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-ink">{d.label}</span>
              <span className="display tabular text-3xl text-ink">{d.v}</span>
            </div>
            <div className="mt-1 h-9 rounded bg-paper-2">
              <div className="h-full rounded bg-[#6E685D] transition-[width] duration-1000" style={{ width: step === 4 ? `${(d.v / 142) * 100}%` : "0%" }} />
            </div>
          </div>
        ))}
        <p className="text-sm text-ink-2">The North Field expansion nearly doubles output. Gas remains the backbone of exports and state revenue while the plan diversifies around it.</p>
      </div>

      {/* Targets panel */}
      <div className={`absolute inset-0 flex flex-col justify-center transition-opacity duration-500 ${step >= 5 ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={step < 5}>
        <p className="kicker mb-3 !text-ink-2">The state&rsquo;s 2030 targets · national context</p>
        <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {[
            { v: "17% → 20%", l: "Qatari workers in private & mixed sectors (NDS3)", fn: "nds3Private" },
            { v: ">46%", l: "of the workforce in skilled or highly skilled jobs (NDS3)", fn: "nds3Skilled" },
            { v: "≥18%", l: "of graduates in STEM (science, technology, engineering, maths)", fn: "nds3Stem" },
            { v: "2% a year", l: "labour-productivity growth (NDS3)", fn: "nds3Productivity" },
            { v: "16,000", l: "Qataris into private-sector jobs (Ministry of Labour, 2024–30)", fn: "molStrategy" },
            { v: "26,000", l: "new ICT jobs (Digital Agenda 2030)", fn: "digitalAgenda" },
          ].map((t) => (
            <li key={t.l} className="card px-4 py-2.5 sm:py-3">
              <p className="display tabular text-xl text-maroon sm:text-3xl">
                {t.v}
                <Footnote id={t.fn} />
              </p>
              <p className="text-xs leading-snug text-ink-2 sm:text-sm">{t.l}</p>
            </li>
          ))}
        </ul>
        <p className={`display mt-5 text-xl text-ink transition-opacity duration-500 sm:text-2xl ${step >= 6 ? "opacity-100" : "opacity-0"}`}>
          Are employers hiring for that future yet?
        </p>
      </div>
    </div>
  );
}

export function Ch1Country() {
  return (
    <Chapter id="country">
      <Scrolly
        label="The country in one screen"
        graphic={(s) => <Graphic step={s} />}
        steps={[
          <p key="0">
            About <b className="text-ink">3.1 million people</b> live in Qatar.
            <Footnote id="population" n={1} /> Each square in this picture stands for roughly 10,000 of them.
          </p>,
          <p key="1">
            Of those, <b className="text-ink">2.24 million</b> are in the labour force.
            <Footnote id="labourForce" n={2} /> That means people aged 15 and over who are working or looking for work.
          </p>,
          <p key="2">
            <b className="text-ink">94% of workers are non-Qatari</b>, about 17 for every Qatari.
            <Footnote id="nonQatariShare" n={3} /> The national workforce is 127,000 people: the gold squares.
          </p>,
          <p key="3">
            Only about <b className="text-ink">10,000 Qataris</b> work in the private sector, which is 0.6% of its 1.8 million workers.
            <Footnote id="qatarisPrivate" n={4} /> Most Qataris work for government. Qatari women take part in the labour force far
            less than men: 43% against 66%.
            <Footnote id="womenLfpr" n={5} />
          </p>,
          <p key="4">
            The economy still leans on gas, and gas is growing. <b className="text-ink">LNG (liquefied natural gas)</b> capacity
            rises from 77 to 142 million tonnes a year by 2030.
            <Footnote id="lng" n={6} />
          </p>,
          <p key="5">
            The state&rsquo;s answer is the <b className="text-ink">Third National Development Strategy (NDS3, 2024–2030)</b>,
            which aims to move more Qataris into private-sector careers and the whole workforce up the skills ladder.
            <Footnote id="nds3Private" n={7} />
            <Footnote id="molStrategy" n={8} />
          </p>,
          <p key="6">
            Those targets describe the workforce Qatar wants by 2030. The rest of this story asks one question:{" "}
            <b className="text-ink">are employers hiring for that future yet?</b>
          </p>,
        ]}
      />
    </Chapter>
  );
}
