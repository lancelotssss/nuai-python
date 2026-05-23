import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  GraduationCap,
  Users,
  BookOpen,
  RotateCcw,
  CalendarDays,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BB = "#3D398C";

function safe(value) {
  return String(value ?? "").trim();
}

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
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

function getStudentCount(students) {
  return Array.isArray(students) ? students.length : 0;
}

function getClassStatus(item) {
  const raw = item?.status ?? item?.classStatus ?? item?.isActive;

  if (typeof raw === "boolean") {
    return raw ? "Active" : "Inactive";
  }

  const normalized = String(raw ?? "").trim().toLowerCase();

  if (
    normalized === "inactive" ||
    normalized === "disabled" ||
    normalized === "archived"
  ) {
    return "Inactive";
  }

  return "Active";
}

function sortClassesByCreatedAt(items = []) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.systemAudit?.createdAt || 0).getTime() || 0;
    const bTime = new Date(b?.systemAudit?.createdAt || 0).getTime() || 0;

    return bTime - aTime;
  });
}

function StatusBadge({ status }) {
  const isInactive = status === "Inactive";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide ${
        isInactive
          ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
      }`}
    >
      {isInactive ? (
        <BadgeX className="h-3.5 w-3.5" />
      ) : (
        <BadgeCheck className="h-3.5 w-3.5" />
      )}
      {status}
    </span>
  );
}

function EmptyState({ onAction }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="h-6 w-6 text-muted-foreground/40" />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-foreground/70">No classes yet</p>
        <p className="max-w-md text-[11px] text-muted-foreground">
          Your handled internship classes will appear here once you create your
          first section.
        </p>
      </div>

      <Button
        size="sm"
        onClick={onAction}
        className="mt-2 gap-1.5"
        style={{ backgroundColor: BB, color: "white" }}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Class
      </Button>
    </div>
  );
}

function ClassCard({ item, onOpen }) {
  const subject = safe(item.subject) || "Untitled Subject";
  const section = safe(item.section) || "No Section";
  const program = safe(item.program) || "No Program";
  const studentsCount = getStudentCount(item.students);
  const createdAt = formatDate(item?.systemAudit?.createdAt);
  const status = getClassStatus(item);

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(item.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.id)}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3D398C]/20"
    >
      <div className="border-b border-border bg-muted/20 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide"
                style={{
                  backgroundColor: `${BB}10`,
                  color: BB,
                }}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Internship Class
              </span>

              <StatusBadge status={status} />
            </div>

            <h3 className="mt-3 text-base font-bold text-foreground">
              {subject}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Section: {section}
            </p>
          </div>

          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${BB}10` }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: BB }} />
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Program
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {program}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Interns
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-foreground">
              {studentsCount}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Created
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-foreground">
              {createdAt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClassManagement() {
  const navigate = useNavigate();
  const account = getStoredAccount();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canLoadClasses = useMemo(() => !!account?.email, [account?.email]);

  const fetchClasses = useCallback(async () => {
    if (!canLoadClasses) {
      setClasses([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        `/internship-classes/?faculty_email=${encodeURIComponent(account.email)}`,
      );

      const next = normalizeListResponse(data).map(normalizeClass);
      setClasses(sortClassesByCreatedAt(next));
    } catch (err) {
      setClasses([]);
      setError(err?.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, [account?.email, canLoadClasses]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  function handleRefresh() {
    fetchClasses();
  }

  function handleOpenIndividualClassManagement(classId) {
    navigate(`/faculty/internships/${classId}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Internship Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage internship classes assigned to your account.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate("/faculty/internships/add-class")}
          className="gap-1.5"
          style={{ backgroundColor: BB, color: "white" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Class
        </Button>
      </div>

      {error ? (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">
          {error}
        </div>
      ) : null}

      <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${BB}10` }}
              >
                <GraduationCap className="h-5 w-5" style={{ color: BB }} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    Class Management
                  </h3>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide"
                    style={{
                      backgroundColor: `${BB}10`,
                      color: BB,
                    }}
                  >
                    {classes.length} {classes.length === 1 ? "Class" : "Classes"}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  Manage all internship classes assigned to the logged-in faculty
                  member.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || !account?.email}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => navigate("/faculty/internships/add-class")}
                className="gap-1.5"
                style={{ backgroundColor: BB, color: "white" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Class
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-foreground/70">
                Loading classes...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fetching data from the database
              </p>
            </div>
          </div>
        ) : classes.length === 0 ? (
          <EmptyState onAction={() => navigate("/faculty/internships/add-class")} />
        ) : (
          <div className="p-5">
            <div className="mb-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Overview
              </p>
              <p className="mt-1 text-sm font-medium text-foreground/80">
                {classes.length} {classes.length === 1 ? "class" : "classes"} found
                under your account.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classes.map((item) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  onOpen={handleOpenIndividualClassManagement}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
