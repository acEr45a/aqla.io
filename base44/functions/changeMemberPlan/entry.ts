import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { planChangeEmail } from "../../shared/emailTemplates.ts";

// Admin & clinician: changes a member's active protocol family (service role),
// then pushes a dashboard pop-up recommendation and a styled email to the member.
const FAMILIES = ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET", "DIGITAL"];
const FAMILY_OBJECTIVES: Record<string, string> = {
  SPARK: "Fast-acting focus & alertness",
  FLOW: "Calm, grounded clarity",
  DRIVE: "Sustained motivation & drive",
  LEARN: "Learning & memory consolidation",
  RESET: "Recovery & sleep restoration",
  DIGITAL: "Digital wellbeing & attention hygiene",
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "clinician") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, family, reason } = body;
    if (!user_id || !family) {
      return Response.json({ error: "user_id and family are required" }, { status: 400 });
    }
    if (!FAMILIES.includes(family)) {
      return Response.json({ error: "Invalid family" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const protocols = await svc.entities.Protocol.filter({ created_by_id: user_id });
    const today = new Date();
    const reviewDate = new Date(today);
    reviewDate.setDate(reviewDate.getDate() + 14);
    const todayStr = today.toISOString().slice(0, 10);
    const reviewStr = reviewDate.toISOString().slice(0, 10);

    let target = protocols.find((p: any) => p.family === family);
    if (!target) {
      target = await svc.entities.Protocol.create({
        name: `${family} 14-Day Plan`,
        family,
        objective: FAMILY_OBJECTIVES[family] || family,
        why_selected: reason ? `Assigned by your clinician: ${reason}` : "Assigned by your clinician.",
        status: "paused",
        start_date: todayStr,
        review_date: reviewStr,
        duration_days: 14,
        expected_benefits: [],
        measuring: ["Clarity", "Energy", "Stress", "Sleep quality"],
        created_by_id: user_id,
      });
    }

    const updates = protocols
      .filter((p: any) => p.status === "active" && p.id !== target.id)
      .map((p: any) => ({ id: p.id, status: "paused" }));
    updates.push({
      id: target.id,
      status: "active",
      start_date: todayStr,
      review_date: reviewStr,
      duration_days: 14,
    });
    await svc.entities.Protocol.bulkUpdate(updates);

    // Dashboard pop-up for the member.
    const recMessage = reason
      ? `Your clinician has switched your active protocol to ${family}. ${reason}`
      : `Your clinician has switched your active protocol to ${family}.`;
    await svc.entities.MemberRecommendation.create({
      user_id,
      title: `Your plan is now ${family}`,
      message: recMessage,
      category: "protocol",
      status: "active",
    });

    // Styled email to the member.
    const member = await svc.entities.User.get(user_id);
    if (member?.email) {
      try {
        await svc.integrations.Core.SendEmail({
          to: member.email,
          subject: `Your AQLA plan is now ${family}`,
          body: planChangeEmail({
            memberName: member.full_name || "there",
            family,
            reason: reason || "",
            clinicianName: user.full_name || "",
          }),
        });
      } catch { /* email failure should not block the plan change */ }
    }

    return Response.json({ ok: true, family });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}