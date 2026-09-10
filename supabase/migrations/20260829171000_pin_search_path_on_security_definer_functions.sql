alter function public.get_user_role(user_id uuid) set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.is_admin() set search_path = public, pg_temp;
alter function public.is_clinician_or_admin() set search_path = public, pg_temp;
alter function public.is_super_admin() set search_path = public, pg_temp;
