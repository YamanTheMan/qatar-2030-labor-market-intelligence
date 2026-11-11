/**
 * Light data used by the story and every page. Heavy tables (signals, weights,
 * coefficients, postings) live in data-full.ts so the story bundle stays small.
 */
import gapsJson from "@/data/gaps.json";
import sourcesJson from "@/data/sources.json";
import summaryJson from "@/data/summary.json";
import contextJson from "@/data/context.json";
import type { ContextFact, GapRow, Source, Summary } from "./types";

export const gaps = gapsJson as GapRow[];
export const sources = sourcesJson as Source[];
export const summary = summaryJson as unknown as Summary;

export const gapById = new Map(gaps.map((g) => [g.id, g]));
export const sourceById = new Map(sources.map((s) => [s.id, s]));

export const getGap = (id: string): GapRow => {
  const g = gapById.get(id);
  if (!g) throw new Error(`unknown gap row ${id}`);
  return g;
};

const facts = (contextJson.facts as ContextFact[]).filter((f) => f.verified);
export const ctx = Object.fromEntries(facts.map((f) => [f.id, f])) as Record<string, ContextFact>;
export const contextFacts = facts;
