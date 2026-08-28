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

    // Fallback to body user_id or email
    if (!userId && body.user_id) {
      userId = body.user_id;
    }

    if (!userId && !userEmail && !body.email) {
      return new Response(JSON.stringify({ error: "Missing authentication or recipient email" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
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

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Insert into admin_otps table
    if (userId) {
      await adminClient.from("admin_otps").insert([{
        code,
        user_id: userId,
        created_by_id: userId,
        expires_at: expiresAt,
        used: false,
      }]);
    }

    // Premium Email HTML Template
    const emailHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AQLA Admin Verification Code</title>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #0c0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" bgcolor="#0c0d0e" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: 100% !important; background-color: #0c0d0e;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #141619; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);">
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

              <h1 style="margin: 28px 0 12px 0; font-size: 21px; font-weight: 500; color: #ffffff; letter-spacing: -0.01em; line-height: 1.3;">
                Admin Verification Code
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                Use the one-time passcode below to verify your administrator session on the AQLA Console:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 24px 0;">
                <tr>
                  <td align="center" style="background: #1c1f24; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 22px 16px;">
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.35em; color: #ffffff; display: block; padding-left: 0.35em;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                This code expires in <strong style="color: #9ca3af;">10 minutes</strong> and can only be used once.
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                If you did not initiate this request, please contact your security team immediately.
              </p>
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

    // Send email via Resend
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
          text: `Your AQLA Admin verification code is: ${code} (expires in 10 minutes). Sent from noreply@aqla.io`,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
      } else {
        const errJson = await resendRes.json().catch(() => ({}));
        resendError = errJson.message || resendRes.statusText;
        console.warn("[sendAdminOtp] Resend API error:", resendError);
      }
    } catch (err: any) {
      resendError = err.message;
      console.warn("[sendAdminOtp] Resend fetch exception:", err);
    }

    return new Response(
      JSON.stringify({
        sent: true,
        email_dispatched: emailSent,
        recipient: recipientEmail,
        warning: resendError ? `Email dispatch notice: ${resendError}` : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[sendAdminOtp] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to process OTP request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
