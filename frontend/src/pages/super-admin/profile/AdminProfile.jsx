// src/pages/super-admin/profile/AdminProfile.jsx

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import PageTitle from "@/components/PageTitle";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BRAND_BLUE = "#3D398C";
const API_BASE_URL = "http://127.0.0.1:8000/api";

function safe(value) {
  return String(value ?? "").trim();
}

function joinName(parts = []) {
  return parts.filter(Boolean).join(" ").trim();
}

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null");
  } catch {
    return null;
  }
}

function setStoredAccount(nextAccount) {
  try {
    localStorage.setItem("nuai_account", JSON.stringify(nextAccount));
  } catch {}
}

function getFullName(account = {}) {
  return (
    safe(account?.full_name) ||
    safe(account?.fullName) ||
    joinName([
      safe(account?.first_name || account?.firstName),
      safe(account?.middle_name || account?.middleName),
      safe(account?.last_name || account?.lastName),
    ]) ||
    safe(account?.name) ||
    safe(account?.displayName) ||
    safe(account?.email) ||
    "Administrator"
  );
}

function getEmail(account = {}) {
  return safe(account?.email) || "—";
}

function getRole(account = {}) {
  const role = safe(account?.role) || "super-admin";

  if (role === "super-admin" || role === "super_admin") return "Super Admin";

  return role;
}

function getStatus(account = {}) {
  const status = safe(account?.status || "active").toLowerCase();
  return status === "active" ? "Active" : "Deactivated";
}

function getInitials(name = "") {
  const parts = safe(name).split(/\s+/).filter(Boolean);

  if (!parts.length) return "AD";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function sanitizePassword(value) {
  return String(value || "").replace(/^\s+|\s+$/g, "");
}

function hasSequence(password) {
  const value = String(password || "").toLowerCase();

  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "0123456789",
  ];

  return sequences.some((sequence) => {
    for (let i = 0; i <= sequence.length - 4; i += 1) {
      const part = sequence.slice(i, i + 4);
      const reversed = part.split("").reverse().join("");

      if (value.includes(part) || value.includes(reversed)) {
        return true;
      }
    }

    return false;
  });
}

function hasRepeatedCharacters(password) {
  return /(.)\1\1/.test(String(password || ""));
}

function passwordChecks(password, account = {}) {
  const value = sanitizePassword(password);
  const email = getEmail(account).toLowerCase();
  const fullName = getFullName(account).toLowerCase();

  const nameParts = fullName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  const lower = value.toLowerCase();

  const containsEmailPart =
    email && email !== "—"
      ? email
          .split("@")[0]
          .split(/[._-]/)
          .filter((part) => part.length >= 3)
          .some((part) => lower.includes(part))
      : false;

  const containsNamePart = nameParts.some((part) => lower.includes(part));

  return {
    length: value.length >= 12,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
    noSpaces: !/\s/.test(value),
    noRepeated: !hasRepeatedCharacters(value),
    noSequence: !hasSequence(value),
    noPersonalInfo: !containsEmailPart && !containsNamePart,
  };
}

function passwordStrength(password, account = {}) {
  const value = sanitizePassword(password);

  if (!value) {
    return {
      label: "—",
      level: 0,
      percent: 0,
    };
  }

  const checks = passwordChecks(value, account);
  const passed = Object.values(checks).filter(Boolean).length;

  if (passed <= 3) {
    return {
      label: "Weak",
      level: 1,
      percent: 25,
    };
  }

  if (passed <= 6) {
    return {
      label: "Medium",
      level: 2,
      percent: 55,
    };
  }

  if (passed <= 8) {
    return {
      label: "Strong",
      level: 3,
      percent: 80,
    };
  }

  return {
    label: "Very Strong",
    level: 4,
    percent: 100,
  };
}

function strengthStyle(level) {
  if (level === 0) {
    return {
      pill: "border-border bg-muted text-muted-foreground",
      bar: "bg-transparent",
    };
  }

  if (level === 1) {
    return {
      pill: "border-red-200 bg-red-50 text-red-700",
      bar: "bg-red-500",
    };
  }

  if (level === 2) {
    return {
      pill: "border-amber-200 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
    };
  }

  if (level === 3) {
    return {
      pill: "border-blue-200 bg-blue-50 text-blue-700",
      bar: "bg-blue-500",
    };
  }

  return {
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  };
}

function isPasswordValid(password, account = {}) {
  const checks = passwordChecks(password, account);
  return Object.values(checks).every(Boolean);
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

async function resolveAccountId(account) {
  if (account?.id) return account.id;

  const email = getEmail(account);
  if (!email || email === "—") return null;

  const data = await apiRequest("/accounts/");
  const list = Array.isArray(data) ? data : data?.results || [];
  const found = list.find(
    (item) => String(item?.email || "").toLowerCase() === email.toLowerCase(),
  );

  return found?.id || null;
}

async function verifyCurrentPassword(account, currentPassword) {
  const email = getEmail(account);

  if (!email || email === "—") {
    throw new Error("Current account email is missing.");
  }

  await apiRequest("/accounts/login/", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: currentPassword,
    }),
  });
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
        scope: "super_admin_profile",
        target_table: "accounts_table",
        target_id: metadata.target_id ? String(metadata.target_id) : "",
        metadata,
      }),
    });
  } catch {
    // Audit must never block the main action.
  }
}

