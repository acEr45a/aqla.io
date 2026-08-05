import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { adminNotifyClinicianEmail } from "../../shared/emailTemplates.ts";

// Admin only: sends a styled HTML note to a chosen clinician's inbox.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { user_id, subject, message } = body;
    if (!user_id || !subject || !message) {
      return Response.json({ error: "user_id, subject and message are required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const clinician = await svc.entities.User.get(user_id);
    if (!clinician?.email) return Response.json({ error: "Clinician not found" }, { status: 404 });
    if (clinician.role !== "clinician" && clinician.role !== "admin") {
      return Response.json({ error: "Target is not a clinician" }, { status: 400 });
    }

    await svc.integrations.Core.SendEmail({
      to: clinician.email,
      subject,
      body: adminNotifyClinicianEmail({
        clinicianName: clinician.full_name || "there",
        subject,
        message,
        adminName: user.full_name || user.email || "AQLA admin",
        submittedAt: new Date().toISOString(),
      }),
    });
    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}