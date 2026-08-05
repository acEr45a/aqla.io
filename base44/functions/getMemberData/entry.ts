import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin-only: returns cross-user daily check-ins and protocols with user names,
// for the "Member data" admin tab and the Backend Ops agent.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch { /* empty payload allowed */ }
    const userId = body.user_id || null;

    const svc = base44.asServiceRole;
    const [users, checkIns, protocols] = await Promise.all([
      svc.entities.User.list("-created_date", 500),
      svc.entities.DailyCheckIn.list("-date", 500),
      svc.entities.Protocol.list("-created_date", 500),
    ]);

    const userById: Record<string, any> = users.reduce((map: any, u: any) => ({ ...map, [u.id]: u }), {});
    const nameOf = (id: string) => userById[id]?.full_name || userById[id]?.email || "Unknown user";

    const scopedCheckIns = userId ? checkIns.filter((c: any) => c.created_by_id === userId) : checkIns;
    const scopedProtocols = userId ? protocols.filter((p: any) => p.created_by_id === userId) : protocols;

    const memberCheckIns = scopedCheckIns.map((c: any) => ({
      id: c.id,
      date: c.date,
      user_id: c.created_by_id,
      user: nameOf(c.created_by_id),
      clarity: c.clarity,
      energy: c.energy,
      stress: c.stress,
      sleep_quality: c.sleep_quality,
      caffeine_drinks: c.caffeine_drinks || "",
      demand: c.demand || "",
      note: c.note || "",
      valid: c.valid !== false,
      created_date: c.created_date,
    }));

    const memberProtocols = scopedProtocols.map((p: any) => ({
      id: p.id,
      user_id: p.created_by_id,
      user: nameOf(p.created_by_id),
      name: p.name,
      family: p.family,
      status: p.status,
      objective: p.objective || "",
      start_date: p.start_date,
      review_date: p.review_date,
    }));

    return Response.json({
      checkIns: memberCheckIns,
      protocols: memberProtocols,
      users: users.filter((u: any) => u.email).map((u: any) => ({
        id: u.id,
        name: u.full_name || "Unnamed user",
        email: u.email,
      })),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}