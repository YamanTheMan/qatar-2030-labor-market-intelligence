/**
 * Single source of truth for every code → human label mapping, and for the
 * categorical colour systems. Imported by the data pipeline (scripts/) and the app.
 * Nothing in here is data-derived; it is editorial metadata.
 */

export const SCENARIO_IDS = ["S1", "S2", "S3", "S4", "S5"] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const SECTOR_IDS = [
  "technology_digital",
  "healthcare",
  "energy_lng",
  "education",
  "cross_sector",
  "finance_banking",
  "tourism_hospitality",
  "construction_real_estate",
] as const;
export type SectorId = (typeof SECTOR_IDS)[number];

export const PRIORITY_IDS = ["high", "medium", "low"] as const;
export type PriorityId = (typeof PRIORITY_IDS)[number];

export const HORIZON_IDS = ["near_term", "medium_term", "both"] as const;
export type HorizonId = (typeof HORIZON_IDS)[number];

export const QUALITY_IDS = ["high", "medium", "low"] as const;
export type QualityId = (typeof QUALITY_IDS)[number];

export interface ScenarioMeta {
  id: ScenarioId;
  name: string;
  short: string;
  subtitle: string;
  vignette: string;
  /** fill colour (charts) */
  color: string;
  /** darker variant that passes WCAG AA as text on paper */
  ink: string;
}

/**
 * Scenario palette — muted Okabe-Ito derivatives. Used ONLY for scenarios.
 * Chosen to stay clear of Qatar maroon (shortfall), gold (Qatari priority)
 * and slate (covered).
 */
export const SCENARIOS: Record<ScenarioId, ScenarioMeta> = {
  S1: {
    id: "S1",
    name: "Diversification Acceleration",
    short: "Diversification",
    subtitle: "The National Vision stays on track; every sector grows.",
    vignette:
      "Doha in 2030 looks like the plan: finance, tourism, health and technology all expand alongside gas, and private firms compete for skilled Qatari graduates. This is the baseline future and the best-evidenced one.",
    color: "#2F6DB0",
    ink: "#245A93",
  },
  S2: {
    id: "S2",
    name: "Hydrocarbon Dominance",
    short: "Hydrocarbon",
    subtitle: "Gas pays for everything a while longer.",
    vignette:
      "The North Field expansion carries the economy. Diversification slows, the energy sector absorbs engineers and operators, and LNG operations, carbon capture and plant safety become the scarce skills.",
    color: "#C8611F",
    ink: "#9C4712",
  },
  S3: {
    id: "S3",
    name: "Green Transition Pressure",
    short: "Green transition",
    subtitle: "Decarbonisation arrives faster than planned.",
    vignette:
      "Buyers of Qatari gas demand lower-carbon supply, and climate rules tighten. Clean-energy integration, hydrogen and carbon management move from pilots to payroll, and every sector needs digital and data skills to measure emissions.",
    color: "#1E8A63",
    ink: "#17704F",
  },
  S4: {
    id: "S4",
    name: "Knowledge Economy Leap",
    short: "Knowledge economy",
    subtitle: "Qatar becomes a research and AI hub.",
    vignette:
      "Education City, the Qatar Science & Technology Park and university labs become the growth engine. AI research, biotechnology and innovation commercialisation lead, and schools redesign teaching around AI.",
    color: "#8A55A6",
    ink: "#744690",
  },
  S5: {
    id: "S5",
    name: "Regional Hub & Geopolitical Pivot",
    short: "Regional hub",
    subtitle: "Qatar as the Gulf's logistics, finance and diplomacy centre.",
    vignette:
      "Ports, free zones and Hamad International Airport turn Qatar into a regional switchboard. Logistics analytics, trade facilitation, Islamic finance and diplomatic communication are the skills in demand.",
    color: "#3C97C9",
    ink: "#21719C",
  },
};

export interface SectorMeta {
  id: SectorId;
  label: string;
  short: string;
  /** low-saturation, sector-only palette */
  color: string;
}

export const SECTORS: Record<SectorId, SectorMeta> = {
  technology_digital: { id: "technology_digital", label: "Technology & Digital", short: "Technology", color: "#55627A" },
  healthcare: { id: "healthcare", label: "Healthcare", short: "Healthcare", color: "#6F978A" },
  energy_lng: { id: "energy_lng", label: "Energy & LNG", short: "Energy", color: "#9A7B4D" },
  education: { id: "education", label: "Education", short: "Education", color: "#8E7590" },
  cross_sector: { id: "cross_sector", label: "Cross-sector", short: "Cross-sector", color: "#8B8778" },
  finance_banking: { id: "finance_banking", label: "Finance & Banking", short: "Finance", color: "#6B8458" },
  tourism_hospitality: { id: "tourism_hospitality", label: "Tourism & Hospitality", short: "Tourism", color: "#B08A6A" },
  construction_real_estate: { id: "construction_real_estate", label: "Construction & Real Estate", short: "Construction", color: "#7C6F64" },
};

