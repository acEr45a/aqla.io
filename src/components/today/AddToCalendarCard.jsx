import React, { useState } from "react";
import { CalendarPlus, Download, X } from "lucide-react";
import { icsDataUrl } from "@/lib/calendarInvite";

const KEY = "aqla-calendar-card-dismissed";

// Google Calendar template link — a daily reminder for the 14-day cycle.
function calendarUrl(protocol) {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(8, 0, 0, 0);
  const end = new Date(start.getTime() + 15 * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const days = protocol?.duration_days || 14;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: protocol ? `AQLA — ${protocol.name}` : "AQLA daily check-in",
    dates: `${fmt(start)}/${fmt(end)}`,
    recur: `RRULE:FREQ=DAILY;COUNT=${days}`,
    details: protocol
      ? `Today's protocol actions and daily check-in.\n\nObjective: ${protocol.objective}\n\nOpen AQLA: ${window.location.origin}/dashboard`
      : `Log your clarity, energy, stress and sleep in AQLA.\n\nOpen AQLA: ${window.location.origin}/dashboard`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function AddToCalendarCard({ protocol }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === "1");
  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setHidden(true);
  };

  return (
    <div data-tour="calendar" className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-wrap items-center justify-between gap-4 relative">
      <button onClick={dismiss} aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
      <div className="pr-8">
        <p className="font-display text-foreground">Add your daily reminder to your calendar</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">
          Creates a recurring 8:00 reminder for your {protocol?.duration_days || 14}-day cycle so your check-in and protocol actions never slip.
          Use Google, or download the invite for Apple Calendar, Outlook and any other app.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a href={calendarUrl(protocol)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          <CalendarPlus className="w-3.5 h-3.5" /> Google Calendar
        </a>
        <a href={icsDataUrl(protocol)} download="aqla-daily-reminder.ics"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/70 text-foreground text-xs font-medium hover:bg-secondary/60">
          <Download className="w-3.5 h-3.5" /> Other calendar (.ics)
        </a>
      </div>
    </div>
  );
}