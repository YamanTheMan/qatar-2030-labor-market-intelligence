"use client";

import { useSize } from "@/lib/hooks/useSize";
import { PUBLISHER_GROUPS, QUALITY_LABELS, type PublisherGroup, type QualityId } from "@/lib/meta";
import type { Source } from "@/lib/types";

export const QUALITY_FILL: Record<QualityId, string> = { high: "#2F2C27", medium: "#8F887B", low: "#D6CFC1" };

export function LibraryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
      {(Object.keys(QUALITY_FILL) as QualityId[]).map((q) => (
        <span key={q} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ background: QUALITY_FILL[q] }} aria-hidden="true" />
          {QUALITY_LABELS[q]}
        </span>
      ))}
      <span className="text-muted">Tile size = number of evidence signals</span>
    </div>
  );
}

/** The "library": every source record as a tile, grouped by publisher type. Click opens its evidence. */
export function SourceLibrary({ sources, onOpen, highlight }: { sources: Source[]; onOpen: (id: string) => void; highlight?: (s: Source) => boolean }) {
  const { ref, width, height } = useSize<HTMLDivElement>();
  const max = Math.max(...sources.map((s) => s.signals));
  const groups = Object.keys(PUBLISHER_GROUPS) as PublisherGroup[];
  // Fit tiles to the space: tile side = k × (0.45 + 0.55·√(signals/max)); solve k so every group fits its quarter.
  const rel = (n: number) => 0.45 + 0.55 * Math.sqrt(n / max);
  const quarterW = Math.max(60, width / 2 - 14);
  const quarterH = Math.max(40, height / 2 - (width < 480 ? 46 : 40));
  const k = Math.max(
    12,
    Math.min(
      58,
      ...groups.map((g) => {
        const sum = sources.filter((s) => s.group === g).reduce((a, s) => a + rel(s.signals) ** 2, 0);
        return Math.sqrt((quarterW * quarterH * 0.5) / sum);
      }),
    ),
  );
  return (
    <div ref={ref} className="grid h-full grid-cols-2 content-center gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-5">
      {groups.map((g) => {
        const list = sources.filter((s) => s.group === g);
        return (
          <div key={g}>
            <p className="mb-1 text-[0.62rem] font-semibold uppercase leading-tight tracking-wider text-ink-2 sm:mb-1.5 sm:text-xs">
              {PUBLISHER_GROUPS[g]} <span className="font-normal text-muted">· {list.length}</span>
            </p>
            <ul className="flex flex-wrap items-end gap-1 sm:gap-1.5">
              {list.map((s) => {
                const size = Math.round(k * rel(s.signals));
                const dim = highlight ? !highlight(s) : false;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(s.id)}
                      title={`${s.title} (${s.publisher}, ${s.year}): ${s.signals} signals`}
                      aria-label={`${s.title}, ${s.publisher}, ${s.year}. ${s.signals} evidence signals. ${QUALITY_LABELS[s.quality]}. Open evidence.`}
                      className="group relative flex items-end justify-start rounded-[5px] p-1 text-left transition-[transform,opacity] duration-300 hover:-translate-y-0.5 hover:ring-2 hover:ring-maroon"
                      style={{ width: size, height: size, background: QUALITY_FILL[s.quality], opacity: dim ? 0.25 : 1 }}
                    >
                      {size > 40 ? (
                        <span className={`tabular text-[0.62rem] font-semibold leading-none ${s.quality === "low" ? "text-ink" : "text-white/90"}`}>{s.signals}</span>
                      ) : null}
                      {s.sameTitleAs ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
