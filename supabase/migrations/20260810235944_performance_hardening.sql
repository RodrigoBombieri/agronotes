-- 0007_performance_hardening.sql
-- Fix de los warnings del advisor de performance:
--   1) auth_rls_initplan: auth.uid() dentro de una policy se re-evalúa
--      por cada fila si se lo escribe "pelado"; envuelto en (select ...)
--      Postgres lo trata como initplan y lo evalúa una sola vez por query.
--      (Los helpers current_org_id()/is_admin() no generaron este warning
--      porque ya son funciones STABLE separadas — el problema era el
--      auth.uid() literal dentro de tasks/users.)
--   2) multiple_permissive_policies: fields/plots/task_types tenían una
--      policy "for all" (admin) + una "for select" (todos) — ambas
--      permisivas para SELECT, se evalúan las dos en cada lectura. Se
--      separa "for all" en insert/update/delete puntuales, dejando select
--      solo en la policy dedicada.

alter policy users_update_self_or_admin on public.users
  using (
    id = (select auth.uid())
    or (organization_id = public.current_org_id() and public.is_admin())
  )
  with check (
    id = (select auth.uid())
    or (organization_id = public.current_org_id() and public.is_admin())
  );

alter policy tasks_insert on public.tasks
  with check (
    organization_id = public.current_org_id()
    and user_id = (select auth.uid())
  );

alter policy tasks_update_own_or_admin on public.tasks
  using (
    organization_id = public.current_org_id()
    and (user_id = (select auth.uid()) or public.is_admin())
  )
  with check (
    organization_id = public.current_org_id()
    and (user_id = (select auth.uid()) or public.is_admin())
  );

-- fields
drop policy fields_write_admin on public.fields;
create policy fields_insert_admin on public.fields
  for insert with check (organization_id = public.current_org_id() and public.is_admin());
create policy fields_update_admin on public.fields
  for update using (organization_id = public.current_org_id() and public.is_admin())
  with check (organization_id = public.current_org_id() and public.is_admin());
create policy fields_delete_admin on public.fields
  for delete using (organization_id = public.current_org_id() and public.is_admin());

-- plots
drop policy plots_write_admin on public.plots;
create policy plots_insert_admin on public.plots
  for insert with check (organization_id = public.current_org_id() and public.is_admin());
create policy plots_update_admin on public.plots
  for update using (organization_id = public.current_org_id() and public.is_admin())
  with check (organization_id = public.current_org_id() and public.is_admin());
create policy plots_delete_admin on public.plots
  for delete using (organization_id = public.current_org_id() and public.is_admin());

-- task_types
drop policy task_types_write_admin on public.task_types;
create policy task_types_insert_admin on public.task_types
  for insert with check (organization_id = public.current_org_id() and public.is_admin());
create policy task_types_update_admin on public.task_types
  for update using (organization_id = public.current_org_id() and public.is_admin())
  with check (organization_id = public.current_org_id() and public.is_admin());
create policy task_types_delete_admin on public.task_types
  for delete using (organization_id = public.current_org_id() and public.is_admin());
