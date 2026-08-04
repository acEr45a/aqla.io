// Central AI compute for every admin surface. All LLM work in the app runs through
// runOpsTask — panels and the Backend Ops agent only supply a task name + args.
import { generateObject } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';
import { refinePrompt, wordbankPrompt } from './devIdeas.js';

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

export const THEME_KEYS = ["bg", "panel", "border", "text", "muted", "faint", "accent", "positive", "negative", "warning"];

export const THEME_DEFAULTS = {
  bg: "#0A0A0A", panel: "#121212", border: "#262626", text: "#FFFFFF", muted: "#A3A3A3",
  faint: "#6B6B6B", accent: "#8B5CF6", positive: "#4ADE80", negative: "#F87171", warning: "#FBBF24",
};

function themePrompt(current, instruction) {
  return `You are the theme editor for AQLA's "Fable" PDF design system: a clinical, high-contrast, grid-based dark document style.
Current theme (6-digit hex): ${JSON.stringify(current)}
Key roles: bg = page background (must stay very dark, near #0A0A0A), panel = card fill (slightly lighter than bg), border = hairlines,
text = primary text (must contrast strongly with bg), muted = secondary text, faint = small labels, accent = the single accent color used
for rules, key numbers and charts, positive/negative = trend colors, warning = caution notices.
Admin instruction: "${instruction}"
Return the FULL updated theme. Change only what the instruction asks and keep everything else identical. All values must be 6-digit hex
like #8B5CF6. Never make bg light and never let text blend into bg. Also return a one-sentence note describing what you changed.`;
}

/* Dispatch a single AI task. `base44` must be an authenticated admin client. */
export async function runOpsTask(base44, { task, raw, source, focus, instruction }) {
  const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
  const models = createOpenAICompatible({ name: 'base44', baseURL, apiKey: token, supportsStructuredOutputs: true });

  if (task === 'refineIdea') {
    const text = (raw || '').trim();
    if (!text) return { error: 'Missing idea text', status: 400 };
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object(ideaShape),
      prompt: refinePrompt(text),
    });
    const idea = await base44.entities.DevIdea.create({
      ...object, raw_input: text, status: 'open', source: source || 'chat',
    });
    return { ok: true, idea };
  }

  if (task === 'wordbank') {
    const [existingBank, existingChecklist] = await Promise.all([
      base44.entities.DevWordbankIdea.list('-created_date', 60),
      base44.entities.DevIdea.list('-created_date', 60),
    ]);
    const titles = [...existingBank, ...existingChecklist].map((i) => i.title);
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object({ ideas: z.array(z.object({ ...ideaShape, area: z.string() })) }),
      prompt: wordbankPrompt(titles, focus || ''),
    });
    const ideas = await base44.entities.DevWordbankIdea.bulkCreate(object.ideas.map((i) => ({ ...i, used: false })));
    return { ok: true, count: object.ideas.length, ideas };
  }

  if (task === 'pdfTheme') {
    if (!instruction || !String(instruction).trim()) return { error: 'Missing instruction', status: 400 };
    const existing = await base44.entities.PdfTheme.list('-updated_date', 1);
    const current = { ...THEME_DEFAULTS, ...(existing[0]?.config || {}) };
    const shape = {};
    THEME_KEYS.forEach((k) => { shape[k] = z.string(); });
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object({ theme: z.object(shape), note: z.string() }),
      prompt: themePrompt(current, instruction),
    });
    const clean = {};
    THEME_KEYS.forEach((k) => {
      const v = object.theme?.[k];
      clean[k] = typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : current[k];
    });
    if (existing[0]) await base44.entities.PdfTheme.update(existing[0].id, { config: clean, note: object.note });
    else await base44.entities.PdfTheme.create({ config: clean, note: object.note });
    return { ok: true, theme: clean, note: object.note };
  }

  return { error: `Unknown task: ${task}`, status: 400 };
}