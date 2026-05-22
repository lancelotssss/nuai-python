import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Search,
  Shield,
  Trash2,
  UserRound,
  Mail,
  Briefcase,
  Save,
  IdCard,
  Clock3,
} from "lucide-react";

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
const BRAND_BLUE = "#3D398C";
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ROLE_CONFIG = {
  "Alumni Affairs Officer": {
    endpoint: "/alumni-officers/",
    role: "alumni-officer",
    tableLabel: "Alumni Affairs Officer",
  },
  AILPO: {
    endpoint: "/ailpo/",
    role: "ailpo",
    tableLabel: "AILPO",
  },
  Registrar: {
    endpoint: "/registrars/",
    role: "registrar",
    tableLabel: "Registrar",
  },
  "Internship Advisers": {
    endpoint: "/faculty/",
    role: "faculty",
    tableLabel: "Internship Adviser",
  },
  "Internship Adviser": {
    endpoint: "/faculty/",
    role: "faculty",
    tableLabel: "Internship Adviser",
  },
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function safe(value) {
  const clean = normalizeText(value);
  return clean || "—";
}

function normalizeStatus(value) {
  const status = String(value || "active").trim().toLowerCase();
  if (status === "inactive" || status === "suspended") return "deactivated";
  if (status === "deactivated") return "deactivated";
  return "active";
}

function displayStatus(value) {
  return normalizeStatus(value) === "active" ? "Active" : "Deactivated";
}

function getAccountId(row) {
  if (!row) return null;
  if (row.account && typeof row.account === "object") return row.account.id;
  return row.account || row.account_id || row.accountId || null;
}

function normalizeDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function getFullName(row) {
  if (!row) return "";

  return [
    row.first_name || row.firstName,
    row.middle_name || row.middleName,
    row.last_name || row.lastName,
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join(" ");
}

function normalizeAdmin(row) {
  const accountId = getAccountId(row);

  const firstName = row.first_name || row.firstName || "";
  const middleName = row.middle_name || row.middleName || "";
  const lastName = row.last_name || row.lastName || "";

  const program =
    row.program ||
    row.academic_program ||
    row.academicProgram ||
    "";

  const programCode = row.program_code || row.programCode || "";

  const schoolProgram = row.school_program || row.schoolProgram || "";
  const schoolProgramCode =
    row.school_program_code || row.schoolProgramCode || "";

  return {
    ...row,
    id: row.id,
    accountId,
    employeeId: row.employee_id || row.employeeId || "",
    firstName,
    middleName,
    lastName,
    fullName: [firstName, middleName, lastName]
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join(" "),
    email:
      row.email ||
      row.official_email ||
      row.officialEmail ||
      row.account?.email ||
      row.account_email ||
      "",
    department: row.department || "",
    position: row.position || row.department_title || row.departmentTitle || "",
    role: row.role || row.account?.role || row.account_role || "",
    status: normalizeStatus(row.status || row.account?.status || row.account_status),
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
    schoolProgram,
    schoolProgramCode,
    program,
    programCode,
  };
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

function DetailBox({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {safe(value)}
      </p>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Icon className="h-4 w-4 text-[#3D398C]" />
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#3D398C]">
          {title}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function EditField({ label, name, value, onChange, type = "text", required = false, error = "", helper = "", readOnly = false }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        className={[
          "h-9 text-sm",
          error ? "border-destructive focus-visible:ring-destructive/30" : "",
          readOnly ? "bg-muted/50 cursor-not-allowed text-muted-foreground" : "",
        ].join(" ")}
      />
      <div className="min-h-[14px]">
        {error ? (
          <span className="text-[11px] font-medium text-destructive">{error}</span>
        ) : helper ? (
          <span className="text-[11px] text-muted-foreground">{helper}</span>
        ) : null}
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, showPassword, onToggle, error = "", helper = "" }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          name={name}
          type={showPassword ? "text" : "password"}
          value={value || ""}
          onChange={onChange}
          className={[
            "h-9 pr-9 text-sm",
            error ? "border-destructive focus-visible:ring-destructive/30" : "",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-[#3D398C]"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="min-h-[14px]">
        {error ? (
          <span className="text-[11px] font-medium text-destructive">{error}</span>
        ) : helper ? (
          <span className="text-[11px] text-muted-foreground">{helper}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function DepartmentAdminTablePage({
  title,
  departmentName,
  createPath,
  showProgramColumn = false,
}) {
  const navigate = useNavigate();
  const config = ROLE_CONFIG[departmentName] || ROLE_CONFIG["Internship Adviser"];

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(config.endpoint);
      const list = normalizeListResponse(data).map(normalizeAdmin);
      setAdmins(list);
      setPageIndex(0);
    } catch (err) {
      setError(err?.message || `Failed to load ${departmentName} records.`);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, departmentName]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    setPageIndex(0);
  }, [search, pageSize]);

  const filteredAdmins = useMemo(() => {
    const q = normalizeText(search).toLowerCase();
    if (!q) return admins;

    return admins.filter((admin) => {
      const haystack = [
        admin.fullName,
        admin.email,
        admin.employeeId,
        admin.department,
        admin.position,
        admin.role,
        admin.status,
        admin.program,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [admins, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const visibleAdmins = filteredAdmins.slice(start, start + pageSize);
  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  async function updateAdminStatus(admin) {
    if (!admin) return;

    const currentStatus = normalizeStatus(admin.status);
    const nextStatus = currentStatus === "active" ? "deactivated" : "active";
    const accountId = admin.accountId;

    setActionLoading(true);

    try {
      await apiRequest(`${config.endpoint}${admin.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (accountId) {
        await apiRequest(`/accounts/${accountId}/`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
      }

      setAdmins((prev) =>
        prev.map((item) =>
          item.id === admin.id ? { ...item, status: nextStatus } : item,
        ),
      );

      setSelectedAdmin((prev) =>
        prev?.id === admin.id ? { ...prev, status: nextStatus } : prev,
      );

      toast.success(
        `${admin.fullName || admin.email} has been ${
          nextStatus === "active" ? "activated" : "deactivated"
        }.`,
      );

      setStatusTarget(null);
    } catch (err) {
      toast.error("Failed to update account status", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteAdmin(admin) {
    if (!admin) return;

    const accountId = admin.accountId;

    setActionLoading(true);

    try {
      await apiRequest(`${config.endpoint}${admin.id}/`, {
        method: "DELETE",
      });

      if (accountId) {
        await apiRequest(`/accounts/${accountId}/`, {
          method: "DELETE",
        });
      } else if (admin.email) {
        const accountsData = await apiRequest("/accounts/");
        const accounts = normalizeListResponse(accountsData);
        const accountMatch = accounts.find(
          (item) =>
            String(item.email || "").trim().toLowerCase() ===
            String(admin.email || "").trim().toLowerCase(),
        );

        if (accountMatch?.id) {
          await apiRequest(`/accounts/${accountMatch.id}/`, {
            method: "DELETE",
          });
        }
      }

      setAdmins((prev) => prev.filter((item) => item.id !== admin.id));
      if (selectedAdmin?.id === admin.id) setSelectedAdmin(null);
      setDeleteTarget(null);

      toast.success(`${admin.fullName || admin.email} has been deleted.`);
    } catch (err) {
      toast.error("Failed to delete administrator", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openEditDialog(admin) {
    if (!admin) return;

    setEditTarget(admin);
    setEditForm({
      employeeId: admin.employeeId || "",
      firstName: admin.firstName || "",
      middleName: admin.middleName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      department: admin.department || "",
      position: admin.position || "",
      program: admin.program || "",
      password: "",
      confirmPassword: "",
    });
    setEditErrors({});
    setShowEditPassword(false);
  }

  function closeEditDialog() {
    if (actionLoading) return;
    setEditTarget(null);
    setEditForm(null);
    setEditErrors({});
    setShowEditPassword(false);
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: name === "email" ? normalizeEmail(value) : value,
    }));

    setEditErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validateEditForm() {
    const nextErrors = {};

    const employeeId = normalizeText(editForm?.employeeId);
    const firstName = normalizeText(editForm?.firstName);
    const lastName = normalizeText(editForm?.lastName);
    const email = normalizeEmail(editForm?.email);
    const department = normalizeText(editForm?.department);
    const position = normalizeText(editForm?.position);
    const password = String(editForm?.password || "");
    const confirmPassword = String(editForm?.confirmPassword || "");

    if (!employeeId) nextErrors.employeeId = "Employee ID is required.";
    if (!firstName) nextErrors.firstName = "First name is required.";
    if (!lastName) nextErrors.lastName = "Last name is required.";
    if (!email) nextErrors.email = "Email is required.";
    else if (!isValidEmail(email)) nextErrors.email = "Please enter a valid email address.";
    if (!department) nextErrors.department = "Department is required.";
    if (!position) nextErrors.position = "Position is required.";

    if (password || confirmPassword) {
      if (password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
      if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    }

    setEditErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      throw new Error(Object.values(nextErrors)[0]);
    }

    return {
      employeeId,
      firstName,
      middleName: normalizeText(editForm?.middleName),
      lastName,
      email,
      department,
      position,
      program: normalizeText(editForm?.program),
      password,
    };
  }

  async function updateAdminProfile() {
    if (!editTarget || !editForm) return;

    let cleaned;

    try {
      cleaned = validateEditForm();
    } catch (err) {
      toast.error("Validation error", {
        description: err?.message || "Please check the form and try again.",
      });
      return;
    }

    setActionLoading(true);

    try {
      const profilePayload = {
        employee_id: cleaned.employeeId,
        first_name: cleaned.firstName,
        middle_name: cleaned.middleName,
        last_name: cleaned.lastName,
        email: cleaned.email,
        department: cleaned.department,
        position: cleaned.position,
      };

      if (showProgramColumn) {
        profilePayload.school_program = cleaned.schoolProgram;
        profilePayload.school_program_code = cleaned.schoolProgramCode;
        profilePayload.program = cleaned.program;
        profilePayload.program_code = cleaned.programCode;
      }

      const updatedProfile = await apiRequest(`${config.endpoint}${editTarget.id}/`, {
        method: "PATCH",
        body: JSON.stringify(profilePayload),
      });

      if (editTarget.accountId) {
        const accountPayload = { email: cleaned.email };

        if (cleaned.password) {
          accountPayload.password = cleaned.password;
        }

        await apiRequest(`/accounts/${editTarget.accountId}/`, {
          method: "PATCH",
          body: JSON.stringify(accountPayload),
        });
      }

      const merged = normalizeAdmin({
        ...editTarget,
        ...updatedProfile,
        employee_id: cleaned.employeeId,
        first_name: cleaned.firstName,
        middle_name: cleaned.middleName,
        last_name: cleaned.lastName,
        email: cleaned.email,
        department: cleaned.department,
        position: cleaned.position,
        program: cleaned.program,
      });

      setAdmins((prev) => prev.map((item) => (item.id === editTarget.id ? merged : item)));
      setSelectedAdmin((prev) => (prev?.id === editTarget.id ? merged : prev));

      toast.success(`${merged.fullName || merged.email} has been updated.`);
      closeEditDialog();
    } catch (err) {
      toast.error("Failed to update administrator", {
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/manage-administrators")}
            className="mb-3 h-8 gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-[#3D398C]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            BACK
          </Button>

          <h1 className="text-xl font-bold tracking-tight text-[#3D398C]">
            {title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Review and manage {departmentName} administrator accounts.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate(createPath)}
          className="gap-1.5 bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
        >
          <Plus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
          <p className="text-xl font-bold leading-tight tracking-tight text-[#3D398C]">
            {admins.length}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground/80">
            Total Records
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {config.tableLabel} profiles
          </p>
        </div>

        <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
          <p className="text-xl font-bold leading-tight tracking-tight text-emerald-600">
            {admins.filter((item) => normalizeStatus(item.status) === "active").length}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground/80">
            Active
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Can login to the system
          </p>
        </div>

        <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
          <p className="text-xl font-bold leading-tight tracking-tight text-red-600">
            {admins.filter((item) => normalizeStatus(item.status) !== "active").length}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground/80">
            Deactivated
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Login access is blocked
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
              Administrator Records
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Click a row to view profile details.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records..."
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Employee ID
                </TableHead>
                {showProgramColumn ? (
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Program
                  </TableHead>
                ) : null}
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showProgramColumn ? 6 : 5} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-[#3D398C]" />
                      <p className="text-sm">Loading administrators...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : visibleAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showProgramColumn ? 6 : 5} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UserRound className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground/70">
                        No administrator records found
                      </p>
                      <p className="text-xs">
                        {search ? "Try a different search term." : "Create an administrator account to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleAdmins.map((admin) => {
                  const isActive = normalizeStatus(admin.status) === "active";

                  return (
                    <TableRow
                      key={admin.id}
                      onClick={() => setSelectedAdmin(admin)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-muted/40"
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3D398C]/10 text-xs font-bold text-[#3D398C]">
                            {(admin.fullName || admin.email || "NA").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {safe(admin.fullName)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {safe(admin.position)}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {safe(admin.email)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground/80">
                        {safe(admin.employeeId)}
                      </TableCell>

                      {showProgramColumn ? (
                        <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {safe(
                            admin.program && admin.programCode
                              ? `${admin.program} (${admin.programCode})`
                              : admin.program || admin.programCode,
                          )}
                        </TableCell>
                      ) : null}

                      <TableCell className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? "border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
                              : "border-red-200 bg-red-50 text-[11px] font-semibold text-red-700"
                          }
                        >
                          {displayStatus(admin.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-[#3D398C]"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedAdmin(admin);
                            }}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-[#3D398C]"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(admin);
                            }}
                            title="Edit administrator"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={
                              isActive
                                ? "h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                : "h-8 w-8 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              setStatusTarget(admin);
                            }}
                            title={isActive ? "Deactivate account" : "Activate account"}
                          >
                            {isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(admin);
                            }}
                            title="Delete administrator"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
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
            <span>{filteredAdmins.length} total</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs text-muted-foreground">
              Page <span className="font-semibold text-foreground">{safePageIndex + 1}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </span>

            <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canPrev} onClick={() => goToPage(0)}>
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canPrev} onClick={() => goToPage(safePageIndex - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canNext} onClick={() => goToPage(safePageIndex + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canNext} onClick={() => goToPage(totalPages - 1)}>
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedAdmin} onOpenChange={(open) => !open && setSelectedAdmin(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="text-base font-semibold text-foreground">
              Administrator Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Full profile and system information for{" "}
              <span className="font-semibold text-foreground">
                {selectedAdmin?.fullName || selectedAdmin?.email}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[62vh] space-y-5 overflow-y-auto px-5 py-4">
            <DetailSection icon={UserRound} title="Contact Information">
              <DetailBox label="Full Name" value={selectedAdmin?.fullName} />
              <DetailBox label="First Name" value={selectedAdmin?.firstName} />
              <DetailBox label="Middle Name" value={selectedAdmin?.middleName} />
              <DetailBox label="Last Name" value={selectedAdmin?.lastName} />
              <DetailBox label="Email" value={selectedAdmin?.email} />
            </DetailSection>

            <DetailSection icon={Shield} title="Department Information">
              <DetailBox label="Department" value={selectedAdmin?.department} />
              <DetailBox label="Office Email" value={selectedAdmin?.email} />
              <DetailBox label="Role" value={selectedAdmin?.role || config.role} />
              <DetailBox label="Employee ID" value={selectedAdmin?.employeeId} />
              <DetailBox label="Position" value={selectedAdmin?.position} />
              <DetailBox label="Status" value={displayStatus(selectedAdmin?.status)} />
              {showProgramColumn ? (
                <>
                  <DetailBox
                    label="School Program"
                    value={
                      selectedAdmin?.schoolProgram && selectedAdmin?.schoolProgramCode
                        ? `${selectedAdmin.schoolProgram} (${selectedAdmin.schoolProgramCode})`
                        : selectedAdmin?.schoolProgram || selectedAdmin?.schoolProgramCode
                    }
                  />

                  <DetailBox
                    label="Academic Program"
                    value={
                      selectedAdmin?.program && selectedAdmin?.programCode
                        ? `${selectedAdmin.program} (${selectedAdmin.programCode})`
                        : selectedAdmin?.program || selectedAdmin?.programCode
                    }
                  />
                </>
              ) : null}
            </DetailSection>

            <DetailSection icon={Clock3} title="System Information">
              <DetailBox label="Profile ID" value={selectedAdmin?.id} />
              <DetailBox label="Account ID" value={selectedAdmin?.accountId} />
              <DetailBox label="Created At" value={normalizeDate(selectedAdmin?.createdAt)} />
              <DetailBox label="Updated At" value={normalizeDate(selectedAdmin?.updatedAt)} />
            </DetailSection>
          </div>

          <DialogFooter className="border-t border-border px-5 py-3">
            <Button type="button" variant="outline" onClick={() => setSelectedAdmin(null)}>
              Close
            </Button>

            {selectedAdmin ? (
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={() => openEditDialog(selectedAdmin)}
                className="gap-1.5"
              >
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
            ) : null}

            {selectedAdmin ? (
              <Button
                type="button"
                disabled={actionLoading}
                onClick={() => setStatusTarget(selectedAdmin)}
                className={
                  normalizeStatus(selectedAdmin.status) === "active"
                    ? "gap-1.5 bg-red-600 text-white hover:bg-red-700"
                    : "gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                }
              >
                {normalizeStatus(selectedAdmin.status) === "active" ? (
                  <>
                    <PowerOff className="h-4 w-4" /> Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" /> Activate
                  </>
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="text-base font-semibold text-foreground">
              Edit Administrator
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update profile information for{" "}
              <span className="font-semibold text-foreground">
                {editTarget?.fullName || editTarget?.email}
              </span>
              . Leave password fields blank if you do not want to reset the login password.
            </DialogDescription>
          </DialogHeader>

          {editForm ? (
            <div className="max-h-[62vh] space-y-5 overflow-y-auto px-5 py-4">
              <DetailSection icon={UserRound} title="Personal & Contact Information">
                <EditField
                  label="First Name"
                  name="firstName"
                  required
                  value={editForm.firstName}
                  onChange={handleEditChange}
                  error={editErrors.firstName}
                />

                <EditField
                  label="Middle Name"
                  name="middleName"
                  value={editForm.middleName}
                  onChange={handleEditChange}
                  helper="Optional"
                />

                <EditField
                  label="Last Name"
                  name="lastName"
                  required
                  value={editForm.lastName}
                  onChange={handleEditChange}
                  error={editErrors.lastName}
                />

                <EditField
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={editForm.email}
                  onChange={handleEditChange}
                  error={editErrors.email}
                  helper="This also updates the login email."
                />
              </DetailSection>

              <DetailSection icon={Shield} title="Department Information">
                <EditField
                  label="Employee ID"
                  name="employeeId"
                  required
                  value={editForm.employeeId}
                  onChange={handleEditChange}
                  error={editErrors.employeeId}
                />

                <EditField
                  label="Department"
                  name="department"
                  required
                  value={editForm.department}
                  onChange={handleEditChange}
                  error={editErrors.department}
                />

                <EditField
                  label="Position"
                  name="position"
                  required
                  value={editForm.position}
                  onChange={handleEditChange}
                  error={editErrors.position}
                />

                {showProgramColumn ? (
                  <>
                    <EditField
                      label="School Program"
                      name="schoolProgram"
                      value={editForm.schoolProgram}
                      onChange={handleEditChange}
                      helper="Optional"
                    />

                    <EditField
                      label="Academic Program"
                      name="program"
                      value={editForm.program}
                      onChange={handleEditChange}
                      helper="Optional"
                    />
                  </>
                ) : null}
              </DetailSection>

              <DetailSection icon={KeyRound} title="Reset Login Password">
                <PasswordField
                  label="New Password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  showPassword={showEditPassword}
                  onToggle={() => setShowEditPassword((prev) => !prev)}
                  error={editErrors.password}
                  helper="Optional. Minimum of 6 characters if provided."
                />

                <PasswordField
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={editForm.confirmPassword}
                  onChange={handleEditChange}
                  showPassword={showEditPassword}
                  onToggle={() => setShowEditPassword((prev) => !prev)}
                  error={editErrors.confirmPassword}
                  helper="Required only when changing the password."
                />
              </DetailSection>
            </div>
          ) : null}

          <DialogFooter className="border-t border-border px-5 py-3">
            <Button type="button" variant="outline" onClick={closeEditDialog} disabled={actionLoading}>
              Cancel
            </Button>

            <Button
              type="button"
              disabled={actionLoading}
              onClick={updateAdminProfile}
              className="gap-1.5 bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {normalizeStatus(statusTarget?.status) === "active" ? "Deactivate account?" : "Activate account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {normalizeStatus(statusTarget?.status) === "active"
                ? "This account will no longer be able to login until it is activated again."
                : "This account will be allowed to login again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(event) => {
                event.preventDefault();
                updateAdminStatus(statusTarget);
              }}
              className={
                normalizeStatus(statusTarget?.status) === "active"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }
            >
              {actionLoading ? "Processing..." : normalizeStatus(statusTarget?.status) === "active" ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the administrator profile and linked login account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(event) => {
                event.preventDefault();
                deleteAdmin(deleteTarget);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
