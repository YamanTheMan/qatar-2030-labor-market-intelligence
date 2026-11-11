"use client";

import Link from "next/link";
import { getGap, summary } from "@/lib/data";
import { shortfallFill } from "@/lib/colors";
import { fmtShortfall, listJoin, lowerFirst } from "@/lib/format";
import { FAMILIES, FAMILY_IDS, SCENARIOS, SCENARIO_IDS, SECTORS, type ScenarioId } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { Pips, PipsLegend } from "@/components/charts/Pips";
import { Reveal } from "@/components/ui/Reveal";
import { Chapter } from "./Chapter";
import { skillHref } from "@/lib/recs";

const bets = summary.safeBets;
const maxMean = Math.max(...bets.map((b) => b.meanShortfall));
export const TOP3 = bets.slice(0, 3);

const famRows = FAMILY_IDS.filter((f) => f !== "other").map((f) => {
  const cells = Object.fromEntries(
    SCENARIO_IDS.map((s) => {
      const c = summary.familyByScenario.find((x) => x.family === f && x.scenario === s)!;
      return [s, c.rows === 0 ? null : c.shortfalls > 0 ? (c.max ?? 0) : (c.max ?? 0)];
    }),
  ) as Record<ScenarioId, number | null>;
  const shortIn = SCENARIO_IDS.filter((s) => (summary.familyByScenario.find((x) => x.family === f && x.scenario === s)?.shortfalls ?? 0) > 0).length;
  return { f, cells, shortIn };
});

export function Ch7SafeBets() {
  const digital = famRows.find((r) => r.f === "digital")!;
  return (
    <Chapter id="safe-bets">
      <div className="prose-story mb-10 max-w-2xl">
        <p>
          A skill that is short in only one future is a bet on that future. A skill that is short in several is needed almost whichever way 2030
          goes. The data holds a surprise here: <b className="text-ink">no single skill is short in all five futures</b>, or even in four. Partly that
          is coverage. Three futures rest on 18–27 signals, and each uses its own vocabulary of skills.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <Reveal>
          <ChartFrame
            title={`Nine skills are short in three futures. The strongest: ${listJoin(TOP3.map((t) => lowerFirst(t.skill)))}`}
            howTo="Ranked by average shortfall across the futures where the skill appears. Pips show each future."
            legend={<PipsLegend />}
            source={SRC.gap}
            explore={{ href: "/explore/?view=ranking&robust=3", label: "Robust skills" }}
          >
            <ol className="divide-y divide-rule">
              {bets.map((b, i) => (
                <li key={b.skillKey}>
                  <Link href={skillHref(b.skillKey)} className="grid grid-cols-[1.4rem_1fr_auto] items-center gap-x-3 gap-y-1 py-2.5 hover:bg-paper-2/60 sm:grid-cols-[1.4rem_1fr_auto_8rem]">
                    <span className="tabular text-sm text-muted">{i + 1}</span>
                    <span>
                      <span className="block text-[0.95rem] font-semibold leading-snug text-ink">{b.skill}</span>
                      <span className="text-xs text-muted">{b.sectors.map((s) => SECTORS[s].label).join(", ")}</span>
                    </span>
                    <Pips values={b.byScenario} />
                    <span className="col-span-3 flex items-center gap-2 sm:col-span-1">
                      <span className="h-2.5 flex-1 rounded-full bg-paper-2">
                        <span className="block h-full rounded-full" style={{ width: `${(b.meanShortfall / maxMean) * 100}%`, background: shortfallFill(b.meanShortfall + 0.1) }} />
                      </span>
                      <span className="tabular w-9 text-right text-xs text-ink-2">{fmtShortfall(b.meanShortfall)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </ChartFrame>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartFrame
            title={`Zoom out to skill families and one is short in all ${digital.shortIn} futures: digital, data & AI`}
            howTo="Each family groups related skills by a keyword rule (see methodology). A filled pip means at least one skill in the family is short in that future."
            source={SRC.gap}
            explore={{ href: "/methodology/#families", label: "Family rule" }}
          >
            <ul className="divide-y divide-rule">
              {famRows.map((r) => (
                <li key={r.f} className={`flex items-center justify-between gap-3 py-2.5 ${r.f === "digital" ? "font-semibold" : ""}`}>
                  <span className="text-[0.95rem] text-ink">{FAMILIES[r.f].label}</span>
                  <span className="flex items-center gap-2">
                    <Pips values={r.cells} />
                    <span className="tabular w-8 text-right text-xs text-ink-2">{r.shortIn}/5</span>
                  </span>
                </li>
              ))}
            </ul>
          </ChartFrame>
        </Reveal>
      </div>

      <Reveal className="mt-16">
        <h3 className="display text-2xl text-ink sm:text-[1.7rem]">Bets on one future</h3>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          The largest shortfalls that appear in only one future. Worth preparing for if that future starts to arrive, but not before.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summary.scenarioSpecific.map((sp) => {
            const S = SCENARIOS[sp.scenario];
            return (
              <div key={sp.scenario} className="card overflow-hidden">
                <div className="h-1" style={{ background: S.color }} aria-hidden="true" />
                <div className="p-4">
                  <p className="text-sm font-semibold" style={{ color: S.ink }}>
                    {S.short}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {sp.rowIds.map((id) => {
                      const g = getGap(id);
                      return (
                        <li key={id} className="text-sm leading-snug">
                          <Link href={skillHref(g.skillKey)} className="hover:text-maroon">
                            <span className="font-medium text-ink">{g.skill}</span>{" "}
                            <span className="tabular text-xs text-maroon">{fmtShortfall(g.shortfall)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </Chapter>
  );
}
