import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import PageTitle from "@/components/PageTitle";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return String(value || "").trim();
}

function safe(value) {
  const clean = normalizeText(value);
  return clean || "—";
}

function normalizeDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
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


function normalizeSchoolProgram(row) {
  return {
    ...row,
    id: row.id,
    fullName: row.full_name || row.fullName || "",
    code: row.code || "",
    status: row.status || "active",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function normalizeAcademicProgram(row) {
  return {
    ...row,
    id: row.id,
    schoolProgram:
      row.school_program || row.schoolProgram || row.school_program_id || "",
    schoolProgramLabel:
      row.school_program_label || row.schoolProgramLabel || "",
    fullName: row.full_name || row.fullName || "",
    code: row.code || "",
    status: row.status || "active",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function FormField({
  label,
  name,
  value,
  onChange,
  required = false,
  error = "",
  helper = "",
  placeholder = "",
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>

      <Input
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "h-9 text-sm",
          error ? "border-destructive focus-visible:ring-destructive/30" : "",
        ].join(" ")}
      />

      <div className="min-h-[14px]">
        {error ? (
          <span className="text-[11px] font-medium text-destructive">
            {error}
          </span>
        ) : helper ? (
          <span className="text-[11px] text-muted-foreground">{helper}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function AcademicProgramTableView() {
  const navigate = useNavigate();
  const { schoolProgramId } = useParams();

  const [schoolProgram, setSchoolProgram] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    code: "",
  });

  const [formErrors, setFormErrors] = useState({
    fullName: "",
    code: "",
  });

  const schoolProgramLabel = useMemo(() => {
    if (!schoolProgram) return "Academic Programs";

    if (schoolProgram.code) {
      return `${schoolProgram.fullName} (${schoolProgram.code})`;
    }

    return schoolProgram.fullName || "Academic Programs";
  }, [schoolProgram]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [schoolData, programData] = await Promise.all([
        apiRequest(`/school-programs/${schoolProgramId}/`),
        apiRequest(`/academic-programs/?school_program_id=${schoolProgramId}`),
      ]);

      setSchoolProgram(normalizeSchoolProgram(schoolData));
      setPrograms(
        normalizeListResponse(programData).map(normalizeAcademicProgram),
      );
      setPageIndex(0);
    } catch (err) {
      setError(err?.message || "Failed to load academic programs.");
      setSchoolProgram(null);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [schoolProgramId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPageIndex(0);
  }, [search, pageSize]);

  const filteredPrograms = useMemo(() => {
    const q = normalizeText(search).toLowerCase();

    if (!q) return programs;

    return programs.filter((program) => {
      const haystack = [
        program.fullName,
        program.code,
        program.status,
        program.schoolProgramLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [programs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const visiblePrograms = filteredPrograms.slice(start, start + pageSize);
  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  function resetForm() {
    setForm({
      fullName: "",
      code: "",
    });

    setFormErrors({
      fullName: "",
      code: "",
    });
  }

  function openCreateDialog() {
    setEditingProgram(null);
    resetForm();
    setFormOpen(true);
  }

  function openEditDialog(program) {
    setEditingProgram(program);
    setForm({
      fullName: program.fullName || "",
      code: normalizeCode(program.code),
    });
    setFormErrors({
      fullName: "",
      code: "",
    });
    setFormOpen(true);
  }

  function closeFormDialog() {
    if (actionLoading) return;

    setFormOpen(false);
    setEditingProgram(null);
    resetForm();
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? normalizeCode(value) : value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  function validateForm() {
    const fullName = normalizeText(form.fullName);
    const code = normalizeCode(form.code);

    const nextErrors = {
      fullName: "",
      code: "",
    };

    if (!fullName) {
      nextErrors.fullName = "Academic Program is required.";
    }

    if (code && !/^[a-zA-Z0-9-\s]+$/.test(code)) {
      nextErrors.code =
        "Code must only contain letters, numbers, spaces, and hyphens.";
    }

    setFormErrors(nextErrors);

    if (nextErrors.fullName || nextErrors.code) {
      throw new Error(nextErrors.fullName || nextErrors.code);
    }

    return {
      fullName,
      code,
    };
  }

  async function saveProgram() {
    let cleaned;

    try {
      cleaned = validateForm();
    } catch (err) {
      toast.error("Validation error", {
        description: err?.message || "Please check the form and try again.",
      });
      return;
    }

    setActionLoading(true);

    try {
      const payload = {
        school_program: Number(schoolProgramId),
        full_name: cleaned.fullName,
        code: cleaned.code,
        status: "active",
      };

      if (editingProgram) {
        const updated = await apiRequest(
          `/academic-programs/${editingProgram.id}/`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );

        const normalized = normalizeAcademicProgram(updated);

        setPrograms((prev) =>
          prev.map((item) =>
            item.id === editingProgram.id ? normalized : item,
          ),
        );

        toast.success("Academic program updated successfully.");
      } else {
        const created = await apiRequest("/academic-programs/", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const normalized = normalizeAcademicProgram(created);

        setPrograms((prev) => [normalized, ...prev]);

        toast.success("Academic program created successfully.");
      }

      closeFormDialog();
    } catch (err) {
      toast.error(
        editingProgram
          ? "Failed to update academic program"
          : "Failed to create academic program",
        {
          description: err?.message || "Please try again.",
        },
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteProgram(program) {
    if (!program) return;

    setActionLoading(true);

    try {
      await apiRequest(`/academic-programs/${program.id}/`, {
        method: "DELETE",
      });

      setPrograms((prev) => prev.filter((item) => item.id !== program.id));

      await logAudit(
        "DELETE_ACADEMIC_PROGRAM",
        `Deleted academic program: ${program.fullName}${
          program.code ? ` (${program.code})` : ""
        }.`,
        {
          id: program.id,
          school_program_id: schoolProgramId,
          full_name: program.fullName,
          code: program.code,
        },
      );

      setDeleteTarget(null);
      toast.success("Academic program deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete academic program", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function goToPage(nextIndex) {
    setPageIndex(Math.max(0, Math.min(nextIndex, totalPages - 1)));
  }

  return (
    <>
      <PageTitle title={`${schoolProgramLabel} | NUAI`} />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/academic-records")}
              className="mb-3 h-8 gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-[#3D398C]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              BACK
            </Button>

            <h1 className="text-xl font-bold tracking-tight text-[#3D398C]">
              Academic Programs
            </h1>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Review and manage academic programs under{" "}
              <span className="font-semibold text-foreground">
                {schoolProgramLabel}
              </span>
              .
            </p>
          </div>

          <Button
            type="button"
            onClick={openCreateDialog}
            className="gap-1.5 bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
          >
            <Plus className="h-4 w-4" />
            Add Academic Program
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
            <p className="text-xl font-bold leading-tight tracking-tight text-[#3D398C]">
              {programs.length}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground/80">
              Total Programs
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Academic programs under this school
            </p>
          </div>

          <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
            <p className="text-xl font-bold leading-tight tracking-tight text-emerald-600">
              {programs.filter((item) => item.status === "active").length}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground/80">
              Active
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Available academic programs
            </p>
          </div>

          <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
            <p className="text-xl font-bold leading-tight tracking-tight text-[#D97706]">
              {schoolProgram?.code || "—"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground/80">
              School Code
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Parent school program code
            </p>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Academic Program Records
              </h2>

              <p className="text-[11px] text-muted-foreground">
                Search, add, edit, or delete academic programs.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search academic programs..."
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Academic Program
                  </TableHead>

                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Code
                  </TableHead>

                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>

                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Created At
                  </TableHead>

                  <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-[#3D398C]" />
                        <p className="text-sm">Loading academic programs...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : visiblePrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-foreground/70">
                          No academic programs found
                        </p>
                        <p className="text-xs">
                          {search
                            ? "Try a different search term."
                            : "Create an academic program to get started."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visiblePrograms.map((program) => (
                    <TableRow
                      key={program.id}
                      className="transition-colors duration-150 hover:bg-muted/40"
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3D398C]/10 text-xs font-bold text-[#3D398C]">
                            {(program.code || program.fullName || "AP")
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {safe(program.fullName)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {safe(
                                program.schoolProgramLabel ||
                                  schoolProgramLabel,
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant="outline"
                          className="border-[#3D398C]/20 bg-[#3D398C]/5 text-[11px] font-semibold text-[#3D398C]"
                        >
                          {safe(program.code)}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
                        >
                          {safe(program.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {normalizeDate(program.createdAt)}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-[#3D398C]"
                            onClick={() => openEditDialog(program)}
                            title="Edit academic program"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteTarget(program)}
                            title="Delete academic program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page</span>

              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[74px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent align="end">
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span>{filteredPrograms.length} total</span>
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
                disabled={!canPrev}
                onClick={() => goToPage(0)}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={!canPrev}
                onClick={() => goToPage(safePageIndex - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={!canNext}
                onClick={() => goToPage(safePageIndex + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={!canNext}
                onClick={() => goToPage(totalPages - 1)}
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog
          open={formOpen}
          onOpenChange={(open) => !open && closeFormDialog()}
        >
          <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
            <DialogHeader className="border-b border-border px-5 py-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3D398C]/10">
                  <BookOpen className="h-4 w-4 text-[#3D398C]" />
                </div>

                <div>
                  <DialogTitle className="text-base font-semibold text-[#3D398C]">
                    {editingProgram
                      ? "Edit Academic Program"
                      : "Add Academic Program"}
                  </DialogTitle>

                  <DialogDescription className="text-xs text-muted-foreground">
                    {editingProgram
                      ? "Update the academic program details."
                      : "Save an academic program inside the selected school program."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                <FormField
                  label="Academic Program"
                  name="fullName"
                  required
                  placeholder="e.g., Bachelor of Science in Information Technology"
                  value={form.fullName}
                  onChange={handleFormChange}
                  error={formErrors.fullName}
                />

                <FormField
                  label="Code"
                  name="code"
                  placeholder="E.G., BSIT"
                  value={form.code}
                  onChange={handleFormChange}
                  error={formErrors.code}
                  helper="Optional short code. Uppercase, lowercase, spaces, and hyphens are accepted."
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/20 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Preview
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-foreground">
                  {form.fullName
                    ? `${normalizeText(form.fullName)}${
                        form.code ? ` (${normalizeCode(form.code)})` : ""
                      }`
                    : "—"}
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-border px-5 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeFormDialog}
                disabled={actionLoading}
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={actionLoading}
                onClick={saveProgram}
                className="gap-1.5 bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingProgram
                      ? "Save Changes"
                      : "Add Academic Program"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete academic program?</AlertDialogTitle>

              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {deleteTarget?.fullName || "this academic program"}
                </span>
                . This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={actionLoading}
                onClick={(event) => {
                  event.preventDefault();
                  deleteProgram(deleteTarget);
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}