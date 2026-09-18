-- ============================================================================
-- AQLA TESTING SUITE & AI AGENT TEST ACCOUNTS
-- Migration: test_accounts table, profile test flag, and admin RLS policies
-- ============================================================================

-- 1. Add is_test_account flag to public.profiles if not present
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_test_account boolean DEFAULT false;

-- 2. Create test_accounts registry table
CREATE TABLE IF NOT EXISTS public.test_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  passcode text UNIQUE NOT NULL,
  label text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  archetype text,
  last_login_at timestamptz,
  history jsonb DEFAULT '[]'::jsonb,
  data_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_test_accounts_passcode ON public.test_accounts(passcode);
CREATE INDEX IF NOT EXISTS idx_test_accounts_created_at ON public.test_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_test_account ON public.profiles(is_test_account);

-- 4. Enable Row Level Security
ALTER TABLE public.test_accounts ENABLE ROW LEVEL SECURITY;

-- Admins have full access to test accounts
CREATE POLICY "test_accounts_admin_full" ON public.test_accounts
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role and internal operations have full access
CREATE POLICY "test_accounts_service_role" ON public.test_accounts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
