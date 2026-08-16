alter table public.subscriptions
  add column contracted_fields_count integer;

comment on column public.subscriptions.contracted_fields_count is
  'Cantidad de campos activos usada para calcular el monto contratado la última vez que se creó/actualizó la preapproval de Mercado Pago (Etapa 6, 2026-08-16). Se compara contra la cantidad de campos activos actual para saber si el monto mensual está desactualizado.';