export const PRIORITY_LABELS: Record<PriorityId, string> = {
  high: "Priority for Qatari talent",
  medium: "Relevant for Qatari talent",
  low: "General workforce need",
};
export const PRIORITY_SHORT: Record<PriorityId, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export const HORIZON_LABELS: Record<HorizonId, string> = {
  near_term: "Next 2–3 years",
  medium_term: "By 2030",
  both: "Now and through 2030",
};

export const QUALITY_LABELS: Record<QualityId, string> = {
  high: "High-quality evidence",
  medium: "Medium-quality evidence",
  low: "Lower-quality evidence",
};

export const DIRECTION_LABELS: Record<string, string> = {
  strong_increase: "Strong increase",
  moderate_increase: "Moderate increase",
  stable: "Stable",
  moderate_decrease: "Moderate decrease",
  strong_decrease: "Strong decrease",
};

/** Publisher type, used to group the source library. Every source id must be mapped (tested). */
export const PUBLISHER_GROUPS = {
  gov: "Qatar government",
  qf: "Qatar Foundation entities",
  intl: "International organisations",
  private: "Consultancies, banks & think tanks",
} as const;
export type PublisherGroup = keyof typeof PUBLISHER_GROUPS;

export const SOURCE_GROUP: Record<string, PublisherGroup> = {
  QNV2030: "gov",
  QNDS2: "gov",
  QNDS3: "gov",
  QATAR_NHDS_2024: "gov",
  QATAR_TOURISM_2030: "gov",
  MDPS_LFS_2023: "gov",
  QATARIZATION_POLICY: "gov",
  QFZA_TECH_2024: "gov",
  QATAR_LOGISTICS_2030: "gov",
  QF_EDU_STRATEGY: "qf",
  QF_EDU_WEBSITE: "qf",
  QF_HIGHER_ED_STRATEGY: "qf",
  HBKU_STRATEGY: "qf",
  SIDRA_STRATEGY: "qf",
  QSTP_INNOVATION: "qf",
  WB_QATAR_2024: "intl",
  WB_MENA_JOBS_2023: "intl",
  IEA_GAS_OUTLOOK_2024: "intl",
  WEF_FUTURE_JOBS_2023: "intl",
  WEF_RESKILLING_2024: "intl",
  ILO_QATAR_LABOUR_2023: "intl",
  IRENA_ENERGY_TRANSITION: "intl",
  OECD_AI_SKILLS_2023: "intl",
  UNESCO_AI_EDUCATION: "intl",
  GS_GULF_VISION_2024: "private",
  MS_MENA_OUTLOOK_2024: "private",
  MCK_FUTURE_WORK_GCC: "private",
  KEARNEY_GCC_TALENT: "private",
  STRATEGY_AND_GCC_DIGITAL: "private",
  OXFORD_ECONOMICS_GCC: "private",
  DELOITTE_GCC_SERVICES: "private",
  RAND_QATAR_WORKFORCE: "private",
  BROOKINGS_QATAR_SOFT_POWER: "private",
};

/** Short display names for publications (tiles, chips). */
export const SOURCE_SHORT: Record<string, string> = {
  QNV2030: "Qatar National Vision 2030",
  QNDS2: "NDS3 (record A)",
  QNDS3: "NDS3 (record B)",
  QATAR_NHDS_2024: "National Health Strategy",
  QATAR_TOURISM_2030: "Tourism Strategy 2030",
  MDPS_LFS_2023: "Labour Force Survey 2023",
  QATARIZATION_POLICY: "Qatarization Policy",
  QFZA_TECH_2024: "QFZA Technology",
  QATAR_LOGISTICS_2030: "Logistics Strategy 2030",
  QF_EDU_STRATEGY: "QF Education (2023)",
  QF_EDU_WEBSITE: "QF Education (2024)",
  QF_HIGHER_ED_STRATEGY: "QF Higher Education",
  HBKU_STRATEGY: "HBKU Strategy",
  SIDRA_STRATEGY: "Sidra Medicine",
  QSTP_INNOVATION: "QSTP Innovation",
  WB_QATAR_2024: "World Bank Qatar",
  WB_MENA_JOBS_2023: "World Bank MENA Jobs",
  IEA_GAS_OUTLOOK_2024: "IEA Gas Report",
  WEF_FUTURE_JOBS_2023: "WEF Future of Jobs",
  WEF_RESKILLING_2024: "WEF Skills First",
  ILO_QATAR_LABOUR_2023: "ILO Qatar Labour",
  IRENA_ENERGY_TRANSITION: "IRENA Jobs Review",
  OECD_AI_SKILLS_2023: "OECD AI & Skills",
  UNESCO_AI_EDUCATION: "UNESCO AI in Education",
  GS_GULF_VISION_2024: "Goldman Sachs",
  MS_MENA_OUTLOOK_2024: "Morgan Stanley",
  MCK_FUTURE_WORK_GCC: "McKinsey GCC",
  KEARNEY_GCC_TALENT: "Kearney GCC Talent",
  STRATEGY_AND_GCC_DIGITAL: "Strategy& Digital",
  OXFORD_ECONOMICS_GCC: "Oxford Economics",
  DELOITTE_GCC_SERVICES: "Deloitte GCC",
  RAND_QATAR_WORKFORCE: "RAND Qatar",
  BROOKINGS_QATAR_SOFT_POWER: "Brookings Doha",
};

