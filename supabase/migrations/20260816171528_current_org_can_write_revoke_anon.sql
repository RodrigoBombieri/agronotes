-- El advisor de seguridad marcó que el rol anon podía ejecutar
-- current_org_can_write() vía RPC (Supabase otorga EXECUTE por defecto a
-- todo función nueva mediante ALTER DEFAULT PRIVILEGES, incluso después
-- de revocar de PUBLIC — mismo problema ya resuelto para las otras 4
-- funciones SECURITY DEFINER en la migración security_hardening de
-- Etapa 3). No es un riesgo real (la función no expone nada sensible),
-- pero se revoca explícitamente para mantener el mismo criterio.
revoke execute on function public.current_org_can_write() from anon;
