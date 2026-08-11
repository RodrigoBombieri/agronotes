-- supabase/tests/database/rls_multi_org_test.sql
--
-- Etapa 3, checklist "políticas RLS por tabla probadas con al menos dos
-- organizaciones distintas". Corre con pgTAP vía Supabase CLI:
--
--   supabase start          -- levanta el stack local (incluye pgTAP)
--   supabase test db        -- corre todos los *_test.sql de supabase/tests
--
-- Patrón usado para "actuar como" un usuario autenticado sin un JWT real:
-- set local role authenticated; set local request.jwt.claim.sub a su id.
-- Es el mismo mecanismo que usa PostgREST/Supabase para resolver auth.uid()
-- dentro de una policy, así que ejercita las políticas de 0002 tal cual
-- las vería la app.

begin;
select plan(11);

-- ── Setup: 2 organizaciones, 3 usuarios, 2 campos/lotes ────────────────
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin1@org1.test'),
  ('22222222-2222-2222-2222-222222222222', 'oper1@org1.test'),
  ('33333333-3333-3333-3333-333333333333', 'admin2@org2.test');

insert into public.organizations (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Org 1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Org 2');

insert into public.users (id, organization_id, email, role) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin1@org1.test', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'oper1@org1.test', 'operario'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin2@org2.test', 'admin');

insert into public.fields (id, organization_id, name) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Campo Norte'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Campo Sur');

-- organization_id de plots se autocompleta por trigger (0001) a partir del campo
insert into public.plots (id, field_id, name) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lote 1'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Lote 1');

-- usa el catálogo global sembrado por 0003, no inserta uno nuevo
-- (evita chocar con el índice único de nombres globales)
insert into public.tasks (id, plot_id, task_type_id, user_id, quantity, unit)
  select
    '99999999-9999-9999-9999-999999999999',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    id,
    '22222222-2222-2222-2222-222222222222',
    5,
    'hectáreas'
  from public.task_types where name = 'Siembra' and organization_id is null;

insert into public.subscriptions (organization_id, provider, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mercado_pago', 'trialing'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mercado_pago', 'trialing');

-- ── Como admin1 (Org 1) ─────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (select count(*)::int from public.fields),
  1,
  'admin1 solo ve los campos de su propia organización'
);

select is(
  (select count(*)::int from public.fields where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0,
  'admin1 no ve el campo de Org 2'
);

select lives_ok(
  $$ insert into public.fields (organization_id, name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Campo Este') $$,
  'admin1 puede crear campos en su organización'
);

select throws_ok(
  $$ insert into public.fields (organization_id, name) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Intento cruzado') $$,
  'new row violates row-level security policy for table "fields"',
  'admin1 NO puede crear un campo en la organización ajena'
);

select is(
  (select count(*)::int from public.tasks),
  1,
  'admin1 ve las tareas de su organización (incluida la del operario)'
);

-- ── Como oper1 (operario, Org 1) ─────────────────────────────────────────
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ insert into public.fields (organization_id, name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Campo de operario') $$,
  'new row violates row-level security policy for table "fields"',
  'un operario NO puede crear campos (solo admin)'
);

select lives_ok(
  $$ insert into public.tasks (plot_id, task_type_id, user_id, quantity, unit)
     select 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', id, '22222222-2222-2222-2222-222222222222', 10, 'litros'
     from public.task_types where name = 'Aplicación herbicida' and organization_id is null $$,
  'un operario puede crear una tarea a su propio nombre'
);

select throws_ok(
  $$ insert into public.tasks (plot_id, task_type_id, user_id, quantity, unit)
     select 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', id, '11111111-1111-1111-1111-111111111111', 10, 'litros'
     from public.task_types where name = 'Aplicación herbicida' and organization_id is null $$,
  'new row violates row-level security policy for table "tasks"',
  'un operario NO puede crear una tarea a nombre de otro usuario'
);

-- No se verifica un mensaje puntual acá a propósito: lo que realmente
-- pasa es que el trigger set_task_organization() hace un SELECT sobre
-- plots para resolver organization_id, y ese SELECT ya respeta la RLS
-- de plots (oper1 no puede ver el lote de Org 2) — la fila "no existe"
-- desde su perspectiva y el trigger frena ahí, antes de siquiera llegar
-- a evaluar la policy de tasks. Es defensa en profundidad, y de paso el
-- mensaje no revela que el lote existe en otra organización.
-- pgTAP compara errm por igualdad exacta (no LIKE/regex), por eso va
-- el mensaje completo tal cual lo arma el RAISE EXCEPTION del trigger.
select throws_ok(
  $$ insert into public.tasks (plot_id, task_type_id, user_id, quantity, unit)
     select 'ffffffff-ffff-ffff-ffff-ffffffffffff', id, '22222222-2222-2222-2222-222222222222', 10, 'litros'
     from public.task_types where name = 'Aplicación herbicida' and organization_id is null $$,
  'plot_id ffffffff-ffff-ffff-ffff-ffffffffffff no corresponde a ningún lote válido',
  'un operario NO puede crear una tarea en un lote de otra organización'
);

-- ── Como admin2 (Org 2) — aislamiento total ─────────────────────────────
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*)::int from public.tasks),
  0,
  'admin2 no ve ninguna tarea de Org 1'
);

-- subscriptions no tiene NINGUNA policy de insert/update/delete (0002),
-- así que para el UPDATE no hay ninguna fila "visible" para esa acción:
-- Postgres no tira una excepción de RLS en este caso (no hay policy que
-- "viole"), simplemente filtra a 0 filas antes de tocar nada. Por eso se
-- verifica "0 filas afectadas" con una CTE de escritura, en vez de
-- throws_ok — la garantía de seguridad es la misma (nadie modifica
-- subscriptions desde el cliente), pero el mecanismo con el que Postgres
-- la hace cumplir es distinto de las demás tablas.
-- Postgres exige que un WITH con una sentencia que modifica datos esté
-- al nivel superior de la consulta (no como subquery dentro de otra
-- función) — por eso el CTE envuelve directo el select de is(), en vez
-- de ir anidado como argumento.
with updated as (
  update public.subscriptions set status = 'active'
  where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  returning 1
)
select is(
  (select count(*)::int from updated),
  0,
  'ni siquiera un admin puede modificar subscriptions directamente (solo backend/service role) — 0 filas afectadas por RLS'
);

select * from finish();
rollback;
