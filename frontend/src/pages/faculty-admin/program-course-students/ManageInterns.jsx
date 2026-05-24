import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";

import BulkUploadInterns from "./BulkUploadInterns";
import { UserModal } from "./ManageInternsModals";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BB = "#3D398C";
const PS_DEFAULT = 20;
const PS_OPTIONS = [10, 20, 50];
const BULK_UPLOAD_ACCEPT = ".csv,.xlsx,.xls";

function safe(value) {
  return String(value ?? "").trim();
}

function norm(value) {
  return safe(value).toLowerCase();
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

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

function buildFullName(row = {}) {
  const direct = safe(row.full_name || row.fullName || row.name);
  if (direct) return direct;

  return [row.first_name || row.firstName, row.middle_name || row.middleName, row.last_name || row.lastName]
    .map(safe)
    .filter(Boolean)
    .join(" ");
}

function normalizeIntern(row = {}) {
  const fullName = buildFullName(row);

  return {
    ...row,
    id: row.id,
    sourceType: row.sourceType || "registered",
    studentId: row.student_id || row.studentId || "",
    firstName: row.first_name || row.firstName || "",
    middleName: row.middle_name || row.middleName || "",
    lastName: row.last_name || row.lastName || "",
    fullName,
    gender: row.gender || row.personalInformation?.gender || "",
    email:
      row.email ||
      row.nu_email ||
      row.nuEmail ||
      row.contactInformation?.nuEmail ||
      row.contactInformation?.email ||
      "",
    course:
      row.course ||
      row.course_code ||
      row.courseCode ||
      row.program_code ||
      row.programCode ||
      row.academicRecords?.course ||
      "",
    status: row.status || "active",
    role: row.role || "intern",
    systemAudit: {
      ...(row.systemAudit || {}),
      isSuspended:
        row.systemAudit?.isSuspended ||
        norm(row.status) === "suspended" ||
        norm(row.status) === "deactivated",
    },
  };
}

function normalizeFaculty(row = {}) {
  return {
    id: row.id,
    email: row.email || row.account_email || row.account?.email || "",
    schoolProgramCode: row.school_program_code || row.schoolProgramCode || "",
    schoolProgramFullName: row.school_program || row.schoolProgram || "",
    course: row.program_code || row.programCode || row.academic_program_code || "",
    courseFullName: row.program || row.academic_program || row.academicProgram || "",
  };
}

function academicMatchesOwner(row, ownerAcademic) {
  const ownerCourse = norm(ownerAcademic?.course);
  const ownerCourseFullName = norm(ownerAcademic?.courseFullName);

  if (!ownerCourse && !ownerCourseFullName) return true;

  const rowCourse = norm(row.course);

  return rowCourse === ownerCourse || rowCourse === ownerCourseFullName;
}

function getInternName(row = {}) {
  return safe(row.fullName) || safe(row.name) || safe(row.email) || "—";
}

function getPreferredNuEmail(row = {}) {
  return safe(row.email || row.nuEmail || row.nu_email).toLowerCase();
}

function gRK(row) {
  return `${row?.sourceType || "registered"}-${row?.id}`;
}

function normalizeKey(value) {
  return norm(value).replace(/[^a-z0-9]/g, "");
}

function getCell(row, possibleNames) {
  const entries = Object.entries(row || {});

  for (const possible of possibleNames) {
    const target = normalizeKey(possible);
    const found = entries.find(([key]) => normalizeKey(key) === target);
    if (found) return safe(found[1]);
  }

  return "";
}

function normalizeGender(value) {
  const raw = norm(value);

  if (!raw) return "";
  if (["male", "m"].includes(raw)) return "Male";
  if (["female", "f"].includes(raw)) return "Female";
  if (["prefer not to say", "prefer-not-to-say", "na", "n/a"].includes(raw)) {
    return "Prefer not to say";
  }

  return safe(value);
}

function toTitleCase(value) {
  return safe(value)
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function splitFullName(fullName) {
  const cleanName = safe(fullName).replace(/\s+/g, " ");

  if (!cleanName) return { firstName: "", middleName: "", lastName: "" };

  if (cleanName.includes(",")) {
    const [lastNamePart, givenNamePart] = cleanName
      .split(",")
      .map((part) => safe(part));
    const givenParts = givenNamePart.split(" ").filter(Boolean);

    return {
      firstName: givenParts[0] || "",
      middleName: givenParts.slice(1).join(" "),
      lastName: lastNamePart || "",
    };
  }

  const parts = cleanName.split(" ").filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function extractRowsFromSheet(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return null;

  const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  let bestHeader = null;

  sheetRows.forEach((row, rowIndex) => {
    const normalizedCells = (row || []).map((cell) => normalizeKey(cell));
    const hasStudentId = normalizedCells.includes("studentid");
    const hasStudentName =
      normalizedCells.includes("studentname") ||
      normalizedCells.includes("fullname") ||
      normalizedCells.includes("name");
    const hasCourse = normalizedCells.includes("course");
    const hasGender = normalizedCells.includes("gender") || normalizedCells.includes("sex");
    const hasOfficialEmail =
      normalizedCells.includes("officialemail") ||
      normalizedCells.includes("nuemail") ||
      normalizedCells.includes("email") ||
      normalizedCells.includes("studentemail");

    if (!hasStudentId || !hasStudentName) return;

    const score = 2 + (hasCourse ? 1 : 0) + (hasGender ? 1 : 0) + (hasOfficialEmail ? 1 : 0);

    if (!bestHeader || score > bestHeader.score) {
      bestHeader = { rowIndex, score };
    }
  });

  if (!bestHeader) return null;

  const headerRow = sheetRows[bestHeader.rowIndex] || [];
  const rows = sheetRows
    .slice(bestHeader.rowIndex + 1)
    .map((row, offset) => {
      const mapped = {};
      headerRow.forEach((header, columnIndex) => {
        const cleanHeader = safe(header);
        if (!cleanHeader) return;
        mapped[cleanHeader] = row?.[columnIndex] ?? "";
      });
      mapped.__sheetName = sheetName;
      mapped.__sourceRowNumber = bestHeader.rowIndex + offset + 2;
      return mapped;
    })
    .filter((row) =>
      ["Student ID", "Student Name", "Full Name", "Name", "Official Email", "NU Email", "Email"].some((key) => safe(row[key])),
    );

  return { sheetName, score: bestHeader.score, headerRowIndex: bestHeader.rowIndex, rows };
}

function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const candidates = workbook.SheetNames
          .map((sheetName) => extractRowsFromSheet(workbook, sheetName))
          .filter((candidate) => candidate && candidate.rows.length > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.headerRowIndex - b.headerRowIndex;
          });

        const bestSheet = candidates[0];

        if (!bestSheet) {
          reject(new Error("No valid MOA classlist sheet was found."));
          return;
        }

        resolve(bestSheet.rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsArrayBuffer(file);
  });
}

