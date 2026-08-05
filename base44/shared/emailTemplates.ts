// Shared, on-brand HTML email templates for AQLA clinician-facing emails.
// Inline styles only — email clients strip <style> blocks and external CSS.

const C = {
  bg: "#0f0d0a",
  panel: "#17130f",
  panelAlt: "#120f0b",
  text: "#f5efe0",
  muted: "#a89c84",
  accent: "#C9F24E",
  accentInk: "#0f0d0a",
  border: "#2a241d",
  flag: "#E8A28F",
};

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(title: string, heroKicker: string, heroTitle: string, bodyHtml: string, footerNote: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.panel};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid ${C.border};">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.accent};font-weight:600;">${escapeHtml(heroKicker)}</p>
              <p style="margin:8px 0 0;font-size:19px;line-height:1.3;color:${C.text};font-weight:500;letter-spacing:-0.01em;">${escapeHtml(heroTitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${C.border};background:${C.panelAlt};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${C.muted};">${escapeHtml(footerNote)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:${C.muted};text-align:center;letter-spacing:0.5px;">AQLA · Your personal brain operating system</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function recommendationEmail({
  memberName,
  title,
  message,
  clinicianName,
}: {
  memberName: string;
  title: string;
  message: string;
  clinicianName: string;
}): string {
  const body = `
    <p style="margin:0;font-size:15px;line-height:1.7;color:${C.text};">Hi ${escapeHtml(memberName || "there")},</p>
    <p style="margin:16px 0;font-size:15px;line-height:1.7;color:${C.text};">
      Your clinician${clinicianName ? `, ${escapeHtml(clinicianName)}` : ""}, has a new recommendation for you.
    </p>
    <div style="background:${C.panelAlt};border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:12px;padding:20px 22px;margin:20px 0;">
      <p style="margin:0;font-size:13px;font-weight:600;color:${C.accent};letter-spacing:0.3px;">${escapeHtml(title)}</p>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${C.text};white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:${C.muted};">
      Log in to AQLA — this recommendation is waiting on your dashboard as a pop-up, where you can acknowledge or dismiss it.
    </p>
    <p style="margin:24px 0 0;display:inline-block;background:${C.accent};color:${C.accentInk};text-decoration:none;font-size:14px;font-weight:600;padding:12px 26px;border-radius:999px;letter-spacing:0.2px;">
      Open your dashboard
    </p>`;
  return shell(
    title || "A new recommendation from your AQLA clinician",
    "AQLA · Clinician recommendation",
    title || "A new recommendation from your clinician",
    body,
    "You received this because your AQLA clinician pushed a recommendation to your account. If this wasn't expected, you can dismiss it from your dashboard."
  );
}

export function clinicianAlertEmail({
  sender,
  category,
  subject,
  detail,
  submittedAt,
}: {
  sender: string;
  category: string;
  subject: string;
  detail: string;
  submittedAt: string;
}): string {
  const rows = [
    ["From", sender],
    ["Category", category],
    ["Subject", subject],
    ["Submitted", submittedAt],
  ]
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};vertical-align:top;width:120px;">${escapeHtml(k)}</td>
        <td style="padding:8px 0;font-size:14px;color:${C.text};font-weight:500;">${escapeHtml(v)}</td>
      </tr>`
    )
    .join("");
  const body = `
    <p style="margin:0;font-size:15px;line-height:1.7;color:${C.text};">A clinician has raised a note for the admin team.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0;border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};">
      ${rows}
    </table>
    <p style="margin:18px 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Detail</p>
    <div style="background:${C.panelAlt};border:1px solid ${C.border};border-left:3px solid ${C.flag};border-radius:12px;padding:18px 20px;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:${C.text};white-space:pre-wrap;">${escapeHtml(detail)}</p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:${C.muted};">
      Review this in the AQLA admin console → Clinician dashboard.
    </p>`;
  return shell(
    `[Clinician alert · ${category}] ${subject}`,
    "AQLA · Clinician alert",
    `${category} — ${subject}`,
    body,
    "This alert was raised from the AQLA clinician dashboard and sent to every admin."
  );
}

export function planChangeEmail({
  memberName,
  family,
  reason,
  clinicianName,
}: {
  memberName: string;
  family: string;
  reason: string;
  clinicianName: string;
}): string {
  const body = `
    <p style="margin:0;font-size:15px;line-height:1.7;color:${C.text};">Hi ${escapeHtml(memberName)},</p>
    <p style="margin:16px 0;font-size:15px;line-height:1.7;color:${C.text};">
      Your clinician${clinicianName ? `, ${escapeHtml(clinicianName)}` : ""}, has updated your active AQLA protocol.
    </p>
    <div style="background:${C.panelAlt};border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:12px;padding:20px 22px;margin:20px 0;">
      <p style="margin:0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Your new plan</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:600;color:${C.accent};letter-spacing:0.3px;">${escapeHtml(family)}</p>
      ${reason ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:${C.text};white-space:pre-wrap;">${escapeHtml(reason)}</p>` : ""}
    </div>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:${C.muted};">
      Log in to AQLA to see your updated daily actions — this change is already live on your dashboard.
    </p>`;
  return shell(
    `Your AQLA plan is now ${family}`,
    "AQLA · Plan update",
    `Your plan is now ${family}`,
    body,
    "Your clinician updated your active protocol from the AQLA clinician dashboard. If this wasn't expected, reach out to your clinician."
  );
}