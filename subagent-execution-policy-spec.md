# Spec: AGENTS.md Global Subagent Execution Policy

**Request short name:** subagent-execution-policy
**Date:** 2026-09-11
**Status:** Spec complete — no code changes made yet
**Target file:** `AGENTS.md` (repo root). `CLAUDE.md` already defers to AGENTS.md and must not change.

---

## 1. Goal

Add a **"Global Subagent Execution Policy"** section to `AGENTS.md` that makes subagent delegation the mandatory execution model for material code work, while remaining readable and actionable by *any* AI coding agent (Codebuff/Buffy, Claude Code, Codex, Cursor, etc.) that loads AGENTS.md.

The user supplied draft wording (preserved verbatim as the section's core-rule summary). The interview refined it into a fully specified pipeline.

## 2. Context gathered (relevant repo facts)

- `AGENTS.md` today: H1 `# AGENTS.md`, then sections: Project Context / Stack / Key Files / Critical: What's Actually Deployed vs. What Exists as Source / Critical: Two Disconnected AI Systems / Security Model / Working Notes. **No subagent/delegation section exists.**
- `CLAUDE.md` contains only "See AGENTS.md" — single source of truth is AGENTS.md.
- The repo ships `.agents/skills/subagent-driven-development/SKILL.md` (SDD): fresh implementer subagent per task → task reviewer → final whole-branch review, with brief/report/review-package file artifacts under `.superpowers/sdd/<plan>/` (git-ignored via `.superpowers/` in `.gitignore`).
- `.superpowers/` is git-ignored — safe home for pipeline plan/report artifacts.
- Existing AGENTS.md norms to respect: RLS is the security boundary; deployed-vs-source edge function table; verify with `npm run build` / `npm run typecheck`; edge deploys happen outside git.
- The user's draft names a `code-reviewer` reviewer subagent — the SDD skill's reviewer prompts (task-reviewer-prompt.md, ../requesting-code-review/code-reviewer.md) are the natural prompt sources.

## 3. Interview decisions (authoritative)

| # | Question | Decision |
|---|---|---|
| 1 | Which agents does the policy target | **All agents** — universal policy, tool-agnostic wording |
| 2 | Relation to the existing SDD skill | **Policy = gateway.** The AGENTS.md section is the always-on rule; it points to the SDD skill as the default execution method for multi-task plans. SDD's fresh-implementer-per-task + reviewer loop **satisfies** this policy's worker/reviewer requirements |
| 3 | Delegation trigger strictness | **Material work.** Delegate multi-file / multi-step work; exempt trivia, with a stated one-line justification when exempting |
| 4 | Placement | **New section inserted near the top** of existing AGENTS.md — immediately after the `# AGENTS.md` H1, before `## Project Context`. All existing sections stay intact and shift down |
| 5 | Worker parallelism | **Parallel by default** for independent work; sequential when later edits depend on earlier ones |
| 6 | Reviewer finds problems | **Fix loop, cap 3:** findings go back to the *original* worker for fixes; max 3 rounds; cap exhausted → escalate to the user, never silently accept |
| 7 | Harness with no subagent capability | **Degrade + disclose:** proceed sequentially in-session, but must explicitly state it is operating in degraded mode AND follow the same review checklist itself before declaring done |
| 8 | Git rules | **Main commits only:** workers must not commit; the main session commits only after reviewer approval |
| 9 | Exemptions from mandatory delegation | **Trivial edits only** (single-file fixes, copy edits, config tweaks, log lines). Read-only/research work doesn't trigger the rule (it isn't an edit). Verification commands are handled by the double-gate rule, not exemption. Security zones are handled by escalation (§3.11), not exemption |
| 10 | Worker instructions | **Hybrid by size:** written brief files for multi-file tasks (task, exact files, constraints, acceptance criteria — never raw session history); concise inline prompts allowed for small single-file dispatches |
| 11 | Mandatory stop-and-ask triggers | **All four:** (a) security actions — .env, service-role keys, RLS policies, auth flows, edge function deploys; (b) loop failures — reviewer cap exhausted or unresolvable plan conflict; (c) destructive ops — module deletion/moves, schema-breaking migrations, mass renames; (d) outside worktree — deploys, pushes, anything beyond the working tree |
| 12 | Verification responsibility | **Double gate:** each worker runs typecheck/build/tests for its own change and reports results; the reviewer independently re-runs `npm run typecheck` + `npm run build` on the combined diff and must report pass/fail output before approval |
| 13 | Subagent naming | **Tool-native + generic:** generic role names (Planner / Worker / Reviewer) as the primary vocabulary, with concrete tool handles where they exist (e.g. Claude Code `Task` subagents, named `code-reviewer` agent; Codebuff subagent spawning) plus the generic degrade-mode fallback |
| 14 | Concurrency cap | **Dynamic:** ~2 concurrent workers for small jobs, up to 5 for large refactors |
| 15 | Artifacts | **Files for big work only:** plan + worker report files when work spans multiple sessions or >3 tasks (home: git-ignored `.superpowers/plans/<slug>/`); otherwise in-message. The SDD skill's own artifact convention applies when it drives |
| 16 | Reviewer checklist | **All four:** (a) AGENTS.md rule compliance (RLS boundary, deployed-vs-source, key-files warnings); (b) re-run typecheck + build, report output; (c) scope vs brief — nothing missing, nothing extra; (d) cross-file impact — regressions in untouched code paths (renamed exports, changed signatures used elsewhere) |
| 17 | Draft wording treatment | **Summary + detail:** the user's 3-bullet draft appears **verbatim** as a "Core Rule" summary at the top of the section; the full pipeline is spelled out beneath it |
| 18 | Docs in scope? | **Code only.** The trigger covers code and code-adjacent files (source, config, migrations, edge functions, extension). Multi-file documentation updates stay in the main thread |
| 19 | Decision aid | **ASCII flowchart** included in the section |

