import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, School2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BB = "#3D398C";

function safe(v) {
  return String(v ?? "").trim();
}

function normalizeSpaces(v) {
  return safe(v).replace(/\s+/g, " ");
}

function sanitizeSectionInput(v) {
  return normalizeSpaces(v).toUpperCase();
}

function sanitizeProgramInput(v) {
  return normalizeSpaces(v).toUpperCase();
}

function sanitizeSubjectInput(v) {
  return normalizeSpaces(v).toUpperCase();
}

function sanitizeSchoolProgramInput(v) {
  return normalizeSpaces(v);
}

function validateSubject(value) {
  const sanitized = sanitizeSubjectInput(value);
  if (!sanitized) return "Subject is required.";
  if (sanitized.length < 3) return "Subject must be at least 3 characters.";
  if (sanitized.length > 100) return "Subject must not exceed 100 characters.";
  return "";
}

function validateSection(value) {
  const sanitized = sanitizeSectionInput(value);
  if (!sanitized) return "Section is required.";
  if (sanitized.length < 2) return "Section must be at least 2 characters.";
  if (sanitized.length > 50) return "Section must not exceed 50 characters.";
  return "";
}

function validateProgram(value) {
  const sanitized = sanitizeProgramInput(value);
  if (!sanitized) return "Program is required.";
  if (sanitized.length < 2) return "Program must be at least 2 characters.";
  if (sanitized.length > 120) return "Program must not exceed 120 characters.";
  return "";
}

function validateProgramFullName(value) {
  const sanitized = normalizeSpaces(value);
  if (!sanitized) return "Program Full Name is required.";
  if (sanitized.length < 2) return "Program Full Name must be at least 2 characters.";
  if (sanitized.length > 180) return "Program Full Name must not exceed 180 characters.";
  return "";
}

function validateSchoolProgramCode(value) {
  const sanitized = sanitizeProgramInput(value);
  if (!sanitized) return "School Program Code is required.";
  if (sanitized.length < 2) return "School Program Code must be at least 2 characters.";
  if (sanitized.length > 50) return "School Program Code must not exceed 50 characters.";
  return "";
}

