# AGENTS.md

## Mandatory Inter-Agent Handshake Protocol (Antigravity & Freebuff)

Both **Antigravity** and **Freebuff** operate on this repository as equal peer agents. To prevent "Agent Drift", duplicate work, broken architectural assumptions, and conflicting logic, every agent MUST follow this protocol on every interaction:

1. **Step 0 — Mandatory Turn-1 Read:**
   - Before proposing, planning, or writing any code, **read [`AGENT_NOTEBOOK.md`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/AGENT_NOTEBOOK.md) in the repository root**.
   - Review the `Active Architecture & System State` section and the latest handover entry to understand what the other agent recently built, what models are assigned, and what constraints are active.
2. **Step 1 — Drift Reconciliation:**
   - If you detect that the codebase has drifted or contains broken assumptions from a peer agent:
     - Technical bugs / security leaks (e.g., broken API routing, missing RLS filters): **Resolve them immediately** and log a `[DRIFT RESOLVED]` entry in `AGENT_NOTEBOOK.md`.
     - Ambiguous architectural or product divergence: **Pause and ask the user** before making irreversible changes.
3. **Step 2 — Mandatory Handover on Final Turn:**
   - Before declaring any task complete or committing:
     - Update the top header of `AGENT_NOTEBOOK.md`: `> **Last Updated By:** [Antigravity | Freebuff] on [ISO Timestamp] | **Task:** [Summary]`
     - Prepend a new handover entry in `Section 2: Handover Changelog` documenting the files touched, rationale, and open tasks for the peer agent.

## Global Subagent Execution Policy

**Core Execution Rule**
- **Mandatory Delegation:** Do NOT perform multi-file edits, complex refactorings, or multi-step linear tasks sequentially in the main session thread.
- **Subagent Spawning:** For any task touching >1 file or requiring >2 execution steps:
  1. **Planner Subagent:** Spawn a planning subagent to generate the task list and file diff map.
  2. **Worker Subagents:** Dispatch parallel/isolated subagents for each file edit, database check, or API gateway change.
  3. **Reviewer Subagent:** Dispatch a reviewer subagent (`code-reviewer`) to validate diffs against project rules before finalizing.
- **Context Isolation:** Keep the main session context clean by delegating granular logs, package installs, and file scanning to background subagents.

### When this applies

- **Trigger:** any task that *edits code or code-adjacent files* (source, config, DB migrations, edge functions, `extension/`) and touches **more than one file** or needs **more than two execution steps** → delegate. Read-only work (reading, search, answering questions) never triggers this rule; multi-file documentation updates are exempt.
- **Trivial edits** (single-file fixes, copy tweaks, config adjustments, log lines) run in the main thread — state the exemption in one line before proceeding (e.g. "single-file fix, executing directly").

### Pipeline

1. **Planner** — produces an ordered task list, a per-task file-diff map, and a brief per task: exact file paths, constraints drawn from this file (RLS boundary, deployed-vs-source, key-files warnings), and acceptance criteria. Never hand a worker raw session history. Written brief files for multi-file tasks; concise inline prompts are acceptable for small single-file dispatches.
2. **Workers** — one per task/file-group, **parallel by default** when file sets are disjoint; sequential when a later edit depends on an earlier one. Concurrency cap: ~2 for small jobs, up to 5 for large refactors. Workers never commit. Each worker runs `npm run typecheck` (plus build/tests where relevant) for its own change and reports results.
3. **Reviewer** — one reviewer subagent (`code-reviewer`) validates the combined diff before anything is finalized. Mandatory checklist:
   - Compliance with this file: RLS is the security boundary; the deployed-vs-source edge function table; the key-files warnings.
   - Independently re-runs `npm run typecheck` and `npm run build` on the combined diff and reports pass/fail output.
   - Scope vs brief: nothing missing, nothing extra.
   - Cross-file impact: regressions in untouched code paths (renamed exports, changed signatures used elsewhere).
4. **Fix loop, cap 3** — reviewer findings return to the original worker for fixes; each round ends with a re-review of the fix diff. After three failed rounds, stop and ask the user. Never finalize an unapproved diff.
5. **Commit** — only the main session commits, only after reviewer approval.

```
task → touches >1 file or >2 steps?
  ├─ no  → exempt (trivial/docs/read-only): state one-line justification, do it directly
  └─ yes → PLANNER ──► task list + file diff map + per-task briefs
              │
              ▼
           WORKERS (parallel, disjoint files, cap ~2 small / 5 large)
              │         each worker verifies its own change
              ▼
           REVIEWER (re-runs typecheck + build; 4-point checklist)
              │
        approved? ── no ──► fix loop (≤3, back to original worker) ──┐
              │                                                      │ (cap hit)
             yes                                                     ▼
              │                                             STOP — ask the user
              ▼
        MAIN SESSION commits
```

### Stop and ask the user (mandatory pauses)

Delegate nothing past these without explicit user approval:
- **Security actions:** `.env` or secrets, service-role keys, RLS policies/migrations, auth flows, edge function deploys.
- **Destructive ops:** deleting or moving whole modules, schema-breaking migrations, mass renames.
- **Outside the working tree:** deploys, pushes, shared-branch operations.
- **Loop failures:** reviewer cap exhausted, or a plan conflict the pipeline cannot resolve.

