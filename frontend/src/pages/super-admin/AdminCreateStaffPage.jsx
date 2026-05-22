import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageTitle from "@/components/PageTitle";

import { toast } from "sonner";
import { Input as ShadInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Building2,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

const BB = "#3D398C";
const API_BASE_URL = "http://127.0.0.1:8000/api";
const VALIDATION_DEBOUNCE_MS = 700;

const EDITABLE_INPUT_CLASS =
  "h-9 border border-slate-300 !bg-white text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-[#3D398C]/60 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20";

const READONLY_INPUT_CLASS =
  "h-9 border border-slate-200 !bg-slate-100 text-sm text-slate-500 shadow-none cursor-not-allowed placeholder:text-slate-400";

/* =========================
   INPUT SANITATION HELPERS
========================= */

function sanitizeEmailInput(v) {
  return String(v || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmailFormat(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeNameTyping(v) {
  return String(v || "").replace(/[^A-Za-z.\-'\s]/g, "");
}

function normalizeSpaces(v) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCaseName(v) {
  const s = normalizeSpaces(v);
  if (!s) return "";

  return s
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part
            .split("'")
            .map((p) => {
              if (!p) return p;
              const lower = p.toLowerCase();
              return lower.charAt(0).toUpperCase() + lower.slice(1);
            })
            .join("'")
        )
        .join("-")
    )
    .join(" ");
}

function sanitizeEmployeeIdInput(v) {
  return String(v || "")
    .replace(/[^\d-]/g, "")
    .replace(/-+/g, "-")
    .replace(/(.*?)-(.*)-+/g, "$1-$2");
}

function normalizeEmployeeId(v) {
  return sanitizeEmployeeIdInput(v).trim();
}

function isValidEmployeeIdFormat(v) {
  return /^\d{2}-\d{4,6}$/.test(normalizeEmployeeId(v));
}

function looksLikeEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
}

function buildFullName(firstName, middleName, lastName) {
  return [firstName, middleName, lastName].filter(Boolean).join(" ");
}

function formatProgramDisplay(fullName, code) {
  const cleanName = normalizeSpaces(fullName);
  const cleanCode = normalizeSpaces(code);

  if (cleanName && cleanCode) return `${cleanName} (${cleanCode})`;
  return cleanName || cleanCode || "";
}

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

/* =========================
   API HELPERS
========================= */

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

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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
        scope: "staff_management",
        target_table: metadata.target_table || "accounts_table",
        target_id: metadata.target_id ? String(metadata.target_id) : "",
        metadata,
      }),
    });
  } catch {
    // Audit should not block account creation.
  }
}

function getRoleConfig(roleLabel) {
  const normalizedRole = String(roleLabel || "").trim().toLowerCase();

  if (
    normalizedRole === "alumni officer" ||
    normalizedRole === "alumni affairs officer"
  ) {
    return {
      role: "alumni-officer",
      endpoint: "/alumni-officers/",
    };
  }

  if (normalizedRole === "ailpo") {
    return {
      role: "ailpo",
      endpoint: "/ailpo/",
    };
  }

  if (normalizedRole === "registrar") {
    return {
      role: "registrar",
      endpoint: "/registrars/",
    };
  }

  return {
    role: "faculty",
    endpoint: "/faculty/",
  };
}

