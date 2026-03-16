import { useEffect, useRef } from "react";
import L from "leaflet";
import type { TruckSchedule } from "../../../drizzle/schema";
import { TRUCK_LABELS } from "../../../shared/districts";

const GEOJSON_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663432309399/T4yQXCmCZYWLup5sV59fQM/hk_districts_a1134d6c.geojson";

// ── SVG hatch patterns for closed-today districts ──────────────────────────
const PATTERN_IDS = {
  closedTruck1: "hatch-closed-truck1",
  closedTruck2: "hatch-closed-truck2",
  closedBoth:   "hatch-closed-both",
};

function injectHatchPatterns(map: L.Map) {
  const svgEl = map.getContainer().querySelector("svg");
  if (!svgEl || svgEl.querySelector(`#${PATTERN_IDS.closedTruck1}`)) return;
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <pattern id="${PATTERN_IDS.closedTruck1}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#bfdbfe" fill-opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" stroke-width="3" stroke-opacity="0.7"/>
    </pattern>
    <pattern id="${PATTERN_IDS.closedTruck2}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#fef3c7" fill-opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.7"/>
    </pattern>
    <pattern id="${PATTERN_IDS.closedBoth}" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#ede9fe" fill-opacity="0.5"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#8b5cf6" stroke-width="3" stroke-opacity="0.7"/>
    </pattern>
  `;
  svgEl.insertBefore(defs, svgEl.firstChild);
}

// ── District polygon styles ─────────────────────────────────────────────────
const DISTRICT_STYLE = {
  base:       { fillColor: "#4ade80", fillOpacity: 0.15, color: "#166534", weight: 1.5, opacity: 0.7 },
  hover:      { fillColor: "#22c55e", fillOpacity: 0.35, color: "#14532d", weight: 2.5, opacity: 1 },
  selected:   { fillColor: "#16a34a", fillOpacity: 0.55, color: "#14532d", weight: 2.5, opacity: 1 },
  truck1:     { fillColor: "#3b82f6", fillOpacity: 0.30, color: "#1e3a8a", weight: 2,   opacity: 0.9 },
  truck2:     { fillColor: "#f59e0b", fillOpacity: 0.30, color: "#78350f", weight: 2,   opacity: 0.9 },
  both:       { fillColor: "#8b5cf6", fillOpacity: 0.35, color: "#4c1d95", weight: 2.5, opacity: 1 },
  closed1:    { fillColor: `url(#${PATTERN_IDS.closedTruck1})`, fillOpacity: 1, color: "#1e3a8a", weight: 2,   opacity: 0.85, dashArray: "5,4" },
  closed2:    { fillColor: `url(#${PATTERN_IDS.closedTruck2})`, fillOpacity: 1, color: "#78350f", weight: 2,   opacity: 0.85, dashArray: "5,4" },
  closedBoth: { fillColor: `url(#${PATTERN_IDS.closedBoth})`,   fillOpacity: 1, color: "#4c1d95", weight: 2.5, opacity: 0.9,  dashArray: "5,4" },
};

// ── Custom SVG pin icon factory ─────────────────────────────────────────────
function makePinIcon(color: string, label: string, isClosed: boolean) {
  const opacity = isClosed ? 0.45 : 1;
  const dash = isClosed ? `stroke-dasharray="3,2"` : "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" opacity="${opacity}">
      <path d="M16 0 C7.16 0 0 7.16 0 16 C0 28 16 40 16 40 C16 40 32 28 32 16 C32 7.16 24.84 0 16 0Z"
            fill="${color}" stroke="white" stroke-width="2" ${dash}/>
      <text x="16" y="20" text-anchor="middle" dominant-baseline="middle"
            font-family="sans-serif" font-size="11" font-weight="bold" fill="white">${label}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
}

// ── District status computation ─────────────────────────────────────────────
type DistrictStatus =
  | { kind: "active"; trucks: Set<number> }
  | { kind: "closed"; trucks: Set<number> }
  | { kind: "none" };

function computeDistrictStatuses(schedules: TruckSchedule[], todayStr: string): Map<string, DistrictStatus> {
  const activeTrucks = new Map<string, Set<number>>();
  const closedTrucks = new Map<string, Set<number>>();

  for (const s of schedules) {
    if (!(s.dateFrom <= todayStr && s.dateTo >= todayStr)) continue;
    const isClosed = (s.closedDates ?? "").split(",").map(d => d.trim()).includes(todayStr);
    const map = isClosed ? closedTrucks : activeTrucks;
    if (!map.has(s.districtCode)) map.set(s.districtCode, new Set());
    map.get(s.districtCode)!.add(s.truckNumber);
  }

  const result = new Map<string, DistrictStatus>();
  const allCodes = Array.from(new Set([...Array.from(activeTrucks.keys()), ...Array.from(closedTrucks.keys())]));
  for (const code of allCodes) {
    const active = activeTrucks.get(code);
    if (active && active.size > 0) {
      result.set(code, { kind: "active", trucks: active });
    } else {
      const closed = closedTrucks.get(code);
      if (closed && closed.size > 0) result.set(code, { kind: "closed", trucks: closed });
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

// Truck colours matching the rest of the UI
const TRUCK_PIN_COLORS: Record<number, string> = { 1: "#2563eb", 2: "#d97706" };

export default function HKMap({ schedules, selectedDistrict, onDistrictClick, lang, todayStr }: HKMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const patternsInjected = useRef(false);

  const districtStatuses = computeDistrictStatuses(schedules, todayStr);

  // ── Map initialisation ───────────────────────────────────────────────────
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
    markerLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      injectHatchPatterns(map);
      patternsInjected.current = true;
    }, 300);

    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(geoData => {
        const geoLayer = L.geoJSON(geoData, {
          style: feature => {
            const code = feature?.properties?.AREA_CODE as string;
            const status = districtStatuses.get(code) ?? { kind: "none" as const };
            return getStyleForStatus(status, code === selectedDistrict);
          },
          onEachFeature: (feature, layer) => {
            const code = feature.properties?.AREA_CODE as string;
            const nameTc = feature.properties?.NAME_TC as string;
            const nameEn = (feature.properties?.NAME_EN as string)?.trim();

            layer.on({
              mouseover: e => {
                const l = e.target as L.Path;
                const status = districtStatuses.get(code) ?? { kind: "none" as const };
                if (status.kind === "active") {
                  const { trucks } = status;
                  if (trucks.has(1) && trucks.has(2)) l.setStyle({ ...DISTRICT_STYLE.both, fillOpacity: 0.55 });
                  else if (trucks.has(1)) l.setStyle({ ...DISTRICT_STYLE.truck1, fillOpacity: 0.50 });
                  else l.setStyle({ ...DISTRICT_STYLE.truck2, fillOpacity: 0.50 });
                } else if (status.kind === "closed") {
                  l.setStyle({ ...getStyleForStatus(status, false), weight: 3.5, opacity: 1 });
                } else {
                  l.setStyle(DISTRICT_STYLE.hover);
                }
                l.bringToFront();

                const displayName = lang === "tc" ? nameTc : nameEn;
                let statusLine = "";
                if (status.kind === "active") {
                  const labels = Array.from(status.trucks).map(n => lang === "tc" ? TRUCK_LABELS[n].tc : TRUCK_LABELS[n].en).join(" & ");
                  statusLine = `<br/><span style="font-size:11px;color:#166534;font-weight:600">✓ ${labels} ${lang === "tc" ? "服務中" : "Active"}</span>`;
                } else if (status.kind === "closed") {
                  const labels = Array.from(status.trucks).map(n => lang === "tc" ? TRUCK_LABELS[n].tc : TRUCK_LABELS[n].en).join(" & ");
                  statusLine = `<br/><span style="font-size:11px;color:#b45309;font-weight:600">✕ ${labels} ${lang === "tc" ? "今日暫停" : "Closed Today"}</span>`;
                }
                l.bindTooltip(`<strong>${displayName}</strong>${statusLine}`, { sticky: true, className: "district-tooltip" }).openTooltip();
              },
              mouseout: e => {
                geoLayer.resetStyle(e.target);
                (e.target as L.Path).unbindTooltip();
              },
              click: () => onDistrictClick(code),
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

  // ── Re-style polygons when data/selection changes ────────────────────────
  useEffect(() => {
    if (!geoLayerRef.current) return;
    if (leafletMap.current && !patternsInjected.current) {
      injectHatchPatterns(leafletMap.current);
      patternsInjected.current = true;
    }
    geoLayerRef.current.eachLayer(layer => {
      const feature = (layer as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const code = feature?.properties?.AREA_CODE as string;
      const status = districtStatuses.get(code) ?? { kind: "none" as const };
      (layer as L.Path).setStyle(getStyleForStatus(status, code === selectedDistrict));
    });
  }, [selectedDistrict, schedules, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update pin markers when schedules or date changes ────────────────────
  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (!markerLayer) return;

    markerLayer.clearLayers();

    // Show markers for schedules active in the current view window
    // We show all schedules that have coordinates, grouped by location
    // For today's view: active and closed-today both get markers (closed = faded)
    const seen = new Set<string>();

    for (const s of schedules) {
      if (s.lat == null || s.lng == null) continue;

      // Deduplicate by location+truck (same location may span multiple date rows)
      const key = `${s.truckNumber}-${s.lat.toFixed(4)}-${s.lng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const inRange = s.dateFrom <= todayStr && s.dateTo >= todayStr;
      if (!inRange) continue; // Only show markers for today's scheduled locations

      const isClosed = (s.closedDates ?? "").split(",").map(d => d.trim()).includes(todayStr);
      const color = TRUCK_PIN_COLORS[s.truckNumber] ?? "#666";
      const label = s.truckNumber === 1 ? "1" : "2";
      const icon = makePinIcon(color, label, isClosed);

      const locationName = lang === "tc" ? s.locationNameTc : (s.locationNameEn ?? s.locationNameTc);
      const districtName = lang === "tc" ? s.districtNameTc : s.districtNameEn;
      const truckLabel = lang === "tc" ? TRUCK_LABELS[s.truckNumber].tc : TRUCK_LABELS[s.truckNumber].en;
      const statusText = isClosed
        ? `<span style="color:#b45309;font-weight:600">✕ ${lang === "tc" ? "今日暫停" : "Closed Today"}</span>`
        : `<span style="color:#166534;font-weight:600">✓ ${lang === "tc" ? "服務中" : "Active"}</span>`;
      const lcsdBadge = s.isLcsdLibrary
        ? `<span style="font-size:11px;color:#92400e;background:#fef3c7;padding:1px 5px;border-radius:3px;margin-left:4px">* ${lang === "tc" ? "康文署圖書館" : "LCSD Library"}</span>`
        : "";
      const closedNote = s.notesTc
        ? `<div style="font-size:11px;color:#b45309;margin-top:3px">⚠ ${lang === "tc" ? s.notesTc : (s.notesEn ?? s.notesTc)}</div>`
        : "";

      const popup = L.popup({ maxWidth: 260, className: "truck-popup" }).setContent(`
        <div style="font-family:sans-serif;line-height:1.5">
          <div style="font-size:13px;font-weight:700;margin-bottom:4px">${locationName}${lcsdBadge}</div>
          <div style="font-size:11px;color:#555;margin-bottom:3px">📍 ${districtName}</div>
          <div style="font-size:11px;margin-bottom:2px">🚛 ${truckLabel} &nbsp; ${statusText}</div>
          <div style="font-size:11px;color:#555">📅 ${s.dateFrom} – ${s.dateTo}</div>
          <div style="font-size:11px;color:#555">🕙 ${lang === "tc" ? "上午 10 時至晚上 7 時" : "10:00 AM – 7:00 PM"}</div>
          ${closedNote}
        </div>
      `);

      L.marker([s.lat, s.lng], { icon }).bindPopup(popup).addTo(markerLayer);
    }
  }, [schedules, todayStr, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
