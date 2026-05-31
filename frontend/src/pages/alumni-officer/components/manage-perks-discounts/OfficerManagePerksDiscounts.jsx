import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "@/pages/alumni-officer/services/firebaseCompat";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Calendar,
  CalendarDays,
  Clock3,
  MapPin,
  Building2,
  FileText,
  Pencil,
  Loader2,
  MoreHorizontal,
  Trash2,
  TicketPercent,
  CheckCircle2,
  FilePenLine,
  Eye,
  Lock,
  LockOpen,
  Tag,
} from "lucide-react";

import { db } from "@/pages/alumni-officer/services/firebaseCompat";

const BB = "#3D398C";
const PS_OPTIONS = [10, 20, 50, 100];
const PS_DEFAULT = 10;

function safe(v) {
  return String(v ?? "").trim();
}

function norm(v) {
  return safe(v).toLowerCase();
}

function clearRadixPointerLock() {
  if (typeof document === "undefined") return;

  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.removeAttribute("data-scroll-locked");

  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  document.documentElement.removeAttribute("data-scroll-locked");
}

function formatDate(value) {
  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    if (typeof value?.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    return "—";
  } catch {
    return "—";
  }
}

function formatDateRange(startDate, endDate) {
  const start = safe(startDate);
  const end = safe(endDate);

  if (!start && !end) return "—";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  if (start === end) return formatDate(start);

  return `${formatDate(start)} — ${formatDate(end)}`;
}

function formatTimeRange(startTime, endTime, allDay) {
  if (allDay) return "All-day";

  const start = safe(startTime);
  const end = safe(endTime);

  if (!start && !end) return "—";
  if (start && !end) return formatTimeForDisplay(start);
  if (!start && end) return formatTimeForDisplay(end);

  return `${formatTimeForDisplay(start)} — ${formatTimeForDisplay(end)}`;
}

function formatCreatedDate(value) {
  try {
    if (!value) return "—";

    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    }

    if (typeof value?.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    }

    return "—";
  } catch {
    return "—";
  }
}

function formatPerkCategory(perk) {
  const rawCategory =
    safe(perk?.category) ||
    safe(perk?.perkCategory) ||
    safe(perk?.discountCategory);

  const category =
    rawCategory.toLowerCase() === "others"
      ? safe(perk?.customCategory) || "Others"
      : rawCategory || safe(perk?.customCategory);

  if (!category) return "—";

  return category
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCreatedTime(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizePerkStatus(status) {
  const value = norm(status);

  if (["active", "closed", "draft"].includes(value)) return value;

  return "draft";
}

function getStatusBadge(status) {
  switch (normalizePerkStatus(status)) {
    case "active":
      return {
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "closed":
      return {
        cls: "bg-red-50 text-red-700 border border-red-200",
      };
    case "draft":
    default:
      return {
        cls: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      };
  }
}

function formatStatusLabel(status) {
  const value = normalizePerkStatus(status);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseDateTimeSafe(dateValue, timeValue = "") {
  const rawDate = safe(dateValue);
  if (!rawDate) return null;

  const rawTime = safe(timeValue) || "23:59";
  const parsed = new Date(`${rawDate}T${rawTime}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getEffectivePerkStatus(perk) {
  const saved = normalizePerkStatus(perk?.status);

  if (saved === "draft") return "draft";
  if (saved === "closed") return "closed";

  const endDate = safe(perk?.endDate) || safe(perk?.startDate);
  if (!endDate) return saved;

  let isExpired = false;

  if (perk?.allDay) {
    const endOfDay = parseDateTimeSafe(endDate, "23:59");
    isExpired = endOfDay ? new Date() > endOfDay : false;
  } else {
    const endDateTime = parseDateTimeSafe(endDate, perk?.endTime || "23:59");
    isExpired = endDateTime ? new Date() > endDateTime : false;
  }

  if (isExpired) return "closed";

  return saved;
}

function formatTimeForDisplay(value) {
  if (!value) return "";

  const [hourPart, minutePart = "00"] = String(value).split(":");
  const hour24 = Number(hourPart);
  if (Number.isNaN(hour24)) return value;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minutePart} ${period}`;
}

const HOUR_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
const PERIOD_OPTIONS = ["AM", "PM"];

function parseDatePickerValue(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayStartDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDatePickerValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeParts(value) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue || !cleanValue.includes(":")) {
    return {
      hour: "12",
      minute: "00",
      period: "AM",
    };
  }

  const [hourRaw, minuteRaw = "00"] = cleanValue.split(":");
  const hour24 = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return {
      hour: "12",
      minute: "00",
      period: "AM",
    };
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    period,
  };
}

function toTimeValueFromParts(hour, minute, period) {
  let hourNumber = Number(hour);
  const safeMinute = String(minute || "00").padStart(2, "0");
  const safePeriod = period === "PM" ? "PM" : "AM";

  if (Number.isNaN(hourNumber) || hourNumber <= 0) hourNumber = 12;

  if (safePeriod === "AM" && hourNumber === 12) {
    hourNumber = 0;
  } else if (safePeriod === "PM" && hourNumber !== 12) {
    hourNumber += 12;
  }

  return `${String(hourNumber).padStart(2, "0")}:${safeMinute}`;
}

function normalizeTimeDigits(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 4)
    .padEnd(4, "0");
}

function toMaskedDisplay(digits = "0000", period = "AM") {
  const safeDigits = normalizeTimeDigits(digits);
  const safePeriod = period === "PM" ? "PM" : "AM";

  return `${safeDigits.slice(0, 2)}:${safeDigits.slice(2, 4)}:${safePeriod}`;
}

function clampMaskedTime(digits = "0000", period = "AM") {
  const safeDigits = normalizeTimeDigits(digits);

  let hour = Number(safeDigits.slice(0, 2));
  let minute = Number(safeDigits.slice(2, 4));

  if (Number.isNaN(hour)) hour = 0;
  if (Number.isNaN(minute)) minute = 0;

  if (hour > 12) hour = 12;
  if (minute > 59) minute = 59;

  return {
    digits: `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}`,
    period: period === "PM" ? "PM" : "AM",
  };
}

function toTimeValueFromMask(digits = "0000", period = "AM") {
  const clamped = clampMaskedTime(digits, period);

  let hour = Number(clamped.digits.slice(0, 2));
  const minute = clamped.digits.slice(2, 4);

  if (clamped.period === "AM" && hour === 12) {
    hour = 0;
  } else if (clamped.period === "PM" && hour !== 12) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function toMaskFromTimeValue(value) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue || !cleanValue.includes(":")) {
    return {
      digits: "0000",
      period: "AM",
    };
  }

  const [hourRaw, minuteRaw] = cleanValue.split(":");
  const hour24 = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return {
      digits: "0000",
      period: "AM",
    };
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    digits: `${String(hour12).padStart(2, "0")}${String(minute).padStart(2, "0")}`,
    period,
  };
}

