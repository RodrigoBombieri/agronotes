-- 0004_signup_function.sql
-- Etapa 3 — alta de organización (signup) sin pasar por un Edge Function.
--
-- Por qué una función SQL y no un Edge Function: es un CRUD compuesto (3
-- inserts atómicos), no necesita ninguna API externa ni la service role
-- key -- entra en la categoría "CRUD" de planificador.md Etapa 3, no en
-- la de "lógica que amerita Edge Function". SECURITY DEFINER le permite
-- saltar RLS solo para estas 3 tablas y solo en este flujo puntual,
-- mientras que el resto de la app sigue detrás de las políticas de
-- 0002_rls_policies.sql.
--
-- Se llama desde el cliente (mobile/web) inmediatamente después de
-- auth.signUp(), con el usuario ya autenticado:
--   supabase.rpc('create_organization_and_owner', { org_name: '...' })

create or replace function public.create_organization_and_owner(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org_id uuid;
begin
  if v_uid is null then
    raise exception 'Debe llamarse autenticado';
  end if;

  if exists (select 1 from public.users where id = v_uid) then
    raise exception 'Este usuario ya pertenece a una organización';
  end if;

  if org_name is null or length(trim(org_name)) = 0 then
    raise exception 'org_name es obligatorio';
  end if;

  insert into public.organizations (name) values (trim(org_name))
    returning id into v_org_id;

  insert into public.users (id, organization_id, email, role)
    values (v_uid, v_org_id, (select email from auth.users where id = v_uid), 'admin');

  -- trial de 14 días, ya asignado a Mercado Pago como proveedor único
  -- del producto (decisión de Etapa 3); status queda en 'trialing'
  -- hasta que el webhook confirme el primer pago.
  insert into public.subscriptions (organization_id, provider, status, current_period_end)
    values (v_org_id, 'mercado_pago', 'trialing', now() + interval '14 days');

  return v_org_id;
end;
$$;

revoke all on function public.create_organization_and_owner(text) from public;
grant execute on function public.create_organization_and_owner(text) to authenticated;
