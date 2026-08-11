import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin & clinician: returns members (names only, no emails for clinicians),
// each enriched with their full active protocol, latest assessment responses,
// latest safety screening, plus cross-user check-ins / cognitive tests / brain
// domains / experiments so the clinician profile panel needs no per-member calls.
export default async function getMemberData(req: Request): Promise<Response> {
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
    const [users, checkIns, protocols, healthProfiles, assessments, cognitiveTests, brainDomains, experiments] = await Promise.all([
      svc.entities.User.list("-created_date", 500),
      svc.entities.DailyCheckIn.list("-date", 500),
      svc.entities.Protocol.list("-created_date", 500),
      svc.entities.HealthProfile.list("-created_date", 500),
      svc.entities.Assessment.list("-created_date", 500),
      svc.entities.CognitiveTest.list("-created_date", 500),
      svc.entities.BrainDomain.list("-updated_date", 500),
      svc.entities.Experiment.list("-created_date", 500),
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

    // Enriched member directory — full protocol + full assessment responses so
    // the profile panel can render every field without another round-trip.
    const members = users
      .filter((u: any) => u.email)
      .map((u: any) => {
        const proto = activeProtocolByUser[u.id];
        const assess = latestAssessmentByUser[u.id];
        return {
          id: u.id,
          name: u.full_name || "Unnamed member",
          goal: assess?.responses?.goal || "",
          joined: u.created_date,
          protocol: proto
            ? {
                id: proto.id,
                name: proto.name,
                family: proto.family,
                objective: proto.objective || "",
                why_selected: proto.why_selected || "",
                status: proto.status,
                start_date: proto.start_date,
                review_date: proto.review_date,
                duration_days: proto.duration_days,
                actions: proto.actions || [],
                supporting_actions: proto.supporting_actions || [],
                measuring: proto.measuring || [],
                safety_notes: proto.safety_notes || "",
                expected_benefits: proto.expected_benefits || [],
              }
            : null,
          assessment: assess
            ? { responses: assess.responses || {}, completed_date: assess.completed_date, version: assess.version }
            : null,
          safety_screening: latestHealthByUser[u.id]
            ? {
                eligibility_status: latestHealthByUser[u.id].eligibility_status,
                flags: latestHealthByUser[u.id].flags || [],
                completed_date: latestHealthByUser[u.id].completed_date,
              }
            : null,
        };
      });

    const scopedFilter = (list: any[]) => userId ? list.filter((r: any) => r.created_by_id === userId) : list;

    const memberCheckIns = scopedFilter(checkIns).map((c: any) => ({
      id: c.id,
      date: c.date,
      user_id: c.created_by_id,
      user: nameOf(c.created_by_id),
      clarity: c.clarity,
      energy: c.energy,
      stress: c.stress,
      sleep_quality: c.sleep_quality,
      caffeine_drinks: c.caffeine_drinks || "",
      caffeine_servings: c.caffeine_servings,
      caffeine_last_time: c.caffeine_last_time || "",
      side_effects: c.side_effects || "",
      demand: c.demand || "",
      note: c.note || "",
      valid: c.valid !== false,
      created_date: c.created_date,
    }));

    const memberProtocols = scopedFilter(protocols).map((p: any) => ({
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

    const memberCognitiveTests = scopedFilter(cognitiveTests)
      .filter((t: any) => t.valid !== false)
      .map((t: any) => ({
        id: t.id,
        user_id: t.created_by_id,
        test_type: t.test_type,
        normalized_score: t.normalized_score,
        completed_date: t.completed_date,
      }));

    const memberBrainDomains = scopedFilter(brainDomains).map((d: any) => ({
      id: d.id,
      user_id: d.created_by_id,
      domain_name: d.domain_name,
      score: d.score,
      trend: d.trend,
      limiting_factors: d.limiting_factors,
      summary: d.summary,
      next_action: d.next_action,
    }));

    const memberExperiments = scopedFilter(experiments).map((e: any) => ({
      id: e.id,
      user_id: e.created_by_id,
      hypothesis: e.hypothesis,
      intervention: e.intervention,
      status: e.status,
      confidence: e.confidence,
      adherence: e.adherence,
      decision: e.decision,
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
      cognitiveTests: memberCognitiveTests,
      brainDomains: memberBrainDomains,
      experiments: memberExperiments,
      users: usersList,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}