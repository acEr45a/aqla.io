import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const code = String(body?.code || "").trim();
    if (code.length !== 6) return Response.json({ verified: false, error: "Enter the 6-digit code." });

    const rows = await base44.asServiceRole.entities.AdminOtp.filter(
      { user_id: user.id, code, used: false }, "-created_date", 5
    );
    const match = rows.find((row) => new Date(row.expires_at) > new Date());
    if (!match) return Response.json({ verified: false, error: "That code is invalid or expired." });

    await base44.asServiceRole.entities.AdminOtp.update(match.id, { used: true });
    return Response.json({ verified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}