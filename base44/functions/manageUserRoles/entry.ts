import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    if (body.action === "set_role") {
      if (!body.user_id || !["admin", "user"].includes(body.role)) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
      }
      if (body.user_id === admin.id) {
        return Response.json({ error: "You cannot change your own role." }, { status: 400 });
      }
      await base44.asServiceRole.entities.User.update(body.user_id, { role: body.role });
    }

    const users = await base44.asServiceRole.entities.User.list("-created_date", 200);
    return Response.json({
      currentUserId: admin.id,
      users: users.map((item) => ({
        id: item.id,
        name: item.full_name || "Unnamed user",
        email: item.email,
        role: item.role,
        joined: item.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}