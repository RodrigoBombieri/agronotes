-- 0001_init_schema.sql
-- Cuaderno de Campo Digital — esquema inicial (Etapa 2)
--
-- Convenciones:
--   * Todas las PK son uuid. gen_random_uuid() es nativo desde Postgres 13,
--     pero se habilita pgcrypto igual por compatibilidad.
--   * Todas las tablas "de tenant" llevan organization_id denormalizado
--     (incluso plots/tasks, que podrían derivarlo por join) para que las
--     políticas RLS de la Etapa 3 sean de una sola columna, sin joins.
--   * updated_at se mantiene con un trigger genérico (set_updated_at).
--   * Nada se borra en duro desde el cliente: fields/plots/task_types/tasks
--     usan deleted_at (soft delete) para no romper el historial de tareas
--     ya registradas contra un lote o tipo que después se da de baja.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────────────────────────────────
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- users
-- 1:1 con auth.users. El id ES el id de Supabase Auth (no uno propio),
-- así evitamos una tabla de mapeo y auth.uid() alcanza para todo.
-- ─────────────────────────────────────────────────────────────────────────
create table public.users (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text not null,
  full_name       text,
  role            text not null default 'operario' check (role in ('admin', 'operario')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index users_organization_id_idx on public.users (organization_id);

-- ─────────────────────────────────────────────────────────────────────────
-- fields (campos)
-- ─────────────────────────────────────────────────────────────────────────
create table public.fields (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index fields_organization_id_idx on public.fields (organization_id);

-- nombre único por organización, pero solo entre campos activos
-- (permite reusar un nombre si el campo anterior se dio de baja)
create unique index fields_org_name_active_key
  on public.fields (organization_id, name)
  where deleted_at is null;

-- ─────────────────────────────────────────────────────────────────────────
-- plots (lotes)
-- ─────────────────────────────────────────────────────────────────────────
create table public.plots (
  id              uuid primary key default gen_random_uuid(),
  field_id        uuid not null references public.fields (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  hectares        numeric(10, 2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index plots_field_id_idx on public.plots (field_id);
create index plots_organization_id_idx on public.plots (organization_id);

create unique index plots_field_name_active_key
  on public.plots (field_id, name)
  where deleted_at is null;

-- organization_id se completa solo a partir del campo (ver trigger más abajo),
-- así el cliente nunca puede mandar un organization_id que no le corresponde.
create or replace function public.set_plot_organization()
returns trigger
language plpgsql
as $$
begin
  select organization_id into new.organization_id
  from public.fields
  where id = new.field_id;

  if new.organization_id is null then
    raise exception 'field_id % no corresponde a ningún campo válido', new.field_id;
  end if;

  return new;
end;
$$;

create trigger plots_set_organization
  before insert or update of field_id on public.plots
  for each row execute function public.set_plot_organization();

-- ─────────────────────────────────────────────────────────────────────────
-- task_types (catálogo)
-- organization_id null = catálogo global (seed, Etapa 2); organization_id
-- con valor = tipo custom de esa organización (personalización a futuro).
-- ─────────────────────────────────────────────────────────────────────────
create table public.task_types (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  name            text not null,
  default_unit    text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index task_types_organization_id_idx on public.task_types (organization_id);

-- nombre único entre los tipos globales...
create unique index task_types_global_name_key
  on public.task_types (name)
  where organization_id is null;

-- ...y nombre único dentro de los custom de cada organización
create unique index task_types_org_name_key
  on public.task_types (organization_id, name)
  where organization_id is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- tasks (registros)
--
-- Estrategia de IDs offline (decisión de Etapa 2): el id de la tarea LO
-- GENERA EL DISPOSITIVO (uuid random) en el momento de crear el registro
-- offline, y viaja como primary key tal cual al servidor. No existe un
-- "local_id" separado ni remapeo de IDs: local_id === id. Esto simplifica
-- la cola de sync del cliente (Etapa 5) porque no hay que reconciliar un
-- id local contra uno de servidor después de sincronizar.
--
-- La sincronización se hace con upsert (insert ... on conflict (id) do
-- update), que da automáticamente:
--   1) idempotencia si el dispositivo reintenta el mismo envío, y
--   2) "last-write-wins" si dos escrituras compiten por el mismo id.
--
-- sync_status/synced_at NO existen en esta tabla: son estado del
-- almacenamiento local (SQLite) en el dispositivo, no del servidor. Una
-- fila que existe acá ya está, por definición, sincronizada.
-- ─────────────────────────────────────────────────────────────────────────
create table public.tasks (
  id              uuid primary key default gen_random_uuid(), -- generado en el device
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plot_id         uuid not null references public.plots (id) on delete restrict,
  task_type_id    uuid not null references public.task_types (id) on delete restrict,
  user_id         uuid not null references public.users (id) on delete restrict,
  quantity        numeric(12, 2) not null check (quantity > 0),
  unit            text not null,
  note            text,
  occurred_at     timestamptz not null default now(), -- cuándo pasó la tarea
  created_at      timestamptz not null default now(), -- cuándo se guardó en el servidor
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz -- anulación de un registro erróneo, sin borrar el historial
);

create index tasks_organization_id_idx on public.tasks (organization_id);
create index tasks_plot_id_idx on public.tasks (plot_id);
create index tasks_task_type_id_idx on public.tasks (task_type_id);
create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_org_occurred_at_idx on public.tasks (organization_id, occurred_at desc);

-- organization_id se completa solo a partir del lote, mismo motivo que en plots.
create or replace function public.set_task_organization()
returns trigger
language plpgsql
as $$
begin
  select organization_id into new.organization_id
  from public.plots
  where id = new.plot_id;

  if new.organization_id is null then
    raise exception 'plot_id % no corresponde a ningún lote válido', new.plot_id;
  end if;

  return new;
end;
$$;

create trigger tasks_set_organization
  before insert or update of plot_id on public.tasks
  for each row execute function public.set_task_organization();

-- ─────────────────────────────────────────────────────────────────────────
-- subscriptions
-- Gestionada solo por el backend (webhook de Stripe/Mercado Pago vía Edge
-- Function con service role) — ver políticas RLS en 0002, no hay insert/
-- update/delete permitido desde el cliente.
-- ─────────────────────────────────────────────────────────────────────────
create table public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null unique references public.organizations (id) on delete cascade,
  provider                  text not null check (provider in ('stripe', 'mercado_pago')),
  provider_customer_id      text,
  provider_subscription_id  text,
  status                    text not null default 'trialing'
                              check (status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_end        timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at genérico
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger fields_set_updated_at before update on public.fields
  for each row execute function public.set_updated_at();
create trigger plots_set_updated_at before update on public.plots
  for each row execute function public.set_updated_at();
create trigger task_types_set_updated_at before update on public.task_types
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
