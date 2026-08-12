import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { test_mode } = body || {};

    const existing = await base44.asServiceRole.entities.AppSettings.list();
    if (existing.length) {
      await base44.asServiceRole.entities.AppSettings.update(existing[0].id, { test_mode: !!test_mode });
    } else {
      await base44.asServiceRole.entities.AppSettings.create({ test_mode: !!test_mode });
    }
    return Response.json({ test_mode: !!test_mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}