"use client";

import { summary } from "@/lib/data";
import { fmtInt, fmtPct } from "@/lib/format";
import { SECTORS } from "@/lib/meta";
import { ChartFrame, SRC } from "@/components/ui/ChartFrame";
import { HBars } from "@/components/charts/HBars";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";
import { Scrolly } from "./Scrolly";

const P = summary.postings;
const pick = (id: string) => P.byFamily.find((f) => f.family === id)!;
const hc = P.bySector.find((s) => s.sector === "healthcare")!;
const tech = P.bySector.find((s) => s.sector === "technology_digital")!;
const edu = P.bySector.find((s) => s.sector === "education")!;

function SectorChart({ step }: { step: number }) {
  return (
    <ChartFrame
      title={`Healthcare employers post ${fmtPct(hc.share)} of classified job ads`}
      howTo={`Number of classified postings by employer sector (${fmtInt(P.total)} postings shown).`}
      source={SRC.postings}
      explore={{ href: "/explore/?view=tables&t=postings", label: "Posting data" }}
    >
      <HBars
        ariaLabel="Job postings by sector"
        rows={P.bySector.map((s) => ({
          key: s.sector,
          label: SECTORS[s.sector].label,
          value: s.count,
          color: SECTORS[s.sector].color,
          dim: step === 1 && !["healthcare", "technology_digital"].includes(s.sector),
        }))}
        format={(v) => fmtInt(v)}
        labelWidth="minmax(120px, 38%)"
      />
    </ChartFrame>
  );
}

function FunctionChart({ step }: { step: number }) {
  const r = pick("research");
  return (
    <ChartFrame
      title={step >= 3 ? `Research roles are fewer than 1 in 100 job ads (${r.count} of ${fmtInt(P.total)})` : "Management, IT and sales roles fill most job ads"}
      howTo="Classified postings grouped by job function (143 raw function labels in 12 families)."
      source={SRC.postings}
      explore={{ href: "/explore/?view=tables&t=postings", label: "All 143 functions" }}
    >
      <HBars
        dense
        ariaLabel="Job postings by job function"
        rows={P.byFamily.map((f) => ({
          key: f.family,
          label: f.label,
          value: f.count,
          color: f.family === "research" || f.family === "health" ? "#8A1538" : "#6E685D",
          dim: step >= 3 && !["research", "health"].includes(f.family),
          note: undefined,
        }))}
        format={(v) => `${fmtInt(v)} · ${fmtPct(v / P.total, v / P.total < 0.05 ? 1 : 0)}`}
        labelWidth="minmax(150px, 52%)"
      />
    </ChartFrame>
  );
}

export function Ch4Market() {
  return (
    <Chapter id="market" tone="tint">
      <Scrolly
        label="What employers are hiring for today"
        graphic={(s) => (s <= 1 ? <SectorChart step={s} /> : <FunctionChart step={s} />)}
        steps={[
          <p key="0">
            The other side of the comparison is the job market. The team analysed <b className="text-ink">{fmtInt(summary.counts.postingsAnalysed)}</b> Qatar
            job postings. Of these, <b className="text-ink">{fmtInt(P.total)}</b> were classified to a sector and job function. Those are what we show here.
          </p>,
          <p key="1">
            Healthcare employers post {fmtInt(hc.count)} of them ({fmtPct(hc.share)}). Technology firms post {fmtInt(tech.count)} ({fmtPct(tech.share)}).
            Education posts the fewest: {fmtInt(edu.count)}.
          </p>,
          <p key="2">
            But <i>who</i> is hiring is not the same as <i>what for</i>. By job function, {pick("management").label.toLowerCase()} leads with {fmtPct(pick("management").share)},
            then IT &amp; digital ({fmtPct(pick("it").share)}) and sales &amp; business development ({fmtPct(pick("sales").share)}).
          </p>,
          <p key="3">
            Two slices are thin. Clinical roles are {fmtPct(pick("health").share, 1)} of ads, even with healthcare dominating the employer list, and
            research &amp; science roles are {fmtPct(pick("research").share, 1)}. How often ads ask for each skill is the{" "}
            <Term k="market">market hiring</Term> side of the gap.
          </p>,
        ]}
      />
    </Chapter>
  );
}
