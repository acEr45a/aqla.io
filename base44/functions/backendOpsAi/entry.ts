import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { runOpsTask } from '../../shared/opsCompute.js';

/* Single AI compute endpoint for every admin surface.
   tasks: refineIdea | wordbank | pdfTheme */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const result = await runOpsTask(base44, body);
    if (result.error) return Response.json({ error: result.error }, { status: result.status || 400 });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}