import { useEffect, useRef } from "react";
import L from "leaflet";
import type { TruckSchedule } from "../../../drizzle/schema";
import { TRUCK_LABELS } from "../../../shared/districts";

const GEOJSON_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663432309399/T4yQXCmCZYWLup5sV59fQM/hk_districts_a1134d6c.geojson";

// ── SVG pattern IDs injected into the map's SVG layer ──────────────────────
const PATTERN_IDS = {
  closedTruck1: "hatch-closed-truck1",
  closedTruck2: "hatch-closed-truck2",
  closedBoth:   "hatch-closed-both",
};

/**
 * Injects diagonal-stripe SVG <defs> patterns into the Leaflet SVG renderer.
 * Must be called after the map container is mounted.
 */
function injectHatchPatterns(map: L.Map) {
  // Leaflet renders SVG paths inside a <svg> inside the map container
  const svgEl = map.getContainer().querySelector("svg");
  if (!svgEl) return;

  // Avoid double-injection
  if (svgEl.querySelector(`#${PATTERN_IDS.closedTruck1}`)) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <!-- Truck 1 closed: blue diagonal stripes -->
    <pattern id="${PATTERN_IDS.closedTruck1}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#bfdbfe" fill-opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.7"/>
    </pattern>
    <!-- Truck 2 closed: amber diagonal stripes -->
    <pattern id="${PATTERN_IDS.closedTruck2}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#fef3c7" fill-opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.7"/>
    </pattern>
    <!-- Both closed: purple diagonal stripes -->
    <pattern id="${PATTERN_IDS.closedBoth}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#ede9fe" fill-opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#8b5cf6" stroke-width="3" stroke-opacity="0.7"/>
    </pattern>
  `;
  svgEl.insertBefore(defs, svgEl.firstChild);
}

// ── Solid fill styles ───────────────────────────────────────────────────────
const DISTRICT_STYLE = {
  base:      { fillColor: "#4ade80", fillOpacity: 0.15, color: "#166534", weight: 1.5, opacity: 0.7 },
  hover:     { fillColor: "#22c55e", fillOpacity: 0.35, color: "#14532d", weight: 2.5, opacity: 1 },
  selected:  { fillColor: "#16a34a", fillOpacity: 0.55, color: "#14532d", weight: 2.5, opacity: 1 },
  truck1:    { fillColor: "#3b82f6", fillOpacity: 0.30, color: "#1e3a8a", weight: 2,   opacity: 0.9 },
  truck2:    { fillColor: "#f59e0b", fillOpacity: 0.30, color: "#78350f", weight: 2,   opacity: 0.9 },
  both:      { fillColor: "#8b5cf6", fillOpacity: 0.35, color: "#4c1d95", weight: 2.5, opacity: 1 },
  // Closed styles use SVG pattern fill — fillColor is overridden via className + CSS
  closed1:   { fillColor: `url(#${PATTERN_IDS.closedTruck1})`, fillOpacity: 1, color: "#1e3a8a", weight: 2,   opacity: 0.85, dashArray: "5,4" },
  closed2:   { fillColor: `url(#${PATTERN_IDS.closedTruck2})`, fillOpacity: 1, color: "#78350f", weight: 2,   opacity: 0.85, dashArray: "5,4" },
  closedBoth:{ fillColor: `url(#${PATTERN_IDS.closedBoth})`,   fillOpacity: 1, color: "#4c1d95", weight: 2.5, opacity: 0.9,  dashArray: "5,4" },
};

// ── District status type ────────────────────────────────────────────────────
type DistrictStatus =
  | { kind: "active"; trucks: Set<number> }
  | { kind: "closed"; trucks: Set<number> }
  | { kind: "none" };

function computeDistrictStatuses(
  schedules: TruckSchedule[],
  todayStr: string
): Map<string, DistrictStatus> {
  // Two-pass approach: first collect active trucks, then collect closed trucks
  // Active always wins over closed for the same district
  const activeTrucks = new Map<string, Set<number>>();
  const closedTrucks = new Map<string, Set<number>>();

  for (const s of schedules) {
    const inRange = s.dateFrom <= todayStr && s.dateTo >= todayStr;
    if (!inRange) continue;

    const closedList = s.closedDates ? s.closedDates.split(",").map(d => d.trim()) : [];
    const isClosed = closedList.includes(todayStr);

    if (isClosed) {
      if (!closedTrucks.has(s.districtCode)) closedTrucks.set(s.districtCode, new Set());
      closedTrucks.get(s.districtCode)!.add(s.truckNumber);
    } else {
      if (!activeTrucks.has(s.districtCode)) activeTrucks.set(s.districtCode, new Set());
      activeTrucks.get(s.districtCode)!.add(s.truckNumber);
    }
  }

  const result = new Map<string, DistrictStatus>();

  // Merge: active takes priority; closed only shown when no active truck in same district
  const allCodes = Array.from(new Set([...Array.from(activeTrucks.keys()), ...Array.from(closedTrucks.keys())]));
  for (const code of allCodes) {
    const active = activeTrucks.get(code);
    if (active && active.size > 0) {
      // Check if there are also closed trucks for this district
      const closed = closedTrucks.get(code);
      // Merge: active trucks shown as active, closed trucks for same district
      // are secondary — only show active status
      result.set(code, { kind: "active", trucks: active });
    } else {
      const closed = closedTrucks.get(code);
      if (closed && closed.size > 0) {
        result.set(code, { kind: "closed", trucks: closed });
      }
    }
  }

  return result;
}

function getStyleForStatus(status: DistrictStatus, isSelected: boolean): L.PathOptions {
  if (isSelected) return DISTRICT_STYLE.selected;
  if (status.kind === "active") {
    const { trucks } = status;
    if (trucks.has(1) && trucks.has(2)) return DISTRICT_STYLE.both;
    if (trucks.has(1)) return DISTRICT_STYLE.truck1;
    return DISTRICT_STYLE.truck2;
  }
  if (status.kind === "closed") {
    const { trucks } = status;
    if (trucks.has(1) && trucks.has(2)) return DISTRICT_STYLE.closedBoth;
    if (trucks.has(1)) return DISTRICT_STYLE.closed1;
    return DISTRICT_STYLE.closed2;
  }
  return DISTRICT_STYLE.base;
}

// ── Component ───────────────────────────────────────────────────────────────

interface HKMapProps {
  schedules: TruckSchedule[];
  selectedDistrict: string | null;
  onDistrictClick: (code: string) => void;
  lang: "tc" | "en";
  todayStr: string;
}

export default function HKMap({ schedules, selectedDistrict, onDistrictClick, lang, todayStr }: HKMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const patternsInjected = useRef(false);

  // Compute statuses outside effects so both effects share the same data
  const districtStatuses = computeDistrictStatuses(schedules, todayStr);

  // ── Map initialisation (runs once) ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [22.35, 114.15],
      zoom: 11,
      minZoom: 10,
      maxZoom: 16,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMap.current = map;

    // Inject SVG hatch patterns after a short delay to ensure SVG is rendered
    setTimeout(() => {
      injectHatchPatterns(map);
      patternsInjected.current = true;
    }, 300);

    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((geoData) => {
        const geoLayer = L.geoJSON(geoData, {
          style: (feature) => {
            const code = feature?.properties?.AREA_CODE as string;
            const status = districtStatuses.get(code) ?? { kind: "none" as const };
            return getStyleForStatus(status, code === selectedDistrict);
          },
          onEachFeature: (feature, layer) => {
            const code = feature.properties?.AREA_CODE as string;
            const nameTc = feature.properties?.NAME_TC as string;
            const nameEn = (feature.properties?.NAME_EN as string)?.trim();

            layer.on({
              mouseover: (e) => {
                const l = e.target as L.Path;
                const status = districtStatuses.get(code) ?? { kind: "none" as const };

                // Brighten on hover — keep pattern for closed, brighten solid for active
                if (status.kind === "active") {
                  const { trucks } = status;
                  if (trucks.has(1) && trucks.has(2)) l.setStyle({ ...DISTRICT_STYLE.both, fillOpacity: 0.55 });
                  else if (trucks.has(1)) l.setStyle({ ...DISTRICT_STYLE.truck1, fillOpacity: 0.50 });
                  else l.setStyle({ ...DISTRICT_STYLE.truck2, fillOpacity: 0.50 });
                } else if (status.kind === "closed") {
                  // Keep the hatch but thicken the border
                  const base = getStyleForStatus(status, false);
                  l.setStyle({ ...base, weight: 3.5, opacity: 1 });
                } else {
                  l.setStyle(DISTRICT_STYLE.hover);
                }
                l.bringToFront();

                // Build tooltip content
                const displayName = lang === "tc" ? nameTc : nameEn;
                let statusLine = "";
                if (status.kind === "active") {
                  const labels = Array.from(status.trucks)
                    .map(n => lang === "tc" ? TRUCK_LABELS[n].tc : TRUCK_LABELS[n].en)
                    .join(" & ");
                  statusLine = `<br/><span style="font-size:11px;color:#166534;font-weight:600">✓ ${labels} ${lang === "tc" ? "服務中" : "Active"}</span>`;
                } else if (status.kind === "closed") {
                  const labels = Array.from(status.trucks)
                    .map(n => lang === "tc" ? TRUCK_LABELS[n].tc : TRUCK_LABELS[n].en)
                    .join(" & ");
                  statusLine = `<br/><span style="font-size:11px;color:#b45309;font-weight:600">✕ ${labels} ${lang === "tc" ? "今日暫停" : "Closed Today"}</span>`;
                }

                l.bindTooltip(`<strong>${displayName}</strong>${statusLine}`, {
                  sticky: true,
                  className: "district-tooltip",
                }).openTooltip();
              },
              mouseout: (e) => {
                geoLayer.resetStyle(e.target);
                (e.target as L.Path).unbindTooltip();
              },
              click: () => {
                onDistrictClick(code);
              },
            });
          },
        }).addTo(map);

        geoLayerRef.current = geoLayer;
      })
      .catch(console.error);

    return () => {
      map.remove();
      leafletMap.current = null;
      patternsInjected.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-style when data/selection changes ─────────────────────────────────
  useEffect(() => {
    if (!geoLayerRef.current) return;

    // Re-inject patterns if map was re-created
    if (leafletMap.current && !patternsInjected.current) {
      injectHatchPatterns(leafletMap.current);
      patternsInjected.current = true;
    }

    geoLayerRef.current.eachLayer((layer) => {
      const feature = (layer as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const code = feature?.properties?.AREA_CODE as string;
      const status = districtStatuses.get(code) ?? { kind: "none" as const };
      (layer as L.Path).setStyle(getStyleForStatus(status, code === selectedDistrict));
    });
  }, [selectedDistrict, schedules, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