/**
 * Skill families — a transparent keyword rule (first match wins) used only to
 * group related skill categories for the "safe bets" theme view.
 */
export const FAMILIES = {
  digital: { label: "Digital, data & AI", pattern: /\b(digital|data|ai|artificial intelligence|machine learning|cyber\w*|automation|analytics|software|cloud|fintech|technology|informatics|smart)\b/i },
  energy: { label: "Energy & green transition", pattern: /(energy|green|hydrogen|carbon|ccus|renewable|sustainab|climate|lng|decarboni|environment)/i },
  research: { label: "Research & innovation", pattern: /(research|innovation|commerciali|biotech|r&d)/i },
  health: { label: "Health & care", pattern: /(health|medical|clinical|patient|nursing|genomic|care\b)/i },
  education: { label: "Teaching & learning", pattern: /(education|pedagog|curriculum|teaching|learning|assessment|training)/i },
  leadership: { label: "Leadership & management", pattern: /(leader|management|governance|consult|strategic|project|business|entrepreneur)/i },
  other: { label: "Other specialist skills", pattern: /.*/ },
} as const;
export type FamilyId = keyof typeof FAMILIES;
export const FAMILY_IDS = Object.keys(FAMILIES) as FamilyId[];

export function familyOf(skill: string): FamilyId {
  for (const id of FAMILY_IDS) {
    if (FAMILIES[id].pattern.test(skill)) return id;
  }
  return "other";
}

/** Job-function families for the posting-mix chart (first match wins). */
export const FUNCTION_FAMILIES: { id: string; label: string; pattern: RegExp }[] = [
  { id: "it", label: "IT & digital", pattern: /information technology|data|software/i },
  { id: "health", label: "Clinical & health care", pattern: /health care|medical|nurs/i },
  { id: "research", label: "Research & science", pattern: /research|science/i },
  { id: "engineering", label: "Engineering", pattern: /engineering/i },
  { id: "finance", label: "Finance & accounting", pattern: /finance|accounting|audit/i },
  { id: "sales", label: "Sales, marketing & business development", pattern: /sales|marketing|business development|advertising/i },
  { id: "hr", label: "Human resources", pattern: /human resources/i },
  { id: "admin", label: "Administrative", pattern: /administrative/i },
  { id: "education", label: "Education & training", pattern: /education|training/i },
  { id: "management", label: "Management & operations", pattern: /management|manufacturing|production|supply chain|purchasing|distribution|strategy/i },
  { id: "unspecified", label: "Unspecified (“Other”)", pattern: /^other$/i },
  { id: "rest", label: "All other functions", pattern: /.*/ },
];

export function functionFamilyOf(fn: string): string {
  return FUNCTION_FAMILIES.find((f) => f.pattern.test(fn.trim()))!.id;
}

/**
 * In every row of scenario_gap_analysis.csv, gap_score = calibration_score − 2 × posting_freq
 * (max residual 0.00005 across 280 rows). The original dashboard described it as a plain
 * difference; we disclose the factor and show the "market signal" as 2 × posting share.
 */
export const MARKET_WEIGHT = 2;

/** Display banding for shortfall values (story + explorer, cells and rows). */
export const BANDS = [
  { id: "severe", label: "Severe", min: 0.15 },
  { id: "notable", label: "Notable", min: 0.05 },
  { id: "aligned", label: "Aligned", min: -0.05 },
  { id: "covered", label: "Covered", min: -Infinity },
] as const;
export type BandId = (typeof BANDS)[number]["id"];

export function bandOf(v: number): BandId {
  for (const b of BANDS) if (v >= b.min) return b.id;
  return "covered";
}

/** Sentence-case a skill category without breaking acronyms (AI, LNG, CCUS…). */
export function skillLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
