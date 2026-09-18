// src/lib/resend.js
// AQLA Transactional Email Client powered by Supabase send-email Edge Function

import { supabase } from './supabase';

export const DEFAULT_FROM = 'AQLA <noreply@aqla.io>';

/**
 * Builds HTML email template matching AQLA dark/clean aesthetic.
 */
export function buildAqlaEmailHtml({ title, contentHtml, actionButton }) {
  const buttonHtml = actionButton
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 12px 0;">
        <tr>
          <td align="center">
            <a href="${actionButton.url}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: #0c0d0e; background-color: #c9f24e; text-decoration: none; border-radius: 12px; letter-spacing: 0.02em; box-shadow: 0 4px 20px rgba(201, 242, 78, 0.25);">
              ${actionButton.label} &rarr;
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
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #131518; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);">
          <tr>
            <td height="3" style="background: linear-gradient(90deg, #c9f24e 0%, #10b981 100%); line-height: 3px; font-size: 3px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 40px 36px 32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 24px;">
                <tr>
                  <td align="left">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="34" height="34" style="display: block;">
                            <path d="M8.5 32.5 18.5 11.5 28.5 32.5" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="m28.5 32.5 7.5 -8.5" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
                            <path d="m12.8 23.5 7.8 0" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
                            <circle cx="22.5" cy="23.5" r="7.5" fill="#C9F24E" opacity="0.22"/>
                            <circle cx="22.5" cy="23.5" r="3.6" fill="#C9F24E"/>
                          </svg>
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 16px; font-weight: 600; letter-spacing: 0.22em; color: #ffffff; text-transform: uppercase; display: block; line-height: 1;">AQLA</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 500; color: #ffffff; letter-spacing: -0.01em; line-height: 1.3;">
                ${title}
              </h1>

              <div style="font-size: 14px; line-height: 1.65; color: #9ca3af;">
                ${contentHtml}
              </div>

              ${buttonHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #0e1012; border-top: 1px solid rgba(255, 255, 255, 0.05); padding: 20px 36px; text-align: center;">
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
 * Sends an email securely via the Supabase send-email Edge Function.
 * The Resend API key is never exposed to client-side code.
 */
export async function sendEmail({ to, subject, html, text, from = DEFAULT_FROM, replyTo, actionButton }) {
  const recipients = Array.isArray(to) ? to : [to];
  const finalHtml = html && html.includes('<!DOCTYPE')
    ? html
    : buildAqlaEmailHtml({ title: subject, contentHtml: html || `<p>${text || ''}</p>`, actionButton });

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipients,
        from,
        subject,
        html: finalHtml,
        ...(text ? { text } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
        actionButton,
      },
    });

    if (error) {
      console.error('[sendEmail] Edge function dispatch failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[sendEmail] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

export default sendEmail;
