import { useMemo } from "react";
import type { TruckSchedule } from "../../../drizzle/schema";
import { TRUCK_COLORS, TRUCK_LABELS, SERVICE_HOURS, LCSD_NOTE, DISTRICTS } from "../../../shared/districts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Clock, MapPin, BookOpen, X, Truck } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface SchedulePanelProps {
  schedules: TruckSchedule[];
  selectedDistrict: string | null;
  onClearDistrict: () => void;
  todayStr: string;
  dateFrom?: string;
  dateTo?: string;
}

function formatDate(dateStr: string, lang: "tc" | "en") {
  const d = new Date(dateStr + "T00:00:00");
  if (lang === "tc") {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return d.toLocaleDateString("en-HK", { month: "short", day: "numeric" });
}

function formatDateRange(from: string, to: string, lang: "tc" | "en") {
  if (from === to) return formatDate(from, lang);
  return `${formatDate(from, lang)} – ${formatDate(to, lang)}`;
}

function isActive(s: TruckSchedule, today: string) {
  return s.dateFrom <= today && s.dateTo >= today;
}

function isUpcoming(s: TruckSchedule, today: string) {
  return s.dateFrom > today;
}

export default function SchedulePanel({ schedules, selectedDistrict, onClearDistrict, todayStr, dateFrom, dateTo }: SchedulePanelProps) {
  const { lang, t } = useLang();

  const filtered = useMemo(() => {
    const from = dateFrom ?? todayStr;
    const to = dateTo ?? todayStr;
    // Keep schedules that overlap with the selected date range:
    // schedule overlaps if dateFrom <= to AND dateTo >= from
    let list = schedules.filter(s => s.dateFrom <= to && s.dateTo >= from);
    if (selectedDistrict) list = list.filter(s => s.districtCode === selectedDistrict);
    return list.sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  }, [schedules, selectedDistrict, todayStr, dateFrom, dateTo]);

  const districtLabel = selectedDistrict
    ? (lang === "tc" ? DISTRICTS[selectedDistrict]?.tc : DISTRICTS[selectedDistrict]?.en) ?? selectedDistrict
    : null;

  const suspended = (s: TruckSchedule) =>
    s.locationNameTc.includes("暫停") || s.locationNameEn?.includes("Suspended");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="font-semibold text-sm text-foreground">
            {districtLabel
              ? t(`${districtLabel} 服務日程`, `${districtLabel} Schedule`)
              : t("即將服務日程", "Upcoming Schedule")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("服務時間：", "Hours: ")}{lang === "tc" ? SERVICE_HOURS.tc : SERVICE_HOURS.en}
          </p>
        </div>
        {selectedDistrict && (
          <Button size="sm" variant="ghost" onClick={onClearDistrict} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Truck legend */}
      <div className="px-4 py-2 flex gap-3 border-b bg-muted/30 shrink-0">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: TRUCK_COLORS[n] }} />
            <span className="text-xs font-medium" style={{ color: TRUCK_COLORS[n] }}>
              {lang === "tc" ? TRUCK_LABELS[n].tc : TRUCK_LABELS[n].en}
            </span>
          </div>
        ))}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t("暫無服務記錄", "No service records found")}</p>
            </div>
          )}
          {filtered.map((s) => {
            const active = isActive(s, todayStr);
            const upcoming = isUpcoming(s, todayStr);
            const isSuspended = suspended(s);
            const truckColor = TRUCK_COLORS[s.truckNumber] ?? "#666";
            const truckLabel = lang === "tc" ? TRUCK_LABELS[s.truckNumber]?.tc : TRUCK_LABELS[s.truckNumber]?.en;
            const locationName = lang === "tc" ? s.locationNameTc : (s.locationNameEn ?? s.locationNameTc);
            const notes = lang === "tc" ? s.notesTc : s.notesEn;

            return (
              <Card
                key={s.id}
                className={`border transition-all ${active ? "border-l-4 shadow-sm" : "border-border"} ${isSuspended ? "opacity-60" : ""}`}
                style={active ? { borderLeftColor: truckColor } : {}}
              >
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 font-semibold"
                        style={{ borderColor: truckColor, color: truckColor }}
                      >
                        {truckLabel}
                      </Badge>
                      {active && (
                        <Badge className="text-xs px-1.5 py-0 bg-green-600 text-white">
                          {t("服務中", "Active")}
                        </Badge>
                      )}
                      {isSuspended && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          {t("暫停", "Suspended")}
                        </Badge>
                      )}
                    </div>
                    {!selectedDistrict && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {lang === "tc" ? s.districtNameTc : s.districtNameEn}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-1 space-y-1.5">
                  {/* Location name */}
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium leading-snug">
                      {locationName}
                      {s.isLcsdLibrary && (
                        <span className="ml-1 text-xs text-amber-600" title={lang === "tc" ? LCSD_NOTE.tc : LCSD_NOTE.en}>
                          ★ {t("流動圖書館", "Mobile Library")}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateRange(s.dateFrom, s.dateTo, lang)}
                    </span>
                  </div>

                  {/* Service hours */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {lang === "tc" ? SERVICE_HOURS.tc : SERVICE_HOURS.en}
                    </span>
                  </div>

                  {/* Closed days note */}
                  {notes && (
                    <div className="flex items-start gap-1.5 bg-amber-50 rounded px-2 py-1">
                      <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                      <span className="text-xs text-amber-700">{notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* LCSD note */}
        {filtered.some(s => s.isLcsdLibrary) && (
          <div className="px-4 pb-4 text-xs text-muted-foreground">
            {lang === "tc" ? LCSD_NOTE.tc : LCSD_NOTE.en}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
