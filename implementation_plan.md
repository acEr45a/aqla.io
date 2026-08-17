# AQLA Migration: Complete Base44 Exit → Supabase + Gemini

## Current State Assessment

### ✅ Already Completed
| Area | Status | Evidence |
|------|--------|----------|
| Supabase project created | ✅ Done | `xuwifebsymvangjbynkg.supabase.co` |
| Base schema (20 tables) | ✅ Done | All 28 tables exist with RLS enabled |
| `handle_new_user` trigger | ✅ Done | `auth.users` INSERT → `public.profiles` |
| RBAC helper functions | ✅ Done | `is_admin()`, `is_clinician_or_admin()`, `get_current_user_role()` |
| RLS policies | ✅ Done | All tables have policies per `supabase_complete_schema.sql` |
| Supabase JS client | ✅ Done | [`supabase.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/lib/supabase.js) |
| Entity data-access layer | ✅ Done | [`apiClient.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/api/apiClient.js) — full CRUD proxy over Supabase |
| Auth methods (email, Google OAuth, reset) | ✅ Done | `apiClient.js` auth module uses `supabase.auth.*` |
| User data migrated | ✅ Done | 10 profiles, 10 auth users, 19 check-ins, etc. |
| `.env` with Supabase + Gemini keys | ✅ Done | Has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` |
| `.gitignore` covers `.env` | ✅ Done | Line 2 and 30 |

### ❌ Remaining Base44 Dependencies — Inventory

| Category | Count | Files |
|----------|-------|-------|
| `base44` import alias | ~50 | Nearly every component imports `{ base44 }` from `base44Client.js` |
| `base44.integrations.Core.InvokeLLM` | 7 | Coach, useAqlaCoach, VoiceCheckIn, weeklySummary, analyzePlanReview, clinicalFlag, MemberProfilePanel |
| `base44.integrations.Core.GenerateSpeech` | 2 | VoiceCheckIn, useVoiceChat |
| `base44.agents.*` (conversations API) | 14 | OpsConsoleWidget (Backend Ops/Architect), HelpAgentChat, OpsAgentActivity |
| `base44.functions.invoke(...)` | ~35 | Admin panels, clinician panels, superadmin, captcha, help |
| `base44.appLogs` | 1 | AppLayout |
| `base44.auth.redirectToLogin` | 1 | AuthContext (non-existent method on apiClient) |
| `createAxiosClient` (undefined) | 1 | AuthContext (dead code from legacy Base44 SDK) |
| `media.base44.com` image URLs | 2 | BrainProfileMap, brainRegions |
| `appParams.appId` | 2 | OAuthConsent (Base44 MCP consent page) |
| Edge Functions | 0 | No Edge Functions deployed yet |
| Storage Buckets | 0 | Not set up yet |

---

## User Review Required

> [!IMPORTANT]
> **Google OAuth Configuration**: The frontend code for Google OAuth (`signInWithOAuth`) is already in place. Please confirm:
> 1. Is Google OAuth already enabled in the Supabase Dashboard → Auth → Providers → Google with the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `.env`?
> 2. What are the authorized redirect URIs configured in Google Cloud Console? (We need `https://xuwifebsymvangjbynkg.supabase.co/auth/v1/callback` at minimum, plus any production domain)

> [!IMPORTANT]
> **Production Domain & Hosting**: What is the target hosting for the frontend?
> - Vercel (recommended — zero-config for Vite/React)?
> - Another host?
> - Is `aqla.io` already pointed somewhere currently?

> [!WARNING]
> **Base44 GitHub Sync**: The `.gitignore` includes `base44/.app.jsonc`, suggesting Base44 GitHub sync was/is configured. Is Base44 still syncing to this repo? We need to disable that before merging the migration branch.

> [!IMPORTANT]
> **Data Completeness**: The Supabase DB has data (10 profiles, 19 check-ins, 56 brain domains, etc.) but many tables are empty (ingredients: 0, protocols: 0, game sessions: 0). Is this expected, or is there additional data on Base44 that needs to be migrated?

