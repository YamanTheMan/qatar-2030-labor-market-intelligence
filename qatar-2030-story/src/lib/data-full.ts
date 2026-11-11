/** Heavy tables: imported by the explorer and the sources page only. */
import signalsJson from "@/data/signals.json";
import weightsJson from "@/data/weights.json";
import coefficientsJson from "@/data/coefficients.json";
import postingsJson from "@/data/postings.json";
import type { Coefficient, PostingRow, Signal, Weight } from "./types";

export const signals = signalsJson as Signal[];
export const weights = weightsJson as Weight[];
export const coefficients = coefficientsJson as Coefficient[];
export const postings = postingsJson as PostingRow[];

export function signalsFor(opts: { sourceId?: string; skillKey?: string; scenario?: string; sector?: string }, from: Signal[] = signals): Signal[] {
  return from.filter(
    (s) =>
      (!opts.sourceId || s.sourceId === opts.sourceId) &&
      (!opts.skillKey || s.skillKey === opts.skillKey) &&
      (!opts.scenario || s.scenario === opts.scenario) &&
      (!opts.sector || s.sector === opts.sector),
  );
}
