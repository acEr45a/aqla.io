// src/lib/resend.js
// AQLA Transactional Email Client powered by Resend (noreply@aqla.io)

const RESEND_API_URL = 'https://api.resend.com/emails';

export const DEFAULT_FROM = 'AQLA <noreply@aqla.io>';

/**
 * Builds HTML email template matching AQLA dark/clean aesthetic.
 */
export function buildAqlaEmailHtml({ title, contentHtml, actionButton }) {
  const buttonHtml = actionButton
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 12px 0;">
        <tr>
          <td align="center" style="background-color: #ffffff; border-radius: 9999px;">
            <a href="${actionButton.url}" target="_blank" style="display: inline-block; padding: 12px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: #0c0d0e; text-decoration: none; border-radius: 9999px; letter-spacing: 0.02em;">
              ${actionButton.label}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || 'AQLA'}</title>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #0c0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" bgcolor="#0c0d0e" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: 100% !important; background-color: #0c0d0e;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #141619; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);">
          <tr>
            <td height="3" style="background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc); line-height: 3px; font-size: 3px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size: 15px; font-weight: 700; letter-spacing: 0.22em; color: #ffffff; text-transform: uppercase; padding-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.07);">
                    AQLA
                  </td>
                </tr>
              </table>

              <h1 style="margin: 28px 0 16px 0; font-size: 21px; font-weight: 500; color: #ffffff; letter-spacing: -0.01em; line-height: 1.3;">
                ${title}
              </h1>

              <div style="font-size: 14px; line-height: 1.65; color: #a1a7b0;">
                ${contentHtml}
              </div>

              ${buttonHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f1113; border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} AQLA.io &middot; Advanced Cognitive Operating System
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">
                Sent securely from <span style="color: #6b7280;">noreply@aqla.io</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Sends an email using the Resend API or Supabase send-email Edge Function.
 */
export async function sendEmail({ to, subject, html, text, from = DEFAULT_FROM, replyTo, actionButton }) {
  const apiKey =
    import.meta.env?.VITE_RESEND_API_KEY ||
    import.meta.env?.RESEND_API_KEY ||
    '';

  const recipients = Array.isArray(to) ? to : [to];
  const finalHtml = html && html.includes('<!DOCTYPE')
    ? html
    : buildAqlaEmailHtml({ title: subject, contentHtml: html || `<p>${text || ''}</p>`, actionButton });

  const body = {
    from,
    to: recipients,
    subject,
    html: finalHtml,
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Resend error (${response.status})`;
    console.error('[Resend] Email dispatch failed:', errorMsg);
    return { success: false, error: errorMsg };
  }

  return { success: true, id: data.id };
}

export default sendEmail;
