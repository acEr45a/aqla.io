// Shared helpers for AQLA summary emails (weekly + end-of-plan).

export function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Sunday-anchored week key, e.g. "week-2026-07-26"
export function weekKey(date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return `week-${dateKey(start)}`;
}

export function withinLastDays(dateStr, days, now = new Date()) {
  if (!dateStr) return false;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(dateStr) >= cutoff;
}

export function daysSince(dateStr, now = new Date()) {
  if (!dateStr) return 0;
  return Math.floor((now - new Date(dateStr)) / 86400000);
}

function checkInLines(checkIns) {
  return JSON.stringify(checkIns.map((c) => ({
    date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress,
    sleep_quality: c.sleep_quality, caffeine_servings: c.caffeine_servings,
    caffeine_last_time: c.caffeine_last_time, demand: c.demand, note: c.note,
  })));
}

const RULES = `STRICT RULES: use ONLY the data provided. Never invent numbers, times, windows, trends or events. State uncertainty when the sample is small. No diagnosis, no medication advice. AQLA is a neural wellness platform and does not diagnose, treat, prevent or cure any condition.`;

export function weeklyPrompt({ name, checkIns, sessions, domains, protocol }) {
  return `You are AQLA Intelligence writing a WEEKLY email summary for ${name}.
${RULES}
Write warm, precise prose. Output simple HTML using only <p>, <strong>, <ul>, <li>.

Daily check-ins this week (1-10 scales): ${checkInLines(checkIns)}
Training sessions this week: ${JSON.stringify(sessions.map((s) => ({ game: s.game_id, score: s.score, date: s.completed_date })))}
Brain Map domains: ${JSON.stringify(domains.map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend })))}
Active protocol: ${JSON.stringify(protocol ? { name: protocol.name, family: protocol.family, objective: protocol.objective } : "none")}`;
}

export function endOfPlanPrompt({ name, checkIns, sessions, domains, protocol }) {
  return `You are AQLA Intelligence writing a DETAILED END-OF-PLAN (14-day cycle) email report for ${name}.
${RULES}
Cover: what changed across the full cycle, adherence, what likely worked, what did not, and a clear recommendation to continue or switch — flagged as a suggestion the user must confirm in the app.
Output simple HTML using only <p>, <strong>, <ul>, <li>. Be more thorough than a weekly recap.

All check-ins during the cycle (1-10 scales): ${checkInLines(checkIns)}
Training sessions during the cycle: ${JSON.stringify(sessions.map((s) => ({ game: s.game_id, score: s.score, date: s.completed_date })))}
Brain Map domains: ${JSON.stringify(domains.map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend })))}
Protocol just completed: ${JSON.stringify({ name: protocol.name, family: protocol.family, objective: protocol.objective, start_date: protocol.start_date, duration_days: protocol.duration_days })}`;
}

export const AQLA_LOGO_URL = "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/1349371e6_generated_image.png";

export function emailShell(title, bodyHtml) {
  return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;background:#0f0e0d;color:#efe9e0;padding:28px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px"><tr>
    <td style="padding-right:10px"><img src="${AQLA_LOGO_URL}" width="36" height="36" alt="AQLA" style="display:block;width:36px;height:36px;border:0;border-radius:8px" /></td>
    <td style="letter-spacing:.18em;font-size:13px;text-transform:uppercase;color:#efe9e0;font-family:Inter,Helvetica,Arial,sans-serif">AQLA</td>
  </tr></table>
  <h1 style="font-weight:300;font-size:24px;margin:8px 0 18px">${title}</h1>
  <div style="font-size:14px;line-height:1.7;color:#d6d0c6">${bodyHtml}</div>
  <p style="margin-top:24px;font-size:11px;color:#8a8578">AQLA is a neural wellness platform. It does not diagnose, treat, prevent or cure any condition.</p>
</div>`;
}