import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Loader2,
  RefreshCw,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function safe(value) {
  return String(value ?? "").trim();
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeClass(row = {}) {
  return {
    ...row,
    id: row.id,
    subject: row.subject || "",
    section: row.section || "",
    schoolProgramCode: row.school_program_code || row.schoolProgramCode || "",
    schoolProgramFullName:
      row.school_program_full_name || row.schoolProgramFullName || row.schoolProgram || "",
    program: row.program_code || row.program || row.programCode || "",
    programFullName:
      row.program_full_name || row.programFullName || row.academicProgram || "",
    status: row.status || "Active",
    students: Array.isArray(row.students) ? row.students : [],
    systemAudit: {
      createdAt: row.created_at || row.createdAt || row.systemAudit?.createdAt || "",
      updatedAt: row.updated_at || row.updatedAt || row.systemAudit?.updatedAt || "",
    },
  };
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

function formatDate(value) {
  try {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-PH", {
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

function getClassStatus(item) {
  const raw = item?.status ?? item?.classStatus ?? item?.isActive;

  if (typeof raw === "boolean") {
    return raw ? "Active" : "Inactive";
  }

  const normalized = safe(raw).toLowerCase();

  if (
    normalized === "inactive" ||
    normalized === "disabled" ||
    normalized === "archived"
  ) {
    return "Inactive";
  }

  return "Active";
}

function StatusBadge({ status }) {
  const isInactive = status === "Inactive";

  return (
    <Badge
      variant="outline"
      className={
        isInactive
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }
    >
      {status}
    </Badge>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-3 break-words text-sm font-semibold text-foreground">
        {safe(value) || "—"}
      </p>
    </div>
  );
}

function getStudentName(student) {
  const directName = safe(student?.fullName) || safe(student?.name) || safe(student?.studentName);

  if (directName) return directName;

  return [student?.firstName, student?.middleName, student?.lastName]
    .map(safe)
    .filter(Boolean)
    .join(" ") || "—";
}

export default function IndividualClassManagement() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const [classRecord, setClassRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const students = useMemo(() => {
    return Array.isArray(classRecord?.students) ? classRecord.students : [];
  }, [classRecord]);

  const fetchClass = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(`/internship-classes/${classId}/`);
      setClassRecord(normalizeClass(data));
    } catch (err) {
      setClassRecord(null);
      setError(err?.message || "Failed to load class information.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClass();
  }, [fetchClass]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#3D398C]" />
          <p className="text-sm">Loading class information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/faculty/internships")}
          className="gap-1.5 px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  const status = getClassStatus(classRecord);

  return (
    <div className="space-y-5">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/faculty/internships")}
          className="mb-4 gap-1.5 px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {safe(classRecord?.subject) || "Internship Class"}
              </h2>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Section: {safe(classRecord?.section) || "—"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchClass}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${BB}10` }}
            >
              <GraduationCap className="h-5 w-5" style={{ color: BB }} />
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">
                Class Information
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Review the internship class information and assigned interns.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard icon={BookOpen} label="Subject" value={classRecord?.subject} />
          <InfoCard icon={GraduationCap} label="Section" value={classRecord?.section} />
          <InfoCard icon={BookOpen} label="School Program Code" value={classRecord?.schoolProgramCode} />
          <InfoCard icon={BookOpen} label="School Program Full Name" value={classRecord?.schoolProgramFullName} />
          <InfoCard icon={BookOpen} label="Program Code" value={classRecord?.program} />
          <InfoCard icon={BookOpen} label="Program Full Name" value={classRecord?.programFullName} />
          <InfoCard icon={Users} label="Interns" value={students.length} />
          <InfoCard icon={CalendarDays} label="Created At" value={formatDate(classRecord?.systemAudit?.createdAt)} />
          <InfoCard icon={CalendarDays} label="Updated At" value={formatDate(classRecord?.systemAudit?.updatedAt)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${BB}10` }}
              >
                <UserRoundCheck className="h-5 w-5" style={{ color: BB }} />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  Assigned Interns
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Intern assignment will be connected after the intern list module.
                </p>
              </div>
            </div>

            <Badge variant="outline">{students.length} Interns</Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground/70">
                      No interns assigned yet
                    </p>
                    <p className="text-xs">
                      Intern assignment will be added in the next module.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={`${student?.studentId || student?.id || index}`}>
                  <TableCell className="font-medium">{getStudentName(student)}</TableCell>
                  <TableCell>{safe(student?.studentId || student?.student_id)}</TableCell>
                  <TableCell>{safe(student?.email || student?.officialEmail)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
