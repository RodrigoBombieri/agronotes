-- 0003_seed_task_types.sql
-- Catálogo global de task_types confirmado en la Etapa 1.
-- organization_id null = disponible para todas las organizaciones.

insert into public.task_types (organization_id, name, default_unit) values
  (null, 'Aplicación herbicida',   'litros'),
  (null, 'Aplicación fungicida',   'litros'),
  (null, 'Aplicación insecticida', 'litros'),
  (null, 'Siembra',                'hectáreas'),
  (null, 'Cosecha',                'hectáreas'),
  (null, 'Carga de combustible',   'litros'),
  (null, 'Otro',                   'unidad');
