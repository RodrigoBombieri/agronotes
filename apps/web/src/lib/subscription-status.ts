// apps/web/src/lib/subscription-status.ts
//
// Constantes compartidas entre las páginas que muestran el estado de la
// suscripción (panel normal /suscripcion y panel superadmin /admin), para
// no duplicar el mapeo de estados en dos archivos.
//
// PRICE_PER_FIELD_ARS: ARS 15.000 por campo activo al mes (decisión de
// producto, 2026-08-16, ver planificador.md Etapa 6). Este valor también
// está duplicado en las Edge Functions `create-subscription` y
// `update-subscription-amount` (Deno no puede importar código TypeScript
// del repo web) — si cambia el precio hay que actualizar los 3 lugares y
// volver a desplegar las funciones.

export const PRICE_PER_FIELD_ARS = 15000;

export const STATUS_LABELS: Record<string, string> = {
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago vencido",
  canceled: "Cancelada",
  sin_suscripcion: "Sin suscripción",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
