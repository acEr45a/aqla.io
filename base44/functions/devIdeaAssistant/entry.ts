import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateObject } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';
import { refinePrompt, wordbankPrompt } from '../../shared/devIdeas.js';

const tierEnum = z.enum(["big_idea", "feature", "improvement", "small_fix"]);

const ideaShape = {
  title: z.string(),
  summary: z.string(),
  detail: z.string(),
  tier: tierEnum,
  impact: z.string(),
  effort: z.string(),
  steps: z.array(z.string()),
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'refine';
    // actions: refine (one raw idea -> checklist item), wordbank (generate ranked idea pool)

    const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
    const models = createOpenAICompatible({ name: 'base44', baseURL, apiKey: token, supportsStructuredOutputs: true });

    if (action === 'refine') {
      const raw = (body.raw || '').trim();
      if (!raw) return Response.json({ error: 'Missing idea text' }, { status: 400 });
      const { object } = await generateObject({
        model: models('automatic'),
        schema: z.object(ideaShape),
        prompt: refinePrompt(raw),
      });
      const created = await base44.entities.DevIdea.create({
        ...object,
        raw_input: raw,
        status: 'open',
        source: body.source || 'chat',
      });
      return Response.json({ ok: true, idea: created });
    }

    if (action === 'wordbank') {
      const [existingBank, existingChecklist] = await Promise.all([
        base44.entities.DevWordbankIdea.list('-created_date', 60),
        base44.entities.DevIdea.list('-created_date', 60),
      ]);
      const titles = [...existingBank, ...existingChecklist].map((i) => i.title);
      const { object } = await generateObject({
        model: models('automatic'),
        schema: z.object({ ideas: z.array(z.object({ ...ideaShape, area: z.string() })) }),
        prompt: wordbankPrompt(titles, body.focus || ''),
      });
      const created = await base44.entities.DevWordbankIdea.bulkCreate(
        object.ideas.map((i) => ({ ...i, used: false }))
      );
      return Response.json({ ok: true, count: object.ideas.length, ideas: created });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}