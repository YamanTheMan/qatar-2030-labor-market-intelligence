"use client";
import type { ReactNode } from "react";
import { DEMAND, responseCounts } from "@/lib/dash/demand";
import { STEP_IDS, STEP_LABELS, type Kpis, type SkillAgg } from "@/lib/dash/model";
import { fmtInt, fmtPct } from "@/lib/format";
import { StepBar, TipBody, tip } from "./ui";

function Tile({ label, figure, unit, children, visual }: { label: string; figure: ReactNode; unit?: ReactNode; children?: ReactNode; visual?: ReactNode }) {
  return (
    <div className="d-card flex min-w-0 flex-col p-4 sm:p-5">
      <h2 className="d-eyebrow">{label}</h2>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-[2.5rem] font-semibold leading-none tracking-[-0.03em] text-fg lg:text-5xl">{figure}</span>
        {unit && <span className="text-[0.8125rem] text-fg-2">{unit}</span>}
      </p>
      {visual && <div className="mt-3.5">{visual}</div>}
      {children && <div className="d-sub mt-2.5">{children}</div>}
    </div>
  );
}

/** Share of a whole: one filled bar on a neutral track. */
function Meter({ share, color }: { share: number; color: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-[3px] bg-surface-3">
      <div className="h-full rounded-r-[3px]" style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%`, background: color }} />
    </div>
  );
}

/** Four headline figures, demand first. */
export function KpiStrip({ kpis, skills }: { kpis: Kpis; skills: SkillAgg[] }) {
  const n = kpis.total;
  const strong = skills.filter((s) => s.peak.strategic >= DEMAND.strong.min).length;
  const recruit = responseCounts(skills).recruit;
  const share = (x: number) => (n ? x / n : 0);

  return (
    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <Tile label="Skill areas the 2030 plans call for" figure={fmtInt(n)} unit="skill areas" visual={<Meter share={share(strong)} color="var(--accent)" />}>
        {n ? `${fmtInt(strong)} with strong demand (0.20 or more) across the strategies.` : "No skills match these filters."}
      </Tile>

      <Tile
        label="Not yet in today's hiring"
        figure={fmtInt(kpis.short)}
        unit={n ? `${fmtPct(share(kpis.short))} of skill areas` : undefined}
        visual={
          <div tabIndex={0} className="rounded-[3px]" {...tip(() => <TipBody title="How the skill areas divide" rows={[...STEP_IDS].reverse().filter((s) => kpis.steps[s] > 0).map((s) => [STEP_LABELS[s], fmtInt(kpis.steps[s])])} />)}>
            <StepBar steps={kpis.steps} />
          </div>
        }
      >
        Strategies ask for more than employers advertise. {fmtInt(kpis.severe)} of these gaps are large.
      </Tile>

      <Tile label="Recruit internationally now" figure={fmtInt(recruit)} unit="skill areas" visual={<Meter share={share(recruit)} color="var(--r-recruit)" />}>
        Needed in the next few years, with a gap too large to close by training alone.
      </Tile>

      <Tile
        label="Priority for Qatari talent"
        figure={kpis.priorityShare === null ? "n/a" : fmtPct(kpis.priorityShare)}
        unit="of the gaps"
        visual={<Meter share={kpis.priorityShare ?? 0} color="var(--gold)" />}
      >
        {kpis.short > 0 ? `${fmtInt(kpis.priorityShort)} of ${fmtInt(kpis.short)} skill areas with a gap are flagged for Qatari nationals.` : "No gaps under these filters."}
      </Tile>
    </div>
  );
}
