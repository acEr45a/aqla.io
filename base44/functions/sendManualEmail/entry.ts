import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { emailShell, registrationEmailHtml } from "../../shared/summaryEmails.js";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { subject, message, recipientIds, sendToAll, template } = await req.json();
    const isRegistration = template === "registration";
    if (!subject?.trim() || (!isRegistration && !message?.trim())) {
      return Response.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const users = await svc.entities.User.list("-created_date", 500);
    const targets = sendToAll
      ? users.filter((item) => item.email)
      : users.filter((item) => item.email && (recipientIds || []).includes(item.id));

    if (targets.length === 0) return Response.json({ error: "No recipients selected" }, { status: 400 });

    const appUrl = req.headers.get("origin") || "";
    const bodyHtml = isRegistration ? "" : message.trim().split(/\n{2,}/).map((block) =>
      `<p>${block.replace(/\n/g, "<br/>")}</p>`).join("");
    const now = new Date().toISOString();
    const sent = [];
    const failed = [];

    for (const target of targets) {
      try {
        await svc.integrations.Core.SendEmail({
          to: target.email,
          from_name: "AQLA",
          subject: subject.trim(),
          body: isRegistration
            ? registrationEmailHtml(target.full_name || "", appUrl)
            : emailShell(subject.trim(), bodyHtml),
        });
        await svc.entities.EmailDigest.create({
          kind: "manual",
          period_key: `manual-${now}`,
          sent_date: now,
          subject: subject.trim(),
          status: "delivered",
          created_by_id: target.id,
        });
        sent.push(target.email);
      } catch (error) {
        await svc.entities.EmailDigest.create({
          kind: "manual",
          period_key: `manual-${now}`,
          sent_date: now,
          subject: subject.trim(),
          status: "failed",
          error_message: error.message,
          created_by_id: target.id,
        });
        failed.push({ email: target.email, reason: error.message });
      }
    }

    return Response.json({ ok: true, sent_count: sent.length, sent, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}