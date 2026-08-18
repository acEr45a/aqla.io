// @ts-nocheck
// supabase/functions/verifyAdminAccess/index.ts
// Edge Function: Verify Admin OTP and trust device

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

    const { device_id, otp, trust_device } = await req.json();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const trustedDevices = Array.isArray(profile?.admin_trusted_devices) ? profile.admin_trusted_devices : [];

    // Auto-verify check for existing trusted device
    if (!otp && device_id) {
      const isTrusted = trustedDevices.includes(device_id);
      return new Response(JSON.stringify({ verified: isTrusted, error: isTrusted ? undefined : "Device not trusted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify OTP code
    if (otp) {
      const { data: validOtps } = await adminClient
        .from("admin_otps")
        .select("*")
        .eq("user_id", user.id)
        .eq("code", String(otp).trim())
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!validOtps || validOtps.length === 0) {
        return new Response(JSON.stringify({ verified: false, error: "Invalid or expired verification code." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark OTP as used
      await adminClient.from("admin_otps").update({ used: true }).eq("id", validOtps[0].id);

      // Trust device if requested
      if (device_id && trust_device && !trustedDevices.includes(device_id)) {
        const updated = [...trustedDevices, device_id];
        await adminClient.from("profiles").update({ admin_trusted_devices: updated }).eq("id", user.id);
      }

      return new Response(JSON.stringify({ verified: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ verified: false, error: "Verification code required." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[verifyAdminAccess] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Verification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
