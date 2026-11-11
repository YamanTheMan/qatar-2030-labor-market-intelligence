"use client";

import { useRouter } from "next/navigation";
import { gaps, getGap, summary } from "@/lib/data";
import { fmtPct, fmtScore, fmtShortfall, lowerFirst } from "@/lib/format";
import { MARKET_WEIGHT } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { ExplainerBars } from "@/components/charts/ExplainerBars";
import { Dumbbell, DumbbellLegend } from "@/components/charts/Dumbbell";
import { Beeswarm } from "@/components/charts/Beeswarm";
import { Reveal } from "@/components/ui/Reveal";
import { LazyMount } from "@/components/ui/LazyMount";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";
import { Scrolly } from "./Scrolly";
import { skillHref } from "@/lib/recs";

const big = getGap(summary.explainer.big);
const covered = getGap(summary.explainer.covered);
const top = summary.top20.map(getGap);
const digitalInTop = top.filter((g) => g.family === "digital").length;
const sectorOrder = summary.bySector.map((s) => s.sector);
const above03 = gaps.filter((g) => g.shortfall > 0.3).length;
const modest = gaps.filter((g) => g.shortfall > 0 && g.shortfall < 0.2).length;


export function Ch5Gap() {
  const router = useRouter();
  return (
    <Chapter id="gap">
      <Scrolly
        label="How the shortfall is measured"
        graphic={(s) =>
          s <= 1 ? (
            <ExplainerBars
              row={big}
              caption={s === 0 ? "Strategy calls for it more strongly than anything else in this future." : "Job ads barely mention it. This is the largest shortfall in the data."}
            />
          ) : (
            <ExplainerBars row={covered} caption="The market already hires for this more than strategy asks. No intervention needed." />
          )
        }
        steps={[
          <p key="0">
            Here is the whole method in one example. Take <b className="text-ink">{lowerFirst(big.skill)}</b> in Technology &amp; Digital, in the
            baseline future. Its <Term k="strategic">strategic demand</Term> is {fmtScore(big.strategic)}: the strongest call in that future.
          </p>,
          <p key="1">
            Yet only {fmtPct(big.market, 1)} of technology job ads ask for it. The model counts that share twice, so the market signal is{" "}
            {fmtScore(MARKET_WEIGHT * big.market)}. Demand minus market gives a <Term k="shortfall">shortfall</Term> of{" "}
            <b className="text-maroon">{fmtShortfall(big.shortfall)}</b>.
          </p>,
          <p key="2">
            Now the opposite case. <b className="text-ink">Project management</b> in Construction scores just {fmtScore(covered.strategic)} on strategy, yet{" "}
            {fmtPct(covered.market)} of construction ads want it. The shortfall is <b className="text-slate">{fmtShortfall(covered.shortfall)}</b>: the market{" "}
            <Term k="covered">already covers</Term> it.
          </p>,
        ]}
      />

      <Reveal className="mt-20">
        <ChartFrame
          title={`${digitalInTop} of the 20 largest shortfalls are digital, data or AI skills`}
          howTo="Each row is one skill in one sector and future. The further apart the dots, the bigger the shortfall. Hover, focus or tap a row for detail, and click to open it in the explorer."
          legend={<DumbbellLegend />}
          source={SRC.gap}
          explore={{ href: "/explore/?view=ranking", label: "Full ranking" }}
        >
          <LazyMount minHeight={top.length * 32 + 34}>
            <Dumbbell rows={top} ariaLabel="Top 20 shortfalls, dumbbell chart" onSelect={(g) => router.push(skillHref(g.skillKey))} />
          </LazyMount>
        </ChartFrame>
      </Reveal>

      <Reveal className="mt-20">
        <ChartFrame
          title={`Most shortfalls are modest; only ${above03} of ${gaps.length} exceed 0.30`}
          howTo={
            <>
              Every dot is one future × sector × skill combination ({gaps.length} in all). Darker maroon means a bigger shortfall, and slate means the
              market already covers it. {modest} of the {summary.counts.shortfalls} shortfalls sit below 0.20, and the median is{" "}
              {fmtShortfall(summary.distribution.median)}.
            </>
          }
          source={SRC.gap}
          explore={{ href: "/explore/?view=ranking", label: "Explore every row" }}
        >
          <LazyMount minHeight={620}>
            <Beeswarm rows={gaps} sectorOrder={sectorOrder} ariaLabel={`Beeswarm of all ${gaps.length} shortfall scores by sector`} />
          </LazyMount>
        </ChartFrame>
      </Reveal>
    </Chapter>
  );
}
