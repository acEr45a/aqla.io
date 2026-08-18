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
const DEFAULT_FROM = "AQLA <noreply@aqla.io>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "re_DLtwmBvZ_Ei6N6fwtcrzC3QYweYUtv4jC";

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { to, subject, html, text, from = DEFAULT_FROM, template, recipientIds, sendToAll, message } = await req.json();

    const recipients: string[] = [];

    // If recipientIds or sendToAll are provided (from ManualEmailComposer)
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
    let emailHtml = html;
    const emailText = text || message;

    if (!emailHtml && emailText) {
      const paragraphs = emailText
        .split(/\n\n+/)
        .map((p: string) => `<p style="margin:0 0 16px; line-height:1.6;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      emailHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#0c0d0e; color:#f0f2f5; padding:40px 20px;">
          <div style="max-width:560px; margin:0 auto; background-color:#16181a; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:32px;">
            <div style="font-size:18px; font-weight:700; letter-spacing:0.1em; color:#ffffff; margin-bottom:20px; text-transform:uppercase;">AQLA</div>
            <h1 style="font-size:20px; font-weight:500; color:#ffffff; margin:0 0 16px;">${emailSubject}</h1>
            <div style="font-size:14px; color:#a1a7b0; line-height:1.65;">
              ${paragraphs}
            </div>
            <div style="margin-top:28px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08); font-size:11px; color:#5a6069; text-align:center;">
              &copy; ${new Date().getFullYear()} AQLA.io &middot; Personal Brain Operating System &middot; Sent from noreply@aqla.io
            </div>
          </div>
        </div>
      `;
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Dispatch via Resend API
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
            html: emailHtml,
            text: emailText,
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
