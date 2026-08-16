-- Etapa 6 (2026-08-16): modo solo lectura para organizaciones con
-- suscripción past_due/canceled. Decidido en Etapa 3 ("Suscripción
-- vencida → solo lectura, no bloqueo"), nunca implementado hasta ahora —
-- hasta hoy una organización con la suscripción vencida podía seguir
-- creando/editando tareas, campos y lotes con total normalidad.
--
-- Importante: esto NO toca el guardado local de una tarea en el SQLite
-- del celular (decisión de Etapa 1, "la app mobile nunca bloquea al
-- usuario por falta de conexión") — el bloqueo actúa solo en el momento
-- de sincronizar contra Supabase (el INSERT/UPDATE real), vía RLS. La
-- tarea queda guardada localmente con estado "error" hasta que la
-- suscripción se regularice, exactamente como cualquier otro error de
-- sync no reintentable.
--
-- No se toca SELECT en ninguna tabla: los datos existentes siempre se
-- pueden seguir leyendo (por eso es "solo lectura" y no un bloqueo total).

create or replace function public.current_org_can_write()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select status not in ('past_due', 'canceled')
     from public.subscriptions
     where organization_id = public.current_org_id()),
    true
  );
$$;

comment on function public.current_org_can_write() is
  'true si la organización del usuario autenticado puede escribir (crear/editar tareas, campos, lotes y tipos de tarea custom) — false si su suscripción está past_due o canceled. No afecta SELECT.';

revoke all on function public.current_org_can_write() from public;
grant execute on function public.current_org_can_write() to authenticated;

-- tasks: el flujo principal de la app (operario registrando labores)
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert
  with check (
    organization_id = current_org_id()
    and user_id = (select auth.uid())
    and current_org_can_write()
  );

drop policy if exists tasks_update_own_or_admin on public.tasks;
create policy tasks_update_own_or_admin on public.tasks
  for update
  using (
    organization_id = current_org_id()
    and (user_id = (select auth.uid()) or is_admin())
  )
  with check (
    organization_id = current_org_id()
    and (user_id = (select auth.uid()) or is_admin())
    and current_org_can_write()
  );

-- fields (campos)
drop policy if exists fields_insert_admin on public.fields;
create policy fields_insert_admin on public.fields
  for insert
  with check (
    organization_id = current_org_id()
    and is_admin()
    and current_org_can_write()
  );

drop policy if exists fields_update_admin on public.fields;
create policy fields_update_admin on public.fields
  for update
  using (organization_id = current_org_id() and is_admin())
  with check (
    organization_id = current_org_id()
    and is_admin()
    and current_org_can_write()
  );

-- plots (lotes)
drop policy if exists plots_insert_admin on public.plots;
create policy plots_insert_admin on public.plots
  for insert
  with check (
    organization_id = current_org_id()
    and is_admin()
    and current_org_can_write()
  );

drop policy if exists plots_update_admin on public.plots;
create policy plots_update_admin on public.plots
  for update
  using (organization_id = current_org_id() and is_admin())
  with check (
    organization_id = current_org_id()
    and is_admin()
    and current_org_can_write()
  );

-- task_types (catálogo custom por organización — el global con
-- organization_id null no lo puede tocar ninguna org de todas formas)
drop policy if exists task_types_insert_admin on public.task_types;
create policy task_types_insert_admin on public.task_types
  for insert
  with check (
    organization_id = current_org_id()
    and is_admin()
    and current_org_can_write()
  );

drop policy if exists task_types_update_admin on public.task_types;
create policy task_types_update_admin on public.task_types
  for update
  using (organization_id = current_org_id() and is_admin())
  with check (
    organization_id = current_org_id()
    and is_admin()
    and current_org_can_write()
  );
