"use client";

import Link from "next/link";
import { getGap, summary } from "@/lib/data";
import { fmtShortfall } from "@/lib/format";
import { SCENARIOS, SCENARIO_IDS, SECTORS } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { Heatmap, HeatmapLegend } from "@/components/charts/Heatmap";
import { Reveal } from "@/components/ui/Reveal";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";

const sectorOrder = summary.bySector.map((s) => s.sector);
const overall = Object.fromEntries(summary.bySector.map((s) => [s.sector, s.avg]));
const tech = summary.matrix.filter((c) => c.sector === "technology_digital");
const techBehind = tech.filter((c) => c.avg !== null && c.avg > 0.05).length;
const techLeads = SCENARIO_IDS.filter((f) => {
  const col = summary.matrix.filter((c) => c.scenario === f && c.avg !== null);
  const t = col.find((c) => c.sector === "technology_digital");
  return t && t.avg === Math.max(...col.map((c) => c.avg!));
}).length;
const filled = summary.matrix.filter((c) => c.avg !== null).length;

export function Ch6Matrix() {
  const covered = summary.overSupplied.slice(0, 5).map(getGap);
  return (
    <Chapter id="where" tone="tint">
      <Reveal>
        <ChartFrame
          title="Technology & Digital has the largest shortfall overall; Tourism and Construction are roughly in balance"
          howTo={
            <>
              Average <Term k="shortfall">shortfall</Term> across the skills in each sector and future. Rows are sorted by the all-futures average.
              Only {filled} of 40 cells have evidence. Click a cell to see its skills.
            </>
          }
          legend={<HeatmapLegend />}
          source={SRC.gap}
          explore={{ href: "/explore/?view=matrix", label: "Matrix with filters" }}
        >
          <Heatmap
            cells={summary.matrix}
            sectors={sectorOrder}
            scenarios={[...SCENARIO_IDS]}
            overall={overall}
            linkFor={(s, f) => `/explore/?view=ranking&f=${f}&sec=${s}`}
          />
        </ChartFrame>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <Reveal className="prose-story">
          <p>
            Technology &amp; Digital is behind in <b className="text-ink">{techBehind} of the 5 futures</b> and has the single biggest gap in{" "}
            {techLeads} of them. The exception is the Regional hub future, where its only signal (cybersecurity research) is roughly in balance with
            hiring.
          </p>
          <p>
            Healthcare and Energy &amp; LNG follow. Tourism (average {fmtShortfall(overall.tourism_hospitality)}) and Construction (
            {fmtShortfall(overall.construction_real_estate)}) are close to zero on average: in several of their skills, employers already hire more
            than the strategies emphasise.
          </p>
          <p className="text-sm text-muted">
            Note that the {SCENARIOS.S4.short} and {SCENARIOS.S5.short} columns rest on 18 signals each, so a single skill can move a whole cell.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card p-5">
            <p className="kicker !text-slate">Already covered by the market</p>
            <p className="mt-1 text-sm text-ink-2">
              Employers hire for these more than the strategies emphasise. That is not a problem; it means no intervention is needed.
            </p>
            <ul className="mt-4 divide-y divide-rule">
              {covered.map((g) => (
                <li key={g.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-ink">{g.skill}</span>{" "}
                    <span className="text-xs text-muted">
                      · {SECTORS[g.sector].short} · {SCENARIOS[g.scenario].short}
                    </span>
                  </span>
                  <span className="tabular font-semibold text-slate">{fmtShortfall(g.shortfall)}</span>
                </li>
              ))}
            </ul>
            <Link href="/explore/?view=ranking&sort=asc" className="link mt-3 inline-block text-sm">
              All {summary.counts.alignedOrCovered} aligned or covered rows →
            </Link>
          </div>
        </Reveal>
      </div>
    </Chapter>
  );
}
