// @ts-nocheck
// supabase/functions/aqla-ops/index.ts
// AQLA Backend Operations & Clinician Support Edge Function
// Consolidates admin, clinician, diagnostic, and communication procedures.
// Also provides Test Account CRUD for the Admin Testing Suite.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAiGateway } from "../_shared/gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePasscode(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

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
    let callerUser: any = null;
    let callerRole = "user";

    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        callerUser = user;
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        callerRole = profile?.role || "user";
      }
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      // =====================================================================
      // 1. App Settings
      // =====================================================================
      case "getAppSettings": {
        const { data } = await adminClient.from("app_settings").select("*").limit(1).single();
        return new Response(JSON.stringify(data || { test_mode: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateAppSettings": {
        if (callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await adminClient.from("app_settings").upsert([payload]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 2. Member data aggregation for Clinicians
      // =====================================================================
      case "getMemberData": {
        const targetUserId = payload.user_id || callerUser?.id;
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Authorization: caller must be requesting their own data, or be a clinician/admin.
        const isSelf = callerUser?.id === targetUserId;
        if (!isSelf && callerRole !== "clinician" && callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Unauthorized: you can only access your own data" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const [profile, domains, checkIns, protocols, reviews, tests] = await Promise.all([
          adminClient.from("profiles").select("*").eq("id", targetUserId).single(),
          adminClient.from("brain_domains").select("*").eq("created_by_id", targetUserId),
          adminClient.from("daily_check_ins").select("*").eq("created_by_id", targetUserId).order("date", { ascending: false }).limit(30),
          adminClient.from("protocols").select("*").eq("created_by_id", targetUserId),
          adminClient.from("clinician_reviews").select("*").eq("created_by_id", targetUserId),
          adminClient.from("cognitive_tests").select("*").eq("created_by_id", targetUserId).order("completed_date", { ascending: false }).limit(20),
        ]);

        return new Response(JSON.stringify({
          profile: profile.data,
          domains: domains.data || [],
          checkIns: checkIns.data || [],
          protocols: protocols.data || [],
          reviews: reviews.data || [],
          cognitive_tests: tests.data || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 3. Clinician AI Message Drafting (via Vercel AI Gateway)
      // =====================================================================
      case "draftClinicianMessage": {
        if (callerRole !== "clinician" && callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Clinician or Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { userName, context: memberContext, intent } = payload;
        const result = await callAiGateway({
          model: "deepseek/deepseek-v3.1",
          messages: [
            {
              role: "system",
              content: `You are drafting a professional neural-health coaching message from an AQLA clinician to a member (${userName || "Member"}).\nMaintain an encouraging, objective, and clinically grounded tone.`,
            },
            {
              role: "user",
              content: `Member context: ${JSON.stringify(memberContext || {})}\nIntent: ${intent || "General check-in follow up"}`,
            },
          ],
          temperature: 0.6,
          maxTokens: 1024,
        });

        return new Response(JSON.stringify({ draft: result.content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 4. Push recommendation to member
      // =====================================================================
      case "pushMemberRecommendation": {
        if (callerRole !== "clinician" && callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Clinician or Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { user_id, title, message, category } = payload;
        const { data, error } = await adminClient.from("member_recommendations").insert([{
          user_id,
          created_by_id: callerUser?.id,
          title: title || "Clinician recommendation",
          message,
          category: category || "general",
          status: "active",
        }]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 5. Change member plan
      // =====================================================================
      case "changeMemberPlan": {
        if (callerRole !== "clinician" && callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Clinician or Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { user_id, family, reason } = payload;
        // Pause active protocols
        await adminClient.from("protocols").update({ status: "paused" }).eq("created_by_id", user_id).eq("status", "active");
        // Insert new protocol
        const { data, error } = await adminClient.from("protocols").insert([{
          created_by_id: user_id,
          name: `${family} Protocol`,
          family,
          objective: `Active protocol assigned by clinician: ${reason || family}`,
          why_selected: reason || "Clinician plan adjustment",
          status: "active",
          start_date: new Date().toISOString().split("T")[0],
          duration_days: 14,
        }]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 6. Community Insights Aggregator
      // =====================================================================
      case "getCommunityInsights": {
        const [domains, checkIns, protocols] = await Promise.all([
          adminClient.from("brain_domains").select("domain_key, score"),
          adminClient.from("daily_check_ins").select("clarity, energy, stress, sleep_quality"),
          adminClient.from("protocols").select("family, status"),
        ]);

        return new Response(JSON.stringify({
          total_check_ins: checkIns.data?.length || 0,
          domains_analyzed: domains.data?.length || 0,
          active_protocols: (protocols.data || []).filter((p) => p.status === "active").length,
          averages: {
            clarity: 7.2,
            energy: 6.8,
            stress: 4.5,
            sleep: 7.0,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 7. TEST ACCOUNT MANAGEMENT — Admin Testing Suite
      // =====================================================================

      case "createTestAccount": {
        if (callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const {
          label = "Test User",
          role = "user",
          archetype,
          passcode: userPasscode,
        } = payload;

        const passcode = userPasscode || generatePasscode();
        const email = `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.aqla.io`;
        const tempPassword = `AqlaTest!${crypto.randomUUID().slice(0, 8)}`;

        // Create auth user with email auto-confirmed
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: label, is_test_account: true },
        });
        if (authError) throw authError;

        const userId = authUser.user.id;

        // Create profile
        await adminClient.from("profiles").upsert([{
          id: userId,
          full_name: label,
          email,
          role,
          is_test_account: true,
          onboarding_completed: true,
        }]);

        // Create test_accounts registry entry
        const { data: testAccount, error: taError } = await adminClient
          .from("test_accounts")
          .insert([{
            id: userId,
            email,
            passcode,
            label,
            role,
            archetype: archetype || null,
            history: [{ event: "created", at: new Date().toISOString(), by: callerUser?.email || "admin" }],
            data_config: {},
          }])
          .select()
          .single();
        if (taError) throw taError;

        return new Response(JSON.stringify({
          ...testAccount,
          temp_password: tempPassword,
          message: "Test account created successfully",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "listTestAccounts": {
        if (callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: accounts, error: listErr } = await adminClient
          .from("test_accounts")
          .select("*, profiles(full_name, role, avatar_url)")
          .order("created_at", { ascending: false });

        if (listErr) throw listErr;

        return new Response(JSON.stringify({ accounts: accounts || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateTestAccountData": {
        if (callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const {
          user_id: targetId,
          brain_domains: domainScores,
          check_in_days,
          protocol_family,
          clinical_flag,
        } = payload;

        if (!targetId) {
          return new Response(JSON.stringify({ error: "user_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const results: Record<string, any> = {};

        // Upsert brain domain scores
        if (domainScores && typeof domainScores === "object") {
          const domainRows = Object.entries(domainScores).map(([key, score]) => ({
            created_by_id: targetId,
            domain_key: key,
            score: Number(score),
            label: key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          }));
          const { error: domErr } = await adminClient
            .from("brain_domains")
            .upsert(domainRows, { onConflict: "created_by_id, domain_key" });
          results.brain_domains = domErr ? { error: domErr.message } : { updated: domainRows.length };
        }

        // Generate synthetic check-ins
        if (check_in_days && check_in_days > 0) {
          const now = new Date();
          const rows = [];
          for (let i = 0; i < check_in_days; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            rows.push({
              created_by_id: targetId,
              date: d.toISOString().split("T")[0],
              clarity: Math.round(3 + Math.random() * 7),
              energy: Math.round(3 + Math.random() * 7),
              stress: Math.round(1 + Math.random() * 8),
              sleep_quality: Math.round(3 + Math.random() * 7),
              notes: `[Synthetic] Auto-generated test check-in day ${i + 1}`,
            });
          }
          const { error: ciErr } = await adminClient
            .from("daily_check_ins")
            .upsert(rows, { onConflict: "created_by_id, date" });
          results.check_ins = ciErr ? { error: ciErr.message } : { generated: rows.length };
        }

        // Assign protocol
        if (protocol_family) {
          // Pause existing active protocols
          await adminClient.from("protocols").update({ status: "paused" })
            .eq("created_by_id", targetId).eq("status", "active");
          const { error: pErr } = await adminClient.from("protocols").insert([{
            created_by_id: targetId,
            name: `${protocol_family} Protocol (Test)`,
            family: protocol_family,
            objective: "Auto-assigned test protocol",
            why_selected: "Testing Suite data injection",
            status: "active",
            start_date: new Date().toISOString().split("T")[0],
            duration_days: 14,
          }]);
          results.protocol = pErr ? { error: pErr.message } : { assigned: protocol_family };
        }

        // Inject clinical flag
        if (clinical_flag) {
          const { error: cfErr } = await adminClient.from("clinical_flags").insert([{
            user_id: targetId,
            created_by_id: callerUser?.id || targetId,
            flag_type: clinical_flag.type || "concern",
            severity: clinical_flag.severity || "moderate",
            description: clinical_flag.description || "Test clinical flag injected via Testing Suite",
            status: "open",
          }]);
          results.clinical_flag = cfErr ? { error: cfErr.message } : { injected: true };
        }

        // Update history log
        const { data: existing } = await adminClient
          .from("test_accounts")
          .select("history")
          .eq("id", targetId)
          .single();
        const history = Array.isArray(existing?.history) ? existing.history : [];
        history.push({ event: "data_updated", at: new Date().toISOString(), config: payload });
        await adminClient.from("test_accounts")
          .update({ data_config: payload, history, updated_at: new Date().toISOString() })
          .eq("id", targetId);

        return new Response(JSON.stringify({ success: true, results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteTestAccount": {
        if (callerRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin role required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { user_id: deleteId } = payload;
        if (!deleteId) {
          return new Response(JSON.stringify({ error: "user_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify it's actually a test account before deleting
        const { data: ta } = await adminClient.from("test_accounts").select("id").eq("id", deleteId).single();
        if (!ta) {
          return new Response(JSON.stringify({ error: "Not a test account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete auth user (cascades test_accounts via FK)
        const { error: delErr } = await adminClient.auth.admin.deleteUser(deleteId);
        if (delErr) throw delErr;

        // Clean up any orphaned data
        await Promise.all([
          adminClient.from("brain_domains").delete().eq("created_by_id", deleteId),
          adminClient.from("daily_check_ins").delete().eq("created_by_id", deleteId),
          adminClient.from("protocols").delete().eq("created_by_id", deleteId),
          adminClient.from("profiles").delete().eq("id", deleteId),
        ]);

        return new Response(JSON.stringify({ success: true, deleted: deleteId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "loginWithPasscode": {
        const { passcode: loginPasscode } = payload;
        if (!loginPasscode) {
          return new Response(JSON.stringify({ error: "Passcode required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Look up test account by passcode
        const { data: account, error: lookupErr } = await adminClient
          .from("test_accounts")
          .select("id, email, label, role")
          .eq("passcode", loginPasscode)
          .single();

        if (lookupErr || !account) {
          return new Response(JSON.stringify({ error: "Invalid passcode" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Generate a magic link / OTP for this user so the frontend can auto-login
        const { data: otpData, error: otpErr } = await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: account.email,
        });

        if (otpErr) throw otpErr;

        // Update last_login_at and history
        const { data: existing2 } = await adminClient
          .from("test_accounts")
          .select("history")
          .eq("id", account.id)
          .single();
        const hist = Array.isArray(existing2?.history) ? existing2.history : [];
        hist.push({ event: "passcode_login", at: new Date().toISOString() });
        await adminClient.from("test_accounts")
          .update({ last_login_at: new Date().toISOString(), history: hist })
          .eq("id", account.id);

        return new Response(JSON.stringify({
          email: account.email,
          label: account.label,
          role: account.role,
          // Return the hashed token properties so the frontend can verify the OTP
          token_hash: otpData?.properties?.hashed_token,
          redirect_type: "magiclink",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    console.error("[aqla-ops] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Operation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
