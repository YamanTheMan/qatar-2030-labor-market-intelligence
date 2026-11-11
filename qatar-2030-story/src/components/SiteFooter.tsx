import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-surface">
      <div className="dash grid gap-10 py-10 text-sm text-fg-2 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-lg space-y-3">
          <p className="text-base font-semibold text-fg">Qatar 2030 Skills Intelligence</p>
          <p>
            Where Qatar&rsquo;s 2030 strategies ask for more skills than employers hire for today. A CMU Tepper MSBA
            Capstone (2025) for Qatar Foundation&rsquo;s Higher Education Division and the Qatar Human Capital Manara
            initiative.
          </p>
          <p className="text-fg-3">
            Aiko Kikuchi · Akhmed Sungurov · Arshia Sabdar · Dima Polukhin · Malak Alseaf. Advised by Professor Ganesh
            Mani.
          </p>
        </div>
        <div>
          <p className="d-eyebrow mb-3">Understand</p>
          <ul className="space-y-2">
            <li><Link className="hover:text-accent-fg" href="/methodology/">Methodology &amp; caveats</Link></li>
            <li><Link className="hover:text-accent-fg" href="/sources/">All 33 source records</Link></li>
            <li><Link className="hover:text-accent-fg" href="/explore/?view=tables">Download the data</Link></li>
          </ul>
        </div>
        <div>
          <p className="d-eyebrow mb-3">Read</p>
          <ul className="space-y-2">
            <li><Link className="hover:text-accent-fg" href="/story/">The long-form story</Link></li>
            <li><Link className="hover:text-accent-fg" href="/brief/">Executive brief (print / PDF)</Link></li>
            <li><Link className="hover:text-accent-fg" href="/explore/">Evidence explorer</Link></li>
          </ul>
        </div>
      </div>
      <div className="dash border-t border-line py-5 text-xs leading-relaxed text-fg-3">
        Analytical figures are computed from the capstone pipeline outputs in <code>data/</code>. Hub locations and
        anchor organisations are a reference layer added for this dashboard; the dataset itself is by sector, not by
        place. No tracking, no cookies. The base map loads from{" "}
        <a className="underline" href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> ©{" "}
        <a className="underline" href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>, data from{" "}
        <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>.
      </div>
    </footer>
  );
}
