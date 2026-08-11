-- 0006_security_hardening_public_revoke.sql
-- El revoke de 0005 solo tocó el grant extra que Supabase le da a "anon"
-- por default privileges; el grant automático a PUBLIC que Postgres hace
-- al crear una función seguía activo (PUBLIC no es lo mismo que "todos
-- los roles individuales" a los fines de revoke: hay que revocarlo del
-- pseudo-rol PUBLIC explícitamente, y recién ahí re-otorgar a quien
-- corresponda). Verificado con has_function_privilege() contra anon y
-- authenticated tras aplicar esto — ver planificador.md Etapa 3.

revoke execute on function public.current_org_id() from public;
revoke execute on function public.current_user_role() from public;
revoke execute on function public.is_admin() from public;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
