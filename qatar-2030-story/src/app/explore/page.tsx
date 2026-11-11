import type { Metadata } from "next";
import { Suspense } from "react";
import { Explorer } from "@/components/explore/Explorer";

export const metadata: Metadata = {
  title: "Explore the evidence",
  description: "Filter every shortfall by future, sector, priority for Qatari talent and time horizon; drill into skills and sources; download the data.",
};

export default function ExplorePage() {
  return (
    <div className="wrap py-12 sm:py-16">
      <header className="mb-8 max-w-3xl">
        <p className="kicker mb-2">Explorer</p>
        <h1 className="display text-4xl text-ink sm:text-5xl">Explore the evidence yourself</h1>
        <p className="mt-3 text-lg text-ink-2">
          Every number in the story can be reproduced here. Filters only change this page, and the address bar keeps your view so you can share it.
        </p>
      </header>
      <div className="min-h-[1400px]">
        <Suspense fallback={<p className="text-ink-2">Loading the explorer…</p>}>
          <Explorer />
        </Suspense>
      </div>
    </div>
  );
}
