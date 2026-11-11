"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scrollytelling without a dependency: a step becomes active when it crosses
 * the middle band of the viewport. Returns the active index and a ref setter.
 */
export function useScrollSteps(count: number) {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);

  const setRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      nodes.current[i] = el;
    },
    [],
  );

  useEffect(() => {
    const els = nodes.current.slice(0, count).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.step);
            if (!Number.isNaN(i)) setActive(i);
          }
        }
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [count]);

  return { active, setRef, setActive };
}