function toPickerPartsFromMask(digits = "0000", period = "AM") {
  const clamped = clampMaskedTime(digits, period);
  const hour = clamped.digits.slice(0, 2);
  const minute = clamped.digits.slice(2, 4);

  return {
    hour: hour === "00" ? "12" : hour,
    minute,
    period: clamped.period,
  };
}

function isAllowedTimeDigit(index, digit, currentDigits) {
  const value = Number(digit);

  if (Number.isNaN(value)) return false;

  if (index === 0) {
    return value <= 1;
  }

  if (index === 1) {
    const firstHourDigit = currentDigits[0];

    if (firstHourDigit === "1") {
      return value <= 2;
    }

    return true;
  }

  if (index === 2) {
    return value <= 5;
  }

  return true;
}

function getMaskedSelectionIndex(cursorIndex) {
  const safeIndex = Math.max(0, Math.min(cursorIndex, 3));
  const map = [0, 1, 3, 4];

  return map[safeIndex] ?? 0;
}

function ScheduleDatePickerField({ label, value, minDate, error, onChange }) {
  const selectedDate = parseDatePickerValue(value);
  const parsedMinDate = parseDatePickerValue(minDate) || getTodayStartDate();
  const baseDate = selectedDate || parsedMinDate;

  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(baseDate);

  useEffect(() => {
    setDisplayMonth(selectedDate || parsedMinDate);
  }, [value, minDate]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={[
              "h-11 w-full justify-between rounded-xl px-3 text-left font-normal shadow-none",
              error ? "border-red-500 text-red-700 focus-visible:ring-red-500/20" : "border-input",
            ].join(" ")}
          >
            <span
              className={[
                "truncate text-sm font-normal",
                selectedDate ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select date"}
            </span>
            <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="z-[100001] w-[300px] rounded-xl border border-border bg-background p-3 shadow-md"
        >
          <CalendarPicker
            mode="single"
            month={displayMonth}
            selected={selectedDate || undefined}
            onMonthChange={setDisplayMonth}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatDatePickerValue(date));
              setOpen(false);
            }}
            disabled={(date) => date < parsedMinDate}
            showOutsideDays={false}
            fixedWeeks
            initialFocus
            className="w-full p-0"
            classNames={{
              months: "flex w-full flex-col",
              month: "w-full space-y-2",
              caption: "flex h-9 items-center justify-center rounded-md px-2 text-sm font-semibold",
              nav: "flex items-center gap-1",
              table: "w-full border-collapse",
              head_row: "grid grid-cols-7",
              head_cell: "flex h-8 items-center justify-center text-xs font-medium text-muted-foreground",
              row: "mt-1 grid grid-cols-7",
              cell: "flex h-10 items-center justify-center p-0",
              day: "flex h-9 w-9 items-center justify-center rounded-full p-0 text-sm font-normal text-foreground hover:bg-accent hover:text-foreground",
              day_selected: "bg-[#3D398C] text-white hover:bg-[#3D398C] hover:text-white",
              day_today: "border border-border bg-muted text-foreground",
              day_outside: "hidden",
              day_disabled: "pointer-events-none text-muted-foreground opacity-35 line-through",
              day_hidden: "invisible pointer-events-none",
            }}
          />
        </PopoverContent>
      </Popover>

      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function ScheduleTimeField({
  label,
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
}) {
  const initialMask = toMaskFromTimeValue(value);

  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState(initialMask.digits);
  const [period, setPeriod] = useState(initialMask.period);
  const [cursorIndex, setCursorIndex] = useState(0);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const skipNextSyncRef = useRef(false);

  const pickerParts = useMemo(
    () => toPickerPartsFromMask(digits, period),
    [digits, period],
  );

  useEffect(() => {
    const input = inputRef.current;

    if (!input || document.activeElement !== input) return;

    const start = getMaskedSelectionIndex(cursorIndex);

    window.requestAnimationFrame(() => {
      input.setSelectionRange(start, start + 1);
    });
  }, [cursorIndex, digits, period]);

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const nextMask = toMaskFromTimeValue(value);
    setDigits(nextMask.digits);
    setPeriod(nextMask.period);
    setCursorIndex(0);
  }, [value]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target)) return;

      setOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function commitTime(
    nextDigits = digits,
    nextPeriod = period,
    shouldClamp = true,
  ) {
    const nextMask = shouldClamp
      ? clampMaskedTime(nextDigits, nextPeriod)
      : {
          digits: normalizeTimeDigits(nextDigits),
          period: nextPeriod === "PM" ? "PM" : "AM",
        };

    setDigits(nextMask.digits);
    setPeriod(nextMask.period);

    skipNextSyncRef.current = true;
    onChange(toTimeValueFromMask(nextMask.digits, nextMask.period));
  }

  function updateTime(nextParts) {
    const nextHour = nextParts.hour ?? pickerParts.hour;
    const nextMinute = nextParts.minute ?? pickerParts.minute;
    const nextPeriod = nextParts.period ?? pickerParts.period;

    const nextDigits = `${nextHour}${nextMinute}`;

    setCursorIndex(0);
    commitTime(nextDigits, nextPeriod, true);
    onBlur?.();

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, 1);
    });
  }

  function handleKeyDown(e) {
    if (disabled) return;

    const key = e.key;

    if (/^\d$/.test(key)) {
      e.preventDefault();

      setDigits((prev) => {
        const chars = normalizeTimeDigits(prev).split("");
        const safeIndex = Math.min(cursorIndex, 3);
        const value = Number(key);

        if (safeIndex === 0 && value >= 2 && value <= 9) {
          chars[0] = "0";
          chars[1] = key;

          const nextDigits = chars.join("");

          setCursorIndex(2);
          commitTime(nextDigits, period, false);

          return nextDigits;
        }

        if (safeIndex === 1 && chars[0] === "1" && value >= 3 && value <= 9) {
          if (value > 5) {
            return prev;
          }

          chars[2] = key;

          const nextDigits = chars.join("");

          setCursorIndex(3);
          commitTime(nextDigits, period, false);

          return nextDigits;
        }

        if (!isAllowedTimeDigit(safeIndex, key, chars)) {
          return prev;
        }

        chars[safeIndex] = key;

        const nextDigits = chars.join("");
        const nextIndex = Math.min(safeIndex + 1, 4);

        setCursorIndex(nextIndex);
        commitTime(nextDigits, period, false);

        return nextDigits;
      });

      return;
    }

    if (key.toLowerCase() === "a") {
      e.preventDefault();
      setPeriod("AM");
      commitTime(digits, "AM", false);
      return;
    }

    if (key.toLowerCase() === "p") {
      e.preventDefault();
      setPeriod("PM");
      commitTime(digits, "PM", false);
      return;
    }

    if (key === "Backspace") {
      e.preventDefault();

      setDigits((prev) => {
        const chars = normalizeTimeDigits(prev).split("");
        let nextIndex = -1;

        for (let i = chars.length - 1; i >= 0; i -= 1) {
          if (chars[i] !== "0") {
            nextIndex = i;
            break;
          }
        }

        if (nextIndex === -1) {
          setCursorIndex(0);
          commitTime("0000", period, false);
          return "0000";
        }

        chars[nextIndex] = "0";

        const nextDigits = chars.join("");

        setCursorIndex(nextIndex);
        commitTime(nextDigits, period, false);

        return nextDigits;
      });

      return;
    }

    if (key === "Delete") {
      e.preventDefault();

      setDigits("0000");
      setCursorIndex(0);
      commitTime("0000", period, false);

      return;
    }

    if (key === "ArrowLeft") {
      e.preventDefault();
      setCursorIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (key === "ArrowRight") {
      e.preventDefault();
      setCursorIndex((prev) => Math.min(prev + 1, 3));
      return;
    }

    if (key === "Home") {
      e.preventDefault();
      setCursorIndex(0);
      return;
    }

    if (key === "End") {
      e.preventDefault();
      setCursorIndex(3);
      return;
    }

    if (key === "Tab") return;

    e.preventDefault();
  }

  function handleBlur() {
    commitTime(digits, period, true);
    onBlur?.();
  }

  function optionButtonClass(active) {
    return [
      "flex h-9 min-w-10 items-center justify-center rounded-md px-3 text-sm font-normal transition",
      active
        ? "bg-[#3D398C] text-white shadow-sm hover:bg-[#2f2b73]"
        : "text-foreground hover:bg-muted",
    ].join(" ");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div ref={rootRef} className="relative">
        <div
          className={[
            "flex h-11 w-full items-center rounded-xl border bg-background pr-3 text-sm transition",
            "hover:bg-muted/30",
            error ? "border-red-500 text-red-700" : "border-input",
            disabled ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="text"
            value={toMaskedDisplay(digits, period)}
            disabled={disabled}
            readOnly
            onFocus={() => {
              setOpen(true);
              setCursorIndex(0);

              window.requestAnimationFrame(() => {
                inputRef.current?.setSelectionRange(0, 1);
              });
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="00:00:AM"
            className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />

          <button
            type="button"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
          >
            <Clock3 className="h-4 w-4" />
          </button>
        </div>

        {open && !disabled ? (
          <div className="absolute left-0 top-[calc(100%+6px)] z-[100001] rounded-xl border border-border bg-popover p-1 shadow-xl">
            <div className="grid grid-cols-[64px_64px_64px] gap-1">
              <div className="max-h-60 overflow-y-auto pr-1">
                {HOUR_OPTIONS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateTime({ hour })}
                    className={optionButtonClass(pickerParts.hour === hour)}
                  >
                    {hour}
                  </button>
                ))}
              </div>

              <div className="max-h-60 overflow-y-auto pr-1">
                {MINUTE_OPTIONS.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateTime({ minute })}
                    className={optionButtonClass(pickerParts.minute === minute)}
                  >
                    {minute}
                  </button>
                ))}
              </div>

              <div className="max-h-60 overflow-y-auto">
                {PERIOD_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateTime({ period: item })}
                    className={optionButtonClass(pickerParts.period === item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function buildPerkScheduleDateTime(dateValue, timeValue, allDay, edge = "start") {
  if (!dateValue) return null;

  const time = allDay
    ? edge === "end"
      ? "23:59"
      : "00:00"
    : safe(timeValue);

  if (!time) return null;

  const parsed = new Date(`${dateValue}T${time}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPerkScheduleFieldErrors(scheduleForm) {
  const errors = {};
  const form = scheduleForm || {};
  const now = new Date();

  const startDateTime = buildPerkScheduleDateTime(
    form.startDate,
    form.startTime,
    form.allDay,
    "start",
  );

  const endDateTime = buildPerkScheduleDateTime(
    form.endDate,
    form.endTime,
    form.allDay,
    "end",
  );

  if (!form.startDate) {
    errors.startDate = "Start date is required.";
  }

  if (!form.endDate) {
    errors.endDate = "End date is required.";
  }

  if (!form.allDay && !form.startTime) {
    errors.startTime = "Start time is required.";
  }

  if (!form.allDay && !form.endTime) {
    errors.endTime = "End time is required.";
  }

  if (startDateTime && startDateTime < now) {
    errors.startDate = "Start schedule cannot be before the current date and time.";

    if (!form.allDay) {
      errors.startTime = "Start time cannot be before the current time.";
    }
  }

  if (endDateTime && endDateTime < now) {
    errors.endDate = "End schedule cannot be before the current date and time.";

    if (!form.allDay) {
      errors.endTime = "End time cannot be before the current time.";
    }
  }

  if (startDateTime && endDateTime && endDateTime <= startDateTime) {
    errors.endDate = "End schedule must be after the start schedule.";

    if (!form.allDay) {
      errors.endTime = "End time must be after the start time.";
    }
  }

  return errors;
}

function makeInitialScheduleForm(perk) {
  const today = getTodayDateInputValue();
  const startDate = safe(perk?.startDate) || today;
  const endDate = safe(perk?.endDate) || startDate;
  const allDay = Boolean(perk?.allDay);

  return {
    startDate,
    endDate,
    startTime: allDay ? "" : safe(perk?.startTime) || "09:00",
    endTime: allDay ? "" : safe(perk?.endTime) || "10:00",
    allDay,
  };
}

function buildPerkRouteState(perk = {}, fallbackTitle = "") {
  const perkTitle =
    safe(perk?.postHeader) ||
    safe(perk?.title) ||
    safe(perk?.perkTitle) ||
    safe(perk?.discountTitle) ||
    safe(perk?.name) ||
    safe(fallbackTitle) ||
    "Perks & Discounts";

  return {
    perkTitle,
    title: perkTitle,
    breadcrumbLabel: perkTitle,
    initialPerk: perk,
    perk,
  };
}

export default function OfficerManagePerksDiscounts() {
  const navigate = useNavigate();

  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);

  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(null);
  const [scheduleError, setScheduleError] = useState("");
  const [confirmScheduleTarget, setConfirmScheduleTarget] = useState(null);
  const [confirmScheduleForm, setConfirmScheduleForm] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PS_DEFAULT);

  useEffect(() => {
    let mounted = true;

    async function loadPerks() {
      try {
        setLoading(true);

        const q = query(collection(db, "perksDiscounts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        if (!mounted) return;

        setPerks(
          snap.docs.map((docSnap) => {
            const data = docSnap.data();

            return {
              id: docSnap.id,
              ...data,
              effectiveStatus: getEffectivePerkStatus(data),
            };
          }),
        );
      } catch (error) {
        console.error("Failed to load perks:", error);
        toast.error("Failed to load perks and discounts.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPerks();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortMode, pageSize]);

  const stats = useMemo(() => {
    const total = perks.length;
    const active = perks.filter((perk) => normalizePerkStatus(perk.effectiveStatus) === "active").length;
    const closed = perks.filter((perk) => normalizePerkStatus(perk.effectiveStatus) === "closed").length;
    const drafts = perks.filter((perk) => normalizePerkStatus(perk.effectiveStatus) === "draft").length;

    return { total, active, closed, drafts };
  }, [perks]);

  const filtered = useMemo(() => {
    const needle = norm(searchTerm);

    let rows = perks.filter((perk) => {
      const status = normalizePerkStatus(perk.effectiveStatus || perk.status);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !needle ||
        norm(perk.companyName).includes(needle) ||
        norm(perk.postHeader).includes(needle) ||
        norm(perk.postContent).includes(needle) ||
        norm(perk.location).includes(needle) ||
        norm(formatPerkCategory(perk)).includes(needle);

      return matchesStatus && matchesSearch;
    });

    rows = [...rows].sort((a, b) => {
      if (sortMode === "oldest") {
        return getCreatedTime(a.createdAt) - getCreatedTime(b.createdAt);
      }

      if (sortMode === "title") {
        return safe(a.postHeader).localeCompare(safe(b.postHeader));
      }

      return getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt);
    });

    return rows;
  }, [perks, searchTerm, statusFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginated = filtered.slice(startIndex, endIndex);

  const visibleIds = paginated.map((perk) => perk.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected = visibleIds.some((id) => selectedIds.includes(id));
  const hasActiveFilters = Boolean(searchTerm) || statusFilter !== "all" || sortMode !== "recent";

  const scheduleFieldErrors = useMemo(
    () => (scheduleForm ? getPerkScheduleFieldErrors(scheduleForm) : {}),
    [scheduleForm],
  );

  const hasScheduleFieldErrors = Object.keys(scheduleFieldErrors).length > 0;

  function refreshPerkInState(perkId, patch) {
    setPerks((prev) =>
      prev.map((perk) => {
        if (perk.id !== perkId) return perk;

        const next = {
          ...perk,
          ...patch,
        };

        return {
          ...next,
          effectiveStatus: getEffectivePerkStatus(next),
        };
      }),
    );
  }

  function resetAllFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setSortMode("recent");
    setPage(1);
  }

  function toggleRow(perk) {
    setSelectedIds((prev) =>
      prev.includes(perk.id)
        ? prev.filter((id) => id !== perk.id)
        : [...prev, perk.id],
    );
  }

  function toggleAllRows() {
    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...prev, ...visibleIds]));
    });
  }

  function handleViewPerk(perkOrId, fallbackTitle = "") {
    const perk =
      typeof perkOrId === "object"
        ? perkOrId
        : perks.find((item) => item.id === perkOrId);

    const perkId = safe(perk?.id) || safe(perkOrId);
    const perkTitle = safe(perk?.postHeader) || safe(fallbackTitle);

    if (!perkId) return;

    clearRadixPointerLock();

    navigate(`/alumni-officer/perks-discounts/view/${perkId}`, {
      state: {
        ...buildPerkRouteState(perk, perkTitle),
        from: "/alumni-officer/perks-discounts",
      },
    });

    window.requestAnimationFrame(clearRadixPointerLock);
    window.setTimeout(clearRadixPointerLock, 150);
  }

  function handleCreatePerk() {
    navigate("/alumni-officer/perks-discounts/create");
  }

  function handleEditPerk(perk) {
    navigate(`/alumni-officer/perks-discounts/edit/${perk.id}`);
  }

  function closeScheduleModal() {
    setScheduleTarget(null);
    setScheduleForm(null);
    setScheduleError("");
    window.setTimeout(clearRadixPointerLock, 0);
  }

  function closeScheduleConfirmDialog() {
    setConfirmScheduleTarget(null);
    setConfirmScheduleForm(null);
    window.setTimeout(clearRadixPointerLock, 0);
  }

  function handleScheduleFieldChange(field, value) {
    setScheduleError("");

    setScheduleForm((prev) => {
      if (!prev) return prev;

      const next = {
        ...prev,
        [field]: value,
      };

      if (field === "startDate" && next.endDate && next.endDate < value) {
        next.endDate = value;
      }

      if (field === "allDay") {
        next.allDay = Boolean(value);
        if (value) {
          next.startTime = "";
          next.endTime = "";
        } else {
          next.startTime = prev.startTime || "09:00";
          next.endTime = prev.endTime || "10:00";
        }
      }

      return next;
    });
  }

  function handleOpenClick(perk) {
    setScheduleTarget(perk);
    setScheduleForm(makeInitialScheduleForm(perk));
    setScheduleError("");
    setConfirmScheduleTarget(null);
    setConfirmScheduleForm(null);
    window.setTimeout(clearRadixPointerLock, 0);
  }

  function handleConfirmScheduleClick() {
    if (!scheduleTarget || !scheduleForm) return;

    const fieldErrors = getPerkScheduleFieldErrors(scheduleForm);

    if (Object.keys(fieldErrors).length > 0) {
      setScheduleError("Please fix the schedule errors before confirming.");
      return;
    }

    const target = scheduleTarget;
    const form = scheduleForm;

    setScheduleTarget(null);
    setScheduleForm(null);
    setScheduleError("");

    window.setTimeout(() => {
      clearRadixPointerLock();
      setConfirmScheduleTarget(target);
      setConfirmScheduleForm(form);
    }, 0);
  }

  async function handleConfirmOpenWithSchedule() {
    if (!confirmScheduleTarget || !confirmScheduleForm) return;

    const target = confirmScheduleTarget;
    const form = confirmScheduleForm;

    try {
      setActionLoadingId(target.id);
      closeScheduleConfirmDialog();

      const patch = {
        status: "active",
        effectiveStatus: "active",
        startDate: form.startDate,
        endDate: form.endDate,
        allDay: Boolean(form.allDay),
        startTime: form.allDay ? "" : form.startTime,
        endTime: form.allDay ? "" : form.endTime,
        reopenedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "perksDiscounts", target.id), patch);

      refreshPerkInState(target.id, {
        ...patch,
        reopenedAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success("Perk/discount reopened with the selected schedule.");
    } catch (error) {
      console.error("Failed to open perk:", error);
      toast.error("Failed to open perk/discount.");
    } finally {
      setActionLoadingId("");
      window.setTimeout(clearRadixPointerLock, 0);
    }
  }

  async function handleClosePerk(perk) {
    try {
      setActionLoadingId(perk.id);
      setCloseTarget(null);

      const patch = {
        status: "closed",
        effectiveStatus: "closed",
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "perksDiscounts", perk.id), patch);

      refreshPerkInState(perk.id, {
        ...patch,
        closedAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success("Perk/discount closed.");
    } catch (error) {
      console.error("Failed to close perk:", error);
      toast.error("Failed to close perk/discount.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleDeletePerk(perk) {
    try {
      setActionLoadingId(perk.id);
      setDeleteTarget(null);

      await deleteDoc(doc(db, "perksDiscounts", perk.id));

      setPerks((prev) => prev.filter((row) => row.id !== perk.id));
      setSelectedIds((prev) => prev.filter((id) => id !== perk.id));

      toast.success("Perk/discount deleted.");
    } catch (error) {
      console.error("Failed to delete perk:", error);
      toast.error("Failed to delete perk/discount.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleDeleteSelected() {
    const targets = perks.filter((perk) => selectedIds.includes(perk.id));

    if (targets.length === 0) return;

    try {
      setActionLoadingId("bulk-delete");

      await Promise.all(targets.map((perk) => deleteDoc(doc(db, "perksDiscounts", perk.id))));

      setPerks((prev) => prev.filter((perk) => !selectedIds.includes(perk.id)));
      setSelectedIds([]);
      toast.success("Selected perks/discounts deleted.");
    } catch (error) {
      console.error("Failed to delete selected perks:", error);
      toast.error("Failed to delete selected perks/discounts.");
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D398C]/10 text-[#3D398C]">
              <TicketPercent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#3D398C]">{stats.total}</p>
              <p className="text-xs font-semibold text-foreground">Total Perks and Discount</p>
              <p className="text-[11px] text-muted-foreground">All perks and discount records</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
              <p className="text-xs font-semibold text-foreground">Active</p>
              <p className="text-[11px] text-muted-foreground">Currently available offers</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.closed}</p>
              <p className="text-xs font-semibold text-foreground">Closed</p>
              <p className="text-[11px] text-muted-foreground">No longer available</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
              <FilePenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.drafts}</p>
              <p className="text-xs font-semibold text-foreground">Drafts</p>
              <p className="text-[11px] text-muted-foreground">Still being prepared</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Perks and Discounts
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Manage alumni partner offers, availability, schedules, and publication status.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border/70 pb-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-[240px] flex-1 md:max-w-[320px]">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Search
              </Label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, title, content..."
                  className="h-8 rounded-md border-border bg-background pl-7 pr-7 text-xs shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-[#3D398C]/25"
                />

                {searchTerm ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="min-w-[130px]">
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Sort
              </Label>

              <Select value={sortMode} onValueChange={setSortMode}>
                <SelectTrigger className="h-8 w-[130px] rounded-md border-border bg-background text-xs shadow-none focus:ring-1 focus:ring-[#3D398C]/25">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                  <SelectItem value="recent">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Status
              </Label>

              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="inline-flex h-8 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                  <TabsTrigger
                    value="all"
                    className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white data-[state=active]:shadow-none"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white data-[state=active]:shadow-none"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value="draft"
                    className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white data-[state=active]:shadow-none"
                  >
                    Draft
                  </TabsTrigger>
                  <TabsTrigger
                    value="closed"
                    className="h-6 rounded-sm px-3 text-[11px] font-medium transition-colors data-active:!bg-[#3D398C] data-active:!text-white data-[state=active]:!bg-[#3D398C] data-[state=active]:!text-white data-[state=active]:shadow-none"
                  >
                    Closed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={resetAllFilters}
                className="h-8 gap-1.5 rounded-md border-border px-3 text-xs font-medium shadow-none"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear filter
              </Button>
            ) : null}

            {selectedIds.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteSelected}
                disabled={actionLoadingId === "bulk-delete"}
                className="h-8 gap-1.5 rounded-md border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 shadow-none hover:bg-red-100 hover:text-red-700"
              >
                {actionLoadingId === "bulk-delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete {selectedIds.length} selected {selectedIds.length === 1 ? "perk" : "perks"}
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={handleCreatePerk}
            className="h-8 shrink-0 gap-1.5 rounded-md bg-[#3D398C] px-3 text-xs font-semibold text-white shadow-none hover:bg-[#2f2b73]"
          >
            <TicketPercent className="h-3.5 w-3.5" />
            Create Perk & Discount
          </Button>
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="w-full table-fixed">
            <colgroup>
              <col className="w-10" />
              <col className="w-[160px]" />
              <col className="w-[210px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-[160px]" />
              <col className="w-[130px]" />
              <col className="w-[100px]" />
              <col className="w-[120px]" />
              <col className="w-[90px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-transparent hover:bg-transparent">
                <TableHead className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected || someSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={toggleAllRows}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#3D398C]"
                  />
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Company
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Title
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Location
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Category
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Date Range
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Time
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </TableHead>

                <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Created
                </TableHead>

                <TableHead className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3D398C]/20 border-t-[#3D398C]" />
                      <div>
                        <p className="text-sm font-medium text-foreground/70">
                          Loading perks and discounts...
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Fetching perk records from the database
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground/40" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground/70">No perks found</p>

                        {hasActiveFilters ? (
                          <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground">
                              No perks match your current search or filters.
                            </p>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1.5 text-[11px]"
                              onClick={resetAllFilters}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Clear all filters
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            No perk records exist yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((perk) => {
                  const badge = getStatusBadge(perk.effectiveStatus);
                  const isSelected = selectedIds.includes(perk.id);
                  const isActive =
                    normalizePerkStatus(perk.effectiveStatus || perk.status) === "active";

                  return (
                    <TableRow
                      key={perk.id}
                      className={`cursor-pointer border-b border-border/60 transition-colors duration-150 last:border-b-0 ${
                        isSelected ? "bg-[#3D398C]/5 hover:bg-[#3D398C]/10" : "hover:bg-muted/40"
                      }`}
                      onClick={() => handleViewPerk(perk)}
                    >
                      <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(perk)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-[#3D398C]"
                        />
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="block max-w-[180px] truncate text-[12px] font-medium text-foreground">
                              {perk.companyName || "Unknown Company"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <div className="min-w-0">
                          <span className="block max-w-[240px] truncate text-[13px] font-semibold text-foreground">
                            {perk.postHeader || "Untitled Perk"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="block max-w-[160px] truncate">{perk.location || "—"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Tag className="h-3 w-3 shrink-0" />
                          <span className="block max-w-[150px] truncate">
                            {formatPerkCategory(perk)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatDateRange(perk.startDate, perk.endDate)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="h-3 w-3 shrink-0" />
                          <span>{formatTimeRange(perk.startTime, perk.endTime, perk.allDay)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <Badge className={`${badge.cls} h-5 gap-1 px-1.5 py-0 text-[10px] font-medium`}>
                          {formatStatusLabel(perk.effectiveStatus)}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatCreatedDate(perk.createdAt)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={actionLoadingId === perk.id}
                            >
                              {actionLoadingId === perk.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPerk(perk);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPerk(perk);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            {isActive ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCloseTarget(perk);
                                }}
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Close
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenClick(perk);
                                }}
                              >
                                <LockOpen className="mr-2 h-4 w-4" />
                                Open
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(perk);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} records
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[72px] rounded-md border-border bg-background text-xs shadow-none focus:ring-1 focus:ring-[#3D398C]/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100] border border-gray-200 bg-white text-gray-900 shadow-lg">
                {PS_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="w-10 text-center text-xs text-muted-foreground">
              {safePage} / {totalPages}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {scheduleTarget && scheduleForm ? (
        <div className="fixed inset-0 z-[99999]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          <div className="relative z-10 flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold text-foreground">Set perk/discount schedule</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the new schedule before reopening this perk/discount.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <ScheduleDatePickerField
                    label="Start Date"
                    value={scheduleForm.startDate}
                    minDate={getTodayDateInputValue()}
                    error={scheduleFieldErrors.startDate || ""}
                    onChange={(value) => handleScheduleFieldChange("startDate", value)}
                  />

                  <ScheduleDatePickerField
                    label="End Date"
                    value={scheduleForm.endDate}
                    minDate={scheduleForm.startDate || getTodayDateInputValue()}
                    error={scheduleFieldErrors.endDate || ""}
                    onChange={(value) => handleScheduleFieldChange("endDate", value)}
                  />
                </div>

                {!scheduleForm.allDay ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ScheduleTimeField
                      label="Start Time"
                      value={scheduleForm.startTime}
                      error={scheduleFieldErrors.startTime || ""}
                      onChange={(value) => handleScheduleFieldChange("startTime", value)}
                    />

                    <ScheduleTimeField
                      label="End Time"
                      value={scheduleForm.endTime}
                      error={scheduleFieldErrors.endTime || ""}
                      onChange={(value) => handleScheduleFieldChange("endTime", value)}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#3D398C]/20 bg-[#3D398C]/[0.04] px-4 py-3 text-sm text-muted-foreground">
                    Start time and end time are disabled for all-day perks.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleScheduleFieldChange("allDay", !scheduleForm.allDay)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition hover:bg-muted/30"
                >
                  <span
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded border text-xs font-bold transition",
                      scheduleForm.allDay
                        ? "border-[#3D398C] bg-[#3D398C] text-white"
                        : "border-input bg-background text-transparent",
                    ].join(" ")}
                  >
                    ✓
                  </span>

                  <div>
                    <p className="text-sm font-medium text-foreground">All-day</p>
                    <p className="text-xs text-muted-foreground">
                      Start and end time will not be used.
                    </p>
                  </div>
                </button>

                {scheduleError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {scheduleError}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    This perk/discount will reopen as active with the selected schedule.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                <Button type="button" variant="outline" onClick={closeScheduleModal}>
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleConfirmScheduleClick}
                  disabled={hasScheduleFieldErrors}
                  className="bg-[#3D398C] text-white hover:bg-[#2f2b73] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AlertDialog open={Boolean(confirmScheduleTarget)} onOpenChange={(open) => !open && closeScheduleConfirmDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open this perk/discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reopen {confirmScheduleTarget?.postHeader || "this perk/discount"} with the selected schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeScheduleConfirmDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOpenWithSchedule}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Open
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(closeTarget)} onOpenChange={(open) => !open && setCloseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this perk/discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {closeTarget?.postHeader || "this perk/discount"} as closed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => closeTarget && handleClosePerk(closeTarget)}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this perk/discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {deleteTarget?.postHeader || "this perk/discount"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeletePerk(deleteTarget)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
