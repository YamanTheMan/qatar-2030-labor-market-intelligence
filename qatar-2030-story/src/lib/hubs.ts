/**
 * Reference layer: Qatar's main economic hubs and who is based there.
 *
 * The capstone dataset has NO location or employer column: it is sector × future × skill.
 * To put it on a map we link each hub to the sectors it hosts and, where a hub is
 * specialised, to the skills whose name contains one of a few keywords. The link is a
 * transparent rule (shown on /methodology), not a count of jobs at a site.
 *
 * Coordinates were checked against OpenStreetMap (Nominatim) on 2026-11-10; Al Kharsaah
 * comes from the plant's Wikipedia and Global Energy Monitor entries.
 */
import type { SectorId } from "./meta";
import type { GapRow } from "./types";

export type HubKind = "energy" | "knowledge" | "technology" | "health" | "finance" | "logistics" | "culture" | "city";

export const HUB_KINDS: Record<HubKind, string> = {
  energy: "Energy & industry",
  knowledge: "Education & research",
  technology: "Technology",
  health: "Healthcare",
  finance: "Finance & government",
  logistics: "Trade & logistics",
  culture: "Culture, tourism & sport",
  city: "City district",
};

/** No `keywords` means every skill in that sector is linked. */
export interface HubLink {
  sector: SectorId;
  keywords?: string[];
}

export interface Hub {
  id: string;
  name: string;
  short: string;
  /** Who is there, in a few words: the second line of the map label. Drawn from `anchors`. */
  tag: string;
  kind: HubKind;
  municipality: string;
  lat: number;
  lng: number;
  blurb: string;
  /** Organisations and facilities based at the hub. */
  anchors: string[];
  links: HubLink[];
}

