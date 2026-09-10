-- Fix 1: clinical_flags_insert previously allowed ANY authenticated user to
-- insert a flag for ANY user_id. Restrict inserts to the flag's own user,
-- same pattern as daily_check_ins/assessments/etc., while still allowing
-- clinicians/admins to file flags on behalf of a patient.
drop policy if exists clinical_flags_insert on public.clinical_flags;
create policy clinical_flags_insert on public.clinical_flags
  for insert
  with check ((user_id = auth.uid()) OR is_clinician_or_admin());

-- Fix 2: is_super_admin() relied on COALESCE fallthrough where, if the
-- super_admin_configs row/array were ever missing or NULL, a plain 'admin'
-- would be silently treated as a super_admin. Rewrite explicitly so each
-- branch resolves to a real boolean and the admin-role check is removed
-- from being an implicit super_admin grant.
create or replace function public.is_super_admin()
returns boolean
language sql
stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  )
  or coalesce(
    (select auth.uid() = any(super_admin_ids) from public.super_admin_configs limit 1),
    false
  );
$$;
