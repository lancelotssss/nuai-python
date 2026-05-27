import { useState } from "react";
import {
  MapPin,
  Calendar,
  Link as LinkIcon,
  Tag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Clock3,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getDateParts(date) {
  if (!date) return { month: "—", day: "--" };

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return { month: "—", day: "--" };

  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
  };
}

function formatTo12Hour(time) {
  if (!time) return "";

  const value = String(time).trim();

  if (!value) return "";

  if (/am|pm/i.test(value)) {
    return value.replace(/\s+/g, " ").toUpperCase();
  }

  const [hourPart, minutePart = "00"] = value.split(":");
  let hour = Number(hourPart);
  const minute = String(minutePart).padStart(2, "0").slice(0, 2);

  if (Number.isNaN(hour)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

function formatTime(startTime, endTime, allDay) {
  if (allDay) return "All-day";

  const start = formatTo12Hour(startTime);
  const end = formatTo12Hour(endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "All-day";
}

function formatCategoryLabel(category) {
  return String(category || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function HighlightInfo({ icon: Icon, label, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-[#3D398C]/15 bg-[#3D398C]/[0.04] px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D398C]/10 text-[#3D398C]">
        <Icon size={14} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="truncate text-xs font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AlumniPerksDiscountCardPreview({
  companyName = "",
  location = "",
  postHeader = "",
  postContent = "",
  startDate = "",
  endDate = "",
  startTime = "",
  endTime = "",
  allDay = false,
  category = "",
  customCategory = "",
  perkCategory = "",
  discountCategory = "",
  requirements = [],
  links = [],
  imageUrls = [],
}) {
  const [expanded, setExpanded] = useState(false);

  const image =
    Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls[0] : "";

  const safeContent = postContent || "No description provided.";
  const safeLinks = Array.isArray(links) ? links.filter(Boolean) : [];

  const rawCategory =
    category || perkCategory || discountCategory || customCategory || "";

  const displayCategory =
    String(rawCategory || "").toLowerCase() === "others"
      ? customCategory || "Others"
      : rawCategory;

  const shouldShowToggle = safeContent.length > 180 || safeLinks.length > 0;

  const { month, day } = getDateParts(startDate);
  const displayTime = formatTime(startTime, endTime, allDay);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] lg:auto-rows-fr">
        <div className="relative h-[240px] overflow-hidden bg-muted lg:h-full">
          {image ? (
            <img
              src={image}
              alt={postHeader || "Perk preview"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#3D398C]/10 text-[#3D398C]">
                <span className="text-[10px] font-bold">{month}</span>
                <span className="text-lg font-extrabold leading-none">
                  {day}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-base font-semibold leading-tight text-black">
                  {postHeader || "Untitled Perk / Discount"}
                </p>

                <div className="flex items-center gap-1.5 text-[#3D398C]/90">
                  <Building2 className="h-4 w-4 shrink-0" />

                  <p className="truncate text-[15px] font-bold leading-tight">
                    {companyName || "Company"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <HighlightInfo
              icon={MapPin}
              label="Location"
              value={location || "—"}
            />

            <HighlightInfo
              icon={Calendar}
              label="Date"
              value={`${formatDate(startDate)} — ${formatDate(endDate)}`}
            />

            <HighlightInfo icon={Clock3} label="Time" value={displayTime} />

            {displayCategory ? (
              <HighlightInfo
                icon={Tag}
                label="Category"
                value={formatCategoryLabel(displayCategory)}
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            <p
              className={[
                "text-sm leading-relaxed text-muted-foreground text-justify",
                expanded ? "" : "line-clamp-4",
              ].join(" ")}
            >
              {safeContent}
            </p>

            {expanded && safeLinks.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3D398C]/10 text-[#3D398C]">
                    <LinkIcon className="h-3.5 w-3.5" />
                  </div>

                  <p className="text-sm font-semibold text-foreground">Links</p>
                </div>

                <div className="space-y-2">
                  {safeLinks.map((link, index) => (
                    <div
                      key={`${link}-${index}`}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 text-sm font-medium text-[#3D398C] hover:underline"
                      >
                        <span className="block break-all">{link}</span>
                      </a>

                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-[#3D398C] transition hover:bg-muted"
                      >
                        <LinkIcon size={14} />
                        Visit Link
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {shouldShowToggle ? (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3D398C] hover:underline"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show more
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}