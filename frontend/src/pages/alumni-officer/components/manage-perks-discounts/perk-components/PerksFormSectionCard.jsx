import { Card, CardContent } from "@/components/ui/card";

export function SectionHeader({ icon: Icon, title, helper }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3D398C]/10">
        <Icon className="h-4 w-4 text-[#3D398C]" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {helper ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FormField({ label, required, error, helper, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>

      {children}

      <div className="min-h-[14px]">
        {error ? (
          <span className="text-[11px] font-medium text-destructive">
            {error}
          </span>
        ) : helper ? (
          <span className="text-[11px] text-muted-foreground">{helper}</span>
        ) : null}
      </div>
    </div>
  );
}

export function ReviewRow({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

export function PerksFormSectionCard({
  icon,
  title,
  helper,
  children,
  className = "",
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card px-5 py-5 ${className}`}>
      <SectionHeader icon={icon} title={title} helper={helper} />
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function PerksShellCard({ children }) {
  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}