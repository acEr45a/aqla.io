// @ts-nocheck
// supabase/functions/sendAdminOtp/index.ts
// Edge Function: Generate and send Admin OTP via Resend (noreply@aqla.io)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const OTP_COOLDOWN_SECONDS = 60;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const authHeader = req.headers.get("Authorization");
    let userId = null;
    let userEmail = null;

    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email;
      }
    }

    if (!userId && body.user_id) {
      userId = body.user_id;
    }

    if (!userId && !userEmail && !body.email) {
      return new Response(JSON.stringify({ error: "Missing authentication or recipient email" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: at most one OTP per OTP_COOLDOWN_SECONDS per user, to prevent
    // request-spamming / email-bombing a target's inbox.
    if (userId) {
      const { data: recentOtps } = await adminClient
        .from("admin_otps")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastCreatedAt = recentOtps?.[0]?.created_at;
      if (lastCreatedAt) {
        const secondsSinceLast = (Date.now() - new Date(lastCreatedAt).getTime()) / 1000;
        if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
          return new Response(
            JSON.stringify({
              sent: false,
              error: `Please wait ${Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.`,
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    let profile = null;
    if (userId) {
      const { data: p } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      profile = p;
    }

    const recipientEmail = body.email || userEmail || profile?.email;
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No email address found for user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (userId) {
      await adminClient.from("admin_otps").insert([{
        code,
        user_id: userId,
        created_by_id: userId,
        expires_at: expiresAt,
        used: false,
      }]);
    }

    const emailHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AQLA Admin Verification Code</title>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #0c0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" bgcolor="#0c0d0e" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: 100% !important;">
    <tr><td align="center" style="padding: 48px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #131518; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <tr><td height="3" style="background: linear-gradient(90deg, #c9f24e 0%, #10b981 100%); line-height: 3px; font-size: 3px;">&nbsp;</td></tr>
        <tr><td style="padding: 40px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 24px;">
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
          <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 500; color: #ffffff; letter-spacing: -0.01em; line-height: 1.3;">Admin Verification Code</h1>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">Use the one-time passcode below to verify your administrator session on the AQLA Console:</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr><td align="center" style="background: #1a1c21; border: 1px solid rgba(201,242,78,0.25); border-radius: 14px; padding: 22px 16px; box-shadow: inset 0 0 20px rgba(201,242,78,0.05);">
              <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 700; letter-spacing: 0.35em; color: #c9f24e; display: block; padding-left: 0.35em;">${code}</span>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1c21; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 20px;">
            <tr><td style="padding: 14px 18px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">This code expires in <strong style="color: #c9f24e;">10 minutes</strong> and can only be used once. If you did not initiate this request, contact your security team immediately.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color: #0e1012; border-top: 1px solid rgba(255,255,255,0.05); padding: 20px 36px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #4b5563;">&copy; ${new Date().getFullYear()} AQLA.io &middot; Advanced Cognitive Operating System</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">Sent securely from <span style="color: #6b7280;">noreply@aqla.io</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let emailSent = false;
    let resendError = null;

    try {
      const resendRes = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AQLA Security <noreply@aqla.io>",
          to: [recipientEmail],
          subject: "AQLA Admin Console Verification Code",
          html: emailHtml,
          text: `Your AQLA Admin verification code is: ${code} (expires in 10 minutes).`,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
      } else {
        const errJson = await resendRes.json().catch(() => ({}));
        resendError = errJson.message || resendRes.statusText;
      }
    } catch (err: any) {
      resendError = err.message;
    }

    return new Response(
      JSON.stringify({ sent: emailSent, email_dispatched: emailSent, recipient: recipientEmail, warning: resendError ? `Email dispatch notice: ${resendError}` : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[sendAdminOtp] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to process OTP request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
