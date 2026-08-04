import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const KEYS = ["bg", "panel", "border", "text", "muted", "faint", "accent", "positive", "negative", "warning"];
const DEFAULTS = {
  bg: "#0A0A0A", panel: "#121212", border: "#262626", text: "#FFFFFF", muted: "#A3A3A3",
  faint: "#6B6B6B", accent: "#8B5CF6", positive: "#4ADE80", negative: "#F87171", warning: "#FBBF24",
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { instruction } = await req.json();
    if (!instruction || !String(instruction).trim()) {
      return Response.json({ error: 'instruction is required' }, { status: 400 });
    }

    const existing = await base44.entities.PdfTheme.list("-updated_date", 1);
    const current = { ...DEFAULTS, ...(existing[0]?.config || {}) };

    const colorProps = {};
    for (const k of KEYS) colorProps[k] = { type: "string" };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the theme editor for AQLA's "Fable" PDF design system: a clinical, high-contrast, grid-based dark document style.
Current theme (JSON, 6-digit hex colors): ${JSON.stringify(current)}
Key roles: bg = page background (must stay very dark, near #0A0A0A), panel = card fill (slightly lighter than bg), border = hairlines, text = primary text (must contrast strongly with bg), muted = secondary text, faint = labels, accent = the single accent color used for rules/numbers/charts, positive/negative = trend colors, warning = caution notices.
Admin instruction: "${instruction}"
Return the FULL updated theme. Change only what the instruction asks; keep everything else identical. All values must be 6-digit hex like #8B5CF6. Never make bg light and never let text blend into bg. Also return a one-sentence note describing what you changed.`,
      response_json_schema: {
        type: "object",
        properties: {
          theme: { type: "object", properties: colorProps, required: KEYS },
          note: { type: "string" },
        },
        required: ["theme", "note"],
      },
    });

    const clean = {};
    for (const k of KEYS) {
      const v = result?.theme?.[k];
      clean[k] = typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : current[k];
    }

    if (existing[0]) {
      await base44.entities.PdfTheme.update(existing[0].id, { config: clean, note: result.note });
    } else {
      await base44.entities.PdfTheme.create({ config: clean, note: result.note });
    }

    return Response.json({ theme: clean, note: result.note });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}