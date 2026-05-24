import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlumniQuickViewModal,
  BulkUploadReviewModal,
  BulkUploadSummaryModal,
} from "./OfficerManageUsersModals";
import {
  BB,
  BULK_UPLOAD_ACCEPT,
  PS_DEFAULT,
  PS_OPTIONS,
  buildPreRegisteredAlumniPayload,
  displayStatus,
  getAlumniName,
  getFileDuplicateSummary,
  norm,
  normalizeAlumni,
  normalizeListResponse,
  normalizePreRegisteredAlumni,
  parseBulkAlumniFile,
  safe,
  validateBulkImportRow,
} from "./officerManageUsersUtils";

const API_BASE_URL = "http://127.0.0.1:8000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail ||
      Object.values(data || {})?.flat?.()?.[0] ||
      "Request failed.";

    throw new Error(String(message));
  }

  return data;
}

function makeKey(row) {
  return `${row?.sourceType || "registered"}-${row?.id}`;
}

function duplicateSetsFromRows(rows = []) {
  return {
    studentIds: new Set(rows.map((item) => norm(item.studentId)).filter(Boolean)),
    emails: new Set(rows.map((item) => norm(item.email)).filter(Boolean)),
  };
}

export default function OfficerManageUsers() {
  const navigate = useNavigate();
  const preRegistrationUploadInputRef = useRef(null);

  const [registeredRows, setRegisteredRows] = useState([]);
  const [preRegisteredRows, setPreRegisteredRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("registered");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PS_DEFAULT);

  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkReviewOpen, setBulkReviewOpen] = useState(false);

  const [bulkSummary, setBulkSummary] = useState({
    open: false,
    fileName: "",
    totalRows: 0,
    uploadedCount: 0,
    skippedCount: 0,
    duplicateCount: 0,
    invalidCount: 0,
    duplicates: [],
    invalidRows: [],
  });

  const isRegisteredSource = sourceFilter === "registered";

  const loadRows = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const [alumniResult, preRegisteredResult] = await Promise.allSettled([
        apiRequest("/alumni/"),
        apiRequest("/pre-registered-alumni/"),
      ]);

      if (alumniResult.status === "rejected") {
        throw alumniResult.reason;
      }

      const registeredList = normalizeListResponse(alumniResult.value).map(normalizeAlumni);
      const preRegisteredList =
        preRegisteredResult.status === "fulfilled"
          ? normalizeListResponse(preRegisteredResult.value).map(normalizePreRegisteredAlumni)
          : [];

      setRegisteredRows(registeredList);
      setPreRegisteredRows(preRegisteredList);
      setRows(sourceFilter === "registered" ? registeredList : preRegisteredList);
      setCurrentPage(1);

      if (preRegisteredResult.status === "rejected") {
        toast.warning("Pre-registered alumni endpoint is not available", {
          description:
            "Registered alumni loaded, but /api/pre-registered-alumni/ could not be reached.",
        });
      }
    } catch (error) {
      setRegisteredRows([]);
      setPreRegisteredRows([]);
      setRows([]);
      setErr(error?.message || "Failed to load alumni records.");
      toast.error("Failed to load alumni records", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setRows(sourceFilter === "registered" ? registeredRows : preRegisteredRows);
    setSelected(null);
    setCurrentPage(1);
  }, [sourceFilter, registeredRows, preRegisteredRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, courseFilter, pageSize]);

  const courses = useMemo(() => {
    return Array.from(new Set(rows.map((row) => safe(row.course)).filter(Boolean))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = norm(search);

    return rows.filter((row) => {
      const statusOk =
        !isRegisteredSource || statusFilter === "all" || norm(row.status) === norm(statusFilter);
      const courseOk = courseFilter === "all" || safe(row.course) === courseFilter;

      if (!statusOk || !courseOk) return false;
      if (!q) return true;

      return [
        getAlumniName(row),
        row.studentId,
        row.email,
        row.personalEmail,
        row.contactNumber,
        row.course,
        row.courseFullName,
        row.graduationYear,
        row.academicAward,
        row.status,
      ]
        .map(norm)
        .join(" | ")
        .includes(q);
    });
  }, [rows, search, statusFilter, courseFilter, isRegisteredSource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const totalRecords = rows.length;
  const activeCount = registeredRows.filter((row) => norm(row.status) === "active").length;
  const inactiveCount = registeredRows.length - activeCount;
  const preRegisteredCount = preRegisteredRows.length;
  const hasActiveFilters =
    search !== "" || statusFilter !== "all" || courseFilter !== "all" || sourceFilter !== "registered";
  const activeFilterCount = [
    sourceFilter !== "registered",
    statusFilter !== "all",
    courseFilter !== "all",
  ].filter(Boolean).length;

  function resetAllFilters() {
    setSearch("");
    setSourceFilter("registered");
    setStatusFilter("all");
    setCourseFilter("all");
  }

  function openFullProfile(row) {
    if (row?.sourceType === "unregistered") {
      setSelected(row);
      return;
    }

    const id = row?.id;
    if (!id) return;
    navigate(`/alumni-officer/alumni/manage/${id}`);
  }

  function buildBulkRowStatus(parsedRows) {
    const fileDuplicateRowKeys = getFileDuplicateSummary(parsedRows);
    const existingRegistered = duplicateSetsFromRows(registeredRows);
    const existingPreRegistered = duplicateSetsFromRows(preRegisteredRows);

    return parsedRows.map((row) => {
      const errors = validateBulkImportRow(row);
      const duplicateReasons = [];
      const rowStudentId = norm(row.studentId);
      const rowEmail = norm(row.nuEmail);

      if (fileDuplicateRowKeys.has(row._rowKey)) {
        duplicateReasons.push("Duplicate inside uploaded file");
      }

      if (rowStudentId && existingRegistered.studentIds.has(rowStudentId)) {
        duplicateReasons.push("Student ID already exists in registered alumni");
      }

      if (rowStudentId && existingPreRegistered.studentIds.has(rowStudentId)) {
        duplicateReasons.push("Student ID already exists in pre-registered alumni");
      }

      if (rowEmail && existingRegistered.emails.has(rowEmail)) {
        duplicateReasons.push("NU Email already exists in registered alumni");
      }

      if (rowEmail && existingPreRegistered.emails.has(rowEmail)) {
        duplicateReasons.push("NU Email already exists in pre-registered alumni");
      }

      return {
        ...row,
        errors,
        duplicateReasons,
      };
    });
  }

  async function handleBulkAlumniUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const fileName = file.name || "";
    const lowerFileName = fileName.toLowerCase();
    const isAcceptedFile =
      lowerFileName.endsWith(".csv") ||
      lowerFileName.endsWith(".xlsx") ||
      lowerFileName.endsWith(".xls");

    if (!isAcceptedFile) {
      toast.error("Invalid file type", {
        description: "Please upload a CSV, XLS, or XLSX file.",
      });
      return;
    }

    setBulkUploading(true);
    setBulkFileName(fileName);
    setBulkRows([]);
    setBulkReviewOpen(false);

    try {
      const parsedRows = await parseBulkAlumniFile(file);

      if (!parsedRows.length) {
        toast.error("No usable rows found", {
          description: "The selected file does not contain valid alumni rows.",
        });
        return;
      }

      const rowsWithStatus = buildBulkRowStatus(parsedRows);
      setBulkRows(rowsWithStatus);
      setBulkReviewOpen(true);

      toast.success("File parsed successfully", {
        description: `${rowsWithStatus.length} row(s) ready for review.`,
      });
    } catch (error) {
      toast.error("Bulk upload failed", {
        description:
          error?.message ||
          "Something went wrong while reading the selected file.",
      });
    } finally {
      setBulkUploading(false);
    }
  }

  async function handleBulkReviewContinue(nextRows = bulkRows) {
    const invalidRows = [];
    const duplicateRows = [];
    const uploadableRows = [];

    nextRows.forEach((row) => {
      if ((row.errors || []).length > 0) {
        invalidRows.push({
          rowNumber: row._sourceRowNumber,
          studentId: row.studentId,
          nuEmail: row.nuEmail,
          errors: row.errors || [],
        });
        return;
      }

      if ((row.duplicateReasons || []).length > 0) {
        duplicateRows.push({
          rowNumber: row._sourceRowNumber,
          studentId: row.studentId,
          nuEmail: row.nuEmail,
          reasons: row.duplicateReasons || [],
        });
        return;
      }

      uploadableRows.push(row);
    });

    setBulkUploading(true);

    let uploadedCount = 0;
    const failedRows = [...invalidRows];

    try {
      for (const row of uploadableRows) {
        try {
          await apiRequest("/pre-registered-alumni/", {
            method: "POST",
            body: JSON.stringify(buildPreRegisteredAlumniPayload(row)),
          });
          uploadedCount += 1;
        } catch (error) {
          failedRows.push({
            rowNumber: row._sourceRowNumber,
            studentId: row.studentId,
            nuEmail: row.nuEmail,
            errors: [error?.message || "Failed to upload row."],
          });
        }
      }

      setBulkReviewOpen(false);
      setBulkRows([]);

      setBulkSummary({
        open: true,
        fileName: bulkFileName,
        totalRows: nextRows.length,
        uploadedCount,
        skippedCount: duplicateRows.length + failedRows.length,
        duplicateCount: duplicateRows.length,
        invalidCount: failedRows.length,
        duplicates: duplicateRows.slice(0, 20),
        invalidRows: failedRows.slice(0, 20),
      });

      toast.success("Bulk upload finished", {
        description: `${uploadedCount} uploaded, ${duplicateRows.length} duplicates skipped, ${failedRows.length} failed rows.`,
      });

      await loadRows();
      setSourceFilter("unregistered");
    } catch (error) {
      toast.error("Bulk upload failed", {
        description:
          error?.message ||
          "Something went wrong while uploading the selected rows.",
      });
    } finally {
      setBulkUploading(false);
    }
  }

  const selectTriggerCls =
    "h-9 w-full bg-background border border-input rounded-md shadow-sm text-sm transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";
  const selectItemCls = "cursor-pointer";
  const selectContentCls =
    "z-[80] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden [&_[data-radix-select-viewport]]:max-h-[11rem] [&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:pr-1";

  return (
    <div className="space-y-2 animate-fadeIn">
      {err ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      {!loading ? (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/20 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <Users className="h-5 w-5" style={{ color: BB }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: BB }}>
                  {registeredRows.length}
                </p>
                <p className="text-xs font-semibold text-foreground/80">Registered Alumni</p>
                <p className="text-[10px] text-muted-foreground">Active database records</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-700">{preRegisteredCount}</p>
                <p className="text-xs font-semibold text-blue-800">Pre-Registered</p>
                <p className="text-[10px] text-blue-700/80">Bulk uploaded records</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
                <p className="text-xs font-semibold text-emerald-800">Active</p>
                <p className="text-[10px] text-emerald-700/80">Active alumni accounts</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{inactiveCount}</p>
                <p className="text-xs font-semibold text-red-800">Deactivated</p>
                <p className="text-[10px] text-red-700/80">Inactive alumni accounts</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Filters</p>
            <p className="text-[11px] text-muted-foreground">Narrow alumni records by source, status, course, or search text.</p>
          </div>

          {hasActiveFilters ? (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {activeFilterCount + (search ? 1 : 0)} Active
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="max-w-sm min-w-[200px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, student ID, course, or year..."
                className="h-9 bg-background pl-8 pr-8 text-sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 transition-colors duration-150 hover:bg-muted"
                  onClick={() => setSearch("")}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2.5">
          <div className="max-w-[180px] min-w-[140px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" sideOffset={0} avoidCollisions={false} className={selectContentCls}>
                <SelectItem value="registered" className={selectItemCls}>Registered</SelectItem>
                <SelectItem value="unregistered" className={selectItemCls}>Pre-Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isRegisteredSource ? (
            <div className="max-w-[170px] min-w-[130px] flex-1">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={0} avoidCollisions={false} className={selectContentCls}>
                  <SelectItem value="all" className={selectItemCls}>All Status</SelectItem>
                  <SelectItem value="active" className={selectItemCls}>Active</SelectItem>
                  <SelectItem value="deactivated" className={selectItemCls}>Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="max-w-[260px] min-w-[160px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Course</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" sideOffset={0} avoidCollisions={false} className={selectContentCls}>
                <SelectItem value="all" className={selectItemCls}>All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course} className={selectItemCls}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div>
              <Label className="pointer-events-none mb-1 block select-none text-[11px] font-medium text-transparent">&nbsp;</Label>
              <Button variant="outline" size="sm" disabled={!hasActiveFilters} className="h-9 gap-1.5 font-medium" onClick={resetAllFilters}>
                <Filter className="h-3.5 w-3.5" />
                Clear Filters
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 py-0 text-[10px]">{activeFilterCount}</Badge>
                ) : null}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Bulk Upload & Export</p>
            <p className="text-[11px] text-muted-foreground">Bulk upload alumni pre-registration spreadsheets or refresh records.</p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <input
              ref={preRegistrationUploadInputRef}
              type="file"
              accept={BULK_UPLOAD_ACCEPT}
              className="hidden"
              onChange={handleBulkAlumniUpload}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkUploading}
              className="h-9 gap-1.5 font-medium"
              onClick={() => preRegistrationUploadInputRef.current?.click()}
              title="Bulk upload Alumni pre-registration records from CSV or Excel"
            >
              {bulkUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Pre-Registration
              <Badge variant="secondary" className="ml-1 hidden h-4 px-1.5 py-0 text-[10px] sm:inline-flex">CSV/XLSX</Badge>
            </Button>

            <Button variant="outline" size="sm" className="h-9 gap-1.5 font-medium" disabled={loading} onClick={loadRows}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-transparent">
                <TableHead className="min-w-[190px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                <TableHead className="min-w-[200px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">NU Email</TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Student ID</TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Course</TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Graduation</TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/70">Loading alumni records...</p>
                        <p className="text-[11px] text-muted-foreground">Fetching data from Django API</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/70">No records found</p>
                        {hasActiveFilters ? (
                          <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground">No alumni match your current search or filter criteria.</p>
                            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={resetAllFilters}>
                              <RotateCcw className="h-3 w-3" /> Clear all filters
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No alumni records exist yet.</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => {
                  const isActive = norm(row.status) === "active";
                  const isPreRegistered = row.sourceType === "unregistered";

                  return (
                    <TableRow
                      key={makeKey(row)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-muted/40"
                      onClick={() => setSelected(row)}
                    >
                      <TableCell className="px-3 py-2">
                        <span className="block max-w-[220px] truncate text-[13px] font-semibold text-foreground">{getAlumniName(row)}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <span className="block max-w-[230px] truncate text-xs text-muted-foreground">{row.email || "—"}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs tabular-nums text-muted-foreground">{row.studentId || "—"}</TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="block max-w-[160px] truncate text-xs font-semibold text-foreground">{row.course || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">{row.graduationYear || "—"}</TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={
                            isPreRegistered
                              ? "h-5 gap-1 border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-medium text-blue-700"
                              : isActive
                                ? "h-5 gap-1 border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700"
                                : "h-5 gap-1 border-red-200 bg-red-50 px-1.5 py-0 text-[10px] font-medium text-red-700"
                          }
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {displayStatus(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-[#3D398C]"
                          onClick={() => openFullProfile(row)}
                          title={isPreRegistered ? "View pre-registered alumni" : "View alumni profile"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-border bg-muted/20 px-4 py-2.5 sm:flex-row">
          <p className="text-[11px] text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : pageStart + 1}</span> to <span className="font-semibold text-foreground">{pageEnd}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "record" : "records"}
            {hasActiveFilters && filtered.length !== totalRecords ? <span className="text-muted-foreground/60"> (filtered from {totalRecords})</span> : null}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1); }}>
                <SelectTrigger className="h-7 w-[62px] border-input bg-background text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="end" sideOffset={0} avoidCollisions={false} className={selectContentCls}>
                  {PS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)} className="cursor-pointer text-[11px]">{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="h-4 w-px bg-border" />

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(1)} disabled={safePage <= 1}>
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={safePage <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-[11px] font-medium tabular-nums text-muted-foreground">{safePage} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage >= totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages}>
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <AlumniQuickViewModal
        user={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onViewProfile={() => openFullProfile(selected)}
      />

      <BulkUploadReviewModal
        open={bulkReviewOpen}
        fileName={bulkFileName}
        rows={bulkRows}
        saving={bulkUploading}
        onClose={() => {
          if (bulkUploading) return;
          setBulkReviewOpen(false);
          setBulkRows([]);
          setBulkFileName("");
        }}
        onContinue={handleBulkReviewContinue}
      />

      <BulkUploadSummaryModal
        open={bulkSummary.open}
        summary={bulkSummary}
        onClose={() => setBulkSummary((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
