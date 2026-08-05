import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin & clinician: pushes a recommendation to a member.
// Creates a MemberRecommendation record (status: active) so it surfaces as a
// pop-up on the member's dashboard, and emails the member a copy.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "clinician") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* noop */ }
    const { user_id, title, message, category } = body;
    if (!user_id || !message) {
      return Response.json({ error: "user_id and message are required" }, { status: 400 });
    }

    const rec = await base44.entities.MemberRecommendation.create({
      user_id,
      title: title || "A new recommendation from your AQLA clinician",
      message,
      category: category || "general",
      status: "active",
    });

    // Email the target member (registered app users only).
    const svc = base44.asServiceRole;
    const target = await svc.entities.User.get(user_id);
    if (target?.email) {
      try {
        await svc.integrations.Core.SendEmail({
          to: target.email,
          subject: title || "A new recommendation from your AQLA clinician",
          body: `Hi ${target.full_name || "there"},\n\nYour clinician has a new recommendation for you:\n\n${message}\n\nLog in to AQLA — it's waiting on your dashboard.`,
        });
      } catch { /* email failure should not block the recommendation */ }
    }

    return Response.json({ ok: true, recommendation: rec });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}