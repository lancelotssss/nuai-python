import { FileText, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function SectionHeader({ icon: Icon, title, helper }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D398C]/10">
        <Icon className="h-5 w-5 text-[#3D398C]" />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </div>
    </div>
  );
}

function FormField({ label, required = false, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function getInputClass(hasError, extra = "") {
  return [
    extra,
    hasError
      ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
      : "border-input focus-visible:border-[#3D398C]/40 focus-visible:ring-[#3D398C]/10",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function EventBasicDetails({
  form,
  errors,
  onChange,
  onBlur,
}) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <SectionHeader
        icon={FileText}
        title="Step 1: Basic Details"
        helper="Add the main event information that users will see first."
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField label="Event Title" required error={errors.title}>
            <Input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              onBlur={() => onBlur("title")}
              placeholder="Enter event title"
              className={getInputClass(Boolean(errors.title), "h-11 rounded-xl")}
            />
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="Event Content" required error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              onBlur={() => onBlur("description")}
              placeholder="Write the event details here"
              className={getInputClass(
                Boolean(errors.description),
                "min-h-[140px] rounded-xl"
              )}
            />
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="Location" required error={errors.location}>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.location}
                onChange={(e) => onChange("location", e.target.value)}
                onBlur={() => onBlur("location")}
                placeholder="Enter venue or location"
                className={getInputClass(
                  Boolean(errors.location),
                  "h-11 rounded-xl pl-10"
                )}
              />
            </div>
          </FormField>
        </div>
      </div>
    </div>
  );
}