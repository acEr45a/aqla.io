import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Resolves an issue surfaced by runAppDiagnostics. Each check that can be fixed
// carries a `resolve_action` string; this function dispatches on it. Admin-only.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const action = String(body?.action || "").trim();
    const targetUserId = body?.user_id ? String(body.user_id) : null;

    if (action === "cleanup_expired_otps") {
      const now = new Date().toISOString();
      const stale = await base44.asServiceRole.entities.AdminOtp.filter(
        { used: false, expires_at: { $lt: now } },
        "-created_date",
        500
      );
      const ids = stale.map((o) => o.id);
      if (ids.length) await base44.asServiceRole.entities.AdminOtp.deleteMany({ id: { $in: ids } });
      return Response.json({ resolved: true, action, deleted: ids.length });
    }

    if (action === "kick_onboard_users") {
      // No automatic action: each stuck user needs an admin decision. Return the
      // list of user ids so the admin (or Backend Ops) can follow up per-user.
      const assessments = await base44.asServiceRole.entities.Assessment.list("-created_date", 500);
      const assessedIds = new Set(assessments.map((a) => a.created_by_id));
      const users = await base44.asServiceRole.entities.User.list("-created_date", 200);
      const stuck = users.filter((u) => !assessedIds.has(u.id)).map((u) => ({ id: u.id, email: u.email }));
      return Response.json({ resolved: true, action, stuck_users: stuck });
    }

    return Response.json({ error: `Unknown action: ${action || "(empty)"}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}