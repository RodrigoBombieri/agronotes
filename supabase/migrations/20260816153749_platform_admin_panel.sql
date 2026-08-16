-- 20260816153749_platform_admin_panel.sql
-- Tablas de soporte para el panel superadmin (fuera del alcance normal de
-- RLS por organización): quién puede entrar, y el historial de eventos de
-- pago que hoy no se guardaba en ningún lado (subscriptions solo tiene el
-- estado actual). Ninguna de las dos tiene policies para anon/authenticated
-- a propósito -- con RLS habilitado y cero policies, PostgREST devuelve 0
-- filas para cualquier rol que no sea service_role. Solo se accede desde
-- código server-side (Route Handlers/Server Components) usando la service
-- role key, nunca desde el cliente.

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

comment on table public.platform_admins is
  'Usuarios con acceso al panel superadmin (fuera de la organización). Sin policies: solo service role.';

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  provider text not null default 'mercado_pago' check (provider in ('mercado_pago', 'stripe')),
  provider_event_id text,
  resulting_status text,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;

create index payment_events_organization_id_idx on public.payment_events (organization_id);
create index payment_events_received_at_idx on public.payment_events (received_at desc);

comment on table public.payment_events is
  'Historial crudo de notificaciones de pago recibidas (hoy solo Mercado Pago). Sin policies: solo service role.';
