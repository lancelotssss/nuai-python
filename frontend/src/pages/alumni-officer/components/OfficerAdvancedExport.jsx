import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BB = "#3D398C";

function safe(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return safe(value).toLowerCase();
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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
  const direct =
    safe(row.full_name) ||
    safe(row.fullName) ||
    safe(row.name) ||
    safe(row.personalInformation?.fullName);

  if (direct) return direct;

  return [
    row.first_name ||
      row.firstName ||
      row.personalInformation?.firstName ||
      row.personal_information?.first_name,
    row.middle_name ||
      row.middleName ||
      row.personalInformation?.middleName ||
      row.personal_information?.middle_name,
    row.last_name ||
      row.lastName ||
      row.personalInformation?.lastName ||
      row.personal_information?.last_name,
  ]
    .map(safe)
    .filter(Boolean)
    .join(" ");
}

function normalizeAlumniRow(row = {}, source = "registered") {
  const personalInformation = row.personalInformation || row.personal_information || {};
  const contactInformation = row.contactInformation || row.contact_information || {};
  const alumniInformation = row.alumniInformation || row.alumni_information || {};
  const academicRecords = row.academicRecords || row.academic_records || {};
  const employmentData = row.employmentData || row.employment_data || {};

  const studentId =
    row.student_id ||
    row.studentId ||
    alumniInformation.studentId ||
    alumniInformation.student_id ||
    "";

  const fullName = buildFullName(row);

  const email =
    row.email ||
    row.nu_email ||
    row.nuEmail ||
    row.official_email ||
    row.officialEmail ||
    contactInformation.nuEmail ||
    contactInformation.nu_email ||
    contactInformation.officialEmail ||
    contactInformation.email ||
    "";

  const personalEmail =
    row.personal_email ||
    row.personalEmail ||
    contactInformation.personalEmail ||
    contactInformation.personal_email ||
    "";

  const contactNumber =
    row.contact_number ||
    row.contactNumber ||
    contactInformation.contactNumber ||
    contactInformation.contact_number ||
    "";

  const schoolProgram =
    row.school_program ||
    row.schoolProgram ||
    row.school_program_full_name ||
    row.schoolProgramFullName ||
    academicRecords.schoolProgram ||
    academicRecords.schoolProgramFullName ||
    alumniInformation.schoolProgram ||
    alumniInformation.schoolProgramFullName ||
    "";

  const schoolProgramCode =
    row.school_program_code ||
    row.schoolProgramCode ||
    academicRecords.schoolProgramCode ||
    alumniInformation.schoolProgramCode ||
    "";

  const academicProgram =
    row.academic_program ||
    row.academicProgram ||
    row.course_graduated ||
    row.courseGraduated ||
    row.course ||
    row.program ||
    alumniInformation.courseGraduated ||
    alumniInformation.course_graduated ||
    alumniInformation.academicProgram ||
    academicRecords.academicProgram ||
    academicRecords.course ||
    "";

  const academicProgramCode =
    row.academic_program_code ||
    row.academicProgramCode ||
    row.course_code ||
    row.courseCode ||
    row.program_code ||
    row.programCode ||
    alumniInformation.academicProgramCode ||
    academicRecords.academicProgramCode ||
    "";

  const graduationPeriod =
    row.graduation_period ||
    row.graduationPeriod ||
    row.graduation_year ||
    row.graduationYear ||
    alumniInformation.graduationPeriod ||
    alumniInformation.graduation_period ||
    alumniInformation.graduationYear ||
    "";

  const academicAward =
    row.academic_award ||
    row.academicAward ||
    alumniInformation.academicAward ||
    alumniInformation.academic_award ||
    "";

  const loyalty =
    row.loyalty ||
    alumniInformation.loyalty ||
    alumniInformation.loyaltyAward ||
    "";

  const employmentStatus =
    row.employment_status ||
    row.employmentStatus ||
    employmentData.employmentStatus ||
    employmentData.status ||
    "";

  const rawStatus =
    row.status ||
    row.account_status ||
    row.account?.status ||
    row.systemAudit?.status ||
    "active";

  const status = normalize(rawStatus) === "suspended" ? "suspended" : "active";

  return {
    id: row.id || row.pk || `${source}-${studentId}-${email}`,
    source,
    studentId: safe(studentId),
    fullName: safe(fullName) || "Unnamed Alumni",
    email: safe(email).toLowerCase(),
    personalEmail: safe(personalEmail).toLowerCase(),
    contactNumber: safe(contactNumber),
    gender:
      row.gender ||
      personalInformation.gender ||
      personalInformation.sex ||
      "",
    schoolProgram: safe(schoolProgram),
    schoolProgramCode: safe(schoolProgramCode),
    academicProgram: safe(academicProgram),
    academicProgramCode: safe(academicProgramCode),
    graduationPeriod: safe(graduationPeriod),
    academicAward: safe(academicAward),
    loyalty: safe(loyalty),
    employmentStatus: safe(employmentStatus),
    status,
  };
}