### Tool mapping

The roles (Planner / Worker / Reviewer) are tool-agnostic — map them to whatever the running harness provides: Claude Code `Task` subagents (named `code-reviewer` where configured), Codebuff subagent spawning, or another tool's native mechanism. These are examples; use what exists.

**No-subagent fallback:** if the harness cannot spawn subagents, execute sequentially in-session but (a) state explicitly at the start that you are running in degraded mode, and (b) still perform the reviewer's full checklist and run `npm run typecheck` + `npm run build` before declaring the work done.

### Artifacts & the SDD skill

- Work expected to span multiple sessions or more than three tasks: the Planner writes the task list + diff map and workers write report files under `.superpowers/plans/<task-slug>/` (git-ignored; never committed). Smaller jobs keep plans and reports in-message.
- For multi-task implementation plans, prefer the existing `subagent-driven-development` skill (`.agents/skills/subagent-driven-development/SKILL.md`) as the default execution method — its implementer/reviewer loop satisfies this policy's Worker/Reviewer requirements. This policy governs when that skill isn't in use.

## Project Context

This is the aqla.io web application repository - a neural wellness / cognitive performance platform. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions. The project was migrated from Base44 (a no-code app builder) to a self-owned stack; several structural quirks below trace directly back to that migration.

## Stack

- Frontend: Vite + React 18 SPA, hosted on Vercel (Hobby plan), auto-deploys from `main`
- Backend: Supabase (Postgres 17, Auth, Realtime, Edge Functions, Storage)
- Email: Resend, `aqla.io` verified domain
- AI: Google Gemini, direct API - see "AI systems" below, this is not straightforward
- Companion app: Chrome extension in `extension/`, separate codebase, shares the same Supabase project

## Key Files

- `src/api/apiClient.js` - the central API layer. Most of the app's "backend calls" are actually direct Supabase table operations through `entities.*` here, not edge function calls. Read this file before assuming any `functions.invoke(...)` name actually hits an edge function - many are intercepted and resolved as direct table writes/reads inside this file, or return **hardcoded fake data** (`getCommunityInsights`, `runAppDiagnostics`, `resolveAppIssue`, `getBackendOpsSummary`).
- `src/lib/supabase.js` - Supabase client, session stored in `localStorage`.
- `supabase/functions/_shared/gemini.ts` - the real, hardened Gemini adapter (multi-model fallback, used by `ai-run`/`agent-message`/`aqla-ops`).
- `supabase/functions/_shared/worker-registry.ts` - catalog of AI "workers" (prompts, schemas, role gating) used by `ai-run`.

## Critical: What's Actually Deployed vs. What Exists as Source

Several edge functions exist in `supabase/functions/` but are not deployed - confirmed live, not assumed. Do not assume a function folder existing means it's reachable in production:

| Function | Deployed? |
|---|---|
| `send-email`, `sendAdminOtp`, `verifyAdminAccess`, `ai-run`, `agent-message` | Yes, live |
| `gemini-proxy`, `aqla-ops`, `resend-inbound` | No - source only |

## Critical: Two Disconnected AI Systems

- `ai-run` + `worker-registry.ts` - well-designed, authenticated, role-gated, deployed - but nothing in the live frontend calls it.
- `directGeminiInvoke()` (in `apiClient.js`, backs `InvokeLLM`/`GenerateSpeech`) - this is what the live app actually uses (voice check-in interview, main AQLA Assistant chat) - and it calls the undeployed `gemini-proxy`, so these features are currently broken in production, failing silently.

The correct fix is repointing `directGeminiInvoke()` to `ai-run` with the right `worker_id` - not deploying `gemini-proxy` as-is, which has no authentication at all and would leak the raw `GEMINI_API_KEY` to any caller via its `get-token` action if it ever went live.

## Security Model - Read Before Touching Auth/Data Access

Authorization in this codebase lives almost entirely in Postgres RLS policies, not in client-side code. Most `apiClient.js` functions have no permission checks of their own - they rely completely on RLS to block unauthorized access, a direct legacy of the Base44 migration. When adding a new table or a new client-side data call, the RLS policy is the actual security boundary - do not assume the calling code enforces anything.

Known gaps, current as of this writing:
- `verifyCaptcha` always returns success - no real captcha verification exists, regardless of provider.
- The cognitive-tests page has a QA auto-complete reachable via `?qa=1` with no role check - fabricates passing results into a user's own `BrainDomain` scores.
- `sendClinicianAlert` doesn't set `user_id` on its `clinical_flags` insert - likely fails RLS for non-clinician callers.

## Working Notes

- `npm run dev` - local Vite dev server
- `npm run build` / `npm run typecheck` - verify changes before completing tasks
- Edge function deploys can be done directly via Supabase tooling independent of git - if a function is deployed that way, the repo's copy will drift from what's live until reconciled. Check which is authoritative before assuming the repo reflects production.
