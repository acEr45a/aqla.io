# AGENT_NOTEBOOK.md
> **Last Updated By:** Antigravity on 2026-09-11 18:00 UTC | **Task:** Inter-Agent Handshake Seeding & Dual-Track Gateway Bridging

Welcome to the shared inter-agent notebook for the AQLA codebase. Both **Antigravity** and **Freebuff** must read this document on Turn 1 of every session and update it before finalizing any work.

---

## 1. Active Architecture & System State

### A. AI Gateway Dual-Track Protocol
All AI operations are routed through a unified dual-track architecture:
- **Track 1: Vercel AI Gateway** (`https://ai-gateway.vercel.sh/v1/chat/completions`)
  - Client: `supabase/functions/_shared/gateway.ts` (`callAiGateway`)
  - Providers: DeepSeek (`deepseek/deepseek-v3.1`, `deepseek/deepseek-r1`), Anthropic (`anthropic/claude-sonnet-4.5`), OpenAI (`openai/gpt-4o`, `openai/gpt-5`, `openai/o3-mini`).
  - Supports function calling (`tools`) and extended reasoning (`reasoning: { effort: "none"|"low"|"medium"|"high" }`).
  - Secret: `VERCEL_AI_GATEWAY_KEY` (or `AI_GATEWAY_KEY`) read from environment variables.
- **Track 2: Google Gemini Native API** (`https://generativelanguage.googleapis.com/v1beta/models`)
  - Client: `supabase/functions/_shared/gemini.ts` (`geminiGenerate`)
  - Used for native `google/*` models and `embeddings.ts` (`text-embedding-004`).
  - Secret: `GEMINI_API_KEY`.
- **Edge Function Dispatch:**
  - `agent-message`: Fully powered by `callAiGateway` with multi-step tool execution.
  - `ai-run`: Bridges automatically — uses `callAiGateway` if `model` contains a provider prefix (e.g. `deepseek/*`), falls back to `geminiGenerate` for native Gemini models.
  - `apiClient.directGeminiInvoke()`: Routes to `ai-run` with default model `deepseek/deepseek-v3.1`.

### B. Current Model Assignments Matrix
| Tier / Surface | Assigned Model | Gateway Status |
|---|---|---|
| **Help Desk & Support** (`help_agent`) | `deepseek/deepseek-v3.1` | Live ($0.25 in / $0.95 out) |
| **Clinician Composer** (`clinician_message_draft`) | `deepseek/deepseek-v3.1` | Live (Ultra-fast generation) |
| **Inbox AI Suite** (4 tools in `inboxAi.js`) | `deepseek/deepseek-v3.1` | Live |
| **Dev Lab: Wordbank Gen** (`wordbank_generation`) | `deepseek/deepseek-v3.1` | Live |
| **Audit & Complaints Feed** (`complaint_query_interpreter`) | `deepseek/deepseek-v3.1` | Live |
| **AQLA Intelligence Coach** (`aqla_intelligence`) | `anthropic/claude-sonnet-4.5` | Live (Clinical caution & empathy) |
| **Clinical Safety Flags** (`clinical_summary`) | `anthropic/claude-sonnet-4.5` | Live |
| **Weekly Digest & Plan Review** (`weekly_summary`, `plan_review`)| `anthropic/claude-sonnet-4.5` | Live |
| **Clinician Member Summary** (`MemberProfilePanel.jsx`) | `openai/gpt-4o` | Live |
| **Backend Ops (Operations)** | `anthropic/claude-sonnet-4.5` (Default) | Runtime selector + reasoning toggle |
| **AQLA Architect** | `anthropic/claude-sonnet-4.5` (Default) | Runtime selector + reasoning toggle |

### C. Agent Tool Calling & Vector RAG Engine
- **Tool Definitions:** Standardized in `supabase/functions/_shared/tools-catalog.ts` (11 tools).
- **Execution Loop:** Multi-step function calling loop in `agent-message/index.ts` supporting up to **5 recursive turns** per prompt.
- **Safety Confirmation Gate:** Mutating tools (`retrigger_email`, `reset_onboarding_step`) require admin role and return `confirmation_required` payload, rendering an in-line approval card in `OpsMessageBubble.jsx`.
- **Vector Storage:** `public.knowledge_documents` in PostgreSQL with `embedding vector(768)` and HNSW cosine similarity index (`20260911_agent_rag_and_tools.sql`).
- **RAG Search RPC:** `match_knowledge_documents` searches cosine similarity with an explicit check `AND (kd.category IN ('platform_faq', 'cognitive_protocols') OR public.is_admin())` ensuring non-admins cannot access architecture blueprints.
- **Admin Management:** Dedicated "Knowledge Base" tab in `OpsConsoleWidget.jsx` via `KnowledgeManagerTab.jsx` with real-time vector search simulator.

### D. Security & Authorization Boundary
- **Row Level Security (RLS) is the actual security boundary** in this codebase. Client-side code in `src/api/apiClient.js` has no inherent security checks.
- When creating any table or RPC function, enforce permissions in SQL via RLS policies and `WHERE` clauses.
- Edge functions enforce user JWT authentication and verify `profiles.role === 'admin'` before performing privileged operations.

