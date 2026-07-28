import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { emailShell } from "../../shared/summaryEmails.js";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() * 1 + 10 * 60000).toISOString();

    await base44.asServiceRole.entities.AdminOtp.create({
      user_id: user.id,
      code,
      expires_at: expiresAt,
      used: false,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `AQLA admin verification code: ${code}`,
      from_name: "AQLA Security",
      body: emailShell("Admin console verification", `
        <p>A sign-in to the AQLA admin console was requested for your account.</p>
        <p style="font-size:32px;letter-spacing:.22em;font-weight:600;color:#C9F24E;margin:18px 0">${code}</p>
        <p>This code expires in 10 minutes and can be used once. If you did not request it, ignore this email and change your password.</p>
      `),
    });

    return Response.json({ sent: true, email: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}