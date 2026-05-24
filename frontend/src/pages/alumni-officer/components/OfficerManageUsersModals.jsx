import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  IdCard,
  Mail,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import {
  displayStatus,
  formatDate,
  getAlumniName,
  safe,
} from "./officerManageUsersUtils";

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <p className="break-words text-sm font-semibold text-foreground">
        {safe(value) || "—"}
      </p>
    </div>
  );
}

export function AlumniQuickViewModal({ user, open, onClose, onViewProfile }) {
  if (!user) return null;

  const isActive = String(user.status || "active").toLowerCase() === "active";
  const isPreRegistered = user.sourceType === "unregistered";

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-border p-0 shadow-2xl [&>button]:hidden">
        <div className="border-b border-border bg-[#3D398C]/5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-foreground">
                  {getAlumniName(user)}
                </h2>
                <Badge
                  variant="outline"
                  className={
                    isPreRegistered
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                  }
                >
                  {displayStatus(user.status)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {user.email || "No email available"}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem icon={UserRound} label="Full Name" value={getAlumniName(user)} />
            <InfoItem icon={IdCard} label="Student ID" value={user.studentId} />
            <InfoItem icon={Mail} label="NU Email" value={user.email} />
            <InfoItem icon={Phone} label="Contact Number" value={user.contactNumber} />
            <InfoItem icon={GraduationCap} label="Course" value={user.course} />
            <InfoItem icon={GraduationCap} label="Graduation Period" value={user.graduationYear} />
            <InfoItem label="Academic Award" value={user.academicAward} />
            <InfoItem label="Loyalty" value={user.loyalty} />
            <InfoItem label="Created At" value={formatDate(user.createdAt)} />
            <InfoItem label="Updated At" value={formatDate(user.updatedAt)} />
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isPreRegistered ? (
            <Button
              type="button"
              onClick={onViewProfile}
              className="bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
            >
              View Full Profile
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkUploadSummaryModal({ open, summary, onClose }) {
  const duplicates = Array.isArray(summary?.duplicates) ? summary.duplicates : [];
  const invalidRows = Array.isArray(summary?.invalidRows) ? summary.invalidRows : [];

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-border p-0 shadow-2xl [&>button]:hidden">
        <div className="border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3D398C] text-white shadow-sm">
                <FileSpreadsheet className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Bulk Upload Summary
                </h2>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {summary?.fileName || "Uploaded file"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Total Rows
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {summary?.totalRows || 0}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Uploaded
                </p>
              </div>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {summary?.uploadedCount || 0}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                  Duplicates
                </p>
              </div>
              <p className="mt-1 text-xl font-bold text-amber-700">
                {summary?.duplicateCount || 0}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                <p className="text-[11px] font-medium uppercase tracking-wide text-red-700">
                  Failed
                </p>
              </div>
              <p className="mt-1 text-xl font-bold text-red-700">
                {summary?.invalidCount || 0}
              </p>
            </div>
          </div>

          {duplicates.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60">
              <div className="border-b border-amber-200 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  Duplicate Rows
                </p>
                <p className="text-[11px] text-amber-700/80">
                  Showing up to 20 duplicate rows only.
                </p>
              </div>

              <div className="max-h-44 overflow-y-auto px-4 py-3">
                <div className="space-y-2">
                  {duplicates.map((item, index) => (
                    <div
                      key={`${item.rowNumber}-${index}`}
                      className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs"
                    >
                      <p className="font-semibold text-foreground">
                        Row {item.rowNumber}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {item.studentId || "No Student ID"} • {item.nuEmail || "No NU Email"}
                      </p>
                      <p className="mt-1 text-[11px] text-amber-700">
                        {(item.reasons || []).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {invalidRows.length > 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/60">
              <div className="border-b border-red-200 px-4 py-3">
                <p className="text-sm font-semibold text-red-800">
                  Failed Rows
                </p>
                <p className="text-[11px] text-red-700/80">
                  Showing up to 20 failed rows only.
                </p>
              </div>

              <div className="max-h-44 overflow-y-auto px-4 py-3">
                <div className="space-y-2">
                  {invalidRows.map((item, index) => (
                    <div
                      key={`${item.rowNumber}-${index}`}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs"
                    >
                      <p className="font-semibold text-foreground">
                        Row {item.rowNumber}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {item.studentId || "No Student ID"} • {item.nuEmail || "No NU Email"}
                      </p>
                      <p className="mt-1 text-[11px] text-red-700">
                        {(item.errors || []).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function BulkUploadReviewModal({
  open,
  fileName,
  rows = [],
  saving = false,
  onClose,
  onContinue,
}) {
  const validRows = rows.filter(
    (row) => !(row.errors || []).length && !(row.duplicateReasons || []).length,
  );
  const duplicateRows = rows.filter((row) => (row.duplicateReasons || []).length > 0);
  const invalidRows = rows.filter((row) => (row.errors || []).length > 0);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && !saving && onClose()}>
      <DialogContent className="w-[94vw] !max-w-6xl overflow-hidden rounded-2xl border border-border p-0 shadow-2xl [&>button]:hidden">
        <div className="border-b border-[#3D398C]/10 bg-[#3D398C]/5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3D398C] text-white shadow-sm">
                <FileSpreadsheet className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Review Alumni Pre-Registration Upload
                </h2>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {fileName || "Selected file"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={saving}
              className="h-8 w-8 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Total Rows
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">{rows.length}</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                Valid Imports
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {validRows.length}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                Duplicates
              </p>
              <p className="mt-1 text-xl font-bold text-amber-700">
                {duplicateRows.length}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-red-700">
                Invalid Rows
              </p>
              <p className="mt-1 text-xl font-bold text-red-700">
                {invalidRows.length}
              </p>
            </div>
          </div>

          <div className="max-h-[52vh] overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted/60">
                <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Full Name</th>
                  <th className="px-3 py-2">NU Email</th>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Graduation</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-28 text-center text-muted-foreground">
                      No rows parsed from the selected file.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const errors = row.errors || [];
                    const duplicates = row.duplicateReasons || [];
                    const isInvalid = errors.length > 0;
                    const isDuplicate = duplicates.length > 0;
                    const statusText = isInvalid
                      ? "Invalid"
                      : isDuplicate
                        ? "Duplicate"
                        : "Valid";

                    return (
                      <tr key={row._rowKey || index} className="border-b border-border/60">
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {row._sourceRowNumber || index + 2}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium tabular-nums">
                          {safe(row.studentId) || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          {[row.firstName, row.middleName, row.lastName]
                            .map(safe)
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {safe(row.nuEmail) || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {safe(row.courseGraduated) || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {safe(row.graduationPeriod) || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={
                              isInvalid
                                ? "border-red-200 bg-red-50 text-red-700"
                                : isDuplicate
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }
                          >
                            {statusText}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-muted-foreground">
                          {isInvalid
                            ? errors.join(", ")
                            : isDuplicate
                              ? duplicates.join(", ")
                              : "Ready to upload"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {invalidRows.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              Invalid rows will not be uploaded. Fix the file and re-upload if these records are needed.
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="button"
            disabled={saving || rows.length === 0}
            onClick={() => onContinue(rows)}
            className="bg-[#3D398C] text-white hover:bg-[#3D398C]/90"
          >
            {saving ? "Uploading..." : "Continue to Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