export const HUBS: Hub[] = [
  {
    id: "ras-laffan",
    name: "Ras Laffan Industrial City",
    short: "Ras Laffan",
    tag: "QatarEnergy LNG · Pearl GTL",
    kind: "energy",
    municipality: "Al Khor and Al Thakhira",
    lat: 25.8977,
    lng: 51.5332,
    blurb: "The centre of Qatar's gas industry and its LNG export port, and the landing point of the North Field expansion.",
    anchors: ["QatarEnergy LNG", "North Field expansion projects", "Pearl GTL (QatarEnergy · Shell)", "ORYX GTL", "Dolphin Energy", "Ras Laffan Port"],
    links: [
      { sector: "energy_lng", keywords: ["lng", "carbon", "technical operations", "advanced energy operations", "energy operations management", "digital energy", "energy transition technologies"] },
      { sector: "cross_sector", keywords: ["energy transition"] },
    ],
  },
  {
    id: "mesaieed",
    name: "Mesaieed Industrial City",
    short: "Mesaieed",
    tag: "QAPCO · QAFCO · Qatar Steel",
    kind: "energy",
    municipality: "Al Wakrah",
    lat: 24.975,
    lng: 51.565,
    blurb: "Petrochemicals, fertiliser, steel and aluminium on the south-east coast, and the site of the blue ammonia project.",
    anchors: ["QAPCO", "QAFCO", "Qatar Steel", "Q-Chem", "Qatalum", "QatarEnergy refinery", "Mesaieed Port"],
    links: [
      { sector: "energy_lng", keywords: ["hydrogen", "carbon", "technical operations", "advanced energy operations", "energy operations management", "energy transition technologies"] },
      { sector: "cross_sector", keywords: ["energy transition", "environmental management"] },
    ],
  },
  {
    id: "dukhan",
    name: "Dukhan",
    short: "Dukhan",
    tag: "QatarEnergy onshore field",
    kind: "energy",
    municipality: "Al Shahaniya",
    lat: 25.4189,
    lng: 50.7876,
    blurb: "Qatar's onshore oil and gas field on the west coast, run by QatarEnergy since the first well in 1939.",
    anchors: ["QatarEnergy Dukhan operations", "Dukhan field"],
    links: [{ sector: "energy_lng", keywords: ["technical operations", "advanced energy operations", "energy operations management", "digital energy"] }],
  },
  {
    id: "al-kharsaah",
    name: "Al Kharsaah Solar Power Plant",
    short: "Al Kharsaah",
    tag: "Siraj Energy solar plant",
    kind: "energy",
    municipality: "Al Shahaniya",
    lat: 25.2396,
    lng: 51.0154,
    blurb: "Qatar's first utility-scale solar plant: 800 MWp, about 80 km west of Doha, inaugurated in October 2022.",
    anchors: ["Siraj Energy (QatarEnergy · QEWC)", "TotalEnergies", "Marubeni", "Kahramaa (power buyer)"],
    links: [
      { sector: "energy_lng", keywords: ["renewable", "clean energy", "green hydrogen", "energy transition planning"] },
      { sector: "technology_digital", keywords: ["smart grid"] },
    ],
  },
  {
    id: "education-city",
    name: "Education City",
    short: "Education City",
    tag: "Qatar Foundation · HBKU · CMU-Q",
    kind: "knowledge",
    municipality: "Al Rayyan",
    lat: 25.3175,
    lng: 51.4362,
    blurb: "Qatar Foundation's campus of universities, research institutes and schools, home to the client of this study.",
    anchors: ["Qatar Foundation", "Hamad Bin Khalifa University", "Carnegie Mellon University in Qatar", "Georgetown University in Qatar", "Northwestern University in Qatar", "Weill Cornell Medicine-Qatar", "Qatar National Library"],
    links: [
      { sector: "education" },
      { sector: "technology_digital", keywords: ["research", "educational technology", "learning technology", "knowledge economy", "ai ethics"] },
      { sector: "cross_sector", keywords: ["research", "innovation commercialization", "entrepreneurship education", "ai policy"] },
    ],
  },
  {
    id: "qstp",
    name: "Qatar Science & Technology Park",
    short: "QSTP",
    tag: "Technology park · start-ups · R&D",
    kind: "technology",
    municipality: "Al Rayyan",
    lat: 25.3253,
    lng: 51.4374,
    blurb: "Qatar Foundation's technology park and free zone inside Education City: start-ups, incubators and corporate R&D centres.",
    anchors: ["Qatar Science & Technology Park", "QSTP incubator and accelerator programmes", "Corporate R&D centres", "Tech start-ups"],
    links: [{ sector: "technology_digital" }, { sector: "cross_sector", keywords: ["research and development", "innovation"] }],
  },
  {
    id: "qatar-university",
    name: "Qatar University",
    short: "Qatar University",
    tag: "Qatar University · UDST nearby",
    kind: "knowledge",
    municipality: "Doha",
    lat: 25.372,
    lng: 51.488,
    blurb: "The national university and the largest source of Qatari graduates, with UDST a few kilometres to the south.",
    anchors: ["Qatar University", "QU research centres", "University of Doha for Science and Technology (nearby)"],
    links: [
      { sector: "education" },
      { sector: "technology_digital", keywords: ["digital reskilling", "educational technology", "learning technology"] },
      { sector: "cross_sector", keywords: ["research methodology", "entrepreneurship education"] },
    ],
  },
  {
    id: "msheireb",
    name: "Msheireb Downtown Doha",
    short: "Msheireb",
    tag: "Msheireb Properties · smart district",
    kind: "city",
    municipality: "Doha",
    lat: 25.286,
    lng: 51.5265,
    blurb: "The regenerated city centre: a smart, sustainably built district of offices, museums and homes.",
    anchors: ["Msheireb Properties", "Msheireb Museums", "Smart-city operations centre", "QFC designated offices"],
    links: [
      { sector: "technology_digital", keywords: ["digital infrastructure", "digital transformation"] },
      { sector: "construction_real_estate", keywords: ["green construction", "sustainable construction"] },
      { sector: "cross_sector", keywords: ["sustainability", "digital governance", "digital marketing"] },
    ],
  },
  {
    id: "west-bay",
    name: "West Bay business district",
    short: "West Bay",
    tag: "QFC · QatarEnergy HQ · banks",
    kind: "finance",
    municipality: "Doha",
    lat: 25.3229,
    lng: 51.533,
    blurb: "Doha's tower district: banks, the Qatar Financial Centre, energy and telecom headquarters, ministries and embassies.",
    anchors: ["Qatar Financial Centre", "QatarEnergy headquarters", "Qatar Investment Authority", "Ooredoo", "Commercial Bank", "Doha Bank", "Doha Exhibition & Convention Center"],
    links: [
      { sector: "finance_banking" },
      { sector: "cross_sector", keywords: ["regulatory", "international business", "diplomatic", "strategic communications", "management consulting", "international partnerships", "ai policy", "institutional", "transparency", "expenditure", "digital governance", "multilingual"] },
    ],
  },
  {
    id: "lusail",
    name: "Lusail City",
    short: "Lusail",
    tag: "Qatari Diar · Lusail Stadium",
    kind: "city",
    municipality: "Al Daayen",
    lat: 25.4229,
    lng: 51.5197,
    blurb: "Qatar's newest city, north of Doha: a planned waterfront development of offices, hotels, homes and the national stadium.",
    anchors: ["Qatari Diar (master developer)", "Lusail Stadium", "Lusail Boulevard and Marina District", "Katara Towers", "Place Vendôme"],
    links: [
      { sector: "construction_real_estate" },
      { sector: "finance_banking", keywords: ["investment", "capital markets", "sustainable finance"] },
      { sector: "tourism_hospitality", keywords: ["hospitality", "business events", "digital tourism", "sustainable tourism"] },
    ],
  },
  {
    id: "hmc",
    name: "Hamad Medical City",
    short: "Hamad Medical City",
    tag: "Hamad Medical Corporation",
    kind: "health",
    municipality: "Doha",
    lat: 25.2952,
    lng: 51.5016,
    blurb: "The main public hospital campus: general, cancer, heart, women's and rehabilitation hospitals on one site.",
    anchors: ["Hamad Medical Corporation", "Hamad General Hospital", "National Center for Cancer Care & Research", "Women's Wellness and Research Center", "Qatar Rehabilitation Institute", "Heart Hospital"],
    links: [{ sector: "healthcare" }],
  },
  {
    id: "sidra",
    name: "Sidra Medicine",
    short: "Sidra Medicine",
    tag: "Sidra Medicine · research",
    kind: "health",
    municipality: "Al Rayyan",
    lat: 25.3226,
    lng: 51.4448,
    blurb: "Qatar Foundation's women's and children's hospital and biomedical research centre in Education City.",
    anchors: ["Sidra Medicine", "Sidra research branch", "Weill Cornell Medicine-Qatar (teaching partner)"],
    links: [
      { sector: "healthcare", keywords: ["pediatric", "precision", "clinical research", "healthcare innovation", "specialized", "specialization", "advanced medical specialties", "medical education", "digital health"] },
      { sector: "technology_digital", keywords: ["health informatics", "biotechnology"] },
    ],
  },
  {
    id: "aspire",
    name: "Aspire Zone",
    short: "Aspire Zone",
    tag: "Aspire Academy · Aspetar",
    kind: "culture",
    municipality: "Al Rayyan",
    lat: 25.2644,
    lng: 51.4453,
    blurb: "Doha's sports city: the national academy, a sports-medicine hospital, Khalifa International Stadium and event venues.",
    anchors: ["Aspire Academy", "Aspetar sports medicine hospital", "Khalifa International Stadium", "The Torch Doha", "3-2-1 Qatar Olympic and Sports Museum"],
    links: [
      { sector: "tourism_hospitality", keywords: ["business events", "hospitality", "digital tourism"] },
      { sector: "healthcare", keywords: ["specialized medical", "specialized clinical"] },
    ],
  },
  {
    id: "hia",
    name: "Hamad International Airport & Ras Bufontas Free Zone",
    short: "Airport & free zone",
    tag: "Qatar Airways · Hamad Airport",
    kind: "logistics",
    municipality: "Doha",
    lat: 25.2749,
    lng: 51.6125,
    blurb: "The national airport and Qatar Airways' hub, with the Ras Bufontas free zone for logistics and technology firms next door.",
    anchors: ["Hamad International Airport", "Qatar Airways", "Qatar Airways Cargo", "Qatar Duty Free", "Qatar Free Zones Authority · Ras Bufontas"],
    links: [
      { sector: "cross_sector", keywords: ["logistics", "supply chain", "trade facilitation", "international business", "multilingual"] },
      { sector: "tourism_hospitality", keywords: ["hospitality", "digital tourism"] },
      { sector: "construction_real_estate", keywords: ["logistics infrastructure"] },
    ],
  },
  {
    id: "hamad-port",
    name: "Hamad Port & Umm Alhoul Free Zone",
    short: "Hamad Port",
    tag: "Mwani Qatar · QTerminals",
    kind: "logistics",
    municipality: "Al Wakrah",
    lat: 25.0217,
    lng: 51.5903,
    blurb: "Qatar's main seaport and container terminal, with the Umm Alhoul free zone for maritime and industrial firms.",
    anchors: ["Mwani Qatar", "QTerminals", "Milaha", "Qatar Free Zones Authority · Umm Alhoul"],
    links: [
      { sector: "cross_sector", keywords: ["logistics", "supply chain", "trade facilitation", "regulatory compliance"] },
      { sector: "construction_real_estate", keywords: ["logistics infrastructure"] },
    ],
  },
  {
    id: "katara",
    name: "Katara Cultural Village",
    short: "Katara",
    tag: "Katara Cultural Village",
    kind: "culture",
    municipality: "Doha",
    lat: 25.3609,
    lng: 51.5247,
    blurb: "Theatres, galleries, an opera house and a beach between West Bay and The Pearl, with festivals through the year.",
    anchors: ["Katara Cultural Village Foundation", "Katara Opera House", "Katara Amphitheatre", "Festival and events venues"],
    links: [
      { sector: "tourism_hospitality", keywords: ["cultural", "sustainable tourism", "business events"] },
      { sector: "cross_sector", keywords: ["cultural analysis", "multilingual"] },
    ],
  },
  {
    id: "corniche",
    name: "Corniche museums & Souq Waqif",
    short: "Museums & Souq",
    tag: "Qatar Museums · Souq Waqif",
    kind: "culture",
    municipality: "Doha",
    lat: 25.2905,
    lng: 51.541,
    blurb: "The historic waterfront: the Museum of Islamic Art, the National Museum of Qatar, Souq Waqif and the cruise terminal.",
    anchors: ["Qatar Museums", "Museum of Islamic Art", "National Museum of Qatar", "Souq Waqif", "Doha Port cruise terminal"],
    links: [
      { sector: "tourism_hospitality", keywords: ["cultural", "digital tourism", "hospitality", "sustainable tourism"] },
      { sector: "cross_sector", keywords: ["cultural analysis"] },
    ],
  },
];

