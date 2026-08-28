// @ts-nocheck
// supabase/functions/send-email/index.ts
// AQLA Transactional Email Edge Function powered by Resend (noreply@aqla.io)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "AQLA Clinician <clinician@aqla.io>";


function buildProfessionalEmail({ subject, contentHtml, paragraphs, actionButton }) {
  const bodyContent = contentHtml || (paragraphs || []).map((p) => `<p style="margin: 0 0 16px 0; font-size: 14px; color: #a1a7b0; line-height: 1.65;">${p}</p>`).join("");
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
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject || "AQLA"}</title>
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
                ${subject}
              </h1>

              <div style="font-size: 14px; line-height: 1.65; color: #a1a7b0;">
                ${bodyContent}
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
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { to, subject, html, text, from = DEFAULT_FROM, actionButton, recipientIds, sendToAll, message } = await req.json();

    const recipients: string[] = [];

    if (sendToAll) {
      const { data: allUsers } = await adminClient.from("profiles").select("email");
      (allUsers || []).forEach((u) => {
        if (u.email && !recipients.includes(u.email)) recipients.push(u.email);
      });
    } else if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
      const { data: users } = await adminClient.from("profiles").select("email").in("id", recipientIds);
      (users || []).forEach((u) => {
        if (u.email && !recipients.includes(u.email)) recipients.push(u.email);
      });
    } else if (to) {
      if (Array.isArray(to)) recipients.push(...to);
      else recipients.push(to);
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No valid recipient email addresses found." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailSubject = subject || "AQLA Update";
    const emailText = text || message || "";
    const paragraphs = emailText ? emailText.split(/\n\n+/).map((p: string) => p.replace(/\n/g, "<br/>")) : [];

    const finalHtml = html && html.includes("<!DOCTYPE")
      ? html
      : buildProfessionalEmail({ subject: emailSubject, contentHtml: html, paragraphs, actionButton });

    let sentCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const res = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [recipient],
            subject: emailSubject,
            html: finalHtml,
            text: emailText || "AQLA Update",
          }),
        });

        if (res.ok) {
          sentCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          errors.push(`${recipient}: ${errData.message || res.statusText}`);
        }
      } catch (err: any) {
        errors.push(`${recipient}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: sentCount > 0,
        sent_count: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[send-email] Exception:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to dispatch email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
