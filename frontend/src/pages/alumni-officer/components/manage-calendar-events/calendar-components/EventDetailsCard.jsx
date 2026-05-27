import { format, parseISO } from "date-fns";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatEventTimeRange(event) {
  if (!event?.startTime && !event?.endTime) return "";
  if (event?.startTime && event?.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }
  return event?.startTime || event?.endTime || "";
}

export default function EventDetailsCard({ event }) {
  if (!event) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D398C]/10">
              <CalendarDays className="h-5 w-5 text-[#3D398C]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Event Preview</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click an event inside the calendar or table to preview its details here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCategory =
    event.category === "others" ? event.customCategory : event.category;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#3D398C]">
          {event.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {event.eventDate
                ? format(parseISO(event.eventDate), "MMMM d, yyyy")
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Time
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatEventTimeRange(event) || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </p>
            <p className="mt-1 text-sm font-semibold capitalize text-foreground">
              {displayCategory || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Posted On
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {(event.postedOn || []).join(", ") || "calendar"}
            </p>
          </div>
        </div>

        {event.location ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-[#3D398C]" />
            <span>{event.location}</span>
          </div>
        ) : null}

        {(event.startTime || event.endTime) ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4 text-[#3D398C]" />
            <span>{formatEventTimeRange(event)}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-background px-4 py-4">
          <p className="text-sm leading-relaxed text-foreground">
            {event.description || "No description provided."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