## Open Questions

1. **Email Provider**: The directive mentions replacing Base44 email with an approved transactional email provider. Which provider should we use? (Resend, SendGrid, Postmark, or skip email for now?)
2. **TTS Provider**: `GenerateSpeech` is used in VoiceCheckIn and useVoiceChat. Should we use browser-native `SpeechSynthesis` API as the replacement, or a specific TTS provider?
3. **Edge Function Secrets**: The `GEMINI_API_KEY` should be set as an Edge Function secret. Shall I deploy it via the Supabase CLI/MCP tools?
4. **OAuthConsent Page**: This page references Base44's MCP consent flow (`/api/apps/${appParams.appId}/mcp/...`). Is this page currently in use? If not, we can remove it. If yes, it needs a full rewrite for Supabase.

---

## Proposed Changes

The migration is divided into **6 execution phases**, ordered by dependency. Each phase is self-contained and testable.

---

### Phase 1: Git Safety & Migration Branch

#### [MODIFY] Branch creation
- Stash or commit current uncommitted changes (`package-lock.json`, `supabase_complete_schema.sql`)
- Create branch `migration/base44-to-supabase` from `main`
- All subsequent work happens on this branch

---

### Phase 2: Fix AuthContext — Remove Dead Base44 Code

The `AuthContext.jsx` has critical dead code: `createAxiosClient` (never imported), `appParams.appId` (removed in apiClient), and `base44.auth.redirectToLogin` (doesn't exist on the Supabase-backed apiClient).

#### [MODIFY] [`AuthContext.jsx`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/lib/AuthContext.jsx)
- Remove `createAxiosClient` usage (lines 27-78) — replace with direct Supabase session check
- Replace `base44.auth.me()` with `apiClient.auth.me()`
- Replace `base44.auth.redirectToLogin(...)` with `navigate('/login')`
- Use `supabase.auth.onAuthStateChange()` for reactive session management
- Remove `appParams` import and all references to `appParams.token` and `appParams.appId`

#### [MODIFY] [`app-params.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/lib/app-params.js)
- Simplify to remove Base44-specific params (`access_token`, `from_url`, `app_base_url`, `app_id`, `functions_version`). Supabase manages sessions via its own localStorage keys.

---

### Phase 3: AQLA AI Gateway — Replace `Core.InvokeLLM` with Gemini

This is the most architecturally significant change. We create an AQLA-owned AI Gateway as a Supabase Edge Function that proxies requests to Gemini.

#### [NEW] `supabase/functions/ai-run/index.ts`
Edge Function that:
- Validates JWT, resolves user from `profiles`
- Accepts `{ worker_id, prompt, response_json_schema, input_data }`
- Looks up worker config from an in-code registry (not a DB table initially)
- Calls Gemini API (`gemini-3.7-flash` or `gemini-3.5-flash-lite` per worker config)
- Returns structured JSON response
- Logs run metadata to `ai_runs` table
- Applies rate limits and timeouts

#### [NEW] `supabase/functions/_shared/gemini.ts`
Shared Gemini adapter:
- Uses `GEMINI_API_KEY` from Edge Function secrets
- Supports `generateContent` with JSON schema response
- Model selection per worker config
- Error normalization

#### [NEW] `supabase/functions/_shared/worker-registry.ts`
Worker definitions matching Section 11:
- `aqla_intelligence` → `gemini-3.7-flash`, medium thinking
- `voice_checkin` → `gemini-3.7-flash`, low thinking
- `weekly_summary` → `gemini-3.7-flash`, medium thinking
- `plan_review` → `gemini-3.7-flash`, high thinking
- `clinical_summary` → `gemini-3.7-flash`, high thinking
- `clinician_message_draft` → `gemini-3.7-flash`, medium thinking
- `clinical_followup_draft` → `gemini-3.7-flash`, medium thinking

#### [NEW] Database migration: `ai_runs` table
```sql
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  worker_id text NOT NULL,
  model text NOT NULL,
  prompt_version text DEFAULT 'v1-imported-base44',
  input_tokens int,
  output_tokens int,
  latency_ms int,
  status text DEFAULT 'success',
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

#### [MODIFY] [`apiClient.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/api/apiClient.js)
- Add `integrations` namespace with `Core.InvokeLLM` compatibility shim that calls the `ai-run` Edge Function
- This allows all existing `base44.integrations.Core.InvokeLLM({...})` calls to work immediately through the new gateway without touching every call site

