import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  MapPin,
  Tag,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "./PerksFormSectionCard";

function formatDisplayDate(value) {
  if (!value) return "Not set";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayDateRange(startDate, endDate, allDay, startTime, endTime) {
  if (!startDate) return "Not set";

  const safeEndDate = endDate || startDate;
  const sameDate = startDate === safeEndDate;

  const dateLabel = sameDate
    ? formatDisplayDate(startDate)
    : `${formatDisplayDate(startDate)} - ${formatDisplayDate(safeEndDate)}`;

  if (allDay) return `${dateLabel} • All day`;
  if (startTime && endTime) return `${dateLabel} • ${startTime} - ${endTime}`;
  if (startTime) return `${dateLabel} • ${startTime}`;
  if (endTime) return `${dateLabel} • ${endTime}`;

  return dateLabel;
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3D398C]/10 text-[#3D398C]">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground break-words">
            {value || "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PerksSidebarNotes({
  companyName = "",
  headerText = "",
  category = "",
  location = "",
  startDate = "",
  endDate = "",
  allDay = false,
  startTime = "",
  endTime = "",
  postedOn = [],
}) {
  const previewTitle = companyName || "Untitled perk / discount";
  const previewContent = headerText || "No post header yet.";
  const schedule = formatDisplayDateRange(
    startDate,
    endDate,
    allDay,
    startTime,
    endTime
  );
  const postingValue =
    Array.isArray(postedOn) && postedOn.length > 0
      ? postedOn.join(", ")
      : "Not set";

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-5">
          <SectionHeader
            icon={MapPin}
            title="Preview Notes"
            helper="What this form will save."
          />
        </div>

        <div className="space-y-3 p-5">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-4">
            <p className="text-base font-semibold text-foreground break-words">
              {previewTitle}
            </p>
            <p className="mt-1 text-sm text-muted-foreground break-words">
              {previewContent}
            </p>
          </div>

          <InfoCard
            icon={BriefcaseBusiness}
            label="Company"
            value={companyName || "Not set"}
          />

          <InfoCard
            icon={CalendarDays}
            label="Availability"
            value={schedule}
          />

          <InfoCard
            icon={Tag}
            label="Category"
            value={category || "Not set"}
          />

          <InfoCard
            icon={MapPin}
            label="Location"
            value={location || "Not set"}
          />

          <InfoCard
            icon={Send}
            label="Posting"
            value={postingValue}
          />

          <InfoCard
            icon={FileText}
            label="Header"
            value={headerText || "Not set"}
          />
        </div>
      </CardContent>
    </Card>
  );
}