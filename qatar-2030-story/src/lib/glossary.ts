export interface GlossaryEntry {
  term: string;
  def: string;
  technical?: string;
  termAr: string;
  defAr: string;
}

export const GLOSSARY = {
  shortfall: {
    term: "Shortfall",
    def: "How far today's hiring lags behind what Qatar's strategy documents ask for. It is strategic demand minus twice the share of job ads that mention the skill. It runs from −1 to +1, and anything above 0 means the market has not caught up yet. It is a score, not a percentage.",
    technical: "gap_score = calibration_score − 2 × posting_freq",
    termAr: "العجز",
    defAr: "مدى تأخّر التوظيف الحالي عمّا تطلبه الوثائق الاستراتيجية في قطر. يُحسب بطرح ضعف نسبة إعلانات الوظائف التي تذكر المهارة من الطلب الاستراتيجي. يتراوح بين −1 و+1، والقيمة فوق الصفر تعني أن السوق لم يلحق بعد. إنه مؤشر وليس نسبة مئوية.",
  },
  strategic: {
    term: "Strategic demand",
    def: "How strongly Qatar's strategies and expert reports call for a skill in a given future, from 0 (no source mentions it) to 1. The top skill in the best-evidenced future scores 1. Futures resting on less evidence are scaled down, so their top skill scores 0.34–0.79.",
    technical: "calibration_score = (weighted sum ÷ largest in future) × signal-count balance",
    termAr: "الطلب الاستراتيجي",
    defAr: "مدى قوة دعوة الاستراتيجيات والتقارير المتخصصة إلى مهارة ما في مستقبل معيّن، من 0 (لا يذكرها أي مصدر) إلى 1. تحصل أهم مهارة في المستقبل الأوفر أدلةً على 1، وتُخفَّض قيم المستقبلات الأقل أدلةً فلا تتجاوز أهم مهاراتها 0.34–0.79.",
  },
  market: {
    term: "Market hiring today",
    def: "The share of classified job ads in the sector that ask for the skill.",
    technical: "posting_freq (share of postings, 0–1)",
    termAr: "التوظيف في السوق اليوم",
    defAr: "نسبة إعلانات الوظائف المصنّفة ضمن القطاع التي تطلب هذه المهارة.",
  },
  priority: {
    term: "Priority for Qatari talent",
    def: "The source documents explicitly flag this skill for developing Qatari nationals (Qatarization).",
    technical: "qatarization_relevance = high",
    termAr: "أولوية للكفاءات القطرية",
    defAr: "تشير الوثائق المصدرية صراحةً إلى تنمية المواطنين القطريين في هذه المهارة (التقطير).",
  },
  importance: {
    term: "Importance within this future",
    def: "A skill's weight relative to the most important skill in the same future, from 0 to 1. It is weighted by source quality and by how relevant each source is to that future.",
    technical: "normalized_weight",
    termAr: "الأهمية ضمن هذا المستقبل",
    defAr: "وزن المهارة مقارنةً بأهم مهارة في المستقبل نفسه، من 0 إلى 1، بعد الترجيح بجودة المصدر ومدى صلته بذلك المستقبل.",
  },
  future: {
    term: "Future",
    def: "One of five plausible versions of Qatar's economy in 2030. Nobody knows which will arrive, so the analysis tests all five.",
    technical: "scenario S1–S5",
    termAr: "المستقبل",
    defAr: "واحد من خمسة أشكال محتملة لاقتصاد قطر في عام 2030. ولأن أحدًا لا يعرف أيّها سيتحقق، يختبر التحليل الخمسة جميعًا.",
  },
  signal: {
    term: "Evidence signal",
    def: "One statement in one publication that demand for a skill will rise or fall, with the quote it rests on.",
    technical: "a row of scenario_sources_raw.csv",
    termAr: "إشارة دليل",
    defAr: "عبارة واحدة في منشور واحد تفيد بأن الطلب على مهارة ما سيرتفع أو ينخفض، مع الاقتباس الذي تستند إليه.",
  },
  penalty: {
    term: "Signal-count balance",
    def: "A square-root factor that scales down futures with fewer evidence signals, so that a thinly evidenced future cannot dominate.",
    technical: "penalty = √(signals in future ÷ signals in best-evidenced future)",
    termAr: "موازنة عدد الإشارات",
    defAr: "معامل جذر تربيعي يخفّض وزن المستقبلات ذات الإشارات الأقل، حتى لا يطغى مستقبل ضعيف الأدلة.",
  },
  covered: {
    term: "Covered",
    def: "The market already hires for this skill more than the strategy emphasises it, so no intervention is needed.",
    technical: "shortfall below −0.05",
    termAr: "مُغطّاة",
    defAr: "يوظّف السوق لهذه المهارة بالفعل أكثر مما تؤكّد عليه الاستراتيجية، فلا حاجة إلى تدخّل.",
  },
  horizon: {
    term: "Time horizon",
    def: "When the sources expect the need: in the next 2–3 years, by 2030, or now and through 2030.",
    technical: "time_horizon: near_term / medium_term / both",
    termAr: "الأفق الزمني",
    defAr: "متى تتوقع المصادر الحاجة: خلال السنتين أو الثلاث المقبلة، أو بحلول 2030، أو من الآن وحتى 2030.",
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
