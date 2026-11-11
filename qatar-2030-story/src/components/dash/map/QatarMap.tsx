"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, MapSourceDataEvent, Marker as MlMarker } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { HubStat } from "@/lib/dash/model";
import { useSize } from "@/lib/hooks/useSize";
import { HUBS, MAP_VIEWS, QATAR_BOUNDS, hubById } from "@/lib/hubs";
import { Icon } from "../icons";
import { ScaleLegend, Segmented, cx, hideTip } from "../ui";
import { boundsOf, zoomBucket, zoomToSeparate } from "./cluster";
import { MarkerView } from "./HubPin";
import { layoutMarkers, type MarkerSpec } from "./layout";
import { buildStyle, MAX_BOUNDS, TILE_SOURCE, type MapTheme } from "./mapStyle";
import { StaticMap } from "./StaticMap";

type Ml = typeof import("maplibre-gl");
type ViewId = (typeof MAP_VIEWS)[number]["id"];
type View = ViewId | "custom";
type Status = "loading" | "ready" | "failed";

/** Space kept free around Qatar in the national view. */
const PAD = 28;
const LOCALE = {
  "Map.Title": "Map of Qatar's economic hubs",
  "CooperativeGesturesHandler.WindowsHelpText": "Hold Ctrl and scroll to zoom the map",
  "CooperativeGesturesHandler.MacHelpText": "Hold ⌘ and scroll to zoom the map",
  "CooperativeGesturesHandler.MobileHelpText": "Use two fingers to move the map",
};

function goTo(map: MlMap, id: ViewId, animate = true) {
  const duration = animate ? 800 : 0;
  if (id === "qatar") {
    map.fitBounds(QATAR_BOUNDS, { padding: PAD, duration, linear: true });
    return;
  }
  const v = MAP_VIEWS.find((x) => x.id === id)!;
  const box = map.getContainer();
  // the views were tuned on a 620 px map: keep the same area in sight on smaller and larger ones
  map.easeTo({ center: v.center, zoom: v.zoom + Math.log2(Math.max(240, Math.min(box.clientWidth, box.clientHeight)) / 620), duration });
}

