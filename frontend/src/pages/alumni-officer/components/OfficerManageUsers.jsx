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
  SlidersHorizontal,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  buildTransitioningAlumniPayload,
  displayStatus,
  getAlumniName,
  getFileDuplicateSummary,
  norm,
  normalizeAlumni,
  normalizeListResponse,
  normalizePreRegisteredAlumni,
  normalizeTransitioningAlumni,
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
  const transitionUploadInputRef = useRef(null);

  const [registeredRows, setRegisteredRows] = useState([]);
  const [preRegisteredRows, setPreRegisteredRows] = useState([]);
  const [transitionRows, setTransitionRows] = useState([]);
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
  const [bulkMode, setBulkMode] = useState("pre-registration");

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
  const isTransitioningSource = sourceFilter === "transitioning";

  const loadRows = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const [alumniResult, preRegisteredResult, transitioningResult] = await Promise.allSettled([
        apiRequest("/alumni/"),
        apiRequest("/pre-registered-alumni/"),
        apiRequest("/transitioning-alumni/"),
      ]);

      if (alumniResult.status === "rejected") {
        throw alumniResult.reason;
      }

      const registeredList = normalizeListResponse(alumniResult.value).map(normalizeAlumni);
      const preRegisteredList =
        preRegisteredResult.status === "fulfilled"
          ? normalizeListResponse(preRegisteredResult.value).map(normalizePreRegisteredAlumni)
          : [];
      const transitioningList =
        transitioningResult.status === "fulfilled"
          ? normalizeListResponse(transitioningResult.value).map(normalizeTransitioningAlumni)
          : [];

      setRegisteredRows(registeredList);
      setPreRegisteredRows(preRegisteredList);
      setTransitionRows(transitioningList);

      if (sourceFilter === "registered") setRows(registeredList);
      else if (sourceFilter === "transitioning") setRows(transitioningList);
      else setRows(preRegisteredList);

      setCurrentPage(1);

      if (preRegisteredResult.status === "rejected") {
        toast.warning("Pre-registered alumni endpoint is not available", {
          description:
            "Registered alumni loaded, but /api/pre-registered-alumni/ could not be reached.",
        });
      }

      if (transitioningResult.status === "rejected") {
        toast.warning("Transitioning alumni endpoint is not available", {
          description:
            "Registered alumni loaded, but /api/transitioning-alumni/ could not be reached.",
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
    if (sourceFilter === "registered") setRows(registeredRows);
    else if (sourceFilter === "transitioning") setRows(transitionRows);
    else setRows(preRegisteredRows);

    setSelected(null);
    setCurrentPage(1);
  }, [sourceFilter, registeredRows, preRegisteredRows, transitionRows]);

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
    const existingTransitioning = duplicateSetsFromRows(transitionRows);

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

      if (rowStudentId && existingTransitioning.studentIds.has(rowStudentId)) {
        duplicateReasons.push("Student ID already exists in transitioning alumni");
      }

      if (rowEmail && existingRegistered.emails.has(rowEmail)) {
        duplicateReasons.push("NU Email already exists in registered alumni");
      }

      if (rowEmail && existingPreRegistered.emails.has(rowEmail)) {
        duplicateReasons.push("NU Email already exists in pre-registered alumni");
      }

      if (rowEmail && existingTransitioning.emails.has(rowEmail)) {
        duplicateReasons.push("NU Email already exists in transitioning alumni");
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
    setBulkMode("pre-registration");

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

  async function handleTransitionUpload(event) {
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
    setBulkMode("transition");

    try {
      const parsedRows = await parseBulkAlumniFile(file);

      if (!parsedRows.length) {
        toast.error("No usable rows found", {
          description: "The selected file does not contain valid alumni rows for transition.",
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
      toast.error("Transition upload failed", {
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
          const endpoint =
            bulkMode === "transition"
              ? "/transitioning-alumni/"
              : "/pre-registered-alumni/";

          const payload =
            bulkMode === "transition"
              ? buildTransitioningAlumniPayload(row)
              : buildPreRegisteredAlumniPayload(row);

          await apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(payload),
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
      setSourceFilter(bulkMode === "transition" ? "transitioning" : "unregistered");
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

  const sourceLabel = isTransitioningSource
    ? "Total Transitioning"
    : isRegisteredSource
      ? "Total Alumni"
      : "Total Pre-Registered";

  const sourceDescription = isTransitioningSource
    ? "Intern accounts flagged for Alumni transition"
    : isRegisteredSource
      ? "All registered alumni in the Django system"
      : "Pre-registered alumni records";

  const selectTriggerCls =
    "h-8 w-full rounded-md border-border bg-background text-xs shadow-none focus:ring-1 focus:ring-[#3D398C]/25";
  const selectItemCls =
    "cursor-pointer items-start whitespace-normal break-words py-2 pr-8 text-xs leading-snug *:[span]:last:whitespace-normal *:[span]:last:break-words *:[span]:last:leading-snug";
  const selectContentCls =
    "z-[80] w-[320px] max-w-[calc(100vw-2rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden border border-border bg-popover text-popover-foreground shadow-xl [&_[data-radix-select-viewport]]:max-h-[14rem] [&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:pr-1";
  return (
    <div className="space-y-5">
      {err ? (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">
          {err}
        </div>
      ) : null}

      {!loading ? (
        <div className={`grid gap-3 ${isRegisteredSource ? "md:grid-cols-3" : "max-w-xs grid-cols-1"}`}>
          <div className="group cursor-default rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/20 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10 transition-colors duration-200 group-hover:bg-[#3D398C]/15">
                <Users className="h-5 w-5" style={{ color: BB }} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold leading-tight tracking-tight" style={{ color: BB }}>
                  {totalRecords}
                </p>
                <p className="text-xs font-semibold text-foreground/80">{sourceLabel}</p>
                <p className="text-[10px] text-muted-foreground">{sourceDescription}</p>
              </div>
            </div>
          </div>

          {isRegisteredSource ? (
            <>
              <div className="group cursor-default rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-200 group-hover:bg-emerald-100">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold leading-tight tracking-tight text-emerald-700">{activeCount}</p>
                    <p className="text-xs font-semibold text-foreground/80">Active</p>
                    <p className="text-[10px] text-muted-foreground">Currently active alumni accounts</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-default rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 transition-colors duration-200 group-hover:bg-red-100">
                    <UserX className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold leading-tight tracking-tight text-red-600">{inactiveCount}</p>
                    <p className="text-xs font-semibold text-foreground/80">Deactivated</p>
                    <p className="text-[10px] text-muted-foreground">Inactive alumni accounts</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Alumni Records</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Manage registered, pre-registered, and transitioning alumni records.
            </p>
          </div>

          {hasActiveFilters ? (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {activeFilterCount + (search ? 1 : 0)} Active
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div className="max-w-sm min-w-[240px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, student ID, course, or year..."
                className="h-8 rounded-md border-border bg-background pl-8 pr-8 text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#3D398C]/25"
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

        <div className="flex flex-wrap items-end gap-2.5 border-b border-border/60 pb-3">
          <div>
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Source</Label>
            <Tabs value={sourceFilter} onValueChange={setSourceFilter}>
              <TabsList className="h-auto min-h-8 flex-wrap rounded-md bg-muted p-1 group-data-horizontal/tabs:h-auto">
                <TabsTrigger value="registered" className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-[#3D398C] data-[state=active]:text-white">
                  Registered
                </TabsTrigger>
                <TabsTrigger value="unregistered" className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-[#3D398C] data-[state=active]:text-white">
                  Pre-Registered
                </TabsTrigger>
                <TabsTrigger value="transitioning" className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-[#3D398C] data-[state=active]:text-white">
                  Transitioning
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isRegisteredSource ? (
            <div>
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Status</Label>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-auto min-h-8 flex-wrap rounded-md bg-muted p-1 group-data-horizontal/tabs:h-auto">
                  <TabsTrigger value="all" className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-[#3D398C] data-[state=active]:text-white">
                    All Status
                  </TabsTrigger>
                  <TabsTrigger value="active" className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-[#3D398C] data-[state=active]:text-white">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="deactivated" className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-[#3D398C] data-[state=active]:text-white">
                    Deactivated
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          ) : null}

          <div className="max-w-[260px] min-w-[160px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Course</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="All Courses" />
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">Bulk Upload & Export</p>
          <p className="text-[11px] text-muted-foreground">
            Upload transition or pre-registration spreadsheets, open Advanced Export, or refresh records.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          <input ref={transitionUploadInputRef} type="file" accept={BULK_UPLOAD_ACCEPT} className="hidden" onChange={handleTransitionUpload} />
          <input ref={preRegistrationUploadInputRef} type="file" accept={BULK_UPLOAD_ACCEPT} className="hidden" onChange={handleBulkAlumniUpload} />

          <Button type="button" variant="outline" size="sm" disabled={bulkUploading} className="h-9 gap-1.5 font-medium" onClick={() => transitionUploadInputRef.current?.click()} title="Bulk upload alumni transition records from CSV or Excel">
            {bulkUploading && bulkMode === "transition" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Transition
            <Badge variant="secondary" className="ml-1 hidden h-4 px-1.5 py-0 text-[10px] sm:inline-flex">CSV/XLSX</Badge>
          </Button>

          <Button type="button" variant="outline" size="sm" disabled={bulkUploading} className="h-9 gap-1.5 font-medium" onClick={() => preRegistrationUploadInputRef.current?.click()} title="Bulk upload Alumni pre-registration records from CSV or Excel">
            {bulkUploading && bulkMode === "pre-registration" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            Pre-Registration
            <Badge variant="secondary" className="ml-1 hidden h-4 px-1.5 py-0 text-[10px] sm:inline-flex">CSV/XLSX</Badge>
          </Button>

          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 font-medium" onClick={() => navigate("/alumni-officer/alumni/manage/advanced")} title="Open Advanced Export">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced Export
          </Button>

          <Button variant="outline" size="sm" className="h-9 gap-1.5 font-medium" disabled={loading} onClick={loadRows}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden border-t border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-transparent hover:bg-transparent">
                <TableHead className="min-w-[260px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Alumni</TableHead>
                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Student ID</TableHead>
                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Program</TableHead>
                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Graduation</TableHead>
                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</TableHead>
                <TableHead className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
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
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
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
                  const isTransitioning = row.sourceType === "transitioning";

                  return (
                    <TableRow key={makeKey(row)} className="cursor-pointer border-b border-border/60 transition-colors duration-150 hover:bg-muted/30" onClick={() => setSelected(row)}>
                      <TableCell className="px-3 py-2.5">
                        <span className="block max-w-[260px] truncate text-xs font-semibold text-foreground">{getAlumniName(row)}</span>
                        <span className="block max-w-[260px] truncate text-[11px] text-muted-foreground">{row.email || "—"}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">{row.studentId || "—"}</TableCell>
                      <TableCell className="px-3 py-2.5">
                        <span className="block max-w-[180px] truncate text-xs font-semibold text-foreground">{row.course || "—"}</span>
                        <span className="block max-w-[180px] truncate text-[10px] font-medium text-muted-foreground">{row.courseFullName || "—"}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">{row.graduationYear || "—"}</TableCell>
                      <TableCell className="px-3 py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            isTransitioning
                              ? "h-5 gap-1 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700"
                              : isPreRegistered
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
                      <TableCell className="px-3 py-2.5 text-right" onClick={(event) => event.stopPropagation()}>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-[#3D398C]" onClick={() => openFullProfile(row)} title={isPreRegistered ? "View pre-registered alumni" : "View alumni profile"}>
                          <Eye className="h-3.5 w-3.5" />
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

      <AlumniQuickViewModal user={selected} open={!!selected} onClose={() => setSelected(null)} onViewProfile={() => openFullProfile(selected)} />

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

      <BulkUploadSummaryModal open={bulkSummary.open} summary={bulkSummary} onClose={() => setBulkSummary((prev) => ({ ...prev, open: false }))} />
    </div>
  );
}
