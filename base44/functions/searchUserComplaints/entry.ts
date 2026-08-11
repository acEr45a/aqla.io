import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin-only. Given a natural-language query, fetches all open/investigating
// complaints and asks the LLM to rank them by semantic similarity — surfacing
// complaints that match the *meaning* of the query, not just keywords.
// Returns the ranked id list plus a one-line reason for each match.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || "").trim();
    if (!query) return Response.json({ error: "Query is required" }, { status: 400 });

    const complaints = await base44.asServiceRole.entities.UserComplaint.list("-created_date", 500);
    if (complaints.length === 0) return Response.json({ matches: [] });

    const catalog = complaints.map((c, i) => ({
      i,
      id: c.id,
      category: c.category,
      subject: c.subject || "",
      detail: (c.detail || "").slice(0, 400),
      status: c.status,
    }));

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: "gpt_5_mini",
      prompt: `You are a triage assistant for an admin reviewing user complaints in the AQLA brain-health app. The admin typed a natural-language search.

Admin query: "${query}"

Here are the complaints on file (JSON array):
${JSON.stringify(catalog)}

Rank the complaints by semantic relevance to the query — match meaning and intent, not just literal keywords. Include a complaint even if it uses different wording but describes the same kind of problem.

Return a JSON object with a "matches" array, ordered most-relevant first. Each entry: { "i": <index from catalog>, "reason": "<one short line explaining why it matches the query>" }. Only include complaints that are genuinely relevant. If none are relevant, return an empty array.`,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                i: { type: "number" },
                reason: { type: "string" },
              },
              required: ["i", "reason"],
            },
          },
        },
        required: ["matches"],
      },
    });

    const byIndex = new Map(catalog.map((c) => [c.i, complaints[c.i]]));
    const matches = (res.matches || [])
      .map((m) => {
        const complaint = byIndex.get(m.i);
        if (!complaint) return null;
        return { id: complaint.id, reason: m.reason || "" };
      })
      .filter(Boolean);

    return Response.json({ matches });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}