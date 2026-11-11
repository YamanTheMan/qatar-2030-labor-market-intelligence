/**
 * Base-map style in the dashboard's own colours, one palette per theme.
 *
 * Tiles: OpenFreeMap (OpenMapTiles schema, OpenStreetMap data), no API key.
 * `online = false` draws only the bundled Natural Earth outline, so the map still
 * shows Qatar before the first tile arrives or when the network is unavailable.
 */
import type { FilterSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";
import region from "@/data/geo/region.json";

export type MapTheme = "light" | "dark";

interface Palette {
  sea: string;
  land: string;
  landOther: string;
  coast: string;
  urban: string;
  green: string;
  road: string;
  roadMajor: string;
  building: string;
  border: string;
  borderSoft: string;
  label: string;
  labelStrong: string;
  labelFaint: string;
  halo: string;
}

export const MAP_PALETTE: Record<MapTheme, Palette> = {
  light: {
    sea: "#CEDCE7",
    land: "#F4F2ED",
    landOther: "#E9E6DF",
    coast: "#AFC3D2",
    urban: "#EAE7E0",
    green: "#DDE6D6",
    road: "#E2DED5",
    roadMajor: "#D2CDC1",
    building: "#DFDBD2",
    border: "#6F7480",
    borderSoft: "#B4AFA4",
    label: "#5A616E",
    labelStrong: "#2B303B",
    labelFaint: "#8A909C",
    halo: "#F4F2ED",
  },
  dark: {
    sea: "#0C141F",
    land: "#19202E",
    landOther: "#141A26",
    coast: "#2B3A4E",
    urban: "#1E2637",
    green: "#19272A",
    road: "#283246",
    roadMajor: "#35415A",
    building: "#222B3D",
    border: "#8D99B0",
    borderSoft: "#3C475C",
    label: "#98A3B8",
    labelStrong: "#DCE2EC",
    labelFaint: "#6F7A90",
    halo: "#141A26",
  },
};

export const TILE_SOURCE = "omt";
const TILEJSON = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

/** English or Latin-script name only: Arabic shaping would need an extra plugin. */
const NAME = ["coalesce", ["get", "name_en"], ["get", "name:latin"], ""] as unknown as string;
const REG = ["Noto Sans Regular"];
const BOLD = ["Noto Sans Bold"];

const cls = (...values: string[]) => ["match", ["get", "class"], values, true, false] as unknown as FilterSpecification;

function onlineLayers(p: Palette): LayerSpecification[] {
  const s = TILE_SOURCE;
  return [
    { id: "landcover-green", type: "fill", source: s, "source-layer": "landcover", filter: cls("grass", "wood", "wetland"), paint: { "fill-color": p.green, "fill-opacity": 0.7 } },
    { id: "park", type: "fill", source: s, "source-layer": "park", paint: { "fill-color": p.green, "fill-opacity": 0.7 } },
    {
      id: "landuse-urban",
      type: "fill",
      source: s,
      "source-layer": "landuse",
      filter: cls("residential", "commercial", "industrial", "retail"),
      paint: { "fill-color": p.urban, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.9, 13, 0.55] },
    },
    { id: "water", type: "fill", source: s, "source-layer": "water", paint: { "fill-color": p.sea } },
    {
      id: "aeroway",
      type: "line",
      source: s,
      "source-layer": "aeroway",
      minzoom: 10,
      filter: ["all", ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false], cls("runway", "taxiway")] as unknown as FilterSpecification,
      paint: { "line-color": p.roadMajor, "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 10, ["match", ["get", "class"], "runway", 1.5, 0.5], 14, ["match", ["get", "class"], "runway", 14, 3]] },
    },
    {
      id: "road-minor",
      type: "line",
      source: s,
      "source-layer": "transportation",
      minzoom: 11.5,
      filter: cls("minor", "tertiary"),
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": p.road, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 11.5, 0.4, 15, 4] },
    },
    {
      id: "road-secondary",
      type: "line",
      source: s,
      "source-layer": "transportation",
      minzoom: 8.5,
      filter: cls("secondary"),
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": p.road, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 8.5, 0.4, 15, 6] },
    },
    {
      id: "road-major",
      type: "line",
      source: s,
      "source-layer": "transportation",
      minzoom: 5,
      filter: cls("motorway", "trunk", "primary"),
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": p.roadMajor, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 6, 0.5, 10, 1.3, 15, 9] },
    },
    { id: "building", type: "fill", source: s, "source-layer": "building", minzoom: 13, paint: { "fill-color": p.building, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14.5, 0.9] } },
    {
      id: "boundary-municipal",
      type: "line",
      source: s,
      "source-layer": "boundary",
      minzoom: 7,
      filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]] as unknown as FilterSpecification,
      paint: { "line-color": p.borderSoft, "line-width": 1, "line-dasharray": [2, 2] },
    },
    {
      id: "boundary-country",
      type: "line",
      source: s,
      "source-layer": "boundary",
      filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]] as unknown as FilterSpecification,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": p.border, "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 12, 1.8], "line-dasharray": [3, 2] },
    },
    label("place-suburb", cls("suburb", "quarter", "neighbourhood"), 11.8, REG, ["interpolate", ["linear"], ["zoom"], 12, 10.5, 15, 12.5], p.labelFaint, p, { "text-transform": "uppercase", "text-letter-spacing": 0.08 }),
    label("place-village", cls("village", "hamlet"), 10.5, REG, 11, p.label, p),
    label("place-town", cls("town"), 8, REG, ["interpolate", ["linear"], ["zoom"], 8, 11, 13, 13.5], p.label, p),
    label("place-city", cls("city"), 5, BOLD, ["interpolate", ["linear"], ["zoom"], 6, 12, 12, 16], p.labelStrong, p),
    {
      ...label("place-country", cls("country"), 3, BOLD, ["interpolate", ["linear"], ["zoom"], 5, 11, 9, 13], p.labelFaint, p, { "text-transform": "uppercase", "text-letter-spacing": 0.18 }),
      maxzoom: 9.5,
    },
  ];
}

