import React from "react";
import { CalendarPlus, Download } from "lucide-react";
import { googleCalendarUrl, appointmentIcsDataUrl, formatSlotLocal } from "@/lib/appointmentInvite";

/**
 * Adds a clinician appointment slot to any calendar with no OAuth keys.
 * `start` is a Date; `minutes` defaults to a 30-minute consult.
 */
export default function AppointmentCalendarButtons({
  start,
  minutes = 30,
  title = "AQLA clinician consultation",
  details = "",
  location = "AQLA (online)",
}) {
  if (!start) return null;
  const end = new Date(start.getTime() + minutes * 60000);
  const event = { title, details, location, start, end };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{formatSlotLocal(start)}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          <CalendarPlus className="h-3.5 w-3.5" /> Add to Google Calendar
        </a>
        <a
          href={appointmentIcsDataUrl(event)}
          download="aqla-appointment.ics"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" /> Apple / Outlook
        </a>
      </div>
    </div>
  );
}