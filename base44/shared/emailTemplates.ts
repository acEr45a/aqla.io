// Shared, on-brand HTML email templates for AQLA. Premium, clinical, dark theme.
// Inline styles only — email clients strip <style> blocks and external CSS.

const C = {
  bg: "#0c0a07",
  panel: "#15120e",
  panelAlt: "#1c1813",
  panelSoft: "#191510",
  text: "#f6f0e0",
  muted: "#a89c84",
  faint: "#6f6755",
  accent: "#C9F24E",
  accentInk: "#0c0a07",
  accentDim: "#9fb83a",
  border: "#2c251d",
  borderSoft: "#221d17",
  flag: "#E8A28F",
  flagDim: "#3a241e",
  positive: "#7BC950",
};

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(
  title: string,
  heroKicker: string,
  heroTitle: string,
  bodyHtml: string,
  footerNote: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.panel};border:1px solid ${C.border};border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:40px 48px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;">
                    <div style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,${C.accent},${C.accentDim});display:inline-block;"></div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0;font-size:11px;letter-spacing:3.5px;text-transform:uppercase;color:${C.accent};font-weight:600;">${escapeHtml(heroKicker)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:23px;line-height:1.25;color:${C.text};font-weight:600;letter-spacing:-0.02em;">${escapeHtml(heroTitle)}</p>
              <div style="margin-top:22px;height:1px;background:linear-gradient(90deg,${C.accent},transparent);opacity:0.55;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 48px 36px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:26px 48px 34px;border-top:1px solid ${C.borderSoft};background:${C.panelAlt};">
              <p style="margin:0;font-size:12px;line-height:1.7;color:${C.muted};">${escapeHtml(footerNote)}</p>
              <p style="margin:14px 0 0;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${C.faint};">AQLA · Your personal brain operating system</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:${C.faint};text-align:center;letter-spacing:0.5px;">© AQLA</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function label(text: string): string {
  return `<span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.faint};font-weight:600;">${escapeHtml(text)}</span>`;
}

function metaRow(k: string, v: string): string {
  return `
  <tr>
    <td style="padding:11px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.faint};vertical-align:top;width:130px;font-weight:600;">${escapeHtml(k)}</td>
    <td style="padding:11px 0;font-size:15px;color:${C.text};font-weight:500;letter-spacing:-0.01em;">${escapeHtml(v)}</td>
  </tr>`;
}

