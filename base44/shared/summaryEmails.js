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

export const AQLA_LOGO_URL = "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/9aa251b4b_generated_image.png";

// Escape untrusted strings before interpolating into HTML — prevents content injection.
export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// Rich, fully-branded welcome email with a call-to-action button.
export function registrationEmailHtml(name, appUrl) {
  const link = appUrl || "https://aqla.base44.app";
  const safeName = escapeHtml(name);
  const step = (n, title, text) => `
    <tr>
      <td width="34" valign="top" style="padding:0 0 16px">
        <div style="width:26px;height:26px;border-radius:13px;background:#C9F24E;color:#14150f;font:600 13px Inter,Helvetica,Arial,sans-serif;text-align:center;line-height:26px">${n}</div>
      </td>
      <td valign="top" style="padding:0 0 16px;font-family:Inter,Helvetica,Arial,sans-serif">
        <div style="font-size:15px;color:#efe9e0;font-weight:600">${title}</div>
        <div style="font-size:13px;line-height:1.6;color:#b8b2a7;margin-top:3px">${text}</div>
      </td>
    </tr>`;

  return `<div style="margin:0;padding:24px 12px;background:#0b0a09;font-family:Inter,Helvetica,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#131210;border:1px solid #262320;border-radius:20px;overflow:hidden">
    <tr>
      <td style="background:linear-gradient(135deg,#1b2a12 0%,#141a2e 100%);padding:32px 28px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:10px"><img src="${AQLA_LOGO_URL}" width="40" height="40" alt="AQLA" style="display:block;border:0;border-radius:10px" /></td>
          <td style="letter-spacing:.2em;font-size:13px;text-transform:uppercase;color:#C9F24E">AQLA</td>
        </tr></table>
        <h1 style="margin:20px 0 8px;font-weight:300;font-size:28px;color:#ffffff">Welcome to AQLA${safeName ? `, ${safeName}` : ""}</h1>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#cfd6c2">Your personal brain operating system is ready.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px">
        <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#d6d0c6">
          Your account is verified. From here, AQLA measures how your attention, memory, energy and recovery actually behave —
          then builds a 14-day protocol around your own patterns rather than generic advice. The more you check in, the sharper it gets.
        </p>

        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a8578;margin:0 0 14px">Your first steps</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${step(1, "Complete your assessment", "About 8 minutes. This builds your first Brain Map across every cognitive domain.")}
          ${step(2, "Run the safety screening", "A short, deterministic check that keeps every recommendation appropriate for you.")}
          ${step(3, "Start your first protocol", "Specific daily actions, chosen for your weakest link and reviewed after 14 days.")}
          ${step(4, "Check in daily", "Under 60 seconds. This is what keeps your map, insights and protocol accurate.")}
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0"><tr>
          <td style="background:#C9F24E;border-radius:999px">
            <a href="${link}/dashboard" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#14150f;text-decoration:none">Open your dashboard →</a>
          </td>
        </tr></table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#1a1815;border-radius:14px">
          <tr><td style="padding:18px">
            <div style="font-size:14px;font-weight:600;color:#efe9e0;margin-bottom:6px">Meet AQLA Intelligence</div>
            <div style="font-size:13px;line-height:1.65;color:#b8b2a7">
              Your built-in brain analyst. Ask why your focus dropped, what to adjust first, or what the evidence says —
              it answers from your own data, and tells you when the data is too thin to be sure.
            </div>
          </td></tr>
        </table>

        <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#b8b2a7">
          Need a hand? The <a href="${link}/help-center" style="color:#C9F24E;text-decoration:none">Help Center</a> covers everything,
          and the <a href="${link}/evidence-library" style="color:#C9F24E;text-decoration:none">Evidence Library</a> shows the research behind every protocol.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#0f0e0d;padding:20px 28px;border-top:1px solid #262320">
        <p style="margin:0;font-size:11px;line-height:1.7;color:#7d786d">
          AQLA is a neural wellness platform. It does not diagnose, treat, prevent or cure any condition, and it is not a substitute for medical care.<br />
          <a href="${link}/privacy" style="color:#8a8578;text-decoration:none">Privacy</a> ·
          <a href="${link}/terms" style="color:#8a8578;text-decoration:none">Terms</a> ·
          <a href="${link}/settings" style="color:#8a8578;text-decoration:none">Email settings</a>
        </p>
      </td>
    </tr>
  </table>
</div>`;
}

// CTA appended to weekly/end-of-plan emails linking to the detailed PDF report.
export function reportCtaHtml(link = "https://aqla.base44.app") {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px"><tr>
    <td style="background:#C9F24E;border-radius:999px">
      <a href="${link}/history" style="display:inline-block;padding:12px 26px;font-size:13px;font-weight:600;color:#14150f;text-decoration:none">Download your detailed PDF report →</a>
    </td></tr></table>
  <p style="margin:8px 0 0;font-size:12px;line-height:1.65;color:#8a8578">Your full branded report — every check-in, trend, training session and cognitive test from this period — is ready as a PDF in your History page, alongside all your previous plans and reports.</p>`;
}

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