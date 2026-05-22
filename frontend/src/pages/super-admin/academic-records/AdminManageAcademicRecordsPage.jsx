
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, RotateCcw, Building2, CalendarDays, Award, Save, FolderOpen, BookOpen, ShieldAlert, Loader2 } from "lucide-react";

const BB = "#3D398C";
const API_BASE_URL = "http://127.0.0.1:8000/api";

const SIMPLE_FIELD_CONFIG = {
  yearGraduated: {
    label: "Years Graduated",
    singular: "Year Graduated",
    icon: CalendarDays,
    placeholder: "e.g., 2024",
    endpoint: "/year-graduated/",
  },
  academicAward: {
    label: "Academic Awards",
    singular: "Academic Award",
    icon: Award,
    placeholder: "e.g., Cum Laude",
    endpoint: "/academic-awards/",
  },
};

const SIMPLE_FIELD_ORDER = ["yearGraduated", "academicAward"];

function safe(v) {
  return String(v ?? "").trim();
}

function normalize(v) {
  return safe(v).toLowerCase();
}

function sanitizeSpacing(value) {
  return safe(String(value ?? "").replace(/\s+/g, " "));
}

function sanitizeCode(value) {
  return safe(value);
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
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.detail || Object.values(data || {})?.flat?.()?.[0] || "Request failed.";
    throw new Error(String(message));
  }

  return data;
}

async function logSystemAudit(action, details, metadata = {}) {
  const account = getStoredAccount();
  try {
    await apiRequest("/system-audit/log/", {
      method: "POST",
      body: JSON.stringify({
        actor_email: account?.email || "",
        actor_role: account?.role || "super-admin",
        action,
        details,
        scope: "academic_records",
        target_table: metadata.target_table || "academic_records",
        target_id: metadata.target_id ? String(metadata.target_id) : "",
        metadata,
      }),
    });
  } catch {
    // Audit must never block the main CRUD action.
  }
}

