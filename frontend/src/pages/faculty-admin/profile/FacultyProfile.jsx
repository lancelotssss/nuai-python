import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import PageTitle from "@/components/PageTitle";
import AdminProfile from "../../public/AdminProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function safe(value) {
  return String(value ?? "").trim();
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

function getAccountId(profile, account) {
  if (profile?.account && typeof profile.account === "object") {
    return profile.account.id;
  }

  return (
    profile?.account ||
    profile?.account_id ||
    profile?.accountId ||
    account?.id ||
    null
  );
}

function buildFullName(profile = {}) {
  if (!profile) return "Faculty User";

  const personal = profile.personalInformation || {};

  return (
    [
      safe(personal.firstName),
      safe(personal.middleName),
      safe(personal.lastName),
    ]
      .filter(Boolean)
      .join(" ") ||
    safe(profile.fullName) ||
    safe(profile.name) ||
    safe(profile.email) ||
    "Faculty User"
  );
}

function resolvePhotoUrl(profile = {}) {
  return (
    safe(profile?.personalization?.photoUrl) ||
    safe(profile?.photoUrl) ||
    safe(profile?.profilePicture) ||
    ""
  );
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

function formatDateTime(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  return value;
}

function normalizeFacultyRow(row, account) {
  if (!row) return null;

  const firstName = row.first_name || row.firstName || "";
  const middleName = row.middle_name || row.middleName || "";
  const lastName = row.last_name || row.lastName || "";

  const email =
    row.email ||
    row.official_email ||
    row.officialEmail ||
    row.account?.email ||
    row.account_email ||
    account?.email ||
    "";

  const role = row.role || row.account?.role || row.account_role || "faculty";
  const status =
    row.status || row.account?.status || row.account_status || "active";

  const department = row.department || "Internship Adviser";
  const position =
    row.position ||
    row.department_title ||
    row.departmentTitle ||
    row.roleData?.departmentTitle ||
    "";

  const schoolProgramCode =
    row.school_program_code ||
    row.schoolProgramCode ||
    row.academicInformation?.schoolProgramCode ||
    "";

  const programCode =
    row.program_code ||
    row.programCode ||
    row.academic_program_code ||
    row.academicProgramCode ||
    row.academicInformation?.programCode ||
    "";

  const schoolProgram =
    row.school_program ||
    row.schoolProgram ||
    row.academicInformation?.schoolProgram ||
    "";

  const program =
    row.program ||
    row.academic_program ||
    row.academicProgram ||
    row.academicInformation?.program ||
    "";

  const accountId = getAccountId(row, account);

  return {
    ...row,

    id: row.id,
    accountId,

    fullName: [firstName, middleName, lastName].filter(Boolean).join(" "),
    name: [firstName, middleName, lastName].filter(Boolean).join(" "),

    email,
    department,
    role: role === "faculty" ? "Faculty" : role,
    status:
      String(status).toLowerCase() === "active" ? "Active" : "Inactive",

    employeeId: row.employee_id || row.employeeId || "",

    personalInformation: {
      firstName,
      middleName,
      lastName,
    },

    contactInformation: {
      officialEmail: email,
      personalEmail: email,
    },

    roleData: {
      departmentTitle: position,
    },

    staffInformation: {
      employeeId: row.employee_id || row.employeeId || "",
    },

    academicInformation: {
      schoolProgram,
      schoolProgramCode,
      program,
      programCode,
    },

    facultyInformation: {
      schoolProgram,
      schoolProgramCode,
      program,
      programCode,
    },

    personalization: {
      photoUrl:
        row.photo_url ||
        row.photoUrl ||
        row.profile_photo ||
        row.profilePhoto ||
        row.profile_picture ||
        row.profilePicture ||
        "",
    },

    systemAudit: {
      isActive: String(status).toLowerCase() === "active",
      createdAt: formatDateTime(row.created_at || row.createdAt),
      updatedAt: formatDateTime(row.updated_at || row.updatedAt),
      lastLoggedIn:
        formatDateTime(row.last_login || row.lastLoggedIn) ||
        formatDateTime(account?.last_login || account?.lastLoggedIn),
    },
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

export default function FacultyProfile() {
  const account = getStoredAccount();

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

  const accountId = useMemo(() => getAccountId(profile, account), [profile]);

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
    : "Change Profile Photo";

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      if (!account?.email) {
        throw new Error("No logged-in faculty account found.");
      }

      const data = await apiRequest("/faculty/");
      const list = normalizeListResponse(data);

      const match =
        list.find(
          (item) =>
            safe(item.email).toLowerCase() === safe(account.email).toLowerCase(),
        ) ||
        list.find(
          (item) =>
            safe(item.account_email).toLowerCase() ===
            safe(account.email).toLowerCase(),
        ) ||
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

      setProfile(normalizeFacultyRow(match, account));
    } catch (err) {
      toast.error("Failed to load profile", {
        description: err?.message || "Please try again.",
      });
      setProfile(normalizeFacultyRow(null, account));
    } finally {
      setLoading(false);
    }
  }, [account?.email, account?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

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

  async function handleSaveProfileImage() {
    if (!selectedImageFile) return;

    setUploadingImage(true);

    try {
      toast.info("Profile photo upload is not connected yet", {
        description:
          "The Django storage endpoint is not available yet. The selected photo is only previewed on this page.",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    if (passwordError) {
      toast.error("Password change failed", {
        description: passwordError,
      });
      return;
    }

    if (!account?.email) {
      toast.error("Password change failed", {
        description: "Current session email is missing.",
      });
      return;
    }

    if (!accountId) {
      toast.error("Password change failed", {
        description: "Linked account ID is missing.",
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

      await apiRequest(`/accounts/${accountId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);

      toast.success("Password changed successfully");
    } catch (err) {
      toast.error("Failed to change password", {
        description:
          err?.message ||
          "Please make sure your current password is correct and try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageTitle title="Faculty Profile | NUAI" />

        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#3D398C]" />
            <span className="text-sm text-muted-foreground">
              Loading profile...
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Faculty Profile | NUAI" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      <AdminProfile
        profile={profile}
        title={fullName}
        subtitle="Internship Adviser Profile"
        showAcademicInfo
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
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
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
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
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
                      onClick={() => {
                        setShowPasswordFields(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
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