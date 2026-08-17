-- ============================================================================
-- AQLA AI RUNTIME & AGENT TABLES
-- Migration: ai_runs, ai_conversations, ai_messages, ai_memory_items,
--            ai_evaluations, ai_deployment_modes, complaint_search_index
-- ============================================================================

-- Enable pgvector if available
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. AI Runs ledger (logs every AI Gateway call for audit, rate-limiting, observability)
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  worker_id text NOT NULL,
  model text NOT NULL,
  prompt_version text DEFAULT 'v1-imported-base44',
  input_tokens int,
  output_tokens int,
  latency_ms int,
  status text DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  error_message text,
  correlation_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_runs_own_select" ON public.ai_runs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ai_runs_admin_select" ON public.ai_runs
  FOR SELECT USING (public.is_clinician_or_admin());

CREATE INDEX IF NOT EXISTS idx_ai_runs_user_id ON public.ai_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_worker_id ON public.ai_runs(worker_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_created_at ON public.ai_runs(created_at DESC);

-- 2. AI Conversations (one per agent per user; supports multi-conversation for Backend Ops)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_own" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_admin_select" ON public.ai_conversations
  FOR SELECT USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_agent
  ON public.ai_conversations(user_id, agent_name);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated
  ON public.ai_conversations(updated_at DESC);

-- 3. AI Messages (individual turns inside a conversation; Realtime-enabled)
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text,
  tool_calls jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages_own" ON public.ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_admin_select" ON public.ai_messages
  FOR SELECT USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
  ON public.ai_messages(conversation_id, created_at);

-- 4. AI Memory Items (Governed memory for Help Agent & Assistant)
CREATE TABLE IF NOT EXISTS public.ai_memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_name text NOT NULL,
  memory_key text NOT NULL,
  memory_value jsonb NOT NULL,
  confidence numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_memory_own" ON public.ai_memory_items
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_memory_admin" ON public.ai_memory_items
  FOR SELECT USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_ai_memory_user_agent
  ON public.ai_memory_items(user_id, agent_name);

-- 5. AI Evaluations (Quality / Parity Evaluation ledger)
CREATE TABLE IF NOT EXISTS public.ai_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  evaluator text NOT NULL,
  score numeric,
  metrics jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_evaluations_admin" ON public.ai_evaluations
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. AI Deployment Modes (Shadow, Base44 fallback, Supabase active)
CREATE TABLE IF NOT EXISTS public.ai_deployment_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'supabase' CHECK (mode IN ('base44', 'shadow', 'supabase')),
  config jsonb DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_deployment_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_deployment_modes_read" ON public.ai_deployment_modes
  FOR SELECT USING (true);

CREATE POLICY "ai_deployment_modes_admin" ON public.ai_deployment_modes
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Complaints Search Index (Narrowly scoped semantic & fulltext index)
CREATE TABLE IF NOT EXISTS public.complaint_search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES public.user_complaints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text,
  searchable_text text NOT NULL,
  tsv_content tsvector,
  embedding vector(768),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.complaint_search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "complaint_search_admin" ON public.complaint_search_index
  FOR ALL USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());

-- Indexes for complaint search
CREATE INDEX IF NOT EXISTS idx_complaint_search_tsv
  ON public.complaint_search_index USING gin(tsv_content);

-- Realtime publication updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
