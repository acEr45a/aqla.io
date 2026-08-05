import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin & clinician: reverts a member's plan change recorded in a PlanReview
// (decision === "switch") by re-activating the previous protocol family and
// pausing the currently active one. Operates with the service role so the
// clinician can act on another member's protocols.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "clinician") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan_review_id } = body;
    if (!plan_review_id) {
      return Response.json({ error: "plan_review_id is required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const review = await svc.entities.PlanReview.get(plan_review_id);
    if (!review) return Response.json({ error: "Plan review not found" }, { status: 404 });
    if (review.decision !== "switch") {
      return Response.json({ error: "Only switched plans can be reverted" }, { status: 400 });
    }

    const memberId = review.created_by_id;
    const previousFamily = review.protocol_family;
    if (!memberId || !previousFamily) {
      return Response.json({ error: "Incomplete plan review record" }, { status: 400 });
    }

    const protocols = await svc.entities.Protocol.filter({ created_by_id: memberId });
    const target = protocols.find((p: any) => p.family === previousFamily);
    if (!target) {
      return Response.json({ error: "Previous protocol no longer available to restore" }, { status: 404 });
    }

    const now = new Date();
    const reviewDate = new Date(now);
    reviewDate.setDate(reviewDate.getDate() + 14);
    const today = now.toISOString().slice(0, 10);
    const reviewDateStr = reviewDate.toISOString().slice(0, 10);

    const updates = protocols
      .filter((p: any) => p.status === "active" && p.id !== target.id)
      .map((p: any) => ({ id: p.id, status: "paused" }));
    updates.push({
      id: target.id,
      status: "active",
      start_date: today,
      review_date: reviewDateStr,
      duration_days: 14,
    });
    await svc.entities.Protocol.bulkUpdate(updates);

    return Response.json({ ok: true, restored_family: previousFamily, member_id: memberId });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}