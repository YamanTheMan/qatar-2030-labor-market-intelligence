"use client";

import type { ReactNode } from "react";
import { Bi, CHAPTERS, STANDFIRSTS, type ChapterId } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Reveal";

export function Chapter({ id, children, tone = "paper" }: { id: ChapterId; children: ReactNode; tone?: "paper" | "tint" }) {
  const ch = CHAPTERS.find((c) => c.id === id)!;
  const sf = STANDFIRSTS[id];
  return (
    <section
      id={id}
      data-chapter={id}
      aria-labelledby={`${id}-title`}
      className={`relative scroll-mt-14 py-20 sm:py-28 ${tone === "tint" ? "bg-paper-2/70" : ""}`}
    >
      <div className="wrap">
        <Reveal>
          <header className="mb-10 max-w-3xl sm:mb-14">
            <p className="kicker mb-3">Chapter {ch.n}</p>
            <Bi as="h2" en={ch.en} ar={ch.ar} className="display text-[2.1rem] text-ink sm:text-5xl" />
            <span id={`${id}-title`} className="sr-only">
              {ch.en}
            </span>
            <Bi as="p" en={sf.en} ar={sf.ar} className="mt-4 text-lg leading-relaxed text-ink-2 sm:text-xl" />
          </header>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
