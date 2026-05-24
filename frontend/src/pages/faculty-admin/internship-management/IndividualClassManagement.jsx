import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function normalize(value) {
  return safe(value).toLowerCase();
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function buildFullName(row = {}) {
  const direct = safe(row.full_name || row.fullName || row.name);
  if (direct) return direct;

  return [
    row.first_name || row.firstName,
    row.middle_name || row.middleName,
    row.last_name || row.lastName,
  ]
    .map(safe)
    .filter(Boolean)
    .join(" ");
}

function normalizeIntern(row = {}) {
  const fullName = buildFullName(row);

  return {
    ...row,
    id: row.id,
    studentId: row.student_id || row.studentId || "",
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
    courseFullName:
      row.course_full_name ||
      row.courseFullName ||
      row.program_full_name ||
      row.programFullName ||
      row.academicRecords?.courseFullName ||
      "",
    schoolProgramCode:
      row.school_program_code ||
      row.schoolProgramCode ||
      row.academicRecords?.schoolProgramCode ||
      "",
    schoolProgramFullName:
      row.school_program_full_name ||
      row.schoolProgramFullName ||
      row.academicRecords?.schoolProgramFullName ||
      "",
    status: row.status || "active",
  };
}

function normalizeClass(row = {}) {
  return {
    ...row,
    id: row.id,
    subject: row.subject || "",
    section: row.section || "",
    schoolProgramCode: row.school_program_code || row.schoolProgramCode || "",
    schoolProgramFullName:
      row.school_program_full_name ||
      row.schoolProgramFullName ||
      row.schoolProgram ||
      "",
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

function normalizeAssignedStudent(student = {}) {
  return {
    id: student.id,
    studentId: student.studentId || student.student_id || "",
    fullName: student.fullName || student.full_name || student.name || "",
    email: student.email || student.nuEmail || student.nu_email || "",
    gender: student.gender || "",
    course: student.course || student.courseCode || student.course_code || "",
    courseFullName:
      student.courseFullName || student.course_full_name || student.programFullName || "",
    status: student.status || "active",
  };
}

function buildAssignedSnapshot(intern) {
  return {
    id: intern.id,
    studentId: intern.studentId,
    fullName: intern.fullName,
    email: intern.email,
    gender: intern.gender,
    course: intern.course,
    courseFullName: intern.courseFullName,
    status: intern.status,
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

function studentKey(student) {
  return safe(student?.id) || safe(student?.studentId || student?.student_id) || safe(student?.email);
}

export default function IndividualClassManagement() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const [classRecord, setClassRecord] = useState(null);
  const [internRows, setInternRows] = useState([]);
  const [selectedInternIds, setSelectedInternIds] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [internsLoading, setInternsLoading] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [error, setError] = useState("");

  const students = useMemo(() => {
    return Array.isArray(classRecord?.students)
      ? classRecord.students.map(normalizeAssignedStudent)
      : [];
  }, [classRecord]);

  const assignedKeys = useMemo(() => {
    return new Set(students.map(studentKey).filter(Boolean));
  }, [students]);

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

  const fetchInterns = useCallback(async () => {
    setInternsLoading(true);

    try {
      const data = await apiRequest("/interns/");
      const list = normalizeListResponse(data).map(normalizeIntern);
      setInternRows(list);
    } catch (err) {
      toast.error("Failed to load interns", {
        description: err?.message || "Please try again.",
      });
      setInternRows([]);
    } finally {
      setInternsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClass();
  }, [fetchClass]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const eligibleInterns = useMemo(() => {
    const classProgram = normalize(classRecord?.program);

    return internRows.filter((intern) => {
      const notAssigned = !assignedKeys.has(studentKey(intern));
      if (!notAssigned) return false;

      if (!classProgram) return true;

      return (
        normalize(intern.course) === classProgram ||
        normalize(intern.courseFullName) === classProgram
      );
    });
  }, [internRows, assignedKeys, classRecord?.program]);

  const filteredEligibleInterns = useMemo(() => {
    const query = normalize(assignSearch);

    if (!query) return eligibleInterns;

    return eligibleInterns.filter((intern) =>
      [
        intern.fullName,
        intern.studentId,
        intern.email,
        intern.gender,
        intern.course,
        intern.courseFullName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [eligibleInterns, assignSearch]);

  function toggleInternSelection(internId) {
    setSelectedInternIds((prev) =>
      prev.includes(internId)
        ? prev.filter((id) => id !== internId)
        : [...prev, internId],
    );
  }

  function openAssignModal() {
    setSelectedInternIds([]);
    setAssignSearch("");
    setAssignOpen(true);
  }

  async function saveStudents(nextStudents, successMessage) {
    setSavingAssignment(true);

    try {
      const data = await apiRequest(`/internship-classes/${classId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          students: nextStudents,
        }),
      });

      setClassRecord(normalizeClass(data));
      toast.success(successMessage);
    } catch (err) {
      toast.error("Failed to update class interns", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setSavingAssignment(false);
    }
  }

  async function handleAssignSelectedInterns() {
    const selectedSet = new Set(selectedInternIds);
    const selectedInterns = eligibleInterns.filter((intern) =>
      selectedSet.has(String(intern.id)),
    );

    if (!selectedInterns.length) {
      toast.error("No interns selected", {
        description: "Select at least one intern before assigning.",
      });
      return;
    }

    const nextStudents = [
      ...students,
      ...selectedInterns.map(buildAssignedSnapshot),
    ];

    await saveStudents(
      nextStudents,
      `${selectedInterns.length} intern${selectedInterns.length === 1 ? "" : "s"} assigned successfully.`,
    );

    setAssignOpen(false);
    setSelectedInternIds([]);
    setAssignSearch("");
  }

  async function handleRemoveIntern(student) {
    const removeKey = studentKey(student);
    const nextStudents = students.filter((item) => studentKey(item) !== removeKey);

    await saveStudents(nextStudents, "Intern removed from this class.");
  }

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

          <div className="flex flex-wrap items-center gap-2">
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

            <Button
              type="button"
              size="sm"
              onClick={openAssignModal}
              className="gap-1.5 bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Assign Interns
            </Button>
          </div>
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
          <InfoCard icon={Users} label="Assigned Interns" value={students.length} />
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
                  View and manage interns assigned to this internship class.
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
              <TableHead>Course</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground/70">
                      No interns assigned yet
                    </p>
                    <p className="text-xs">
                      Click Assign Interns to add students from Academic Course Interns.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={`${studentKey(student) || index}`}>
                  <TableCell className="font-medium">{getStudentName(student)}</TableCell>
                  <TableCell>{safe(student?.studentId || student?.student_id)}</TableCell>
                  <TableCell>{safe(student?.email || student?.officialEmail)}</TableCell>
                  <TableCell>{safe(student?.course || student?.courseFullName)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={savingAssignment}
                      onClick={() => handleRemoveIntern(student)}
                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                      title="Remove intern"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => !savingAssignment && setAssignOpen(open)}
      >
        <DialogContent className="w-[96vw] !max-w-7xl overflow-hidden rounded-2xl border border-border p-0 shadow-2xl">
          <DialogHeader className="border-b border-border bg-[#3D398C]/5 px-5 py-4 text-left">
            <DialogTitle className="text-base font-semibold text-foreground">
              Assign Interns
            </DialogTitle>
            <DialogDescription>
              Select interns under this academic program and assign them to this class.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xl">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={assignSearch}
                  onChange={(event) => setAssignSearch(event.target.value)}
                  placeholder="Search by name, email, or student ID..."
                  className="h-9 pl-8 text-sm"
                />
                {assignSearch ? (
                  <button
                    type="button"
                    onClick={() => setAssignSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 transition-colors hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ) : null}
              </div>

              <Badge variant="outline">
                {selectedInternIds.length} Selected
              </Badge>
            </div>

            <div className="max-h-[58vh] w-full overflow-auto rounded-lg border border-border">
              <Table className="w-full min-w-[1050px]">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="min-w-[260px]">Name</TableHead>
                    <TableHead className="min-w-[150px]">Student ID</TableHead>
                    <TableHead className="min-w-[300px]">Email</TableHead>
                    <TableHead className="min-w-[140px]">Course</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {internsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#3D398C]" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading interns...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : filteredEligibleInterns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm font-medium text-foreground/70">
                            No available interns found
                          </p>
                          <p className="text-xs">
                            All matching interns may already be assigned to this class.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEligibleInterns.map((intern) => {
                      const internId = String(intern.id);
                      const checked = selectedInternIds.includes(internId);

                      return (
                        <TableRow
                          key={internId}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => toggleInternSelection(internId)}
                        >
                          <TableCell className="w-12" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleInternSelection(internId)}
                              className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#3D398C]"
                            />
                          </TableCell>
                          <TableCell className="min-w-[260px] font-medium">
                            <span className="block truncate">
                              {safe(intern.fullName) || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="min-w-[150px] whitespace-nowrap">
                            {safe(intern.studentId) || "—"}
                          </TableCell>
                          <TableCell className="min-w-[300px] whitespace-nowrap">
                            {safe(intern.email) || "—"}
                          </TableCell>
                          <TableCell className="min-w-[140px] whitespace-nowrap">
                            {safe(intern.course) || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              disabled={savingAssignment}
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={selectedInternIds.length === 0 || savingAssignment}
              onClick={handleAssignSelectedInterns}
              className="gap-1.5 bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
            >
              {savingAssignment ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Assign Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
