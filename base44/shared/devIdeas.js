// Shared prompt/context helpers for AQLA development idea refinement.

export const TIERS = ["big_idea", "feature", "improvement", "small_fix"];

export const APP_CONTEXT = `AQLA is a premium personal brain operating system (React + Tailwind on Base44).
Existing surfaces: landing page with cinematic neuron animation, assessment, safety screening, Brain Map (3D + radial domain map),
clinical cognitive tests (digit span, PVT, SART, n-back, spatial, verbal fluency), training games, 14-day protocol families
(SPARK, FLOW, DRIVE, LEARN, RESET, DIGITAL), daily check-ins, personal experiments + supplement Toolkit, AQLA Intelligence coach
(text + voice), progress + community insights, branded dark-theme PDF reports (daily plan, weekly, end-of-plan), History archive,
weekly/end-of-plan summary emails, an admin console, and an evidence library. Data is clinically scored with normative tables.`;

export const TIER_RULES = `TIER RANKING — rank every idea by scope, and scale detail depth to the rank:
- "big_idea": a major new pillar or product direction. Detail must be the deepest: 6-9 sentences covering the user problem, how it works end-to-end, the data it needs, why it fits AQLA's clinical-precision positioning, and the main risk.
- "feature": a substantial new capability inside an existing surface. Detail: 4-6 sentences on behaviour, data and placement.
- "improvement": a refinement of something that already exists. Detail: 2-4 sentences on the current gap and the change.
- "small_fix": a polish, copy or minor UX fix. Detail: 1-2 precise sentences.
Also give a concrete "impact" (who benefits and how) and "effort" (rough build size) for every idea, plus ordered implementation steps —
more steps for higher tiers (big_idea 5-7, feature 3-5, improvement 2-3, small_fix 1-2).
Never invent clinical claims. Respect that AQLA does not diagnose, treat or cure anything.`;

export function refinePrompt(raw) {
  return `You are AQLA's product engineering lead. An admin gave you this raw development idea:
"${raw}"

${APP_CONTEXT}

${TIER_RULES}

Refine the raw idea into a precise, buildable checklist item. Keep the admin's intent — sharpen it, don't replace it.
"summary" must be a single tight line (max 110 chars) suitable for a checklist row.
"detail" is what appears on hover: written prose (no bullet characters), depth matching the tier rules above.`;
}

export function wordbankPrompt(existingTitles, focus) {
  return `You are AQLA's product engineering lead generating a wordbank of genuinely strong development ideas for the admin to pick from.

${APP_CONTEXT}

${TIER_RULES}

Generate 6 NEW ideas spread across tiers: 1 big_idea, 2 feature, 2 improvement, 1 small_fix.
${focus ? `Bias them toward this focus area: ${focus}.` : "Spread them across different parts of the product."}
Do NOT repeat or lightly reword any of these existing ideas: ${JSON.stringify(existingTitles)}.

For wordbank ideas the "detail" must be RICHER and more thorough than a checklist item would be — go one level deeper than the tier
minimum on mechanics, data flow and edge cases, since the admin reads this to decide whether to commit to the idea.
"summary" must be the condensed one-line version (max 110 chars) that will be used if the idea is promoted to the checklist.
"area" names the part of AQLA it touches (e.g. "Brain Map", "Protocols", "Emails", "Onboarding").`;
}