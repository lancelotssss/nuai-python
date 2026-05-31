import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import PageTitle from "@/components/PageTitle";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

const BRAND_BLUE = "#3D398C";

function safe(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return safe(value).replace(/\s+/g, "").toLowerCase();
}

function onlyDigits(value, max = 11) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, max);
}

function isValidEmail(value) {
  const clean = normalizeEmail(value);
  if (!clean) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}

function isValidPhone(value) {
  const clean = safe(value);
  if (!clean) return false;
  return /^[0-9]{7,11}$/.test(clean);
}

function getInternContactNumber(row = {}) {
  return safe(
    row.contact_number ||
      row.contactNumber ||
      row.contactInformation?.contactNumber ||
      row.contactInformation?.contact_number ||
      row.contactInformation?.mobileNumber?.[0] ||
      row.contactInformation?.mobileNumber,
  );
}

function getInternPersonalEmail(row = {}) {
  return normalizeEmail(
    row.personal_email ||
      row.personalEmail ||
      row.contactInformation?.personalEmail ||
      row.contactInformation?.personal_email,
  );
}

function getInternName(row = {}) {
  const fullName = safe(row.full_name || row.fullName || row.name);
  if (fullName) return fullName;

  return [row.first_name || row.firstName, row.middle_name || row.middleName, row.last_name || row.lastName]
    .map(safe)
    .filter(Boolean)
    .join(" ");
}

function getStudentId(row = {}) {
  return safe(row.student_id || row.studentId);
}

function getProfileFormFromIntern(internRecord = {}) {
  return {
    personalEmail: getInternPersonalEmail(internRecord),
    mobileNumber: onlyDigits(getInternContactNumber(internRecord)),
  };
}

function buildInitialRequirementSteps() {
  return ["mobileNumber", "personalEmail", "review"];
}

function inputClass(error) {
  return [
    "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400",
    error
      ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-[#D7DEEA] bg-white focus:border-[#3D398C] focus:ring-2 focus:ring-[#3D398C]/10",
  ].join(" ");
}

function disabledButtonClass(isDisabled) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition",
    isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-95",
  ].join(" ");
}

function secondaryButtonClass(isDisabled) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#D7DEEA] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition",
    isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50",
  ].join(" ");
}

