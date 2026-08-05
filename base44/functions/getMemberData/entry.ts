import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin & clinician: returns members (names only, no emails), each with their
// active protocol and latest safety screening, plus cross-user check-ins/protocols.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "clinician") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* empty payload allowed */ }
    const userId = body.user_id || null;
    const isClinician = user.role === "clinician";

    const svc = base44.asServiceRole;
    const [users, checkIns, protocols, healthProfiles, assessments] = await Promise.all([
      svc.entities.User.list("-created_date", 500),
      svc.entities.DailyCheckIn.list("-date", 500),
      svc.entities.Protocol.list("-created_date", 500),
      svc.entities.HealthProfile.list("-created_date", 500),
      svc.entities.Assessment.list("-created_date", 500),
    ]);

    const userById: Record<string, any> = users.reduce((map: any, u: any) => ({ ...map, [u.id]: u }), {});
    const nameOf = (id: string) => userById[id]?.full_name || "Unnamed member";

    const activeProtocolByUser: Record<string, any> = {};
    protocols.forEach((p: any) => {
      if (p.status === "active" && !activeProtocolByUser[p.created_by_id]) activeProtocolByUser[p.created_by_id] = p;
    });

    const latestHealthByUser: Record<string, any> = {};
    healthProfiles.forEach((h: any) => {
      if (!latestHealthByUser[h.created_by_id]) latestHealthByUser[h.created_by_id] = h;
    });

    const latestAssessmentByUser: Record<string, any> = {};
    assessments.forEach((a: any) => {
      if (!latestAssessmentByUser[a.created_by_id]) latestAssessmentByUser[a.created_by_id] = a;
    });

    // Enriched member directory — names only, no emails exposed to clinicians.
    const members = users
      .filter((u: any) => u.email)
      .map((u: any) => ({
        id: u.id,
        name: u.full_name || "Unnamed member",
        goal: latestAssessmentByUser[u.id]?.responses?.goal || "",
        joined: u.created_date,
        protocol: activeProtocolByUser[u.id]
          ? {
              name: activeProtocolByUser[u.id].name,
              family: activeProtocolByUser[u.id].family,
              objective: activeProtocolByUser[u.id].objective || "",
              status: activeProtocolByUser[u.id].status,
              start_date: activeProtocolByUser[u.id].start_date,
              review_date: activeProtocolByUser[u.id].review_date,
            }
          : null,
        safety_screening: latestHealthByUser[u.id]
          ? {
              eligibility_status: latestHealthByUser[u.id].eligibility_status,
              flags: latestHealthByUser[u.id].flags || [],
              completed_date: latestHealthByUser[u.id].completed_date,
            }
          : null,
      }));

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

    // Admin retains the full user list (with email) for the Member data panel;
    // clinicians get names only.
    const usersList = isClinician
      ? users.filter((u: any) => u.email).map((u: any) => ({ id: u.id, name: u.full_name || "Unnamed member" }))
      : users.filter((u: any) => u.email).map((u: any) => ({ id: u.id, name: u.full_name || "Unnamed user", email: u.email }));

    return Response.json({
      members,
      checkIns: memberCheckIns,
      protocols: memberProtocols,
      users: usersList,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}