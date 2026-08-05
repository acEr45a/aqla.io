import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin-only: marks a daily check-in as invalid (valid=false) so the user can
// submit a fresh one. The original record is kept for audit — never deleted.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch { return Response.json({ error: "check_in_id is required" }, { status: 400 }); }
    const checkInId = body.check_in_id;
    if (!checkInId) return Response.json({ error: "check_in_id is required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const existing = await svc.entities.DailyCheckIn.get(checkInId);
    if (!existing) return Response.json({ error: "Check-in not found" }, { status: 404 });

    await svc.entities.DailyCheckIn.update(checkInId, { valid: false });

    return Response.json({
      status: "success",
      check_in_id: checkInId,
      date: existing.date,
      user_id: existing.created_by_id,
      valid: false,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}