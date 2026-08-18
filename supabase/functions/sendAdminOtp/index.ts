// @ts-nocheck
// supabase/functions/sendAdminOtp/index.ts
// Edge Function: Generate and send Admin OTP via Resend

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify role is admin or clinician
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "clinician") {
      return new Response(JSON.stringify({ error: "Admin or Clinician role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Insert into admin_otps
    await adminClient.from("admin_otps").insert([{
      code,
      user_id: user.id,
      created_by_id: user.id,
      expires_at: expiresAt,
      used: false,
    }]);

    // Send email via Resend
    if (user.email) {
      await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AQLA Security <noreply@aqla.io>",
          to: [user.email],
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
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[sendAdminOtp] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to send code" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