/** A MapLibre marker whose content is rendered by React. */
function MapMarker({ ml, map, lng, lat, z, children }: { ml: Ml; map: MlMap; lng: number; lat: number; z: number; children: ReactNode }) {
  const [el] = useState(() => document.createElement("div"));
  const marker = useRef<MlMarker | null>(null);
  useEffect(() => {
    // a double click on a pin must not also zoom the map
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("dblclick", stop);
    const mk = new ml.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
    marker.current = mk;
    return () => {
      el.removeEventListener("dblclick", stop);
      mk.remove();
      marker.current = null;
    };
    // the position is kept current by the next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ml, map, el]);
  useEffect(() => {
    marker.current?.setLngLat([lng, lat]);
  }, [lng, lat]);
  useEffect(() => {
    el.style.zIndex = String(z);
  }, [el, z]);
  return createPortal(children, el);
}

export function QatarMap({
  stats,
  selected,
  hover,
  onHover,
  onSelect,
  theme,
  className,
}: {
  stats: HubStat[];
  selected: string | null;
  hover: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  theme: MapTheme;
  className?: string;
}) {
  const { ref: frameRef, width, height } = useSize<HTMLDivElement>();
  const sized = width > 0 && height > 0;
  const holder = useRef<HTMLDivElement | null>(null);
  const [live, setLive] = useState<{ ml: Ml; map: MlMap } | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [tiles, setTiles] = useState(false);
  const [staticGone, setStaticGone] = useState(false);
  // The camera lives in MapLibre. These two say when to lay the pins out again.
  const [zb, setZb] = useState(0);
  const [tick, setTick] = useState(0);
  const [view, setViewState] = useState<View>("qatar");
  const viewRef = useRef<View>("qatar");
  /** the named view to go back to when a hub is deselected */
  const returnTo = useRef<ViewId | null>(null);
  const online = useRef(false);
  const themeRef = useRef(theme);
  const painted = useRef<MapTheme>(theme);
  const selectedRef = useRef(selected);
  const lastSelected = useRef<string | null>(null);

  const setView = useCallback((v: View) => {
    viewRef.current = v;
    setViewState(v);
  }, []);

  /* ---------- create the map once the frame has a size ---------- */
  useEffect(() => {
    if (!sized || !holder.current) return;
    let dead = false;
    let map: MlMap | null = null;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (dead || !holder.current) return;
        ml.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
        const m = new ml.Map({
          container: holder.current,
          style: buildStyle(themeRef.current, false),
          bounds: QATAR_BOUNDS,
          fitBoundsOptions: { padding: PAD },
          maxBounds: MAX_BOUNDS,
          minZoom: 6,
          maxZoom: 15.5,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          cooperativeGestures: true,
          locale: LOCALE,
        });
        map = m;
        painted.current = themeRef.current;
        m.keyboard.disableRotation();
        m.touchZoomRotate.disableRotation();
        m.touchPitch.disable();

        // Ready as soon as the bundled outline is drawn: the tiles may arrive later, or never.
        const ready = () => {
          if (!dead) setStatus("ready");
        };
        const onData = (e: MapSourceDataEvent) => {
          if (e.sourceId !== "region" || !m.isSourceLoaded("region")) return;
          m.off("sourcedata", onData);
          m.once("render", ready);
          m.triggerRepaint();
        };
        m.on("sourcedata", onData);
        m.once("load", ready);
        // Switch from the outline to the detailed base map once tiles have really arrived.
        m.on("idle", () => {
          if (online.current || dead) return;
          if (m.querySourceFeatures(TILE_SOURCE, { sourceLayer: "water" }).length === 0) return;
          online.current = true;
          setTiles(true);
          m.setStyle(buildStyle(themeRef.current, true));
        });
        m.on("zoom", () => setZb(zoomBucket(m.getZoom())));
        m.on("moveend", () => setTick((t) => t + 1));
        m.on("movestart", (e) => {
          hideTip();
          if (!e.originalEvent) return;
          // the reader moved the map by hand: it is no longer one of the named views
          returnTo.current = null;
          setView("custom");
        });
        setZb(zoomBucket(m.getZoom()));
        setLive({ ml, map: m });
      } catch {
        if (!dead) setStatus("failed");
      }
    })();
    return () => {
      dead = true;
      map?.remove();
      online.current = false;
      setLive(null);
    };
  }, [sized, setView]);

  /* ---------- hand over from the static outline to the live map ---------- */
  useEffect(() => {
    if (status !== "ready") return;
    const t = setTimeout(() => setStaticGone(true), 450);
    return () => clearTimeout(t);
  }, [status]);

  /* ---------- theme ---------- */
  useEffect(() => {
    themeRef.current = theme;
    if (!live || painted.current === theme) return;
    painted.current = theme;
    live.map.setStyle(buildStyle(theme, online.current));
  }, [theme, live]);

  /* ---------- keep a named view framed when the card changes size ---------- */
  useEffect(() => {
    if (!live || status !== "ready" || !sized) return;
    live.map.resize();
    if (viewRef.current !== "custom" && !selectedRef.current) goTo(live.map, viewRef.current, false);
    setTick((t) => t + 1);
  }, [width, height, sized, live, status]);

  /* ---------- selecting a hub flies to it; clearing goes back ---------- */
  useEffect(() => {
    selectedRef.current = selected;
    if (!live || status !== "ready") return;
    const prev = lastSelected.current;
    lastSelected.current = selected;
    if (prev === selected) return;
    if (selected) {
      const hub = hubById.get(selected);
      if (!hub) return;
      if (viewRef.current !== "custom") returnTo.current = viewRef.current;
      setView("custom");
      live.map.flyTo({ center: [hub.lng, hub.lat], zoom: Math.max(live.map.getZoom(), zoomToSeparate(hub, HUBS)), duration: 1000 });
    } else if (returnTo.current) {
      const back = returnTo.current;
      returnTo.current = null;
      setView(back);
      goTo(live.map, back);
    }
  }, [selected, live, status, setView]);

  const markers = useMemo<MarkerSpec[]>(() => {
    if (!live || status !== "ready" || !sized) return [];
    const { map } = live;
    return layoutMarkers({
      stats,
      zoom: map.getZoom(),
      toPx: (lng, lat) => {
        const p = map.project([lng, lat]);
        return [p.x, p.y];
      },
      frame: { w: width, h: height },
      selected,
      hover,
    });
    // zb and tick stand for the camera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, status, sized, stats, selected, hover, width, height, zb, tick]);

  const manual = () => {
    returnTo.current = null;
    setView("custom");
    hideTip();
  };
  const pickView = (id: View) => {
    if (!live || id === "custom") return;
    returnTo.current = null;
    setView(id);
    goTo(live.map, id);
  };
  const zoomBy = (d: number) => {
    if (!live) return;
    manual();
    live.map.easeTo({ zoom: live.map.getZoom() + d, duration: 300 });
  };
  const openGroup = (m: MarkerSpec) => {
    if (!live) return;
    manual();
    const pad = Math.min(110, Math.floor(Math.min(width, height) / 4));
    live.map.fitBounds(boundsOf(m.members.map((s) => s.hub)), { padding: pad, maxZoom: 13, duration: 900 });
  };

  const ready = status === "ready";
  const focus = selected ? hubById.get(selected) : undefined;

  return (
    <section className={cx("d-card flex min-w-0 flex-col overflow-hidden", className)} aria-label="Map of Qatar's economic hubs">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0 max-w-[60ch]">
          <h2 className="d-h">Skills gaps across Qatar&apos;s economic hubs</h2>
          <p className="d-sub mt-0.5">Colour shows the average gap of the skills linked to each hub. Size shows how many of them have a gap.</p>
        </div>
        {status !== "failed" && (
          <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-0.5">
            <Segmented<View> small label="Map view" value={view} onChange={pickView} options={MAP_VIEWS.map((v) => ({ id: v.id, label: v.label }))} />
          </div>
        )}
      </header>

      <div ref={frameRef} className="dash-map relative isolate min-h-0 flex-1 overflow-hidden border-y border-line">
        <div ref={holder} style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 300ms" }} />
        {live &&
          ready &&
          markers.map((m) => (
            <MapMarker key={m.id} ml={live.ml} map={live.map} lng={m.lng} lat={m.lat} z={m.z}>
              <MarkerView
                m={m}
                canZoom
                dim={selected !== null && !m.selected}
                focusable={m.x >= 0 && m.x <= width && m.y >= 0 && m.y <= height}
                onHover={onHover}
                onClick={() => (m.members.length > 1 ? openGroup(m) : onSelect(m.selected ? null : m.members[0].hub.id))}
              />
            </MapMarker>
          ))}
        {!staticGone && (
          <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1, transition: "opacity 300ms", pointerEvents: ready ? "none" : undefined }} aria-hidden={ready || undefined}>
            <StaticMap width={width} height={height} pad={PAD} stats={stats} selected={selected} hover={hover} onHover={onHover} onSelect={onSelect} theme={theme} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 top-3 z-[600] flex items-start justify-between gap-3">
          <div className="pointer-events-auto flex min-w-0 flex-col items-start gap-2">
            {focus && (
              <button type="button" onClick={() => onSelect(null)} className="d-btn d-btn-sm max-w-full shadow-[var(--shadow-md)]" aria-label={`Clear the focus on ${focus.name}`}>
                <Icon name="pin" size={13} className="shrink-0 text-fg-3" />
                <span className="truncate">{focus.short}</span>
                <Icon name="x" size={13} className="shrink-0" />
              </button>
            )}
            {status === "failed" && <p className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[0.75rem] text-fg-2 shadow-[var(--shadow-sm)]">The interactive map could not start in this browser. This is a fixed view.</p>}
          </div>
          {status !== "failed" && (
            <div className="pointer-events-auto flex flex-col overflow-hidden rounded-[9px] border border-line-strong bg-surface shadow-[var(--shadow-md)]">
              <button type="button" className="grid h-8 w-8 place-items-center text-fg-2 hover:bg-surface-2 hover:text-fg" onClick={() => zoomBy(1)} aria-label="Zoom in" title="Zoom in">
                <Icon name="plus" size={16} />
              </button>
              <button type="button" className="grid h-8 w-8 place-items-center border-t border-line text-fg-2 hover:bg-surface-2 hover:text-fg" onClick={() => zoomBy(-1)} aria-label="Zoom out" title="Zoom out">
                <Icon name="minus" size={16} />
              </button>
              <button type="button" className="grid h-8 w-8 place-items-center border-t border-line text-fg-2 hover:bg-surface-2 hover:text-fg" onClick={() => pickView("qatar")} aria-label="Show all of Qatar" title="Show all of Qatar">
                <Icon name="frame" size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 z-[600] rounded-[10px] border border-line bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-2.5 pb-1.5 pt-2 shadow-[var(--shadow-sm)] backdrop-blur-sm">
          <ScaleLegend compact />
        </div>
      </div>

      <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-2.5 text-[0.71875rem] leading-snug text-fg-3 sm:px-5">
        <p className="max-w-[92ch]">Hubs are a reference layer. The data is by sector, so each hub carries the skills of the sectors it hosts, and the organisations named are there for orientation.</p>
        <p className="whitespace-nowrap">
          {tiles ? (
            <>
              <a className="hover:underline" href="https://openfreemap.org" target="_blank" rel="noreferrer">
                OpenFreeMap
              </a>{" "}
              <a className="hover:underline" href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">
                © OpenMapTiles
              </a>{" "}
              Data from{" "}
              <a className="hover:underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>
            </>
          ) : (
            "Outline: Natural Earth"
          )}
        </p>
      </footer>
    </section>
  );
}
