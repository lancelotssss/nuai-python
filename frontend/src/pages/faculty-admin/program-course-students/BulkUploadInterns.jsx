import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BB = "#3D398C";

function safe(value) {
  return String(value ?? "").trim();
}

function norm(value) {
  return safe(value).toLowerCase();
}

function normalizeGender(value) {
  const raw = norm(value);

  if (!raw) return "";
  if (["male", "m"].includes(raw)) return "Male";
  if (["female", "f"].includes(raw)) return "Female";
  if (["prefer not to say", "prefer-not-to-say", "n/a", "na"].includes(raw)) {
    return "Prefer not to say";
  }

  return safe(value);
}

function validateEmail(value) {
  const email = norm(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateStudentId(value) {
  return /^20\d{2}-\d{5,7}$/.test(safe(value));
}

function validateRow(row = {}) {
  const errors = [];

  if (!safe(row.studentId)) {
    errors.push("Student ID is required.");
  } else if (!validateStudentId(row.studentId)) {
    errors.push("Student ID must follow the format 20XX-XXXXXX.");
  }

  if (!safe(row.nuEmail)) {
    errors.push("NU Email is required.");
  } else if (!validateEmail(row.nuEmail)) {
    errors.push("NU Email format is invalid.");
  }

  if (!safe(row.fullName)) {
    errors.push("Full Name is required.");
  }

  if (!safe(row.gender)) {
    errors.push("Gender is required.");
  }

  if (!safe(row.course)) {
    errors.push("Course Code is required.");
  }

  return errors;
}

function StatCard({ title, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-border bg-card text-foreground";

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold leading-none">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, error, required = false, readOnly = false }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        className={[
          "h-9 text-sm",
          readOnly ? "bg-muted/40 text-muted-foreground" : "bg-background",
          error ? "border-destructive bg-red-50/40" : "",
        ].join(" ")}
      />
      <div className="min-h-[16px]">
        {error ? (
          <p className="text-[11px] font-medium text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function BulkUploadInterns({
  open,
  rows = [],
  fileName = "",
  onRowsChange,
  onRequestClose,
  onRequestContinue,
  bulkSaving = false,
}) {
  const [draftRows, setDraftRows] = useState([]);

  useEffect(() => {
    setDraftRows(Array.isArray(rows) ? rows : []);
  }, [rows]);

  const rowsWithStatus = useMemo(() => {
    const seenStudentIds = new Set();
    const seenEmails = new Set();

    return draftRows.map((row) => {
      const duplicateReasons = [...(row.duplicateReasons || [])];
      const sid = norm(row.studentId);
      const email = norm(row.nuEmail);

      if (sid && seenStudentIds.has(sid)) {
        duplicateReasons.push("Duplicate Student ID inside file");
      }

      if (email && seenEmails.has(email)) {
        duplicateReasons.push("Duplicate NU Email inside file");
      }

      if (sid) seenStudentIds.add(sid);
      if (email) seenEmails.add(email);

      const errors = validateRow(row);

      return {
        ...row,
        errors,
        duplicateReasons: Array.from(new Set(duplicateReasons)),
        isInvalid: errors.length > 0,
        isDuplicate: duplicateReasons.length > 0,
      };
    });
  }, [draftRows]);

  const validCount = rowsWithStatus.filter(
    (row) => !row.isInvalid && !row.isDuplicate,
  ).length;
  const duplicateCount = rowsWithStatus.filter((row) => row.isDuplicate).length;
  const invalidCount = rowsWithStatus.filter((row) => row.isInvalid).length;

  function emit(nextRows) {
    setDraftRows(nextRows);
    onRowsChange?.(nextRows);
  }

  function patchRow(rowKey, field, value) {
    emit(
      draftRows.map((row) =>
        row._rowKey === rowKey
          ? {
              ...row,
              [field]: field === "gender" ? normalizeGender(value) : value,
            }
          : row,
      ),
    );
  }

  function removeRow(rowKey) {
    emit(draftRows.filter((row) => row._rowKey !== rowKey));
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onRequestClose?.()}>
      <DialogContent className="h-[86vh] max-w-4xl overflow-hidden rounded-2xl border border-border p-0 shadow-2xl [&>button]:hidden">
        <div className="flex h-full min-h-0 flex-col bg-background">
          <div className="shrink-0 border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#3D398C] text-white shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Bulk Import Review
                  </h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {fileName || "Review imported intern records before uploading them."}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[#3D398C]">
                    Only Student ID, NU Email, Full Name, Gender, and Course Code are required.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={bulkSaving}
                onClick={onRequestClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="shrink-0 border-b border-border bg-background px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard title="Valid Imports" value={validCount} tone="success" />
              <StatCard title="Duplicates" value={duplicateCount} tone="warning" />
              <StatCard title="Invalid Imports" value={invalidCount} tone="danger" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {rowsWithStatus.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-foreground/80">
                  No imports found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rowsWithStatus.map((row, index) => {
                  const firstError = row.errors?.[0] || "";
                  const isReady = !row.isInvalid && !row.isDuplicate;

                  return (
                    <section
                      key={row._rowKey}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              Intern #{index + 1}
                            </h3>
                            <Badge
                              variant="outline"
                              className={
                                isReady
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : row.isDuplicate
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                              }
                            >
                              {isReady ? "Ready" : row.isDuplicate ? "Duplicate" : "Invalid Import"}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              Row {row.rowNumber || index + 2}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Review this imported intern record before upload.
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={bulkSaving}
                          onClick={() => removeRow(row._rowKey)}
                          className="h-8 gap-1.5 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>

                      {(firstError || row.duplicateReasons?.length > 0) ? (
                        <div className="px-4 pt-3">
                          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                              {firstError || row.duplicateReasons?.join(", ")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 pt-3">
                          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>This row is ready to upload.</span>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-x-4 gap-y-1 px-4 py-4 sm:grid-cols-2">
                        <Field
                          label="Student ID"
                          required
                          value={row.studentId}
                          error={row.errors?.find((item) => item.includes("Student ID"))}
                          onChange={(value) => patchRow(row._rowKey, "studentId", value)}
                        />
                        <Field
                          label="NU Email"
                          required
                          value={row.nuEmail}
                          error={row.errors?.find((item) => item.includes("NU Email"))}
                          onChange={(value) => patchRow(row._rowKey, "nuEmail", norm(value))}
                        />
                        <Field
                          label="Full Name"
                          required
                          value={row.fullName}
                          error={row.errors?.find((item) => item.includes("Full Name"))}
                          onChange={(value) => patchRow(row._rowKey, "fullName", value)}
                        />
                        <Field
                          label="Gender"
                          required
                          value={row.gender}
                          error={row.errors?.find((item) => item.includes("Gender"))}
                          onChange={(value) => patchRow(row._rowKey, "gender", value)}
                        />
                        <Field
                          label="Course Code"
                          required
                          value={row.course}
                          error={row.errors?.find((item) => item.includes("Course"))}
                          onChange={(value) => patchRow(row._rowKey, "course", value)}
                        />
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-background/95 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-emerald-700">{validCount}</span> valid
                <span className="mx-2 text-muted-foreground/40">•</span>
                <span className="font-medium text-amber-700">{duplicateCount}</span> duplicates
                <span className="mx-2 text-muted-foreground/40">•</span>
                <span className="font-medium text-red-600">{invalidCount}</span> invalid
                {duplicateCount > 0 && invalidCount === 0 ? (
                  <>
                    <span className="mx-2 text-muted-foreground/40">•</span>
                    <span className="font-medium text-amber-700">Duplicates will be skipped</span>
                  </>
                ) : null}
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={bulkSaving}
                  onClick={onRequestClose}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={bulkSaving || rowsWithStatus.length === 0 || invalidCount > 0}
                  onClick={() => onRequestContinue?.(rowsWithStatus)}
                  style={{ backgroundColor: BB }}
                  className="gap-1.5 text-white hover:opacity-90"
                >
                  {bulkSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Continue to Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
