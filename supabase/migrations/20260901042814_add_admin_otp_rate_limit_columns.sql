alter table public.profiles
  add column if not exists admin_otp_failed_attempts integer not null default 0,
  add column if not exists admin_otp_locked_until timestamptz;
