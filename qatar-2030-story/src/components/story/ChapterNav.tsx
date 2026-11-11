"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { CHAPTERS, useLang } from "@/lib/i18n";

export function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="no-print fixed inset-x-0 top-14 z-50 h-[3px] origin-left bg-maroon"
      style={{ scaleX }}
    />
  );
}

export function ChapterNav() {
  const [active, setActive] = useState<string>("cover");
  const { lang } = useLang();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.chapter!);
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label="Chapters" className="no-print fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
      <ol className="flex flex-col items-end gap-1.5">
        {CHAPTERS.map((c) => {
          const on = c.id === active;
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-2 rounded-full py-0.5 pl-2 pr-1 text-xs"
              >
                <span
                  className={`whitespace-nowrap rounded-full bg-paper/90 px-2 py-0.5 transition-opacity ${on ? "font-semibold text-maroon opacity-100" : "text-ink-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                >
                  {lang === "ar" ? <span className="font-arabic">{c.navAr}</span> : c.navEn}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] tabular transition-all ${on ? "border-maroon bg-maroon text-white" : "border-ink/25 bg-paper text-ink-2 group-hover:border-maroon"}`}
                >
                  {c.n}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