#### [MODIFY] All 7 `InvokeLLM` call sites
- No immediate changes needed if the shim works — but we'll add `worker_id` parameter for proper routing in Phase 3b

---

### Phase 4: Agent Runtime — Replace `base44.agents.*`

Replace the Base44 persistent agent API with Supabase tables + an Edge Function.

#### [NEW] Database migration: Agent tables
```sql
-- AI Conversations
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Messages
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text,
  tool_calls jsonb,
  created_at timestamptz DEFAULT now()
);
```

#### [NEW] `supabase/functions/agent-message/index.ts`
Edge Function that:
- Receives `{ conversation_id, message: { role, content } }`
- Inserts user message into `ai_messages`
- Loads conversation history
- Calls Gemini via the shared adapter with agent-specific system prompt
- Inserts assistant response
- Returns the response (Supabase Realtime delivers it to subscribers)

#### [MODIFY] [`apiClient.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/api/apiClient.js)
Add `agents` namespace:
```js
agents: {
  listConversations({ agent_name }),
  createConversation({ agent_name, metadata }),
  getConversation(id),
  getConversations({ agent_name }),  // alias
  deleteConversation(id),
  addMessage(conv, { role, content }),
  subscribeToConversation(id, callback),  // uses Supabase Realtime
}
```

This preserves the exact call signatures used in OpsConsoleWidget and HelpAgentChat.

---

### Phase 5: Backend Functions → Edge Functions

Port all `base44.functions.invoke(name, payload)` calls to Supabase Edge Functions. The existing `apiClient.functions.invoke()` already calls `supabase.functions.invoke()` — so these will work once the Edge Functions exist.

#### [NEW] Edge Functions (grouped by priority):

**Critical path (used in core flows):**
- `get-app-settings` — returns app_settings row
- `verify-captcha` — validates reCAPTCHA tokens server-side
- `get-member-data` — aggregates member data for clinician view
- `super-admin-ops` — admin operations (check, listAdmins, promote, demote, getCaptcha, saveCaptcha, logs)
- `get-admin-dashboard-metrics` — dashboard stats
- `notify-clinicians-of-flag` — broadcast flag notification
- `submit-issue` — creates user complaint

**Clinician flows:**
- `draft-clinician-message` — AI-draft via Gemini
- `push-member-recommendation` — inserts recommendation
- `change-member-plan` — protocol management
- `revert-plan-change` — undo plan review
- `send-clinician-alert` — creates clinical flag from clinician

**Admin flows:**
- `manage-user-roles` — role changes
- `send-admin-otp` / `verify-admin-access` — admin 2FA
- `update-app-settings` — toggle test mode
- `cleanup-protocols` — scan/delete orphaned protocols
- `invalidate-check-in` — mark check-in invalid
- `delete-user-and-data` — cascade user deletion
- `run-app-diagnostics` / `resolve-app-issue` — health checks
- `get-backend-ops-summary` — ops overview
- `backend-ops-ai` — AI tasks (refineIdea, wordbank, pdfTheme)
- `send-manual-email` — email dispatch
- `notify-clinician` — direct notification
- `search-user-complaints` — complaint search
- `get-community-insights` — anonymized stats

> [!NOTE]
> Edge Function naming uses kebab-case. The `apiClient.functions.invoke()` will need a name mapper (camelCase → kebab-case) or we keep the original names.

---

### Phase 6: Cleanup — Remove All Base44 Residue

