-- 0005_security_hardening.sql
-- Fix de los warnings del advisor de seguridad de Supabase tras aplicar
-- 0001-0004:
--   1) function_search_path_mutable: los 3 triggers de 0001 no fijaban
--      search_path (a diferencia de los helpers de 0002, que sí lo hacían).
--   2) anon/authenticated_security_definer_function_executable: Supabase
--      otorga EXECUTE por defecto a anon/authenticated/service_role en
--      funciones nuevas del schema public (vía ALTER DEFAULT PRIVILEGES),
--      independientemente de cualquier "revoke ... from public" que se
--      haga a mano — hay que revocar explícitamente por rol.

alter function public.set_plot_organization() set search_path = public;
alter function public.set_task_organization() set search_path = public;
alter function public.set_updated_at() set search_path = public;

-- Helpers de RLS: los necesita "authenticated" (las policies los llaman
-- en el contexto del usuario logueado), "anon" no tiene ningún motivo
-- para invocarlos directo vía /rest/v1/rpc/.
revoke execute on function public.current_org_id() from anon;
revoke execute on function public.current_user_role() from anon;
revoke execute on function public.is_admin() from anon;

-- create_organization_and_owner ya estaba revocado de PUBLIC, pero
-- Supabase también le había dado EXECUTE a anon por default privileges
-- al crearla; se revoca explícitamente (ya se autoprotege con
-- "auth.uid() is null" pero mejor no depender solo de eso).
revoke execute on function public.create_organization_and_owner(text) from anon;
