import type { Metadata } from "next";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: "The story: is Qatar hiring for its 2030 economy?",
  description:
    "The long-form version of the Qatar 2030 skills analysis: what national strategies ask for, what employers hire for today, and where the two differ across five futures.",
};

/** The scroll story keeps its serif headings; everything else on the site uses Inter. */
export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${fraunces.variable} story-scope`}>{children}</div>;
}
