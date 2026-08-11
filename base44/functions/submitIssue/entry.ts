import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { userIssueEmail } from "../../shared/emailTemplates.ts";
import { broadcastToAdmins } from "../../shared/adminBroadcast.ts";

// Any authenticated user: submits an issue from the Help Center and emails
// every admin a styled HTML copy.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const category = (body.category || "Other").toString().trim();
    const subject = (body.subject || "User issue").toString().trim();
    const detail = (body.detail || "").toString().trim();
    if (!detail) return Response.json({ error: "Detail is required" }, { status: 400 });

    const userName = user.full_name || user.email || "AQLA user";
    const userEmail = user.email || "";

    // Persist the complaint so it appears in the admin complaints panel.
    try {
      await base44.entities.UserComplaint.create({
        category,
        subject,
        detail,
        status: "open",
        user_name: userName,
        user_email: userEmail,
      });
    } catch {
      // Non-fatal: the admin email still goes out below.
    }

    const html = userIssueEmail({
      userName,
      userEmail,
      category,
      subject,
      detail,
      submittedAt: new Date().toISOString(),
    });

    const { delivered, total } = await broadcastToAdmins(base44.asServiceRole, {
      subject: `[User issue · ${category}] ${subject}`,
      html,
    });
    if (total === 0) return Response.json({ error: "No admin recipients found" }, { status: 404 });
    return Response.json({ delivered, total });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}