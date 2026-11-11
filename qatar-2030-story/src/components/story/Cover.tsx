"use client";

import Link from "next/link";
import { useMemo } from "react";
import { shortfallFill } from "@/lib/colors";
import { gaps, summary } from "@/lib/data";
import { Bi, CHAPTERS, STANDFIRSTS } from "@/lib/i18n";
import { CountUp } from "@/components/ui/CountUp";
import { Term } from "@/components/ui/Term";

/** Deterministic PRNG so the server and client render identical dot fields. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Cover() {
  const ch = CHAPTERS[0];
  const sf = STANDFIRSTS.cover;
  const dots = useMemo(() => {
    const rnd = mulberry32(2030);
    return gaps.map((g) => ({
      id: g.id,
      x: rnd() * 1200,
      y: rnd() * 800,
      r: 3 + Math.min(1, Math.abs(g.shortfall) * 2.2) * 7,
      fill: shortfallFill(g.shortfall),
    }));
  }, []);
  const c = summary.counts;

  return (
    <section id="cover" data-chapter="cover" className="relative isolate overflow-hidden" aria-labelledby="cover-title">
      <svg className="absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <g key={k} className="cover-drift" style={{ animationDuration: `${16 + k * 3}s`, animationDelay: `${-k * 4}s`, ["--dx" as string]: `${(k % 2 ? 1 : -1) * (10 + k * 3)}px`, ["--dy" as string]: `${(k % 3 ? -1 : 1) * (8 + k * 2)}px` }}>
            {dots
              .filter((_, i) => i % 6 === k)
              .map((d) => (
                <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={0.55} />
              ))}
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_45%,rgba(250,247,242,0.97)_0%,rgba(250,247,242,0.9)_45%,rgba(250,247,242,0.55)_80%)]" aria-hidden="true" />
      <div className="wrap flex min-h-[calc(100svh-56px)] flex-col justify-center py-16 sm:py-20">
        <p className="kicker mb-5">A data story · Qatar Human Capital Manara</p>
        <h1 id="cover-title" className="display max-w-4xl text-[2.6rem] text-ink sm:text-6xl lg:text-7xl">
          <Bi en={ch.en} ar={ch.ar} />
        </h1>
        <Bi as="p" en={sf.en} ar={sf.ar} className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 sm:text-xl" />
        <p className="mt-5 max-w-2xl text-sm text-muted">
          CMU Tepper MSBA Capstone (2025) for Qatar Foundation&rsquo;s Higher Education Division, Qatar Human Capital Manara.
          By Aiko Kikuchi, Akhmed Sungurov, Arshia Sabdar, Dima Polukhin and Malak Alseaf. Advised by Prof. Ganesh Mani.
        </p>

        <dl className="mt-10 grid max-w-3xl grid-cols-3 gap-4 border-t border-ink/15 pt-6 sm:gap-8">
          <div className="flex flex-col-reverse justify-end">
            <dt className="mt-1 text-sm text-ink-2">
              skill <Term k="shortfall">shortfalls</Term>
            </dt>
            <dd className="display text-4xl text-maroon sm:text-6xl">
              <CountUp to={c.shortfalls} />
            </dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="mt-1 text-sm text-ink-2">sectors</dt>
            <dd className="display text-4xl text-ink sm:text-6xl">
              <CountUp to={c.sectors} duration={0.9} />
            </dd>
          </div>
          <div className="flex flex-col-reverse justify-end">
            <dt className="mt-1 text-sm text-ink-2">
              possible <Term k="future">futures</Term>
            </dt>
            <dd className="display text-4xl text-ink sm:text-6xl">
              <CountUp to={c.scenarios} duration={0.8} />
            </dd>
          </div>
        </dl>
        <p className="mt-3 max-w-3xl text-xs text-muted">
          {c.shortfalls} of {c.rows} future × sector × skill combinations show strategy asking for more than employers advertise
          today.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#country" className="btn btn-primary">
            Scroll to begin <span aria-hidden="true">↓</span>
          </a>
          <Link href="/explore/" className="btn btn-ghost">
            Skip to the explorer
          </Link>
        </div>
      </div>
      <style>{`
        @keyframes coverDrift { 0%,100% { transform: translate(0,0) } 50% { transform: translate(var(--dx), var(--dy)) } }
        .cover-drift { animation: coverDrift ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .cover-drift { animation: none } }
      `}</style>
    </section>
  );
}
