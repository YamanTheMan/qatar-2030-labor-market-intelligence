import type { Metadata } from "next";
import Link from "next/link";
import { contextFacts, summary } from "@/lib/data";
import { fmtInt } from "@/lib/format";
import { BANDS, FAMILIES, FAMILY_IDS, FUNCTION_FAMILIES, MARKET_WEIGHT, SCENARIOS, SCENARIO_IDS } from "@/lib/meta";
import { GLOSSARY } from "@/lib/glossary";
import contextJson from "@/data/context.json";

export const metadata: Metadata = {
  title: "Methodology & caveats",
  description: "How every number in the Qatar 2030 skills story is computed, the exact formulas, the data caveats, and how to update the data.",
};

const c = summary.counts;
const maxSig = Math.max(...summary.byScenario.map((b) => b.signals));

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="display mt-16 scroll-mt-20 text-3xl text-ink first:mt-0">
      <a href={`#${id}`} className="hover:text-maroon">
        {children}
      </a>
    </h2>
  );
}
function Formula({ children }: { children: React.ReactNode }) {
  return <pre className="mt-3 overflow-x-auto rounded-xl border border-rule bg-card p-4 font-mono text-[0.85rem] leading-relaxed text-ink">{children}</pre>;
}

export default function MethodologyPage() {
  const unverified = (contextJson.facts as { id: string; label: string; verified: boolean; note?: string }[]).filter((f) => !f.verified);
  return (
    <div className="wrap py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1.5 text-sm text-ink-2">
            {[
              ["plain", "In plain words"],
              ["strategy", "Strategy side"],
              ["market", "Market side"],
              ["shortfall", "The shortfall"],
              ["penalty", "Signal-count balance"],
              ["families", "Groupings"],
              ["recommendations", "Recommendations rule"],
              ["caveats", "Data caveats"],
              ["context", "National context"],
              ["update", "Updating the data"],
              ["glossary", "Glossary"],
            ].map(([id, l]) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:text-maroon">
                  {l}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="prose-story max-w-3xl">
          <p className="kicker mb-2">Methodology</p>
          <h1 className="display text-4xl text-ink sm:text-5xl">How the numbers are made</h1>
          <p className="mt-4 text-lg">
            The analytical core of this site is the output of the capstone team&rsquo;s scenario pipeline: seven CSV files in <code>data/</code>. The site
            does no modelling of its own. A build script reads the CSVs, maps codes to plain labels and computes the aggregates the story shows. Every
            figure can be reproduced in the <Link href="/explore/" className="link">explorer</Link>.
          </p>

          <H2 id="plain">In plain words</H2>
          <p>
            We compare two things for every combination of <b>future</b> (5), <b>sector</b> (8) and <b>skill</b> ({c.skills} distinct skills), giving{" "}
            {c.rows} combinations in total:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-2">
            <li>
              <b className="text-ink">Strategic demand</b>: how strongly {c.sourceRecords} source records ({c.distinctTitles} distinct documents), from
              Qatar&rsquo;s national strategies to international organisations and consultancies, say the skill will be needed in that future.
            </li>
            <li>
              <b className="text-ink">Market hiring today</b>: the share of classified Qatar job ads in that sector that ask for the skill.
            </li>
          </ul>
          <p className="mt-3">
            The <b className="text-ink">shortfall</b> is the difference. A positive shortfall means the strategy asks for more than the market is hiring
            for. {c.shortfalls} of {c.rows} combinations are positive.
          </p>

          <H2 id="strategy">Strategy side: from publication to strategic demand</H2>
          <p>
            Each publication was read for statements about skill demand. Each statement became an <b>evidence signal</b> ({c.signals} in all), with a
            quote, a skill, a sector, a direction, and a relevance weight for each future.
          </p>
          <Formula>
            {`signal weight  = demand score × source quality × relevance to the future

demand score   : strong increase +2 · moderate increase +1 · stable 0
                 moderate decrease −1 · strong decrease −2
source quality : high 1.5 · medium 1.0 · lower 0.5
relevance      : 0–1, set per source and future by the pipeline`}
          </Formula>
          <p className="mt-4">The signal weights are then summed per skill and future, and scaled.</p>
          <Formula>
            {`weighted sum(skill, sector, future) = Σ signal weights
strategic demand = weighted sum ÷ largest weighted sum in that future
                   × signal-count balance(future)          (0–1)`}
          </Formula>
          <p className="mt-4">
            <b>Importance within a future</b> (Chapter 3) is the same idea per skill, from <code>scenario_skill_weights.csv</code>. The pipeline multiplies
            the weighted sum by the balance factor, then divides by the largest value in that future, so the top skill in every future scores 1.
          </p>

          <H2 id="market">Market side: job postings</H2>
          <p>
            The team analysed {fmtInt(c.postingsAnalysed)} Qatar job postings (a methodology statement from the team; the raw postings are not part of this
            repository). The posting-side file in <code>data/</code> covers <b>{fmtInt(c.postingsClassified)} postings</b> classified to a sector and job
            function. The original pipeline assigned each posting to one of 8 sectors with a five-layer classifier: industry tags, then LinkedIn industry,
            then job function, then job title, then SOC codes. Unmatched postings became <i>Cross-sector</i>.
          </p>
          <p className="mt-3">
            <b>Market hiring today</b> (<code>posting_freq</code>) is the share of postings in the sector that mention the skill. It is mostly small:
            the largest is 0.17.
          </p>

          <H2 id="shortfall">The shortfall</H2>
          <Formula>{`shortfall = strategic demand − ${MARKET_WEIGHT} × market hiring share        (−1 to +1)`}</Formula>
          <p className="mt-4">
            <b>Important.</b> The original dashboard described the gap as a plain difference. In every one of the {c.rows} rows of{" "}
            <code>scenario_gap_analysis.csv</code>, however, <code>gap_score</code> equals <code>calibration_score − {MARKET_WEIGHT} × posting_freq</code>{" "}
            (the largest deviation is 0.00005). We report the formula the data actually follows. This should be confirmed against the pipeline notebook (
            <code>Qatar_Scenario_Pipeline_v15.ipynb</code>). Doubling the market share makes the measure more conservative: a skill needs stronger
            strategic support before it registers as a shortfall.
          </p>
          <p className="mt-3">
            The two inputs are on very different scales: demand runs from 0 to 1 and the hiring share mostly from 0 to 0.17. So the shortfall is a{" "}
            <b>score, not a percentage</b>, and it is best read as a ranking.
          </p>
          <p className="mt-3">For display, we group values into four bands, using the same thresholds everywhere:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
            {BANDS.map((b) => (
              <li key={b.id}>
                <b className="text-ink">{b.label}</b>: {b.min === -Infinity ? "below −0.05" : `${b.min.toFixed(2)} and above`}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            The pipeline&rsquo;s own label (&ldquo;Strong increase&rdquo; ≥ 0.6, &ldquo;Moderate increase&rdquo; 0.2–0.6, &ldquo;Stable&rdquo; otherwise) is
            kept in the explorer. Under it, only {summary.pipelineLabels["Strong increase"]} rows are &ldquo;strong&rdquo;, which hides most of the structure.
          </p>

          <H2 id="penalty">Signal-count balance</H2>
          <p>Futures rest on very different amounts of evidence. To stop a thinly evidenced future from producing outsized scores, the pipeline applies:</p>
          <Formula>{`balance(future) = √( signals in future ÷ signals in best-evidenced future )`}</Formula>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs text-muted">
                  <th className="py-2 font-medium">Future</th>
                  <th className="py-2 text-right font-medium">Signals</th>
                  <th className="py-2 text-right font-medium">Skill rows</th>
                  <th className="py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.byScenario.map((b) => (
                  <tr key={b.scenario} className="border-b border-rule/60">
                    <td className="py-1.5" style={{ color: SCENARIOS[b.scenario].ink }}>
                      {SCENARIOS[b.scenario].name}
                    </td>
                    <td className="tabular py-1.5 text-right">{b.signals}</td>
                    <td className="tabular py-1.5 text-right">{b.rows}</td>
                    <td className="tabular py-1.5 text-right">
                      √({b.signals}/{maxSig}) = {b.penalty.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="families">Groupings used by the story</H2>
          <p>
            <b>Skill families</b> (Chapter 7) group related skill categories with a keyword rule. The first match wins, in this order:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink-2">
            {FAMILY_IDS.map((f) => (
              <li key={f}>
                <b className="text-ink">{FAMILIES[f].label}</b>: <code className="text-xs">{FAMILIES[f].pattern.source}</code>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <b>Job-function families</b> (Chapter 4) group the {c.jobFunctions} raw job-function labels the same way:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink-2">
            {FUNCTION_FAMILIES.map((f) => (
              <li key={f.id}>
                <b className="text-ink">{f.label}</b>: <code className="text-xs">{f.pattern.source}</code>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <b>Safe bets</b> are skills with a positive shortfall in at least three futures. No skill reaches four, as noted in Chapter 7.
          </p>

          <H2 id="recommendations">How the recommendations are derived</H2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-2">
            <li>Candidates are skills with at least one positive shortfall flagged high priority for Qatari talent.</li>
            <li>Candidates are ranked by the sum of their positive shortfalls across futures, which rewards size and robustness together.</li>
            <li>
              Each gets a type by an ordered keyword rule. <i>Research capacity</i>: research, R&amp;D or innovation. <i>Curriculum change</i>: the
              Education sector, pedagogy or curriculum. <i>Bridge &amp; upskilling</i>: literacy, reskilling, leadership, management or training.
              Otherwise, <i>new specialist programme</i>.
            </li>
            <li>We keep the top 4 programmes, 2 curriculum, 2 bridge and 2 research skills, so the list is not all one type.</li>
            <li>
              Horizon is &ldquo;Next 2–3 years&rdquo; if any of the skill&rsquo;s shortfall rows is near-term or &ldquo;now and through 2030&rdquo;, and
              &ldquo;By 2030&rdquo; otherwise.
            </li>
            <li>The action sentence comes from a fixed template per type. Nothing is hand-written per skill.</li>
          </ol>

          <H2 id="caveats">Data caveats</H2>
          <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-ink-2">
            <li>
              <b className="text-ink">Sources: {c.sourceRecords} records, not 41.</b> The earlier dashboard and README said 41. The data has{" "}
              {c.sourceRecords} unique source IDs. Two pairs share a title: <code>QNDS2</code>/<code>QNDS3</code> (both the Third National
              Development Strategy) and <code>QF_EDU_STRATEGY</code>/<code>QF_EDU_WEBSITE</code> (both &ldquo;Education for a New Era&rdquo;). That makes{" "}
              {c.distinctTitles} distinct documents. Both records of each pair are kept, because the pipeline weights them separately.
            </li>
            <li>
              <b className="text-ink">Postings: {fmtInt(c.postingsClassified)} shown, {fmtInt(c.postingsAnalysed)} analysed.</b> The posting-side file sums
              to {fmtInt(c.postingsClassified)}. The {fmtInt(c.postingsAnalysed)} figure is the team&rsquo;s statement of postings analysed.
            </li>
            <li>
              <b className="text-ink">The ×{MARKET_WEIGHT} in the shortfall</b>, described above.
            </li>
            <li>
              <b className="text-ink">The suggested response is a rule, not a forecast.</b> Each skill area is labelled recruit internationally, reskill
              the current workforce, build Qatari talent, or already in hiring, from its gap, how soon it is needed and whether it is a priority for Qatari
              nationals. It uses no supply data, so it cannot say how many people to hire or train.
            </li>
            <li>
              <b className="text-ink">The map is a reference layer.</b> The data is by future, sector and skill. It has no location or employer columns. The
              dashboard places 17 real economic hubs on the map and links each one to the skills of the sectors it hosts. The organisations named at a hub
              are there for orientation. They are not measured employers, and a hub&rsquo;s figures are not counts of jobs at that site.
            </li>
            <li>
              <b className="text-ink">Uneven evidence across futures.</b> Hydrocarbon, Knowledge economy and Regional hub rest on 27, 18 and 18 signals.
              Only 29 of 40 sector × future cells have any signal. Treat those futures as directional.
            </li>
            <li>
              <b className="text-ink">Skill vocabularies differ by future.</b> Similar skills appear under different names, e.g. &ldquo;digital
              literacy&rdquo;, &ldquo;digital literacy and data skills&rdquo;, &ldquo;digital literacy and automation&rdquo;. That is why no single skill
              is short in more than three futures, and why we add the family view.
            </li>
            <li>
              <b className="text-ink">Some signals have no quote.</b> {c.signalsWithoutQuote} of {c.signals} evidence signals have an empty evidence quote. They are shown with their rationale only.
            </li>
            <li>
              <b className="text-ink">Specific skills</b> are comma- or semicolon-joined in the source files and often repeat. We split, trim and
              de-duplicate them for display.
            </li>
            <li>
              <b className="text-ink">The U.S. historical benchmark</b> (<code>historical_skillasign_0406_2.zip</code>) mentioned in the old README is not
              in the repository, so that view is not rebuilt.
            </li>
          </ol>

          <H2 id="context">National context layer</H2>
          <p>
            A small set of public figures sets the scene in Chapters 1 and 8. These are <b>not</b> outputs of the model. They live in{" "}
            <code>src/data/context.json</code> with their source, link and date, and only figures we could verify are shown.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {contextFacts.map((f) => (
              <li key={f.id}>
                <b className="text-ink">{f.value}</b>: {f.label}.{" "}
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="link">
                  {f.source}
                </a>{" "}
                ({f.asOf}){f.note ? <span className="block text-xs text-muted">{f.note}</span> : null}
              </li>
            ))}
          </ul>
          {unverified.length ? (
            <p className="mt-4 text-sm text-ink-2">
              Not shown because they could not be verified at build time: {unverified.map((u) => u.label.toLowerCase()).join("; ")}.
            </p>
          ) : null}

          <H2 id="update">Updating the data</H2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-2">
            <li>
              Replace the CSV files in <code>qatar-2030-story/data/</code> with new pipeline outputs, keeping the same file names and columns.
            </li>
            <li>Commit and push. The site rebuilds and redeploys automatically, and the build regenerates every number.</li>
            <li>
              If a new sector, future, publisher or label appears, the build stops with a message naming the missing label in{" "}
              <code>src/lib/meta.ts</code>. This is deliberate: it keeps codes like <code>technology_digital</code> out of the page.
            </li>
          </ol>
          <p className="mt-3">
            Developers can run <code>npm run build:data</code>, then <code>npm test</code>. The tests check row counts, the {c.shortfalls} positive-shortfall
            count, the {c.sourceRecords} source records, the shortfall formula and label completeness.
          </p>

          <H2 id="glossary">Glossary</H2>
          <dl className="mt-3 space-y-4">
            {Object.values(GLOSSARY).map((g) => (
              <div key={g.term}>
                <dt className="font-semibold text-ink">
                  {g.term} <span className="font-arabic text-sm font-normal text-muted" lang="ar" dir="rtl">· {g.termAr}</span>
                </dt>
                <dd className="text-ink-2">
                  {g.def}
                  {g.technical ? <span className="mt-0.5 block font-mono text-xs text-muted">{g.technical}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-sm text-muted">
            Futures: {SCENARIO_IDS.map((s) => SCENARIOS[s].name).join(" · ")}.
          </p>
        </article>
      </div>
    </div>
  );
}