async function checkEmailAvailability(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      exists: false,
      normalizedEmail,
      message: "",
      firstMatch: null,
      matches: [],
    };
  }

  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      exists: false,
      normalizedEmail,
      message: "Invalid email format.",
      firstMatch: null,
      matches: [],
    };
  }

  const endpoints = [
    { url: "/accounts/", label: "Accounts", emailField: "email" },
    { url: "/alumni-officers/", label: "Alumni Officers", emailField: "email" },
    { url: "/ailpo/", label: "AILPO", emailField: "email" },
    { url: "/registrars/", label: "Registrars", emailField: "email" },
    { url: "/faculty/", label: "Faculty", emailField: "email" },
  ];

  const matches = [];

  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint.url}`);
        if (!response.ok) return;

        const data = await response.json();
        const list = normalizeListResponse(data);
        const found = list.find(
          (item) =>
            normalizeEmail(item?.[endpoint.emailField]) === normalizedEmail
        );

        if (found) {
          matches.push({
            collectionName: endpoint.url,
            label: endpoint.label,
            field: endpoint.emailField,
            value: normalizedEmail,
            docId: found.id,
          });
        }
      } catch (error) {
        console.warn("[Email availability endpoint skipped]", {
          endpoint: endpoint.url,
          error,
        });
      }
    })
  );

  const firstMatch = matches[0] || null;

  return {
    exists: matches.length > 0,
    normalizedEmail,
    message: firstMatch ? "This email is already used." : "Email is available.",
    firstMatch,
    matches,
  };
}

async function checkEmployeeIdAvailability(employeeId) {
  const normalized = normalizeEmployeeId(employeeId);

  if (!normalized) {
    return {
      exists: false,
      message: "",
    };
  }

  const endpoints = ["/alumni-officers/", "/ailpo/", "/registrars/", "/faculty/"];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) continue;

      const data = await response.json();
      const list = normalizeListResponse(data);
      const found = list.find(
        (item) => normalizeEmployeeId(item?.employee_id) === normalized
      );

      if (found) {
        return {
          exists: true,
          message: "Employee ID already exists.",
        };
      }
    } catch (error) {
      console.warn("[Employee ID availability endpoint skipped]", {
        endpoint,
        error,
      });
    }
  }

  return {
    exists: false,
    message: "Employee ID is available.",
  };
}

async function fetchAcademicProgramOptions() {
  const [schoolResponse, programResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/school-programs/`),
    fetch(`${API_BASE_URL}/academic-programs/`),
  ]);

  if (!schoolResponse.ok) {
    throw new Error("Failed to load school programs.");
  }

  if (!programResponse.ok) {
    throw new Error("Failed to load academic programs.");
  }

  const schoolData = await schoolResponse.json();
  const programData = await programResponse.json();

  const schools = normalizeListResponse(schoolData);
  const programs = normalizeListResponse(programData);

  return schools.map((school) => {
    const schoolId = String(school.id);

    const nestedPrograms = programs
      .filter((program) => {
        const rawSchoolProgram =
          program.school_program ||
          program.schoolProgram ||
          program.school_program_id ||
          program.schoolProgramId ||
          "";

        if (typeof rawSchoolProgram === "object") {
          return String(rawSchoolProgram.id) === schoolId;
        }

        return String(rawSchoolProgram) === schoolId;
      })
      .map((program) => ({
        id: String(program.id),
        fullName: program.full_name || program.fullName || "",
        code: program.code || "",
      }));

    return {
      id: schoolId,
      fullName: school.full_name || school.fullName || "",
      code: school.code || "",
      academicPrograms: nestedPrograms,
    };
  });
}

async function createStaffAccountAndProfile({
  cleaned,
  roleLabel,
  defaultDepartment,
}) {
  const config = getRoleConfig(roleLabel);

  const accountResponse = await apiRequest("/accounts/register/", {
    method: "POST",
    body: JSON.stringify({
      email: cleaned.officialEmail,
      password: cleaned.password,
      role: config.role,
      status: "active",
    }),
  });

  const accountId = accountResponse?.account?.id;

  if (!accountId) {
    throw new Error("Account was created but no account ID was returned.");
  }

  const profilePayload = {
    account: accountId,
    employee_id: cleaned.employeeId,
    first_name: cleaned.firstName,
    middle_name: cleaned.middleName || "",
    last_name: cleaned.lastName,
    department: cleaned.department || defaultDepartment || roleLabel,
    position: cleaned.departmentTitle || roleLabel,
    email: cleaned.officialEmail,
    role: config.role,
    status: "active",
  };

  if (config.role === "faculty") {
    profilePayload.school_program = cleaned.schoolProgram;
    profilePayload.school_program_code = cleaned.schoolProgramCode;
    profilePayload.program = cleaned.program;
    profilePayload.program_code = cleaned.programCode;
  }

  const profile = await apiRequest(config.endpoint, {
    method: "POST",
    body: JSON.stringify(profilePayload),
  });

  await logSystemAudit(
    "CREATE_STAFF",
    `Created ${roleLabel} account for ${cleaned.officialEmail}.`,
    {
      target_table: "accounts_table",
      target_id: accountId,
      account_id: accountId,
      profile_id: profile?.id,
      role: config.role,
      email: cleaned.officialEmail,
      employee_id: cleaned.employeeId,
      school_program: cleaned.schoolProgram || "",
      school_program_code: cleaned.schoolProgramCode || "",
      program: cleaned.program || "",
      program_code: cleaned.programCode || "",
    }
  );

  return {
    account: accountResponse?.account,
    profile,
  };
}

/* =========================
   FORM FIELD COMPONENTS
========================= */

function FormField({
  label,
  required,
  helper,
  error,
  checking,
  successMessage,
  readOnly,
  ...props
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>

      <ShadInput
        {...props}
        readOnly={readOnly}
        className={[
          readOnly ? READONLY_INPUT_CLASS : EDITABLE_INPUT_CLASS,
          error
            ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
            : "",
          successMessage && !error
            ? "border-emerald-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-200"
            : "",
        ].join(" ")}
      />

      <div className="min-h-[14px]">
        {error ? (
          <span className="text-[11px] font-medium text-destructive">
            {error}
          </span>
        ) : checking ? (
          <span className="text-[11px] font-medium text-[#3D398C]">
            Checking availability...
          </span>
        ) : successMessage ? (
          <span className="text-[11px] font-medium text-emerald-600">
            {successMessage}
          </span>
        ) : helper ? (
          <span className="text-[11px] text-muted-foreground">{helper}</span>
        ) : null}
      </div>
    </div>
  );
}

