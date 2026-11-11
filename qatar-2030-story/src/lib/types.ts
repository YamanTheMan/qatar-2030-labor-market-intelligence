import type {
  BandId,
  FamilyId,
  HorizonId,
  PriorityId,
  PublisherGroup,
  QualityId,
  ScenarioId,
  SectorId,
} from "./meta";

/** One (future, sector, skill) combination — the primary analytical unit. */
export interface GapRow {
  id: string;
  scenario: ScenarioId;
  sector: SectorId;
  skillKey: string;
  skill: string;
  /** calibration_score — strategic demand, 0–1 */
  strategic: number;
  /** posting_freq — share of job ads asking for the skill */
  market: number;
  /** gap_score = strategic − 2 × market */
  shortfall: number;
  band: BandId;
  pipelineLabel: string;
  priority: PriorityId;
  horizon: HorizonId;
  sources: string[];
  specificSkills: string[];
  signalCount: number;
  family: FamilyId;
}

export interface Signal {
  i: number;
  sourceId: string;
  scenario: ScenarioId;
  sector: SectorId;
  skillKey: string;
  skill: string;
  specificSkills: string[];
  direction: string;
  demandScore: number;
  rationale: string;
  quote: string;
  quality: QualityId;
  qualityWeight: number;
  scenarioWeight: number;
  weightedScore: number;
  priority: PriorityId;
  horizon: HorizonId;
}

export interface Source {
  id: string;
  title: string;
  short: string;
  publisher: string;
  year: number;
  url: string;
  quality: QualityId;
  group: PublisherGroup;
  signals: number;
  scenarios: ScenarioId[];
  sectors: SectorId[];
  /** id of another record with the identical title, if any */
  sameTitleAs: string | null;
}

export interface Weight {
  scenario: ScenarioId;
  skillKey: string;
  skill: string;
  sector: SectorId;
  totalWeighted: number;
  signalCount: number;
  avgDemand: number;
  avgQuality: number;
  sources: string[];
  penalty: number;
  adjustedWeight: number;
  normalizedWeight: number;
}

export interface Coefficient {
  scenario: ScenarioId;
  sourceId: string;
  totalWeighted: number;
  signalCount: number;
  avgQuality: number;
  avgScenarioWeight: number;
  publisher: string;
  quality: QualityId;
}

export interface PostingRow {
  sector: SectorId;
  fn: string;
  family: string;
  count: number;
  pct: number;
}

export interface MatrixCell {
  sector: SectorId;
  scenario: ScenarioId;
  avg: number | null;
  n: number;
  max: number | null;
  band: BandId | null;
}

export interface SkillAggregate {
  skillKey: string;
  skill: string;
  family: FamilyId;
  sectors: SectorId[];
  /** per scenario: shortfall (max across sectors) or null if the skill has no signal there */
  byScenario: Record<ScenarioId, number | null>;
  presentIn: number;
  shortIn: number;
  meanShortfall: number;
  maxShortfall: number;
  sumPositive: number;
  anyHigh: boolean;
  horizons: HorizonId[];
  sources: string[];
}

export interface Recommendation {
  skillKey: string;
  skill: string;
  type: "programme" | "curriculum" | "bridge" | "research";
  horizonGroup: "now" | "2030";
  action: string;
  maxShortfall: number;
  shortIn: number;
  sectors: SectorId[];
  sources: string[];
}

export interface Summary {
  /** one real evidence signal used to explain the method in Chapter 3 */
  exampleSignal: Signal;
  counts: {
    rows: number;
    shortfalls: number;
    alignedOrCovered: number;
    skills: number;
    sectors: number;
    scenarios: number;
    sourceRecords: number;
    distinctTitles: number;
    signals: number;
    signalsWithoutQuote: number;
    postingsClassified: number;
    postingsAnalysed: number;
    jobFunctions: number;
  };
  distribution: { min: number; median: number; p75: number; max: number };
  pipelineLabels: Record<string, number>;
  priority: Record<PriorityId, number>;
  horizon: Record<HorizonId, number>;
  directions: Record<string, number>;
  quality: Record<QualityId, number>;
  bySector: { sector: SectorId; avg: number; n: number; shortfalls: number; postings: number }[];
  byScenario: {
    scenario: ScenarioId;
    avg: number;
    rows: number;
    shortfalls: number;
    signals: number;
    sources: number;
    penalty: number;
    topSkills: { skill: string; weight: number; sector: SectorId }[];
  }[];
  matrix: MatrixCell[];
  top20: string[];
  overSupplied: string[];
  explainer: { big: string; covered: string };
  safeBets: SkillAggregate[];
  familyByScenario: {
    family: FamilyId;
    scenario: ScenarioId;
    rows: number;
    shortfalls: number;
    max: number | null;
    topSkill: string | null;
  }[];
  scenarioSpecific: { scenario: ScenarioId; rowIds: string[] }[];
  priorityLens: {
    highShortfalls: number;
    shortfalls: number;
    share: number;
    top: string[];
  };
  recommendations: Recommendation[];
  postings: {
    total: number;
    bySector: { sector: SectorId; count: number; share: number }[];
    byFamily: { family: string; label: string; count: number; share: number }[];
  };
  sourceGroups: Record<PublisherGroup, number>;
  topWeights: Record<ScenarioId, { skillKey: string; skill: string; sector: SectorId; weight: number; signals: number }[]>;
}

export interface ContextFact {
  id: string;
  value: string;
  label: string;
  detail?: string;
  source: string;
  url: string;
  asOf: string;
  verified: boolean;
  note?: string;
}
