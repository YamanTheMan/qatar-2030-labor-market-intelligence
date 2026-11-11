"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children only once the placeholder comes within `margin` of the viewport.
 * Keeps hydration cheap on a long page; the placeholder reserves height so nothing shifts.
 */
export function LazyMount({ children, minHeight, margin = "900px", className }: { children: ReactNode; minHeight?: number | string; margin?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: `${margin} 0px ${margin} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, margin]);
  return (
    <div ref={ref} className={className} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
