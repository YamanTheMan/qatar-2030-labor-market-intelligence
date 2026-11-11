import type { Metadata } from "next";
import { SourcesList } from "@/components/SourcesList";
import { summary } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sources",
  description: "All 33 source records behind the strategy side of the analysis, with publishers, years, quality, signals and evidence quotes.",
};

export default function SourcesPage() {
  const c = summary.counts;
  return (
    <div className="wrap py-12 sm:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="kicker mb-2">Sources</p>
        <h1 className="display text-4xl text-ink sm:text-5xl">
          {c.sourceRecords} source records · {c.signals} evidence signals
        </h1>
        <p className="mt-3 text-lg text-ink-2">
          Every publication the strategy side rests on. Two pairs of records share a title, so there are {c.distinctTitles} distinct documents. They
          are marked below. Expand any record to read its evidence.
        </p>
      </header>
      <SourcesList />
    </div>
  );
}
