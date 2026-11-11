import Link from "next/link";
import type { ReactNode } from "react";

/** Every chart: insight title, how-to-read line, the graphic, a source line and an explorer deep link. */
export function ChartFrame({
  title,
  howTo,
  source,
  explore,
  children,
  className,
  legend,
}: {
  title: ReactNode;
  howTo: ReactNode;
  source: ReactNode;
  explore?: { href: string; label?: string };
  children: ReactNode;
  className?: string;
  legend?: ReactNode;
}) {
  return (
    <figure className={`flex h-full flex-col ${className ?? ""}`}>
      <figcaption className="mb-3">
        <h3 className="display text-[1.3rem] leading-tight text-ink sm:text-[1.5rem]">{title}</h3>
        <p className="mt-1.5 text-sm text-ink-2">{howTo}</p>
        {legend ? <div className="mt-2.5">{legend}</div> : null}
      </figcaption>
      <div className="relative min-h-0 flex-1">{children}</div>
      <footer className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-rule pt-2 text-xs text-muted">
        <span>Source: {source}</span>
        {explore ? (
          <Link href={explore.href} className="link no-print whitespace-nowrap">
            {explore.label ?? "Explore this"} →
          </Link>
        ) : null}
      </footer>
    </figure>
  );
}

export const SRC = {
  gap: "Capstone scenario pipeline, gap-analysis table (280 future × sector × skill rows)",
  signals: "Capstone scenario pipeline, evidence audit trail (321 signals from 33 source records)",
  weights: "Capstone scenario pipeline, skill-importance table",
  postings: "Capstone scenario pipeline, posting distribution (1,848 classified postings)",
  coef: "Capstone scenario pipeline, source-contribution table",
};
