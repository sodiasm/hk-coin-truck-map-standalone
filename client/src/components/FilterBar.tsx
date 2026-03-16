import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { DISTRICTS } from "../../../shared/districts";
import { useLang } from "../contexts/LanguageContext";

interface FilterBarProps {
  selectedDistrict: string | null;
  onDistrictChange: (code: string | null) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onReset: () => void;
}

export default function FilterBar({
  selectedDistrict,
  onDistrictChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onReset,
}: FilterBarProps) {
  const { lang, t } = useLang();

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-card/80 backdrop-blur-sm">
      {/* District selector */}
      <Select
        value={selectedDistrict ?? "all"}
        onValueChange={(v) => onDistrictChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder={t("選擇地區", "Select District")} />
        </SelectTrigger>
        <SelectContent className="z-[1100]">
          <SelectItem value="all">{t("全部地區", "All Districts")}</SelectItem>
          {Object.entries(DISTRICTS).map(([code, label]) => (
            <SelectItem key={code} value={code}>
              {lang === "tc" ? label.tc : label.en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date from */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("由", "From")}</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-8 w-36 text-xs"
        />
      </div>

      {/* Date to */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("至", "To")}</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-8 w-36 text-xs"
        />
      </div>

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2 text-xs gap-1">
        <X className="h-3.5 w-3.5" />
        {t("重設", "Reset")}
      </Button>
    </div>
  );
}
