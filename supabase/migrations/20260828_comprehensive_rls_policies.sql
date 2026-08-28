-- ============================================================================
-- AQLA.IO COMPREHENSIVE ROW LEVEL SECURITY (RLS) MIGRATION
-- Migration: 20260828_comprehensive_rls_policies
-- Covers: All 28 base tables + AI Runtime & Clinical Inbox tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_clinician_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'clinician', 'super_admin') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'),
    (SELECT auth.uid() = ANY(super_admin_ids) FROM public.super_admin_configs LIMIT 1),
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. ENSURE OPTIONAL / EXTENDED TABLES EXIST
-- ----------------------------------------------------------------------------

-- Clinical Inbox Tables
CREATE TABLE IF NOT EXISTS public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT '(No Subject)',
  participant_emails text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'Primary',
  is_starred boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_spam boolean NOT NULL DEFAULT false,
  is_trashed boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  email_id text UNIQUE,
  sender_email text NOT NULL,
  sender_name text,
  recipient_email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  is_encrypted boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.draft_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.threads(id) ON DELETE CASCADE,
  recipient_email text,
  subject text,
  body_html text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_inbox_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  forwarding_enabled boolean NOT NULL DEFAULT false,
  forwarding_emails text[] NOT NULL DEFAULT '{}',
  signature_html text NOT NULL DEFAULT '',
  out_of_office_enabled boolean NOT NULL DEFAULT false,
  out_of_office_message text NOT NULL DEFAULT '',
  out_of_office_start date,
  out_of_office_end date,
  theme_preference text NOT NULL DEFAULT 'high-contrast-dark',
  updated_at timestamptz DEFAULT now()
);

-- AI Runtime Tables
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

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text,
  tool_calls jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.ai_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  evaluator text NOT NULL,
  score numeric,
  metrics jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_deployment_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'supabase' CHECK (mode IN ('base44', 'shadow', 'supabase')),
  config jsonb DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captcha_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinician_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_wordbank_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inbox_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_deployment_modes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. DROP EXISTING POLICIES TO PREVENT DUPLICATES
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. DEFINE COMPREHENSIVE POLICIES BY TABLE
-- ----------------------------------------------------------------------------

-- Table 1: admin_otps
CREATE POLICY "admin_otps_select" ON public.admin_otps
  FOR SELECT USING (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "admin_otps_insert" ON public.admin_otps
  FOR INSERT WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "admin_otps_update" ON public.admin_otps
  FOR UPDATE USING (user_id = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "admin_otps_delete" ON public.admin_otps
  FOR DELETE USING (public.is_admin());

-- Table 2: app_settings
CREATE POLICY "app_settings_select_public" ON public.app_settings
  FOR SELECT USING (true);
CREATE POLICY "app_settings_admin_all" ON public.app_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Table 3: assessments
CREATE POLICY "assessments_select" ON public.assessments
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "assessments_insert" ON public.assessments
  FOR INSERT WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "assessments_update" ON public.assessments
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "assessments_delete" ON public.assessments
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 4: brain_domains
CREATE POLICY "brain_domains_select" ON public.brain_domains
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "brain_domains_insert" ON public.brain_domains
  FOR INSERT WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "brain_domains_update" ON public.brain_domains
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "brain_domains_delete" ON public.brain_domains
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 5: captcha_configs
CREATE POLICY "captcha_configs_super_admin_all" ON public.captcha_configs
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Table 6: clinical_flags
CREATE POLICY "clinical_flags_select" ON public.clinical_flags
  FOR SELECT USING (user_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "clinical_flags_insert" ON public.clinical_flags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR public.is_clinician_or_admin());
CREATE POLICY "clinical_flags_update" ON public.clinical_flags
  FOR UPDATE USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "clinical_flags_delete" ON public.clinical_flags
  FOR DELETE USING (public.is_admin());

-- Table 7: clinician_reviews
CREATE POLICY "clinician_reviews_select" ON public.clinician_reviews
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "clinician_reviews_insert" ON public.clinician_reviews
  FOR INSERT WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "clinician_reviews_update" ON public.clinician_reviews
  FOR UPDATE USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "clinician_reviews_delete" ON public.clinician_reviews
  FOR DELETE USING (public.is_admin());

-- Table 8: cognitive_tests
CREATE POLICY "cognitive_tests_select" ON public.cognitive_tests
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "cognitive_tests_insert" ON public.cognitive_tests
  FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "cognitive_tests_update" ON public.cognitive_tests
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "cognitive_tests_delete" ON public.cognitive_tests
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 9: daily_check_ins
CREATE POLICY "daily_check_ins_select" ON public.daily_check_ins
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "daily_check_ins_insert" ON public.daily_check_ins
  FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "daily_check_ins_update" ON public.daily_check_ins
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "daily_check_ins_delete" ON public.daily_check_ins
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 10: dev_ideas
CREATE POLICY "dev_ideas_admin_all" ON public.dev_ideas
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Table 11: dev_wordbank_ideas
CREATE POLICY "dev_wordbank_ideas_admin_all" ON public.dev_wordbank_ideas
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Table 12: email_digests
CREATE POLICY "email_digests_admin_all" ON public.email_digests
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Table 13: experiments
CREATE POLICY "experiments_select" ON public.experiments
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "experiments_insert" ON public.experiments
  FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "experiments_update" ON public.experiments
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "experiments_delete" ON public.experiments
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 14: game_ratings
CREATE POLICY "game_ratings_select_public" ON public.game_ratings
  FOR SELECT USING (true);
CREATE POLICY "game_ratings_insert" ON public.game_ratings
  FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "game_ratings_update" ON public.game_ratings
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_admin());
CREATE POLICY "game_ratings_delete" ON public.game_ratings
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 15: game_sessions
CREATE POLICY "game_sessions_select" ON public.game_sessions
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "game_sessions_insert" ON public.game_sessions
  FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "game_sessions_update" ON public.game_sessions
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_admin());
CREATE POLICY "game_sessions_delete" ON public.game_sessions
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 16: health_profiles
CREATE POLICY "health_profiles_select" ON public.health_profiles
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "health_profiles_insert" ON public.health_profiles
  FOR INSERT WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "health_profiles_update" ON public.health_profiles
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "health_profiles_delete" ON public.health_profiles
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 17: ingredients
CREATE POLICY "ingredients_select_public" ON public.ingredients
  FOR SELECT USING (true);
