import type { HubKind } from "@/lib/hubs";

/** Line icons on a 24 × 24 grid, drawn with the current text colour. */
const PATHS = {
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M20 20l-3.9-3.9"],
  x: ["M6 6l12 12", "M18 6 6 18"],
  "chevron-down": ["M6 9l6 6 6-6"],
  "chevron-right": ["M9 6l6 6-6 6"],
  "arrow-left": ["M19 12H5", "M11 6l-6 6 6 6"],
  "arrow-up": ["M12 19V5", "M6 11l6-6 6 6"],
  "arrow-down": ["M12 5v14", "M6 13l6 6 6-6"],
  plus: ["M12 5v14", "M5 12h14"],
  minus: ["M5 12h14"],
  reset: ["M4 12a8 8 0 1 0 2.6-5.9", "M4 4v5h5"],
  frame: ["M4 9V5a1 1 0 0 1 1-1h4", "M15 4h4a1 1 0 0 1 1 1v4", "M20 15v4a1 1 0 0 1-1 1h-4", "M9 20H5a1 1 0 0 1-1-1v-4"],
  download: ["M12 4v11", "M7 11l5 5 5-5", "M5 20h14"],
  info: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 11v6", "M12 7.5v.5"],
  star: ["M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5z"],
  pin: ["M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z", "M12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  external: ["M14 5h5v5", "M19 5l-8 8", "M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"],
  table: ["M4 5h16v14H4z", "M4 10h16", "M4 15h16", "M10 5v14"],
  globe: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M3 12h18", "M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"],
  // hub kinds
  energy: ["M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8z"],
  knowledge: ["M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9z", "M6.5 11.2V16c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.8", "M21.5 9v5.5"],
  technology: ["M7 7h10v10H7z", "M10.5 10.5h3v3h-3z", "M9.5 3.5V7", "M14.5 3.5V7", "M9.5 17v3.5", "M14.5 17v3.5", "M3.5 9.5H7", "M3.5 14.5H7", "M17 9.5h3.5", "M17 14.5h3.5"],
  health: ["M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5V4z"],
  finance: ["M3.5 20.5h17", "M5.5 17.5v-7", "M10 17.5v-7", "M14 17.5v-7", "M18.5 17.5v-7", "M12 3.5 3.5 8h17L12 3.5z"],
  logistics: ["M20.5 8 12 3.5 3.5 8v8l8.5 4.5 8.5-4.5V8z", "M3.5 8l8.5 4.5L20.5 8", "M12 12.5v8"],
  culture: ["M4 20.5h16", "M5.5 17.5v-6.5a6.5 6.5 0 0 1 13 0v6.5", "M9.5 17.5v-5a2.5 2.5 0 0 1 5 0v5", "M12 4.5V2.5"],
  city: ["M3 20.5h18", "M5 20.5V8.5l5-2.5v14.5", "M10 11h6.5l2.5 2v7.5", "M13.5 14.5v.1", "M13.5 17.5v.1", "M7.5 11v.1", "M7.5 14v.1", "M7.5 17v.1"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className, strokeWidth = 1.8 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export const KindIcon = ({ kind, size = 14, className }: { kind: HubKind; size?: number; className?: string }) => (
  <Icon name={kind} size={size} className={className} strokeWidth={2} />
);