function PasswordRule({ ok, text }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          ok
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-background text-muted-foreground",
        ].join(" ")}
      >
        {ok ? <CheckCircle2 className="h-3 w-3" /> : null}
      </span>

      <p
        className={[
          "text-xs font-medium transition-colors duration-200",
          ok ? "text-emerald-700" : "text-muted-foreground",
        ].join(" ")}
      >
        {text}
      </p>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  error,
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </Label>

      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={[
            "h-11 rounded-xl border-border bg-background pl-11 pr-11 transition-all duration-200 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20",
            error ? "border-destructive focus-visible:ring-destructive/20" : "",
          ].join(" ")}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-[#3D398C]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function AdminProfile() {
  const account = useMemo(() => getStoredAccount(), []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswords, setShowNewPasswords] = useState(false);

  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const fullName = useMemo(() => getFullName(account), [account]);
  const email = useMemo(() => getEmail(account), [account]);
  const resolvedRole = useMemo(() => getRole(account), [account]);
  const status = useMemo(() => getStatus(account), [account]);
  const initials = useMemo(() => getInitials(fullName), [fullName]);

  const checks = useMemo(
    () => passwordChecks(newPassword, account),
    [newPassword, account],
  );

  const strength = useMemo(
    () => passwordStrength(newPassword, account),
    [newPassword, account],
  );

  const strengthClasses = useMemo(
    () => strengthStyle(strength.level),
    [strength.level],
  );

  const currentPasswordError =
    touched && !currentPassword ? "Current password is required." : "";

  const newPasswordError =
    touched && !newPassword
      ? "New password is required."
      : touched && !isPasswordValid(newPassword, account)
        ? "Password does not meet all security requirements."
        : "";

  const confirmPasswordError =
    touched && !confirmPassword
      ? "Please confirm your new password."
      : touched && newPassword && confirmPassword && newPassword !== confirmPassword
        ? "Passwords do not match."
        : "";

  const canSubmit =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    isPasswordValid(newPassword, account) &&
    !saving;

  async function handleChangePassword(event) {
    event.preventDefault();
    setTouched(true);

    if (!canSubmit) {
      toast.error("Password change failed", {
        description: "Please complete all requirements before saving.",
      });
      return;
    }

    setSaving(true);

    try {
      await verifyCurrentPassword(account, currentPassword);

      const accountId = await resolveAccountId(account);

      if (!accountId) {
        throw new Error("Unable to find the linked account record.");
      }

      const updatedAccount = await apiRequest(`/accounts/${accountId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      const nextAccount = {
        ...account,
        ...updatedAccount,
        id: accountId,
      };

      setStoredAccount(nextAccount);

      await logSystemAudit(
        "UPDATE_ADMIN_PASSWORD",
        `Super Admin password was updated for ${email}.`,
        {
          target_id: accountId,
          email,
        },
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched(false);

      toast.success("Password changed successfully", {
        description: "Your admin account password has been updated.",
      });
    } catch (err) {
      let message = err?.message || "Please try again.";

      if (
        String(message).toLowerCase().includes("invalid email or password") ||
        String(message).toLowerCase().includes("invalid credentials")
      ) {
        message = "Your current password is incorrect.";
      }

      toast.error("Failed to change password", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Admin Profile | NUAI" />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <div className="px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-sm"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-[#3D398C]">
                    {fullName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your administrator account password.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${BRAND_BLUE}14`,
                      color: BRAND_BLUE,
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {resolvedRole}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
            <div className="border-b border-border bg-muted/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-2xl"
                  style={{ backgroundColor: `${BRAND_BLUE}14` }}
                >
                  <Lock className="h-5 w-5 text-[#3D398C]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#3D398C]">
                    Change Password
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Use a stronger password to protect your administrator account.
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-5">
                <PasswordInput
                  id="currentPassword"
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Enter your current password"
                  visible={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword((prev) => !prev)}
                  error={currentPasswordError}
                />

                <PasswordInput
                  id="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Create a new secure password"
                  visible={showNewPasswords}
                  onToggle={() => setShowNewPasswords((prev) => !prev)}
                  error={newPasswordError}
                />

                <AnimatePresence>
                  {newPassword ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -6 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Password Strength
                          </p>

                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-xs font-bold",
                              strengthClasses.pill,
                            ].join(" ")}
                          >
                            {strength.label}
                          </span>
                        </div>

                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                          <motion.div
                            className={["h-full rounded-full", strengthClasses.bar].join(" ")}
                            initial={{ width: 0 }}
                            animate={{ width: `${strength.percent}%` }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          />
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <PasswordRule ok={checks.length} text="At least 12 characters" />
                          <PasswordRule ok={checks.uppercase} text="Contains uppercase letter" />
                          <PasswordRule ok={checks.lowercase} text="Contains lowercase letter" />
                          <PasswordRule ok={checks.number} text="Contains number" />
                          <PasswordRule ok={checks.special} text="Contains special character" />
                          <PasswordRule ok={checks.noSpaces} text="No spaces allowed" />
                          <PasswordRule ok={checks.noRepeated} text="No 3 repeated characters" />
                          <PasswordRule ok={checks.noSequence} text="No obvious sequences" />
                          <PasswordRule ok={checks.noPersonalInfo} text="Does not contain your name/email" />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <PasswordInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter your new password"
                  visible={showNewPasswords}
                  onToggle={() => setShowNewPasswords((prev) => !prev)}
                  error={confirmPasswordError}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="gap-2 bg-[#3D398C] text-white hover:bg-[#312d74]"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Save Password
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setTouched(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
