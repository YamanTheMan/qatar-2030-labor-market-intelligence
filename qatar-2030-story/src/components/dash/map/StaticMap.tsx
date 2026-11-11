"use client";
import { useMemo } from "react";
import region from "@/data/geo/region.json";
import type { HubStat } from "@/lib/dash/model";
import { QATAR_BOUNDS } from "@/lib/hubs";
import { MarkerView } from "./HubPin";
import { fitCamera, layoutMarkers } from "./layout";
import { MAP_PALETTE, type MapTheme } from "./mapStyle";

interface Shape {
  properties: { name: string; home: boolean };
  geometry: { type: string; coordinates: number[][][][] };
}
const SHAPES = (region as unknown as { features: Shape[] }).features;

/**
 * The outline of Qatar and its neighbours with the same pins as the live map.
 * It is on screen while the map library loads, and stays if the browser cannot run it.
 */
export function StaticMap({
  width,
  height,
  pad,
  stats,
  selected,
  hover,
  onHover,
  onSelect,
  theme,
  pins = true,
}: {
  width: number;
  height: number;
  pad: number;
  stats: HubStat[];
  selected: string | null;
  hover: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  theme: MapTheme;
  pins?: boolean;
}) {
  const p = MAP_PALETTE[theme];
  const cam = useMemo(() => fitCamera(QATAR_BOUNDS, { w: width, h: height }, pad), [width, height, pad]);

  const paths = useMemo(
    () =>
      SHAPES.map((f) => ({
        name: f.properties.name,
        home: f.properties.home,
        d: f.geometry.coordinates
          .flatMap((poly) => poly)
          .map(
            (ring) =>
              ring
                .map(([lng, lat], i) => {
                  const [x, y] = cam.toPx(lng, lat);
                  return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join("") + "Z",
          )
          .join(""),
      })),
    [cam],
  );

  const markers = useMemo(
    () => (pins ? layoutMarkers({ stats, zoom: cam.zoom, toPx: cam.toPx, frame: { w: width, h: height }, selected, hover, groupHint: (n) => `${n} hubs` }) : []),
    [pins, stats, cam, width, height, selected, hover],
  );

  if (!width || !height) return null;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: p.sea }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0" role="img" aria-label="Outline map of Qatar and its neighbours">
        {paths
          .filter((s) => !s.home)
          .map((s) => (
            <path key={s.name} d={s.d} fill={p.landOther} stroke={p.coast} strokeWidth={1} strokeLinejoin="round" />
          ))}
        {paths
          .filter((s) => s.home)
          .map((s) => (
            <path key={s.name} d={s.d} fill={p.land} stroke={p.coast} strokeWidth={1} strokeLinejoin="round" />
          ))}
      </svg>
      {markers.map((m) => (
        <div key={m.id} className="absolute" style={{ left: m.x, top: m.y, transform: "translate(-50%, -50%)", zIndex: m.z }}>
          <MarkerView
            m={m}
            canZoom={false}
            dim={selected !== null && !m.selected}
            onHover={onHover}
            onClick={() => {
              if (m.members.length === 1) onSelect(m.selected ? null : m.members[0].hub.id);
            }}
          />
        </div>
      ))}
    </div>
  );
}