CREATE POLICY "ingredients_insert" ON public.ingredients
  FOR INSERT WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "ingredients_update" ON public.ingredients
  FOR UPDATE USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "ingredients_delete" ON public.ingredients
  FOR DELETE USING (public.is_admin());

-- Table 18: member_recommendations
CREATE POLICY "member_recommendations_select" ON public.member_recommendations
  FOR SELECT USING (user_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "member_recommendations_insert" ON public.member_recommendations
  FOR INSERT WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "member_recommendations_update" ON public.member_recommendations
  FOR UPDATE USING (user_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "member_recommendations_delete" ON public.member_recommendations
  FOR DELETE USING (public.is_admin());

-- Table 19: pdf_archives
CREATE POLICY "pdf_archives_select" ON public.pdf_archives
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_admin());
CREATE POLICY "pdf_archives_insert" ON public.pdf_archives
  FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "pdf_archives_update" ON public.pdf_archives
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_admin());
CREATE POLICY "pdf_archives_delete" ON public.pdf_archives
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 20: pdf_themes
CREATE POLICY "pdf_themes_select_public" ON public.pdf_themes
  FOR SELECT USING (true);
CREATE POLICY "pdf_themes_admin_all" ON public.pdf_themes
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Table 21: plan_reviews
CREATE POLICY "plan_reviews_select" ON public.plan_reviews
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "plan_reviews_insert" ON public.plan_reviews
  FOR INSERT WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "plan_reviews_update" ON public.plan_reviews
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "plan_reviews_delete" ON public.plan_reviews
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 22: profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    (id = auth.uid() AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()))
    OR public.is_admin()
  );
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Table 23: protocols
CREATE POLICY "protocols_select" ON public.protocols
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "protocols_insert" ON public.protocols
  FOR INSERT WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "protocols_update" ON public.protocols
  FOR UPDATE USING (created_by_id = auth.uid() OR public.is_clinician_or_admin())
  WITH CHECK (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "protocols_delete" ON public.protocols
  FOR DELETE USING (created_by_id = auth.uid() OR public.is_admin());

-- Table 24: site_visits
CREATE POLICY "site_visits_insert_all" ON public.site_visits
  FOR INSERT WITH CHECK (true);
CREATE POLICY "site_visits_admin_select" ON public.site_visits
  FOR SELECT USING (public.is_admin());
CREATE POLICY "site_visits_admin_delete" ON public.site_visits
  FOR DELETE USING (public.is_admin());

-- Table 25: super_admin_configs
CREATE POLICY "super_admin_configs_super_admin_all" ON public.super_admin_configs
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Table 26: super_admin_logs
CREATE POLICY "super_admin_logs_select" ON public.super_admin_logs
  FOR SELECT USING (public.is_admin() OR public.is_super_admin());
CREATE POLICY "super_admin_logs_insert" ON public.super_admin_logs
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_super_admin());

-- Table 27: user_complaints
CREATE POLICY "user_complaints_select" ON public.user_complaints
  FOR SELECT USING (created_by_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "user_complaints_insert_all" ON public.user_complaints
  FOR INSERT WITH CHECK (true);
CREATE POLICY "user_complaints_update" ON public.user_complaints
  FOR UPDATE USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());
CREATE POLICY "user_complaints_delete" ON public.user_complaints
  FOR DELETE USING (public.is_admin());

-- Table 28: users (Legacy Base44 Table)
CREATE POLICY "legacy_users_admin_all" ON public.users
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. CLINICAL INBOX POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY "threads_clinician_admin_all" ON public.threads
  FOR ALL USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());

CREATE POLICY "messages_clinician_admin_all" ON public.messages
  FOR ALL USING (public.is_clinician_or_admin())
  WITH CHECK (public.is_clinician_or_admin());

CREATE POLICY "draft_history_own" ON public.draft_history
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_inbox_settings_own" ON public.user_inbox_settings
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. AI RUNTIME POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY "ai_runs_select" ON public.ai_runs
  FOR SELECT USING (user_id = auth.uid() OR public.is_clinician_or_admin());
CREATE POLICY "ai_runs_admin_all" ON public.ai_runs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ai_conversations_own" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ai_messages_own" ON public.ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id AND (c.user_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "ai_memory_items_own" ON public.ai_memory_items
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ai_evaluations_admin_all" ON public.ai_evaluations
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ai_deployment_modes_select_public" ON public.ai_deployment_modes
  FOR SELECT USING (true);
CREATE POLICY "ai_deployment_modes_admin_all" ON public.ai_deployment_modes
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());
