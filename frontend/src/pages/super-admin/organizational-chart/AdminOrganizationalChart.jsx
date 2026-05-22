import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Crown,
  Loader2,
  Network,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserRound,
  UsersRound,
  BriefcaseBusiness,
  GraduationCap,
  Handshake,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const BB = "#3D398C";
const MAX_POSITIONS = 3;

const ORG_MEMBER_CONFIG = {
  executiveDirector: {
    key: "executiveDirector",
    label: "Executive Director",
    icon: BriefcaseBusiness,
  },
  academicDirector: {
    key: "academicDirector",
    label: "Academic Director",
    icon: GraduationCap,
  },
  ailpoCoordinator: {
    key: "ailpoCoordinator",
    label: "AILPO Coordinator",
    icon: Handshake,
  },
};

const ORG_MEMBER_ORDER = [
  "executiveDirector",
  "academicDirector",
  "ailpoCoordinator",
];

function safe(value) {
  return String(value ?? "").trim();
}

function sanitizeSpacing(value) {
  return safe(String(value ?? "").replace(/\s+/g, " "));
}

function sanitizeCode(value) {
  return safe(String(value ?? "").replace(/\s+/g, ""));
}

function emptyPersonForm() {
  return {
    name: "",
    positions: [""],
  };
}

function rawPositions(positions) {
  if (!Array.isArray(positions)) return [""];

  const values = positions.slice(0, MAX_POSITIONS).map((position) => {
    return String(position ?? "");
  });

  return values.length > 0 ? values : [""];
}

function cleanPositions(positions) {
  return rawPositions(positions).map((position) => sanitizeSpacing(position));
}

function normalizePersonForm(value) {
  const person = value || {};

  return {
    name: sanitizeSpacing(person.name),
    positions: rawPositions(person.positions),
  };
}

function normalizeDeanEntry(value) {
  const dean = value || {};
  const legacyPosition = sanitizeSpacing(dean.position);
  const positions = Array.isArray(dean.positions)
    ? dean.positions
    : legacyPosition
      ? [legacyPosition]
      : [""];

  return {
    name: sanitizeSpacing(dean.name),
    positions: rawPositions(positions),
  };
}

function getInitialDeanForms(schoolProgram) {
  const chart = schoolProgram?.organizationalChart || {};
  const savedDeans = chart.deans;

  if (Array.isArray(savedDeans) && savedDeans.length > 0) {
    const normalized = savedDeans
      .map((entry) => normalizeDeanEntry(entry))
      .filter((entry) => sanitizeSpacing(entry.name));

    if (normalized.length > 0) return normalized;
  }

  const savedDean = chart.dean || schoolProgram?.dean || null;

  if (savedDean) {
    const normalized = normalizeDeanEntry(savedDean);

    if (sanitizeSpacing(normalized.name)) {
      return [normalized];
    }
  }

  return [emptyPersonForm()];
}

function getDeanList(item) {
  const chart = item?.organizationalChart || {};
  const savedDeans = chart.deans;

  if (Array.isArray(savedDeans) && savedDeans.length > 0) {
    const normalized = savedDeans
      .map((entry) => normalizeDeanEntry(entry))
      .map((entry) => ({
        name: sanitizeSpacing(entry.name),
        positions: cleanPositions(entry.positions).filter(Boolean),
      }))
      .filter((entry) => entry.name);

    if (normalized.length > 0) return normalized;
  }

  const dean = chart.dean || item?.dean || null;

  if (dean?.name) {
    return [
      {
        name: sanitizeSpacing(dean.name),
        positions: cleanPositions(dean.positions).filter(Boolean),
      },
    ];
  }

  return [];
}

function validatePersonForm(form, label = "Member") {
  const name = sanitizeSpacing(form?.name);
  const positions = cleanPositions(form?.positions);

  const errors = {
    name: "",
    positions: rawPositions(form?.positions).map(() => ""),
  };

  if (!name) {
    errors.name = `Full name of the ${label} is required.`;
  }

  if (!positions[0]) {
    errors.positions[0] = "Primary position is required.";
  }

  positions.forEach((position, index) => {
    if (index === 0) return;
    if (!position) return;

    const duplicate = positions.some((otherPosition, otherIndex) => {
      if (otherIndex === index) return false;
      return otherPosition.toLowerCase() === position.toLowerCase();
    });

    if (duplicate) {
      errors.positions[index] = "Duplicate position.";
    }
  });

  return {
    errors,
    hasError: !!errors.name || errors.positions.some(Boolean),
  };
}

