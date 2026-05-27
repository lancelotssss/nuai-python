import { format, parseISO } from "date-fns";

function safe(value) {
  return String(value ?? "").trim();
}

function parseEventDateSafe(value) {
  if (!value) return null;

  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function getLocalTodayString() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function getInitialForm(selectedDate) {
  const today = getLocalTodayString();
  const selected =
    selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
      ? format(selectedDate, "yyyy-MM-dd")
      : today;

  const safeStartDate = selected < today ? today : selected;

  return {
    title: "",
    description: "",
    eventDate: safeStartDate,
    endDate: safeStartDate,
    allDay: false,
    startTime: "",
    endTime: "",
    location: "",
    category: "",
    customCategory: "",
    audience: ["alumni"],
    status: "draft",
    coverImageFile: null,
    coverImageUrl: "",
    contactName: "",
    contactEmail: "",
    tags: [],
    postedOn: ["calendar"],
  };
}

export function getDisplayCategory(form) {
  if (safe(form?.category) === "others") {
    return safe(form?.customCategory);
  }

  return safe(form?.category);
}

export function validateStep(step, form) {
  const errors = {};

  if (step === 1) {
    if (!safe(form?.title)) {
      errors.title = "Event title is required.";
    }

    if (!safe(form?.description)) {
      errors.description = "Event description is required.";
    }

    if (!safe(form?.location)) {
      errors.location = "Location is required.";
    }
  }

  if (step === 2) {
    if (!safe(form?.eventDate)) {
      errors.eventDate = "Start date is required.";
    }

    if (!safe(form?.endDate)) {
      errors.endDate = "End date is required.";
    }

    if (
      safe(form?.eventDate) &&
      safe(form?.endDate) &&
      form.endDate < form.eventDate
    ) {
      errors.endDate = "End date cannot be earlier than start date.";
    }

    if (!form?.allDay) {
      if (!safe(form?.startTime)) {
        errors.startTime = "Start time is required.";
      }

      if (!safe(form?.endTime)) {
        errors.endTime = "End time is required.";
      }

      if (
        safe(form?.eventDate) &&
        safe(form?.endDate) &&
        safe(form?.startTime) &&
        safe(form?.endTime) &&
        form.eventDate === form.endDate &&
        form.endTime <= form.startTime
      ) {
        errors.endTime = "End time must be later than start time.";
      }
    }
  }

  if (step === 3) {
    if (!safe(form?.category)) {
      errors.category = "Category is required.";
    }

    if (safe(form?.category) === "others" && !safe(form?.customCategory)) {
      errors.customCategory = "Please specify the category.";
    }

    if (
      safe(form?.contactEmail) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(form.contactEmail))
    ) {
      errors.contactEmail = "Please enter a valid email address.";
    }
  }

  if (step === 4) {
    if (!Array.isArray(form?.postedOn) || form.postedOn.length === 0) {
      errors.postedOn = "Select at least one posting destination.";
    }
  }

  return errors;
}

export function buildEventPayload(
  form,
  actorUid,
  actorName,
  actorEmail,
  uploadedImageUrl = ""
) {
  return {
    title: safe(form?.title),
    description: safe(form?.description),
    eventDate: safe(form?.eventDate),
    endDate: safe(form?.endDate) || safe(form?.eventDate),
    allDay: Boolean(form?.allDay),
    startTime: form?.allDay ? "" : safe(form?.startTime),
    endTime: form?.allDay ? "" : safe(form?.endTime),
    location: safe(form?.location),
    category: safe(form?.category),
    customCategory: safe(form?.category) === "others" ? safe(form?.customCategory) : "",
    audience: Array.isArray(form?.audience) && form.audience.length
      ? form.audience
      : ["alumni"],
    status: safe(form?.status) || "draft",
    coverImageUrl: safe(uploadedImageUrl) || safe(form?.coverImageUrl),
    contactName: safe(form?.contactName),
    contactEmail: safe(form?.contactEmail),
    tags: Array.isArray(form?.tags) ? form.tags : [],
    postedOn: Array.isArray(form?.postedOn) && form.postedOn.length
      ? form.postedOn
      : ["calendar"],
    createdByUid: actorUid || "",
    createdByName: actorName || "",
    createdByEmail: actorEmail || "",
    updatedByUid: actorUid || "",
    updatedByName: actorName || "",
    updatedByEmail: actorEmail || "",
    updatedAt: new Date(),
  };
}

export function formatReviewDate(eventDate) {
  if (!eventDate) return "—";

  try {
    return format(parseISO(eventDate), "MMMM d, yyyy");
  } catch {
    return eventDate;
  }
}

