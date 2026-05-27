import { useMemo } from "react";
import {
  addDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import {
  buildEventColorMap,
  getEventColorClass,
} from "../calendar-utils/eventHelpers";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_DAY_EVENTS = 2;

function buildCalendarDays(currentMonth) {
  const monthStart = startOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = addDays(calendarStart, 41);

  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
}

function chunkWeeks(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function formatEventTimeRange(event) {
  if (!event?.startTime && !event?.endTime) return "";
  if (event?.startTime && !event?.endTime) return event.startTime;
  if (!event?.startTime && event?.endTime) return event.endTime;
  return `${event.startTime} - ${event.endTime}`;
}

function getLocalTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isPastCalendarDate(date) {
  return date < getLocalTodayStart();
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
    start.getDate()
  );
  const normalizedEnd = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return !isBefore(target, normalizedStart) && !isAfter(target, normalizedEnd);
}

function formatEventDateRange(event) {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);

  if (!start || !end) return "";

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  if (sameDay) return "";

  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
}

function EventChip({
  event,
  onClick,
  compact = false,
  eventClassName = "",
}) {
  const timeText = formatEventTimeRange(event);
  const dateRangeText = formatEventDateRange(event);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        compact
          ? "w-full rounded-lg border px-2 py-1.5 text-left text-[10px] font-medium transition"
          : "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition",
        "hover:opacity-95 hover:shadow-sm",
        eventClassName,
      ].join(" ")}
      title={event.title}
    >
      <div className="truncate">{event.title}</div>
      {dateRangeText ? (
        <div className="mt-0.5 truncate opacity-80">{dateRangeText}</div>
      ) : timeText ? (
        <div className="mt-0.5 truncate opacity-80">{timeText}</div>
      ) : null}
    </button>
  );
}

export default function CalendarView({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
  onPreviewEvent,
}) {
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const calendarWeeks = useMemo(() => chunkWeeks(calendarDays), [calendarDays]);
  const eventColorMap = useMemo(() => buildEventColorMap(events), [events]);

  function getEventsForDate(date) {
    return events.filter((event) => eventOccursOnDate(event, date));
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

        <div className="divide-y divide-border">
          {calendarWeeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid grid-cols-7">
              {week.map((day) => {
                const inCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isPast = isPastCalendarDate(day);
                const dayEvents = getEventsForDate(day);
                const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_DAY_EVENTS);
                const hasOverflow = dayEvents.length >= 3;

                return (
                  <div
                    key={format(day, "yyyy-MM-dd")}
                    className={[
                      "min-h-[150px] border-r border-border px-3 py-3 align-top last:border-r-0",
                      inCurrentMonth ? "bg-background" : "bg-muted/10",
                      isSelected ? "bg-[#3D398C]/[0.035]" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDate(day);

                        if (dayEvents.length > 0) {
                          onPreviewEvent(dayEvents[0], day);
                        }
                      }}
                      className="w-full text-left"
                    >
                      <span
                        className={[
                          "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold transition",
                          isPast
                            ? "bg-muted text-muted-foreground"
                            : isSelected
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
                    </button>

                    <div className="mt-2 flex-1 space-y-1.5 overflow-hidden">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewEvent(dayEvents[0], day);
                          }}
                            className="mt-1 flex w-full items-center justify-center rounded-md border border-dashed border-[#3D398C]/35 bg-[#3D398C]/[0.06] py-1 text-xs font-bold tracking-widest text-[#3D398C] transition hover:bg-[#3D398C]/[0.1] hover:border-[#3D398C]/50"
                        >
                          ...
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}