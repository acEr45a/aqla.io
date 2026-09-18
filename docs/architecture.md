# Architecture & System Design

This document provides a technical overview of AQLA's core architecture, system design patterns, and module boundaries.

---

## 1. System Overview

AQLA is structured as a decoupled client-server architecture with an AI Gateway abstraction layer and edge computing backend.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│   Vite + React 18 SPA (Vercel)   │  Chrome Companion Ext    │
└──────────────┬────────────────────────────────┬─────────────┘
               │                                │
               ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│           Supabase Postgres 17 (Auth & RLS)                 │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Intelligence Layer                       │
│    Vercel AI Gateway (Multi-provider LLM & Vector RAG)      │
│  - DeepSeek v3.1 / Claude Sonnet 4.5 / OpenAI Embeddings     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Modules & Directory Map

```text
aqla.io/
├── src/
│   ├── api/
│   │   └── apiClient.js        # Data entity abstraction layer
│   ├── components/
│   │   ├── admin/               # Operations & security controls
│   │   ├── brainmap/            # Three.js 3D cognitive visualizers
│   │   ├── coach/               # Intelligence coach conversational workspace
│   │   ├── landing/             # Pinned narrative & tunnel canvas
│   │   └── ui/                  # Radix UI primitives & tailwind components
│   ├── lib/
│   │   ├── supabase.js          # Supabase client singleton & session storage
│   │   ├── scoring.js           # Cognitive domain calculation math
│   │   └── AuthContext.jsx      # Authentication & state provider
│   └── pages/                   # Application views & route split components
├── supabase/
│   └── functions/               # Supabase Edge Functions (Deno / TypeScript)
│       ├── _shared/
│       │   ├── gateway.ts       # Vercel AI Gateway client & failover logic
│       │   ├── tools-catalog.ts # AI agent tool schemas
│       │   └── worker-registry.ts # Specialized prompt templates & schemas
│       ├── agent-message/       # Multi-turn conversational agent engine
│       ├── ai-run/              # Authenticated multi-provider AI runner
│       └── send-email/          # Resend transactional email integration
├── extension/                   # Chrome Extension companion codebase
└── docs/                        # Technical & contributor documentation
```

---

## 3. Data Flow & Security Model

### Authorization & RLS
- **Postgres Row-Level Security (RLS)** is the primary security boundary.
- Direct table reads/writes from `apiClient.js` inherit the caller's JWT role.
- Clinician and operational endpoints enforce strict role gating within Postgres RLS policies and Edge Function runtime gates.

### AI Gateway Integration
- All AI operations route through `supabase/functions/_shared/gateway.ts` targeting the **Vercel AI Gateway**.
- Failover support automatically routes requests across specified model providers (DeepSeek, Anthropic, OpenAI) with automatic error fallback handling.
- Vector RAG operations utilize `openai/text-embedding-3-small` (768 dimensions) stored in Postgres via `pgvector`.

---

## 4. Edge Functions Inventory

| Edge Function | Status | Primary Purpose |
|---|---|---|
| `ai-run` | Live | Authenticated multi-provider AI task execution |
| `agent-message` | Live | Multi-turn RAG agent loop with tool execution |
| `send-email` | Live | Transactional email delivery via Resend API |
| `sendAdminOtp` | Live | Multi-factor admin authentication gate |
| `verifyAdminAccess` | Live | Security verification for operational consoles |
