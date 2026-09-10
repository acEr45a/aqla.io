# AQLA AI Model Matrix — Complete Interface-to-Model Mapping (Updated)

> All models verified live on the **Vercel AI Gateway** (`https://ai-gateway.vercel.sh/v1`) using your `vck_` API key. Gateway balance: **$4.99**.
> **DeepSeek V3.1** confirmed working (200 OK) on the free tier at **$0.25 / 1M input** and **$0.95 / 1M output** (62% cheaper output than Gemini Flash).

---

## Gateway Configuration

| Setting | Value |
|---|---|
| **Endpoint** | `https://ai-gateway.vercel.sh/v1/chat/completions` |
| **Auth** | `Authorization: Bearer vck_0dXYGd22…` |
| **Protocol** | OpenAI-compatible chat completions |

---

## Interface → Model Assignments

### Member-Facing Surfaces

| # | Interface | Source File | Assigned Model | Reasoning |
|---|---|---|---|---|
| 1 | **AQLA Intelligence Coach** (main chat & cognitive analyst) | `useAqlaCoach.js`, `Coach.jsx` / worker: `aqla_intelligence` | `anthropic/claude-sonnet-4.5` | Nuanced empathy, clinical safety, zero-hallucination |
| 2 | **Daily Voice Check-In** | `VoiceCheckIn.jsx` / worker: `voice_checkin` | ⏸️ **DEFERRED** | Architecture revamp pending |
| 3 | **Weekly Summary Digest** | `weeklySummary.js` / worker: `weekly_summary` | `anthropic/claude-sonnet-4.5` | Editorial tone, longitudinal trend synthesis |
| 4 | **14-Day Plan Review** | `analyzePlanReview.js` / worker: `plan_review` | `anthropic/claude-sonnet-4.5` | Deep clinical discernment, protocol family transitions |
| 7 | **Help Desk & Support Chat** | `HelpAgentChat.jsx` / agent: `help_agent` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | Ultra-low cost ($0.95/1M out), fast sub-second replies |

---

### Clinician-Facing Surfaces

| # | Interface | Source File | Assigned Model | Reasoning |
|---|---|---|---|---|
| 5 | **Clinical Safety Flags & Auto-Flag** | `clinicalFlag.js` / worker: `clinical_summary` | `anthropic/claude-sonnet-4.5` | Conservative risk tiers, objective clinical briefs |
| 6 | **Clinician Message Composer** | `AiComposer.jsx` / worker: `clinician_message_draft` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | Fast draft generation inside composer, lowest token cost |
| 15 | **Clinician AI Member Summary** | `MemberProfilePanel.jsx` | `openai/gpt-4o` | Consistent structured clinical summaries, rigid formatting |
| 16 | **Clinical Follow-up Draft** | worker: `clinical_followup_draft` | `openai/gpt-4o` | Strict summarization-only rules, no speculative claims |

---

### Inbox AI Suite (4 functions in `inboxAi.js`)

| # | Interface | Function | Assigned Model | Reasoning |
|---|---|---|---|---|
| 8a | **Thread Summarization** | `generateThreadSummary()` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | Ultra-cheap email thread summarization |
| 8b | **Smart Reply Generation** | `generateSmartReplies()` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | Instant 1-click reply chip generation |
| 8c | **Composer Assist (Tone/Format)** | `refineComposerContent()` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | Real-time draft refinement |
| 8d | **Action Item Extraction** | `extractActionItems()` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | High-speed structured task extraction |

---

### Admin Lab Surfaces

| # | Interface | Source File | Assigned Model | Reasoning |
|---|---|---|---|---|
| 9 | **Dev Lab: Idea Refinement** | `DevelopmentPanel.jsx` / worker: `idea_refinement` | `google/gemini-2.5-pro` | Deep technical/neurochemical feasibility analysis |
| 10 | **Dev Lab: Wordbank Gen** | `DevelopmentPanel.jsx` / worker: `wordbank_generation` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | High-speed lexical arrays, ultra-low cost |
| 11 | **PDF Studio: Design Themes** | `PdfStudioPanel.jsx` / worker: `pdf_theme_assistant` | `anthropic/claude-sonnet-4.5` | Superior visual taste, typography pairings, palettes |
| 12 | **Admin Audit & Complaints** | `SuperAdminAuditFeed.jsx` / workers: `complaint_query_interpreter`, `complaint_result_summary` | `deepseek/deepseek-v3.1` *(Replaced Flash)* | Fast search query translation & incident clustering |

---

## 🔧 Backend Ops & AQLA Architect — Advanced Configuration

Backend Ops and AQLA Architect retain their **full runtime model selector** (including Gemini Flash, DeepSeek, Claude, and OpenAI) and **4-level reasoning toggle**:

### Interface 13: AQLA Architect

| Setting | Value |
|---|---|
| **Default model** | `anthropic/claude-sonnet-4.5` |
| **Default reasoning** | `high` |
| **Purpose** | Architecture design, feature planning, dev checklists, migration analysis, code structuring, codebase audits |

### Interface 14: Backend Ops

| Setting | Value |
|---|---|
| **Default model** | `anthropic/claude-sonnet-4.5` |
| **Default reasoning** | `high` |
| **Purpose** | System diagnostics, database analysis, service metrics, delivery status, operational actions |

### Runtime Model Selector Options (Available in Dropdown)

#### Tier 1 — Flagship
- `anthropic/claude-sonnet-4.5` *(Recommended)*
- `google/gemini-2.5-pro`
- `openai/gpt-4o`
- `openai/gpt-5`
- `deepseek/deepseek-r1` *(Confirmed live)*
- `deepseek/deepseek-v3.1` *(Confirmed live)*

#### Tier 2 — Fast & Efficient
- `deepseek/deepseek-v3.1` *(Cheapest, $0.95/1M out)*
- `google/gemini-2.5-flash` *(Kept in switcher)*
- `google/gemini-2.5-flash-lite` *(Kept in switcher)*
- `google/gemini-3.6-flash` *(Kept in switcher)*
- `google/gemini-3.8-flash` *(Kept in switcher)*
- `openai/gpt-4o-mini`

#### Tier 3 — Reasoning Specialists
- `deepseek/deepseek-r1` *(Explicit chain-of-thought, $5.40/1M out)*
- `openai/o3`
- `openai/o3-mini`
- `openai/o4-mini`
- `openai/gpt-5.1-thinking`

#### Tier 4 — Multi-Agent / Codex Swarm
- `spacexai/grok-4.20-multi-agent`
- `openai/gpt-5-codex`
- `openai/gpt-5.1-codex`
