// Canonical medical-model assignment (2026-09-18): inclusionAI Ling 3.0 Flash Sante via
// OpenRouter — assigned to medical-risk surfaces only (risk factoring, evidence-based
// retrieval, symptom extraction). Imported by edge functions (Deno) and by src/ client
// call sites (Vite) so the slug lives in exactly one place. gateway.ts routes the
// "openrouter/" prefix to openrouter.ai and failovers 403/429 onto the Vercel AI
// Gateway chain if the OpenRouter route is unavailable.
export const OPENROUTER_MEDICAL_MODEL = "openrouter/inclusionai/ling-3.0-flash-sante:free";
