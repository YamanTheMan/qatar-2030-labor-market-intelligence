"use client";

import { useEffect, useState } from "react";
import { HORIZON_IDS, HORIZON_LABELS, PRIORITY_IDS, PRIORITY_SHORT, SCENARIOS, SCENARIO_IDS, SECTORS, SECTOR_IDS } from "@/lib/meta";
import type { Filters } from "./state";

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-full text-[0.7rem] font-semibold uppercase tracking-wider text-muted sm:w-auto">{label}</span>
      {children}
    </div>
  );
}

export function FilterBar({
  filters,
  set,
  matching,
  total,
}: {
  filters: Filters;
  set: (p: Record<string, string | string[] | null>) => void;
  matching: number;
  total: number;
}) {
  const [q, setQ] = useState(filters.q);
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== filters.q) set({ q });
    }, 250);
    return () => clearTimeout(t);
  }, [q, filters.q, set]);
  const active = filters.f.length + filters.sec.length + filters.p.length + filters.h.length + (filters.q ? 1 : 0);

  return (
    <div className="card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Search skills</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills, e.g. hydrogen, AI, nursing…"
            className="w-full rounded-full border border-rule bg-paper px-4 py-2 text-sm placeholder:text-muted focus:border-maroon focus:outline-none"
          />
        </label>
        <p className="tabular text-sm text-ink-2" aria-live="polite">
          <b className="text-ink">{matching}</b> of {total} rows
        </p>
        <button
          type="button"
          className="chip"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? "Link copied ✓" : "Copy link to this view"}
        </button>
        {active ? (
          <button type="button" className="chip" onClick={() => set({ f: null, sec: null, p: null, h: null, q: null })}>
            Clear filters ({active})
          </button>
        ) : null}
      </div>
      <Group label="Futures">
        {SCENARIO_IDS.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={filters.f.includes(s)} onClick={() => set({ f: toggle(filters.f, s) })}>
            <span className="h-2 w-2 rounded-full" style={{ background: SCENARIOS[s].color }} aria-hidden="true" />
            {SCENARIOS[s].short}
          </button>
        ))}
      </Group>
      <Group label="Sectors">
        {SECTOR_IDS.map((s) => (
          <button key={s} type="button" className={`chip ${!more ? "max-sm:[&:nth-of-type(n+5)]:hidden" : ""}`} aria-pressed={filters.sec.includes(s)} onClick={() => set({ sec: toggle(filters.sec, s) })}>
            {SECTORS[s].label}
          </button>
        ))}
        <button type="button" className="text-xs font-semibold text-maroon underline sm:hidden" onClick={() => setMore((m) => !m)}>
          {more ? "fewer" : "all sectors"}
        </button>
      </Group>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Group label="Qatari talent">
          {PRIORITY_IDS.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={filters.p.includes(p)} onClick={() => set({ p: toggle(filters.p, p) })}>
              {PRIORITY_SHORT[p]}
            </button>
          ))}
        </Group>
        <Group label="Horizon">
          {HORIZON_IDS.map((h) => (
            <button key={h} type="button" className="chip" aria-pressed={filters.h.includes(h)} onClick={() => set({ h: toggle(filters.h, h) })}>
              {HORIZON_LABELS[h]}
            </button>
          ))}
        </Group>
      </div>
    </div>
  );
}