export const hubById = new Map(HUBS.map((h) => [h.id, h]));

/** Bounding box of Qatar (Natural Earth 1:10m), used for the default map view. */
export const QATAR_BOUNDS: [[number, number], [number, number]] = [
  [50.72, 24.47],
  [51.7, 26.2],
];

/** Quick views offered above the map. */
export const MAP_VIEWS = [
  { id: "qatar", label: "All Qatar", center: [51.2, 25.33] as [number, number], zoom: 8.2 },
  { id: "doha", label: "Doha & Al Rayyan", center: [51.5, 25.32] as [number, number], zoom: 10.7 },
  { id: "north", label: "North", center: [51.45, 25.83] as [number, number], zoom: 9.9 },
  { id: "south", label: "South", center: [51.57, 25.02] as [number, number], zoom: 10.4 },
  { id: "west", label: "West", center: [50.95, 25.33] as [number, number], zoom: 9.7 },
] as const;

type RowKey = Pick<GapRow, "sector" | "skillKey">;

/** Keywords are lower-case; skill keys keep their acronyms (LNG, AI), so compare in lower case. */
export function hubLinksRow(hub: Hub, row: RowKey): boolean {
  const key = row.skillKey.toLowerCase();
  for (const l of hub.links) {
    if (l.sector !== row.sector) continue;
    if (!l.keywords) return true;
    for (const k of l.keywords) if (key.includes(k)) return true;
  }
  return false;
}

export function rowsForHub<T extends RowKey>(hub: Hub, rows: T[]): T[] {
  return rows.filter((r) => hubLinksRow(hub, r));
}

/** Hubs a row is linked to (empty = a nationwide skill, not tied to a place). */
export function hubsForRow(row: RowKey): Hub[] {
  return HUBS.filter((h) => hubLinksRow(h, row));
}

export function hubSectors(hub: Hub): SectorId[] {
  return [...new Set(hub.links.map((l) => l.sector))];
}