function buildPreviewRows(rows, faculty, existingInterns) {
  const existingStudentIds = new Set(existingInterns.map((item) => norm(item.studentId)).filter(Boolean));
  const existingEmails = new Set(existingInterns.map((item) => norm(item.email)).filter(Boolean));

  return rows.map((row, index) => {
    const fullName = toTitleCase(getCell(row, ["Full Name", "Name", "Student Name", "fullName"]));
    const studentId = safe(getCell(row, ["Student ID", "Student No", "Student Number", "studentId"]));
    const nuEmail = norm(getCell(row, ["NU Email", "Email", "Official Email", "Student Email", "nuEmail"]));
    const gender = normalizeGender(getCell(row, ["Gender", "Sex"]));
    const courseFromFile = safe(getCell(row, ["Course", "Course Code", "Program Code"]));
    const course = faculty?.course || courseFromFile;

    const duplicateReasons = [];

    if (studentId && existingStudentIds.has(norm(studentId))) {
      duplicateReasons.push("Student ID already exists");
    }

    if (nuEmail && existingEmails.has(norm(nuEmail))) {
      duplicateReasons.push("NU Email already exists");
    }

    return {
      _rowKey: `${index}-${studentId || nuEmail || Math.random().toString(36).slice(2)}`,
      rowNumber: row.__sourceRowNumber || index + 2,
      studentId,
      fullName,
      gender,
      nuEmail,
      course,
      duplicateReasons,
    };
  });
}

