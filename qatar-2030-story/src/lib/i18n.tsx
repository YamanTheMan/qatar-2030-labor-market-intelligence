"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

/** Arabic is provided for chapter titles, standfirsts and the glossary only (charts stay in English). */
export const CHAPTERS = [
  { id: "cover", n: 0, en: "Qatar is building a 2030 economy. Is it hiring for it?", ar: "قطر تبني اقتصاد 2030. فهل توظّف من أجله؟", navEn: "Start", navAr: "البداية" },
  { id: "country", n: 1, en: "The country in one screen", ar: "البلد في شاشة واحدة", navEn: "The country", navAr: "البلد" },
  { id: "futures", n: 2, en: "Five futures", ar: "خمسة مستقبلات محتملة", navEn: "Five futures", navAr: "خمسة مستقبلات" },
  { id: "strategy", n: 3, en: "What the strategy asks for", ar: "ما تطلبه الاستراتيجيات", navEn: "Strategy", navAr: "الاستراتيجية" },
  { id: "market", n: 4, en: "What employers are hiring for today", ar: "ما يوظّف له أصحاب العمل اليوم", navEn: "Hiring today", navAr: "التوظيف اليوم" },
  { id: "gap", n: 5, en: "The gap", ar: "الفجوة", navEn: "The gap", navAr: "الفجوة" },
  { id: "where", n: 6, en: "Where it hurts most", ar: "أين تشتدّ الفجوة", navEn: "Where", navAr: "أين" },
  { id: "safe-bets", n: 7, en: "Safe bets", ar: "رهانات آمنة", navEn: "Safe bets", navAr: "رهانات آمنة" },
  { id: "talent", n: 8, en: "The Qatari talent lens", ar: "من منظور الكفاءات القطرية", navEn: "Qatari talent", navAr: "الكفاءات القطرية" },
  { id: "manara", n: 9, en: "What this means for Manara", ar: "ماذا يعني ذلك لمبادرة منارة", navEn: "For Manara", navAr: "لمنارة" },
  { id: "explore", n: 10, en: "Explore the evidence yourself", ar: "استكشف الأدلة بنفسك", navEn: "Explore", navAr: "استكشف" },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]["id"];

export const STANDFIRSTS: Record<ChapterId, { en: string; ar: string }> = {
  cover: {
    en: "Qatar's national strategies describe the skills a diversified, knowledge-based economy will need by 2030. We read 33 of those publications, compared them with what employers in Qatar advertise for today, and tested the result against five possible futures.",
    ar: "ترسم الاستراتيجيات الوطنية في قطر المهارات التي يحتاجها اقتصاد متنوّع قائم على المعرفة بحلول 2030. قرأنا 33 من هذه المنشورات، وقارنّاها بما يعلن عنه أصحاب العمل في قطر اليوم، واختبرنا النتيجة في خمسة مستقبلات محتملة.",
  },
  country: {
    en: "A small national workforce, a very large expatriate one, and a plan to move Qataris into private-sector careers.",
    ar: "قوى عاملة وطنية صغيرة، وقوى عاملة وافدة كبيرة جدًا، وخطة لنقل القطريين إلى مسارات مهنية في القطاع الخاص.",
  },
  futures: {
    en: "We don't know which Qatar arrives in 2030, so we tested five.",
    ar: "لا نعرف أيّ قطر ستصل إلى عام 2030، لذلك اختبرنا خمسة احتمالات.",
  },
  strategy: {
    en: "33 publication records, 321 pieces of evidence: what Qatar's plans and the world's analysts say the workforce will need.",
    ar: "33 سجلًّا لمنشورات و321 دليلًا: ما تقوله خطط قطر والمحلّلون الدوليون عن احتياجات القوى العاملة.",
  },
  market: {
    en: "1,848 classified job ads show who is hiring in Qatar, and for what.",
    ar: "تُظهر 1,848 إعلان وظيفة مصنّفًا من يوظّف في قطر، ولأيّ وظائف.",
  },
  gap: {
    en: "Put the two side by side and a pattern appears: strategy runs ahead of hiring, and digital skills most of all.",
    ar: "عند وضع الجانبين جنبًا إلى جنب يظهر نمط واضح: الاستراتيجية تسبق التوظيف، والمهارات الرقمية قبل كل شيء.",
  },
  where: {
    en: "Average shortfall for every sector in every future.",
    ar: "متوسط العجز لكل قطاع في كل مستقبل.",
  },
  "safe-bets": {
    en: "Skills that are short in several futures are needed whichever way 2030 turns out.",
    ar: "المهارات التي تعاني عجزًا في عدة مستقبلات مطلوبة أيًّا كان شكل 2030.",
  },
  talent: {
    en: "Three in four shortfalls are flagged as a priority for developing Qatari nationals.",
    ar: "ثلاثة من كل أربعة مواطن عجز مصنّفة أولويةً لتنمية الكفاءات القطرية.",
  },
  manara: {
    en: "Ten moves, derived from the data, grouped by when they are needed.",
    ar: "عشر خطوات مستخلصة من البيانات، مرتّبة بحسب توقيت الحاجة إليها.",
  },
  explore: {
    en: "Every number in this story can be reproduced and downloaded.",
    ar: "يمكن إعادة إنتاج كل رقم في هذه القصة وتنزيله.",
  },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}
const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lang");
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("lang", l);
    } catch {
      /* storage unavailable */
    }
  }, []);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Renders English or Arabic text; Arabic gets dir="rtl" + the Arabic font. */
export function Bi({ en, ar, as: Tag = "span", className }: { en: ReactNode; ar: ReactNode; as?: "span" | "h1" | "h2" | "h3" | "p" | "div"; className?: string }) {
  const { lang } = useLang();
  if (lang === "ar")
    return (
      <Tag dir="rtl" lang="ar" className={`font-arabic ${className ?? ""}`}>
        {ar}
      </Tag>
    );
  return <Tag className={className}>{en}</Tag>;
}
