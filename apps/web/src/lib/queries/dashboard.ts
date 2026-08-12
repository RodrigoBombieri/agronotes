import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const RECENT_WINDOW_DAYS = 30;

export type DashboardSummary = {
  totalTareas: number;
  tareasUltimos7Dias: number;
  porTipo: { nombre: string; cantidad: number }[];
  recientes: {
    id: string;
    occurredAt: string;
    tipo: string;
    lote: string;
    campo: string;
    usuario: string;
    quantity: number;
    unit: string;
  }[];
};

export async function getDashboardSummary(
  supabase: SupabaseClient<Database>,
): Promise<DashboardSummary> {
  const since = new Date();
  since.setDate(since.getDate() - RECENT_WINDOW_DAYS);
  const sinceIso = since.toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ count: totalTareas }, { count: tareasUltimos7Dias }, { data: recientesRaw }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("occurred_at", sevenDaysAgo.toISOString()),
      supabase
        .from("tasks")
        .select(
          "id, occurred_at, quantity, unit, task_types(name), plots(name, fields(name)), users(full_name, email)",
        )
        .is("deleted_at", null)
        .gte("occurred_at", sinceIso)
        .order("occurred_at", { ascending: false })
        .limit(500),
    ]);

  const rows = recientesRaw ?? [];

  const porTipoMap = new Map<string, number>();
  for (const row of rows) {
    const nombre = row.task_types?.name ?? "Sin tipo";
    porTipoMap.set(nombre, (porTipoMap.get(nombre) ?? 0) + 1);
  }
  const porTipo = [...porTipoMap.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6);

  const recientes = rows.slice(0, 10).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    tipo: row.task_types?.name ?? "Sin tipo",
    lote: row.plots?.name ?? "—",
    campo: row.plots?.fields?.name ?? "—",
    usuario: row.users?.full_name ?? row.users?.email ?? "—",
    quantity: row.quantity,
    unit: row.unit,
  }));

  return {
    totalTareas: totalTareas ?? 0,
    tareasUltimos7Dias: tareasUltimos7Dias ?? 0,
    porTipo,
    recientes,
  };
}