function uniqueValues(rows, getter) {
  return Array.from(
    new Set(
      rows
        .map(getter)
        .map(safe)
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function StatCard({
  icon: Icon,
  value,
  title,
  subtitle,
  tone = "default",
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50"
        : tone === "yellow"
          ? "border-yellow-200 bg-yellow-50"
          : "border-border bg-card";

  const iconClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "blue"
        ? "bg-blue-100 text-blue-700"
        : tone === "yellow"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-[#3D398C]/10 text-[#3D398C]";

  const valueClass =
    tone === "green"
      ? "text-emerald-700"
      : tone === "blue"
        ? "text-blue-700"
        : tone === "yellow"
          ? "text-yellow-700"
          : "text-[#3D398C]";

  return (
    <div className={`rounded-xl border px-5 py-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className={`text-xl font-bold leading-none ${valueClass}`}>
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-foreground">
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function exportRowsToExcel(rows) {
  if (!rows.length) {
    toast.error("No records to export", {
      description: "No alumni records satisfy the selected filters.",
    });
    return;
  }

  const exportRows = rows.map((row) => ({
    Source: row.source,
    Status: row.status,
    "Student ID": row.studentId,
    "Full Name": row.fullName,
    "NU Email": row.email,
    "Personal Email": row.personalEmail,
    "Contact Number": row.contactNumber,
    Gender: row.gender,
    "School Program": row.schoolProgram || row.schoolProgramCode,
    "Academic Program": row.academicProgram || row.academicProgramCode,
    "Graduation Period": row.graduationPeriod,
    "Academic Award": row.academicAward,
    Loyalty: row.loyalty,
    "Employment Status": row.employmentStatus,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Alumni Export");

  const filename = `NUAI_Advanced_Alumni_Export_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);

  toast.success("Excel export generated", {
    description: `${rows.length} record${rows.length === 1 ? "" : "s"} exported.`,
  });
}

async function exportRowsToPdf(rows) {
  if (!rows.length) {
    toast.error("No records to export", {
      description: "No alumni records satisfy the selected filters.",
    });
    return;
  }

  try {
    const jsPdfModule = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");

    const jsPDF = jsPdfModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text("NUAI Advanced Alumni Export", 40, 40);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, 40, 58);
    doc.text(`Records: ${rows.length}`, 40, 72);

    autoTable(doc, {
      startY: 92,
      head: [
        [
          "Source",
          "Student ID",
          "Full Name",
          "Email",
          "Program",
          "Graduation",
          "Award",
          "Employment",
          "Status",
        ],
      ],
      body: rows.map((row) => [
        row.source,
        row.studentId,
        row.fullName,
        row.email,
        row.academicProgram || row.academicProgramCode,
        row.graduationPeriod,
        row.academicAward,
        row.employmentStatus,
        row.status,
      ]),
      styles: {
        fontSize: 7,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [61, 57, 140],
      },
    });

    doc.save(
      `NUAI_Advanced_Alumni_Export_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
    );

    toast.success("PDF export generated", {
      description: `${rows.length} record${rows.length === 1 ? "" : "s"} exported.`,
    });
  } catch {
    toast.error("PDF export unavailable", {
      description:
        "Install jspdf and jspdf-autotable first: npm install jspdf jspdf-autotable",
    });
  }
}

export default function OfficerAdvancedExport() {
  const navigate = useNavigate();

  const [registeredRows, setRegisteredRows] = useState([]);
  const [preRegisteredRows, setPreRegisteredRows] = useState([]);
  const [transitioningRows, setTransitioningRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolProgramFilter, setSchoolProgramFilter] = useState("all");
  const [academicProgramFilter, setAcademicProgramFilter] = useState("all");
  const [graduationPeriodFilter, setGraduationPeriodFilter] = useState("all");
  const [academicAwardFilter, setAcademicAwardFilter] = useState("all");

  const selectTriggerCls =
    "h-9 w-full bg-white border border-input rounded-md shadow-sm text-sm transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

  const selectContentCls =
    "z-[9999] max-h-60 overflow-y-auto rounded-md border border-border bg-white text-foreground shadow-xl";

  const selectItemCls =
    "cursor-pointer bg-white text-foreground hover:bg-muted focus:bg-muted data-[highlighted]:bg-muted data-[highlighted]:text-foreground";

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [registeredData, preRegisteredData, transitioningData] =
        await Promise.allSettled([
          apiRequest("/alumni/"),
          apiRequest("/pre-registered-alumni/"),
          apiRequest("/transitioning-alumni/"),
        ]);

      const registered =
        registeredData.status === "fulfilled"
          ? normalizeListResponse(registeredData.value).map((row) =>
              normalizeAlumniRow(row, "registered"),
            )
          : [];

      const preRegistered =
        preRegisteredData.status === "fulfilled"
          ? normalizeListResponse(preRegisteredData.value).map((row) =>
              normalizeAlumniRow(row, "pre-registered"),
            )
          : [];

      const transitioning =
        transitioningData.status === "fulfilled"
          ? normalizeListResponse(transitioningData.value).map((row) =>
              normalizeAlumniRow(row, "transitioning"),
            )
          : [];

      setRegisteredRows(registered);
      setPreRegisteredRows(preRegistered);
      setTransitioningRows(transitioning);

      if (
        registeredData.status === "rejected" ||
        preRegisteredData.status === "rejected" ||
        transitioningData.status === "rejected"
      ) {
        toast.warning("Some records failed to load", {
          description:
            "One or more alumni sources are unavailable. Loaded available records only.",
        });
      }
    } catch (error) {
      toast.error("Failed to load export records", {
        description: error?.message || "Please try again.",
      });

      setRegisteredRows([]);
      setPreRegisteredRows([]);
      setTransitioningRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allRows = useMemo(
    () => [...registeredRows, ...preRegisteredRows, ...transitioningRows],
    [registeredRows, preRegisteredRows, transitioningRows],
  );

  const schoolProgramOptions = useMemo(
    () =>
      uniqueValues(
        allRows,
        (row) => row.schoolProgram || row.schoolProgramCode,
      ),
    [allRows],
  );

  const academicProgramOptions = useMemo(
    () =>
      uniqueValues(
        allRows,
        (row) => row.academicProgram || row.academicProgramCode,
      ),
    [allRows],
  );

  const graduationPeriodOptions = useMemo(
    () => uniqueValues(allRows, (row) => row.graduationPeriod),
    [allRows],
  );

  const academicAwardOptions = useMemo(
    () => uniqueValues(allRows, (row) => row.academicAward),
    [allRows],
  );

  const filteredRows = useMemo(() => {
    const query = normalize(search);

    return allRows.filter((row) => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;

      const rowSchool = row.schoolProgram || row.schoolProgramCode;
      const rowProgram = row.academicProgram || row.academicProgramCode;

      if (
        schoolProgramFilter !== "all" &&
        normalize(rowSchool) !== normalize(schoolProgramFilter)
      ) {
        return false;
      }

      if (
        academicProgramFilter !== "all" &&
        normalize(rowProgram) !== normalize(academicProgramFilter)
      ) {
        return false;
      }

      if (
        graduationPeriodFilter !== "all" &&
        normalize(row.graduationPeriod) !== normalize(graduationPeriodFilter)
      ) {
        return false;
      }

      if (
        academicAwardFilter !== "all" &&
        normalize(row.academicAward) !== normalize(academicAwardFilter)
      ) {
        return false;
      }

      if (!query) return true;

      return [
        row.fullName,
        row.email,
        row.personalEmail,
        row.studentId,
        row.schoolProgram,
        row.schoolProgramCode,
        row.academicProgram,
        row.academicProgramCode,
        row.graduationPeriod,
        row.academicAward,
        row.loyalty,
        row.employmentStatus,
        row.status,
        row.source,
      ]
        .map(normalize)
        .join(" ")
        .includes(query);
    });
  }, [
    allRows,
    search,
    sourceFilter,
    statusFilter,
    schoolProgramFilter,
    academicProgramFilter,
    graduationPeriodFilter,
    academicAwardFilter,
  ]);

  const filteredRegisteredCount = filteredRows.filter(
    (row) => row.source === "registered",
  ).length;

  const filteredPreRegisteredCount = filteredRows.filter(
    (row) => row.source === "pre-registered",
  ).length;

  const filteredTransitioningCount = filteredRows.filter(
    (row) => row.source === "transitioning",
  ).length;

  const hasFilters =
    search ||
    sourceFilter !== "all" ||
    statusFilter !== "all" ||
    schoolProgramFilter !== "all" ||
    academicProgramFilter !== "all" ||
    graduationPeriodFilter !== "all" ||
    academicAwardFilter !== "all";

  function clearFilters() {
    setSearch("");
    setSourceFilter("all");
    setStatusFilter("all");
    setSchoolProgramFilter("all");
    setAcademicProgramFilter("all");
    setGraduationPeriodFilter("all");
    setAcademicAwardFilter("all");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/alumni-officer/alumni/manage")}
                className="h-8 gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>

              <Badge
                variant="outline"
                className="border-[#3D398C]/20 bg-[#3D398C]/5 text-[#3D398C]"
              >
                Advanced Export
              </Badge>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <SlidersHorizontal className="h-5 w-5 text-[#3D398C]" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Advanced Alumni Export
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Select filters, then submit the form as Excel or PDF. Export
                  will not download when no records satisfy the selected
                  conditions.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={loadData}
            className="h-9 gap-1.5 self-start lg:self-center"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          value={filteredRows.length}
          title="Matching Records"
          subtitle={`From ${allRows.length} loaded total`}
        />

        <StatCard
          icon={Users}
          value={filteredRegisteredCount}
          title="Registered"
          subtitle={`Loaded: ${registeredRows.length}`}
          tone="green"
        />

        <StatCard
          icon={Download}
          value={filteredPreRegisteredCount}
          title="Pre-Registered"
          subtitle={`Loaded: ${preRegisteredRows.length}`}
          tone="blue"
        />

        <StatCard
          icon={ShieldCheck}
          value={filteredTransitioningCount}
          title="Transitioning"
          subtitle={`Loaded: ${transitioningRows.length}`}
          tone="yellow"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Export Form
          </p>
          <p className="text-[11px] text-muted-foreground">
            Fill in the filters below, then choose the file format to export.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Search
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, student ID, program, school, award, loyalty..."
                className="h-9 bg-white pl-8 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Source
              </label>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  className={selectContentCls}
                >
                  <SelectItem value="all" className={selectItemCls}>
                    All Sources
                  </SelectItem>
                  <SelectItem value="registered" className={selectItemCls}>
                    Registered
                  </SelectItem>
                  <SelectItem value="pre-registered" className={selectItemCls}>
                    Pre-Registered
                  </SelectItem>
                  <SelectItem value="transitioning" className={selectItemCls}>
                    Transitioning
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                School Program
              </label>

              <Select
                value={schoolProgramFilter}
                onValueChange={setSchoolProgramFilter}
              >
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="All Schools" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  className={selectContentCls}
                >
                  <SelectItem value="all" className={selectItemCls}>
                    All Schools
                  </SelectItem>

                  {schoolProgramOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className={selectItemCls}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Academic Program
              </label>

              <Select
                value={academicProgramFilter}
                onValueChange={setAcademicProgramFilter}
              >
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  className={selectContentCls}
                >
                  <SelectItem value="all" className={selectItemCls}>
                    All Programs
                  </SelectItem>

                  {academicProgramOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className={selectItemCls}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Graduation Period
              </label>

              <Select
                value={graduationPeriodFilter}
                onValueChange={setGraduationPeriodFilter}
              >
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  className={selectContentCls}
                >
                  <SelectItem value="all" className={selectItemCls}>
                    All Periods
                  </SelectItem>

                  {graduationPeriodOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className={selectItemCls}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Academic Award
              </label>

              <Select
                value={academicAwardFilter}
                onValueChange={setAcademicAwardFilter}
              >
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="All Awards" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  className={selectContentCls}
                >
                  <SelectItem value="all" className={selectItemCls}>
                    All Awards
                  </SelectItem>

                  {academicAwardOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className={selectItemCls}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Export Result
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Source:{" "}
                  <span className="font-medium">
                    {sourceFilter === "all" ? "All Sources" : sourceFilter}
                  </span>{" "}
                  • Status:{" "}
                  <span className="font-medium">
                    {statusFilter === "all" ? "All Status" : statusFilter}
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Matching records:{" "}
                  <span className="font-semibold text-foreground">
                    {filteredRows.length}
                  </span>
                </p>
              </div>

              <Badge
                variant="outline"
                className={
                  filteredRows.length > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }
              >
                {filteredRows.length > 0 ? "Ready to export" : "No records"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={!hasFilters}
              onClick={clearFilters}
              className="h-9 gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear Filters
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading || filteredRows.length === 0}
                onClick={() => exportRowsToExcel(filteredRows)}
                className="h-9 gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Export Excel
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading || filteredRows.length === 0}
                onClick={() => exportRowsToPdf(filteredRows)}
                className="h-9 gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-red-600" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}