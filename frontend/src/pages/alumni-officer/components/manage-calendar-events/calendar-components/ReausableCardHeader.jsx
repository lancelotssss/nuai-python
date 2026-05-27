import { useMemo } from "react";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const BRAND = "#3D398C";

const MONTH_OPTIONS = [
  { value: 0, label: "Jan" },
  { value: 1, label: "Feb" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Apr" },
  { value: 4, label: "May" },
  { value: 5, label: "Jun" },
  { value: 6, label: "Jul" },
  { value: 7, label: "Aug" },
  { value: 8, label: "Sep" },
  { value: 9, label: "Oct" },
  { value: 10, label: "Nov" },
  { value: 11, label: "Dec" },
];

function buildYearOptions(centerYear = new Date().getFullYear(), range = 8) {
  return Array.from({ length: range * 2 + 1 }, (_, index) => {
    const year = centerYear - range + index;
    return { value: year, label: String(year) };
  });
}

function SelectField({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={[
        "h-10 rounded-xl border bg-background px-3 text-sm font-medium text-foreground outline-none transition",
        "border-[#3D398C]/15 hover:border-[#3D398C]/30",
        "focus:border-[#3D398C]/40 focus:ring-2 focus:ring-[#3D398C]/10",
        className,
      ].join(" ")}
    >
      {children}
    </select>
  );
}

export default function ReusableCalendarHeader({
  currentMonth,
  year,
  onToday,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
  onYearChange,
  onAddEvent,
}) {
  const yearOptions = useMemo(() => buildYearOptions(year, 8), [year]);

  return (
    <Card className="border-[#3D398C]/15 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onToday}
              className="h-10 rounded-xl border-[#3D398C]/20 bg-[#3D398C]/[0.04] text-[#000000] hover:bg-[#3D398C]/10 hover:text-[#000000]"
            >
              Today
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onPrevMonth}
              className="h-10 w-10 rounded-xl text-[#000000] hover:bg-[#3D398C]/10 hover:text-[#000000]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="ml-1 text-3xl font-semibold tracking-tight text-[#000000]">
              {currentMonth.toLocaleString("en-PH", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              className="h-10 w-10 rounded-xl text-[#3D398C] hover:bg-[#3D398C]/10 hover:text-[#3D398C]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              value={currentMonth.getMonth()}
              onChange={onMonthChange}
              className="min-w-[88px]"
            >
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              value={year}
              onChange={onYearChange}
              className="min-w-[92px]"
            >
              {yearOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>

            {typeof onAddEvent === "function" ? (
              <Button
                type="button"
                onClick={onAddEvent}
                className="ml-1 h-10 rounded-xl bg-[#3D398C] px-4 text-white hover:bg-[#2f2b73]"
              >
                <PlusCircle size={15} />
                Create Event
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}