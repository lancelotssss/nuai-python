import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  CalendarDays,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Eye,
  FileText,
  Loader2,
  Lock,
  LockOpen,
  MapPin,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const PAGE_SIZE_DEFAULT = 10;

function safe(v) {
  return String(v ?? "").trim();
}

function norm(v) {
  return safe(v).toLowerCase();
}

function formatDateOnly(value) {
  try {
    if (!value) return "—";
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return safe(value) || "—";
  }
}

function formatEventDateRange(event) {
  const start = safe(event?.eventDate);
  const end = safe(event?.endDate);

  if (!start && !end) return "—";
  if (start && !end) return formatDateOnly(start);
  if (!start && end) return formatDateOnly(end);
  if (start === end) return formatDateOnly(start);

  return `${formatDateOnly(start)} — ${formatDateOnly(end)}`;
}

function formatTime12Hour(timeValue) {
  const value = String(timeValue || "").trim();

  if (!value) return "";

  const twelveHourMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1]);
    const minute = String(twelveHourMatch[2] || "00").padStart(2, "0");
    const period = twelveHourMatch[3].toUpperCase();

    return `${hour}:${minute} ${period}`;
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!twentyFourHourMatch) return value;

  const hour24 = Number(twentyFourHourMatch[1]);
  const minute = twentyFourHourMatch[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

function formatEventTimeRange(event) {
  if (event?.allDay) return "All day";

  const start = formatTime12Hour(event?.startTime);
  const end = formatTime12Hour(event?.endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "";
}

function normalizeEventStatus(status) {
  const value = safe(status).toLowerCase();

  if (
    ["published", "active", "draft", "cancelled", "completed", "closed"].includes(
      value,
    )
  ) {
    return value;
  }

  return "draft";
}

function parseDateTimeSafe(dateValue, timeValue = "") {
  const rawDate = safe(dateValue);
  if (!rawDate) return null;

  const rawTime = safe(timeValue);
  const normalizedTime = rawTime || "23:59";
  const parsed = new Date(`${rawDate}T${normalizedTime}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getEffectiveEventStatus(event) {
  const saved = normalizeEventStatus(event?.status);

  if (saved === "draft") return "draft";
  if (saved === "cancelled") return "cancelled";
  if (saved === "completed") return "completed";
  if (saved === "closed") return "closed";

  const endDate = safe(event?.endDate) || safe(event?.eventDate);
  if (!endDate) return saved === "active" ? "published" : saved;

  let isExpired = false;

  if (event?.allDay) {
    const endOfDay = parseDateTimeSafe(endDate, "23:59");
    isExpired = endOfDay ? new Date() > endOfDay : false;
  } else {
    const endDateTime = parseDateTimeSafe(endDate, event?.endTime || "23:59");
    isExpired = endDateTime ? new Date() > endDateTime : false;
  }

  if (isExpired) return "closed";

  return saved === "active" ? "published" : saved;
}

function formatEventStatusLabel(status) {
  const value = normalizeEventStatus(status);
  if (value === "published") return "Active";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEventStatusBadge(status) {
  switch (normalizeEventStatus(status)) {
    case "published":
      return {
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "closed":
      return {
        cls: "bg-red-50 text-red-700 border border-red-200",
      };
    case "cancelled":
      return {
        cls: "bg-red-50 text-red-700 border border-red-200",
      };
    case "completed":
      return {
        cls: "bg-blue-50 text-blue-700 border border-blue-200",
      };
    case "draft":
    default:
      return {
        cls: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      };
  }
}

function getMonthValueFromDate(value) {
  try {
    if (!value) return "";
    return format(parseISO(value), "MM");
  } catch {
    return "";
  }
}

function getMonthLabelFromValue(value) {
  const monthMap = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };

  return monthMap[value] || value;
}

function getYearFromDate(value) {
  try {
    if (!value) return "";
    return format(parseISO(value), "yyyy");
  } catch {
    return "";
  }
}

export default function CalendarTableView({
  events,
  selectedDate,
  onSelectDate,
  onPreviewEvent,
  onEditEvent,
  onDeleteEvent,
  onCreateEvent,
  onCloseEvent,
  onOpenEvent,
  actionLoadingId = "",
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    event: null,
  });
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    mode: "",
    event: null,
  });

  const selectTriggerCls =
    "h-9 w-full bg-background border border-input rounded-md shadow-sm text-sm transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

  const normalizedEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      effectiveStatus: getEffectiveEventStatus(event),
    }));
  }, [events]);

  const monthOptions = useMemo(() => {
    const seen = new Set();

    normalizedEvents.forEach((event) => {
      const monthValue = getMonthValueFromDate(event.eventDate);
      if (monthValue) {
        seen.add(monthValue);
      }
    });

    return [...seen]
      .sort((a, b) => a.localeCompare(b))
      .map((monthValue) => ({
        value: monthValue,
        label: getMonthLabelFromValue(monthValue),
      }));
  }, [normalizedEvents]);

  const yearOptions = useMemo(() => {
    const seen = new Set();

    normalizedEvents.forEach((event) => {
      const year = getYearFromDate(event.eventDate);
      if (year) {
        seen.add(year);
      }
    });

    return [...seen].sort((a, b) => b.localeCompare(a));
  }, [normalizedEvents]);

  const filtered = useMemo(() => {
    const q = norm(search);

    return normalizedEvents
      .filter((event) => {
        const displayCategory =
          event.category === "others" ? event.customCategory : event.category;

        const eventMonthValue = getMonthValueFromDate(event.eventDate);
        const eventYear = getYearFromDate(event.eventDate);

        const matchesSearch =
          !q ||
          [
            event.title,
            event.description,
            event.location,
            displayCategory,
            event.eventDate,
            event.endDate,
            event.endTime,
            event.startTime,
            event.createdByName,
            event.createdByEmail,
            event.effectiveStatus,
          ]
            .map(norm)
            .join(" | ")
            .includes(q);

        const matchesStatus =
          statusFilter === "all" || event.effectiveStatus === statusFilter;

        const matchesMonth =
          monthFilter === "all" || eventMonthValue === monthFilter;

        const matchesYear = yearFilter === "all" || eventYear === yearFilter;

        return matchesSearch && matchesStatus && matchesMonth && matchesYear;
      })
      .sort((a, b) => {
        const aKey = `${a.eventDate || ""} ${a.startTime || ""}`;
        const bKey = `${b.eventDate || ""} ${b.startTime || ""}`;

        return sortOrder === "recent"
          ? bKey.localeCompare(aKey)
          : aKey.localeCompare(bKey);
      });
  }, [normalizedEvents, search, statusFilter, monthFilter, yearFilter, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, monthFilter, yearFilter, sortOrder]);

  useEffect(() => {
    const activeIds = new Set(
      normalizedEvents.map((event) => event.id).filter(Boolean),
    );

    setSelectedIds((prev) => prev.filter((id) => activeIds.has(id)));
  }, [normalizedEvents]);

  const selectedRows = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return normalizedEvents.filter((event) => selectedSet.has(event.id));
  }, [normalizedEvents, selectedIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const pageIds = paginated.map((event) => event.id).filter(Boolean);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected =
    pageIds.some((id) => selectedIds.includes(id)) && !allSelected;

  const totalPublished = normalizedEvents.filter(
    (item) => item.effectiveStatus === "published",
  ).length;
  const totalDraft = normalizedEvents.filter(
    (item) => item.effectiveStatus === "draft",
  ).length;
  const totalClosed = normalizedEvents.filter(
    (item) => item.effectiveStatus === "closed",
  ).length;

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    monthFilter !== "all" ||
    yearFilter !== "all" ||
    sortOrder !== "recent";

  const selectedCount = selectedIds.length;
  const dialogEventTitle = statusDialog.event?.title || "this event";
  const deleteEventTitle = deleteDialog.event?.title || "this event";

  function resetAllFilters() {
    setSearch("");
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setSortOrder("recent");
  }

  function toggleRow(event) {
    if (!event?.id) return;

    setSelectedIds((prev) =>
      prev.includes(event.id)
        ? prev.filter((id) => id !== event.id)
        : [...prev, event.id],
    );
  }

  function toggleAllRows() {
    if (!pageIds.length) return;

    setSelectedIds((prev) => {
      if (pageIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !pageIds.includes(id));
      }

      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function openDeleteDialog(event) {
    setDeleteDialog({
      open: true,
      event,
    });
  }

  function closeDeleteDialog() {
    setDeleteDialog({
      open: false,
      event: null,
    });
  }

  async function handleConfirmSingleDelete() {
    if (!onDeleteEvent || !deleteDialog.event) return;

    try {
      await onDeleteEvent(deleteDialog.event);
    } finally {
      closeDeleteDialog();
    }
  }

  function openStatusDialog(mode, event) {
    setStatusDialog({
      open: true,
      mode,
      event,
    });
  }

  function closeStatusDialog() {
    setStatusDialog({
      open: false,
      mode: "",
      event: null,
    });
  }

  async function handleConfirmStatusAction() {
    const event = statusDialog.event;
    if (!event) return;

    try {
      if (statusDialog.mode === "close" && onCloseEvent) {
        await onCloseEvent(event);
      }

      if (statusDialog.mode === "open" && onOpenEvent) {
        await onOpenEvent(event);
      }
    } finally {
      closeStatusDialog();
    }
  }

  async function handleConfirmBulkDelete() {
    if (!onDeleteEvent || selectedRows.length === 0) return;

    setBulkDeleting(true);

    try {
      for (const event of selectedRows) {
        await onDeleteEvent(event);
      }

      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#3D398C]/20 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10 transition-colors duration-200 group-hover:bg-[#3D398C]/15">
                <CalendarDays className="h-5 w-5 text-[#3D398C]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold leading-tight tracking-tight text-[#3D398C]">
                  {normalizedEvents.length}
                </p>
                <p className="text-xs font-semibold text-foreground/80">
                  Total Events
                </p>
                <p className="text-[10px] text-muted-foreground">
                  All calendar event records
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-200 group-hover:bg-emerald-100">
                <Eye className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold leading-tight tracking-tight text-emerald-700">
                  {totalPublished}
                </p>
                <p className="text-xs font-semibold text-foreground/80">
                  Active
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Visible calendar events
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 transition-colors duration-200 group-hover:bg-red-600">
                <CircleDashed className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold leading-tight tracking-tight text-red-700">
                  {totalClosed}
                </p>
                <p className="text-xs font-semibold text-foreground/80">
                  Closed
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Already ended or manually closed
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-yellow-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 transition-colors duration-200 group-hover:bg-yellow-100">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold leading-tight tracking-tight text-yellow-700">
                  {totalDraft}
                </p>
                <p className="text-xs font-semibold text-foreground/80">
                  Drafts
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Still being prepared
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-[220px] max-w-sm">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by title, category, date, location..."
                  className="pl-8 pr-8 h-9 text-sm bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search ? (
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 hover:bg-muted transition-colors duration-150"
                    onClick={() => setSearch("")}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={onCreateEvent}
                disabled={!onCreateEvent}
                className="h-9 rounded-lg bg-[#3D398C] px-4 text-xs font-semibold text-white hover:bg-[#2f2b73]"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Create Events
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-[140px] flex-1 max-w-[170px]">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px] flex-1 max-w-[180px]">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Month
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[120px] flex-1 max-w-[140px]">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Year
              </Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                  <SelectItem value="all">All Years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[130px] flex-1 max-w-[150px]">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Sort
              </Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div>
                <Label className="mb-1 block text-[11px] font-medium text-transparent select-none pointer-events-none">
                  &nbsp;
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasActiveFilters}
                  className="font-medium h-9 gap-1.5"
                  onClick={resetAllFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="ml-auto flex items-end">
              <div>
                <Label className="mb-1 block text-[11px] font-medium text-transparent select-none pointer-events-none">
                  &nbsp;
                </Label>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={selectedCount === 0 || !onDeleteEvent || bulkDeleting}
                  className="h-9 gap-1.5"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  {bulkDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                  {selectedCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[10px] px-1.5 py-0 h-4"
                    >
                      {selectedCount}
                    </Badge>
                  ) : null}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {selectedCount > 0 ? (
          <div className="flex items-center justify-between rounded-lg border border-[#3D398C]/20 bg-[#3D398C]/5 px-4 py-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3D398C]/10">
                <CalendarDays className="h-3 w-3 text-[#3D398C]" />
              </div>
              <span className="text-xs font-medium text-[#3D398C]">
                {selectedCount} {selectedCount === 1 ? "event" : "events"}{" "}
                selected
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] font-medium gap-1.5"
              onClick={clearSelection}
            >
              <RotateCcw className="h-3 w-3" />
              Clear Selection
            </Button>
          </div>
        ) : null}

        <div className="rounded-lg border border-border shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/40 border-b border-border">
                  <TableHead className="w-10 py-2 px-3">
                    <input
                      type="checkbox"
                      checked={allSelected || someSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleAllRows}
                      className="h-3.5 w-3.5 rounded border-gray-300 accent-[#3D398C] cursor-pointer"
                    />
                  </TableHead>

                  <TableHead className="min-w-[200px] py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Event
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Time
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-right py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Search className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground/70">
                            No events found
                          </p>
                          {hasActiveFilters ? (
                            <div className="space-y-1.5">
                              <p className="text-[11px] text-muted-foreground">
                                No events match your current search or filters.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] gap-1.5"
                                onClick={resetAllFilters}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Clear all filters
                              </Button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              No event records exist yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((event) => {
                    const badge = getEventStatusBadge(event.effectiveStatus);
                    const displayCategory =
                      event.category === "others"
                        ? event.customCategory
                        : event.category;
                    const eventDate = event.eventDate
                      ? parseISO(event.eventDate)
                      : null;

                    const canClose = event.effectiveStatus === "published";
                    const canOpen = event.effectiveStatus === "closed";
                    const isSelected = selectedIds.includes(event.id);

                    return (
                      <TableRow
                        key={event.id}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? "bg-[#3D398C]/5 hover:bg-[#3D398C]/10"
                            : "hover:bg-muted/40"
                        }`}
                        onClick={() => {
                          if (eventDate) onSelectDate(eventDate);
                          onPreviewEvent(event, eventDate);
                        }}
                      >
                        <TableCell
                          className="py-2 px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(event)}
                            className="h-3.5 w-3.5 rounded border-gray-300 accent-[#3D398C] cursor-pointer"
                          />
                        </TableCell>

                        <TableCell className="py-2 px-3">
                          <div className="min-w-0">
                            <span className="text-[13px] font-semibold text-foreground truncate block max-w-[240px]">
                              {event.title || "Untitled Event"}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate block max-w-[240px] mt-0.5">
                              {event.description || "No description provided."}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate block max-w-[180px]">
                              {event.location || "—"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatEventDateRange(event)}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                          {formatEventTimeRange(event) || "—"}
                        </TableCell>

                        <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                          <span className="capitalize">
                            {displayCategory || "—"}
                          </span>
                        </TableCell>

                        <TableCell className="py-2 px-3">
                          <Badge
                            className={`${badge.cls} text-[10px] font-medium px-1.5 py-0 h-5 gap-1`}
                          >
                            {formatEventStatusLabel(event.effectiveStatus)}
                          </Badge>
                        </TableCell>

                        <TableCell
                          className="py-2 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionLoadingId === event.id}
                              >
                                {actionLoadingId === event.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                              {onEditEvent ? (
                                <DropdownMenuItem
                                  onClick={() => onEditEvent(event)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              ) : null}

                              {canClose && onCloseEvent ? (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog("close", event)}
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  Close
                                </DropdownMenuItem>
                              ) : null}

                              {canOpen && onOpenEvent ? (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog("open", event)}
                                >
                                  <LockOpen className="mr-2 h-4 w-4" />
                                  Open
                                </DropdownMenuItem>
                              ) : null}

                              {onDeleteEvent ? (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => openDeleteDialog(event)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border px-4 py-2.5 bg-muted/20">
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length === 0 ? 0 : pageStart + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">{pageEnd}</span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "record" : "records"}
                {filtered.length !== normalizedEvents.length ? (
                  <span className="text-muted-foreground/60">
                    {" "}
                    (filtered from {normalizedEvents.length})
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Rows per page
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[62px] text-[11px] bg-background border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem
                        key={n}
                        value={String(n)}
                        className="text-[11px]"
                      >
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="h-4 w-px bg-border" />

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <span className="px-2 text-[11px] font-medium text-muted-foreground tabular-nums">
                {safePage} / {totalPages}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected events?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {selectedCount}{" "}
              {selectedCount === 1 ? "selected event" : "selected events"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={bulkDeleting || selectedCount === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                "{deleteEventTitle}"
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoadingId === deleteDialog.event?.id}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirmSingleDelete}
              disabled={actionLoadingId === deleteDialog.event?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoadingId === deleteDialog.event?.id
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={statusDialog.open}
        onOpenChange={(open) => !open && closeStatusDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialog.mode === "close"
                ? "Close this event?"
                : "Open this event?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog.mode === "close"
                ? `This will mark "${dialogEventTitle}" as closed. It will no longer appear as active.`
                : `This will reopen "${dialogEventTitle}" and make it active again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusAction}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              {statusDialog.mode === "close" ? "Close Event" : "Open Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}