## 4. Required content of the new section

Insert after `# AGENTS.md` (position 2, before Project Context). Structure:

### 4.1 `## Global Subagent Execution Policy` — Core Rule (verbatim box)
The user's draft, preserved word-for-word:

> **Core Execution Rule**
> - **Mandatory Delegation:** Do NOT perform multi-file edits, complex refactorings, or multi-step linear tasks sequentially in the main session thread.
> - **Subagent Spawning:** For any task touching >1 file or requiring >2 execution steps:
>   1. **Planner Subagent:** Spawn a planning subagent to generate the task list and file diff map.
>   2. **Worker Subagents:** Dispatch parallel/isolated subagents for each file edit, database check, or API gateway change.
>   3. **Reviewer Subagent:** Dispatch a reviewer subagent (`code-reviewer`) to validate diffs against project rules before finalizing.
> - **Context Isolation:** Keep the main session context clean by delegating granular logs, package installs, and file scanning to background subagents.

### 4.2 When this applies (material-work threshold)
- Trigger: a task that **edits code or code-adjacent files** (source, config, DB migrations, edge functions, extension code) and touches **more than one file** or needs **more than two execution steps** → mandatory delegation.
- Pure read/research/answer work never triggers the rule (no edits involved).
- Multi-file documentation updates are **out of scope** — main thread may do them directly.
- Trivial single-file edits (typo fixes, copy tweaks, config adjustments, log lines) are exempt — but the agent must state the exemption in one line (e.g. "single-file fix, executing directly").

