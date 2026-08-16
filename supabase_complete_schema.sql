-- ============================================================================
-- AQLA.IO PRODUCTION SUPABASE SCHEMAS & MIGRATION RLS POLICIES
-- ============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade,
  full_name text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Ingredients Table
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  name text not null,
  family text,
  role text,
  evidence_type text,
  studied_population text,
  "references" text[],
  effect_size text,
  last_reviewed date,
  evidence_grade text,
  interactions text,
  timeframe text,
  limitations text,
  safety_info text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Protocols Table
create table if not exists public.protocols (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  name text not null,
  family text,
  objective text,
  why_selected text,
  duration_days integer,
  actions jsonb,
  supporting_actions jsonb,
  measuring jsonb,
  expected_benefits text,
  safety_notes text,
  review_date date,
  status text,
  start_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Game Ratings Table
create table if not exists public.game_ratings (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  game_id text not null,
  game_name text not null,
  stars integer check (
    stars >= 1
    and stars <= 5
  ) not null,
  feedback text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Plan Reviews Table
create table if not exists public.plan_reviews (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  protocol_id uuid,
  protocol_family text,
  cycle_started_date date not null,
  responses jsonb not null,
  analysis_summary text,
  observed_results text,
  recommendation_reason text,
  recommended_family text,
  confidence text,
  decision text not null,
  completed_date timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Game Sessions Table
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  game_id text not null,
  score numeric,
  raw_results jsonb,
  completed_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Assessments Table
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  version text,
  responses jsonb,
  completed_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Brain Domains Table
create table if not exists public.brain_domains (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  domain_key text not null,
  domain_name text not null,
  score numeric not null,
  confidence text default 'moderate',
  trend text default 'stable',
  summary text,
  limiting_factors text[],
  protective_factors text[],
  next_action text,
  data_sources text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Clinical Flags Table
create table if not exists public.clinical_flags (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  flag_type text default 'auto',
  source_agent text,
  message_snippet text,
  user_id uuid references auth.users (id) on delete cascade,
  user_name text,
  admin_id uuid references auth.users (id) on delete set null,
  admin_name text,
  status text default 'pending',
  clinician_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Admin OTPs Table
create table if not exists public.admin_otps (
  id uuid primary key default gen_random_uuid (),
  created_by_id uuid references auth.users (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Enable & Permissive Policies for Data Migration
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'profiles', 'ingredients', 'protocols', 'game_ratings', 'plan_reviews',
    'game_sessions', 'assessments', 'brain_domains', 'clinical_flags', 'admin_otps'
  ] loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format('drop policy if exists "%s_permissive" on public.%I;', tbl, tbl);
    execute format('create policy "%s_permissive" on public.%I for all using (true) with check (true);', tbl, tbl);
  end loop;
end;
$$;
