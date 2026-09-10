-- Correction: the prior column-level REVOKE had no effect against Supabase's
-- table-wide default grants. Using a trigger instead, which works regardless
-- of grant scope. Only the service_role (used internally by verifyAdminAccess,
-- after a real OTP check) may change admin_trusted_devices; any change
-- attempted by anon/authenticated is silently reverted to its prior value,
-- leaving any other columns in the same UPDATE statement untouched.
create or replace function public.protect_admin_trusted_devices()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.admin_trusted_devices is distinct from old.admin_trusted_devices then
    if coalesce(auth.role(), '') is distinct from 'service_role' then
      new.admin_trusted_devices := old.admin_trusted_devices;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_admin_trusted_devices_trigger on public.profiles;
create trigger protect_admin_trusted_devices_trigger
before update on public.profiles
for each row
execute function public.protect_admin_trusted_devices();
