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
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "re_DLtwmBvZ_Ei6N6fwtcrzC3QYweYUtv4jC";

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

    // Fallback to body user_id or email if auth header is tokenless
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
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#0c0d0e; color:#f0f2f5; padding:40px 20px;">
              <div style="max-width:540px; margin:0 auto; background-color:#16181a; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:32px;">
                <div style="font-size:18px; font-weight:700; letter-spacing:0.1em; color:#ffffff; margin-bottom:20px; text-transform:uppercase;">AQLA</div>
                <h1 style="font-size:20px; font-weight:500; color:#ffffff; margin:0 0 16px;">Admin Verification Code</h1>
                <p style="font-size:14px; color:#a1a7b0; line-height:1.6;">Use the verification code below to access the AQLA Admin Console on your device:</p>
                <div style="font-size:32px; font-weight:700; letter-spacing:0.3em; color:#ffffff; background:#222529; padding:16px 24px; border-radius:12px; text-align:center; margin:24px 0;">
                  ${code}
                </div>
                <p style="font-size:12px; color:#6b7280;">This code will expire in 10 minutes.</p>
                <div style="margin-top:28px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08); font-size:11px; color:#5a6069; text-align:center;">
                  &copy; ${new Date().getFullYear()} AQLA.io &middot; Sent from noreply@aqla.io
                </div>
              </div>
            </div>
          `,
          text: `Your AQLA Admin verification code is: ${code} (expires in 10 minutes).`,
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
