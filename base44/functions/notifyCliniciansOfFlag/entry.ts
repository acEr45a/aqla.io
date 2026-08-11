import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { clinicalFlagEmail } from '../../shared/emailTemplates.ts';

/* Auto-flag notification: when a user-facing agent response is flagged for
   clinical review, broadcast a branded HTML email to every clinician (and
   admin, who also act as clinicians) so the flagged content can be reviewed. */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const source_agent = (body.source_agent || 'agent').toString();
    const message_snippet = (body.message_snippet || '').toString();
    const user_name = (body.user_name || 'a member').toString();
    if (!message_snippet) return Response.json({ error: 'message_snippet is required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const users = await svc.entities.User.list('-created_date', 200);
    const clinicians = users.filter((u: any) => (u.role === 'clinician' || u.role === 'admin') && u.email);
    if (clinicians.length === 0) return Response.json({ delivered: 0, total: 0, results: [] });

    const html = clinicalFlagEmail({
      sourceAgent: source_agent,
      messageSnippet: message_snippet,
      userName: user_name,
      flaggedAt: new Date().toISOString(),
    });
    const subject = `[Clinical flag · ${source_agent}] Flagged agent response needs review`;

    const results = await Promise.all(
      clinicians.map((c: any) =>
        svc.integrations.Core
          .SendEmail({ to: c.email, subject, body: html })
          .then(() => ({ to: c.email, status: 'delivered' }))
          .catch((e: any) => ({ to: c.email, status: 'failed', error: e.message }))
      )
    );
    const delivered = results.filter((r: any) => r.status === 'delivered').length;
    return Response.json({ delivered, total: clinicians.length, results });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}