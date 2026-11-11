"use client";

import Link from "next/link";
import { useState } from "react";
import { sourceById, sources } from "@/lib/data";
import { signalsFor } from "@/lib/data-full";
import { DIRECTION_LABELS, PUBLISHER_GROUPS, QUALITY_LABELS, SCENARIOS, SECTORS, type PublisherGroup } from "@/lib/meta";
import { QUALITY_FILL } from "@/components/charts/SourceLibrary";

export function SourcesList() {
  const [group, setGroup] = useState<PublisherGroup | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = sources.filter((s) => group === "all" || s.group === group).sort((a, b) => b.signals - a.signals);
  return (
    <div>
      <div role="group" aria-label="Filter by publisher type" className="mb-6 flex flex-wrap gap-1.5">
        <button type="button" className="chip" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
          All ({sources.length})
        </button>
        {(Object.keys(PUBLISHER_GROUPS) as PublisherGroup[]).map((g) => (
          <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>
            {PUBLISHER_GROUPS[g]} ({sources.filter((s) => s.group === g).length})
          </button>
        ))}
      </div>
      <ul className="divide-y divide-rule border-y border-rule">
        {list.map((s) => {
          const isOpen = open === s.id;
          const sig = isOpen ? signalsFor({ sourceId: s.id }) : [];
          return (
            <li key={s.id} id={s.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${s.id}-body`}
                onClick={() => setOpen(isOpen ? null : s.id)}
                className="grid w-full grid-cols-[14px_1fr_auto] items-start gap-x-3 py-4 text-left hover:bg-paper-2/60 sm:grid-cols-[14px_1fr_auto_auto]"
              >
                <span className="mt-1.5 h-3 w-3 rounded-[3px]" style={{ background: QUALITY_FILL[s.quality] }} title={QUALITY_LABELS[s.quality]} aria-hidden="true" />
                <span>
                  <span className="block font-semibold leading-snug text-ink">{s.title}</span>
                  <span className="text-sm text-ink-2">
                    {s.publisher} · {s.year} · {PUBLISHER_GROUPS[s.group]} · {QUALITY_LABELS[s.quality]}
                  </span>
                  {s.sameTitleAs ? (
                    <span className="mt-1 block text-xs text-gold-ink">Same title as another record ({sourceById.get(s.sameTitleAs)?.short})</span>
                  ) : null}
                </span>
                <span className="tabular whitespace-nowrap text-sm text-ink-2">{s.signals} signals</span>
                <span className="hidden text-sm text-maroon sm:block" aria-hidden="true">
                  {isOpen ? "Hide ↑" : "Evidence ↓"}
                </span>
              </button>
              {isOpen ? (
                <div id={`${s.id}-body`} className="pb-6 pl-[26px]">
                  <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="link">
                      Open the publication ↗
                    </a>
                    <Link href={`/explore/?view=source&src=${s.id}`} className="link">
                      Contribution by future →
                    </Link>
                  </p>
                  <ol className="grid gap-3 md:grid-cols-2">
                    {sig.map((x) => (
                      <li key={x.i} className="card p-4 text-sm">
                        <p className="text-xs text-muted">
                          {SCENARIOS[x.scenario].short} · {SECTORS[x.sector].label} · {DIRECTION_LABELS[x.direction]}
                        </p>
                        <Link href={`/explore/?view=skill&skill=${encodeURIComponent(x.skillKey)}`} className="font-semibold text-ink hover:text-maroon">
                          {x.skill}
                        </Link>
                        {x.quote ? <blockquote className="mt-2 border-l-2 border-maroon pl-3 font-display italic text-ink">&ldquo;{x.quote}&rdquo;</blockquote> : null}
                        {x.rationale ? <p className="mt-2 text-ink-2">{x.rationale}</p> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
