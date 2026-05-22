// src/pages/super-admin/system-audit/AdminSystemLogs.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageTitle from "../../../components/PageTitle";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Activity,
  Globe2,
  UserRound,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const BRAND_BLUE = "#3D398C";
const AUDIT_SCOPE_SYSTEM = "system";
const AUDIT_SCOPE_OWN = "own";

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

function toTextDate(v) {
  if (!v) return "—";

  const date = new Date(v);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString();
  }

  return String(v);
}

function safe(v) {
  return v == null || v === "" ? "—" : String(v);
}

function normalizeAction(a) {
  return String(a || "")
    .trim()
    .toUpperCase();
}

function prettyError(err) {
  return err?.message || "Failed to load logs";
}

function normalizeAuditRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    action: row.action,
    details: row.details,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    targetTable: row.target_table,
    targetId: row.target_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    meta: row.metadata,
    raw: row,
  };
}

export default function AdminSystemLogs() {
  const navigate = useNavigate();
  const account = useMemo(() => getStoredAccount(), []);

  const PS_OPTIONS = [20, 50, 100];

  const [auditScope, setAuditScope] = useState(AUDIT_SCOPE_SYSTEM);
  const [pageSize, setPageSize] = useState(20);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [pageIndex, setPageIndex] = useState(0);

  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");

  const actorEmail = String(account?.email || "").trim();

  const isAllowed = useMemo(() => {
    const r = String(account?.role || "").toLowerCase();
    return r === "super admin" || r === "super-admin" || r === "superadmin";
  }, [account]);

  const isOwnAudit = auditScope === AUDIT_SCOPE_OWN;

  useEffect(() => {
    if (!account || !isAllowed) {
      navigate("/login", { replace: true });
    }
  }, [account, isAllowed, navigate]);

  function resetPaging() {
    setPageIndex(0);
  }

  async function fetchLogs() {
    setLoading(true);
    setErr("");

    try {
      if (isOwnAudit && !actorEmail) {
        setAllRows([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();

      if (isOwnAudit) {
        params.set("actor_email", actorEmail);
      }

      const url = params.toString()
        ? `${API_BASE_URL}/system-audit/?${params.toString()}`
        : `${API_BASE_URL}/system-audit/`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to load logs");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];

      setAllRows(list.map(normalizeAuditRow));
      setPageIndex(0);
    } catch (e) {
      setErr(prettyError(e));
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!account || !isAllowed) return;

    resetPaging();
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditScope, actorEmail, isAllowed]);

  useEffect(() => {
    resetPaging();
  }, [pageSize]);

  const filteredRows = useMemo(() => {
    const a = normalizeAction(actionFilter);
    const s = String(search || "")
      .trim()
      .toLowerCase();

    return allRows.filter((r) => {
      if (a && normalizeAction(r.action) !== a) return false;

      if (s) {
        const hay = [
          r.action,
          r.details,
          r.actorEmail,
          r.actorRole,
          r.targetTable,
          r.targetId,
          r.ipAddress,
          r.userAgent,
          r?.meta ? JSON.stringify(r.meta) : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(s)) return false;
      }

      return true;
    });
  }, [allRows, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const rows = filteredRows.slice(start, start + pageSize);

  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  const hasActiveFilters = actionFilter !== "" || search !== "";

  function resetAllFilters() {
    setActionFilter("");
    setSearch("");
    setPageIndex(0);
  }

  function handleScopeChange(nextScope) {
    if (nextScope === auditScope) return;

    setAuditScope(nextScope);
    setActionFilter("");
    setSearch("");
    resetPaging();
  }

  function goToPage(nextIndex) {
    const next = Math.max(0, Math.min(nextIndex, totalPages - 1));
    setPageIndex(next);
  }

  if (!account || !isAllowed) {
    return (
      <>
        <PageTitle title="System Audit Logs | NUAI" />
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3D398C] border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading system audit logs...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="System Audit Logs | NUAI" />

      <div className="space-y-5 animate-fadeIn">
        {err ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive animate-in fade-in-50 slide-in-from-top-1 duration-200">
            {err}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#3D398C]">
              System Audit Logs
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isOwnAudit
                ? "Review only your own recorded activity and recent actions."
                : "Review platform-wide events, actions, and actor details."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => handleScopeChange(AUDIT_SCOPE_SYSTEM)}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all duration-150 ${
                  auditScope === AUDIT_SCOPE_SYSTEM
                    ? "bg-[#3D398C] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-[#3D398C]"
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                System Wide
              </button>

              <button
                type="button"
                onClick={() => handleScopeChange(AUDIT_SCOPE_OWN)}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all duration-150 ${
                  auditScope === AUDIT_SCOPE_OWN
                    ? "bg-[#3D398C] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-[#3D398C]"
                }`}
              >
                <UserRound className="h-3.5 w-3.5" />
                My Audit
              </button>
            </div>

            <Button
              onClick={fetchLogs}
              disabled={loading}
              className="shrink-0 gap-1.5"
              style={{ backgroundColor: BRAND_BLUE, color: "white" }}
            >
              <Activity size={15} />
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search details, email, role, meta..."
                  className="h-9 border-input bg-background pl-8 text-sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPageIndex(0);
                  }}
                />
              </div>
            </div>

            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Action Filter
              </label>
              <Input
                placeholder="e.g. LOGIN_SUCCESS"
                className="h-9 border-input bg-background text-sm"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>

            <div className="flex items-end">
              <div>
                <label className="mb-1 block select-none text-[11px] font-medium text-transparent pointer-events-none">
                  &nbsp;
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasActiveFilters}
                  className="h-9 gap-1.5 font-medium"
                  onClick={resetAllFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-transparent">
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Created At
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actor Email
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actor Role
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
                        <p className="text-sm font-medium text-foreground/70">
                          Loading logs...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Search className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground/70">
                            No logs found
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {hasActiveFilters
                              ? "No logs match your current search or filter criteria."
                              : isOwnAudit
                                ? "No personal audit logs found for this page."
                                : "No system audit logs found for this page."}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-default transition-colors duration-150 hover:bg-muted/40"
                    >
                      <TableCell className="whitespace-nowrap px-3 py-2 text-[13px] font-semibold text-foreground">
                        {toTextDate(r.createdAt)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-3 py-2">
                        <Badge
                          variant="outline"
                          className="border border-[#3D398C]/20 bg-[#3D398C]/5 text-[10px] font-medium text-[#3D398C]"
                        >
                          {safe(r.action)}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                        {safe(r.actorEmail)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                        {safe(r.actorRole)}
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <div
                          className="max-w-[320px] truncate-2-lines text-xs font-medium leading-relaxed text-foreground/80 md:max-w-[420px] lg:max-w-[500px]"
                          title={safe(r.details)}
                        >
                          {safe(r.details)}
                        </div>

                        {r.meta ? (
                          <div className="mt-1.5 max-w-full break-all text-[10px] text-muted-foreground/80">
                            <span className="mr-1 font-semibold">meta:</span>
                            <code className="rounded border border-border/50 bg-muted/40 px-1 py-0.5">
                              {(() => {
                                try {
                                  return JSON.stringify(r.meta);
                                } catch {
                                  return String(r.meta);
                                }
                              })()}
                            </code>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row">
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
                  {PS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="ml-2">{filteredRows.length} total</span>
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
                onClick={() => goToPage(0)}
                disabled={loading || !canPrev}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(safePageIndex - 1)}
                disabled={loading || !canPrev}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(safePageIndex + 1)}
                disabled={loading || !canNext}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={loading || !canNext}
                onClick={() => goToPage(totalPages - 1)}
                title="Last page"
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}