### 4.3 The pipeline (expands the Core Rule)
1. **Planner** — one planning subagent produces: ordered task list, per-task file diff map, dependency notes, and a brief per task (brief files for multi-file tasks; inline prompts acceptable for small single-file dispatches). Briefs carry exact file paths, constraints (pull binding constraints from AGENTS.md sections), and acceptance criteria — never raw session history.
2. **Workers** — dispatched per task/file-group, **parallel by default** when file sets are disjoint; sequential when a later edit depends on an earlier one. Concurrency cap: **~2 for small jobs, up to 5 for large refactors.** Workers never commit. Each worker runs `npm run typecheck` (+ build/tests where relevant) for its own change and reports results.
3. **Reviewer** — one reviewer subagent (`code-reviewer`; reuse the SDD skill's reviewer prompt templates where present) validates the combined diff **before** anything is finalized. Checklist (all mandatory):
   - AGENTS.md rule compliance (RLS is the security boundary; deployed-vs-source edge function reality; key-files warnings)
   - Independently re-runs `npm run typecheck` and `npm run build` on the combined diff, reports pass/fail output
   - Scope vs brief: nothing missing, nothing extra
   - Cross-file impact: regressions in untouched code paths (renamed exports, changed signatures used elsewhere)
4. **Fix loop, cap 3** — reviewer findings return to the original worker (context intact) for fixes; each round ends with a re-review of the fix diff. After 3 failed rounds → stop and ask the user. Never silently accept an unapproved diff.
5. **Commit** — only the main session commits, only after reviewer approval.

### 4.4 ASCII flowchart
Compact text flowchart showing: task → material-work trigger? → (no: exempt, state justification) / (yes: Planner → task list + diff map → Workers [parallel ≤ cap] → each worker verifies → Reviewer [re-runs typecheck+build, 4-point checklist] → approved? → (no: fix loop ≤3 → escalate) / (yes: main session commits)).

### 4.5 Escalation — stop and ask the user (mandatory pauses)
- **Security actions:** .env or secrets, service-role keys, RLS policies/migrations, auth flows, edge function deploys — confirm before dispatching workers.
- **Destructive ops:** deleting/moving whole modules, schema-breaking migrations, mass renames.
- **Outside the working tree:** deploys, pushes, shared-branch operations.
- **Loop failures:** reviewer cap exhausted, or a plan conflict the pipeline can't resolve.

### 4.6 Tool mapping (tool-native + generic)
- Primary vocabulary: Planner / Worker / Reviewer roles.
- Examples: Claude Code → `Task` tool subagents (named `code-reviewer` where configured); Codebuff/Buffy → native subagent spawning; other tools → map to their native mechanism.
- **No-subagent fallback (degrade + disclose):** if the running harness cannot spawn subagents, execute sequentially in-session but (a) explicitly state degraded mode at the start, and (b) still perform the reviewer's 4-point checklist + typecheck/build verification before declaring the work done.

### 4.7 Artifacts
- Work expected to span multiple sessions or >3 tasks: Planner writes the task list + diff map and workers write report files under `.superpowers/plans/<task-slug>/` (git-ignored; never committed). Otherwise plans/reports stay in-message.
- When the repo's `subagent-driven-development` skill drives execution, its own artifact convention (`.superpowers/sdd/<plan>/`) applies.

### 4.8 Pointer to the SDD skill
One short paragraph: for multi-task implementation plans, prefer the existing `subagent-driven-development` skill (`.agents/skills/subagent-driven-development/SKILL.md`) as the default execution method — its implementer/reviewer loop satisfies this policy's Worker/Reviewer requirements. This policy governs when that skill isn't in use.

## 5. Constraints & non-goals

- **No other AGENTS.md content changes.** The section is purely additive; existing sections keep their wording and order (they shift down as a block).
- **No code changes anywhere else** — this spec covers the AGENTS.md edit only.
- `CLAUDE.md` untouched.
- Section must stay compact enough to be read by every agent every session — target ≲90 lines of markdown.
- No invented tool-specific claims: tool mappings are examples, phrased as "where available".
- Keep the repo's factual conventions intact (e.g. don't contradict the RLS or deployed-vs-source sections; the policy references them, doesn't restate them).
- Self-consistency note for the implementer: this edit itself is a single-file docs change → exempt from the policy it adds.

## 6. Acceptance criteria

1. `AGENTS.md` contains the new section at position 2 (after H1, before Project Context).
2. The user's 3-bullet draft appears verbatim as the Core Rule summary.
3. All 19 interview decisions above are reflected in the section text.
4. Flowchart present and renders correctly as a fenced code block.
5. Existing sections unchanged; total file remains coherent (no duplicate headings).
6. `git diff` shows exactly one modified file: `AGENTS.md`.

## 7. Open items resolved by ruling (recorded for transparency)

- "Exemptions" round: user selected only *Trivial edits*, so read-only work and verification commands are **not** listed as exemptions; instead the trigger is defined over edits (read-only never triggers) and verification is handled by the double gate. Ruling cost: if the user intended verification commands to be delegable to background subagents (per the verbatim Context Isolation bullet), the detail text must keep that bullet's promise — the section says granular logs/installs/scanning *may* be delegated to background subagents, while mandatory delegation stays tied to the material-work trigger.
- Artifact home `.superpowers/plans/<slug>/` chosen because `.superpowers/` is already git-ignored — no .gitignore change needed.
