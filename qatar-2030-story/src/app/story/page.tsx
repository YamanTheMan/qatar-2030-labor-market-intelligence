import { Cover } from "@/components/story/Cover";
import { Ch1Country } from "@/components/story/Ch1Country";
import { Ch2Futures } from "@/components/story/Ch2Futures";
import { Ch3Strategy } from "@/components/story/Ch3Strategy";
import { Ch4Market } from "@/components/story/Ch4Market";
import { Ch5Gap } from "@/components/story/Ch5Gap";
import { Ch6Matrix } from "@/components/story/Ch6Matrix";
import { Ch7SafeBets } from "@/components/story/Ch7SafeBets";
import { Ch8Talent } from "@/components/story/Ch8Talent";
import { Ch9Manara } from "@/components/story/Ch9Manara";
import { Ch10Explore } from "@/components/story/Ch10Explore";
import { ChapterNav, ProgressBar } from "@/components/story/ChapterNav";

export default function StoryPage() {
  return (
    <>
      <ProgressBar />
      <ChapterNav />
      <Cover />
      <Ch1Country />
      <Ch2Futures />
      <Ch3Strategy />
      <Ch4Market />
      <Ch5Gap />
      <Ch6Matrix />
      <Ch7SafeBets />
      <Ch8Talent />
      <Ch9Manara />
      <Ch10Explore />
    </>
  );
}
