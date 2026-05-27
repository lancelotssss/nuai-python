import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addMonths,
  format,
  getYear,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  collection,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "@/pages/alumni-officer/services/firebaseCompat";

import { db } from "@/pages/alumni-officer/services/firebaseCompat";

import ReusableCalendarHeader from "./calendar-components/ReausableCardHeader.jsx";
import CalendarView from "./calendar-components/CalendarView.jsx";
import CalendarTableView from "./calendar-components/CalendarTableView.jsx";
import EventPostModal from "./calendar-modals/EventPostModal.jsx";

function parseEventDateSafe(value) {
  if (!value) return null;

  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function getEventStartDate(event) {
  return parseEventDateSafe(event?.eventDate);
}

function getEventEndDate(event) {
  return parseEventDateSafe(event?.endDate) || getEventStartDate(event);
}

function eventOccursOnDate(event, date) {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);

  if (!start || !end || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const normalizedEnd = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );

  return target >= normalizedStart && target <= normalizedEnd;
}

function getSafeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  return new Date();
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

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    return `${String(twentyFourHourMatch[1]).padStart(2, "0")}:${twentyFourHourMatch[2]}`;
  }

  const twelveHourMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!twelveHourMatch) return raw;

  let hours = Number(twelveHourMatch[1]);
  const minutes = String(twelveHourMatch[2] || "00").padStart(2, "0");
  const period = twelveHourMatch[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function formatTimeForDisplay(value) {
  const raw = toTimeInputValue(value);
  if (!raw) return "";

  const [hourPart, minutePart = "00"] = raw.split(":");
  const hour24 = Number(hourPart);
  if (Number.isNaN(hour24)) return value;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minutePart} ${period}`;
}

function formatTime12Hour(timeValue) {
  const value = String(timeValue || "").trim();

  if (!value) return "";

  const twelveHourMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1]);
    const minute = String(twelveHourMatch[2] || "00").padStart(2, "0");
    const period = twelveHourMatch[3].toUpperCase();

    return `${hour}:${minute} ${period}`;
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!twentyFourHourMatch) return value;

  const hour24 = Number(twentyFourHourMatch[1]);
  const minute = twentyFourHourMatch[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

function formatEventTimeRange12Hour(event) {
  if (event?.allDay) return "All day";

  const start = formatTime12Hour(event?.startTime);
  const end = formatTime12Hour(event?.endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "No time provided";
}

const HOUR_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
const PERIOD_OPTIONS = ["AM", "PM"];

function normalizeDateStart(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDatePickerValue(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return normalizeDateStart(parsed);
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
  const minTime = parsedMinDate.getTime();

  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(baseDate);

  useEffect(() => {
    setDisplayMonth(selectedDate || parsedMinDate);
  }, [value, minDate, minTime]);

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
              const normalizedDate = normalizeDateStart(date);
              if (!normalizedDate || normalizedDate < parsedMinDate) return;

              onChange(formatDatePickerValue(normalizedDate));
              setOpen(false);
            }}
            disabled={(date) => {
              const normalizedDate = normalizeDateStart(date);
              return !normalizedDate || normalizedDate < parsedMinDate;
            }}
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
    if (!open) return undefined;

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
  }, [open]);

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

    const nextValue = toTimeValueFromMask(nextMask.digits, nextMask.period);

    if (nextValue !== value) {
      skipNextSyncRef.current = true;
      onChange(nextValue);
    }
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
          <div className="absolute left-0 top-[calc(100%+6px)] z-20 rounded-xl border border-border bg-popover p-1 shadow-xl">
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


function buildScheduleFormFromEvent(event) {
  return {
    eventDate: toDateInputValue(event?.eventDate),
    endDate: toDateInputValue(event?.endDate || event?.eventDate),
    startTime: toTimeInputValue(event?.startTime),
    endTime: toTimeInputValue(event?.endTime),
    allDay: Boolean(event?.allDay),
  };
}

function getEventScheduleFieldErrors(form) {
  const errors = {};

  if (!form.eventDate) {
    errors.eventDate = "Start date is required.";
  }

  if (!form.endDate) {
    errors.endDate = "End date is required.";
  }

  if (!form.allDay) {
    if (!form.startTime) {
      errors.startTime = "Start time is required.";
    }

    if (!form.endTime) {
      errors.endTime = "End time is required.";
    }
  }

  const startDate = parseDatePickerValue(form.eventDate);
  const endDate = parseDatePickerValue(form.endDate);

  if (form.eventDate && !startDate) {
    errors.eventDate = "Please select a valid start date.";
  }

  if (form.endDate && !endDate) {
    errors.endDate = "Please select a valid end date.";
  }

  if (!startDate || !endDate) {
    return errors;
  }

  const todayStart = getTodayStartDate();

  if (startDate < todayStart) {
    errors.eventDate = "Start date cannot be before today.";
  }

  if (endDate < todayStart) {
    errors.endDate = "End date cannot be before today.";
  }

  if (endDate < startDate) {
    errors.endDate = "End date cannot be earlier than the start date.";
  }

  const hasRequiredTimes = form.allDay || (form.startTime && form.endTime);

  if (!hasRequiredTimes) {
    return errors;
  }

  const now = new Date();
  const startDateTime = new Date(
    `${form.eventDate}T${form.allDay ? "00:00" : form.startTime}`,
  );
  const endDateTime = new Date(
    `${form.endDate}T${form.allDay ? "23:59:59" : form.endTime}`,
  );

  if (Number.isNaN(startDateTime.getTime())) {
    errors.eventDate = "Please enter a valid start schedule.";
  }

  if (Number.isNaN(endDateTime.getTime())) {
    errors.endDate = "Please enter a valid end schedule.";
  }

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return errors;
  }

  if (!form.allDay && startDateTime < now) {
    errors.startTime = "Start time cannot be before the current time.";
  }

  if (endDateTime <= now) {
    if (form.allDay) {
      errors.endDate = "End date must be later than the current date and time.";
    } else {
      errors.endTime = "End time must be later than the current time.";
    }
  }

  if (endDateTime <= startDateTime) {
    if (form.allDay || endDate < startDate) {
      errors.endDate = "End date must be after the start date.";
    } else {
      errors.endTime = "End time must be after the start time.";
    }
  }

  return errors;
}

function validateEventScheduleForm(form) {
  const errors = getEventScheduleFieldErrors(form);

  return (
    errors.eventDate ||
    errors.endDate ||
    errors.startTime ||
    errors.endTime ||
    ""
  );
}

export default function OfficerManageCalendar({
  onViewModeChange,
  onCreateEventPage,
  onEditEventPage,
}) {
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState("calendar");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [openPostModal, setOpenPostModal] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [dateError, setDateError] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
  const [scheduleEvent, setScheduleEvent] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    eventDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    allDay: false,
  });
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  useEffect(() => {
    let didUnmount = false;

    const q = query(
      collection(db, "calendarEvents"),
      orderBy("eventDate", "asc"),
    );

    const applySnapshot = (snapshot) => {
      if (didUnmount) return;

      const nextEvents = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setEvents(nextEvents);
    };

    const unsubscribe = onSnapshot(
      q,
      applySnapshot,
      async (error) => {
        console.error("calendarEvents onSnapshot error:", error);

        try {
          const fallbackSnapshot = await getDocs(q);
          applySnapshot(fallbackSnapshot);
        } catch (fallbackError) {
          console.error(
            "calendarEvents fallback getDocs error:",
            fallbackError,
          );
        }
      },
    );

    return () => {
      didUnmount = true;
      unsubscribe();
    };
  }, []);

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => eventOccursOnDate(event, selectedDate));
  }, [events, selectedDate]);

  const selectedPostEvent = selectedDateEvents[selectedPostIndex] || null;

  function getLocalTodayStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function handlePrevMonth() {
    setCurrentMonth((prev) => startOfMonth(subMonths(prev, 1)));
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => startOfMonth(addMonths(prev, 1)));
  }

  function handleMonthSelect(event) {
    const nextMonth = Number(event.target.value);
    setCurrentMonth((prev) => startOfMonth(setMonth(prev, nextMonth)));
  }

  function handleYearSelect(event) {
    const nextYear = Number(event.target.value);
    setCurrentMonth((prev) => startOfMonth(setYear(prev, nextYear)));
  }

  function handleToday() {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
    setDateError("");
  }

  function handleAddEvent(date = selectedDate) {
    const safeDate = getSafeDate(date);

    const pickedDate = new Date(
      safeDate.getFullYear(),
      safeDate.getMonth(),
      safeDate.getDate(),
    );

    const localToday = getLocalTodayStart();

    if (pickedDate < localToday) {
      setDateError("You cannot create an event before today.");
      return;
    }

    setDateError("");

    if (typeof onCreateEventPage === "function") {
      onCreateEventPage(safeDate);
      return;
    }

    navigate("/alumni-officer/calendar/create", {
      state: {
        selectedDate: safeDate.toISOString(),
        eventTitle: "Create Event",
        breadcrumbLabel: "Create Event",
        from: "/alumni-officer/calendar",
      },
    });
  }

  function handleSelectDate(date) {
    setSelectedDate(date);

    const pickedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const localToday = getLocalTodayStart();

    if (pickedDate >= localToday) {
      setDateError("");
    }
  }

  function handlePreviewEvent(event, date = null) {
    const targetDate = date || selectedDate;

    const dateEvents = events.filter((item) =>
      eventOccursOnDate(item, targetDate),
    );

    const clickedIndex = dateEvents.findIndex((item) => item.id === event.id);

    if (date) {
      setSelectedDate(date);
    }

    setSelectedPostIndex(clickedIndex >= 0 ? clickedIndex : 0);
    setOpenPostModal(true);
  }

  function handlePrevPost() {
    setSelectedPostIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }

  function handleNextPost() {
    setSelectedPostIndex((prev) =>
      prev < selectedDateEvents.length - 1 ? prev + 1 : prev,
    );
  }

  function handleEditEvent(event) {
    const latestEvent = events.find((item) => item.id === event?.id) || event;

    if (!latestEvent?.id) return;

    setOpenPostModal(false);

    if (typeof onEditEventPage === "function") {
      onEditEventPage(latestEvent);
      return;
    }

    navigate(`/alumni-officer/calendar/edit/${latestEvent.id}`, {
      state: {
        event: latestEvent,
        eventTitle: latestEvent.title || "Edit Event",
        title: latestEvent.title || "Edit Event",
        breadcrumbLabel: latestEvent.title || "Edit Event",
        from: "/alumni-officer/calendar",
      },
    });
  }

  async function handleCloseEvent(event) {
    if (!event?.id) return;

    try {
      setActionLoadingId(event.id);
      await updateDoc(doc(db, "calendarEvents", event.id), {
        status: "closed",
        effectiveStatus: "closed",
        closedAt: serverTimestamp(),
        closedBySystem: false,
        closedReason: "MANUALLY_CLOSED",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to close event:", error);
    } finally {
      setActionLoadingId("");
    }
  }

  function handleOpenEvent(event) {
    if (!event?.id) return;

    setScheduleEvent(event);
    setScheduleForm(buildScheduleFormFromEvent(event));
    setScheduleError("");
    setOpenPostModal(false);
    setScheduleDialogOpen(true);
  }

  function handleScheduleFieldChange(field, value) {
    setScheduleError("");
    setScheduleForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "eventDate" && (!prev.endDate || prev.endDate < value)
        ? { endDate: value }
        : {}),
      ...(field === "allDay" && value ? { startTime: "", endTime: "" } : {}),
    }));
  }

  function resetScheduleDialogState() {
    setScheduleDialogOpen(false);
    setScheduleConfirmOpen(false);
    setScheduleEvent(null);
    setScheduleError("");

    window.requestAnimationFrame(clearRadixPointerLock);
    window.setTimeout(clearRadixPointerLock, 150);
  }

  function handleConfirmScheduleClick() {
    const error = validateEventScheduleForm(scheduleForm);
    setScheduleError(error);

    if (error) return;

    // Hide the custom schedule modal first so it cannot sit above the
    // confirmation dialog and block clicks.
    setScheduleDialogOpen(false);
    setScheduleConfirmOpen(true);

    window.requestAnimationFrame(clearRadixPointerLock);
  }

  function closeScheduleDialog() {
    if (actionLoadingId) return;
    resetScheduleDialogState();
  }

  async function handleConfirmOpenEventWithSchedule() {
    if (!scheduleEvent?.id) return;

    const error = validateEventScheduleForm(scheduleForm);
    setScheduleError(error);

    if (error) {
      setScheduleConfirmOpen(false);
      setScheduleDialogOpen(true);
      return;
    }

    try {
      setActionLoadingId(scheduleEvent.id);
      await updateDoc(doc(db, "calendarEvents", scheduleEvent.id), {
        eventDate: scheduleForm.eventDate,
        endDate: scheduleForm.endDate,
        startTime: scheduleForm.allDay ? "" : scheduleForm.startTime,
        endTime: scheduleForm.allDay ? "" : scheduleForm.endTime,
        allDay: scheduleForm.allDay,
        status: "published",
        effectiveStatus: "published",
        reopenedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        closedBySystem: false,
        closedReason: null,
      });

      resetScheduleDialogState();
    } catch (error) {
      console.error("Failed to open event:", error);
      setScheduleError(error?.message || "Failed to open event.");
      setScheduleDialogOpen(true);
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleDeleteEvent(event) {
    if (!event?.id) return;

    try {
      setActionLoadingId(event.id);
      await deleteDoc(doc(db, "calendarEvents", event.id));
      setOpenPostModal(false);
      setSelectedPostIndex(0);
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setActionLoadingId("");
    }
  }

  const scheduleFieldErrors = useMemo(() => {
    if (!scheduleDialogOpen) return {};
    return getEventScheduleFieldErrors(scheduleForm);
  }, [scheduleDialogOpen, scheduleForm]);

  const hasScheduleFieldErrors = Object.keys(scheduleFieldErrors).length > 0;

  const scheduleValidationError = useMemo(() => {
    if (!scheduleDialogOpen) return "";
    return validateEventScheduleForm(scheduleForm);
  }, [scheduleDialogOpen, scheduleForm]);

  return (
    <div className="space-y-5">
      <div className="flex w-full items-center justify-end">
        <div className="inline-grid w-[260px] grid-cols-2 rounded-2xl border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className="relative rounded-xl px-4 py-2 text-sm font-semibold"
          >
            {viewMode === "calendar" ? (
              <motion.div
                layoutId="calendar-view-switch"
                className="absolute inset-0 rounded-xl bg-[#3D398C] shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            ) : null}

            <span
              className={[
                "relative z-10 inline-flex items-center gap-2 transition-colors duration-200",
                viewMode === "calendar" ? "text-white" : "text-[#3D398C]",
              ].join(" ")}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className="relative rounded-xl px-4 py-2 text-sm font-semibold"
          >
            {viewMode === "table" ? (
              <motion.div
                layoutId="calendar-view-switch"
                className="absolute inset-0 rounded-xl bg-[#3D398C] shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            ) : null}

            <span
              className={[
                "relative z-10 inline-flex items-center gap-2 transition-colors duration-200",
                viewMode === "table" ? "text-white" : "text-[#3D398C]",
              ].join(" ")}
            >
              <Table2 className="h-4 w-4" />
              Table
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div
            key="calendar-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-5"
          >
            <ReusableCalendarHeader
              currentMonth={currentMonth}
              year={getYear(currentMonth)}
              onToday={handleToday}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onMonthChange={handleMonthSelect}
              onYearChange={handleYearSelect}
              onAddEvent={() => handleAddEvent(selectedDate)}
            />

            {dateError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {dateError}
              </div>
            ) : null}

            <CalendarView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              events={events}
              onSelectDate={handleSelectDate}
              onPreviewEvent={handlePreviewEvent}
            />

            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-[#3D398C]">
                  Events on {format(selectedDate, "MMMM d, yyyy")}
                </h3>
              </div>

              <div className="space-y-2.5 p-5">
                {selectedDateEvents.length ? (
                  selectedDateEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handlePreviewEvent(event, selectedDate)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-left text-xs font-medium transition hover:bg-muted/40"
                      title={event.title}
                    >
                      <div className="truncate text-foreground">
                        {event.title}
                      </div>

                      {(event.startTime || event.endTime) && (
                        <div className="mt-0.5 truncate text-muted-foreground">
                          {formatEventTimeRange12Hour(event)}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#3D398C]/20 bg-[#3D398C]/[0.02] px-4 py-6 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No events on this date
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create one to display it in the selected view.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <CalendarTableView
              events={events}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPreviewEvent={handlePreviewEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onCreateEvent={() => handleAddEvent(selectedDate)}
              onCloseEvent={handleCloseEvent}
              onOpenEvent={handleOpenEvent}
              actionLoadingId={actionLoadingId}
            />
          </motion.div>
        )}
      </AnimatePresence>



      {scheduleDialogOpen ? (
        <div className="fixed inset-0 z-[99999]">
          <div className="absolute inset-0 z-0 bg-black/15 backdrop-blur-[1px]" />

          <div className="relative z-10 flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <h2 className="text-lg font-bold text-foreground">Set event schedule</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the new schedule before reopening this calendar event.
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <ScheduleDatePickerField
                  label="Start Date"
                  value={scheduleForm.eventDate}
                  minDate={getTodayDateInputValue()}
                  error={scheduleFieldErrors.eventDate || ""}
                  onChange={(value) => handleScheduleFieldChange("eventDate", value)}
                />

                <ScheduleDatePickerField
                  label="End Date"
                  value={scheduleForm.endDate}
                  minDate={scheduleForm.eventDate || getTodayDateInputValue()}
                  error={scheduleFieldErrors.endDate || ""}
                  onChange={(value) => handleScheduleFieldChange("endDate", value)}
                />

                {!scheduleForm.allDay ? (
                  <>
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
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#3D398C]/20 bg-[#3D398C]/[0.04] px-4 py-3 text-sm text-muted-foreground md:col-span-2">
                    Start time and end time are disabled for all-day events.
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
                <input
                  type="checkbox"
                  checked={scheduleForm.allDay}
                  onChange={(e) => handleScheduleFieldChange("allDay", e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">All-day</span>
                  <span className="block text-xs text-muted-foreground">
                    Start and end time will not be used.
                  </span>
                </span>
              </label>

              {scheduleError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {scheduleError}
                </div>
              ) : null}

              <div className="rounded-xl border border-[#3D398C]/15 bg-[#3D398C]/[0.03] px-4 py-3 text-sm text-muted-foreground">
                This event will reopen as published with the selected schedule.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={closeScheduleDialog} disabled={Boolean(actionLoadingId)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmScheduleClick}
                disabled={Boolean(actionLoadingId) || Boolean(scheduleError) || hasScheduleFieldErrors}
                className="bg-[#3D398C] text-white hover:bg-[#2f2b73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm Schedule
              </Button>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      <AlertDialog
        open={scheduleConfirmOpen}
        onOpenChange={(open) => {
          setScheduleConfirmOpen(open);

          if (!open && !actionLoadingId) {
            window.requestAnimationFrame(clearRadixPointerLock);
            window.setTimeout(clearRadixPointerLock, 150);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen this event with this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reopen "{scheduleEvent?.title || "this event"}" and set the schedule to {scheduleForm.eventDate || "—"} through {scheduleForm.endDate || "—"}{scheduleForm.allDay ? " as an all-day event" : ` from ${formatTimeForDisplay(scheduleForm.startTime) || "—"} to ${formatTimeForDisplay(scheduleForm.endTime) || "—"}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(actionLoadingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOpenEventWithSchedule}
              disabled={Boolean(actionLoadingId)}
              className="bg-[#3D398C] text-white hover:bg-[#2f2b73]"
            >
              {actionLoadingId === scheduleEvent?.id ? "Opening..." : "Yes, Reopen Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventPostModal
        open={openPostModal}
        onOpenChange={setOpenPostModal}
        event={selectedPostEvent}
        onEditPost={handleEditEvent}
        onDeletePost={handleDeleteEvent}
        onClosePost={handleCloseEvent}
        onOpenPost={handleOpenEvent}
        onPrevPost={handlePrevPost}
        onNextPost={handleNextPost}
        canGoPrev={selectedPostIndex > 0}
        canGoNext={selectedPostIndex < selectedDateEvents.length - 1}
        currentIndex={selectedPostIndex}
        totalCount={selectedDateEvents.length}
      />
    </div>
  );
}