// src/components/profiles/AdminProfile.jsx
import { useMemo } from "react";
import {
  User2,
  Mail,
  Building2,
  ShieldCheck,
  BadgeCheck,
  CalendarClock,
  Clock3,
  IdCard,
  GraduationCap,
} from "lucide-react";

function safe(value) {
  return String(value ?? "").trim();
}

function formatDateTime(value) {
  if (!value) return "—";

  if (typeof value?.toDate === "function") {
    try {
      return value.toDate().toLocaleString();
    } catch {
      return "—";
    }
  }

  if (value instanceof Date) return value.toLocaleString();

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();

  return safe(value) || "—";
}

function buildFullName(profile = {}) {
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
    "Unnamed User"
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

function resolveEmail(profile = {}) {
  const contact = profile.contactInformation || {};

  return (
    safe(contact.officialEmail) ||
    safe(contact.nuEmail) ||
    safe(contact.personalEmail) ||
    safe(profile.email) ||
    "—"
  );
}

function resolveDepartment(profile = {}) {
  return safe(profile.department) || "—";
}

function resolveRole(profile = {}) {
  return safe(profile.role) || "—";
}

function resolveDepartmentTitle(profile = {}) {
  return safe(profile?.roleData?.departmentTitle) || "—";
}

function resolveEmployeeId(profile = {}) {
  return (
    safe(profile.employeeId) ||
    safe(profile?.staffInformation?.employeeId) ||
    "—"
  );
}

function resolveStatus(profile = {}) {
  if (profile?.systemAudit?.isActive === false) return "Inactive";
  if (profile?.disabled === true || profile?.isDisabled === true) return "Inactive";
  if (profile?.isActive === false) return "Inactive";
  return safe(profile.status) || "Active";
}

function resolveSchoolProgramCode(profile = {}) {
  return (
    safe(profile.schoolProgramCode) ||
    safe(profile?.academicInformation?.schoolProgramCode) ||
    safe(profile?.academicRecords?.schoolProgramCode) ||
    safe(profile?.facultyInformation?.schoolProgramCode) ||
    "—"
  );
}

function resolveProgramCode(profile = {}) {
  return (
    safe(profile.programCode) ||
    safe(profile?.academicInformation?.programCode) ||
    safe(profile?.academicRecords?.programCode) ||
    safe(profile?.facultyInformation?.programCode) ||
    safe(profile.courseCode) ||
    safe(profile.course) ||
    safe(profile.program) ||
    "—"
  );
}

function Item({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {safe(value) || "—"}
      </p>
    </div>
  );
}

export default function AdminProfile({
  profile,
  title = "",
  subtitle = "",
  showAcademicInfo = true,
  extraContent = null,
  avatarAction = null,
  avatarPreviewUrl = "",
}) {
  const fullName = useMemo(() => buildFullName(profile), [profile]);
  const profilePhotoUrl = useMemo(() => resolvePhotoUrl(profile), [profile]);
  const photoUrl = safe(avatarPreviewUrl) || profilePhotoUrl;
  const email = useMemo(() => resolveEmail(profile), [profile]);
  const department = useMemo(() => resolveDepartment(profile), [profile]);
  const role = useMemo(() => resolveRole(profile), [profile]);
  const departmentTitle = useMemo(
    () => resolveDepartmentTitle(profile),
    [profile],
  );
  const employeeId = useMemo(() => resolveEmployeeId(profile), [profile]);
  const status = useMemo(() => resolveStatus(profile), [profile]);
  const schoolProgramCode = useMemo(
    () => resolveSchoolProgramCode(profile),
    [profile],
  );
  const programCode = useMemo(() => resolveProgramCode(profile), [profile]);
  const createdAt = useMemo(
    () => formatDateTime(profile?.systemAudit?.createdAt),
    [profile],
  );
  const updatedAt = useMemo(
    () => formatDateTime(profile?.systemAudit?.updatedAt),
    [profile],
  );
  const lastLoggedIn = useMemo(
    () => formatDateTime(profile?.systemAudit?.lastLoggedIn),
    [profile],
  );

  const initials = useMemo(() => {
    return (
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "AD"
    );
  }, [fullName]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/20 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-[#3D398C]">
                    {initials}
                  </span>
                )}
              </div>

              {avatarAction ? <div className="w-full">{avatarAction}</div> : null}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-[#3D398C]">
                {title || fullName}
              </h1>

              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#3D398C]/10 px-3 py-1 text-xs font-semibold text-[#3D398C]">
                  {role}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Item icon={Mail} label="Official Email" value={email} />
            <Item icon={Building2} label="Department" value={department} />
            <Item icon={ShieldCheck} label="Role" value={role} />
            <Item
              icon={BadgeCheck}
              label="Department Title"
              value={departmentTitle}
            />
            <Item icon={IdCard} label="Employee ID" value={employeeId} />

            {showAcademicInfo && (
              <>
                <Item
                  icon={GraduationCap}
                  label="School Program Code"
                  value={schoolProgramCode}
                />
                <Item
                  icon={GraduationCap}
                  label="Academic Program Code"
                  value={programCode}
                />
              </>
            )}

            <Item icon={BadgeCheck} label="Status" value={status} />
            <Item icon={CalendarClock} label="Created At" value={createdAt} />
            <Item icon={CalendarClock} label="Updated At" value={updatedAt} />
            <Item icon={Clock3} label="Last Logged In" value={lastLoggedIn} />
          </div>

          {extraContent ? <div className="mt-6">{extraContent}</div> : null}
        </div>
      </div>
    </div>
  );
}