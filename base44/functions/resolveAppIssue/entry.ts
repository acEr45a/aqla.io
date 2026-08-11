import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Resolves an issue surfaced by runAppDiagnostics.
// - Known, safe actions are applied automatically.
// - Anything we can't auto-fix returns a ready-to-paste builder prompt generated
//   by the Backend Ops LLM, so the admin can paste it straight into the builder.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const action = String(body?.action || "").trim();
    const checkName = body?.check_name ? String(body.check_name) : action;
    const checkDetail = body?.check_detail ? String(body.check_detail) : "";

    // --- Known auto-fixes ---
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
      const assessments = await base44.asServiceRole.entities.Assessment.list("-created_date", 500);
      const assessedIds = new Set(assessments.map((a) => a.created_by_id));
      const users = await base44.asServiceRole.entities.User.list("-created_date", 200);
      const stuck = users.filter((u) => !assessedIds.has(u.id)).map((u) => ({ id: u.id, email: u.email }));
      return Response.json({ resolved: true, action, stuck_users: stuck });
    }

    // --- Can't auto-fix: generate a builder prompt the admin can paste ---
    const prompt = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: "gpt_5_mini",
      prompt: `You are Backend Ops AI for the AQLA brain-health app (React + Tailwind + Vite on the Base44 platform). The admin ran the app health scan and pressed "Resolve" on a check that has no automatic fix.

Check name: "${checkName}"
Check detail: "${checkDetail || "(no detail provided)"}"

Write a single, ready-to-paste instruction prompt that the admin can drop straight into the Base44 builder chat to fix this issue. Be specific and actionable: name the likely file(s), the change to make, and the desired outcome. Do not explain that you are an AI. Do not add headings or bullet markers — just the prompt text the admin will paste.`,
    });

    return Response.json({
      resolved: false,
      action,
      builder_prompt: typeof prompt === "string" ? prompt.trim() : JSON.stringify(prompt),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}