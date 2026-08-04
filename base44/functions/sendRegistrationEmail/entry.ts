import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { registrationEmailHtml } from "../../shared/summaryEmails.js";

const APP_URL = "https://aqla.base44.app";
const SUBJECT = "Welcome to AQLA — your brain OS is ready";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({})) || {};
    const { user_id, email, full_name, secret } = body;

    // Preferred path: invoked by the "Welcome Email" workflow on signup,
    // which passes the new user's id + email from the auth event.
    // The shared secret proves the call came from the platform workflow, not an outside caller.
    if (user_id) {
      if (secret !== secrets.get("WORKFLOW_SECRET")) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      const user = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
      if (user?.welcome_email_sent) return Response.json({ sent: false, reason: "already_sent" });

      const to = email || user?.email;
      if (!to) return Response.json({ error: "missing_email" }, { status: 400 });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject: SUBJECT,
        body: registrationEmailHtml(full_name || user?.full_name || "", APP_URL),
        from_name: "AQLA",
      });
      await base44.asServiceRole.entities.User.update(user_id, { welcome_email_sent: true });
      return Response.json({ sent: true });
    }

    // Fallback: a logged-in user triggering it directly (e.g. admin re-send).
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (me.welcome_email_sent) return Response.json({ sent: false, reason: "already_sent" });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: me.email,
      subject: SUBJECT,
      body: registrationEmailHtml(me.full_name || "", APP_URL),
      from_name: "AQLA",
    });
    await base44.asServiceRole.entities.User.update(me.id, { welcome_email_sent: true });
    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}