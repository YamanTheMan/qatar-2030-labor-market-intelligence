"use client";

import * as Popover from "@radix-ui/react-popover";
import { ctx } from "@/lib/data";

/** Superscript source marker for a national-context fact (from context.json). */
export function Footnote({ id, n }: { id: string; n?: number }) {
  const f = ctx[id];
  if (!f) return null;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="ml-0.5 inline-flex h-[1.15em] min-w-[1.15em] -translate-y-[0.35em] items-center justify-center rounded-full bg-gold-soft px-1 align-baseline text-[0.62em] font-semibold text-gold-ink hover:bg-gold hover:text-white"
        >
          {n ?? "i"}
          <span className="sr-only"> (source: {f.source})</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] w-[min(320px,calc(100vw-24px))] rounded-xl border border-rule bg-card p-4 text-sm text-ink-2 shadow-[0_12px_40px_-12px_rgba(27,26,23,0.35)]"
        >
          <p className="kicker mb-1 !text-gold-ink">National context</p>
          <p className="font-semibold text-ink">{f.label}</p>
          {f.detail ? <p className="mt-1">{f.detail}</p> : null}
          <p className="mt-2 text-xs text-muted">
            {f.source} · {f.asOf}
          </p>
          {f.note ? <p className="mt-2 text-xs text-muted">{f.note}</p> : null}
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="link mt-2 inline-block text-xs">
            Open source ↗
          </a>
          <Popover.Arrow className="fill-card" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