function Field({ label, required = false, optional = false, error = "", children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
        {optional ? (
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-slate-500">
            Optional
          </span>
        ) : null}
      </span>

      {children}

      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

function ReviewItem({ label, value, optional = false }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF5] bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {optional ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Optional
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-sm font-semibold text-slate-900">{safe(value) || "Not provided"}</p>
    </div>
  );
}

function getStepMeta(stepKey) {
  switch (stepKey) {
    case "mobileNumber":
      return {
        title: "Add your contact number",
        description: "Please provide your active contact number so the office can reach you when needed.",
        icon: Phone,
      };

    case "personalEmail":
      return {
        title: "Add your personal email",
        description: "Please provide your personal email. This will be saved to your profile without OTP verification.",
        icon: Mail,
      };

    case "review":
      return {
        title: "Review your contact information",
        description: "Please review your contact information before saving. Nothing is saved until you click Save and Finish.",
        icon: CheckCircle2,
      };

    default:
      return {
        title: "Complete your contact information",
        description: "Please complete your required contact information.",
        icon: UserRound,
      };
  }
}

function validateStep(stepKey, form = {}) {
  const errors = {};

  if (stepKey === "mobileNumber") {
    if (!safe(form.mobileNumber)) {
      errors.mobileNumber = "Contact number is required.";
    } else if (!isValidPhone(form.mobileNumber)) {
      errors.mobileNumber = "Enter a valid contact number.";
    }
  }

  if (stepKey === "personalEmail") {
    if (!safe(form.personalEmail)) {
      errors.personalEmail = "Personal email is required.";
    } else if (!isValidEmail(form.personalEmail)) {
      errors.personalEmail = "Enter a valid personal email.";
    }
  }

  return errors;
}

function validateAllRequiredSteps(steps = [], form = {}) {
  const allErrors = {};

  steps.forEach((stepKey) => {
    if (stepKey === "review") return;

    const stepErrors = validateStep(stepKey, form);
    Object.assign(allErrors, stepErrors);
  });

  return allErrors;
}

function getFirstStepWithError(steps = [], errors = {}) {
  if (errors.mobileNumber) return Math.max(steps.indexOf("mobileNumber"), 0);
  if (errors.personalEmail) return Math.max(steps.indexOf("personalEmail"), 0);
  return -1;
}

function normalizeProfileForm(form = {}) {
  return {
    ...form,
    personalEmail: normalizeEmail(form.personalEmail),
    mobileNumber: onlyDigits(form.mobileNumber),
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

export default function RequirementGate({ account, internRecord, onCompleted, onLogout }) {
  const requirementSteps = useMemo(() => buildInitialRequirementSteps(), []);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profileForm, setProfileForm] = useState(() => getProfileFormFromIntern(internRecord));
  const [profileErrors, setProfileErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [requirementError, setRequirementError] = useState("");

  const currentStepKey = requirementSteps[currentStepIndex] || "";
  const currentStepMeta = getStepMeta(currentStepKey);
  const CurrentStepIcon = currentStepMeta.icon;

  const normalizedCurrentForm = useMemo(() => normalizeProfileForm(profileForm), [profileForm]);

  const currentStepErrors = useMemo(() => {
    if (!currentStepKey || currentStepKey === "review") return {};
    return validateStep(currentStepKey, normalizedCurrentForm);
  }, [currentStepKey, normalizedCurrentForm]);

  const allStepErrors = useMemo(
    () => validateAllRequiredSteps(requirementSteps, normalizedCurrentForm),
    [requirementSteps, normalizedCurrentForm],
  );

  const hasCurrentStepErrors = Object.keys(currentStepErrors).length > 0;
  const hasAllStepErrors = Object.keys(allStepErrors).length > 0;

  const totalSteps = requirementSteps.length;
  const displayStepNumber = totalSteps > 0 ? Math.min(currentStepIndex + 1, totalSteps) : 0;

  const isFirstStep = currentStepIndex === 0;
  const isReviewStep = currentStepKey === "review";

  const nextDisabled = savingProfile || !currentStepKey || isReviewStep || hasCurrentStepErrors;
  const finalSaveDisabled = savingProfile || !isReviewStep || hasAllStepErrors;

  function getVisibleError(fieldName) {
    if (profileErrors[fieldName]) return profileErrors[fieldName];
    if (touchedFields[fieldName]) return currentStepErrors[fieldName] || "";
    return "";
  }

  function handleProfileChange(key, value) {
    const nextValue = key === "personalEmail" ? normalizeEmail(value) : value;

    setProfileForm((prev) => ({ ...prev, [key]: nextValue }));
    setProfileErrors((prev) => ({ ...prev, [key]: "" }));
    setRequirementError("");
  }

  function handleFieldBlur(key) {
    setTouchedFields((prev) => ({ ...prev, [key]: true }));
  }

  function markCurrentStepFieldsTouched() {
    if (currentStepKey === "mobileNumber") {
      setTouchedFields((prev) => ({ ...prev, mobileNumber: true }));
    }

    if (currentStepKey === "personalEmail") {
      setTouchedFields((prev) => ({ ...prev, personalEmail: true }));
    }
  }

  function handleBack() {
    if (isFirstStep || savingProfile) return;

    setProfileErrors({});
    setRequirementError("");
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleNext() {
    if (!currentStepKey || isReviewStep || savingProfile) return;

    const normalizedForm = normalizeProfileForm(profileForm);
    const errors = validateStep(currentStepKey, normalizedForm);

    if (Object.keys(errors).length > 0) {
      markCurrentStepFieldsTouched();
      setProfileErrors(errors);
      return;
    }

    setProfileForm(normalizedForm);
    setProfileErrors({});
    setRequirementError("");
    setCurrentStepIndex((prev) => Math.min(prev + 1, requirementSteps.length - 1));
  }

  async function handleFinalSave() {
    if (!internRecord?.id || savingProfile) return;

    const normalizedForm = normalizeProfileForm(profileForm);
    const allErrors = validateAllRequiredSteps(requirementSteps, normalizedForm);

    if (Object.keys(allErrors).length > 0) {
      const firstErrorStepIndex = getFirstStepWithError(requirementSteps, allErrors);

      setTouchedFields({ personalEmail: true, mobileNumber: true });
      setProfileErrors(allErrors);
      setRequirementError("Please complete the highlighted fields first.");

      if (firstErrorStepIndex >= 0) setCurrentStepIndex(firstErrorStepIndex);
      return;
    }

    try {
      setSavingProfile(true);
      setRequirementError("");

      const updatedIntern = await apiRequest(`/interns/${internRecord.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          contact_number: normalizedForm.mobileNumber,
          personal_email: normalizedForm.personalEmail,
        }),
      });

      const nextAccount = {
        ...(account || {}),
        contactNumber: normalizedForm.mobileNumber,
        personalEmail: normalizedForm.personalEmail,
        profileCompleted: true,
      };

      localStorage.setItem("nuai_account", JSON.stringify(nextAccount));
      onCompleted?.(updatedIntern);
    } catch (err) {
      console.error("Failed to save contact requirements:", err);
      setRequirementError(err?.message || "Unable to save your contact information. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <>
      <PageTitle title="Complete Account Requirements | NUAI" />

      <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 font-['Poppins'] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-[28px] border border-[#DCE3F1] bg-white shadow-sm">
            <div className="relative border-b border-[#E6ECF5] bg-gradient-to-br from-[#3D398C] via-[#4A46A3] to-[#625DD1] px-6 py-8 text-white sm:px-8 lg:px-10">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                      Account Requirement
                    </p>

                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                      Complete your contact information
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                      To proceed to the system, please provide your contact number and personal email. No OTP verification is required.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/12 px-4 py-3 text-sm ring-1 ring-white/15">
                  <div>
                    <p className="font-semibold">Step {displayStepNumber} of {totalSteps}</p>
                    <p className="mt-1 text-white/75">{currentStepMeta.title}</p>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-white/80">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#F5DA3E]" />
                    <span>{account?.email || "Intern account"}</span>
                  </div>
                  {getInternName(internRecord) ? (
                    <div className="text-xs text-white/75">
                      {getInternName(internRecord)} · {getStudentId(internRecord) || "No Student ID"}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              {requirementError ? (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{requirementError}</span>
                </div>
              ) : null}

              <div className="space-y-6">
                <div className="rounded-3xl border border-[#E6ECF5] bg-[#F8FAFE] p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                      style={{ backgroundColor: BRAND_BLUE }}
                    >
                      <CurrentStepIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D398C]">
                        Step {displayStepNumber}
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">{currentStepMeta.title}</h2>

                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                        {currentStepMeta.description}
                      </p>
                    </div>
                  </div>
                </div>

                {currentStepKey === "mobileNumber" ? (
                  <div className="max-w-xl">
                    <Field label="Contact Number" required error={getVisibleError("mobileNumber")}>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={profileForm.mobileNumber}
                          onBlur={() => handleFieldBlur("mobileNumber")}
                          onChange={(e) => handleProfileChange("mobileNumber", onlyDigits(e.target.value))}
                          className={`${inputClass(getVisibleError("mobileNumber"))} pl-10`}
                          placeholder="09XXXXXXXXX"
                          inputMode="numeric"
                        />
                      </div>
                    </Field>
                  </div>
                ) : null}

                {currentStepKey === "personalEmail" ? (
                  <div className="max-w-xl space-y-4">
                    <Field label="Personal Email" required error={getVisibleError("personalEmail")}>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={profileForm.personalEmail}
                          onBlur={() => handleFieldBlur("personalEmail")}
                          onChange={(e) => handleProfileChange("personalEmail", e.target.value)}
                          className={`${inputClass(getVisibleError("personalEmail"))} pl-10`}
                          placeholder="your.personal@email.com"
                        />
                      </div>
                    </Field>
                  </div>
                ) : null}

                {currentStepKey === "review" ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Review the information below. You can go back to edit information.
                    </div>

                    {hasAllStepErrors ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        Some information is missing or invalid. Please go back and correct it before saving.
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <ReviewItem label="Contact Number" value={profileForm.mobileNumber} />
                      <ReviewItem label="Personal Email" value={profileForm.personalEmail} />
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      Your personal email will be saved to your profile. Your current login email will not be changed.
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-[#E6ECF5] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={onLogout}
                    disabled={savingProfile}
                    className={secondaryButtonClass(savingProfile)}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {!isFirstStep ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={savingProfile}
                        className={secondaryButtonClass(savingProfile)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    ) : null}

                    {isReviewStep ? (
                      <button
                        type="button"
                        onClick={handleFinalSave}
                        disabled={finalSaveDisabled}
                        className={disabledButtonClass(finalSaveDisabled)}
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        {savingProfile ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save and Finish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={nextDisabled}
                        className={disabledButtonClass(nextDisabled)}
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