---

## 2. Handover Changelog

### [Entry 001] Antigravity — 2026-09-11 18:00 UTC
- **Task:** Implemented Agent Tool Calling, Vector RAG, Knowledge Management, and resolved Peer-Review Drift findings.
- **Files Touched / Created:**
  - `supabase/migrations/20260911_agent_rag_and_tools.sql` — Added `knowledge_documents` table, vector index, and sealed RLS check inside `match_knowledge_documents`.
  - `supabase/functions/ai-run/index.ts` — Bridged `callAiGateway` for multi-provider models (`deepseek/*`, `anthropic/*`) so `directGeminiInvoke` executes successfully.
  - `supabase/functions/agent-message/index.ts` — 5-turn recursive tool execution loop with dual ledger logging (`ai_messages.tool_calls` + `ai_runs`).
  - `supabase/functions/_shared/gateway.ts` — Vercel AI Gateway client with zero hardcoded secrets.
  - `supabase/functions/_shared/tool-executor.ts` — Server-side execution for 11 tools + mutating safety confirmation.
  - `supabase/functions/_shared/tools-catalog.ts` — Standardized tool schemas and agent mappings.
  - `supabase/functions/_shared/embeddings.ts` — Gemini `text-embedding-004` utility.
  - `supabase/functions/knowledge-manage/index.ts` — Admin CRUD & similarity test Edge Function.
  - `src/api/apiClient.js` — Repointed `directGeminiInvoke` to `ai-run` with `deepseek/deepseek-v3.1`; updated `agents.addMessage` and added `knowledge` API.
  - `src/components/admin/OpsConsoleWidget.jsx` & `KnowledgeManagerTab.jsx` — Added Knowledge Base management tab, model selector dropdown, and reasoning toggle.
  - `src/components/admin/OpsMessageBubble.jsx` — Added tool execution chips and in-line action confirmation cards.
  - `src/components/help/HelpAgentChat.jsx` — Added step progress pills and expandable protocol citations.
  - `AGENTS.md` & `AGENT_NOTEBOOK.md` — Established Inter-Agent Handshake Protocol.
- **Verification:** `npm run typecheck` passed (0 errors), `npm run build` passed in 39.60s. Live API test for `deepseek/deepseek-v3.1` returned HTTP 200 OK.
- **Status:** Pushed to `origin/main`.

---

## 3. Pending Tasks & Open Roadmap

- [ ] **Deploy Edge Functions:** Deploy updated edge functions to live Supabase:
  ```bash
  supabase functions deploy agent-message
  supabase functions deploy ai-run
  supabase functions deploy knowledge-manage
  ```
- [ ] **Configure Supabase Secrets:** Ensure production secrets are active:
  ```bash
  supabase secrets set VERCEL_AI_GATEWAY_KEY="vck_..."
  supabase secrets set GEMINI_API_KEY="..."
  ```
- [ ] **Voice Check-In Revamp:** Currently deferred in `VoiceCheckIn.jsx` / worker: `voice_checkin`. Needs architecture alignment with real-time streaming audio.

---

## 4. Browser Validation & Testing Protocol

Both agents are required to validate frontend UI changes directly in the browser and document their testing methodology in their Handover Changelog entries:

### A. Antigravity Validation Method
- **Tool:** Built-in `browser_subagent` (automated Chrome browser session with recording).
- **Execution:** Opens local dev server (`http://localhost:5173`) or production URL (`https://aqla.io`), interacts with target components, inspects DOM and network traffic, captures video artifacts, and verifies responsive layouts across desktop and mobile viewports.
- **Reporting in Notebook:** Document the specific URLs, interactive clicks/flows performed, recording artifact filenames, and any console/render errors observed.

### B. Freebuff Validation Method
- **Tool:** Headless/Antidetect Browser Automation (via Puppeteer / Playwright / Camoufox CLI / nodriver).
- **Execution:** When validating local dev server or external endpoints:
  - Can launch local Vite dev server (`npm run dev`) and connect via headless Chromium/Firefox.
  - For external endpoints with bot protection (Cloudflare/DataDome), Freebuff uses engine-level antidetect tools (`camoufox` or `nodriver` with CDP) to prevent detection.
  - Takes full-page screenshots to inspect layout integrity and captures console logs.
- **Reporting in Notebook:** Document the tool used (e.g., `Playwright/Puppeteer`, `Camoufox`, `nodriver`), exact command/script executed, URLs navigated, actions performed (clicks, inputs), and screenshot output paths.

---

## 5. System Invariants & Watch-outs for Peer Agents

1. **NEVER deploy or revive `gemini-proxy` as-is.** It has no authentication and would leak `GEMINI_API_KEY` via `get-token`. All direct client invocations must go through `ai-run` or `agent-message`.
2. **NEVER hardcode API keys in source files.** Git push protection will immediately block the push. Always use `Deno.env.get("...")`.
3. **NEVER assume `functions.invoke(...)` hits an Edge Function.** Review `src/api/apiClient.js` first — many functions are intercepted as direct table writes or local mock data.
4. **Always run `npm run typecheck` and `npm run build` before committing.**
