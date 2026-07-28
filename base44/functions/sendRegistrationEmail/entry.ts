import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { waitUntil } from "base44:runtime";
import { registrationEmailHtml } from "../../shared/summaryEmails.js";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    waitUntil(base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: "Welcome to AQLA — your brain OS is ready",
      body: registrationEmailHtml(user.full_name || "", req.headers.get("origin") || ""),
      from_name: "AQLA",
    }));

    return Response.json({ queued: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}