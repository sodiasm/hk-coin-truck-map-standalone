import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "../contexts/LanguageContext";
import HKMap from "../components/HKMap";
import SchedulePanel from "../components/SchedulePanel";
import FilterBar from "../components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Map, List, Settings } from "lucide-react";

const TODAY = new Date().toISOString().slice(0, 10);

export default function Home() {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();

  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(TODAY);
  const [dateTo, setDateTo] = useState(TODAY);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  // Fetch all schedules (for map coloring)
  const { data: allSchedules, isLoading } = trpc.schedules.all.useQuery();

  // Fetch filtered schedules for the panel
  const { data: filteredSchedules } = trpc.schedules.byDateRange.useQuery({
    dateFrom,
    dateTo,
  });

  const displaySchedules = useMemo(() => {
    const base = filteredSchedules ?? allSchedules ?? [];
    return base;
  }, [filteredSchedules, allSchedules]);

  const handleReset = () => {
    setSelectedDistrict(null);
    setDateFrom(TODAY);
    setDateTo(TODAY);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Top Nav ── */}
      <header className="shrink-0 border-b bg-primary text-primary-foreground shadow-sm z-10">
        <div className="flex items-center justify-between px-4 h-14 gap-3">
          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-accent-foreground font-bold text-sm">銀</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight truncate">
                {t("香港收銀車服務地圖", "HK Cash Coin Truck Map")}
              </h1>
              <p className="text-xs opacity-70 leading-tight hidden sm:block">
                {t("香港金融管理局", "Hong Kong Monetary Authority")}
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <div className="flex rounded-md overflow-hidden border border-primary-foreground/30">
              <button
                onClick={() => setLang("tc")}
                className={`px-2 py-1 text-xs font-medium transition-colors ${lang === "tc" ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}`}
              >
                中文
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 text-xs font-medium transition-colors ${lang === "en" ? "bg-primary-foreground text-primary" : "text-primary-foreground hover:bg-primary-foreground/10"}`}
              >
                EN
              </button>
            </div>

            {/* Admin link (only for admins) */}
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent">
                  <Settings className="h-3.5 w-3.5" />
                  {t("管理", "Admin")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Filter Bar ── */}
      {/* relative + z-[1200] ensures the Radix portal dropdown renders above Leaflet's z-index ~400 */}
      <div className="relative z-[1200] shrink-0">
      <FilterBar
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onReset={handleReset}
      />
      </div>

      {/* ── Mobile tab switcher ── */}
      <div className="sm:hidden flex border-b bg-card shrink-0">
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${mobileView === "map" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
        >
          <Map className="h-3.5 w-3.5" />
          {t("地圖", "Map")}
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${mobileView === "list" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
        >
          <List className="h-3.5 w-3.5" />
          {t("日程", "Schedule")}
          {displaySchedules.length > 0 && (
            <Badge className="h-4 px-1 text-[10px] bg-primary text-primary-foreground">{displaySchedules.length}</Badge>
          )}
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map pane */}
        <div className={`relative flex-1 ${mobileView === "list" ? "hidden sm:flex" : "flex"} flex-col`}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="flex-1 p-2">
            <HKMap
              schedules={allSchedules ?? []}
              selectedDistrict={selectedDistrict}
              onDistrictClick={(code) => setSelectedDistrict(prev => prev === code ? null : code)}
              lang={lang}
              todayStr={TODAY}
            />
          </div>

          {/* Map legend */}
          <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2.5 z-[1000] text-xs space-y-1.5 border">
            <p className="font-semibold text-foreground mb-1">{t("今日圖例", "Today's Legend")}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded inline-block" style={{ background: "#3b82f6", opacity: 0.7 }} />
              <span className="text-muted-foreground">{t("收銀車 1 號服務中", "Truck 1 Active")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded inline-block" style={{ background: "#f59e0b", opacity: 0.7 }} />
              <span className="text-muted-foreground">{t("收銀車 2 號服務中", "Truck 2 Active")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded inline-block" style={{ background: "#8b5cf6", opacity: 0.7 }} />
              <span className="text-muted-foreground">{t("兩輛同時服務中", "Both Active Today")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-4 h-3 rounded inline-block border border-blue-400"
                style={{
                  background: "repeating-linear-gradient(45deg, #bfdbfe 0px, #bfdbfe 2px, #eff6ff 2px, #eff6ff 6px)",
                }}
              />
              <span className="text-muted-foreground">{t("今日暫停", "Closed Today")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded inline-block border border-slate-300" style={{ background: "transparent" }} />
              <span className="text-muted-foreground">{t("暫無服務", "No Service")}</span>
            </div>
          </div>
        </div>

        {/* Schedule panel */}
        <div className={`w-full sm:w-80 lg:w-96 border-l bg-card flex flex-col overflow-hidden ${mobileView === "map" ? "hidden sm:flex" : "flex"}`}>
          <SchedulePanel
            schedules={displaySchedules}
            selectedDistrict={selectedDistrict}
            onClearDistrict={() => setSelectedDistrict(null)}
            todayStr={TODAY}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t bg-card px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t("資料來源：香港金融管理局", "Source: Hong Kong Monetary Authority")}
          {" · "}
          <a
            href="https://www.hkma.gov.hk/chi/key-functions/monetary-stability/notes-and-coins/coin-collection-truck/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            {t("官方網頁", "Official Website")}
          </a>
        </span>
        <span className="hidden sm:inline">
          {t("服務時間：上午 10 時至晚上 7 時", "Service Hours: 10am – 7pm")}
        </span>
      </footer>
    </div>
  );
}
