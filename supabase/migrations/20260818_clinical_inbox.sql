-- ============================================================================
-- AQLA.IO CLINICAL EMAIL INBOX & CONVERSATION PERSISTENCE SCHEMA
-- ============================================================================

-- 1. Clinical Email Threads
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '(No Subject)',
  participant_emails text[] not null default '{}',
  category text not null default 'Primary', -- 'Primary', 'Patient Care', 'System Updates', 'Promos'
  is_starred boolean not null default false,
  is_archived boolean not null default false,
  is_spam boolean not null default false,
  is_trashed boolean not null default false,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Clinical Email Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  email_id text unique,
  sender_email text not null,
  sender_name text,
  recipient_email text not null,
  subject text not null default '',
  body_html text not null default '',
  attachments jsonb not null default '[]'::jsonb, -- array of { name, size, type, url }
  is_read boolean not null default false,
  is_encrypted boolean not null default true,
  created_at timestamptz default now()
);

-- Indexes for high-speed inbox queries
create index if not exists idx_threads_updated_at on public.threads(updated_at desc);
create index if not exists idx_threads_category on public.threads(category);
create index if not exists idx_messages_thread_id on public.messages(thread_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);
create index if not exists idx_messages_is_read on public.messages(is_read);

-- 3. Draft History & Auto-Versioning
create table if not exists public.draft_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  thread_id uuid references public.threads(id) on delete cascade,
  recipient_email text,
  subject text,
  body_html text,
  updated_at timestamptz default now()
);

-- 4. User Inbox Settings (Forwarding, HTML Signatures, OOO Auto-Responders)
create table if not exists public.user_inbox_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  forwarding_enabled boolean not null default false,
  forwarding_emails text[] not null default '{}',
  signature_html text not null default '',
  out_of_office_enabled boolean not null default false,
  out_of_office_message text not null default '',
  out_of_office_start date,
  out_of_office_end date,
  theme_preference text not null default 'high-contrast-dark',
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.draft_history enable row level security;
alter table public.user_inbox_settings enable row level security;

-- Policies for Authenticated Clinicians and Admins
create policy "Clinicians and Admins can view threads"
  on public.threads for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('clinician', 'admin', 'super_admin')
    )
  );

create policy "Clinicians and Admins can view messages"
  on public.messages for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('clinician', 'admin', 'super_admin')
    )
  );

create policy "Users can manage own drafts"
  on public.draft_history for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage own inbox settings"
  on public.user_inbox_settings for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow Supabase Realtime publication
alter publication supabase_realtime add table public.threads;
alter publication supabase_realtime add table public.messages;