function buildInternPayload(row) {
  const nameParts = splitFullName(row.fullName);

  return {
    student_id: row.studentId,
    first_name: nameParts.firstName,
    middle_name: nameParts.middleName,
    last_name: nameParts.lastName,
    gender: row.gender,
    email: row.nuEmail,
    nu_email: row.nuEmail,
    course: row.course,
    role: "intern",
    status: "active",
  };
}

function exportRowsToCsv(rows, fileName) {
  const headers = ["Student ID", "Name", "NU Email", "Course", "Gender", "Status"];
  const body = rows.map((row) => [
    row.studentId,
    getInternName(row),
    getPreferredNuEmail(row),
    row.course,
    row.gender,
    row.systemAudit?.isSuspended ? "Suspended" : "Active",
  ]);
  const csv = [headers, ...body]
    .map((line) => line.map((value) => `"${safe(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManageInterns() {
  const account = getStoredAccount();
  const uploadInputRef = useRef(null);

  const [ownerAcademic, setOwnerAcademic] = useState({
    schoolProgramCode: "",
    schoolProgramFullName: "",
    course: "",
    courseFullName: "",
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("registered");
  const [genderFilter, setGenderFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PS_DEFAULT);

  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkReviewOpen, setBulkReviewOpen] = useState(false);

  const isReg = sourceFilter === "registered";

  const loadData = useCallback(async ({ background = false } = {}) => {
    setErr("");
    if (!background) setLoading(true);

    try {
      const [facultyData, internsData] = await Promise.all([
        apiRequest("/faculty/"),
        apiRequest("/interns/"),
      ]);

      const facultyList = normalizeListResponse(facultyData).map(normalizeFaculty);
      const facultyMatch =
        facultyList.find((item) => norm(item.email) === norm(account?.email)) || facultyList[0] || null;

      const normalizedOwner = facultyMatch || {
        schoolProgramCode: "",
        schoolProgramFullName: "",
        course: "",
        courseFullName: "",
      };

      const normalizedInterns = normalizeListResponse(internsData).map(normalizeIntern);

      setOwnerAcademic(normalizedOwner);
      setRows(normalizedInterns.filter((item) => academicMatchesOwner(item, normalizedOwner)));
    } catch (error) {
      setErr(error?.message || "Failed to load intern records.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [account?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = norm(search);

    return rows.filter((row) => {
      const name = getInternName(row);
      const email = getPreferredNuEmail(row);
      const studentId = safe(row.studentId);
      const course = safe(row.course);
      const gender = safe(row.gender);
      const isSuspended = !!row.systemAudit?.isSuspended;

      if (isReg) {
        if (statusFilter === "active" && isSuspended) return false;
        if (statusFilter === "suspended" && !isSuspended) return false;
      }

      if (genderFilter !== "all" && gender !== genderFilter) return false;
      if (!q) return true;

      return [name, email, studentId, course, gender, row.id]
        .map(norm)
        .join(" | ")
        .includes(q);
    });
  }, [rows, search, statusFilter, genderFilter, isReg]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sourceFilter, genderFilter]);

  const selectedRows = useMemo(() => {
    const keys = new Set(selectedIds);
    return rows.filter((row) => keys.has(gRK(row)));
  }, [rows, selectedIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const selectedCount = selectedIds.length;
  const currentPageKeys = paginated.map(gRK);
  const allSelected =
    currentPageKeys.length > 0 && currentPageKeys.every((key) => selectedIds.includes(key));
  const someSelected = currentPageKeys.some((key) => selectedIds.includes(key)) && !allSelected;

  const totalRecords = rows.length;
  const activeCount = rows.filter((row) => !row.systemAudit?.isSuspended).length;
  const suspendedCount = rows.filter((row) => !!row.systemAudit?.isSuspended).length;

  const hasActiveFilters = search !== "" || statusFilter !== "all" || genderFilter !== "all";
  const activeFilterCount = [statusFilter !== "all", genderFilter !== "all"].filter(Boolean).length;

  function resetAllFilters() {
    setSearch("");
    setStatusFilter("all");
    setGenderFilter("all");
  }

  function toggleRow(row) {
    const key = gRK(row);
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
    );
  }

  function toggleAll() {
    if (!currentPageKeys.length) return;

    setSelectedIds((prev) => {
      if (currentPageKeys.every((key) => prev.includes(key))) {
        return prev.filter((id) => !currentPageKeys.includes(id));
      }

      const next = new Set(prev);
      currentPageKeys.forEach((key) => next.add(key));
      return Array.from(next);
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function refreshList() {
    await loadData({ background: false });
  }

  async function expExcel() {
    if (!selectedRows.length) return;
    exportRowsToCsv(selectedRows, `NUAI_Interns_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function expPdf() {
    toast.info("PDF export is not connected yet.");
  }

  async function handleBulkInternUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const fileName = file.name || "";
    const lowerFileName = fileName.toLowerCase();
    const isAcceptedFile =
      lowerFileName.endsWith(".csv") || lowerFileName.endsWith(".xlsx") || lowerFileName.endsWith(".xls");

    if (!isAcceptedFile) {
      toast.error("Invalid file type", {
        description: "Please upload a CSV, XLS, or XLSX file.",
      });
      return;
    }

    if (!safe(ownerAcademic.course)) {
      toast.error("Missing faculty academic scope", {
        description: "Your Faculty profile must have an assigned Course Code before bulk uploading interns.",
      });
      return;
    }

    setBulkUploading(true);

    try {
      const parsedRowsFromFile = await readWorkbook(file);
      const previewRows = buildPreviewRows(parsedRowsFromFile, ownerAcademic, rows);

      if (!previewRows.length) {
        toast.error("No usable rows found", {
          description: "The selected file does not contain valid intern rows.",
        });
        return;
      }

      setBulkFileName(fileName);
      setBulkRows(previewRows);
      setBulkReviewOpen(true);

      toast.success("File parsed successfully", {
        description: `${previewRows.length} row(s) ready for review.`,
      });
    } catch (error) {
      toast.error("Bulk upload failed", {
        description: error?.message || "Something went wrong while reading the file.",
      });
    } finally {
      setBulkUploading(false);
    }
  }

  async function handleBulkUploadContinue(nextRows = bulkRows) {
    const duplicateRows = [];
    const invalidRows = [];
    const uploadableRows = [];

    nextRows.forEach((row) => {
      if (row.errors?.length || row.isInvalid) {
        invalidRows.push(row);
        return;
      }

      if (row.duplicateReasons?.length || row.isDuplicate) {
        duplicateRows.push(row);
        return;
      }

      uploadableRows.push(row);
    });

    if (!uploadableRows.length) {
      if (duplicateRows.length > 0 && invalidRows.length === 0) {
        setBulkReviewOpen(false);
        setBulkRows([]);
        setBulkFileName("");

        toast.success("Bulk upload finished", {
          description: `0 uploaded, ${duplicateRows.length} duplicate${duplicateRows.length === 1 ? "" : "s"} skipped, 0 failed rows.`,
        });
        return;
      }

      toast.error("No rows to upload", {
        description: "Please fix invalid rows before continuing.",
      });
      return;
    }

    setBulkUploading(true);

    let uploadedCount = 0;
    let failedCount = invalidRows.length;

    try {
      for (const row of uploadableRows) {
        try {
          await apiRequest("/interns/", {
            method: "POST",
            body: JSON.stringify(buildInternPayload(row)),
          });
          uploadedCount += 1;
        } catch {
          failedCount += 1;
        }
      }

      setBulkReviewOpen(false);
      setBulkRows([]);
      setBulkFileName("");

      toast.success("Bulk upload finished", {
        description: `${uploadedCount} uploaded, ${duplicateRows.length} duplicate${duplicateRows.length === 1 ? "" : "s"} skipped, ${failedCount} failed row${failedCount === 1 ? "" : "s"}.`,
      });

      await loadData({ background: false });
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
    <div className="space-y-2">
      {err ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      {!loading ? (
        <div className="grid gap-3 grid-cols-3">
          <div className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/20 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <Users className="h-5 w-5" style={{ color: BB }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: BB }}>
                  {totalRecords}
                </p>
                <p className="text-xs font-semibold text-foreground/80">
                  Total Interns
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Under your academic scope
                </p>
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
                <p className="text-[10px] text-emerald-700/80">
                  Currently active interns
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{suspendedCount}</p>
                <p className="text-xs font-semibold text-red-800">Suspended</p>
                <p className="text-[10px] text-red-700/80">
                  Suspended intern accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Filters
            </p>
            <p className="text-[11px] text-muted-foreground">
              Narrow intern records by source, status, gender, or search text.
            </p>
          </div>

          {hasActiveFilters ? (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {activeFilterCount + (search ? 1 : 0)} Active
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="max-w-sm min-w-[200px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, NU email, student ID, course, or school code..."
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
          <div className="max-w-[170px] min-w-[130px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Source
            </Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={0}
                avoidCollisions={false}
                className={selectContentCls}
              >
                <SelectItem value="registered" className={selectItemCls}>
                  Registered
                </SelectItem>
                <SelectItem value="unregistered" className={selectItemCls}>
                  Pre-Registered
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isReg ? (
            <div className="max-w-[150px] min-w-[120px] flex-1">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={0}
                  avoidCollisions={false}
                  className={selectContentCls}
                >
                  <SelectItem value="all" className={selectItemCls}>
                    All Status
                  </SelectItem>
                  <SelectItem value="active" className={selectItemCls}>
                    Active
                  </SelectItem>
                  <SelectItem value="suspended" className={selectItemCls}>
                    Suspended
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="max-w-[180px] min-w-[130px] flex-1">
            <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Gender
            </Label>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={0}
                avoidCollisions={false}
                className={selectContentCls}
              >
                <SelectItem value="all" className={selectItemCls}>
                  All Gender
                </SelectItem>
                <SelectItem value="Male" className={selectItemCls}>
                  Male
                </SelectItem>
                <SelectItem value="Female" className={selectItemCls}>
                  Female
                </SelectItem>
                <SelectItem value="Prefer not to say" className={selectItemCls}>
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div>
              <Label className="pointer-events-none mb-1 block select-none text-[11px] font-medium text-transparent">
                &nbsp;
              </Label>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasActiveFilters}
                className="h-9 gap-1.5 font-medium"
                onClick={resetAllFilters}
              >
                <Filter className="h-3.5 w-3.5" />
                Clear Filters
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 py-0 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Bulk Upload & Export
            </p>
            <p className="text-[11px] text-muted-foreground">
              Bulk upload intern pre-registration spreadsheets or export selected records.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <input
              ref={uploadInputRef}
              type="file"
              accept={BULK_UPLOAD_ACCEPT}
              className="hidden"
              onChange={handleBulkInternUpload}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkUploading || loading}
              className="h-9 gap-1.5 font-medium"
              onClick={() => uploadInputRef.current?.click()}
              title="Bulk upload Intern pre-registration records from CSV or Excel"
            >
              {bulkUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Pre-Registration
              <Badge variant="secondary" className="ml-1 hidden h-4 px-1.5 py-0 text-[10px] sm:inline-flex">
                CSV/XLSX
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={selectedCount === 0} className="h-9 font-medium">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                  {selectedCount > 0 ? (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 py-0 text-[10px]">
                      {selectedCount}
                    </Badge>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs">
                  Export {selectedCount} selected {selectedCount === 1 ? "record" : "records"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={expExcel} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">Export as Excel</p>
                      <p className="text-[10px] text-muted-foreground">Download spreadsheet</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={expPdf} className="cursor-pointer gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">Export as PDF</p>
                      <p className="text-[10px] text-muted-foreground">Download printable document</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-9 gap-1.5 font-medium" disabled={loading} onClick={refreshList}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-[#3D398C]/20 bg-[#3D398C]/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3D398C]/10">
              <Users className="h-3 w-3" style={{ color: BB }} />
            </div>
            <span className="text-xs font-medium" style={{ color: BB }}>
              {selectedCount} {selectedCount === 1 ? "record" : "records"} selected
            </span>
          </div>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium" onClick={clearSelection}>
            <X className="h-3 w-3" /> Clear Selection
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-transparent">
                <TableHead className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected || someSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#3D398C]"
                  />
                </TableHead>
                <TableHead className="min-w-[180px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="min-w-[200px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  NU Email
                </TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Student ID
                </TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Course
                </TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gender
                </TableHead>
                <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/70">Loading intern records...</p>
                        <p className="text-[11px] text-muted-foreground">Fetching data based on your academic scope</p>
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
                      <p className="text-sm font-medium text-foreground/70">No records found</p>
                      <p className="text-[11px] text-muted-foreground">
                        {hasActiveFilters
                          ? "No interns match your current search or filter criteria."
                          : "No registered interns exist under your academic scope yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => {
                  const key = gRK(row);
                  const name = getInternName(row);
                  const email = getPreferredNuEmail(row);
                  const isSuspended = !!row.systemAudit?.isSuspended;

                  return (
                    <TableRow
                      key={key}
                      className={`cursor-pointer transition-colors duration-150 ${
                        selectedIds.includes(key) ? "bg-nu-blue/5 hover:bg-nu-blue/8" : "hover:bg-muted/40"
                      }`}
                      onClick={() => setSelected(row)}
                    >
                      <TableCell className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(key)}
                          onChange={() => toggleRow(row)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#3D398C]"
                        />
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <span className="block max-w-[220px] truncate text-[13px] font-semibold text-foreground">
                          {name}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <span className="block max-w-[220px] truncate text-xs text-muted-foreground">
                          {email || "—"}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                        {row.studentId || "—"}
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <span className="block max-w-[160px] truncate text-xs font-semibold text-foreground">
                          {row.course || "—"}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        {row.gender || "—"}
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        {isSuspended ? (
                          <Badge variant="destructive" className="h-5 gap-1 px-1.5 py-0 text-[10px] font-medium">
                            <ShieldAlert className="h-3 w-3" /> Suspended
                          </Badge>
                        ) : (
                          <Badge className="h-5 gap-1 border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                            <ShieldCheck className="h-3 w-3" /> Active
                          </Badge>
                        )}
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
            Showing <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : pageStart + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{pageEnd}</span> of{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "record" : "records"}
            {hasActiveFilters && filtered.length !== totalRecords ? (
              <span className="text-muted-foreground/60"> (filtered from {totalRecords})</span>
            ) : null}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[62px] border-input bg-background text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  align="end"
                  sideOffset={0}
                  avoidCollisions={false}
                  className={selectContentCls}
                >
                  {PS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)} className="cursor-pointer text-[11px]">
                      {option}
                    </SelectItem>
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
            <span className="px-2 text-[11px] font-medium tabular-nums text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage >= totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages}>
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <UserModal user={selected} open={!!selected} onClose={() => setSelected(null)} />

      <BulkUploadInterns
        open={bulkReviewOpen}
        fileName={bulkFileName}
        rows={bulkRows}
        onRowsChange={setBulkRows}
        onRequestClose={() => {
          if (bulkUploading) return;
          setBulkReviewOpen(false);
          setBulkRows([]);
          setBulkFileName("");
        }}
        onRequestContinue={handleBulkUploadContinue}
        bulkSaving={bulkUploading}
      />
    </div>
  );
}
