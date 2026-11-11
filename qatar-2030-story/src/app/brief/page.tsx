import type { Metadata } from "next";
import Link from "next/link";
import { getGap, sourceById, summary } from "@/lib/data";
import { shortfallFill, shortfallText } from "@/lib/colors";
import { fmtPct, fmtShortfall } from "@/lib/format";
import { MARKET_WEIGHT, SCENARIOS, SCENARIO_IDS, SECTORS } from "@/lib/meta";
import { Pips } from "@/components/charts/Pips";
import { PrintButton } from "@/components/PrintButton";
import { REC_TYPE } from "@/lib/recs";

export const metadata: Metadata = {
  title: "Executive brief",
  description: "Two-page executive brief: the skill shortfalls between Qatar's 2030 strategy and today's hiring, and what Manara should do first.",
};

const c = summary.counts;

function Sec({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="avoid-break">
      <h2 className="display mb-2 flex items-baseline gap-2 text-[1.15rem] text-ink">
        <span className="text-xs font-sans font-semibold text-maroon">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function BriefPage() {
  const top = summary.top20.slice(0, 10).map(getGap);
  const sectors = summary.bySector.map((s) => s.sector);
  const techAvg = summary.bySector[0];
  return (
    <div className="bg-paper-2/60 py-8 print:bg-white print:py-0">
      <div className="no-print wrap mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/story/#manara" className="text-sm text-ink-2 hover:text-maroon">
          ← Back to the story
        </Link>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-[210mm] space-y-6 bg-white p-[12mm] text-[10.5pt] leading-snug text-ink shadow-lg print:max-w-none print:p-0 print:shadow-none">
        {/* Page 1 */}
        <header className="border-b-2 border-maroon pb-3">
          <p className="text-[8pt] font-semibold uppercase tracking-widest text-maroon">Executive brief · Qatar Human Capital Manara</p>
          <h1 className="display mt-1 text-[22pt] leading-tight">Qatar is building a 2030 economy. Is it hiring for it?</h1>
          <p className="mt-1.5 text-[9.5pt] text-ink-2">
            CMU Tepper MSBA Capstone (2025) for Qatar Foundation&rsquo;s Higher Education Division. {c.sourceRecords} source records ({c.distinctTitles}{" "}
            distinct documents) · {c.signals} evidence signals · {c.postingsClassified.toLocaleString("en-GB")} classified job postings · 5 futures · 8 sectors.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { v: `${c.shortfalls} of ${c.rows}`, l: "future × sector × skill combinations where strategy asks for more than employers hire" },
            { v: fmtShortfall(techAvg.avg), l: `average shortfall in ${SECTORS[techAvg.sector].label}, the highest of 8 sectors` },
            { v: fmtPct(summary.priorityLens.share), l: "of shortfalls are flagged a priority for Qatari talent" },
          ].map((k) => (
            <div key={k.l} className="rounded-md border border-rule p-2.5">
              <p className="display text-[17pt] text-maroon">{k.v}</p>
              <p className="text-[8pt] text-ink-2">{k.l}</p>
            </div>
          ))}
        </div>

        <Sec n={5} title="The gap: digital, data and AI skills lead the shortfalls">
          <p className="text-[9pt] text-ink-2">
            <b>Shortfall</b> = strategic demand (0–1, from the publications) − {MARKET_WEIGHT} × share of job ads asking for the skill. Above 0 means
            hiring lags the strategy. It is a score, not a percentage. The median shortfall is {fmtShortfall(summary.distribution.median)}, and a handful
            are extreme.
          </p>
          <table className="mt-2 w-full text-[8.5pt]">
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th className="py-1 font-medium">Largest shortfalls</th>
                <th className="py-1 font-medium">Sector</th>
                <th className="py-1 font-medium">Future</th>
                <th className="py-1 text-right font-medium">Shortfall</th>
              </tr>
            </thead>
            <tbody>
              {top.map((g) => (
                <tr key={g.id} className="border-b border-rule/60">
                  <td className="py-0.5 font-medium">{g.skill}</td>
                  <td className="py-0.5">{SECTORS[g.sector].label}</td>
                  <td className="py-0.5">{SCENARIOS[g.scenario].short}</td>
                  <td className="tabular py-0.5 text-right font-semibold text-maroon">{fmtShortfall(g.shortfall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sec>

        <Sec n={6} title="Where it hurts most: Technology & Digital in four of five futures">
          <table className="w-full border-separate border-spacing-[2px] text-[8pt]">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted">Sector</th>
                {SCENARIO_IDS.map((f) => (
                  <th key={f} className="font-semibold" style={{ color: SCENARIOS[f].ink }}>
                    {SCENARIOS[f].short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => (
                <tr key={s}>
                  <th className="pr-1 text-left font-medium">{SECTORS[s].label}</th>
                  {SCENARIO_IDS.map((f) => {
                    const cell = summary.matrix.find((m) => m.sector === s && m.scenario === f)!;
                    return cell.avg === null ? (
                      <td key={f} className="hatch rounded-sm text-center text-[7pt] text-muted">–</td>
                    ) : (
                      <td key={f} className="tabular rounded-sm py-0.5 text-center font-semibold" style={{ background: shortfallFill(cell.avg), color: shortfallText(cell.avg), printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                        {fmtShortfall(cell.avg)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[7.5pt] text-muted">Average shortfall. – = no evidence signal. Knowledge economy and Regional hub rest on 18 signals each.</p>
        </Sec>

        {/* Page 2 */}
        <div className="print-break" />
        <Sec n={7} title="Safe bets: needed in several futures">
          <p className="text-[9pt] text-ink-2">
            No skill is short in all five futures. Nine are short in three, and digital, data &amp; AI skills as a family are short in every future.
          </p>
          <ul className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[8.5pt]">
            {summary.safeBets.map((b) => (
              <li key={b.skillKey} className="flex items-center justify-between gap-2 border-b border-rule/60 py-0.5">
                <span>{b.skill}</span>
                <span className="flex items-center gap-2">
                  <Pips values={b.byScenario} size={9} />
                  <span className="tabular w-8 text-right text-maroon">{fmtShortfall(b.meanShortfall)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Sec>

        <Sec n={8} title="The Qatari talent lens">
          <p className="text-[9pt] text-ink-2">
            {summary.priorityLens.highShortfalls} of {summary.priorityLens.shortfalls} shortfalls ({fmtPct(summary.priorityLens.share)}) are flagged a priority
            for developing Qatari nationals. Context: about 10,000 Qataris work in the private sector (0.6% of its workforce, 2024). NDS3 targets 20% of
            Qatari workers in private and mixed sectors by 2030 (from 17%). 7,861 Qataris had been placed by Feb 2026 against a 16,000 goal. Sources: NPC
            Labour Force Survey 2024; Qatar News Agency (Nov 2024, Feb 2026).
          </p>
        </Sec>

        <Sec n={9} title="What this means for Manara">
          <div className="grid grid-cols-2 gap-2">
            {summary.recommendations.map((r) => (
              <div key={r.skillKey} className="rounded-md border border-rule p-2">
                <p className="text-[7pt] font-semibold uppercase tracking-wider" style={{ color: REC_TYPE[r.type].color }}>
                  {REC_TYPE[r.type].label} · {r.horizonGroup === "now" ? "Next 2–3 years" : "By 2030"}
                </p>
                <p className="text-[9pt] font-semibold leading-snug">{r.action}</p>
                <p className="text-[7.5pt] text-ink-2">
                  Shortfall up to {fmtShortfall(r.maxShortfall)} · {r.shortIn}/5 futures · {r.sources.slice(0, 3).map((id) => sourceById.get(id)?.short).join(", ")}
                  {r.sources.length > 3 ? ` +${r.sources.length - 3}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Sec>
        <footer className="border-t border-rule pt-2 text-[7pt] text-muted">
          Method: shortfall = strategic demand − {MARKET_WEIGHT} × market hiring share, as found in all {c.rows} rows of the pipeline output. Recommendations come
          from a fixed rule: high-priority shortfalls ranked by total shortfall across futures. Full method, caveats and data: the methodology page and
          explorer of this site.
        </footer>
      </div>
    </div>
  );
}
