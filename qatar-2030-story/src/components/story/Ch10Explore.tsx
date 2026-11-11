"use client";

import Link from "next/link";
import { summary } from "@/lib/data";
import { Chapter } from "./Chapter";

const VIEWS = [
  { view: "ranking", title: "Shortfall ranking", body: `All ${summary.counts.rows} rows, filterable by future, sector, priority and horizon.` },
  { view: "matrix", title: "Sector × future matrix", body: "The Chapter 6 heatmap, recomputed live for your filters." },
  { view: "skill", title: "Skill detail", body: "One skill across every future, with its specific skills and evidence quotes." },
  { view: "source", title: "Source detail", body: `Any of the ${summary.counts.sourceRecords} source records and every signal it contributed.` },
  { view: "model", title: "Model transparency", body: "Source contributions, quality weights and the signal-count balance." },
  { view: "tables", title: "Data tables", body: "Every table, filterable, with CSV download of your view or the originals." },
];

export function Ch10Explore() {
  return (
    <Chapter id="explore" tone="tint">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VIEWS.map((v) => (
          <li key={v.view}>
            <Link href={`/explore/?view=${v.view}`} className="card group block h-full p-5 transition-colors hover:border-maroon">
              <p className="display text-xl text-ink group-hover:text-maroon">{v.title} →</p>
              <p className="mt-1.5 text-sm text-ink-2">{v.body}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-ink-2">
        Filters in the explorer never change the story above. How every number is computed, and the data caveats, are on the{" "}
        <Link href="/methodology/" className="link">methodology page</Link>.
      </p>
    </Chapter>
  );
}
