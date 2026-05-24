// src/pages/alumni-officer/profile/OfficerProfile.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import AdminProfile from "../../public/AdminProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = "http://127.0.0.1:8000/api";

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

function setStoredAccount(nextAccount) {
  localStorage.setItem("nuai_account", JSON.stringify(nextAccount));
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

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getAccountId(row) {
  if (!row) return null;
  if (row.account && typeof row.account === "object") return row.account.id;
  return row.account || row.account_id || row.accountId || null;
}

function buildFullName(profile) {
  if (!profile) return "Alumni Officer";

  const personal = profile.personalInformation || {};

  const fullName =
    [
      safe(personal.firstName),
      safe(personal.middleName),
      safe(personal.lastName),
    ]
      .filter(Boolean)
      .join(" ") ||
    safe(profile.fullName) ||
    safe(profile.name) ||
    safe(profile.email);

  return fullName || "Alumni Officer";
}

function resolvePhotoUrl(profile) {
  if (!profile) return "";

  return (
    safe(profile?.personalization?.photoUrl) ||
    safe(profile?.photoUrl) ||
    safe(profile?.profilePicture) ||
    ""
  );
}

function mapOfficerToProfile(officer = {}, account = {}) {
  const firstName = officer.first_name || officer.firstName || "";
  const middleName = officer.middle_name || officer.middleName || "";
  const lastName = officer.last_name || officer.lastName || "";

  const email =
    officer.email ||
    officer.account_email ||
    officer.account?.email ||
    account?.email ||
    "";

  const role =
    officer.role ||
    officer.account_role ||
    officer.account?.role ||
    account?.role ||
    "alumni-officer";

  const status =
    officer.status ||
    officer.account_status ||
    officer.account?.status ||
    account?.status ||
    "active";

  const accountId =
    getAccountId(officer) || account?.id || account?.account_id || null;

  const localPhoto =
    localStorage.getItem(`nuai_officer_photo_${accountId || email}`) || "";

  const fullName = [firstName, middleName, lastName]
    .map(safe)
    .filter(Boolean)
    .join(" ");

  const normalizedStatus = safe(status).toLowerCase();

  return {
    id: officer.id || "",
    accountId,
    email,
    role: role === "alumni-officer" ? "Alumni Officer" : role,
    department: officer.department || "Alumni Affairs Office",
    status: normalizedStatus === "active" ? "Active" : "Deactivated",
    employeeId: officer.employee_id || officer.employeeId || "",
    fullName,
    name: fullName || email || "Alumni Officer",

    personalInformation: {
      firstName,
      middleName,
      lastName,
    },

    contactInformation: {
      officialEmail: email,
    },

    roleData: {
      departmentTitle:
        officer.position ||
        officer.department_title ||
        officer.departmentTitle ||
        "Alumni Affairs Officer",
    },

    staffInformation: {
      employeeId: officer.employee_id || officer.employeeId || "",
    },

    personalization: {
      photoUrl: localPhoto,
    },

    systemAudit: {
      createdAt: officer.created_at || officer.createdAt || "",
      updatedAt: officer.updated_at || officer.updatedAt || "",
      lastLoggedIn:
        officer.last_login ||
        officer.lastLoggedIn ||
        account?.last_login ||
        account?.lastLoggedIn ||
        "",
      isActive: normalizedStatus === "active",
    },
  };
}

function isImageFile(file) {
  return file?.type?.startsWith("image/");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

export default function OfficerProfile() {
  const account = useMemo(() => getStoredAccount(), []);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  async function loadProfile() {
    setLoading(true);

    try {
      if (!account?.email) {
        setProfile(mapOfficerToProfile({}, {}));
        return;
      }

      const data = await apiRequest("/alumni-officers/");
      const list = normalizeListResponse(data);

      const matched =
        list.find((item) => String(getAccountId(item)) === String(account?.id)) ||
        list.find(
          (item) =>
            safe(item?.email).toLowerCase() ===
            safe(account?.email).toLowerCase(),
        ) ||
        list.find(
          (item) =>
            safe(item?.account_email).toLowerCase() ===
            safe(account?.email).toLowerCase(),
        ) ||
        list.find(
          (item) =>
            safe(item?.account?.email).toLowerCase() ===
            safe(account?.email).toLowerCase(),
        ) ||
        null;

      if (!matched) {
        setProfile(
          mapOfficerToProfile(
            {
              email: account.email,
              role: account.role,
              status: account.status,
            },
            account,
          ),
        );
        return;
      }

      setProfile(mapOfficerToProfile(matched, account));
    } catch (err) {
      toast.error("Failed to load profile", {
        description: err?.message || "Please try again.",
      });

      setProfile(
        mapOfficerToProfile(
          {
            email: account?.email,
            role: account?.role,
            status: account?.status,
          },
          account || {},
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const fullName = useMemo(() => buildFullName(profile), [profile]);
  const currentPhotoUrl = useMemo(() => resolvePhotoUrl(profile), [profile]);

  const passwordError = useMemo(() => {
    if (!currentPassword && !newPassword && !confirmPassword) return "";
    if (!currentPassword) return "Current password is required.";
    if (!newPassword) return "New password is required.";
    if (newPassword.length < 6) {
      return "New password must be at least 6 characters.";
    }
    if (!confirmPassword) return "Please confirm your new password.";
    if (newPassword !== confirmPassword) return "New passwords do not match.";
    return "";
  }, [currentPassword, newPassword, confirmPassword]);

  const photoButtonLabel = selectedImageFile
    ? "Save Profile Photo"
    : currentPhotoUrl
      ? "Change Profile Photo"
      : "Upload Profile Photo";

  function handleOpenFileExplorer() {
    if (selectedImageFile) {
      handleSaveProfileImage();
      return;
    }

    fileInputRef.current?.click();
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isImageFile(file)) {
      toast.error("Invalid file", {
        description: "Please select an image file.",
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large", {
        description: "Please select an image smaller than 4 MB.",
      });
      return;
    }

    if (selectedImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setSelectedImagePreview(objectUrl);
  }

  function handleClearSelection() {
    if (selectedImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(null);
    setSelectedImagePreview("");
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSaveProfileImage() {
    if (!selectedImageFile) return;

    setUploadingImage(true);

    try {
      const accountKey =
        profile?.accountId || account?.id || profile?.email || account?.email;
      const dataUrl = await fileToDataUrl(selectedImageFile);

      localStorage.setItem(`nuai_officer_photo_${accountKey}`, dataUrl);

      setProfile((prev) => ({
        ...(prev || mapOfficerToProfile({}, account || {})),
        personalization: {
          ...(prev?.personalization || {}),
          photoUrl: dataUrl,
        },
      }));

      if (selectedImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }

      setSelectedImageFile(null);
      setSelectedImagePreview("");

      toast.success("Profile photo updated", {
        description:
          "Your officer profile photo has been saved locally for this browser.",
      });
    } catch (err) {
      toast.error("Failed to update profile photo", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (passwordError) {
      toast.error("Password change failed", {
        description: passwordError,
      });
      return;
    }

    if (!account?.email || !account?.id) {
      toast.error("Password change failed", {
        description: "Current account information is missing.",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      await apiRequest("/accounts/login/", {
        method: "POST",
        body: JSON.stringify({
          email: account.email,
          password: currentPassword,
        }),
      });

      const updatedAccount = await apiRequest(`/accounts/${account.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      setStoredAccount({
        ...account,
        ...(updatedAccount || {}),
        email: updatedAccount?.email || account.email,
        role: updatedAccount?.role || account.role,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      toast.success("Password changed successfully");
    } catch (err) {
      let message = err?.message || "Please try again.";

      if (/invalid|incorrect|credential|password/i.test(message)) {
        message = "Your current password is incorrect.";
      }

      toast.error("Failed to change password", {
        description: message,
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleCancelPassword() {
    setShowPasswordFields(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#3D398C]" />
          <span className="text-sm text-muted-foreground">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  const safeProfile = profile || mapOfficerToProfile({}, account || {});

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      <AdminProfile
        profile={safeProfile}
        title={fullName}
        subtitle="Alumni Affairs Officer Profile"
        showAcademicInfo={false}
        avatarPreviewUrl={selectedImagePreview || currentPhotoUrl}
        avatarAction={
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              onClick={handleOpenFileExplorer}
              disabled={uploadingImage}
              className="h-8 w-full gap-2 bg-[#3D398C] px-3 text-xs text-white hover:bg-[#2f2b75]"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  {photoButtonLabel}
                </>
              )}
            </Button>

            {selectedImageFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSelection}
                disabled={uploadingImage}
                className="h-8 w-full gap-2 px-3 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Cancel
              </Button>
            ) : null}
          </div>
        }
        extraContent={
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#3D398C]" />
                <h2 className="text-sm font-bold text-[#3D398C]">Password</h2>
              </div>

              {!showPasswordFields ? (
                <Button
                  type="button"
                  onClick={() => setShowPasswordFields(true)}
                  className="gap-2 bg-[#3D398C] text-white hover:bg-[#2f2b75]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(event) =>
                          setCurrentPassword(event.target.value)
                        }
                        placeholder="Enter current password"
                        className="pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Confirm new password"
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordError ? (
                    <p className="text-xs font-medium text-destructive">
                      {passwordError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Your new password must be at least 6 characters.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      disabled={passwordLoading || !!passwordError}
                      className="gap-2 bg-[#3D398C] text-white hover:bg-[#2f2b75]"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
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
                      disabled={passwordLoading}
                      onClick={handleCancelPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {selectedImageFile ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#3D398C]" />
                  <h2 className="text-sm font-bold text-[#3D398C]">
                    Selected Profile Photo
                  </h2>
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedImageFile.name} • {formatBytes(selectedImageFile.size)}
                </p>
              </div>
            ) : null}
          </div>
        }
      />
    </>
  );
}