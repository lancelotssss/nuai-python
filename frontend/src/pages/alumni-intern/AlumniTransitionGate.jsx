import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageTitle from "../../components/PageTitle";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import NULogoCapBlue from "../../assets/alumni-login/nuai-logo-blue.png";
import NULogoCapWhite from "../../assets/alumni-login/nuai-logo-white.png";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const BRAND_BLUE = "#3D398C";

function safe(value) {
  return String(value ?? "").trim();
}

function sanitizeEmailInput(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function maskEmail(email) {
  const safeEmail = sanitizeEmailInput(email);
  const [local, domain] = safeEmail.split("@");

  if (!local || !domain) return email || "—";
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;

  return `${local.slice(0, 2)}***@${domain}`;
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

function getFullName(profile = {}) {
  const direct = safe(profile.full_name || profile.fullName || profile.name);

  if (direct) return direct;

  return [
    profile.first_name || profile.firstName,
    profile.middle_name || profile.middleName,
    profile.last_name || profile.lastName,
  ]
    .map(safe)
    .filter(Boolean)
    .join(" ");
}

function getNuEmail(profile = {}, account = {}) {
  return safe(
    profile.nu_email ||
      profile.nuEmail ||
      profile.email ||
      profile.contactInformation?.nuEmail ||
      account?.email ||
      "",
  );
}

function getPersonalEmail(profile = {}) {
  return sanitizeEmailInput(
    profile.personal_email ||
      profile.personalEmail ||
      profile.contactInformation?.personalEmail ||
      "",
  );
}

function getInternId(profile = {}, account = {}) {
  return (
    profile?.id ||
    profile?.intern_id ||
    profile?.internId ||
    profile?.pk ||
    profile?.intern?.id ||
    account?.intern_id ||
    account?.internId ||
    ""
  );
}

function getInternEmail(profile = {}) {
  return sanitizeEmailInput(
    profile.email ||
      profile.nu_email ||
      profile.nuEmail ||
      profile.contactInformation?.nuEmail ||
      "",
  );
}

export default function AlumniTransitionGate({
  intern,
  account,
  onCompleted,
  onBack,
}) {
  const navigate = useNavigate();

  const storedAccount = useMemo(() => getStoredAccount(), []);
  const activeAccount = account || storedAccount || {};

  const [loadedIntern, setLoadedIntern] = useState(intern || null);
  const [loadingIntern, setLoadingIntern] = useState(!intern);

  const profile = loadedIntern || intern || {};
  const internId = getInternId(profile, activeAccount);

  const savedPersonalEmail = useMemo(() => getPersonalEmail(profile), [profile]);
  const namePreview = useMemo(() => getFullName(profile), [profile]);
  const currentNuEmail = useMemo(
    () => getNuEmail(profile, activeAccount),
    [profile, activeAccount],
  );

  const [transitionEmail, setTransitionEmail] = useState(savedPersonalEmail);
  const [emailTouched, setEmailTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const cleanEmail = useMemo(
    () => sanitizeEmailInput(transitionEmail),
    [transitionEmail],
  );

  const changedFromSavedEmail =
    !!savedPersonalEmail && cleanEmail !== savedPersonalEmail;

  const loadInternRecord = useCallback(async () => {
    const loginEmail = sanitizeEmailInput(activeAccount?.email);

    if (loadedIntern && getInternId(loadedIntern, activeAccount)) {
      setLoadingIntern(false);
      return;
    }

    if (!loginEmail) {
      setLoadingIntern(false);
      setError("Login session not found. Please log in again.");
      return;
    }

    setLoadingIntern(true);
    setError("");

    try {
      const data = await apiRequest("/interns/");
      const list = normalizeListResponse(data);

      const match = list.find((item) => getInternEmail(item) === loginEmail);

      if (!match) {
        setError("Intern record not found. Please log in again.");
        return;
      }

      setLoadedIntern(match);
    } catch (err) {
      setError(err?.message || "Unable to load intern transition record.");
    } finally {
      setLoadingIntern(false);
    }
  }, [activeAccount, loadedIntern]);

  useEffect(() => {
    loadInternRecord();
  }, [loadInternRecord]);

  useEffect(() => {
    setLoadedIntern(intern || null);
  }, [intern]);

  useEffect(() => {
    setTransitionEmail(savedPersonalEmail || "");
  }, [savedPersonalEmail]);

  const emailError = useMemo(() => {
    if (!emailTouched) return "";
    if (!cleanEmail) return "Personal email is required.";
    if (!looksLikeEmail(cleanEmail)) return "Please enter a valid email address.";
    if (sanitizeEmailInput(cleanEmail) === sanitizeEmailInput(currentNuEmail)) {
      return "Please use a different email from your NU email.";
    }
    return "";
  }, [emailTouched, cleanEmail, currentNuEmail]);

  const canTransition =
    !!internId &&
    !!cleanEmail &&
    looksLikeEmail(cleanEmail) &&
    sanitizeEmailInput(cleanEmail) !== sanitizeEmailInput(currentNuEmail) &&
    !emailError;

  const transitionMessage = useMemo(() => {
    if (loadingIntern) {
      return "Loading your transition details. Please wait while we verify your intern record.";
    }

    if (savedPersonalEmail) {
      return "Your account has been approved for alumni transition. Please confirm if this is the personal email you are currently using. You may change it before completing the transition.";
    }

    return "Your account has been approved for alumni transition. Please provide the personal email you want to use as your Alumni login email.";
  }, [loadingIntern, savedPersonalEmail]);

  function handleEmailChange(value) {
    setTransitionEmail(sanitizeEmailInput(value));
    setEmailTouched(true);

    if (error) setError("");
    if (status) setStatus("");
  }

  function handleLogoutLocal() {
    localStorage.removeItem("nuai_account");
    navigate("/login", { replace: true });
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      handleLogoutLocal();
    } finally {
      setLoggingOut(false);
      setShowLogoutDialog(false);
    }
  }

  async function handleCompleteTransition(event) {
    event.preventDefault();

    if (loadingIntern || submitting) return;

    setError("");
    setStatus("");
    setEmailTouched(true);

    if (!internId) {
      setError("Intern record not found. Please log in again.");
      return;
    }

    if (!cleanEmail) {
      setError(
        "Personal email is required before completing your alumni transition.",
      );
      return;
    }

    if (!looksLikeEmail(cleanEmail)) {
      setError("Please enter a valid personal email address.");
      return;
    }

    if (sanitizeEmailInput(cleanEmail) === sanitizeEmailInput(currentNuEmail)) {
      setError("Personal email must be different from your NU email.");
      return;
    }

    setSubmitting(true);
    setStatus("Completing your Alumni transition...");

    try {
      const result = await apiRequest("/accounts/complete-alumni-transition/", {
        method: "POST",
        body: JSON.stringify({
          intern_id: internId,
          current_email: sanitizeEmailInput(currentNuEmail),
          personal_email: cleanEmail,
        }),
      });

      setStatus(
        "Your account has successfully transitioned to Alumni. Please log in using your personal email.",
      );

      localStorage.removeItem("nuai_account");

      if (typeof onCompleted === "function") {
        onCompleted(result);
      }

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (err) {
      setError(err?.message || "Unable to complete alumni transition.");
      setStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageTitle title="Complete Alumni Transition | NUAI" />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            className="flex cursor-pointer items-center gap-3"
            onClick={() => navigate("/login", { replace: true })}
          >
            <img
              src={NULogoCapBlue}
              alt="NUAI Logo"
              className="h-10 w-auto object-contain"
            />

            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide text-[#3D398C]">
                NUAI
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Alumni Transition
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowLogoutDialog(true)}
            className="gap-2 border-slate-300 text-[#3D398C] hover:bg-[#3D398C] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="min-h-[calc(100vh-64px)] bg-[#f4f5fb] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[920px] items-center justify-center">
          <Card className="w-full rounded-[32px] border-0 bg-[#3D398C] p-3 shadow-xl">
            <div className="rounded-[28px] bg-[#f8f8fb] px-5 py-8 sm:px-8 sm:py-10 md:px-12">
              <div className="mx-auto max-w-[660px]">
                <div className="mb-8 flex flex-col items-center text-center">
                  <img
                    src={NULogoCapWhite}
                    alt="NUAI Logo"
                    className="mb-3 w-20 object-contain"
                  />

                  <h1 className="text-3xl font-bold tracking-tight text-[#3D398C] sm:text-4xl">
                    Complete Alumni Transition
                  </h1>

                  <p className="mt-3 max-w-xl text-base leading-8 text-[#3D398C]/75">
                    {transitionMessage}
                  </p>
                </div>

                <div className="mb-6 rounded-[24px] border border-[#3D398C]/10 bg-[#eef0f8] px-5 py-4">
                  <p className="text-sm font-bold text-[#3D398C]">
                    Transition account
                  </p>

                  <p className="mt-1 text-xl font-semibold text-[#3D398C]">
                    {loadingIntern
                      ? "Loading intern record..."
                      : namePreview || "Alumni Transition"}
                  </p>

                  <p className="mt-1 text-sm text-[#3D398C]/75">
                    Current NU email:{" "}
                    <span className="font-semibold">
                      {currentNuEmail || "—"}
                    </span>
                  </p>

                  <div className="mt-4 rounded-2xl border border-[#3D398C]/10 bg-white px-4 py-4 text-left">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 h-4 w-4 shrink-0 text-[#3D398C]" />

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#3D398C]">
                          Is this your personal email?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#3D398C]/70">
                          This email will become your Alumni login email after
                          transition. You may change it if this is not the email
                          you currently use.
                        </p>

                        <div className="mt-3 grid gap-1.5">
                          <Label
                            htmlFor="transitionEmail"
                            className="text-sm font-semibold text-[#3D398C]"
                          >
                            Alumni Login Email{" "}
                            <span className="text-red-500">*</span>
                          </Label>

                          <Input
                            id="transitionEmail"
                            type="email"
                            value={transitionEmail}
                            onChange={(event) =>
                              handleEmailChange(event.target.value)
                            }
                            onBlur={() => setEmailTouched(true)}
                            autoCapitalize="none"
                            autoCorrect="off"
                            disabled={loadingIntern || submitting}
                            placeholder="Enter your personal email"
                            className={[
                              "h-12 rounded-xl border bg-white text-sm font-semibold text-[#3D398C] placeholder:text-[#3D398C]/35 focus-visible:border-[#3D398C] focus-visible:ring-2 focus-visible:ring-[#3D398C]/20",
                              emailError
                                ? "border-red-500"
                                : "border-[#3D398C]/20",
                            ].join(" ")}
                          />

                          <div className="flex min-h-[20px] items-start justify-between gap-3">
                            <p
                              className={[
                                "text-[11px] font-semibold text-red-600 transition-opacity duration-200",
                                emailError ? "opacity-100" : "opacity-0",
                              ].join(" ")}
                            >
                              {emailError || "\u00A0"}
                            </p>

                            {savedPersonalEmail ? (
                              <p className="whitespace-nowrap text-right text-[11px] text-[#3D398C]/60">
                                {changedFromSavedEmail
                                  ? "Changed from saved email"
                                  : `Saved: ${maskEmail(savedPersonalEmail)}`}
                              </p>
                            ) : null}
                          </div>

                          {savedPersonalEmail && changedFromSavedEmail ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTransitionEmail(savedPersonalEmail);
                                setEmailTouched(false);
                                setError("");
                                setStatus("");
                              }}
                              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#3D398C]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#3D398C] transition hover:bg-[#3D398C] hover:text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Use saved email instead
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {status ? (
                  <div className="mb-4 rounded-xl border border-[#3D398C]/15 bg-[#3D398C]/5 px-4 py-3 text-xs font-semibold text-[#3D398C]">
                    {status}
                  </div>
                ) : null}

                {error ? (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleCompleteTransition} className="w-full">
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-[#3D398C]/10 bg-[#3D398C]/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#3D398C]" />

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#3D398C]">
                            Confirmation required
                          </p>

                          <p className="mt-2 text-xs leading-6 text-[#3D398C]/80">
                            Please confirm that the email above is the personal
                            email you want to use for your Alumni account. Once
                            confirmed, your Intern account will be transitioned
                            to an Alumni account.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#3D398C]/10 bg-[#3D398C]/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3D398C]" />

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#3D398C]">
                            Login rule
                          </p>

                          <p className="mt-2 text-xs leading-6 text-[#3D398C]/80">
                            While your role is Intern, you use your NU email.
                            After this transition is completed, only your
                            personal email will be used as your Alumni login
                            email.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-1">
                      <Button
                        type="submit"
                        disabled={loadingIntern || submitting || !canTransition}
                        className={[
                          "h-14 w-full rounded-2xl text-sm font-extrabold text-white",
                          loadingIntern || submitting || !canTransition
                            ? "cursor-not-allowed bg-[#3D398C]/35 hover:bg-[#3D398C]/35"
                            : "cursor-pointer bg-[#3D398C] hover:bg-[#312d74]",
                        ].join(" ")}
                      >
                        {loadingIntern ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            LOADING INTERN RECORD...
                          </>
                        ) : submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            COMPLETING TRANSITION...
                          </>
                        ) : (
                          "CONFIRM AND COMPLETE TRANSITION"
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (typeof onBack === "function") {
                            onBack();
                            return;
                          }

                          navigate("/login", { replace: true });
                        }}
                        disabled={submitting}
                        className="h-14 w-full rounded-2xl border border-[#3D398C]/30 bg-transparent text-sm font-extrabold text-[#3D398C] hover:bg-[#3D398C] hover:text-white"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        BACK
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-lg font-bold"
              style={{ color: BRAND_BLUE }}
            >
              Confirm Logout
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to logout? You will need to sign in again to
              continue the alumni transition.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
