import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getYear,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  buildEventColorMap,
  getEventColorClass,
} from "../calendar-utils/eventHelpers";

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

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_DAY_EVENTS = 2;

function buildYearOptions(centerYear = new Date().getFullYear(), range = 8) {
  return Array.from({ length: range * 2 + 1 }, (_, index) => {
    const year = centerYear - range + index;
    return { value: year, label: String(year) };
  });
}

function buildCalendarDays(currentMonth) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
}

function formatEventTimeRange(event) {
  if (!event?.startTime && !event?.endTime) return "";
  if (event?.startTime && event?.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }
  return event?.startTime || event?.endTime || "";
}

function SelectField({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={[
        "h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition",
        "focus:border-[#3D398C]/40 focus:ring-2 focus:ring-[#3D398C]/10",
        className,
      ].join(" ")}
    >
      {children}
    </select>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition",
        active
          ? "border-[#3D398C] bg-[#3D398C] text-white shadow-sm"
          : "border-border bg-background text-[#3D398C] hover:bg-[#3D398C]/5",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function SummaryCard({ icon: Icon, title, value, subtitle, tone = "blue" }) {
  const tones = {
    blue: {
      iconBg: "bg-[#3D398C]/10",
      iconText: "text-[#3D398C]",
      valueText: "text-[#3D398C]",
    },
    cyan: {
      iconBg: "bg-[#18B4E8]/10",
      iconText: "text-[#18B4E8]",
      valueText: "text-[#18B4E8]",
    },
    amber: {
      iconBg: "bg-[#F59E0B]/10",
      iconText: "text-[#D97706]",
      valueText: "text-[#D97706]",
    },
    green: {
      iconBg: "bg-[#22C55E]/10",
      iconText: "text-[#16A34A]",
      valueText: "text-[#16A34A]",
    },
  };

  const toneClasses = tones[tone] || tones.blue;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={[
              "flex h-11 w-11 items-center justify-center rounded-xl",
              toneClasses.iconBg,
            ].join(" ")}
          >
            <Icon className={["h-5 w-5", toneClasses.iconText].join(" ")} />
          </div>

          <div className="min-w-0">
            <p
              className={[
                "text-3xl font-bold leading-none",
                toneClasses.valueText,
              ].join(" ")}
            >
              {value}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventChip({
  event,
  onClick,
  compact = false,
  eventClassName = "",
}) {
  const timeText = formatEventTimeRange(event);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        compact
          ? "w-full rounded-lg border px-2 py-1 text-left text-[10px] font-medium transition"
          : "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition",
        "hover:opacity-95 hover:shadow-sm",
        eventClassName,
      ].join(" ")}
      title={event.title}
    >
      <div className="truncate">{event.title}</div>
      {timeText ? <div className="mt-0.5 truncate opacity-80">{timeText}</div> : null}
    </button>
  );
}

