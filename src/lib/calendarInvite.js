// Builds a universal .ics invite for the daily AQLA reminder (Apple, Outlook, Fastmail, etc.).
const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

export function reminderStart() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(8, 0, 0, 0);
  return start;
}

export function icsDataUrl(protocol) {
  const start = reminderStart();
  const end = new Date(start.getTime() + 15 * 60000);
  const days = protocol?.duration_days || 14;
  const title = protocol ? `AQLA — ${protocol.name}` : "AQLA daily check-in";
  const details = protocol
    ? `Today's protocol actions and daily check-in. Objective: ${protocol.objective}. Open AQLA: ${window.location.origin}/dashboard`
    : `Log your clarity, energy, stress and sleep in AQLA. Open AQLA: ${window.location.origin}/dashboard`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AQLA//Daily Reminder//EN",
    "BEGIN:VEVENT",
    `UID:aqla-${Date.now()}@aqla`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `RRULE:FREQ=DAILY;COUNT=${days}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT5M",
    "ACTION:DISPLAY",
    "DESCRIPTION:AQLA check-in",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}