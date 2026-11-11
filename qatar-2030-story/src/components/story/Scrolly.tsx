"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { LazyMount } from "@/components/ui/LazyMount";

/**
 * Sticky graphic + scroll-stepped text.
 * Desktop: graphic sticky on one side, steps on the other.
 * Mobile: graphic pinned to the top 45vh, steps scroll beneath it.
 */
export function Scrolly({
  steps,
  graphic,
  side = "right",
  label,
}: {
  steps: ReactNode[];
  graphic: (active: number) => ReactNode;
  side?: "left" | "right";
  label: string;
}) {
  const [active, setActive] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: isDesktop ? "-50% 0px -50% 0px" : "-78% 0px -21% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isDesktop, steps.length]);

  return (
    <div className={`relative lg:grid lg:gap-12 ${side === "right" ? "lg:grid-cols-[minmax(300px,0.8fr)_1.35fr]" : "lg:grid-cols-[1.35fr_minmax(300px,0.8fr)]"}`}>
      <div
        className={`scrolly-graphic sticky top-14 z-30 -mx-4 h-[52vh] overflow-hidden border-b border-rule bg-paper px-4 pb-2 pt-3 sm:-mx-8 sm:px-8 lg:top-[72px] lg:z-10 lg:mx-0 lg:h-[calc(100vh-96px)] lg:overflow-visible lg:border-0 lg:px-0 lg:py-4 ${side === "right" ? "lg:order-2" : "lg:order-1"}`}
        aria-live="polite"
        aria-label={`${label}: graphic, step ${active + 1} of ${steps.length}`}
        role="region"
      >
        <LazyMount className="h-full" margin="700px">
          {graphic(active)}
        </LazyMount>
      </div>
      <div className={`relative z-20 ${side === "right" ? "lg:order-1" : "lg:order-2"}`}>
        {steps.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            className={`flex min-h-[72vh] items-center py-[8vh] first:pt-[14vh] last:min-h-[90vh] lg:min-h-[88vh] ${i === 0 ? "" : ""}`}
          >
            <div
              className={`card w-full max-w-[460px] p-5 text-[1.0625rem] leading-relaxed text-ink-2 shadow-[0_8px_30px_-18px_rgba(27,26,23,0.35)] transition-opacity duration-300 sm:p-6 ${active === i ? "opacity-100" : "lg:opacity-40"}`}
            >
              {s}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
