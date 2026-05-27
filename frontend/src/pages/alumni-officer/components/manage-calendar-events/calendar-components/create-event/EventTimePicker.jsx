import * as React from "react";
import { Clock3 } from "lucide-react";

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

export default function EventTimePicker({
  label = "Select time",
  placeholder = "00:00:AM",
  value24 = "",
  onChange,
  onBlur,
  getContainer,
  error = false,
}) {
  const initialMask = toMaskFromTimeValue(value24);

  const [open, setOpen] = React.useState(false);
  const [digits, setDigits] = React.useState(initialMask.digits);
  const [period, setPeriod] = React.useState(initialMask.period);
  const [cursorIndex, setCursorIndex] = React.useState(0);

  const rootRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const popoverRef = React.useRef(null);
  const skipNextSyncRef = React.useRef(false);
  const selectingOptionRef = React.useRef(false);

  const pickerParts = React.useMemo(
    () => toPickerPartsFromMask(digits, period),
    [digits, period],
  );

  React.useEffect(() => {
    const input = inputRef.current;

    if (!input || document.activeElement !== input) return;

    const start = getMaskedSelectionIndex(cursorIndex);

    window.requestAnimationFrame(() => {
      input.setSelectionRange(start, start + 1);
    });
  }, [cursorIndex, digits, period]);

  React.useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const nextMask = toMaskFromTimeValue(value24);
    setDigits(nextMask.digits);
    setPeriod(nextMask.period);
    setCursorIndex(0);
  }, [value24]);

  React.useEffect(() => {
    if (!open) return undefined;

    function handleDocumentClick(event) {
      if (!rootRef.current) return;

      const clickedInsideInput = rootRef.current.contains(event.target);
      const clickedInsidePopover = popoverRef.current?.contains(event.target);

      if (clickedInsideInput || clickedInsidePopover) return;

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

    if (nextValue !== value24) {
      skipNextSyncRef.current = true;
      onChange?.(nextValue);
    }
  }

  function updateTime(nextParts) {
    const nextHour = nextParts.hour ?? pickerParts.hour;
    const nextMinute = nextParts.minute ?? pickerParts.minute;
    const nextPeriod = nextParts.period ?? pickerParts.period;

    const nextDigits = `${nextHour}${nextMinute}`;

    setCursorIndex(0);
    commitTime(nextDigits, nextPeriod, true);

    window.requestAnimationFrame(() => {
      selectingOptionRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, 1);
      onBlur?.();
    });
  }

  function handleKeyDown(e) {
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
    if (selectingOptionRef.current) return;

    commitTime(digits, period, true);
    onBlur?.();
  }

  function handleOptionMouseDown(e) {
    e.preventDefault();
    selectingOptionRef.current = true;
  }

  function optionButtonClass(active) {
    return [
      "flex h-9 min-w-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition",
      active
        ? "bg-[#3D398C] text-white shadow-sm hover:bg-[#2f2b73]"
        : "text-foreground hover:bg-muted",
    ].join(" ");
  }

  return (
    <div
      ref={rootRef}
      className={[
        "relative flex h-11 w-full items-center rounded-xl bg-background transition",
        error
          ? "border border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
          : "border border-input focus-within:border-[#3D398C]/40 focus-within:ring-2 focus-within:ring-[#3D398C]/10",
      ].join(" ")}
      aria-label={label}
    >
      <input
        ref={inputRef}
        type="text"
        value={toMaskedDisplay(digits, period)}
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
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground"
      />

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setOpen((prev) => !prev);

          window.requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }}
        className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Open time picker"
      >
        <Clock3 className="h-4 w-4" />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          className="absolute left-0 top-[calc(100%+6px)] z-20 rounded-xl border border-border bg-popover p-1 shadow-xl"
        >
          <div className="grid grid-cols-[64px_64px_64px] gap-1">
            <div className="max-h-60 overflow-y-auto pr-1">
              {HOUR_OPTIONS.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onMouseDown={handleOptionMouseDown}
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
                  onMouseDown={handleOptionMouseDown}
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
                  onMouseDown={handleOptionMouseDown}
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
  );
}