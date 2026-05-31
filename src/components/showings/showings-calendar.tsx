"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarEvent } from "@/lib/queries/showings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showingStatusLabel } from "@/lib/utils/format";
import "./fullcalendar.css";

const LEGEND = [
  { label: "Scheduled", color: "#0d9488", status: "scheduled" },
  { label: "Completed", color: "#059669", status: "completed" },
  { label: "Cancelled", color: "#64748b", status: "cancelled" },
  { label: "No show", color: "#e11d48", status: "no_show" },
  { label: "Unavailable", color: "#475569", status: "block" },
] as const;

type ShowingsCalendarProps = {
  events: CalendarEvent[];
  onEventClick?: (showingId: string) => void;
  height?: string;
  title?: string;
};

export function ShowingsCalendar({
  events,
  onEventClick,
  height = "640px",
  title = "Showing schedule",
}: ShowingsCalendarProps) {
  const eventsWithClasses = events.map((event) => ({
    ...event,
    classNames:
      event.extendedProps.type === "block" ? ["event-block"] : undefined,
  }));

  return (
    <Card className="overflow-hidden shadow-sm ring-1 ring-border/60">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Week, day, and month views · click an event for details
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGEND.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/5"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-4 md:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
          }}
          events={eventsWithClasses}
          height={height}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator
          weekends
          dayHeaderFormat={{ weekday: "short", month: "numeric", day: "numeric" }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          eventClick={(info) => {
            const showingId = info.event.extendedProps.showingId as
              | string
              | undefined;
            if (showingId && onEventClick) {
              onEventClick(showingId);
            }
          }}
          eventDidMount={(info) => {
            const status = info.event.extendedProps.status as string | undefined;
            if (status) {
              info.el.setAttribute(
                "title",
                `${info.event.title} — ${showingStatusLabel(status)}`
              );
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
