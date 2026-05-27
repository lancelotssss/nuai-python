import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import EventTimePicker from "./EventTimePicker.jsx";

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

function normalizeDateStart(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateValue(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return normalizeDateStart(parsed);
}

function formatDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function DateField({
  label,
  value,
  onChange,
  error,
  placeholder,
  minDate,
}) {
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const effectiveMinDate = normalizeDateStart(minDate) || todayStart;
  const effectiveMinTime = effectiveMinDate.getTime();
  const baseDate =
    selectedDate && selectedDate >= effectiveMinDate
      ? selectedDate
      : selectedDate || effectiveMinDate;

  const [month, setMonth] = useState(baseDate.getMonth());
  const [year, setYear] = useState(baseDate.getFullYear());

  useEffect(() => {
    const nextSelectedDate = parseDateValue(value);
    const nextBaseDate =
      nextSelectedDate && nextSelectedDate >= effectiveMinDate
        ? nextSelectedDate
        : nextSelectedDate || effectiveMinDate;

    setMonth(nextBaseDate.getMonth());
    setYear(nextBaseDate.getFullYear());
  }, [value, effectiveMinTime]);

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

  const yearStart = Math.min(
    effectiveMinDate.getFullYear(),
    selectedDate?.getFullYear?.() ?? effectiveMinDate.getFullYear()
  );
  const yearOptions = Array.from({ length: 8 }, (_, i) => yearStart + i);

  const displayedMonth = new Date(year, month, 1);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {label} <span className="ml-1 text-destructive">*</span>
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={[
              "h-11 w-full justify-between rounded-xl px-3 text-left font-normal shadow-none",
              error
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                : "border-input",
            ].join(" ")}
          >
            <span
              className={[
                "truncate text-sm",
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
          className="z-[100001] w-[300px] rounded-xl border border-border bg-background p-3 shadow-md"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground outline-none"
            >
              {monthOptions.map((label, index) => (
                <option key={label} value={index}>
                  {label}
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
              const normalizedDate = normalizeDateStart(date);
              if (!normalizedDate || normalizedDate < effectiveMinDate) return;

              onChange(formatDateValue(normalizedDate));
              setOpen(false);
            }}
            disabled={(date) => {
              const normalizedDate = normalizeDateStart(date);
              return !normalizedDate || normalizedDate < effectiveMinDate;
            }}
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export default function EventSchedule({
  form,
  errors,
  onChange,
  onBlur,
  getTimePickerContainer,
  allowPastStartDate = false,
}) {
  const startDateObject = parseDateValue(form.eventDate);

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startDateMin =
    allowPastStartDate && startDateObject ? startDateObject : todayStart;

  const endDateMin = startDateObject || startDateMin;

  return (
    <div className="rounded-2xl border border-border p-5">
      <SectionHeader
        icon={CalendarDays}
        title="Step 2: Schedule"
        helper="Set the date range and time for the event."
      />

      <div className="mt-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <DateField
            label="Start Date"
            value={form.eventDate}
            onChange={(value) => onChange("eventDate", value)}
            error={errors.eventDate}
            placeholder="Select start date"
            minDate={startDateMin}
          />

          <DateField
            label="End Date"
            value={form.endDate}
            onChange={(value) => onChange("endDate", value)}
            error={errors.endDate}
            placeholder="Select end date"
            minDate={endDateMin}
          />
        </div>

        {!form.allDay ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Start Time" required error={errors.startTime}>
              <EventTimePicker
                label="Start time"
                value24={form.startTime}
                onChange={(value) => onChange("startTime", value)}
                onBlur={() => onBlur("startTime")}
                getContainer={getTimePickerContainer}
                error={Boolean(errors.startTime)}
              />
            </FormField>

            <FormField label="End Time" required error={errors.endTime}>
              <EventTimePicker
                label="End time"
                value24={form.endTime}
                onChange={(value) => onChange("endTime", value)}
                onBlur={() => onBlur("endTime")}
                getContainer={getTimePickerContainer}
                error={Boolean(errors.endTime)}
              />
            </FormField>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#3D398C]/20 bg-[#3D398C]/[0.04] px-4 py-3 text-sm text-muted-foreground">
            Start time and end time are disabled for all-day events.
          </div>
        )}

        <label className="flex items-center gap-3 rounded-xl px-4 py-3">
          <input
            type="checkbox"
            checked={Boolean(form.allDay)}
            onChange={(e) => onChange("allDay", e.target.checked)}
            className="h-4 w-4 rounded border-input text-[#3D398C] focus:ring-[#3D398C]/20"
          />
          <div>
            <p className="text-sm font-medium text-foreground">All-day</p>
            <p className="text-xs text-muted-foreground">
              This event lasts the whole day, so start and end time will not be used.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}