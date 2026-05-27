import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  MapPin,
  Tag,
  Clock3,
  Building2,
  X,
} from "lucide-react";

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

function formatCategoryLabel(category) {
  return String(category || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function formatTimeRange(startTime, endTime, allDay) {
  if (allDay) return "All-day";

  const start = formatTo12Hour(startTime);
  const end = formatTo12Hour(endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "All-day";
}

export default function PerksPostPreview({
  title = "",
  description = "",
  postHeader = "",
  postContent = "",
  companyName = "",
  companySubtitle = "",
  location = "",
  category = "",
  customCategory = "",
  startDate = "",
  endDate = "",
  startTime = "",
  endTime = "",
  allDay = false,
  status = "draft",
  links = [],
  requirements = [],
  imageUrls = [],
}) {
  const [expandedContent, setExpandedContent] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const images = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
  const safeLinks = Array.isArray(links) ? links.filter(Boolean) : [];

  const displayTitle = title || postHeader || "Untitled Perk / Discount";
  const displayDescription =
    description || postContent || "No description provided.";

  const displayCategory =
    String(category || "").toLowerCase() === "others"
      ? customCategory || "Others"
      : category || customCategory;

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);
  const formattedTime = formatTimeRange(startTime, endTime, allDay);

  const startDateObj = startDate ? new Date(startDate) : null;
  const hasValidStartDate =
    startDateObj instanceof Date && !Number.isNaN(startDateObj.getTime());

  const month = hasValidStartDate
    ? startDateObj.toLocaleString("en-US", { month: "short" }).toUpperCase()
    : "—";

  const day = hasValidStartDate
    ? String(startDateObj.getDate()).padStart(2, "0")
    : "--";

  const shouldShowToggle =
    displayDescription.length > 180 || safeLinks.length > 0;

  function openImageViewer(index = 0) {
    if (!images.length) return;
    setViewerIndex(index);
    setViewerOpen(true);
  }

  function closeImageViewer() {
    setViewerOpen(false);
    setViewerIndex(0);
  }

  function showPreviousImage(event) {
    event?.stopPropagation?.();
    if (!images.length) return;
    setViewerIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  function showNextImage(event) {
    event?.stopPropagation?.();
    if (!images.length) return;
    setViewerIndex((prev) => (prev + 1) % images.length);
  }

  function renderImageButton(src, index, className = "") {
    return (
      <button
        key={`${src}-${index}`}
        type="button"
        onClick={() => openImageViewer(index)}
        className={["group relative overflow-hidden bg-muted text-left", className].join(" ")}
        title={`Open image ${index + 1}`}
      >
        <img
          src={src}
          alt={`preview ${index + 1}`}
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:opacity-95"
        />
      </button>
    );
  }

  function renderImages() {
    if (images.length === 0) {
      return (
        <div className="flex h-[260px] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          No Image
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <div className="h-[300px] w-full overflow-hidden bg-muted">
          {renderImageButton(images[0], 0, "h-full w-full")}
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid h-[300px] w-full grid-cols-2 gap-0.5 bg-white">
          {images.map((src, index) => renderImageButton(src, index, "h-full w-full"))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid h-[320px] w-full grid-cols-2 grid-rows-2 gap-0.5 bg-white">
          {renderImageButton(images[0], 0, "row-span-2 h-full w-full")}
          {renderImageButton(images[1], 1, "h-full w-full")}
          {renderImageButton(images[2], 2, "h-full w-full")}
        </div>
      );
    }

    if (images.length === 4) {
      return (
        <div className="grid h-[320px] w-full grid-cols-2 grid-rows-2 gap-0.5 bg-white">
          {images.map((src, index) => renderImageButton(src, index, "h-full w-full"))}
        </div>
      );
    }

    const extraCount = Math.max(images.length - 5, 0);

    return (
      <div className="grid w-full grid-cols-6 gap-0.5 bg-white">
        {renderImageButton(images[0], 0, "col-span-3 h-[320px]")}
        {renderImageButton(images[1], 1, "col-span-3 h-[320px]")}

        {images.slice(2, 5).map((src, index) => {
          const realIndex = index + 2;
          const showOverlay = extraCount > 0 && index === 2;

          return (
            <button
              key={`${src}-${realIndex}`}
              type="button"
              onClick={() => openImageViewer(realIndex)}
              className="group relative col-span-2 h-[170px] overflow-hidden bg-muted text-left"
              title={`Open image ${realIndex + 1}`}
            >
              <img
                src={src}
                alt={`preview ${realIndex + 1}`}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:opacity-95"
              />

              {showOverlay ? (
                <div className="absolute inset-0 grid place-items-center bg-black/55 text-white backdrop-blur-[1px] transition-colors group-hover:bg-black/65">
                  <div className="text-center">
                    <span className="text-2xl font-bold">+{extraCount}</span>
                    <p className="mt-0.5 text-xs font-medium opacity-85">more</p>
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
      <div className="flex flex-col">
        <div className="flex flex-col p-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#3D398C]/10 text-[#3D398C]">
                  <span className="text-[10px] font-bold">{month}</span>
                  <span className="text-lg font-extrabold">{day}</span>
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 text-xl font-bold leading-tight text-foreground">
                    {displayTitle}
                  </p>

                  {companyName ? (
                    <div className="mt-1 flex min-w-0 items-start gap-1.5">
                      <Building2 className="mt-[2px] h-4 w-4 shrink-0 text-[#3D398C]" />

                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-[15px] font-bold leading-5 text-[#3D398C]">
                          {companyName}
                        </p>

                        {companySubtitle ? (
                          <p className="mt-0.5 truncate text-xs font-normal leading-4 text-muted-foreground">
                            {companySubtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <HighlightInfo
                icon={MapPin}
                label="Location"
                value={location?.trim() ? location : "No Location"}
              />

              <HighlightInfo
                icon={CalendarDays}
                label="Date"
                value={`${formattedStart} — ${formattedEnd}`}
              />

              <HighlightInfo icon={Clock3} label="Time" value={formattedTime} />

              {displayCategory ? (
                <HighlightInfo
                  icon={Tag}
                  label="Category"
                  value={formatCategoryLabel(displayCategory)}
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <p
                className={[
                  "whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground text-justify",
                  expandedContent ? "" : "line-clamp-5",
                ].join(" ")}
              >
                {displayDescription}
              </p>

              {expandedContent && safeLinks.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3D398C]/10 text-[#3D398C]">
                      <Link2 className="h-3.5 w-3.5" />
                    </div>

                    <p className="text-sm font-semibold text-foreground">
                      Links
                    </p>
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
                          <Link2 size={14} />
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
                  onClick={() => setExpandedContent((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3D398C] hover:underline"
                >
                  {expandedContent ? (
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

        <div className="w-full overflow-hidden bg-muted">{renderImages()}</div>
      </div>

      {viewerOpen && images.length > 0 ? (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm"
          onClick={closeImageViewer}
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4 sm:p-6">
            <div
              className="relative flex h-[80vh] w-[90vw] max-w-[1150px] items-center justify-center rounded-2xl bg-black/60"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeImageViewer();
                }}
                className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                title="Close"
              >
                <X size={20} />
              </button>

              {images.length > 1 ? (
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  title="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
              ) : null}

              <img
                src={images[viewerIndex]}
                alt={`perk-full-${viewerIndex + 1}`}
                className="max-h-full max-w-full rounded-lg object-contain"
              />

              {images.length > 1 ? (
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  title="Next"
                >
                  <ChevronRight size={24} />
                </button>
              ) : null}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                {viewerIndex + 1} / {images.length}
              </div>
            </div>

            {images.length > 1 ? (
              <div
                className="flex max-w-[90vw] gap-2 overflow-x-auto rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm"
                onClick={(event) => event.stopPropagation()}
              >
                {images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setViewerIndex(index)}
                    className={[
                      "shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                      index === viewerIndex
                        ? "scale-105 border-white shadow-lg"
                        : "border-transparent opacity-60 hover:opacity-100",
                    ].join(" ")}
                    title={`Image ${index + 1}`}
                  >
                    <img
                      src={src}
                      alt={`perk-thumb-${index + 1}`}
                      className="h-14 w-14 object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}