function validateDeanForms(forms) {
  const deanForms = Array.isArray(forms) && forms.length > 0 ? forms : [emptyPersonForm()];
  const errors = deanForms.map((form) => validatePersonForm(form, "Dean").errors);

  const cleanedNames = deanForms.map((form) => sanitizeSpacing(form.name));

  cleanedNames.forEach((name, index) => {
    if (!name) return;

    const duplicate = cleanedNames.some((otherName, otherIndex) => {
      if (index === otherIndex) return false;
      return otherName.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
      errors[index].name = "Duplicate dean name.";
    }
  });

  return {
    errors,
    hasError:
      errors.some((error) => error.name || error.positions.some(Boolean)) ||
      deanForms.length === 0,
  };
}


const API_BASE_URL = "http://127.0.0.1:8000/api";

const ORG_MEMBER_TYPE_MAP = {
  executiveDirector: "executive_director",
  academicDirector: "academic_director",
  ailpoCoordinator: "ailpo_coordinator",
};

const ORG_MEMBER_KEY_MAP = {
  executive_director: "executiveDirector",
  academic_director: "academicDirector",
  ailpo_coordinator: "ailpoCoordinator",
};

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
        scope: "organization_chart",
        target_table: "organization_chart_table",
        target_id: metadata.target_id ? String(metadata.target_id) : "",
        metadata,
      }),
    });
  } catch {
    // Audit must not block the main organization chart action.
  }
}

function positionsToPayload(positions) {
  const cleaned = cleanPositions(positions).filter(Boolean).slice(0, MAX_POSITIONS);

  return {
    cleaned,
    primary_position: cleaned[0] || "",
    secondary_position: cleaned[1] || "",
    tertiary_position: cleaned[2] || "",
  };
}

function rowToPerson(row) {
  const positions = [
    row?.primary_position,
    row?.secondary_position,
    row?.tertiary_position,
  ]
    .map((position) => sanitizeSpacing(position))
    .filter(Boolean);

  return {
    id: row?.id,
    name: sanitizeSpacing(row?.full_name),
    positions: positions.length > 0 ? positions : [""],
  };
}

