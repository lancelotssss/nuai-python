import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormField, PerksFormSectionCard } from "./PerksFormSectionCard";

const HOUR_OPTIONS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

const PERIOD_OPTIONS = ["AM", "PM"];

function parseDateValue(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    digits: `${String(hour).padStart(2, "0")}${String(minute).padStart(
      2,
      "0",
    )}`,
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
    digits: `${String(hour12).padStart(2, "0")}${String(minute).padStart(
      2,
      "0",
    )}`,
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

function DatePickerField({
  label,
  value,
  minDate,
  placeholder,
  error,
  onChange,
  onBlur,
}) {
  const selectedDate = parseDateValue(value);
  const parsedMinDate = parseDateValue(minDate);

  const today = new Date();
  const fallbackMinDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const effectiveMinDate = parsedMinDate || fallbackMinDate;
  const baseDate = selectedDate || effectiveMinDate || today;

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(baseDate.getMonth());
  const [year, setYear] = useState(baseDate.getFullYear());

  useEffect(() => {
    const nextBaseDate = selectedDate || effectiveMinDate || today;
    setMonth(nextBaseDate.getMonth());
    setYear(nextBaseDate.getFullYear());
  }, [value, minDate]);

  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const yearStart = effectiveMinDate.getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => yearStart + i);

  const displayedMonth = new Date(year, month, 1);

  return (
    <FormField label={label} required error={error}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) onBlur?.();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={[
              "h-11 w-full justify-between rounded-xl px-3 text-left font-normal shadow-none",
              error
                ? "border-destructive focus-visible:ring-destructive/20"
                : "border-input",
            ].join(" ")}
          >
            <span
              className={[
                "truncate text-sm font-normal",
                selectedDate ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              {selectedDate
                ? format(selectedDate, "MMMM dd, yyyy")
                : placeholder}
            </span>

            <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[300px] rounded-xl border border-border bg-background p-3 shadow-md"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground outline-none"
            >
              {monthOptions.map((monthLabel, index) => (
                <option key={monthLabel} value={index}>
                  {monthLabel}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-8 w-[96px] rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground outline-none"
            >
              {yearOptions.map((yearValue) => (
                <option key={yearValue} value={yearValue}>
                  {yearValue}
                </option>
              ))}
            </select>
          </div>

          <Calendar
            mode="single"
            month={displayedMonth}
            selected={selectedDate || undefined}
            onMonthChange={(date) => {
              setMonth(date.getMonth());
              setYear(date.getFullYear());
            }}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatDateValue(date));
              setOpen(false);
            }}
            disabled={(date) => date < effectiveMinDate}
            showOutsideDays={false}
            fixedWeeks
            initialFocus
            className="w-full p-0"
            classNames={{
              months: "flex w-full flex-col",
              month: "w-full space-y-2",
              caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse",
              head_row: "grid grid-cols-7",
              head_cell:
                "flex h-8 items-center justify-center text-xs font-medium text-muted-foreground",
              row: "mt-1 grid grid-cols-7",
              cell: "flex h-10 items-center justify-center p-0",
              day: "flex h-9 w-9 items-center justify-center rounded-full p-0 text-sm font-normal text-foreground hover:bg-accent hover:text-foreground",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "border border-border bg-muted text-foreground",
              day_outside: "hidden",
              day_disabled:
                "pointer-events-none text-muted-foreground opacity-35 line-through",
              day_hidden: "invisible pointer-events-none",
            }}
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

function TimeField({ label, value, error, onChange, onBlur, disabled = false }) {
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
    <FormField label={label} required error={error}>
      <div ref={rootRef} className="relative">
        <div
          className={[
            "flex h-11 w-full items-center rounded-xl border bg-background pr-3 text-sm transition",
            "hover:bg-muted/30",
            error ? "border-destructive" : "border-input",
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

        {open ? (
          <div className="absolute left-0 top-[calc(100%+6px)] z-[9999] rounded-xl border border-border bg-popover p-1 shadow-xl">
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
    </FormField>
  );
}

export default function PerksStepDates({
  startDate,
  endDate,
  startTime,
  endTime,
  allDay,
  minDate,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
  setAllDay,
  touchField,
  shouldShowFieldError,
  errors,
}) {
  const startDateError =
    shouldShowFieldError("startDate", 3) ? errors.startDate : "";
  const endDateError =
    shouldShowFieldError("endDate", 3) ? errors.endDate : "";
  const startTimeError =
    shouldShowFieldError("startTime", 3) ? errors.startTime : "";
  const endTimeError =
    shouldShowFieldError("endTime", 3) ? errors.endTime : "";

  function handleToggleAllDay() {
    const nextValue = !Boolean(allDay);
    setAllDay(nextValue);

    if (nextValue) {
      setStartTime("");
      setEndTime("");
    }

    touchField?.("allDay");
  }

  return (
    <PerksFormSectionCard
      icon={CalendarDays}
      title="Step 3: Dates & Time"
      helper="Set the start date, end date, and time of the perk."
    >
      <div className="space-y-1">
        <div className="grid gap-4 md:grid-cols-2">
          <DatePickerField
            label="Start Date"
            value={startDate}
            minDate={minDate}
            placeholder="Select start date"
            error={startDateError}
            onChange={setStartDate}
            onBlur={() => touchField("startDate")}
          />

          <DatePickerField
            label="End Date"
            value={endDate}
            minDate={startDate || minDate}
            placeholder="Select end date"
            error={endDateError}
            onChange={setEndDate}
            onBlur={() => touchField("endDate")}
          />
        </div>

        {!allDay ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TimeField
              label="Start Time"
              value={startTime || ""}
              error={startTimeError}
              onChange={setStartTime}
              onBlur={() => touchField("startTime")}
            />

            <TimeField
              label="End Time"
              value={endTime || ""}
              error={endTimeError}
              onChange={setEndTime}
              onBlur={() => touchField("endTime")}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#3D398C]/20 bg-[#3D398C]/[0.04] px-4 py-3 text-sm text-muted-foreground">
            Start time and end time are disabled for all-day perks.
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleAllDay}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-muted/30"
        >
          <span
            className={[
              "flex h-5 w-5 items-center justify-center rounded border text-xs font-bold transition",
              allDay
                ? "border-[#3D398C] bg-[#3D398C] text-white"
                : "border-input bg-background text-transparent",
            ].join(" ")}
          >
            ✓
          </span>

          <div>
            <p className="text-sm font-medium text-foreground">All-day</p>
            <p className="text-xs text-muted-foreground">
              This perk lasts the whole day, so start and end time will not be
              used.
            </p>
          </div>
        </button>
      </div>
    </PerksFormSectionCard>
  );
}