// src/lib/resend.js
// AQLA Transactional Email Client powered by Resend (noreply@aqla.io)

const RESEND_API_URL = 'https://api.resend.com/emails';

export const DEFAULT_FROM = 'AQLA <noreply@aqla.io>';

/**
 * Builds HTML email template matching AQLA dark/clean aesthetic.
 */
export function buildAqlaEmailHtml({ title, contentHtml, actionButton }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'AQLA'}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0c0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0f2f5; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 24px; }
    .card { background-color: #16181a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .logo { font-size: 20px; font-weight: 600; letter-spacing: 0.1em; color: #f0f2f5; margin-bottom: 24px; text-transform: uppercase; }
    .title { font-size: 22px; font-weight: 400; color: #ffffff; margin: 0 0 16px; line-height: 1.3; }
    .content { font-size: 14px; line-height: 1.65; color: #a1a7b0; margin-bottom: 28px; }
    .content p { margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #ffffff; color: #0c0d0e; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 13px; font-weight: 500; text-align: center; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #5a6069; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">AQLA</div>
      <h1 class="title">${title}</h1>
      <div class="content">
        ${contentHtml}
      </div>
      ${actionButton ? `<a href="${actionButton.url}" class="btn">${actionButton.label}</a>` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AQLA.io &middot; Personal Brain Operating System &middot; Sent from noreply@aqla.io
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends an email using the Resend API.
 * @param {Object} params
 * @param {string|string[]} params.to - Recipient email(s)
 * @param {string} params.subject - Email subject line
 * @param {string} [params.html] - HTML body
 * @param {string} [params.text] - Plain text body
 * @param {string} [params.from] - Sender address (defaults to noreply@aqla.io)
 * @param {string} [params.replyTo] - Optional Reply-To address
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function sendEmail({ to, subject, html, text, from = DEFAULT_FROM, replyTo }) {
  const apiKey =
    import.meta.env?.VITE_RESEND_API_KEY ||
    import.meta.env?.RESEND_API_KEY ||
    're_DLtwmBvZ_Ei6N6fwtcrzC3QYweYUtv4jC';

  if (!apiKey) {
    throw new Error('Resend API key is missing.');
  }

  const recipients = Array.isArray(to) ? to : [to];

  const body = {
    from,
    to: recipients,
    subject,
    ...(html ? { html } : {}),
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
