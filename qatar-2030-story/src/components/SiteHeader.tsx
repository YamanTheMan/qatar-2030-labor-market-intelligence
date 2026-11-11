"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { setTheme, useTheme } from "@/lib/dash/theme";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/methodology/", label: "Methodology" },
  { href: "/sources/", label: "Sources" },
];

export function SiteHeader() {
  const path = usePathname() ?? "/";
  const onDashboard = path === "/";
  const onStory = path.startsWith("/story");
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className={`${onDashboard ? "dash" : "wrap"} flex h-14 items-center justify-between gap-3`}>
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="Qatar 2030 Skills Intelligence, dashboard">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
              <rect width="24" height="24" rx="6" fill="#8A1538" />
              <path d="M8 4.5 L12 7 L8 9.5 L12 12 L8 14.5 L12 17 L8 19.5" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
            </svg>
            <span className="hidden truncate text-[0.9375rem] font-semibold tracking-tight text-fg sm:inline">
              Qatar 2030 <span className="font-normal text-fg-3">Skills Intelligence</span>
            </span>
          </Link>
          <nav aria-label="Main">
            <ul className="flex items-center gap-0.5 text-[0.8125rem]">
              {NAV.map((n) => {
                const active = n.href === "/" ? onDashboard : path.startsWith(n.href.replace(/\/$/, ""));
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-3 hover:text-fg ${active ? "bg-surface-3 font-semibold text-fg" : "font-medium text-fg-2"}`}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onStory && <LangToggle />}
          {onDashboard && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="d-btn d-icon d-btn-quiet"
      aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        )}
      </svg>
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" className="flex overflow-hidden rounded-lg border border-line-strong text-xs">
      <button type="button" onClick={() => setLang("en")} aria-pressed={lang === "en"} className={`px-2.5 py-1.5 ${lang === "en" ? "bg-invert text-on-invert" : "text-fg-2"}`}>
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ar")}
        aria-pressed={lang === "ar"}
        lang="ar"
        className={`px-2.5 py-1.5 font-arabic ${lang === "ar" ? "bg-invert text-on-invert" : "text-fg-2"}`}
      >
        ع<span className="sr-only"> العربية (Arabic)</span>
      </button>
    </div>
  );
}