function FormSelect({
  label,
  required,
  helper,
  error,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  disabled,
  name,
}) {
  return (
    <div className="grid gap-1.5 w-full min-w-0">
      <Label className="text-xs font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>

      <Select
        value={value || undefined}
        onValueChange={(val) => {
          const syntheticEvent = { target: { name, value: val } };
          onChange(syntheticEvent);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={[
            "h-9 w-full min-w-0 border border-slate-300 !bg-white text-sm text-slate-900 shadow-sm transition-colors",
            "[&>span]:text-slate-900 data-[placeholder]:[&>span]:text-slate-500",
            disabled
              ? "cursor-not-allowed !bg-slate-100 text-slate-500 shadow-none opacity-70"
              : "cursor-pointer hover:border-[#3D398C]/60 focus:border-[#3D398C] focus:ring-[#3D398C]/20",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/30"
              : "",
          ].join(" ")}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={4}
          className="z-[9999] max-h-60 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-lg"
        >
          {options.map((option, index) => {
            const optionValue =
              typeof option === "string" ? option : option.value || "";
            const optionLabel =
              typeof option === "string"
                ? option
                : option.label || option.value;

            return (
              <SelectItem
                key={`${optionValue}-${index}`}
                value={optionValue}
                className="cursor-pointer bg-white text-sm text-slate-900 focus:bg-[#3D398C]/10 focus:text-[#3D398C] data-[highlighted]:bg-[#3D398C]/10 data-[highlighted]:text-[#3D398C]"
              >
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

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

function PreviewField({ label, value }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="min-h-[44px] rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-medium text-foreground">
        {normalizeSpaces(value) || (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

/* =========================
   CONFIRMATION MODAL
========================= */

function ConfirmationModal({
  open,
  saving,
  titleText,
  onClose,
  onConfirm,
  invite,
  showProgram,
  showSchoolProgram,
  showDepartmentTitle,
  departmentTitleLabel,
}) {
  if (!invite) return null;

  const fullName = buildFullName(
    invite.firstName,
    invite.middleName,
    invite.lastName
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-3xl p-0 gap-0">
        <div className="border-b border-border px-6 py-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <Eye className="h-4 w-4 text-[#3D398C]" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {titleText}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Review the account details before creating this staff account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-border bg-muted/20 p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-sm font-semibold text-foreground">
                Account Preview
              </span>
              <Badge
                variant="secondary"
                className="bg-[#3D398C]/10 text-[#3D398C] text-[11px] font-semibold"
              >
                Ready to Create
              </Badge>
            </div>

            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              <PreviewField label="Department" value={invite.department} />

              {showDepartmentTitle ? (
                <PreviewField
                  label={departmentTitleLabel}
                  value={invite.departmentTitle}
                />
              ) : null}

              {showSchoolProgram ? (
                <PreviewField
                  label="School Program"
                  value={formatProgramDisplay(
                    invite.schoolProgram,
                    invite.schoolProgramCode
                  )}
                />
              ) : null}

              {showProgram ? (
                <PreviewField
                  label="Academic Program"
                  value={formatProgramDisplay(
                    invite.program,
                    invite.programCode
                  )}
                />
              ) : null}

              <PreviewField label="Employee ID" value={invite.employeeId} />
              <PreviewField
                label="Official Email"
                value={invite.officialEmail}
              />
              <PreviewField label="Full Name" value={fullName} />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            The official email and login password entered in this form will be
            used by the staff member to access their assigned dashboard.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Please confirm that all details are correct.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={saving}
              style={{ backgroundColor: BB }}
              className="gap-1.5 text-white hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirm & Create
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   MAIN COMPONENT
========================= */

export default function AdminCreateStaffPage({
  title,
  roleLabel,
  defaultDepartment,
  successRedirect = "/admin",
  backPath = "/admin",
  showProgramField = false,
  showSchoolProgramField = false,
  defaultProgram = "",
  defaultSchoolProgram = "",
  requireNuDomain = false,
  showDepartmentTitleField = false,
  departmentTitleLabel = "Department Title",
  departmentTitleOptions = [],
  defaultDepartmentTitle = "",
}) {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touched, setTouched] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [checkingUnique, setCheckingUnique] = useState({
    officialEmail: false,
    employeeId: false,
  });

  const [availabilityMessage, setAvailabilityMessage] = useState({
    officialEmail: "",
    employeeId: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    departmentTitle: "",
    schoolProgram: "",
    program: "",
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    officialEmail: "",
    password: "",
    confirmPassword: "",
  });

  const [schoolProgramOptions, setSchoolProgramOptions] = useState([]);
  const [loadingAcademicPrograms, setLoadingAcademicPrograms] = useState(false);

  const emailValidationRequestRef = useRef(0);
  const employeeIdValidationRequestRef = useRef(0);
  const academicProgramsLoadedRef = useRef(false);

  const [form, setForm] = useState({
    department: defaultDepartment || "",
    departmentTitle: defaultDepartmentTitle || "",
    schoolProgram: defaultSchoolProgram || "",
    schoolProgramCode: "",
    program: defaultProgram || "",
    programCode: "",
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    officialEmail: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAcademicPrograms() {
      if (!showProgramField || !showSchoolProgramField) return;
      if (academicProgramsLoadedRef.current) return;

      try {
        setLoadingAcademicPrograms(true);
        const options = await fetchAcademicProgramOptions();

        if (!isMounted) return;

        setSchoolProgramOptions(options);
        academicProgramsLoadedRef.current = true;
      } catch (err) {
        console.error("[School/Academic programs load failed]", err);

        if (!isMounted) return;
        setSchoolProgramOptions([]);

        toast.error("Failed to load school programs", {
          description:
            err?.message ||
            "Please check if /api/school-programs/ and /api/academic-programs/ are working.",
        });
      } finally {
        if (isMounted) {
          setLoadingAcademicPrograms(false);
        }
      }
    }

    loadAcademicPrograms();

    return () => {
      isMounted = false;
    };
  }, [showProgramField, showSchoolProgramField]);

  const selectedSchoolProgramEntry = useMemo(() => {
    return schoolProgramOptions.find(
      (item) => item.fullName === normalizeSpaces(form.schoolProgram)
    );
  }, [schoolProgramOptions, form.schoolProgram]);

  const academicProgramOptions = useMemo(() => {
    if (!selectedSchoolProgramEntry) return [];

    return selectedSchoolProgramEntry.academicPrograms.map((program) => ({
      value: program.id,
      label: formatProgramDisplay(program.fullName, program.code),
      fullName: program.fullName,
      code: program.code,
    }));
  }, [selectedSchoolProgramEntry]);

  function getFieldError(fieldName, value) {
    if (fieldName === "department") return "";

    if (fieldName === "departmentTitle") {
      if (!showDepartmentTitleField) return "";
      const departmentTitle = normalizeSpaces(value);
      if (!departmentTitle) return `${departmentTitleLabel} is required.`;
      return "";
    }

    if (fieldName === "schoolProgram") {
      if (!showProgramField || !showSchoolProgramField) return "";
      const schoolProgram = normalizeSpaces(value);
      if (!schoolProgram) return "School Program is required.";
      return "";
    }

    if (fieldName === "program") {
      if (!showProgramField) return "";
      const program = normalizeSpaces(value);
      if (!program) return "Academic Program is required.";
      return "";
    }

    if (fieldName === "employeeId") {
      const employeeId = normalizeEmployeeId(value);

      if (!employeeId) return "Employee ID is required.";
      if (!/^\d{0,2}(-?\d*)?$/.test(employeeId)) {
        return "Invalid Employee ID format.";
      }
      if (!isValidEmployeeIdFormat(employeeId)) {
        return "Invalid Employee ID format.";
      }

      return "";
    }

    if (fieldName === "firstName") {
      const firstName = normalizeSpaces(value);
      if (!firstName) return "First name is required.";
      if (firstName.length < 2) return "First name is too short.";
      return "";
    }

    if (fieldName === "middleName") {
      const middleName = normalizeSpaces(value);
      if (!middleName) return "";
      if (middleName.length < 2) return "Middle name is too short.";
      return "";
    }

    if (fieldName === "lastName") {
      const lastName = normalizeSpaces(value);
      if (!lastName) return "Last name is required.";
      if (lastName.length < 2) return "Last name is too short.";
      return "";
    }

    if (fieldName === "officialEmail") {
      const officialEmail = sanitizeEmailInput(value);
      if (!officialEmail) return "Official email is required.";
      if (!looksLikeEmail(officialEmail)) {
        return "Please enter a valid official email address.";
      }
      if (requireNuDomain && !officialEmail.endsWith("@national-u.edu.ph")) {
        return "Official email must use @national-u.edu.ph.";
      }
      return "";
    }

    if (fieldName === "password") {
      const password = String(value || "");
      if (!password) return "Password is required.";
      if (password.length < 6) return "Password must be at least 6 characters.";
      return "";
    }

    if (fieldName === "confirmPassword") {
      const confirmPassword = String(value || "");
      if (!confirmPassword) return "Confirm password is required.";
      if (confirmPassword !== form.password) return "Passwords do not match.";
      return "";
    }

    return "";
  }

  useEffect(() => {
    setFieldErrors((prev) => ({
      ...prev,
      departmentTitle: getFieldError("departmentTitle", form.departmentTitle),
      schoolProgram: getFieldError("schoolProgram", form.schoolProgram),
      program: getFieldError("program", form.program),
      employeeId: getFieldError("employeeId", form.employeeId),
      firstName: getFieldError("firstName", form.firstName),
      middleName: getFieldError("middleName", form.middleName),
      lastName: getFieldError("lastName", form.lastName),
      password: getFieldError("password", form.password),
      confirmPassword: getFieldError("confirmPassword", form.confirmPassword),
    }));
  }, [
    form.departmentTitle,
    form.schoolProgram,
    form.program,
    form.employeeId,
    form.firstName,
    form.middleName,
    form.lastName,
    form.password,
    form.confirmPassword,
    showDepartmentTitleField,
    showSchoolProgramField,
    showProgramField,
    departmentTitleLabel,
  ]);

  useEffect(() => {
    const employeeId = normalizeEmployeeId(form.employeeId);
    const requestId = ++employeeIdValidationRequestRef.current;
    const formatError = getFieldError("employeeId", employeeId);

    if (!employeeId) {
      setCheckingUnique((prev) => ({ ...prev, employeeId: false }));
      setAvailabilityMessage((prev) => ({ ...prev, employeeId: "" }));
      return;
    }

    if (formatError) {
      setCheckingUnique((prev) => ({ ...prev, employeeId: false }));
      setAvailabilityMessage((prev) => ({ ...prev, employeeId: "" }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingUnique((prev) => ({ ...prev, employeeId: true }));

        const result = await checkEmployeeIdAvailability(employeeId);

        if (employeeIdValidationRequestRef.current !== requestId) return;

        setFieldErrors((prev) => ({
          ...prev,
          employeeId: result.exists ? result.message : "",
        }));

        setAvailabilityMessage((prev) => ({
          ...prev,
          employeeId: result.exists ? "" : result.message,
        }));
      } catch {
        if (employeeIdValidationRequestRef.current !== requestId) return;

        setFieldErrors((prev) => ({
          ...prev,
          employeeId: "Unable to validate Employee ID right now.",
        }));

        setAvailabilityMessage((prev) => ({
          ...prev,
          employeeId: "",
        }));
      } finally {
        if (employeeIdValidationRequestRef.current === requestId) {
          setCheckingUnique((prev) => ({ ...prev, employeeId: false }));
        }
      }
    }, VALIDATION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [form.employeeId]);

  useEffect(() => {
    const officialEmail = normalizeEmail(form.officialEmail);
    const requestId = ++emailValidationRequestRef.current;

    if (!officialEmail) {
      setFieldErrors((prev) => ({ ...prev, officialEmail: "" }));
      setCheckingUnique((prev) => ({ ...prev, officialEmail: false }));
      setAvailabilityMessage((prev) => ({ ...prev, officialEmail: "" }));
      return;
    }

    if (!isValidEmailFormat(officialEmail)) {
      setFieldErrors((prev) => ({
        ...prev,
        officialEmail: "Please enter a valid email address.",
      }));
      setCheckingUnique((prev) => ({ ...prev, officialEmail: false }));
      setAvailabilityMessage((prev) => ({ ...prev, officialEmail: "" }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingUnique((prev) => ({ ...prev, officialEmail: true }));

        const result = await checkEmailAvailability(officialEmail);

        if (emailValidationRequestRef.current !== requestId) return;

        setFieldErrors((prev) => ({
          ...prev,
          officialEmail: result.exists ? result.message : "",
        }));

        setAvailabilityMessage((prev) => ({
          ...prev,
          officialEmail: result.exists ? "" : "Email is available.",
        }));
      } catch {
        if (emailValidationRequestRef.current !== requestId) return;

        setFieldErrors((prev) => ({
          ...prev,
          officialEmail: "Unable to validate email right now.",
        }));
        setAvailabilityMessage((prev) => ({ ...prev, officialEmail: "" }));
      } finally {
        if (emailValidationRequestRef.current === requestId) {
          setCheckingUnique((prev) => ({ ...prev, officialEmail: false }));
        }
      }
    }, VALIDATION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [form.officialEmail]);

  const formHasErrors =
    !!fieldErrors.departmentTitle ||
    !!fieldErrors.schoolProgram ||
    !!fieldErrors.program ||
    !!fieldErrors.employeeId ||
    !!fieldErrors.firstName ||
    !!fieldErrors.middleName ||
    !!fieldErrors.lastName ||
    !!fieldErrors.officialEmail ||
    !!fieldErrors.password ||
    !!fieldErrors.confirmPassword ||
    checkingUnique.officialEmail ||
    checkingUnique.employeeId;

  function onChange(e) {
    const { name, value } = e.target;
    let next = value;

    if (name === "officialEmail") next = sanitizeEmailInput(value);
    if (name === "employeeId") next = sanitizeEmployeeIdInput(value);
    if (name === "firstName" || name === "middleName" || name === "lastName") {
      next = sanitizeNameTyping(value);
    }

    if (
      name === "department" ||
      name === "program" ||
      name === "departmentTitle" ||
      name === "schoolProgram" ||
      name === "password" ||
      name === "confirmPassword"
    ) {
      next = String(value || "");
    }

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (name === "schoolProgram") {
      const selectedSchool = schoolProgramOptions.find(
        (item) => item.id === next
      );

      setForm((prev) => ({
        ...prev,
        schoolProgram: selectedSchool?.fullName || "",
        schoolProgramCode: selectedSchool?.code || "",
        program: "",
        programCode: "",
      }));

      setTouched((prev) => ({
        ...prev,
        schoolProgram: true,
        program: false,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        program: "",
      }));

      return;
    }

    if (name === "program") {
      const selectedProgram = academicProgramOptions.find(
        (item) => item.value === next
      );

      setForm((prev) => ({
        ...prev,
        program: selectedProgram?.fullName || "",
        programCode: selectedProgram?.code || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: next,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  }

  function onBlur(e) {
    const { name } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (name === "firstName" || name === "middleName" || name === "lastName") {
      setForm((prev) => ({
        ...prev,
        [name]: toTitleCaseName(prev[name]),
      }));
    }

    if (
      name === "department" ||
      name === "program" ||
      name === "departmentTitle" ||
      name === "schoolProgram"
    ) {
      setForm((prev) => ({
        ...prev,
        [name]: normalizeSpaces(prev[name]),
      }));
    }

    if (name === "officialEmail") {
      setForm((prev) => ({
        ...prev,
        [name]: sanitizeEmailInput(prev[name]),
      }));
    }

    if (name === "employeeId") {
      setForm((prev) => ({
        ...prev,
        [name]: normalizeEmployeeId(prev[name]),
      }));
    }
  }

  async function validateOrThrow() {
    const department = normalizeSpaces(form.department);
    const departmentTitle = normalizeSpaces(form.departmentTitle);
    const schoolProgram = normalizeSpaces(form.schoolProgram);
    const schoolProgramCode = normalizeSpaces(form.schoolProgramCode);
    const program = normalizeSpaces(form.program);
    const programCode = normalizeSpaces(form.programCode);
    const employeeId = normalizeEmployeeId(form.employeeId);
    const firstName = toTitleCaseName(form.firstName);
    const middleName = toTitleCaseName(form.middleName);
    const lastName = toTitleCaseName(form.lastName);
    const officialEmail = sanitizeEmailInput(form.officialEmail);
    const password = String(form.password || "");
    const confirmPassword = String(form.confirmPassword || "");

    const cleaned = {
      department,
      departmentTitle,
      schoolProgram,
      schoolProgramCode,
      program,
      programCode,
      employeeId,
      firstName,
      middleName,
      lastName,
      officialEmail,
      password,
      confirmPassword,
    };

    const nextErrors = {
      departmentTitle: getFieldError(
        "departmentTitle",
        cleaned.departmentTitle
      ),
      schoolProgram: getFieldError("schoolProgram", cleaned.schoolProgram),
      program: getFieldError("program", cleaned.program),
      employeeId: getFieldError("employeeId", cleaned.employeeId),
      firstName: getFieldError("firstName", cleaned.firstName),
      middleName: getFieldError("middleName", cleaned.middleName),
      lastName: getFieldError("lastName", cleaned.lastName),
      officialEmail: getFieldError("officialEmail", cleaned.officialEmail),
      password: getFieldError("password", cleaned.password),
      confirmPassword: getFieldError(
        "confirmPassword",
        cleaned.confirmPassword
      ),
    };

    setFieldErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    if (showDepartmentTitleField && nextErrors.departmentTitle) {
      throw new Error(nextErrors.departmentTitle);
    }
    if (showSchoolProgramField && nextErrors.schoolProgram) {
      throw new Error(nextErrors.schoolProgram);
    }
    if (showProgramField && nextErrors.program) {
      throw new Error(nextErrors.program);
    }
    if (nextErrors.employeeId) throw new Error(nextErrors.employeeId);
    if (nextErrors.firstName) throw new Error(nextErrors.firstName);
    if (nextErrors.middleName) throw new Error(nextErrors.middleName);
    if (nextErrors.lastName) throw new Error(nextErrors.lastName);
    if (nextErrors.officialEmail) throw new Error(nextErrors.officialEmail);
    if (nextErrors.password) throw new Error(nextErrors.password);
    if (nextErrors.confirmPassword) throw new Error(nextErrors.confirmPassword);

    setCheckingUnique((prev) => ({
      ...prev,
      employeeId: true,
      officialEmail: true,
    }));

    try {
      const [employeeResult, emailResult] = await Promise.all([
        checkEmployeeIdAvailability(cleaned.employeeId),
        checkEmailAvailability(cleaned.officialEmail),
      ]);

      if (employeeResult.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          employeeId: employeeResult.message,
        }));

        setAvailabilityMessage((prev) => ({
          ...prev,
          employeeId: "",
        }));

        throw new Error(employeeResult.message);
      }

      if (emailResult.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          officialEmail: emailResult.message,
        }));

        setAvailabilityMessage((prev) => ({
          ...prev,
          officialEmail: "",
        }));

        throw new Error(emailResult.message);
      }

      setFieldErrors((prev) => ({
        ...prev,
        employeeId: "",
        officialEmail: "",
      }));

      setAvailabilityMessage((prev) => ({
        ...prev,
        employeeId: "Employee ID is available.",
        officialEmail: "Email is available.",
      }));
    } finally {
      setCheckingUnique((prev) => ({
        ...prev,
        employeeId: false,
        officialEmail: false,
      }));
    }

    return cleaned;
  }

  async function createStaffAccount() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const freshCleaned = await validateOrThrow();

      setForm((prev) => ({
        ...prev,
        department: freshCleaned.department,
        departmentTitle: freshCleaned.departmentTitle,
        schoolProgram: freshCleaned.schoolProgram,
        schoolProgramCode: freshCleaned.schoolProgramCode,
        program: freshCleaned.program,
        programCode: freshCleaned.programCode,
        employeeId: freshCleaned.employeeId,
        firstName: freshCleaned.firstName,
        middleName: freshCleaned.middleName,
        lastName: freshCleaned.lastName,
        officialEmail: freshCleaned.officialEmail,
      }));

      await createStaffAccountAndProfile({
        cleaned: freshCleaned,
        roleLabel,
        defaultDepartment,
      });

      setSuccess("Staff account created successfully.");
      toast.success(`${roleLabel} account created`, {
        description: `${freshCleaned.officialEmail} can now login using the password you entered.`,
      });

      setConfirmOpen(false);
      setPendingInvite(null);
      navigate(successRedirect);
    } catch (err) {
      const msg =
        err?.message || err?.details || "Failed to create staff account.";

      setError(msg);
      toast.error("Failed to create account", { description: msg });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    setTouched({
      departmentTitle: true,
      schoolProgram: true,
      program: true,
      employeeId: true,
      firstName: true,
      middleName: true,
      lastName: true,
      officialEmail: true,
      password: true,
      confirmPassword: true,
    });

    try {
      const cleaned = await validateOrThrow();

      setForm((prev) => ({
        ...prev,
        department: cleaned.department,
        departmentTitle: cleaned.departmentTitle,
        schoolProgram: cleaned.schoolProgram,
        schoolProgramCode: cleaned.schoolProgramCode,
        program: cleaned.program,
        programCode: cleaned.programCode,
        employeeId: cleaned.employeeId,
        firstName: cleaned.firstName,
        middleName: cleaned.middleName,
        lastName: cleaned.lastName,
        officialEmail: cleaned.officialEmail,
      }));

      setPendingInvite(cleaned);
      setConfirmOpen(true);
    } catch (err) {
      const msg = err?.message || "Please check the form and try again.";
      setError(msg);
      toast.error("Validation error", { description: msg });
    }
  }

  function closeConfirmModal() {
    if (saving) return;
    setConfirmOpen(false);
    setPendingInvite(null);
  }

  async function handleConfirmCreate() {
    if (!pendingInvite || saving) return;
    await createStaffAccount();
  }

  const disableSubmit = saving || formHasErrors || loadingAcademicPrograms;

  return (
    <>
      <PageTitle title={`${title} | NUAI`} />

      <ConfirmationModal
        open={confirmOpen}
        saving={saving}
        titleText="Confirm Staff Account"
        onClose={closeConfirmModal}
        onConfirm={handleConfirmCreate}
        invite={pendingInvite}
        showProgram={showProgramField}
        showSchoolProgram={showSchoolProgramField}
        showDepartmentTitle={showDepartmentTitleField}
        departmentTitleLabel={departmentTitleLabel}
      />

      <div className="space-y-5 animate-fadeIn">
        <div className="space-y-3">
          <div className="mb-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(backPath)}
              disabled={saving}
              className="cursor-pointer h-8 gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-[#3D398C]"
            >
              <ArrowLeft className="h-3.5 w-3.5 " />
              BACK
            </Button>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#3D398C]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Create a staff account with login email and password.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-300/50 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white shadow-sm"
        >
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <Building2 className="h-4 w-4 text-[#3D398C]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Staff Information
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Department and identification details
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Department"
                name="department"
                value={form.department}
                readOnly
                helper="Auto-assigned based on role"
              />

              {showDepartmentTitleField && (
                <FormSelect
                  label={departmentTitleLabel}
                  name="departmentTitle"
                  required
                  value={form.departmentTitle}
                  onChange={onChange}
                  options={departmentTitleOptions}
                  placeholder={`Select ${departmentTitleLabel.toLowerCase()}`}
                  error={
                    touched.departmentTitle ? fieldErrors.departmentTitle : ""
                  }
                />
              )}

              {showSchoolProgramField && showProgramField && (
                <FormSelect
                  label="School Program"
                  name="schoolProgram"
                  required
                  value={
                    selectedSchoolProgramEntry
                      ? selectedSchoolProgramEntry.id
                      : undefined
                  }
                  onChange={onChange}
                  options={schoolProgramOptions.map((item) => ({
                    value: item.id,
                    label: formatProgramDisplay(item.fullName, item.code),
                  }))}
                  placeholder={
                    loadingAcademicPrograms
                      ? "Loading school programs..."
                      : "Select school program"
                  }
                  disabled={loadingAcademicPrograms}
                  error={touched.schoolProgram ? fieldErrors.schoolProgram : ""}
                  helper="Uses school program table records"
                />
              )}

              {showProgramField && (
                <FormSelect
                  label="Academic Program"
                  name="program"
                  required
                  value={
                    academicProgramOptions.find(
                      (item) =>
                        item.fullName === form.program &&
                        item.code === form.programCode
                    )?.value || undefined
                  }
                  onChange={onChange}
                  options={academicProgramOptions}
                  placeholder={
                    !form.schoolProgram
                      ? "Choose a school program first"
                      : "Select academic program"
                  }
                  disabled={!form.schoolProgram || loadingAcademicPrograms}
                  error={touched.program ? fieldErrors.program : ""}
                  helper={
                    form.schoolProgram
                      ? academicProgramOptions.length > 0
                        ? "Options depend on selected school program"
                        : "No academic programs found under this school program"
                      : "Choose a school program first"
                  }
                />
              )}

              <FormField
                label="Employee ID"
                name="employeeId"
                required
                placeholder="Enter employee ID"
                value={form.employeeId}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.employeeId ? fieldErrors.employeeId : ""}
                checking={checkingUnique.employeeId}
                successMessage={availabilityMessage.employeeId}
                helper="Format: XX-XXXX to XX-XXXXXX"
              />
            </div>
          </div>

          <div className="border-t border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <UserPlus className="h-4 w-4 text-[#3D398C]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Personal & Contact Information
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Name and official email address
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Official Email"
                name="officialEmail"
                type="email"
                required
                placeholder="Enter official email"
                value={form.officialEmail}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.officialEmail ? fieldErrors.officialEmail : ""}
                checking={checkingUnique.officialEmail}
                successMessage={availabilityMessage.officialEmail}
                helper={
                  requireNuDomain
                    ? "Must use @national-u.edu.ph domain"
                    : "This email will be used for login"
                }
              />

              <FormField
                label="First Name"
                name="firstName"
                required
                placeholder="Enter first name"
                value={form.firstName}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.firstName ? fieldErrors.firstName : ""}
              />

              <FormField
                label="Middle Name"
                name="middleName"
                placeholder="Enter middle name"
                value={form.middleName}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.middleName ? fieldErrors.middleName : ""}
                helper="Optional"
              />

              <FormField
                label="Last Name"
                name="lastName"
                required
                placeholder="Enter last name"
                value={form.lastName}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.lastName ? fieldErrors.lastName : ""}
              />
            </div>
          </div>

          <div className="border-t border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D398C]/10">
                <Lock className="h-4 w-4 text-[#3D398C]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Login Password
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Password used with the official email for login
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>

                <div className="relative">
                  <ShadInput
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={[
                      `${EDITABLE_INPUT_CLASS} pr-9`,
                      touched.password && fieldErrors.password
                        ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
                        : "",
                    ].join(" ")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-[#3D398C]"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="min-h-[14px]">
                  {touched.password && fieldErrors.password ? (
                    <span className="text-[11px] font-medium text-destructive">
                      {fieldErrors.password}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Minimum of 6 characters
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>

                <ShadInput
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  onBlur={onBlur}
                  className={[
                    EDITABLE_INPUT_CLASS,
                    touched.confirmPassword && fieldErrors.confirmPassword
                      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
                      : "",
                  ].join(" ")}
                />

                <div className="min-h-[14px]">
                  {touched.confirmPassword && fieldErrors.confirmPassword ? (
                    <span className="text-[11px] font-medium text-destructive">
                      {fieldErrors.confirmPassword}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Re-enter the password for confirmation
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <p className="text-[11px] text-muted-foreground">
              Fields marked with <span className="text-destructive">*</span> are
              required
            </p>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={disableSubmit}
                style={{ backgroundColor: BB }}
                className="gap-1.5 text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" /> Review & Create
                    Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
