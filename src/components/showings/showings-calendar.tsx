"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarEvent } from "@/lib/queries/showings";
import "./fullcalendar.css";

type ShowingsCalendarProps = {
  events: CalendarEvent[];
  onEventClick?: (showingId: string) => void;
  height?: string;
};

export function ShowingsCalendar({
  events,
  onEventClick,
  height = "600px",
}: ShowingsCalendarProps) {
  return (
    <div className="rounded-md border bg-background p-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height={height}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        nowIndicator
        eventClick={(info) => {
          const showingId = info.event.extendedProps.showingId as
            | string
            | undefined;
          if (showingId && onEventClick) {
            onEventClick(showingId);
          }
        }}
      />
    </div>
  );
}
