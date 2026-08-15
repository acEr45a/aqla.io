// Keyless calendar integration for clinician appointment slots.
//
// No OAuth, no API keys, no connector: Google accepts a plain "TEMPLATE" URL
// that pre-fills its event composer, and every other client (Apple, Outlook,
// Fastmail) reads a .ics file. Between the two, this covers Google Calendar and
// the rest without ever touching a credential.
//
// Trade-off to be aware of: the user confirms the event in their own calendar
// UI. This cannot read a clinician's existing availability or write silently in
// the background — that genuinely requires OAuth.

const fmtUtc = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

const escapeIcsText = (s = "") =>
  String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Google Calendar composer link. `start`/`end` are Date objects. */
export function googleCalendarUrl({ title, details, location, start, end }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmtUtc(start)}/${fmtUtc(end)}`,
    details: details || "",
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Universal .ics data URL for every non-Google client. */
export function appointmentIcsDataUrl({ title, details, location, start, end }) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AQLA//Clinician Appointment//EN",
    "BEGIN:VEVENT",
    `UID:aqla-appt-${start.getTime()}@aqla`,
    `DTSTAMP:${fmtUtc(new Date())}`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/**
 * Local wall-clock time shown next to the button, with the resolved zone name,
 * so a clinician and a member in different regions never read the same slot as
 * two different times.
 */
export function formatSlotLocal(start) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const label = new Intl.DateTimeFormat(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit",
  }).format(start);
  return `${label} (${zone})`;
}