import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { runOpsTask } from '../../shared/opsCompute.js';

// Clinician & admin: drafts a member-facing message using the Backend Ops
// Gemini model. Reuses runOpsTask so it runs off the same AI gateway as every
// other admin surface, but the shared builder fetches strictly-clinical data
// for the single member and strips emails / internal IDs before the model
// sees the prompt.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'clinician') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, intent, note } = body;
    if (!user_id) return Response.json({ error: 'user_id is required' }, { status: 400 });

    const result = await runOpsTask(base44, { task: 'draftClinicianMessage', user_id, intent, note });
    if (result.error) return Response.json({ error: result.error }, { status: result.status || 400 });
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}