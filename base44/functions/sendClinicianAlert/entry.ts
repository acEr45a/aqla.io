import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { clinicianAlertEmail } from "../../shared/emailTemplates.ts";
import { broadcastToAdmins } from "../../shared/adminBroadcast.ts";

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

    const sender = user.full_name || user.email || "AQLA clinician";
    const html = clinicianAlertEmail({
      sender,
      category,
      subject,
      detail,
      submittedAt: new Date().toISOString(),
    });

    const { delivered, total, results } = await broadcastToAdmins(base44.asServiceRole, {
      subject: `[Clinician alert · ${category}] ${subject}`,
      html,
      fromName: `AQLA Clinician (${sender})`,
    });
    if (total === 0) return Response.json({ error: "No admin recipients found" }, { status: 404 });
    return Response.json({ delivered, total, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}