function label(
  id: string,
  filter: FilterSpecification,
  minzoom: number,
  font: string[],
  size: unknown,
  color: string,
  p: Palette,
  layout: Record<string, unknown> = {},
): LayerSpecification {
  return {
    id,
    type: "symbol",
    source: TILE_SOURCE,
    "source-layer": "place",
    minzoom,
    filter,
    layout: {
      "text-field": NAME,
      "text-font": font,
      "text-size": size,
      "text-max-width": 8,
      "text-padding": 6,
      "symbol-sort-key": ["coalesce", ["get", "rank"], 20],
      ...layout,
    },
    paint: { "text-color": color, "text-halo-color": p.halo, "text-halo-width": 1.4, "text-halo-blur": 0.4 },
  } as LayerSpecification;
}

export function buildStyle(theme: MapTheme, online: boolean): StyleSpecification {
  const p = MAP_PALETTE[theme];
  const vis = online ? "none" : "visible";
  return {
    version: 8,
    name: `q2030-${theme}`,
    glyphs: GLYPHS,
    sources: {
      region: { type: "geojson", data: region as unknown as GeoJSON.FeatureCollection },
      [TILE_SOURCE]: {
        type: "vector",
        url: TILEJSON,
        attribution: "",
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": online ? p.land : p.sea } },
      { id: "region-other", type: "fill", source: "region", filter: ["!=", ["get", "home"], true], layout: { visibility: vis }, paint: { "fill-color": p.landOther } },
      { id: "region-home", type: "fill", source: "region", filter: ["==", ["get", "home"], true], layout: { visibility: vis }, paint: { "fill-color": p.land } },
      { id: "region-coast", type: "line", source: "region", layout: { visibility: vis }, paint: { "line-color": p.coast, "line-width": 1 } },
      ...onlineLayers(p),
    ],
  };
}

/** Panning is limited to Qatar and its immediate neighbours. */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [48.4, 23.2],
  [54.2, 27.6],
];