function CalendarModeView({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
  onPreviewEvent,
}) {
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const eventColorMap = useMemo(() => buildEventColorMap(events), [events]);

  function getEventsForDate(date) {
    const dateKey = format(date, "yyyy-MM-dd");
    return events.filter((event) => {
      const start = event?.eventDate;
      const end = event?.endDate || event?.eventDate;
      return start <= dateKey && end >= dateKey;
    });
  }

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-border bg-[#3D398C]/[0.03]">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="border-r border-border px-2 py-3 text-center text-xs font-semibold text-[#3D398C] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDate(day);
            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_DAY_EVENTS);
            const hasOverflow = dayEvents.length >= 3;

            return (
              <button
                key={`${format(day, "yyyy-MM-dd")}-${index}`}
                type="button"
                onClick={() => {
                  onSelectDate(day);

                  if (dayEvents.length > 0) {
                    onPreviewEvent(dayEvents[0], day);
                  }
                }}
                className={[
                  "h-[120px] w-full border-r border-b border-border px-2.5 py-2 text-left align-top transition",
                  "focus:outline-none",
                  "flex flex-col overflow-hidden",
                  inCurrentMonth
                    ? "bg-background hover:bg-[#3D398C]/[0.02]"
                    : "bg-muted/10 hover:bg-muted/20",
                  isSelected ? "bg-[#3D398C]/[0.035]" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={[
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold transition",
                      isSelected
                        ? "bg-[#3D398C] text-white"
                        : isToday
                        ? "bg-[#18B4E8]/10 text-[#18B4E8]"
                        : inCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="mt-2 flex-1 overflow-hidden">
                  <div className="space-y-1">
                    {visibleEvents.map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        compact
                        eventClassName={getEventColorClass(event, eventColorMap)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewEvent(event, day);
                        }}
                      />
                    ))}

                    {hasOverflow ? (
                      <p className="px-1 text-[10px] font-medium text-[#3D398C]/70">
                        ...
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TableModeView({
  events,
  selectedDate,
  onSelectDate,
  onPreviewEvent,
}) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = `${a.eventDate || ""} ${a.startTime || ""}`;
      const dateB = `${b.eventDate || ""} ${b.startTime || ""}`;
      return dateA.localeCompare(dateB);
    });
  }, [events]);

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-0">
        <div className="hidden grid-cols-[160px_140px_1fr_160px_140px] border-b border-border bg-[#3D398C]/[0.03] md:grid">
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#3D398C]">
            Date
          </div>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#3D398C]">
            Time
          </div>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#3D398C]">
            Event
          </div>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#3D398C]">
            Category
          </div>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#3D398C]">
            Location
          </div>
        </div>

        {sortedEvents.length ? (
          <div className="divide-y divide-border">
            {sortedEvents.map((event) => {
              const isSelected =
                selectedDate &&
                event.eventDate === format(selectedDate, "yyyy-MM-dd");
              const displayCategory =
                event.category === "others"
                  ? event.customCategory
                  : event.category;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    const eventDate = parseISO(event.eventDate);
                    onSelectDate(eventDate);
                    onPreviewEvent(event, eventDate);
                  }}
                  className={[
                    "block w-full text-left transition hover:bg-[#3D398C]/[0.025]",
                    isSelected ? "bg-[#3D398C]/[0.04]" : "bg-background",
                  ].join(" ")}
                >
                  <div className="grid gap-3 px-4 py-4 md:grid-cols-[160px_140px_1fr_160px_140px] md:items-center">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground md:hidden">
                        Date
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {event.eventDate
                          ? format(parseISO(event.eventDate), "MMM d, yyyy")
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground md:hidden">
                        Time
                      </p>
                      <p className="text-sm text-foreground">
                        {formatEventTimeRange(event) || "—"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">
                        Event
                      </p>
                      <p className="truncate text-sm font-semibold text-[#3D398C]">
                        {event.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {event.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground md:hidden">
                        Category
                      </p>
                      <p className="text-sm capitalize text-foreground">
                        {displayCategory || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground md:hidden">
                        Location
                      </p>
                      <p className="truncate text-sm text-foreground">
                        {event.location || "—"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No events found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one to display it in table mode.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReusableCalendar({
  currentMonth,
  selectedDate,
  selectedDateEvents,
  events,
  viewMode,
  setViewMode,
  draftCount,
  publishedCount,
  onToday,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
  onYearChange,
  onSelectDate,
  onPreviewEvent,
  onAddEvent,
  year,
}) {
  const yearOptions = useMemo(() => buildYearOptions(year, 8), [year]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={CalendarDays}
          title="Total Events"
          value={events.length}
          subtitle="All scheduled events"
          tone="blue"
        />
        <SummaryCard
          icon={Eye}
          title="Published"
          value={publishedCount}
          subtitle="Visible to alumni"
          tone="green"
        />
        <SummaryCard
          icon={CircleDashed}
          title="Drafts"
          value={draftCount}
          subtitle="Saved but not posted"
          tone="amber"
        />
        <SummaryCard
          icon={FileText}
          title="Selected Date"
          value={selectedDateEvents.length}
          subtitle="Events on chosen day"
          tone="cyan"
        />
      </div>

      <Card className="mt-6 border-border shadow-sm">
        <CardHeader className="gap-4 border-b border-border pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onToday}
                className="h-10 rounded-xl border-border bg-background text-foreground hover:bg-muted/40"
              >
                Today
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onPrevMonth}
                className="h-10 w-10 rounded-xl text-foreground hover:bg-muted/40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="ml-1 text-3xl font-semibold tracking-tight text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onNextMonth}
                className="h-10 w-10 rounded-xl text-foreground hover:bg-muted/40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SelectField
                value={currentMonth.getMonth()}
                onChange={onMonthChange}
                className="min-w-[88px] bg-background"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </SelectField>

              <SelectField
                value={getYear(currentMonth)}
                onChange={onYearChange}
                className="min-w-[92px] bg-background"
              >
                {yearOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectField>

              <div className="ml-1 flex items-center gap-2">
                <ModeButton
                  active={viewMode === "calendar"}
                  icon={LayoutGrid}
                  label="Calendar"
                  onClick={() => setViewMode("calendar")}
                />
                <ModeButton
                  active={viewMode === "table"}
                  icon={List}
                  label="Table"
                  onClick={() => setViewMode("table")}
                />
              </div>

              <Button
                type="button"
                onClick={onAddEvent}
                className="h-10 rounded-xl bg-[#3D398C] px-4 text-white hover:bg-[#2f2b73]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>
          </div>

          <CardTitle className="text-base font-semibold text-foreground">
            Manage Calendar & Events
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 md:p-6">
          {viewMode === "calendar" ? (
            <CalendarModeView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              events={events}
              onSelectDate={onSelectDate}
              onPreviewEvent={onPreviewEvent}
            />
          ) : (
            <TableModeView
              events={events}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              onPreviewEvent={onPreviewEvent}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}