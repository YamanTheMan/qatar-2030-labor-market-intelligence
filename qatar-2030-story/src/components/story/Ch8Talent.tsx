"use client";

import { C } from "@/lib/colors";
import { ctx, getGap, summary } from "@/lib/data";
import { fmtInt, fmtPct, fmtShortfall } from "@/lib/format";
import { SCENARIOS, SECTORS } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { HBars } from "@/components/charts/HBars";
import { Waffle } from "@/components/charts/Waffle";
import { CountUp } from "@/components/ui/CountUp";
import { Footnote } from "@/components/ui/Footnote";
import { Reveal } from "@/components/ui/Reveal";
import { LazyMount } from "@/components/ui/LazyMount";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";
import { skillHref } from "@/lib/recs";
import { useRouter } from "next/navigation";

const L = summary.priorityLens;

export function Ch8Talent() {
  const router = useRouter();
  const top = L.top.map(getGap);
  const placed = Number(ctx.placed?.value.replace(/,/g, "") ?? 0);
  const goal = Number(ctx.molStrategy?.value.replace(/,/g, "") ?? 0);
  const cells = Array.from({ length: L.shortfalls }, (_, i) => ({ fill: i < L.highShortfalls ? C.gold : "#D9D2C4" }));
  return (
    <Chapter id="talent" tone="tint">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <ChartFrame
            title={`${fmtPct(L.share)} of shortfalls are a priority for Qatari talent`}
            howTo={
              <>
                Each square is one of the {L.shortfalls} shortfalls. Gold squares are flagged as a{" "}
                <Term k="priority">priority for Qatari talent</Term> by the publications behind them.
              </>
            }
            source={SRC.gap}
            explore={{ href: "/explore/?view=ranking&p=high", label: "High-priority shortfalls" }}
          >
            <div className="flex items-end gap-5">
              <p className="display text-6xl text-gold-ink sm:text-7xl">
                <CountUp to={Math.round(L.share * 100)} suffix="%" />
              </p>
              <p className="pb-2 text-sm text-ink-2">
                {L.highShortfalls} of {L.shortfalls} shortfalls
              </p>
            </div>
            <div className="mt-4 h-[230px] sm:h-[260px]">
              <LazyMount className="h-full">
                <Waffle cells={cells} cols={16} maxCell={16} label={`${L.highShortfalls} of ${L.shortfalls} shortfalls are high priority for Qatari talent`} />
              </LazyMount>
            </div>
          </ChartFrame>
        </Reveal>
        <Reveal delay={0.1}>
          <ChartFrame
            title={`${top.filter((g) => g.family === "digital").length} of the ${top.length} biggest high-priority shortfalls are digital, data or AI skills`}
            howTo="The ten largest shortfalls flagged as a priority for Qatari talent (one row per skill, its largest value). Click a skill for detail."
            source={SRC.gap}
            explore={{ href: "/explore/?view=ranking&p=high", label: "All of them" }}
          >
            <HBars
              ariaLabel="Top high-priority shortfalls"
              rows={top.map((g) => ({
                key: g.id,
                label: (
                  <>
                    {g.skill}
                    <span className="block text-[0.7rem] text-muted">
                      {SECTORS[g.sector].short} · {SCENARIOS[g.scenario].short}
                    </span>
                  </>
                ),
                value: g.shortfall,
                color: C.maroon,
                onClick: () => router.push(skillHref(g.skillKey)),
              }))}
              max={1}
              format={(v) => fmtShortfall(v)}
              labelWidth="minmax(140px, 48%)"
            />
          </ChartFrame>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Reveal className="prose-story">
          <p>
            These are the same skills the national targets in Chapter 1 depend on. NDS3 wants <b className="text-ink">20% of working Qataris</b> in private
            and mixed-sector jobs by 2030, up from 17%.
            <Footnote id="nds3Private" /> The Ministry of Labour aims to move {fmtInt(goal)} Qataris into private-sector work.
            <Footnote id="molStrategy" /> Since the 2024 nationalisation law, {fmtInt(placed)} have been placed.
            <Footnote id="placed" />
          </p>
          <p>
            Hiring Qataris into the private sector depends on their having the skills those employers will need. That is why the gold squares matter.
            Part of the shortfall is an <b className="text-ink">information and pathways problem</b>: students and graduates need to see which
            private-sector careers will exist and how to reach them. That is the territory of Qatar Human Capital Manara. Qatar Foundation and the ILO
            began joint policy research on graduate–employer mismatches and national talent retention in December 2025.
            <Footnote id="qfIlo" />
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card p-5">
            <p className="kicker !text-gold-ink">National context</p>
            <p className="mt-1 text-sm font-semibold text-ink">Qataris placed in private-sector jobs vs the 2030 goal</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="display tabular text-4xl text-ink">{fmtInt(placed)}</span>
              <span className="tabular text-sm text-ink-2">of {fmtInt(goal)}</span>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${fmtInt(placed)} of ${fmtInt(goal)}, ${fmtPct(placed / goal)}`}>
              <div className="h-full rounded-full bg-gold" style={{ width: `${(placed / goal) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">
              {fmtPct(placed / goal)} of the way, as of {ctx.placed?.asOf}. Sources: Qatar News Agency (Nov 2024, Feb 2026).
              <Footnote id="placed" />
            </p>
          </div>
        </Reveal>
      </div>
    </Chapter>
  );
}
