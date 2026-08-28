import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    console.log("[resend-inbound] Received webhook event:", payload.type || "unknown");

    // Process email.received event
    const emailData = payload.data || payload;
    const senderEmail = emailData.from || emailData.sender || "patient@example.com";
    const senderName = emailData.from_name || senderEmail.split("@")[0];
    const recipientEmail = emailData.to?.[0] || emailData.recipient || "clinician@aqla.io";
    const subject = emailData.subject || "Patient Inquiry";
    const bodyHtml = emailData.html || `<p>${emailData.text || "No content provided."}</p>`;
    const rawAttachments = emailData.attachments || [];

    // Process attachments and upload to storage if present
    const processedAttachments: any[] = [];
    for (const att of rawAttachments) {
      if (att.content && att.filename) {
        try {
          const buffer = Uint8Array.from(atob(att.content), (c) => c.charCodeAt(0));
          const storagePath = `inbound/${Date.now()}_${att.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("clinical-attachments")
            .upload(storagePath, buffer, {
              contentType: att.content_type || "application/octet-stream",
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: urlData } = supabase.storage
              .from("clinical-attachments")
              .getPublicUrl(storagePath);

            processedAttachments.push({
              name: att.filename,
              size: buffer.length,
              type: att.content_type || "application/octet-stream",
              url: urlData?.publicUrl || "",
            });
          }
        } catch (e) {
          console.warn("[resend-inbound] Attachment upload error:", e);
        }
      }
    }

    // Match or create thread
    const cleanSubject = subject.replace(/^(Re:\s*|Fwd:\s*)+/i, "").trim();
    const { data: existingThreads } = await supabase
      .from("threads")
      .select("*")
      .ilike("subject", cleanSubject)
      .limit(1);

    let threadId: string;
    if (existingThreads && existingThreads.length > 0) {
      threadId = existingThreads[0].id;
      // Add sender to participants if not already included
      const currentParticipants = existingThreads[0].participant_emails || [];
      if (!currentParticipants.includes(senderEmail)) {
        await supabase
          .from("threads")
          .update({
            participant_emails: [...currentParticipants, senderEmail],
            updated_at: new Date().toISOString(),
            is_archived: false,
            is_trashed: false,
          })
          .eq("id", threadId);
      } else {
        await supabase
          .from("threads")
          .update({
            updated_at: new Date().toISOString(),
            is_archived: false,
            is_trashed: false,
          })
          .eq("id", threadId);
      }
    } else {
      // Determine category (Patient Care by default for clinical inbound)
      const isPatientCare = /protocol|symptom|lab|dosage|brain|test|report|score/i.test(subject + " " + bodyHtml);
      const category = isPatientCare ? "Patient Care" : "Primary";

      const { data: newThread, error: threadErr } = await supabase
        .from("threads")
        .insert([
          {
            subject: cleanSubject || subject,
            participant_emails: [senderEmail, recipientEmail],
            category,
            is_starred: false,
            is_archived: false,
            is_spam: false,
            is_trashed: false,
          },
        ])
        .select()
        .single();

      if (threadErr || !newThread) {
        throw new Error(`Failed to create thread: ${threadErr?.message}`);
      }
      threadId = newThread.id;
    }

    // Insert Message
    const { data: newMessage, error: msgErr } = await supabase
      .from("messages")
      .insert([
        {
          thread_id: threadId,
          email_id: emailData.id || `inbound-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          sender_email: senderEmail,
          sender_name: senderName,
          recipient_email: recipientEmail,
          subject,
          body_html: bodyHtml,
          attachments: processedAttachments,
          is_read: false,
          is_encrypted: true,
        },
      ])
      .select()
      .single();

    if (msgErr) {
      throw new Error(`Failed to insert message: ${msgErr?.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, thread_id: threadId, message_id: newMessage?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[resend-inbound] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