#### [MODIFY] [`base44Client.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/api/base44Client.js)
- Rewrite to export `apiClient` directly without the `base44` alias, OR
- Keep the alias file but rename exports so consumers can be migrated incrementally

#### [MODIFY] All ~50 component files importing `base44`
- Replace `import { base44 } from "@/api/base44Client"` with `import { apiClient } from "@/api/apiClient"` (or keep the alias — this is a naming decision)

#### [MODIFY] [`AppLayout.jsx`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/components/AppLayout.jsx)
- Remove `base44.appLogs?.logUserInApp?.(pathname)` call (Base44-only analytics)
- Keep the `SiteVisit.create()` call (already goes through Supabase)

#### [MODIFY] [`OAuthConsent.jsx`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/pages/OAuthConsent.jsx)
- Remove or disable — this is a Base44 MCP consent page. If MCP is needed, rewrite for Supabase auth.

#### [MODIFY] [`authReturnTo.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/lib/authReturnTo.js)
- Remove Base44-specific param stripping (`app_base_url`, `app_id`, `functions_version`, `from_url`). Keep `access_token` stripping as a general security measure.

#### [MODIFY] Brain map images
- Download the 2 `media.base44.com` images, add to Supabase Storage, update URLs in:
  - [`BrainProfileMap.jsx`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/components/brainmap/BrainProfileMap.jsx)
  - [`brainRegions.js`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/components/brainmap/brainRegions.js)

#### [MODIFY] [`image.jsx`](file:///c:/Users/danis/Downloads/aqla%20github%20repo/aqla.io/src/components/ui/image.jsx)
- Remove `media.base44.com` from `WIX_MEDIA_HOSTS` array and Wix Media resize logic (or keep as dead-code-safe fallback)

#### [MODIFY] VoiceCheckIn + useVoiceChat — `GenerateSpeech`
- Replace `base44.integrations.Core.GenerateSpeech` with browser-native `SpeechSynthesis` API (or approved TTS provider per open question)

#### [DELETE] `base44/` directory reference in `.gitignore`
- Remove line 32: `base44/.app.jsonc`

#### Final repo-wide verification
- `grep -r "base44" src/` → zero matches
- `grep -r "InvokeLLM" src/` → zero matches
- `grep -r "media.base44.com" src/` → zero matches
- `grep -r "createAxiosClient" src/` → zero matches

---

## Verification Plan

### Automated Tests
```bash
# Build verification (no type/import errors)
npm run build

# Lint check
npm run lint

# Repo-wide Base44 elimination check
grep -ri "base44" src/ --include="*.js" --include="*.jsx" | grep -v "// legacy" | wc -l
# Expected: 0

# Edge Function deploy verification
supabase functions list
```

### Manual Verification
1. **Auth flow**: Register new user (email) → verify profile created → login → protected routes work
2. **Google OAuth**: Click "Continue with Google" → redirects to Google → returns to `/dashboard` → profile created
3. **AQLA Intelligence**: Ask a question on Coach page → Gemini responds with structured JSON → no `InvokeLLM` errors
4. **Voice Check-In**: Complete a voice check-in → AI processes → result saved
5. **Weekly Summary**: Trigger summary generation → Gemini returns structured output
6. **Help Agent**: Open Help Center → chat with agent → messages persist → new messages stream via Realtime
7. **Backend Ops/Architect**: Open OpsConsoleWidget → switch modes → both work → conversations persist
8. **Admin Dashboard**: Login as admin → metrics load → all admin panels functional
9. **Clinician View**: Login as clinician → member data loads → AI composer works
10. **Clinical Flags**: Trigger clinical keyword → flag auto-created → appears in admin view
11. **Network tab**: Zero requests to `*.base44.com` or Base44 API domains

### Hard-Stop Conditions
- ❌ Any `base44.com` network requests in browser dev tools
- ❌ Build fails
- ❌ Google OAuth redirect loop or profile not created
- ❌ Clinical data corruption or cross-user data exposure
- ❌ Secrets visible in browser
