import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UserCircle2,
  Paperclip,
} from "lucide-react";

function formatEventTimeRange(event) {
  if (!event?.startTime && !event?.endTime) return "No time provided";
  if (event?.startTime && event?.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }
  return event?.startTime || event?.endTime || "No time provided";
}

function getTagToneClasses(index) {
  const tones = [
    "border-[#F5DA3E]/40 bg-[#F5DA3E]/12 text-[#8A6B00]",
    "border-[#7DD3FC]/40 bg-[#7DD3FC]/12 text-[#0C7AA6]",
    "border-[#C4B5FD]/40 bg-[#C4B5FD]/12 text-[#6D57C8]",
    "border-[#F9A8D4]/40 bg-[#F9A8D4]/12 text-[#BE3A82]",
    "border-[#86EFAC]/40 bg-[#86EFAC]/12 text-[#15803D]",
    "border-[#FDBA74]/40 bg-[#FDBA74]/12 text-[#C2410C]",
  ];

  return tones[index % tones.length];
}

function parseDateSafe(value) {
  if (!value) return null;

  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function formatDateRange(startValue, endValue, samePattern = "MMMM d, yyyy") {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue) || start;

  if (!start) return "—";
  if (!end) return format(start, samePattern);

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  if (sameDay) {
    return format(start, samePattern);
  }

  return `${format(start, samePattern)} - ${format(end, samePattern)}`;
}

function formatHeaderDateRange(startValue, endValue) {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue) || start;

  if (!start) return "No event date";
  if (!end) return format(start, "EEEE, MMMM d, yyyy");

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  if (sameDay) {
    return format(start, "EEEE, MMMM d, yyyy");
  }

  return `${format(start, "EEEE, MMMM d, yyyy")} - ${format(
    end,
    "EEEE, MMMM d, yyyy"
  )}`;
}

export default function EventReview({ form, user }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (form.coverImageFile instanceof File) {
      const objectUrl = URL.createObjectURL(form.coverImageFile);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (form.coverImageUrl && form.coverImageUrl.trim()) {
      setPreviewUrl(form.coverImageUrl);
      return;
    }

    setPreviewUrl("");
  }, [form.coverImageFile, form.coverImageUrl]);

  const displayCategory =
    form.category === "others" ? form.customCategory : form.category;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3D398C]/10">
              <UserCircle2 className="h-6 w-6 text-[#3D398C]" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {user?.displayName || user?.email || "Alumni Officer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatHeaderDateRange(form.eventDate, form.endDate)}
              </p>
            </div>
          </div>
        </div>

        {previewUrl ? (
          <div className="w-full border-b border-border bg-muted/20">
            <img
              src={previewUrl}
              alt={form.title || "Event cover"}
              className="h-[260px] w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-[220px] w-full items-center justify-center border-b border-border bg-gradient-to-br from-[#3D398C] via-[#4a46a8] to-[#18B4E8] px-6 text-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Alumni Event
              </p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white">
                {form.title || "Untitled Event"}
              </h2>
            </div>
          </div>
        )}

        <div className="space-y-5 px-5 py-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-foreground">
              {form.title || "Untitled Event"}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {displayCategory ? (
                <span className="rounded-full bg-[#3D398C]/10 px-3 py-1 text-xs font-semibold capitalize text-[#3D398C]">
                  {displayCategory}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-[#3D398C]" />
                Date
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDateRange(form.eventDate, form.endDate)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock3 className="h-4 w-4 text-[#3D398C]" />
                Time
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatEventTimeRange(form)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-4 w-4 text-[#3D398C]" />
                Location
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {form.location || "—"}
              </p>
            </div>
          </div>

          {(form.contactName || form.contactEmail) && (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact Information
              </p>

              <div className="mt-2 space-y-1">
                {form.contactName ? (
                  <p className="text-sm font-semibold text-foreground">
                    {form.contactName}
                  </p>
                ) : null}

                {form.contactEmail ? (
                  <p className="text-sm text-muted-foreground">
                    {form.contactEmail}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
              {form.description || "No description provided."}
            </p>
          </div>

          {form.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag, index) => (
                <span
                  key={tag}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    getTagToneClasses(index),
                  ].join(" ")}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}