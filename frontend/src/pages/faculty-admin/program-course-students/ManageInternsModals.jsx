import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  GraduationCap,
  IdCard,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

function safe(value) {
  return String(value ?? "").trim();
}

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

export function UserModal({ user, open, onClose }) {
  if (!user) return null;

  const isActive = safe(user.status).toLowerCase() === "active";

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose?.()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-border p-0 shadow-2xl [&>button]:hidden">
        <div className="border-b border-border bg-[#3D398C]/5 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-foreground">
                  {safe(user.fullName) || "Intern Record"}
                </h2>

                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Registered
                </Badge>

                <Badge
                  variant="outline"
                  className={
                    isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }
                >
                  {isActive ? "Active" : "Suspended"}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {safe(user.email) || "No NU email"}
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
            <InfoItem icon={UserCheck} label="Full Name" value={user.fullName} />
            <InfoItem icon={Mail} label="NU Email" value={user.email} />
            <InfoItem icon={IdCard} label="Student ID" value={user.studentId} />
            <InfoItem icon={GraduationCap} label="Course" value={user.course} />
            <InfoItem label="Gender" value={user.gender} />
            <InfoItem
              icon={isActive ? ShieldCheck : ShieldAlert}
              label="Status"
              value={isActive ? "Active" : "Suspended"}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SuspendReasonModal() {
  return null;
}

export function ConfirmActionModal() {
  return null;
}