function button(label: string): string {
  return `<a style="display:inline-block;background:linear-gradient(135deg,${C.accent},${C.accentDim});color:${C.accentInk};text-decoration:none;font-size:14px;font-weight:600;padding:14px 30px;border-radius:999px;letter-spacing:0.3px;">${escapeHtml(label)}</a>`;
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
    <p style="margin:0;font-size:16px;line-height:1.75;color:${C.text};">Hi ${escapeHtml(memberName || "there")},</p>
    <p style="margin:16px 0;font-size:16px;line-height:1.75;color:${C.muted};">
      Your clinician${clinicianName ? `, <span style="color:${C.text};font-weight:500;">${escapeHtml(clinicianName)}</span>` : ""}, has a new recommendation for you.
    </p>
    <div style="background:linear-gradient(160deg,${C.panelSoft},${C.panelAlt});border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:16px;padding:24px 26px;margin:24px 0;">
      ${label("Recommendation")}
      <p style="margin:12px 0 0;font-size:18px;line-height:1.4;color:${C.text};font-weight:600;letter-spacing:-0.01em;">${escapeHtml(title)}</p>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${C.borderSoft};">
        <p style="margin:0;font-size:15px;line-height:1.75;color:${C.text};white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    </div>
    <p style="margin:22px 0 0;font-size:14px;line-height:1.75;color:${C.muted};">
      This is waiting on your dashboard as a pop-up — open it to acknowledge or dismiss.
    </p>
    <p style="margin:26px 0 0;">${button("Open your dashboard")}</p>`;
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
  const body = `
    <p style="margin:0;font-size:16px;line-height:1.75;color:${C.text};">A clinician has raised a note for the admin team.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:22px 0;border-top:1px solid ${C.borderSoft};border-bottom:1px solid ${C.borderSoft};">
      ${metaRow("From", sender)}
      ${metaRow("Category", category)}
      ${metaRow("Subject", subject)}
      ${metaRow("Submitted", submittedAt)}
    </table>
    ${label("Detail")}
    <div style="background:linear-gradient(160deg,${C.panelSoft},${C.panelAlt});border:1px solid ${C.border};border-left:3px solid ${C.flag};border-radius:16px;padding:22px 24px;margin-top:14px;">
      <p style="margin:0;font-size:15px;line-height:1.75;color:${C.text};white-space:pre-wrap;">${escapeHtml(detail)}</p>
    </div>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.75;color:${C.muted};">
      Review this in the AQLA admin console → Clinician dashboard.
    </p>
    <p style="margin:26px 0 0;">${button("Open admin console")}</p>`;
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
    <p style="margin:0;font-size:16px;line-height:1.75;color:${C.text};">Hi ${escapeHtml(memberName)},</p>
    <p style="margin:16px 0;font-size:16px;line-height:1.75;color:${C.muted};">
      Your clinician${clinicianName ? `, <span style="color:${C.text};font-weight:500;">${escapeHtml(clinicianName)}</span>` : ""}, has updated your active AQLA protocol.
    </p>
    <div style="background:linear-gradient(160deg,${C.panelSoft},${C.panelAlt});border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:16px;padding:24px 26px;margin:24px 0;">
      ${label("Your new plan")}
      <p style="margin:14px 0 0;font-size:26px;font-weight:600;color:${C.accent};letter-spacing:0.4px;">${escapeHtml(family)}</p>
      ${reason ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid ${C.borderSoft};"><p style="margin:0;font-size:15px;line-height:1.75;color:${C.text};white-space:pre-wrap;">${escapeHtml(reason)}</p></div>` : ""}
    </div>
    <p style="margin:22px 0 0;font-size:14px;line-height:1.75;color:${C.muted};">
      Log in to AQLA to see your updated daily actions — this change is already live on your dashboard.
    </p>
    <p style="margin:26px 0 0;">${button("View my plan")}</p>`;
  return shell(
    `Your AQLA plan is now ${family}`,
    "AQLA · Plan update",
    `Your plan is now ${family}`,
    body,
    "Your clinician updated your active protocol from the AQLA clinician dashboard. If this wasn't expected, reach out to your clinician."
  );
}

export function userIssueEmail({
  userName,
  userEmail,
  category,
  subject,
  detail,
  submittedAt,
}: {
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  detail: string;
  submittedAt: string;
}): string {
  const body = `
    <p style="margin:0;font-size:16px;line-height:1.75;color:${C.text};">A user has reported an issue from the AQLA Help Center.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:22px 0;border-top:1px solid ${C.borderSoft};border-bottom:1px solid ${C.borderSoft};">
      ${metaRow("From", `${userName}${userEmail ? ` (${userEmail})` : ""}`)}
      ${metaRow("Category", category)}
      ${metaRow("Subject", subject)}
      ${metaRow("Submitted", submittedAt)}
    </table>
    ${label("Detail")}
    <div style="background:linear-gradient(160deg,${C.panelSoft},${C.panelAlt});border:1px solid ${C.border};border-left:3px solid ${C.flag};border-radius:16px;padding:22px 24px;margin-top:14px;">
      <p style="margin:0;font-size:15px;line-height:1.75;color:${C.text};white-space:pre-wrap;">${escapeHtml(detail)}</p>
    </div>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.75;color:${C.muted};">Review and follow up from the AQLA admin console.</p>
    <p style="margin:26px 0 0;">${button("Open admin console")}</p>`;
  return shell(
    `[User issue · ${category}] ${subject}`,
    "AQLA · User issue",
    `${category} — ${subject}`,
    body,
    "This issue was submitted from the AQLA Help Center and saved to the admin complaints panel."
  );
}

export function adminNotifyClinicianEmail({
  clinicianName,
  subject,
  message,
  adminName,
  submittedAt,
}: {
  clinicianName: string;
  subject: string;
  message: string;
  adminName: string;
  submittedAt: string;
}): string {
  const body = `
    <p style="margin:0;font-size:16px;line-height:1.75;color:${C.text};">Hi ${escapeHtml(clinicianName)},</p>
    <p style="margin:16px 0;font-size:16px;line-height:1.75;color:${C.muted};">The AQLA admin team has sent you a note.</p>
    <div style="background:linear-gradient(160deg,${C.panelSoft},${C.panelAlt});border:1px solid ${C.border};border-left:3px solid ${C.accent};border-radius:16px;padding:24px 26px;margin:24px 0;">
      ${label("Subject")}
      <p style="margin:12px 0 0;font-size:18px;font-weight:600;color:${C.text};letter-spacing:-0.01em;">${escapeHtml(subject)}</p>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid ${C.borderSoft};">
        <p style="margin:0;font-size:15px;line-height:1.75;color:${C.text};white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    </div>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.75;color:${C.muted};">From ${escapeHtml(adminName)} · ${escapeHtml(submittedAt)}</p>`;
  return shell(
    subject,
    "AQLA · Admin note",
    subject,
    body,
    "You received this note from the AQLA admin team."
  );
}

export function clinicalFlagEmail({
  sourceAgent,
  messageSnippet,
  userName,
  flaggedAt,
}: {
  sourceAgent: string;
  messageSnippet: string;
  userName: string;
  flaggedAt: string;
}): string {
  const body = `
    <p style="margin:0;font-size:16px;line-height:1.75;color:${C.text};">An AQLA assistant produced a response that was automatically flagged for clinical review.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:22px 0;border-top:1px solid ${C.borderSoft};border-bottom:1px solid ${C.borderSoft};">
      ${metaRow("Member", userName)}
      ${metaRow("Source", sourceAgent)}
      ${metaRow("Flagged", flaggedAt)}
    </table>
    ${label("Flagged message")}
    <div style="background:linear-gradient(160deg,${C.panelSoft},${C.panelAlt});border:1px solid ${C.border};border-left:3px solid ${C.flag};border-radius:16px;padding:22px 24px;margin-top:14px;">
      <p style="margin:0;font-size:15px;line-height:1.75;color:${C.text};white-space:pre-wrap;">${escapeHtml(messageSnippet)}</p>
    </div>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.75;color:${C.muted};">
      Open the Clinician dashboard &rarr; Clinical Flags &rarr; User Flags to review and follow up with the member.
    </p>
    <p style="margin:26px 0 0;">${button("Open clinician dashboard")}</p>`;
  return shell(
    `[Clinical flag · ${sourceAgent}] Flagged response needs review`,
    "AQLA · Clinical flag",
    "A response was flagged for clinical review",
    body,
    "You received this because you are an AQLA clinician or admin. Auto-flagging is a safety net — please review the flagged content before it influences the member."
  );
}