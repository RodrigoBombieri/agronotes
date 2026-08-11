-- 0002_rls_policies.sql
-- Cuaderno de Campo Digital — Row Level Security (adelanto de Etapa 3,
-- se habilita ya en Etapa 2 para que ninguna tabla quede nunca abierta).
--
-- Reglas de visibilidad decididas para el MVP:
--   * Todo el contenido de una organización es visible para CUALQUIER
--     usuario de esa organización (admin u operario) — un "cuaderno de
--     campo" compartido, no compartimentado por usuario. Es la lectura
--     de "ve solo lo suyo o lo de su campo asignado" que planificador.md
--     dejaba abierta en la Etapa 1: para el MVP se resuelve como "ve todo
--     lo de su organización".
--   * Escritura de catálogo (fields, plots, task_types custom, usuarios,
--     suscripción) es exclusiva de admin.
--   * Tareas: cualquier usuario de la organización puede crear tareas a
--     su propio nombre; puede editar/anular las propias; admin puede
--     editar/anular cualquiera de su organización.
--   * subscriptions no tiene ninguna policy de insert/update/delete para
--     clientes: se gestiona solo desde el backend con la service role key
--     (Edge Function / webhook de pago), que ignora RLS.

-- ─────────────────────────────────────────────────────────────────────────
-- Helpers — SECURITY DEFINER para no recursar contra la RLS de "users"
-- al resolver la organización/rol del usuario autenticado.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────────────────────────────────
alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
  for select using (id = public.current_org_id());

create policy organizations_update_admin on public.organizations
  for update using (id = public.current_org_id() and public.is_admin())
  with check (id = public.current_org_id() and public.is_admin());

-- sin policy de insert/delete: el alta de una organización nueva
-- (signup) se resuelve con service role desde el backend, Etapa 3.

-- ─────────────────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────────────────
alter table public.users enable row level security;

create policy users_select on public.users
  for select using (organization_id = public.current_org_id());

create policy users_update_self_or_admin on public.users
  for update using (
    id = auth.uid()
    or (organization_id = public.current_org_id() and public.is_admin())
  )
  with check (
    id = auth.uid()
    or (organization_id = public.current_org_id() and public.is_admin())
  );

-- sin policy de insert/delete: alta/baja de usuarios (invitaciones) se
-- hace vía Edge Function con service role, Etapa 3 — así se controla el
-- límite de usuarios por plan de suscripción en el mismo paso.

-- ─────────────────────────────────────────────────────────────────────────
-- fields
-- ─────────────────────────────────────────────────────────────────────────
alter table public.fields enable row level security;

create policy fields_select on public.fields
  for select using (organization_id = public.current_org_id());

create policy fields_write_admin on public.fields
  for all using (organization_id = public.current_org_id() and public.is_admin())
  with check (organization_id = public.current_org_id() and public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- plots
-- ─────────────────────────────────────────────────────────────────────────
alter table public.plots enable row level security;

create policy plots_select on public.plots
  for select using (organization_id = public.current_org_id());

create policy plots_write_admin on public.plots
  for all using (organization_id = public.current_org_id() and public.is_admin())
  with check (organization_id = public.current_org_id() and public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- task_types
-- ─────────────────────────────────────────────────────────────────────────
alter table public.task_types enable row level security;

-- se ve el catálogo global (organization_id null) + el propio custom
create policy task_types_select on public.task_types
  for select using (organization_id is null or organization_id = public.current_org_id());

-- una organización solo puede gestionar sus propios tipos custom,
-- nunca el catálogo global (ese lo controla la migración de seed)
create policy task_types_write_admin on public.task_types
  for all using (organization_id = public.current_org_id() and public.is_admin())
  with check (organization_id = public.current_org_id() and public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────────────────────────────────
alter table public.tasks enable row level security;

create policy tasks_select on public.tasks
  for select using (organization_id = public.current_org_id());

create policy tasks_insert on public.tasks
  for insert with check (
    organization_id = public.current_org_id()
    and user_id = auth.uid()
  );

create policy tasks_update_own_or_admin on public.tasks
  for update using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_admin())
  )
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_admin())
  );

-- sin policy de delete: anular una tarea es un UPDATE de deleted_at,
-- nunca un DELETE físico (se preserva el historial).

-- ─────────────────────────────────────────────────────────────────────────
-- subscriptions
-- ─────────────────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;

create policy subscriptions_select on public.subscriptions
  for select using (organization_id = public.current_org_id());

-- sin policy de insert/update/delete a propósito: solo la service role
-- (que bypasea RLS) puede tocar esta tabla, desde el webhook de pago.