function validateSchoolProgramFullName(value) {
  const sanitized = sanitizeSchoolProgramInput(value);
  if (!sanitized) return "School Program Full Name is required.";
  if (sanitized.length < 2) return "School Program Full Name must be at least 2 characters.";
  if (sanitized.length > 180) return "School Program Full Name must not exceed 180 characters.";
  return "";
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

function getFacultyProgramInfo(row = {}) {
  return {
    schoolProgramCode: safe(row.school_program_code || row.schoolProgramCode),
    schoolProgramFullName: safe(row.school_program || row.schoolProgram),
    program: safe(row.program_code || row.programCode),
    programFullName: safe(row.program || row.academic_program || row.academicProgram),
  };
}

function FieldHint({ error, hint }) {
  return (
    <div className="min-h-[16px]">
      {error ? (
        <span className="text-[11px] font-medium text-destructive">
          {error}
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

export default function AddClass() {
  const navigate = useNavigate();
  const account = getStoredAccount();

  const [form, setForm] = useState({
    subject: "",
    section: "",
    schoolProgramCode: "",
    schoolProgramFullName: "",
    program: "",
    programFullName: "",
  });

  const [touched, setTouched] = useState({
    subject: false,
    section: false,
    schoolProgramCode: false,
    schoolProgramFullName: false,
    program: false,
    programFullName: false,
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFacultyProgramDetails = useCallback(async () => {
    setLoadingProfile(true);
    setError("");

    try {
      if (!account?.email) {
        throw new Error("User session not found. Please sign in again.");
      }

      const data = await apiRequest("/faculty/");
      const list = normalizeListResponse(data);
      const currentEmail = safe(account.email).toLowerCase();

      const match =
        list.find((item) => safe(item.email).toLowerCase() === currentEmail) ||
        list.find((item) => safe(item.account_email).toLowerCase() === currentEmail) ||
        list.find((item) => {
          const itemAccount =
            item.account && typeof item.account === "object"
              ? item.account.id
              : item.account || item.account_id || item.accountId;

          return String(itemAccount || "") === String(account.id || "");
        });

      if (!match) {
        throw new Error("Faculty profile was not found.");
      }

      const resolved = getFacultyProgramInfo(match);

      setForm((prev) => ({
        ...prev,
        schoolProgramCode: resolved.schoolProgramCode || "",
        schoolProgramFullName: resolved.schoolProgramFullName || "",
        program: resolved.program || "",
        programFullName: resolved.programFullName || "",
      }));
    } catch (err) {
      setError(err?.message || "Failed to load your program details.");
    } finally {
      setLoadingProfile(false);
    }
  }, [account?.email, account?.id]);

  useEffect(() => {
    loadFacultyProgramDetails();
  }, [loadFacultyProgramDetails]);

  const fieldErrors = {
    subject: validateSubject(form.subject),
    section: validateSection(form.section),
    schoolProgramCode: validateSchoolProgramCode(form.schoolProgramCode),
    schoolProgramFullName: validateSchoolProgramFullName(form.schoolProgramFullName),
    program: validateProgram(form.program),
    programFullName: validateProgramFullName(form.programFullName),
  };

  const isFormValid =
    !fieldErrors.subject &&
    !fieldErrors.section &&
    !fieldErrors.schoolProgramCode &&
    !fieldErrors.schoolProgramFullName &&
    !fieldErrors.program &&
    !fieldErrors.programFullName;

  function updateField(key, value) {
    let nextValue = value;

    if (key === "subject") nextValue = value.toUpperCase();
    if (key === "section") nextValue = value.toUpperCase();

    setForm((prev) => ({ ...prev, [key]: nextValue }));

    if (error) setError("");
    if (success) setSuccess("");
  }

  function handleBlur(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    setTouched({
      subject: true,
      section: true,
      schoolProgramCode: true,
      schoolProgramFullName: true,
      program: true,
      programFullName: true,
    });

    const payload = {
      subject: sanitizeSubjectInput(form.subject),
      section: sanitizeSectionInput(form.section),
      schoolProgramCode: sanitizeProgramInput(form.schoolProgramCode),
      schoolProgramFullName: sanitizeSchoolProgramInput(form.schoolProgramFullName),
      program: sanitizeProgramInput(form.program),
      programFullName: normalizeSpaces(form.programFullName),
    };

    const submitErrors = {
      subject: validateSubject(payload.subject),
      section: validateSection(payload.section),
      schoolProgramCode: validateSchoolProgramCode(payload.schoolProgramCode),
      schoolProgramFullName: validateSchoolProgramFullName(payload.schoolProgramFullName),
      program: validateProgram(payload.program),
      programFullName: validateProgramFullName(payload.programFullName),
    };

    if (
      submitErrors.subject ||
      submitErrors.section ||
      submitErrors.schoolProgramCode ||
      submitErrors.schoolProgramFullName ||
      submitErrors.program ||
      submitErrors.programFullName
    ) {
      setError("Please correct the highlighted fields before submitting.");
      return;
    }

    if (!account?.email) {
      setError("User session not found. Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/internship-classes/", {
        method: "POST",
        body: JSON.stringify({
          faculty_email: account.email,
          subject: payload.subject,
          section: payload.section,
          school_program_code: payload.schoolProgramCode,
          school_program_full_name: payload.schoolProgramFullName,
          program_code: payload.program,
          program_full_name: payload.programFullName,
          status: "Active",
          students: [],
        }),
      });

      setSuccess("Class created successfully.");
      toast.success("Class created successfully.");
      navigate("/faculty/internships");
    } catch (err) {
      setError(err?.message || "Failed to create class. Please try again.");
      toast.error("Failed to create class", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

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

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Internship Management</span>
          <span>›</span>
          <span>Class Management</span>
          <span>›</span>
          <span className="font-semibold text-foreground">Add Class</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      >
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${BB}10` }}
            >
              <School2 className="h-5 w-5" style={{ color: BB }} />
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">
                Insert Class Information
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Create a new internship class under your assigned program.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5">
          {loadingProfile ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#3D398C]" />
              Loading assigned program details...
            </div>
          ) : null}

          <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                onBlur={() => handleBlur("subject")}
                placeholder="e.g., PRACTICUM 1"
                className={touched.subject && fieldErrors.subject ? "border-destructive" : ""}
              />
              <FieldHint error={touched.subject ? fieldErrors.subject : ""} hint="Enter the internship subject." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Section <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.section}
                onChange={(e) => updateField("section", e.target.value)}
                onBlur={() => handleBlur("section")}
                placeholder="e.g., INF 232"
                className={touched.section && fieldErrors.section ? "border-destructive" : ""}
              />
              <FieldHint error={touched.section ? fieldErrors.section : ""} hint="Enter the class section." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                School Program Code <span className="text-destructive">*</span>
              </Label>
              <Input value={form.schoolProgramCode} readOnly className="bg-muted/50" />
              <FieldHint error={touched.schoolProgramCode ? fieldErrors.schoolProgramCode : ""} hint="Auto-filled from your faculty profile." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                School Program Full Name <span className="text-destructive">*</span>
              </Label>
              <Input value={form.schoolProgramFullName} readOnly className="bg-muted/50" />
              <FieldHint error={touched.schoolProgramFullName ? fieldErrors.schoolProgramFullName : ""} hint="Auto-filled from your faculty profile." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Program Code <span className="text-destructive">*</span>
              </Label>
              <Input value={form.program} readOnly className="bg-muted/50" />
              <FieldHint error={touched.program ? fieldErrors.program : ""} hint="Auto-filled from your faculty profile." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Program Full Name <span className="text-destructive">*</span>
              </Label>
              <Input value={form.programFullName} readOnly className="bg-muted/50" />
              <FieldHint error={touched.programFullName ? fieldErrors.programFullName : ""} hint="Auto-filled from your faculty profile." />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-[11px] text-muted-foreground">
            Confirm before saving changes.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/faculty/internships")}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving || loadingProfile || !isFormValid}
              className="gap-1.5"
              style={{ backgroundColor: BB, color: "white" }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Create Class
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
