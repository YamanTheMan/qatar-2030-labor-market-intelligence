"use client";

import * as Popover from "@radix-ui/react-popover";
import { useRef, useState, type ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";
import { useLang } from "@/lib/i18n";

/** Plain-language term with the technical definition on hover / tap / focus. */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const { lang } = useLang();
  const g = GLOSSARY[k];
  const hoverOpen = (v: boolean) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(v), v ? 120 : 180);
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="cursor-help border-b border-dotted border-current/60 font-[inherit] leading-[inherit] text-inherit hover:border-maroon hover:text-maroon"
          onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && hoverOpen(false)}
        >
          {children ?? g.term}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          onPointerEnter={() => hoverOpen(true)}
          onPointerLeave={() => hoverOpen(false)}
          className="z-[60] w-[min(340px,calc(100vw-24px))] rounded-xl border border-rule bg-card p-4 text-left text-sm leading-relaxed text-ink-2 shadow-[0_12px_40px_-12px_rgba(27,26,23,0.35)]"
        >
          {lang === "ar" ? (
            <div dir="rtl" lang="ar" className="font-arabic">
              <p className="mb-1 font-semibold text-ink">{g.termAr}</p>
              <p>{g.defAr}</p>
            </div>
          ) : (
            <>
              <p className="mb-1 font-semibold text-ink">{g.term}</p>
              <p>{g.def}</p>
            </>
          )}
          {"technical" in g && g.technical ? (
            <p className="mt-2 border-t border-rule pt-2 font-mono text-[0.72rem] text-muted">{g.technical}</p>
          ) : null}
          <Popover.Arrow className="fill-card" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