function PasswordConfirmDeleteModal({ open, title, message, password, passwordError, passwordTouched, loading, onPasswordChange, onPasswordBlur, onCancel, onConfirm }) {
  const hasValue = !!safe(password);
  const hasError = !!passwordError;
  const canSubmit = hasValue && !hasError && !loading;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onCancel(); }}>
      <DialogContent className="max-w-md p-0">
        <div className="border-b border-red-200 bg-red-50 px-6 py-4 dark:border-red-900/50 dark:bg-red-950/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-red-700 dark:text-red-300">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-xs text-red-600/90 dark:text-red-300/80">{message}</DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Type DELETE <span className="text-destructive">*</span></Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onBlur={onPasswordBlur}
              placeholder="DELETE"
              disabled={loading}
              className={`h-10 ${hasError ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : hasValue ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:border-red-800" : "border-input focus-visible:border-red-500 focus-visible:ring-red-500/20"}`}
            />
            <div className="min-h-[16px]">
              {hasError ? (
                <span className="text-[11px] font-medium text-red-600 dark:text-red-400">{passwordError}</span>
              ) : hasValue ? (
                <span className="text-[11px] font-medium text-red-600 dark:text-red-400">Confirmation entered. Deletion will continue after confirmation.</span>
              ) : passwordTouched ? (
                <span className="text-[11px] text-muted-foreground">Deletion confirmation is required.</span>
              ) : (
                <span className="text-[11px] text-muted-foreground">This replaces password re-authentication for the local Django setup.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-red-100 bg-red-50/60 px-6 py-3 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-xs text-red-600/90 dark:text-red-300/80">This action is permanent.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={loading} className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40">Cancel</Button>
            <Button size="sm" onClick={onConfirm} disabled={!canSubmit} className="bg-red-600 text-white hover:bg-red-700">
              {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Deleting...</> : <><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SchoolProgramFormModal({ open, mode, fullName, code, fullNameError, codeError, fullNameTouched, codeTouched, saving, onFullNameChange, onCodeChange, onFullNameBlur, onCodeBlur, onClose, onRequestSave }) {
  const isEdit = mode === "edit";
  const cleanFullName = sanitizeSpacing(fullName);
  const cleanCode = sanitizeCode(code);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-0">
        <div className="border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${BB}15` }}>
              <Building2 className="h-5 w-5" style={{ color: BB }} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold" style={{ color: BB }}>{isEdit ? "Edit School Program" : "Add School Program"}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">School programs group related academic programs together.</DialogDescription>
            </div>
          </div>
        </div>

        <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">School Program Name <span className="text-destructive">*</span></Label>
            <Input value={fullName} onChange={(e) => onFullNameChange(e.target.value)} onBlur={onFullNameBlur} placeholder="e.g., School of Information Technology" disabled={saving} className={`h-10 bg-background ${fullNameError ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : fullNameTouched && cleanFullName ? "border-[#3D398C]/40 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20" : "border-input focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"}`} />
            <div className="min-h-[16px]">{fullNameError ? <span className="text-[11px] font-medium text-destructive">{fullNameError}</span> : <span className="text-[11px] text-muted-foreground">Use the complete school name.</span>}</div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Code</Label>
            <Input value={code} onChange={(e) => onCodeChange(e.target.value)} onBlur={onCodeBlur} placeholder="e.g., SIT" disabled={saving} className={`h-10 bg-background ${codeError ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : codeTouched && cleanCode ? "border-[#3D398C]/40 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20" : "border-input focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"}`} />
            <div className="min-h-[16px]">{codeError ? <span className="text-[11px] font-medium text-destructive">{codeError}</span> : <span className="text-[11px] text-muted-foreground">Optional short code. Uppercase, lowercase, spaces, and hyphens are accepted.</span>}</div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{cleanFullName || "—"}{cleanCode ? ` (${cleanCode})` : ""}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">Confirm before saving changes.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" disabled={saving || !!fullNameError || !!codeError} onClick={onRequestSave} className="gap-1.5" style={{ backgroundColor: BB, color: "white" }}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : isEdit ? "Save Changes" : "Add School Program"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SimpleValueFormModal({ open, mode, config, value, error, touched, saving, onChange, onBlur, onClose, onRequestSave }) {
  if (!config) return null;
  const isEdit = mode === "edit";
  const Icon = config.icon;
  const cleanValue = sanitizeSpacing(value);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl p-0">
        <div className="border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${BB}15` }}>
              <Icon className="h-5 w-5" style={{ color: BB }} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold" style={{ color: BB }}>{isEdit ? `Edit ${config.singular}` : `Add ${config.singular}`}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">Save this value to the academic records table.</DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">{config.singular} <span className="text-destructive">*</span></Label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={config.placeholder} disabled={saving} className={`h-10 bg-background ${error ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : touched && cleanValue ? "border-[#3D398C]/40 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20" : "border-input focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"}`} />
            <div className="min-h-[16px]">{error ? <span className="text-[11px] font-medium text-destructive">{error}</span> : <span className="text-[11px] text-muted-foreground">This will be available as a managed option for this field.</span>}</div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{cleanValue || "—"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">Confirm before saving changes.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" disabled={saving || !!error} onClick={onRequestSave} className="gap-1.5" style={{ backgroundColor: BB, color: "white" }}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : isEdit ? "Save Changes" : `Add ${config.singular}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-foreground/70">{title}</p>
        <p className="max-w-md text-[11px] text-muted-foreground">{description}</p>
      </div>
      {onAction && <Button size="sm" onClick={onAction} className="mt-2 gap-1.5" style={{ backgroundColor: BB, color: "white" }}><Plus className="h-3.5 w-3.5" />{actionLabel}</Button>}
    </div>
  );
}

function SimpleFieldSection({ config, rows, saving, onCreate, onEdit, onDelete }) {
  const Icon = config.icon;
  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${BB}10` }}>
            <Icon className="h-4.5 w-4.5" style={{ color: BB }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: BB }}>{config.label}</h3>
            <p className="text-[11px] text-muted-foreground">{rows.length} {rows.length === 1 ? "entry" : "entries"} · Manage available {config.label.toLowerCase()}.</p>
          </div>
        </div>
        <Button size="sm" onClick={onCreate} disabled={saving} className="shrink-0 gap-1.5" style={{ backgroundColor: BB, color: "white" }}>
          <Plus className="h-3.5 w-3.5" /> Add {config.singular}
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={`No ${config.label.toLowerCase()} yet`} description={`Add your first ${config.singular.toLowerCase()} value for this managed field.`} actionLabel={`Add ${config.singular}`} onAction={onCreate} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-transparent">
                <TableHead className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{config.singular}</TableHead>
                <TableHead className="px-5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="cursor-default transition-colors duration-150 hover:bg-muted/40">
                  <TableCell className="px-5 py-2.5"><span className="text-[13px] font-semibold text-foreground">{sanitizeSpacing(row?.value) || "—"}</span></TableCell>
                  <TableCell className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" disabled={saving} onClick={() => onEdit(row)} className="h-7 gap-1 px-2.5 text-xs text-muted-foreground hover:bg-[#3D398C]/5 hover:text-[#3D398C]"><Pencil className="h-3 w-3" />Edit</Button>
                      <Button variant="ghost" size="sm" disabled={saving} onClick={() => onDelete(row)} className="h-7 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminManageAcademicRecordsPage() {
  const navigate = useNavigate();

  const [schoolPrograms, setSchoolPrograms] = useState([]);
  const [simpleRows, setSimpleRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [schoolProgramModalOpen, setSchoolProgramModalOpen] = useState(false);
  const [schoolProgramFormMode, setSchoolProgramFormMode] = useState("create");
  const [selectedSchoolProgramId, setSelectedSchoolProgramId] = useState(null);
  const [schoolProgramFullName, setSchoolProgramFullName] = useState("");
  const [schoolProgramCode, setSchoolProgramCode] = useState("");
  const [schoolProgramFullNameTouched, setSchoolProgramFullNameTouched] = useState(false);
  const [schoolProgramCodeTouched, setSchoolProgramCodeTouched] = useState(false);

  const [simpleModalOpen, setSimpleModalOpen] = useState(false);
  const [simpleFormMode, setSimpleFormMode] = useState("create");
  const [selectedSimpleField, setSelectedSimpleField] = useState(null);
  const [selectedSimpleId, setSelectedSimpleId] = useState(null);
  const [simpleValue, setSimpleValue] = useState("");
  const [simpleValueTouched, setSimpleValueTouched] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteContext, setDeleteContext] = useState({ type: null, item: null });
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordTouched, setDeletePasswordTouched] = useState(false);

  const schoolProgramFullNameError = useMemo(() => {
    if (!schoolProgramFullNameTouched) return "";
    const clean = sanitizeSpacing(schoolProgramFullName);
    if (!clean) return "School Program name is required.";
    const duplicate = schoolPrograms.some((row) => row.id !== selectedSchoolProgramId && normalize(row.full_name) === normalize(clean));
    if (duplicate) return "This school program already exists.";
    return "";
  }, [schoolProgramFullName, schoolProgramFullNameTouched, schoolPrograms, selectedSchoolProgramId]);

  const schoolProgramCodeError = useMemo(() => {
    if (!schoolProgramCodeTouched) return "";
    const clean = sanitizeCode(schoolProgramCode);
    if (!clean) return "";
    if (!/^[a-zA-Z0-9-\s]+$/.test(clean)) return "Code must only contain letters, numbers, spaces, and hyphens.";
    const duplicate = schoolPrograms.some((row) => row.id !== selectedSchoolProgramId && normalize(row.code) === normalize(clean));
    if (duplicate) return "This code is already used.";
    return "";
  }, [schoolProgramCode, schoolProgramCodeTouched, schoolPrograms, selectedSchoolProgramId]);

  const selectedSimpleConfig = selectedSimpleField ? SIMPLE_FIELD_CONFIG[selectedSimpleField] : null;

  const simpleValueError = useMemo(() => {
    if (!simpleValueTouched || !selectedSimpleField) return "";
    const clean = sanitizeSpacing(simpleValue);
    if (!clean) return `${selectedSimpleConfig?.singular || "Value"} is required.`;
    const duplicate = getSimpleRows(selectedSimpleField).some((row) => row.id !== selectedSimpleId && normalize(row.value) === normalize(clean));
    if (duplicate) return "This value already exists.";
    return "";
  }, [simpleValue, simpleValueTouched, selectedSimpleField, selectedSimpleConfig, selectedSimpleId, simpleRows]);

  const deletePasswordError = useMemo(() => {
    if (!deletePasswordTouched) return "";
    if (safe(deletePassword) !== "DELETE") return "Type DELETE to confirm deletion.";
    return "";
  }, [deletePassword, deletePasswordTouched]);

  const schoolProgramCount = schoolPrograms.length;
  const academicProgramCount = schoolPrograms.reduce((sum, row) => sum + (row.academic_programs?.length || 0), 0);
  const yearCount = getSimpleRows("yearGraduated").length;
  const awardCount = getSimpleRows("academicAward").length;

  const fetchSchoolPrograms = useCallback(async () => {
    const data = await apiRequest("/school-programs/");
    const list = normalizeListResponse(data).map((row) => ({
      ...row,
      fullName: row.full_name || row.fullName || "",
      code: row.code || "",
      academicPrograms: row.academic_programs || row.academicPrograms || [],
    }));
    setSchoolPrograms(list);
  }, []);

  const fetchSimpleFields = useCallback(async () => {
    const results = await Promise.all(
      SIMPLE_FIELD_ORDER.map(async (fieldKey) => {
        const config = SIMPLE_FIELD_CONFIG[fieldKey];
        const data = await apiRequest(config.endpoint);
        return normalizeListResponse(data).map((row) => ({ ...row, fieldKey, value: row.value || "" }));
      }),
    );
    setSimpleRows(results.flat());
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchSchoolPrograms(), fetchSimpleFields()]);
    } catch (err) {
      const msg = err?.message || "Failed to load academic records.";
      setError(msg);
      toast.error("Failed to load academic records", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [fetchSchoolPrograms, fetchSimpleFields]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function resetSchoolProgramForm() {
    setSelectedSchoolProgramId(null);
    setSchoolProgramFullName("");
    setSchoolProgramCode("");
    setSchoolProgramFullNameTouched(false);
    setSchoolProgramCodeTouched(false);
  }

  function openCreateSchoolProgramModal() {
    resetSchoolProgramForm();
    setSchoolProgramFormMode("create");
    setSchoolProgramModalOpen(true);
  }

  function openEditSchoolProgramModal(item) {
    setSelectedSchoolProgramId(item.id);
    setSchoolProgramFullName(item.full_name || item.fullName || "");
    setSchoolProgramCode(item.code || "");
    setSchoolProgramFullNameTouched(false);
    setSchoolProgramCodeTouched(false);
    setSchoolProgramFormMode("edit");
    setSchoolProgramModalOpen(true);
  }

  function closeSchoolProgramModal() {
    if (saving) return;
    setSchoolProgramModalOpen(false);
    resetSchoolProgramForm();
  }

  function handleSchoolProgramFullNameChange(value) { setSchoolProgramFullName(String(value || "")); }
  function handleSchoolProgramCodeChange(value) { setSchoolProgramCode(sanitizeCode(value)); }
  function handleSchoolProgramFullNameBlur() { setSchoolProgramFullName(sanitizeSpacing(schoolProgramFullName)); setSchoolProgramFullNameTouched(true); }
  function handleSchoolProgramCodeBlur() { setSchoolProgramCode(sanitizeCode(schoolProgramCode)); setSchoolProgramCodeTouched(true); }

  function requestSaveSchoolProgram() {
    setSchoolProgramFullNameTouched(true);
    setSchoolProgramCodeTouched(true);
    if (schoolProgramFullNameError || schoolProgramCodeError) return;
    handleConfirmedSaveSchoolProgram();
  }

  async function handleConfirmedSaveSchoolProgram() {
    const fullName = sanitizeSpacing(schoolProgramFullName);
    const code = sanitizeCode(schoolProgramCode);
    if (!fullName) return;

    setSaving(true);
    setError("");
    try {
      const payload = { full_name: fullName, code, status: "active" };
      if (schoolProgramFormMode === "create") {
        const created = await apiRequest("/school-programs/", { method: "POST", body: JSON.stringify(payload) });
        await logSystemAudit("CREATE_ACADEMIC_RECORD", `Created school program: ${fullName}${code ? ` (${code})` : ""}`, { target_table: "school_program_table", target_id: created?.id, record_type: "school_program" });
        toast.success("School program added successfully", { description: fullName });
      } else {
        await apiRequest(`/school-programs/${selectedSchoolProgramId}/`, { method: "PATCH", body: JSON.stringify(payload) });
        await logSystemAudit("UPDATE_ACADEMIC_RECORD", `Updated school program: ${fullName}${code ? ` (${code})` : ""}`, { target_table: "school_program_table", target_id: selectedSchoolProgramId, record_type: "school_program" });
        toast.success("School program updated successfully", { description: fullName });
      }
      closeSchoolProgramModal();
      await fetchSchoolPrograms();
    } catch (err) {
      const msg = err?.message || "Failed to save school program.";
      setError(msg);
      toast.error("Failed to save", { description: msg });
    } finally { setSaving(false); }
  }

  function resetSimpleForm() {
    setSelectedSimpleField(null);
    setSelectedSimpleId(null);
    setSimpleValue("");
    setSimpleValueTouched(false);
  }

  function openCreateSimpleModal(fieldKey) {
    resetSimpleForm();
    setSelectedSimpleField(fieldKey);
    setSimpleFormMode("create");
    setSimpleModalOpen(true);
  }

  function openEditSimpleModal(fieldKey, row) {
    setSelectedSimpleField(fieldKey);
    setSelectedSimpleId(row.id);
    setSimpleValue(row.value || "");
    setSimpleValueTouched(false);
    setSimpleFormMode("edit");
    setSimpleModalOpen(true);
  }

  function closeSimpleModal() {
    if (saving) return;
    setSimpleModalOpen(false);
    resetSimpleForm();
  }

  function handleSimpleValueChange(value) { setSimpleValue(String(value || "")); }
  function handleSimpleValueBlur() { setSimpleValue(sanitizeSpacing(simpleValue)); setSimpleValueTouched(true); }

  function requestSaveSimple() {
    setSimpleValueTouched(true);
    if (simpleValueError) return;
    handleConfirmedSaveSimple();
  }

  async function handleConfirmedSaveSimple() {
    const cleanValue = sanitizeSpacing(simpleValue);
    if (!cleanValue || !selectedSimpleConfig) return;
    setSaving(true);
    setError("");
    try {
      if (simpleFormMode === "create") {
        const created = await apiRequest(selectedSimpleConfig.endpoint, { method: "POST", body: JSON.stringify({ value: cleanValue }) });
        await logSystemAudit("CREATE_ACADEMIC_RECORD", `Created ${selectedSimpleConfig.singular}: ${cleanValue}`, { target_table: selectedSimpleField === "yearGraduated" ? "year_graduated_table" : "academic_award_table", target_id: created?.id, record_type: selectedSimpleField });
        toast.success(`${selectedSimpleConfig.singular} added successfully`, { description: `"${cleanValue}" has been added.` });
      } else {
        await apiRequest(`${selectedSimpleConfig.endpoint}${selectedSimpleId}/`, { method: "PATCH", body: JSON.stringify({ value: cleanValue }) });
        await logSystemAudit("UPDATE_ACADEMIC_RECORD", `Updated ${selectedSimpleConfig.singular}: ${cleanValue}`, { target_table: selectedSimpleField === "yearGraduated" ? "year_graduated_table" : "academic_award_table", target_id: selectedSimpleId, record_type: selectedSimpleField });
        toast.success(`${selectedSimpleConfig.singular} updated successfully`, { description: `"${cleanValue}" has been saved.` });
      }
      closeSimpleModal();
      await fetchSimpleFields();
    } catch (err) {
      const msg = err?.message || "Failed to save academic option.";
      setError(msg);
      toast.error("Failed to save", { description: msg });
    } finally { setSaving(false); }
  }

  function getSimpleRows(fieldKey) { return simpleRows.filter((row) => row.fieldKey === fieldKey); }

  function requestDeleteSchoolProgram(item) {
    setDeleteContext({ type: "schoolProgram", item });
    setDeletePassword(""); setDeletePasswordTouched(false); setDeleteModalOpen(true);
  }

  function requestDeleteSimple(fieldKey, item) {
    setSelectedSimpleField(fieldKey);
    setDeleteContext({ type: "simpleValue", item, fieldKey });
    setDeletePassword(""); setDeletePasswordTouched(false); setDeleteModalOpen(true);
  }

  function closeDeleteModal() { if (!saving) { setDeleteModalOpen(false); setDeleteContext({ type: null, item: null }); setDeletePassword(""); setDeletePasswordTouched(false); } }
  function handleDeletePasswordChange(value) { setDeletePassword(String(value || "").toUpperCase()); }
  function handleDeletePasswordBlur() { setDeletePasswordTouched(true); }

  async function handleConfirmedDelete() {
    setDeletePasswordTouched(true);
    if (safe(deletePassword) !== "DELETE") return;
    const { type, item, fieldKey } = deleteContext;
    if (!type || !item) return;
    setSaving(true); setError("");
    try {
      if (type === "schoolProgram") {
        await apiRequest(`/school-programs/${item.id}/`, { method: "DELETE" });
        await logSystemAudit("DELETE_ACADEMIC_RECORD", `Deleted school program: ${item.full_name || item.fullName}`, { target_table: "school_program_table", target_id: item.id, record_type: "school_program" });
        toast.success("School program deleted successfully");
        await fetchSchoolPrograms();
      } else {
        const config = SIMPLE_FIELD_CONFIG[fieldKey];
        await apiRequest(`${config.endpoint}${item.id}/`, { method: "DELETE" });
        await logSystemAudit("DELETE_ACADEMIC_RECORD", `Deleted ${config.singular}: ${item.value}`, { target_table: fieldKey === "yearGraduated" ? "year_graduated_table" : "academic_award_table", target_id: item.id, record_type: fieldKey });
        toast.success(`${config.singular} deleted successfully`);
        await fetchSimpleFields();
      }
      closeDeleteModal();
    } catch (err) {
      const msg = err?.message || "Failed to delete record.";
      setError(msg);
      toast.error("Failed to delete", { description: msg });
    } finally { setSaving(false); }
  }

  function getDeleteModalTitle() {
    if (deleteContext.type === "schoolProgram") return "Delete school program?";
    if (deleteContext.type === "simpleValue") return `Delete ${selectedSimpleConfig?.singular?.toLowerCase()}?`;
    return "Delete record?";
  }

  function getDeleteModalMessage() {
    if (deleteContext.type === "schoolProgram") return `This will permanently delete "${sanitizeSpacing(deleteContext.item?.full_name || deleteContext.item?.fullName)}" and its academic programs. Type DELETE to continue.`;
    if (deleteContext.type === "simpleValue") return `This will permanently delete "${sanitizeSpacing(deleteContext.item?.value)}". Type DELETE to continue.`;
    return "Type DELETE to continue with deletion.";
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <SchoolProgramFormModal open={schoolProgramModalOpen} mode={schoolProgramFormMode} fullName={schoolProgramFullName} code={schoolProgramCode} fullNameError={schoolProgramFullNameError} codeError={schoolProgramCodeError} fullNameTouched={schoolProgramFullNameTouched} codeTouched={schoolProgramCodeTouched} saving={saving} onFullNameChange={handleSchoolProgramFullNameChange} onCodeChange={handleSchoolProgramCodeChange} onFullNameBlur={handleSchoolProgramFullNameBlur} onCodeBlur={handleSchoolProgramCodeBlur} onClose={closeSchoolProgramModal} onRequestSave={requestSaveSchoolProgram} />
      <SimpleValueFormModal open={simpleModalOpen} mode={simpleFormMode} config={selectedSimpleConfig} value={simpleValue} error={simpleValueError} touched={simpleValueTouched} saving={saving} onChange={handleSimpleValueChange} onBlur={handleSimpleValueBlur} onClose={closeSimpleModal} onRequestSave={requestSaveSimple} />
      <PasswordConfirmDeleteModal open={deleteModalOpen} title={getDeleteModalTitle()} message={getDeleteModalMessage()} password={deletePassword} passwordError={deletePasswordError} passwordTouched={deletePasswordTouched} loading={saving} onPasswordChange={handleDeletePasswordChange} onPasswordBlur={handleDeletePasswordBlur} onCancel={closeDeleteModal} onConfirm={handleConfirmedDelete} />

      {error && <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">{error}</div>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, color: BB, val: schoolProgramCount, label: "School Programs", desc: "Managed school groups" },
            { icon: BookOpen, color: BB, val: academicProgramCount, label: "Academic Programs", desc: "Nested under school programs" },
            { icon: CalendarDays, color: "#d97706", val: yearCount, label: "Years", desc: "Graduation year options" },
            { icon: Award, color: "#7c3aed", val: awardCount, label: "Awards", desc: "Academic award options" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="select-none group rounded-2xl border border-border bg-card px-8 py-5 shadow-sm transition-all duration-200 cursor-default min-h-[120px]" onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${s.color}33`)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
                <div className="flex h-full flex-col gap-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-foreground/80">{s.label}</p>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${s.color}1A` }}><Icon className="h-5 w-5" style={{ color: s.color }} /></div>
                  </div>
                  <p className="text-3xl font-bold leading-none tracking-tight" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="animate-in fade-in-50 slide-in-from-bottom-2 rounded-lg border border-border bg-muted/30 p-3 duration-300">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading || saving} className="h-9 gap-1.5 font-medium"><RotateCcw className="h-3.5 w-3.5" />Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />
            <div className="space-y-1 text-center"><p className="text-sm font-medium text-foreground/70">Loading academic records...</p><p className="text-[11px] text-muted-foreground">Fetching data from the database</p></div>
          </div>
        </div>
      ) : (
        <>
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${BB}10` }}><Building2 className="h-4.5 w-4.5" style={{ color: BB }} /></div>
                <div><h3 className="text-sm font-bold" style={{ color: BB }}>School Programs</h3><p className="text-[11px] text-muted-foreground">Click a card to view and manage the academic programs inside.</p></div>
              </div>
              <Button size="sm" onClick={openCreateSchoolProgramModal} disabled={saving} className="shrink-0 gap-1.5" style={{ backgroundColor: BB, color: "white" }}><Plus className="h-3.5 w-3.5" />Add School Program</Button>
            </div>

            {schoolPrograms.length === 0 ? (
              <EmptyState title="No school programs yet" description="Add the first school program to start organizing academic programs." actionLabel="Add School Program" onAction={openCreateSchoolProgramModal} />
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {schoolPrograms.map((item) => {
                  const fullName = item.full_name || item.fullName || "";
                  const code = item.code || "";
                  const nestedCount = item.academic_programs?.length || item.academicPrograms?.length || 0;
                  return (
                    <div key={item.id} role="button" tabIndex={0} onClick={() => navigate(`/admin/academic-records/${item.id}`)} className="group cursor-pointer rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D398C]/30 hover:bg-[#3D398C]/[0.03] hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10"><Building2 className="h-5 w-5 text-[#3D398C]" /></div>
                          <div className="min-w-0"><p className="line-clamp-2 text-sm font-bold text-foreground">{fullName}</p><p className="mt-1 text-xs font-semibold text-[#3D398C]">{code || "No Code"}</p><p className="mt-1 text-[11px] text-muted-foreground">{nestedCount} academic {nestedCount === 1 ? "program" : "programs"}</p></div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-1.5 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" disabled={saving} onClick={() => openEditSchoolProgramModal(item)} className="h-7 gap-1 px-2.5 text-xs text-muted-foreground hover:bg-[#3D398C]/5 hover:text-[#3D398C]"><Pencil className="h-3 w-3" />Edit</Button>
                        <Button variant="ghost" size="sm" disabled={saving} onClick={() => requestDeleteSchoolProgram(item)} className="h-7 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {SIMPLE_FIELD_ORDER.map((fieldKey) => (
            <SimpleFieldSection key={fieldKey} config={SIMPLE_FIELD_CONFIG[fieldKey]} rows={getSimpleRows(fieldKey)} saving={saving} onCreate={() => openCreateSimpleModal(fieldKey)} onEdit={(row) => openEditSimpleModal(fieldKey, row)} onDelete={(row) => requestDeleteSimple(fieldKey, row)} />
          ))}
        </>
      )}
    </div>
  );
}
