import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "../contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Truck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { DISTRICTS, TRUCK_COLORS, TRUCK_LABELS } from "../../../shared/districts";
import type { TruckSchedule } from "../../../drizzle/schema";

type ScheduleForm = {
  truckNumber: number;
  districtCode: string;
  districtNameTc: string;
  districtNameEn: string;
  locationNameTc: string;
  locationNameEn: string;
  addressTc: string;
  dateFrom: string;
  dateTo: string;
  closedDates: string;
  isLcsdLibrary: boolean;
  notesTc: string;
  notesEn: string;
};

const EMPTY_FORM: ScheduleForm = {
  truckNumber: 1,
  districtCode: "CW",
  districtNameTc: "中西區",
  districtNameEn: "Central & Western",
  locationNameTc: "",
  locationNameEn: "",
  addressTc: "",
  dateFrom: "",
  dateTo: "",
  closedDates: "",
  isLcsdLibrary: false,
  notesTc: "",
  notesEn: "",
};

export default function Admin() {
  const { lang, t } = useLang();
  const utils = trpc.useUtils();

  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [filterTruck, setFilterTruck] = useState<string>("all");

  const isAuthenticated = Boolean(token);

  // Use the admin-gated endpoint so the server enforces the token check.
  // If the token is wrong the query will fail with FORBIDDEN and the table
  // will remain empty — the public schedules.all endpoint is intentionally
  // NOT used here.
  const { data: schedules, isLoading, error: schedulesError } = trpc.admin.listAll.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  // If the server rejects the token (FORBIDDEN), clear the stored token so
  // the user is sent back to the login screen.
  if (schedulesError && (schedulesError.data?.code === "FORBIDDEN" || schedulesError.message?.includes("FORBIDDEN"))) {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setTokenError(true);
  }

  const createMutation = trpc.admin.createSchedule.useMutation({
    onSuccess: () => {
      utils.admin.listAll.invalidate();
      utils.schedules.all.invalidate();
      utils.schedules.byDateRange.invalidate();
      toast.success(t("已新增服務記錄", "Schedule created"));
      setDialogOpen(false);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.updateSchedule.useMutation({
    onSuccess: () => {
      utils.admin.listAll.invalidate();
      utils.schedules.all.invalidate();
      utils.schedules.byDateRange.invalidate();
      toast.success(t("已更新服務記錄", "Schedule updated"));
      setDialogOpen(false);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.admin.listAll.invalidate();
      utils.schedules.all.invalidate();
      utils.schedules.byDateRange.invalidate();
      toast.success(t("已刪除服務記錄", "Schedule deleted"));
      setDeleteId(null);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <Truck className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-lg font-semibold">{t("管理員登入", "Admin Access")}</h2>
            <p className="text-sm text-muted-foreground">{t("請輸入管理密鑰", "Enter your admin token to continue")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="token-input">{t("管理密鑰", "Admin Token")}</Label>
            <Input
              id="token-input"
              type="password"
              placeholder="ADMIN_TOKEN"
              value={tokenInput}
              className={tokenError ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => { setTokenInput(e.target.value); setTokenError(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tokenInput) {
                  sessionStorage.setItem("admin_token", tokenInput);
                  setToken(tokenInput);
                  setTokenError(false);
                }
              }}
            />
            {tokenError && (
              <p className="text-xs text-destructive mt-1">
                {t("管理密鑰不正確，請重試。", "Incorrect admin token. Please try again.")}
              </p>
            )}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (tokenInput) {
                sessionStorage.setItem("admin_token", tokenInput);
                setToken(tokenInput);
                setTokenError(false);
              }
            }}
          >
            {t("登入", "Enter")}
          </Button>
          <div className="text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                {t("返回地圖", "Back to Map")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: TruckSchedule) => {
    setEditingId(s.id);
    setForm({
      truckNumber: s.truckNumber,
      districtCode: s.districtCode,
      districtNameTc: s.districtNameTc,
      districtNameEn: s.districtNameEn,
      locationNameTc: s.locationNameTc,
      locationNameEn: s.locationNameEn ?? "",
      addressTc: s.addressTc ?? "",
      dateFrom: s.dateFrom,
      dateTo: s.dateTo,
      closedDates: s.closedDates ?? "",
      isLcsdLibrary: s.isLcsdLibrary ?? false,
      notesTc: s.notesTc ?? "",
      notesEn: s.notesEn ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      truckNumber: form.truckNumber,
      districtCode: form.districtCode,
      districtNameTc: form.districtNameTc,
      districtNameEn: form.districtNameEn,
      locationNameTc: form.locationNameTc,
      locationNameEn: form.locationNameEn || null,
      addressTc: form.addressTc || null,
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      closedDates: form.closedDates || null,
      isLcsdLibrary: form.isLcsdLibrary,
      notesTc: form.notesTc || null,
      notesEn: form.notesEn || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const setDistrict = (code: string) => {
    const d = DISTRICTS[code];
    setForm(f => ({ ...f, districtCode: code, districtNameTc: d?.tc ?? "", districtNameEn: d?.en ?? "" }));
  };

  const filtered = (schedules ?? []).filter(s =>
    filterTruck === "all" ? true : s.truckNumber === parseInt(filterTruck)
  );

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-4 w-4" />
              {t("返回地圖", "Back")}
            </Button>
          </Link>
          <h1 className="font-bold text-sm">{t("收銀車日程管理", "Schedule Management")}</h1>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          {t("新增記錄", "Add Schedule")}
        </Button>
      </header>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: t("全部記錄", "Total"), value: schedules?.length ?? 0, color: "text-foreground" },
            { label: t("收銀車 1 號", "Truck 1"), value: schedules?.filter(s => s.truckNumber === 1).length ?? 0, color: "text-blue-700" },
            { label: t("收銀車 2 號", "Truck 2"), value: schedules?.filter(s => s.truckNumber === 2).length ?? 0, color: "text-amber-700" },
            { label: t("服務中", "Active Today"), value: schedules?.filter(s => s.dateFrom <= new Date().toISOString().slice(0,10) && s.dateTo >= new Date().toISOString().slice(0,10)).length ?? 0, color: "text-green-700" },
          ].map(stat => (
            <Card key={stat.label} className="p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-3">
          <Select value={filterTruck} onValueChange={setFilterTruck}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("全部收銀車", "All Trucks")}</SelectItem>
              <SelectItem value="1">{t("收銀車 1 號", "Truck 1")}</SelectItem>
              <SelectItem value="2">{t("收銀車 2 號", "Truck 2")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} {t("條記錄", "records")}</span>
        </div>

        {/* Table */}
        <Card>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">{t("收銀車", "Truck")}</TableHead>
                  <TableHead>{t("地區", "District")}</TableHead>
                  <TableHead className="min-w-[200px]">{t("地點", "Location")}</TableHead>
                  <TableHead>{t("日期", "Dates")}</TableHead>
                  <TableHead className="w-16">{t("特別", "Special")}</TableHead>
                  <TableHead className="w-20 text-right">{t("操作", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold"
                        style={{ borderColor: TRUCK_COLORS[s.truckNumber], color: TRUCK_COLORS[s.truckNumber] }}
                      >
                        {lang === "tc" ? TRUCK_LABELS[s.truckNumber]?.tc : TRUCK_LABELS[s.truckNumber]?.en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {lang === "tc" ? s.districtNameTc : s.districtNameEn}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs">
                      <div className="truncate">
                        {lang === "tc" ? s.locationNameTc : (s.locationNameEn ?? s.locationNameTc)}
                      </div>
                      {s.notesTc && (
                        <div className="text-amber-600 text-[11px] truncate">{lang === "tc" ? s.notesTc : s.notesEn}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {s.dateFrom} – {s.dateTo}
                    </TableCell>
                    <TableCell>
                      {s.isLcsdLibrary && (
                        <Badge variant="outline" className="text-[10px] px-1 text-amber-600 border-amber-300">
                          {t("圖書館", "Library")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("編輯服務記錄", "Edit Schedule") : t("新增服務記錄", "Add Schedule")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Truck number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("收銀車", "Truck")}</Label>
                <Select value={String(form.truckNumber)} onValueChange={v => setForm(f => ({ ...f, truckNumber: parseInt(v) }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("收銀車 1 號", "Truck 1")}</SelectItem>
                    <SelectItem value="2">{t("收銀車 2 號", "Truck 2")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("地區", "District")}</Label>
                <Select value={form.districtCode} onValueChange={setDistrict}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISTRICTS).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {lang === "tc" ? label.tc : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location names */}
            <div className="space-y-1">
              <Label className="text-xs">{t("地點名稱（中文）", "Location Name (Chinese)")}</Label>
              <Input className="h-8 text-xs" value={form.locationNameTc} onChange={e => setForm(f => ({ ...f, locationNameTc: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("地點名稱（英文）", "Location Name (English)")}</Label>
              <Input className="h-8 text-xs" value={form.locationNameEn} onChange={e => setForm(f => ({ ...f, locationNameEn: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("地址（中文）", "Address (Chinese)")}</Label>
              <Input className="h-8 text-xs" value={form.addressTc} onChange={e => setForm(f => ({ ...f, addressTc: e.target.value }))} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("開始日期", "Date From")}</Label>
                <Input type="date" className="h-8 text-xs" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("結束日期", "Date To")}</Label>
                <Input type="date" className="h-8 text-xs" value={form.dateTo} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} />
              </div>
            </div>

            {/* Closed dates */}
            <div className="space-y-1">
              <Label className="text-xs">{t("暫停日期（逗號分隔，如 2026-01-06,2026-01-07）", "Closed Dates (comma-separated, e.g. 2026-01-06)")}</Label>
              <Input className="h-8 text-xs" value={form.closedDates} onChange={e => setForm(f => ({ ...f, closedDates: e.target.value }))} placeholder="2026-01-06,2026-01-07" />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">{t("備注（中文）", "Notes (Chinese)")}</Label>
              <Input className="h-8 text-xs" value={form.notesTc} onChange={e => setForm(f => ({ ...f, notesTc: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("備注（英文）", "Notes (English)")}</Label>
              <Input className="h-8 text-xs" value={form.notesEn} onChange={e => setForm(f => ({ ...f, notesEn: e.target.value }))} />
            </div>

            {/* LCSD checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lcsd"
                checked={form.isLcsdLibrary}
                onChange={e => setForm(f => ({ ...f, isLcsdLibrary: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="lcsd" className="text-xs cursor-pointer">
                {t("康文署流動圖書館服務點 (*)", "LCSD Mobile Library Service Point (*)")}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t("取消", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isMutating || !form.locationNameTc || !form.dateFrom || !form.dateTo}>
              {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              {editingId ? t("儲存更改", "Save Changes") : t("新增", "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認刪除", "Confirm Delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("此操作不可撤銷，確定要刪除此服務記錄嗎？", "This action cannot be undone. Are you sure you want to delete this schedule?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              {t("刪除", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