export const EVENT_COLOR_CLASSES = [
  "border-[#F59E0B]/60 bg-[#F59E0B]/12 text-[#B45309]",
  "border-[#22C55E]/60 bg-[#22C55E]/12 text-[#15803D]",
  "border-[#0EA5E9]/60 bg-[#0EA5E9]/12 text-[#0369A1]",
  "border-[#8B5CF6]/60 bg-[#8B5CF6]/12 text-[#6D28D9]",
  "border-[#EC4899]/60 bg-[#EC4899]/12 text-[#BE185D]",
  "border-[#EF4444]/60 bg-[#EF4444]/12 text-[#B91C1C]",
  "border-[#14B8A6]/60 bg-[#14B8A6]/12 text-[#0F766E]",
  "border-[#6366F1]/60 bg-[#6366F1]/12 text-[#4338CA]",
];

function getDatesCovered(startDate, endDate) {
  const start = parseEventDateSafe(startDate);
  const end = parseEventDateSafe(endDate) || start;

  if (!start || !end) return [];

  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const dates = [];

  while (current <= last) {
    dates.push(format(current, "yyyy-MM-dd"));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getBufferedDates(dateKeys = [], bufferDays = 1) {
  const expanded = new Set();

  dateKeys.forEach((dateKey) => {
    const base = parseEventDateSafe(dateKey);
    if (!base) return;

    for (let offset = -bufferDays; offset <= bufferDays; offset += 1) {
      const next = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      next.setDate(next.getDate() + offset);
      expanded.add(format(next, "yyyy-MM-dd"));
    }
  });

  return [...expanded];
}

function sortEventsForColoring(events = []) {
  return [...events].sort((a, b) => {
    const aKey = `${safe(a?.eventDate)} ${safe(a?.startTime)} ${safe(a?.title)}`;
    const bKey = `${safe(b?.eventDate)} ${safe(b?.startTime)} ${safe(b?.title)}`;
    return aKey.localeCompare(bKey);
  });
}

export function buildEventColorMap(events = []) {
  const sortedEvents = sortEventsForColoring(events);
  const colorMap = new Map();
  const usedColorsByDate = new Map();

  sortedEvents.forEach((event, index) => {
    const eventKey = event?.id || `${safe(event?.title) || "event"}-${index}`;
    const coveredDates = getDatesCovered(event?.eventDate, event?.endDate);

    if (!coveredDates.length) {
      colorMap.set(eventKey, EVENT_COLOR_CLASSES[index % EVENT_COLOR_CLASSES.length]);
      return;
    }

    const comparisonDates = getBufferedDates(coveredDates, 1);
    const blockedColors = new Set();

    comparisonDates.forEach((dateKey) => {
      const used = usedColorsByDate.get(dateKey);
      if (!used) return;

      used.forEach((colorIndex) => {
        blockedColors.add(colorIndex);
      });
    });

    let chosenIndex = EVENT_COLOR_CLASSES.findIndex(
      (_, colorIndex) => !blockedColors.has(colorIndex)
    );

    if (chosenIndex === -1) {
      const frequency = new Map();

      comparisonDates.forEach((dateKey) => {
        const used = usedColorsByDate.get(dateKey);
        if (!used) return;

        used.forEach((colorIndex) => {
          frequency.set(colorIndex, (frequency.get(colorIndex) || 0) + 1);
        });
      });

      let lowestCount = Number.POSITIVE_INFINITY;
      let bestIndex = 0;

      EVENT_COLOR_CLASSES.forEach((_, colorIndex) => {
        const count = frequency.get(colorIndex) || 0;
        if (count < lowestCount) {
          lowestCount = count;
          bestIndex = colorIndex;
        }
      });

      chosenIndex = bestIndex;
    }

    colorMap.set(eventKey, EVENT_COLOR_CLASSES[chosenIndex]);

    coveredDates.forEach((dateKey) => {
      if (!usedColorsByDate.has(dateKey)) {
        usedColorsByDate.set(dateKey, new Set());
      }

      usedColorsByDate.get(dateKey).add(chosenIndex);
    });
  });

  return colorMap;
}

export function getEventColorClass(event, colorMap, fallbackIndex = 0) {
  const fallback =
    EVENT_COLOR_CLASSES[fallbackIndex % EVENT_COLOR_CLASSES.length];

  if (!event) return fallback;

  const eventKey = event?.id;
  if (eventKey && colorMap?.has(eventKey)) {
    return colorMap.get(eventKey);
  }

  return fallback;
}