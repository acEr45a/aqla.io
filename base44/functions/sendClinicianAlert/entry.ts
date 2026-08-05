import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { clinicianAlertEmail } from "../../shared/emailTemplates.ts";

/* Clinician → Admin alert: emails every admin a styled HTML copy of a clinical
   concern, formula problem, or improvement suggestion raised from the clinician
   dashboard. */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "clinician" && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const category = (body.category || "General note").toString().trim();
    const subject = (body.subject || "Clinician note").toString().trim();
    const detail = (body.detail || "").toString().trim();
    if (!detail) return Response.json({ error: "Detail is required" }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.list("-created_date", 200);
    const admins = users.filter((u) => u.role === "admin" && u.email);
    if (admins.length === 0) return Response.json({ error: "No admin recipients found" }, { status: 404 });

    const sender = user.full_name || user.email || "AQLA clinician";
    const fullSubject = `[Clinician alert · ${category}] ${subject}`;
    const html = clinicianAlertEmail({
      sender,
      category,
      subject,
      detail,
      submittedAt: new Date().toISOString(),
    });

    const results = await Promise.all(
      admins.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: fullSubject,
          body: html,
          from_name: `AQLA Clinician (${sender})`,
        }).then(() => ({ admin: admin.email, status: "delivered" }))
          .catch((e) => ({ admin: admin.email, status: "failed", error: e.message }))
      )
    );

    const delivered = results.filter((r) => r.status === "delivered").length;
    return Response.json({ delivered, total: admins.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}