function normalizeSchoolProgram(row) {
  return {
    id: row.id,
    fullName: row.full_name || row.fullName || "",
    code: row.code || "",
    academicProgramCount:
      row.academic_program_count ||
      row.academicProgramCount ||
      row.academic_programs?.length ||
      row.academicPrograms?.length ||
      0,
    academicPrograms: row.academic_programs || row.academicPrograms || [],
    organizationalChart: {
      deans: [],
    },
  };
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Network className="h-6 w-6 text-muted-foreground/40" />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-foreground/70">{title}</p>
        <p className="max-w-md text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function PersonFormModal({
  open,
  title,
  description,
  ownerTitle,
  ownerSubtitle,
  roleLabel,
  roleIcon: RoleIcon = UserRound,
  existing,
  form,
  errors,
  saving,
  onClose,
  onNameChange,
  onPositionChange,
  onAddPosition,
  onRemovePosition,
  onSave,
}) {
  const positions = rawPositions(form?.positions);
  const filledPositionCount = positions.filter((position) =>
    sanitizeSpacing(position),
  ).length;

  const hasExisting = !!sanitizeSpacing(existing?.name);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-3xl p-0">
        <div className="border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${BB}15` }}
            >
              <RoleIcon className="h-5 w-5" style={{ color: BB }} />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold" style={{ color: BB }}>
                {hasExisting ? `Edit ${title}` : `Add ${title}`}
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                {description}
              </DialogDescription>

              <div className="mt-3 rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {ownerTitle || title || "—"}
                    </p>
                    {ownerSubtitle && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ownerSubtitle}
                      </p>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className="w-fit border-[#3D398C]/20 bg-[#3D398C]/5 text-[#3D398C]"
                  >
                    {filledPositionCount} {filledPositionCount === 1 ? "Position" : "Positions"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
          <PersonFields
            form={form}
            errors={errors}
            saving={saving}
            roleLabel={roleLabel}
            roleIcon={RoleIcon}
            onNameChange={onNameChange}
            onPositionChange={onPositionChange}
            onAddPosition={onAddPosition}
            onRemovePosition={onRemovePosition}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={saving}
              onClick={onSave}
              className="gap-1.5"
              style={{ backgroundColor: BB, color: "white" }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {hasExisting ? "Save Changes" : "Save"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PersonFields({
  form,
  errors,
  saving,
  roleLabel,
  roleIcon: RoleIcon = UserRound,
  onNameChange,
  onPositionChange,
  onAddPosition,
  onRemovePosition,
}) {
  const positions = rawPositions(form?.positions);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${BB}10` }}
          >
            <UserRound className="h-4 w-4" style={{ color: BB }} />
          </div>

          <div>
            <p className="text-sm font-bold text-foreground">
              {roleLabel} Information
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Full Name <span className="text-destructive">*</span>
          </Label>

          <Input
            value={form.name}
            disabled={saving}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g., Juan Dela Cruz"
            className={`h-10 bg-background ${
              errors.name
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                : sanitizeSpacing(form.name)
                  ? "border-[#3D398C]/40 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"
                  : "border-input focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"
            }`}
          />

          <div className="min-h-[16px]">
            {errors.name ? (
              <span className="text-[11px] font-medium text-destructive">
                {errors.name}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Full name of the assigned organization member.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {positions.map((position, index) => {
          const isRequired = index === 0;
          const positionError = errors.positions?.[index] || "";

          return (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${BB}10` }}
                  >
                    <RoleIcon className="h-4 w-4" style={{ color: BB }} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-none text-foreground">
                      Position
                    </p>
                    <p className="mt-1 text-[11px] leading-none text-muted-foreground">
                      {isRequired ? "Required" : "Optional"}
                    </p>
                  </div>
                </div>

                {!isRequired && positions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={saving}
                    onClick={() => onRemovePosition(index)}
                    className="h-8 shrink-0 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Position {isRequired && <span className="text-destructive">*</span>}
                </Label>

                <Input
                  value={position}
                  disabled={saving}
                  onChange={(event) => onPositionChange(index, event.target.value)}
                  placeholder={
                    isRequired
                      ? `e.g., ${roleLabel}`
                      : "e.g., Additional title / designation"
                  }
                  className={`h-10 bg-background ${
                    positionError
                      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                      : sanitizeSpacing(position)
                        ? "border-[#3D398C]/40 focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"
                        : "border-input focus-visible:border-[#3D398C] focus-visible:ring-[#3D398C]/20"
                  }`}
                />

                <div className="min-h-[16px]">
                  {positionError ? (
                    <span className="text-[11px] font-medium text-destructive">
                      {positionError}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Official position title for this member.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {positions.length < MAX_POSITIONS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={onAddPosition}
          className="gap-1.5 border-[#3D398C]/20 text-[#3D398C] hover:bg-[#3D398C]/5 hover:text-[#3D398C]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Position
        </Button>
      )}
    </>
  );
}

function DeanFormModal({
  open,
  schoolProgram,
  forms,
  errors,
  saving,
  onClose,
  onAddDean,
  onRemoveDean,
  onNameChange,
  onPositionChange,
  onAddPosition,
  onRemovePosition,
  onSave,
}) {
  const deanForms = Array.isArray(forms) && forms.length > 0 ? forms : [emptyPersonForm()];
  const configuredDeanCount = deanForms.filter((form) => sanitizeSpacing(form.name)).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-5xl p-0">
        <div className="border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${BB}15` }}
            >
              <Crown className="h-5 w-5" style={{ color: BB }} />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold" style={{ color: BB }}>
                Manage Deans
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                Add one or more Deans assigned to this school program. The first Dean will remain the primary Dean for existing MOA generation logic.
              </DialogDescription>

              <div className="mt-3 rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {sanitizeSpacing(schoolProgram?.fullName) || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      School Program Code: {sanitizeCode(schoolProgram?.code) || "—"}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="w-fit border-[#3D398C]/20 bg-[#3D398C]/5 text-[#3D398C]"
                  >
                    {configuredDeanCount} {configuredDeanCount === 1 ? "Dean" : "Deans"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto px-6 py-5">
          {deanForms.map((form, deanIndex) => {
            const deanErrors = errors?.[deanIndex] || {
              name: "",
              positions: rawPositions(form.positions).map(() => ""),
            };
            const isPrimary = deanIndex === 0;

            return (
              <div
                key={deanIndex}
                className="rounded-2xl border border-border bg-muted/20 p-4"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${BB}10` }}
                    >
                      <Crown className="h-4 w-4" style={{ color: BB }} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          Dean {deanIndex + 1}
                        </p>
                        {isPrimary && (
                          <Badge
                            variant="outline"
                            className="border-[#3D398C]/20 bg-[#3D398C]/5 text-[#3D398C]"
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {isPrimary
                          ? "Used as the default Dean in existing records and MOA generation."
                          : "Additional Dean for this school program."}
                      </p>
                    </div>
                  </div>

                  {deanForms.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                      onClick={() => onRemoveDean(deanIndex)}
                      className="h-8 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Dean
                    </Button>
                  )}
                </div>

                <PersonFields
                  form={form}
                  errors={deanErrors}
                  saving={saving}
                  roleLabel="Dean"
                  roleIcon={Crown}
                  onNameChange={(value) => onNameChange(deanIndex, value)}
                  onPositionChange={(positionIndex, value) =>
                    onPositionChange(deanIndex, positionIndex, value)
                  }
                  onAddPosition={() => onAddPosition(deanIndex)}
                  onRemovePosition={(positionIndex) =>
                    onRemovePosition(deanIndex, positionIndex)
                  }
                />
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={onAddDean}
            className="gap-1.5 border-[#3D398C]/20 text-[#3D398C] hover:bg-[#3D398C]/5 hover:text-[#3D398C]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Another Dean
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={saving}
              onClick={onSave}
              className="gap-1.5"
              style={{ backgroundColor: BB, color: "white" }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Deans
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrganizationMembersSection({ members, saving, onEditMember }) {
  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${BB}10` }}
          >
            <UsersRound className="h-4.5 w-4.5" style={{ color: BB }} />
          </div>

          <div>
            <h3 className="text-sm font-bold" style={{ color: BB }}>
              Organization Members
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Manage fixed organization-wide signatories and positions.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {ORG_MEMBER_ORDER.map((memberKey) => {
          const config = ORG_MEMBER_CONFIG[memberKey];
          const Icon = config.icon;
          const member = members?.[memberKey] || null;
          const name = sanitizeSpacing(member?.name);
          const positions = cleanPositions(member?.positions).filter(Boolean);
          const mainPosition = positions[0] || "";
          const hasMember = !!name;

          return (
            <div
              key={memberKey}
              className="flex flex-col gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/25 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${BB}10` }}
                >
                  <Icon className="h-5 w-5" style={{ color: BB }} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {config.label}
                    </p>

                    {!hasMember && (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/20 bg-muted text-muted-foreground"
                      >
                        Not Set
                      </Badge>
                    )}
                  </div>

                  {hasMember ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[13px] font-semibold text-foreground">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mainPosition || "—"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No member assigned yet.
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => onEditMember(memberKey)}
                className="h-8 w-full gap-1.5 text-xs hover:bg-[#3D398C]/5 hover:text-[#3D398C] lg:w-auto"
              >
                <Pencil className="h-3.5 w-3.5" />
                {hasMember ? "Edit" : "Add"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminOrganizationalChart() {
  const [schoolPrograms, setSchoolPrograms] = useState([]);
  const [orgMembers, setOrgMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedMemberKey, setSelectedMemberKey] = useState("");
  const [memberForm, setMemberForm] = useState(emptyPersonForm());
  const [memberErrors, setMemberErrors] = useState({
    name: "",
    positions: [""],
  });

  const [deanModalOpen, setDeanModalOpen] = useState(false);
  const [selectedSchoolProgram, setSelectedSchoolProgram] = useState(null);
  const [deanForms, setDeanForms] = useState([emptyPersonForm()]);
  const [deanErrors, setDeanErrors] = useState([
    {
      name: "",
      positions: [""],
    },
  ]);

  const selectedMemberConfig = selectedMemberKey
    ? ORG_MEMBER_CONFIG[selectedMemberKey]
    : null;

  const schoolProgramCount = schoolPrograms.length;

  const assignedDeanCount = schoolPrograms.reduce((total, item) => {
    return total + getDeanList(item).length;
  }, 0);

  const configuredOrgMemberCount = ORG_MEMBER_ORDER.filter((key) =>
    sanitizeSpacing(orgMembers?.[key]?.name),
  ).length;

  const totalPositionCount = schoolPrograms.reduce((total, item) => {
    return (
      total +
      getDeanList(item).reduce((deanTotal, dean) => {
        return deanTotal + dean.positions.filter((position) => sanitizeSpacing(position)).length;
      }, 0)
    );
  }, 0);

  async function fetchOrganizationMembers() {
    const data = await apiRequest("/organization-chart/");
    const rows = normalizeListResponse(data);

    const nextMembers = {};

    rows
      .filter((row) => !row.school_program && row.member_type !== "dean")
      .forEach((row) => {
        const memberKey = ORG_MEMBER_KEY_MAP[row.member_type];
        if (!memberKey) return;
        nextMembers[memberKey] = rowToPerson(row);
      });

    setOrgMembers(nextMembers);
  }

  async function fetchSchoolPrograms() {
    const [schoolData, chartData] = await Promise.all([
      apiRequest("/school-programs/"),
      apiRequest("/organization-chart/"),
    ]);

    const schools = normalizeListResponse(schoolData).map(normalizeSchoolProgram);
    const chartRows = normalizeListResponse(chartData);

    const deansBySchoolProgram = chartRows
      .filter((row) => row.member_type === "dean" && row.school_program)
      .reduce((acc, row) => {
        const schoolId = String(row.school_program);
        if (!acc[schoolId]) acc[schoolId] = [];
        acc[schoolId].push(rowToPerson(row));
        return acc;
      }, {});

    setSchoolPrograms(
      schools.map((school) => {
        const deans = deansBySchoolProgram[String(school.id)] || [];
        return {
          ...school,
          organizationalChart: {
            dean: deans[0] || null,
            deans,
          },
        };
      }),
    );
  }

  async function fetchAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([fetchSchoolPrograms(), fetchOrganizationMembers()]);
    } catch (err) {
      console.error("Failed to load organizational chart records:", err);
      const message = err?.message || "Failed to load organizational chart.";
      setError(message);
      toast.error("Failed to load records", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function openMemberModal(memberKey) {
    const config = ORG_MEMBER_CONFIG[memberKey];
    const initialForm = normalizePersonForm(
      orgMembers?.[memberKey] || {
        name: "",
        positions: [config?.label || ""],
      },
    );

    setSelectedMemberKey(memberKey);
    setMemberForm(initialForm);
    setMemberErrors({
      name: "",
      positions: rawPositions(initialForm.positions).map(() => ""),
    });
    setMemberModalOpen(true);
  }

  function closeMemberModal() {
    if (saving) return;

    setMemberModalOpen(false);
    setSelectedMemberKey("");
    setMemberForm(emptyPersonForm());
    setMemberErrors({
      name: "",
      positions: [""],
    });
  }

  function handleMemberNameChange(value) {
    setMemberForm((prev) => {
      const next = {
        ...prev,
        name: value,
      };

      const validation = validatePersonForm(
        next,
        selectedMemberConfig?.label || "Member",
      );
      setMemberErrors(validation.errors);

      return next;
    });
  }

  function handleMemberPositionChange(index, value) {
    setMemberForm((prev) => {
      const currentPositions = rawPositions(prev.positions);

      const nextPositions = currentPositions.map((position, positionIndex) => {
        if (positionIndex !== index) return position;
        return value;
      });

      const next = {
        ...prev,
        positions: nextPositions,
      };

      const validation = validatePersonForm(
        next,
        selectedMemberConfig?.label || "Member",
      );
      setMemberErrors(validation.errors);

      return next;
    });
  }

  function addMemberPosition() {
    setMemberForm((prev) => {
      const currentPositions = rawPositions(prev.positions);

      if (currentPositions.length >= MAX_POSITIONS) return prev;

      const next = {
        ...prev,
        positions: [...currentPositions, ""],
      };

      const validation = validatePersonForm(
        next,
        selectedMemberConfig?.label || "Member",
      );
      setMemberErrors(validation.errors);

      return next;
    });
  }

  function removeMemberPosition(index) {
    setMemberForm((prev) => {
      if (index === 0) return prev;

      const currentPositions = rawPositions(prev.positions);
      const nextPositions = currentPositions.filter(
        (_, positionIndex) => positionIndex !== index,
      );

      const next = {
        ...prev,
        positions: nextPositions.length > 0 ? nextPositions : [""],
      };

      const validation = validatePersonForm(
        next,
        selectedMemberConfig?.label || "Member",
      );
      setMemberErrors(validation.errors);

      return next;
    });
  }

  async function handleSaveMember() {
    if (!selectedMemberKey || !selectedMemberConfig) return;

    const validation = validatePersonForm(memberForm, selectedMemberConfig.label);
    setMemberErrors(validation.errors);

    if (validation.hasError) {
      toast.error("Please complete the required fields", {
        description:
          "Full name and primary position are required. Optional positions cannot be duplicates.",
      });
      return;
    }

    const cleanedName = sanitizeSpacing(memberForm.name);
    const positionPayload = positionsToPayload(memberForm.positions);
    const memberType = ORG_MEMBER_TYPE_MAP[selectedMemberKey] || "other";
    const existingId = orgMembers?.[selectedMemberKey]?.id;

    setSaving(true);
    setError("");

    try {
      const payload = {
        school_program: null,
        member_type: memberType,
        full_name: cleanedName,
        primary_position: positionPayload.primary_position,
        secondary_position: positionPayload.secondary_position,
        tertiary_position: positionPayload.tertiary_position,
        display_order: ORG_MEMBER_ORDER.indexOf(selectedMemberKey) + 1,
        status: "active",
      };

      let savedMember;

      if (existingId) {
        savedMember = await apiRequest(`/organization-chart/${existingId}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        savedMember = await apiRequest("/organization-chart/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await logSystemAudit(
        existingId ? "UPDATE_ORGANIZATION_MEMBER" : "CREATE_ORGANIZATION_MEMBER",
        `${existingId ? "Updated" : "Created"} ${selectedMemberConfig.label}: "${cleanedName}"`,
        {
          target_id: savedMember?.id || existingId,
          member_key: selectedMemberKey,
          member_type: memberType,
          member_name: cleanedName,
          position_count: positionPayload.cleaned.length,
        },
      );

      toast.success(`${selectedMemberConfig.label} saved successfully`, {
        description: `"${cleanedName}" has been updated.`,
      });

      closeMemberModal();
      await fetchOrganizationMembers();
    } catch (err) {
      console.error("Failed to save organization member:", err);
      const message = err?.message || "Failed to save organization member.";
      setError(message);
      toast.error("Failed to save", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  function openDeanModal(schoolProgram) {
    const initialForms = getInitialDeanForms(schoolProgram);

    setSelectedSchoolProgram(schoolProgram);
    setDeanForms(initialForms);
    setDeanErrors(
      initialForms.map((form) => ({
        name: "",
        positions: rawPositions(form.positions).map(() => ""),
      })),
    );
    setDeanModalOpen(true);
  }

  function closeDeanModal() {
    if (saving) return;

    setDeanModalOpen(false);
    setSelectedSchoolProgram(null);
    setDeanForms([emptyPersonForm()]);
    setDeanErrors([
      {
        name: "",
        positions: [""],
      },
    ]);
  }

  function revalidateDeanForms(nextForms) {
    const validation = validateDeanForms(nextForms);
    setDeanErrors(validation.errors);
  }

  function handleDeanNameChange(deanIndex, value) {
    setDeanForms((prev) => {
      const next = prev.map((form, index) => {
        if (index !== deanIndex) return form;

        return {
          ...form,
          name: value,
        };
      });

      revalidateDeanForms(next);
      return next;
    });
  }

  function handleDeanPositionChange(deanIndex, positionIndex, value) {
    setDeanForms((prev) => {
      const next = prev.map((form, index) => {
        if (index !== deanIndex) return form;

        const currentPositions = rawPositions(form.positions);
        const nextPositions = currentPositions.map((position, currentIndex) => {
          if (currentIndex !== positionIndex) return position;
          return value;
        });

        return {
          ...form,
          positions: nextPositions,
        };
      });

      revalidateDeanForms(next);
      return next;
    });
  }

  function addDeanPosition(deanIndex) {
    setDeanForms((prev) => {
      const next = prev.map((form, index) => {
        if (index !== deanIndex) return form;

        const currentPositions = rawPositions(form.positions);
        if (currentPositions.length >= MAX_POSITIONS) return form;

        return {
          ...form,
          positions: [...currentPositions, ""],
        };
      });

      revalidateDeanForms(next);
      return next;
    });
  }

  function removeDeanPosition(deanIndex, positionIndex) {
    setDeanForms((prev) => {
      const next = prev.map((form, index) => {
        if (index !== deanIndex) return form;
        if (positionIndex === 0) return form;

        const currentPositions = rawPositions(form.positions);
        const nextPositions = currentPositions.filter(
          (_, currentIndex) => currentIndex !== positionIndex,
        );

        return {
          ...form,
          positions: nextPositions.length > 0 ? nextPositions : [""],
        };
      });

      revalidateDeanForms(next);
      return next;
    });
  }

  function addDean() {
    setDeanForms((prev) => {
      const next = [...prev, emptyPersonForm()];
      revalidateDeanForms(next);
      return next;
    });
  }

  function removeDean(deanIndex) {
    setDeanForms((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, index) => index !== deanIndex);
      revalidateDeanForms(next);
      return next;
    });
  }

  async function handleSaveDean() {
    if (!selectedSchoolProgram?.id) return;

    const validation = validateDeanForms(deanForms);
    setDeanErrors(validation.errors);

    if (validation.hasError) {
      toast.error("Please complete the required fields", {
        description:
          "Each Dean needs a full name and primary position. Duplicate Dean names or duplicate positions are not allowed.",
      });
      return;
    }

    const cleanedDeans = deanForms
      .map((form) => {
        const positionPayload = positionsToPayload(form.positions);
        return {
          id: form.id,
          name: sanitizeSpacing(form.name),
          positions: positionPayload.cleaned,
          payload: positionPayload,
        };
      })
      .filter((dean) => dean.name);

    const primaryDean = cleanedDeans[0] || {
      name: "",
      positions: [],
    };

    setSaving(true);
    setError("");

    try {
      const existingRows = normalizeListResponse(
        await apiRequest(
          `/organization-chart/?school_program_id=${selectedSchoolProgram.id}&member_type=dean`,
        ),
      );

      await Promise.all(
        existingRows.map((row) =>
          apiRequest(`/organization-chart/${row.id}/`, {
            method: "DELETE",
          }),
        ),
      );

      const createdRows = await Promise.all(
        cleanedDeans.map((dean, index) =>
          apiRequest("/organization-chart/", {
            method: "POST",
            body: JSON.stringify({
              school_program: selectedSchoolProgram.id,
              member_type: "dean",
              full_name: dean.name,
              primary_position: dean.payload.primary_position,
              secondary_position: dean.payload.secondary_position,
              tertiary_position: dean.payload.tertiary_position,
              display_order: index + 1,
              status: "active",
            }),
          }),
        ),
      );

      await logSystemAudit(
        "UPDATE_ORGANIZATION_DEANS",
        `Updated ${cleanedDeans.length} Dean record(s) for "${sanitizeSpacing(
          selectedSchoolProgram.fullName,
        )}"`,
        {
          school_program_id: selectedSchoolProgram.id,
          school_program_name: sanitizeSpacing(selectedSchoolProgram.fullName),
          dean_count: cleanedDeans.length,
          primary_dean_name: primaryDean.name,
          position_count: cleanedDeans.reduce(
            (total, dean) => total + dean.positions.length,
            0,
          ),
          created_ids: createdRows.map((row) => row.id),
        },
      );

      toast.success("Dean information saved successfully", {
        description: `${sanitizeSpacing(selectedSchoolProgram.fullName)} now has ${
          cleanedDeans.length
        } ${cleanedDeans.length === 1 ? "Dean" : "Deans"}.`,
      });

      closeDeanModal();
      await fetchSchoolPrograms();
    } catch (err) {
      console.error("Failed to save dean information:", err);
      const message = err?.message || "Failed to save dean information.";
      setError(message);
      toast.error("Failed to save", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <PersonFormModal
        open={memberModalOpen}
        title={selectedMemberConfig?.label || "Organization Member"}
        description="Manage this organization-wide member. Full name and primary position are required. You may add up to three position fields."
        ownerTitle={selectedMemberConfig?.label || "Organization Member"}
        ownerSubtitle="Organization-wide role"
        roleLabel={selectedMemberConfig?.label || "Member"}
        roleIcon={selectedMemberConfig?.icon || UserRound}
        existing={
          selectedMemberKey ? orgMembers?.[selectedMemberKey] || null : null
        }
        form={memberForm}
        errors={memberErrors}
        saving={saving}
        onClose={closeMemberModal}
        onNameChange={handleMemberNameChange}
        onPositionChange={handleMemberPositionChange}
        onAddPosition={addMemberPosition}
        onRemovePosition={removeMemberPosition}
        onSave={handleSaveMember}
      />

      <DeanFormModal
        open={deanModalOpen}
        schoolProgram={selectedSchoolProgram}
        forms={deanForms}
        errors={deanErrors}
        saving={saving}
        onClose={closeDeanModal}
        onAddDean={addDean}
        onRemoveDean={removeDean}
        onNameChange={handleDeanNameChange}
        onPositionChange={handleDeanPositionChange}
        onAddPosition={addDeanPosition}
        onRemovePosition={removeDeanPosition}
        onSave={handleSaveDean}
      />

      {error && (
        <div className="animate-in fade-in-50 slide-in-from-top-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive duration-200">
          {error}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Building2,
              color: BB,
              val: schoolProgramCount,
              label: "School Programs",
              desc: "Available school groups",
            },
            {
              icon: Crown,
              color: BB,
              val: assignedDeanCount,
              label: "Assigned Deans",
              desc: "Total saved dean records",
            },
            {
              icon: UsersRound,
              color: BB,
              val: configuredOrgMemberCount,
              label: "Organization Members",
              desc: "Configured fixed roles",
            },
            {
              icon: Network,
              color: BB,
              val: totalPositionCount,
              label: "Dean Positions",
              desc: "Total saved dean titles",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="select-none group rounded-2xl border border-border bg-card px-8 py-5 shadow-sm transition-all duration-200 cursor-default min-h-[120px]"
                onMouseEnter={(event) =>
                  (event.currentTarget.style.borderColor = `${item.color}33`)
                }
                onMouseLeave={(event) =>
                  (event.currentTarget.style.borderColor = "")
                }
              >
                <div className="flex h-full flex-col gap-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-foreground/80">
                      {item.label}
                    </p>

                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${item.color}1A` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                  </div>

                  <p
                    className="text-3xl font-bold leading-none tracking-tight"
                    style={{ color: item.color }}
                  >
                    {item.val}
                  </p>

                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="animate-in fade-in-50 slide-in-from-bottom-2 rounded-lg border border-border bg-muted/30 p-3 duration-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${BB}10` }}
            >
              <Network className="h-4.5 w-4.5" style={{ color: BB }} />
            </div>

            <div>
              <h2 className="text-sm font-bold" style={{ color: BB }}>
                Manage Organizational Chart
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Manage organization-wide members and school program deans.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading || saving}
            className="h-9 gap-1.5 font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[#3D398C]" />

            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-foreground/70">
                Loading organizational chart...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fetching organization records
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <OrganizationMembersSection
            members={orgMembers}
            saving={saving}
            onEditMember={openMemberModal}
          />

          {schoolPrograms.length === 0 ? (
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
              <EmptyState
                title="No school programs found"
                description="Add school programs first in Academic Records before managing the organizational chart."
              />
            </div>
          ) : (
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-300">
              <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${BB}10` }}
                  >
                    <Building2 className="h-4.5 w-4.5" style={{ color: BB }} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold" style={{ color: BB }}>
                      School Programs
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Click a card to add or edit the Deans assigned to the
                      school program.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {schoolPrograms.map((item) => {
                  const deanList = getDeanList(item);
                  const hasDean = deanList.length > 0;
                  const primaryDean = deanList[0] || null;
                  const mainPosition = sanitizeSpacing(
                    primaryDean?.positions?.[0] || "",
                  );
                  const extraDeanCount = Math.max(deanList.length - 1, 0);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openDeanModal(item)}
                      disabled={saving}
                      className="animate-in fade-in-50 slide-in-from-bottom-2 overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:border-[#3D398C]/25 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${BB}10` }}
                              >
                                <Building2 className="h-4.5 w-4.5" style={{ color: BB }} />
                              </div>

                              <span
                                className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide"
                                style={{
                                  backgroundColor: `${BB}10`,
                                  color: BB,
                                }}
                              >
                                {sanitizeCode(item.code) || "—"}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold leading-snug text-foreground">
                              {sanitizeSpacing(item.fullName) || "—"}
                            </h4>

                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {item.academicProgramCount || 0} {" "}
                              {(item.academicProgramCount || 0) === 1
                                ? "academic program"
                                : "academic programs"}
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className={
                              hasDean
                                ? "border-[#3D398C]/20 bg-[#3D398C]/5 text-[#3D398C]"
                                : "border-muted-foreground/20 bg-muted text-muted-foreground"
                            }
                          >
                            {hasDean
                              ? `${deanList.length} ${deanList.length === 1 ? "Dean" : "Deans"}`
                              : "Not Set"}
                          </Badge>
                        </div>

                        <div className="mt-4 rounded-lg border border-border bg-muted/25 px-3 py-3">
                          {hasDean ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <div
                                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                                  style={{ backgroundColor: `${BB}10` }}
                                >
                                  <Crown className="h-3.5 w-3.5" style={{ color: BB }} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="truncate text-xs font-semibold text-foreground">
                                      {primaryDean.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="border-[#3D398C]/20 bg-[#3D398C]/5 px-1.5 py-0 text-[9px] text-[#3D398C]"
                                    >
                                      Primary
                                    </Badge>
                                  </div>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {mainPosition || "—"}
                                  </p>
                                </div>
                              </div>

                              {extraDeanCount > 0 && (
                                <div className="space-y-1 border-t border-border pt-2">
                                  {deanList.slice(1, 3).map((dean, index) => (
                                    <div
                                      key={`${dean.name}-${index}`}
                                      className="flex items-center gap-2 text-[11px] text-muted-foreground"
                                    >
                                      <Crown className="h-3 w-3" />
                                      <span className="truncate font-medium text-foreground/80">
                                        {dean.name}
                                      </span>
                                      <span className="truncate">
                                        {dean.positions?.[0] || "—"}
                                      </span>
                                    </div>
                                  ))}
                                  {deanList.length > 3 && (
                                    <p className="text-[11px] text-muted-foreground">
                                      +{deanList.length - 3} more Dean record(s)
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <Crown className="h-3.5 w-3.5" />
                              No dean assigned yet.
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center text-[11px] font-medium text-muted-foreground">
                          {hasDean
                            ? "Click to edit Dean records"
                            : "Click to add Dean information"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
