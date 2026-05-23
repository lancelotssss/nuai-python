// src/components/logs/ViewLogs.jsx

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Activity,
  ShieldCheck,
  LogOut,
  PencilLine,
  BriefcaseBusiness,
  UserRound,
  ListChecks,
} from "lucide-react";

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DEBOUNCE_MS = 350;
const BRAND_BLUE = "#3D398C";

function safe(v) {
  return v == null ? "—" : String(v);
}

function toMillis(v) {
  if (!v) return 0;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  if (typeof v?._seconds === "number") return v._seconds * 1000;

  const parsed = new Date(v).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toTextDate(v) {
  const ms = toMillis(v);
  if (!ms) return "—";

  try {
    return new Date(ms).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function normalizeAction(a) {
  return String(a || "")
    .trim()
    .toUpperCase();
}

function prettifyAction(action) {
  const normalized = normalizeAction(action);
  if (!normalized) return "—";

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function defaultActionTone(action) {
  const normalized = normalizeAction(action);

  if (normalized.includes("LOGIN") || normalized.includes("LOGOUT")) {
    return {
      badge:
        "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50",
      icon: LogOut,
    };
  }

  if (
    normalized.includes("JOB") ||
    normalized.includes("APPLICANT") ||
    normalized.includes("APPLICATION")
  ) {
    return {
      badge:
        "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50",
      icon: BriefcaseBusiness,
    };
  }

  if (
    normalized.includes("PROFILE") ||
    normalized.includes("PASSWORD") ||
    normalized.includes("PARTNER")
  ) {
    return {
      badge:
        "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50",
      icon: UserRound,
    };
  }

  if (
    normalized.includes("EDIT") ||
    normalized.includes("UPDATE") ||
    normalized.includes("SAVE")
  ) {
    return {
      badge:
        "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-50",
      icon: PencilLine,
    };
  }

  if (
    normalized.includes("APPROVE") ||
    normalized.includes("DENY") ||
    normalized.includes("HOLD") ||
    normalized.includes("PENDING")
  ) {
    return {
      badge:
        "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-50",
      icon: ListChecks,
    };
  }

  return {
    badge:
      "bg-[#3D398C]/5 text-[#3D398C] border border-[#3D398C]/20 hover:bg-[#3D398C]/5",
    icon: ShieldCheck,
  };
}

function defaultSearchText(row) {
  return [
    row?.action,
    row?.details,
    row?.actorEmail,
    row?.actorRole,
    row?.meta ? JSON.stringify(row.meta) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function ViewLogs({
  title = "System Logs",
  description = "Review recent activity logs.",
  rows = [],
  loading = false,
  error = "",
  onRefresh,
  searchPlaceholder = "Search logs...",
  emptyTitle = "No logs found",
  emptyDescription = "No rows match your current search or filter.",
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  getActionTone = defaultActionTone,
  getSearchText = defaultSearchText,
  renderDetails,
  detailsHeader = "Details",
}) {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const [actionFilter, setActionFilter] = useState("__all__");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [searchInput, debounceMs]);

  useEffect(() => {
    setPageIndex(0);
  }, [pageSize, actionFilter, debouncedSearch]);

  const actionOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((r) => {
      const normalized = normalizeAction(r?.action);
      if (!normalized) return;

      if (!map.has(normalized)) {
        map.set(normalized, {
          value: normalized,
          label: prettifyAction(normalized),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedAction = normalizeAction(actionFilter);
    const q = String(debouncedSearch || "").trim().toLowerCase();

    return rows.filter((row) => {
      if (normalizedAction && normalizedAction !== "__ALL__".replaceAll("_", "")) {
        if (actionFilter !== "__all__" && normalizeAction(row?.action) !== normalizedAction) {
          return false;
        }
      }

      if (q) {
        const hay = getSearchText(row);
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [rows, actionFilter, debouncedSearch, getSearchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePageIndex, pageSize]);

  const visibleStart =
    filteredRows.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const visibleEnd = Math.min(
    (safePageIndex + 1) * pageSize,
    filteredRows.length,
  );

  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;
  const hasActiveFilters =
    actionFilter !== "__all__" || searchInput.trim() !== "";

  function resetAllFilters() {
    setActionFilter("__all__");
    setSearchInput("");
    setDebouncedSearch("");
    setPageIndex(0);
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive animate-in fade-in-50 slide-in-from-top-1 duration-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#3D398C]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {onRefresh ? (
          <Button
            onClick={onRefresh}
            disabled={loading}
            className="shrink-0 gap-1.5 mt-3 sm:mt-0"
            style={{ backgroundColor: BRAND_BLUE, color: "white" }}
          >
            <Activity size={15} />
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_minmax(220px,0.9fr)_auto]">
          <div className="min-w-0">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-8 h-9 text-sm bg-background border-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            {searchInput !== debouncedSearch ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Searching...
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Action Filter
            </label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-full bg-background border-input">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                align="start"
                className="min-w-[var(--radix-select-trigger-width)]"
              >
                <SelectItem value="__all__">All Actions</SelectItem>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-transparent select-none pointer-events-none">
                &nbsp;
              </label>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasActiveFilters}
                className="font-medium h-9 gap-1.5"
                onClick={resetAllFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/40 border-b border-border">
                <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Created At
                </TableHead>
                <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Action
                </TableHead>
                <TableHead className="py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {detailsHeader}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/70">
                          Loading logs...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/70">
                          {emptyTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {hasActiveFilters
                            ? emptyDescription
                            : "No logs are available yet."}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const actionUI = getActionTone(row?.action);
                  const ActionIcon = actionUI.icon;

                  return (
                    <TableRow
                      key={row?.id || `${row?.action}-${row?.createdAt}`}
                      className="hover:bg-muted/40 transition-colors duration-150 cursor-default"
                    >
                      <TableCell className="py-2 px-3 text-[13px] font-semibold text-foreground whitespace-nowrap">
                        {toTextDate(row?.createdAt)}
                      </TableCell>

                      <TableCell className="py-2 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium gap-1 ${actionUI.badge}`}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {safe(row?.action)}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-2 px-3">
                        {renderDetails ? (
                          renderDetails(row)
                        ) : (
                          <>
                            <div
                              className="max-w-[320px] md:max-w-[420px] lg:max-w-[560px] truncate-2-lines text-xs font-medium text-foreground/80 leading-relaxed"
                              title={safe(row?.details)}
                            >
                              {safe(row?.details)}
                            </div>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-[11px]">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="ml-2">{filteredRows.length} filtered</span>

            {filteredRows.length > 0 ? (
              <span>
                ({visibleStart}-{visibleEnd})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs text-muted-foreground">
              Page{" "}
              <span className="font-semibold text-foreground">
                {safePageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {totalPages}
              </span>
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPageIndex(0)}
              disabled={loading || !canPrev}
            >
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={loading || !canPrev}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
              }
              disabled={loading || !canNext}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={loading || !canNext}
              onClick={() => setPageIndex(totalPages - 1)}
              title="Last page"
            >
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}