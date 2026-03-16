import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { TruckSchedule } from "../../../drizzle/schema";
import { DISTRICTS, TRUCK_COLORS, TRUCK_LABELS } from "../../../shared/districts";

const GEOJSON_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663432309399/T4yQXCmCZYWLup5sV59fQM/hk_districts_a1134d6c.geojson";

// District fill colors — neutral base, highlighted when active/hovered
const DISTRICT_STYLE = {
  base: { fillColor: "#4ade80", fillOpacity: 0.15, color: "#166534", weight: 1.5, opacity: 0.7 },
  hover: { fillColor: "#22c55e", fillOpacity: 0.35, color: "#14532d", weight: 2.5, opacity: 1 },
  active: { fillColor: "#16a34a", fillOpacity: 0.55, color: "#14532d", weight: 2.5, opacity: 1 },
  hasTruck1: { fillColor: "#3b82f6", fillOpacity: 0.30, color: "#1e3a8a", weight: 2, opacity: 0.9 },
  hasTruck2: { fillColor: "#f59e0b", fillOpacity: 0.30, color: "#78350f", weight: 2, opacity: 0.9 },
  hasBoth:   { fillColor: "#8b5cf6", fillOpacity: 0.35, color: "#4c1d95", weight: 2.5, opacity: 1 },
};

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

  // Compute which districts have trucks actively serving TODAY only
  // A schedule is "active today" when: dateFrom <= today <= dateTo
  // AND today is not in the closedDates list
  const activeDistricts = new Map<string, Set<number>>();

  for (const s of schedules) {
    const isToday = s.dateFrom <= todayStr && s.dateTo >= todayStr;
    if (!isToday) continue;
    // Check if today is a closed date
    const closedList = s.closedDates ? s.closedDates.split(",").map(d => d.trim()) : [];
    if (closedList.includes(todayStr)) continue;
    // Also skip suspended entries
    if (s.locationNameTc.includes("暫停")) continue;
    if (!activeDistricts.has(s.districtCode)) activeDistricts.set(s.districtCode, new Set());
    activeDistricts.get(s.districtCode)!.add(s.truckNumber);
  }

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

    // Load GeoJSON
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((geoData) => {
        const geoLayer = L.geoJSON(geoData, {
          style: (feature) => {
            const code = feature?.properties?.AREA_CODE as string;
            const trucks = activeDistricts.get(code);
            if (trucks) {
              if (trucks.has(1) && trucks.has(2)) return DISTRICT_STYLE.hasBoth;
              if (trucks.has(1)) return DISTRICT_STYLE.hasTruck1;
              if (trucks.has(2)) return DISTRICT_STYLE.hasTruck2;
            }
            return DISTRICT_STYLE.base;
          },
          onEachFeature: (feature, layer) => {
            const code = feature.properties?.AREA_CODE as string;
            const nameTc = feature.properties?.NAME_TC as string;
            const nameEn = (feature.properties?.NAME_EN as string)?.trim();

            layer.on({
              mouseover: (e) => {
                const l = e.target as L.Path;
                const trucks = activeDistricts.get(code);
                if (trucks) {
                  if (trucks.has(1) && trucks.has(2)) l.setStyle({ ...DISTRICT_STYLE.hasBoth, fillOpacity: 0.55 });
                  else if (trucks.has(1)) l.setStyle({ ...DISTRICT_STYLE.hasTruck1, fillOpacity: 0.50 });
                  else l.setStyle({ ...DISTRICT_STYLE.hasTruck2, fillOpacity: 0.50 });
                } else {
                  l.setStyle(DISTRICT_STYLE.hover);
                }
                l.bringToFront();
                // Show tooltip
                const displayName = lang === "tc" ? nameTc : nameEn;
                const trucks2 = activeDistricts.get(code);
                let truckInfo = "";
                if (trucks2) {
                  const labels = Array.from(trucks2).map(n => lang === "tc" ? TRUCK_LABELS[n].tc : TRUCK_LABELS[n].en).join(" & ");
                  truckInfo = `<br/><span style="font-size:11px;color:#166534">${labels}</span>`;
                }
                l.bindTooltip(`<strong>${displayName}</strong>${truckInfo}`, {
                  sticky: true, className: "district-tooltip",
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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update styles when selectedDistrict or schedules change
  useEffect(() => {
    if (!geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((layer) => {
      const feature = (layer as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const code = feature?.properties?.AREA_CODE as string;
      const trucks = activeDistricts.get(code);
      if (code === selectedDistrict) {
        (layer as L.Path).setStyle(DISTRICT_STYLE.active);
      } else if (trucks) {
        if (trucks.has(1) && trucks.has(2)) (layer as L.Path).setStyle(DISTRICT_STYLE.hasBoth);
        else if (trucks.has(1)) (layer as L.Path).setStyle(DISTRICT_STYLE.hasTruck1);
        else (layer as L.Path).setStyle(DISTRICT_STYLE.hasTruck2);
      } else {
        (layer as L.Path).setStyle(DISTRICT_STYLE.base);
      }
    });
  }, [selectedDistrict, schedules, todayStr]);

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
