"use client";

import Link from "next/link";
import { sourceById, summary } from "@/lib/data";
import { fmtShortfall } from "@/lib/format";
import { SECTORS } from "@/lib/meta";
import type { Recommendation } from "@/lib/types";
import { useSourceDrawer } from "@/components/ui/SourceDrawer";
import { Reveal } from "@/components/ui/Reveal";
import { Term } from "@/components/ui/Term";
import { Chapter } from "./Chapter";
import { REC_TYPE, skillHref } from "@/lib/recs";


export function ActionCard({ r, compact = false }: { r: Recommendation; compact?: boolean }) {
  const { openSource } = useSourceDrawer();
  const t = REC_TYPE[r.type];
  return (
    <article className="card avoid-break flex h-full flex-col p-5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.color }}>
        {t.label}
      </p>
      <h4 className="display mt-1.5 text-[1.2rem] leading-snug text-ink">{r.action}</h4>
      <p className="tabular mt-2 text-sm text-ink-2">
        Largest shortfall <b className="text-maroon">{fmtShortfall(r.maxShortfall)}</b> · short in {r.shortIn} of 5 futures ·{" "}
        {r.sectors.map((s) => SECTORS[s].label).join(", ")}
      </p>
      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.sources.slice(0, 6).map((id) => (
            <button key={id} type="button" className="chip !px-2.5 !py-1 !text-[0.72rem] hover:border-maroon" onClick={() => openSource(id, r.skillKey)}>
              {sourceById.get(id)?.short ?? id}
            </button>
          ))}
          {r.sources.length > 6 ? <span className="self-center text-xs text-muted">+{r.sources.length - 6} more</span> : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Backed by: {r.sources.map((id) => sourceById.get(id)?.short ?? id).join(" · ")}</p>
      )}
      {!compact ? (
        <Link href={skillHref(r.skillKey)} className="link no-print mt-auto pt-4 text-sm">
          See the evidence →
        </Link>
      ) : null}
    </article>
  );
}

export function Ch9Manara() {
  const now = summary.recommendations.filter((r) => r.horizonGroup === "now");
  const later = summary.recommendations.filter((r) => r.horizonGroup === "2030");
  return (
    <Chapter id="manara">
      <div className="prose-story mb-10 max-w-2xl">
        <p>
          These moves are not invented policies. Each comes from a fixed rule applied to the data. We took the skills with a{" "}
          <Term k="priority">high-priority</Term> shortfall, ranked them by total shortfall across futures, and kept a mix of action types. Every card
          links to the publications behind it.{" "}
          <Link href="/methodology/#recommendations" className="link">
            The rule
          </Link>
        </p>
      </div>
      <Reveal>
        <h3 className="display text-2xl text-ink">
          Start now <span className="text-base font-normal text-muted">· Next 2–3 years, continuing through 2030</span>
        </h3>
        {later.length === 0 ? (
          <p className="mt-1 text-sm text-ink-2">
            All {now.length} moves belong here: the evidence behind each points to the next 2–3 years, or to now and through 2030.
          </p>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {now.map((r) => (
            <ActionCard key={r.skillKey} r={r} />
          ))}
        </div>
      </Reveal>
      {later.length ? (
        <Reveal className="mt-12">
          <h3 className="display text-2xl text-ink">
            Build for 2030 <span className="text-base font-normal text-muted">· Needed by 2030</span>
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {later.map((r) => (
              <ActionCard key={r.skillKey} r={r} />
            ))}
          </div>
        </Reveal>
      ) : null}
      <Reveal className="mt-14">
        <div className="card flex flex-col items-start justify-between gap-4 bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="display text-2xl">Take the findings into the room</p>
            <p className="mt-1 text-sm text-white/75">A two-page executive brief of Chapters 5–9, formatted for print and PDF.</p>
          </div>
          <Link href="/brief/?print=1" className="btn bg-white text-ink hover:bg-paper-2">
            Download the executive brief (PDF)
          </Link>
        </div>
      </Reveal>
    </Chapter>
  );
}
