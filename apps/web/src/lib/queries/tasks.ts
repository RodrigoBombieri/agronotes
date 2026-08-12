import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const PAGE_SIZE = 25;

export type TaskFilters = {
  fieldId?: string;
  plotId?: string;
  taskTypeId?: string;
  userId?: string;
  from?: string;
  to?: string;
  page: number;
};

export type TaskRow = {
  id: string;
  occurredAt: string;
  tipo: string;
  unit: string;
  quantity: number;
  campo: string;
  lote: string;
  usuario: string;
  note: string | null;
};

export async function getTasksPage(
  supabase: SupabaseClient<Database>,
  filters: TaskFilters,
): Promise<{ rows: TaskRow[]; count: number }> {
  const from = filters.page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("tasks")
    .select(
      "id, occurred_at, quantity, unit, note, task_types(name), plots!inner(name, field_id, fields(name)), users(full_name, email)",
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (filters.plotId) query = query.eq("plot_id", filters.plotId);
  if (filters.taskTypeId) query = query.eq("task_type_id", filters.taskTypeId);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.from) query = query.gte("occurred_at", filters.from);
  if (filters.to) query = query.lte("occurred_at", filters.to);
  if (filters.fieldId) query = query.eq("plots.field_id", filters.fieldId);

  const { data, count, error } = await query
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const rows: TaskRow[] = (data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    tipo: row.task_types?.name ?? "Sin tipo",
    unit: row.unit,
    quantity: row.quantity,
    campo: row.plots?.fields?.name ?? "—",
    lote: row.plots?.name ?? "—",
    usuario: row.users?.full_name ?? row.users?.email ?? "—",
    note: row.note,
  }));

  return { rows, count: count ?? 0 };
}

export async function getTasksForExport(
  supabase: SupabaseClient<Database>,
  filters: Omit<TaskFilters, "page">,
  limit = 5000,
): Promise<TaskRow[]> {
  let query = supabase
    .from("tasks")
    .select(
      "id, occurred_at, quantity, unit, note, task_types(name), plots!inner(name, field_id, fields(name)), users(full_name, email)",
    )
    .is("deleted_at", null);

  if (filters.plotId) query = query.eq("plot_id", filters.plotId);
  if (filters.taskTypeId) query = query.eq("task_type_id", filters.taskTypeId);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.from) query = query.gte("occurred_at", filters.from);
  if (filters.to) query = query.lte("occurred_at", filters.to);
  if (filters.fieldId) query = query.eq("plots.field_id", filters.fieldId);

  const { data, error } = await query.order("occurred_at", { ascending: false }).limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    tipo: row.task_types?.name ?? "Sin tipo",
    unit: row.unit,
    quantity: row.quantity,
    campo: row.plots?.fields?.name ?? "—",
    lote: row.plots?.name ?? "—",
    usuario: row.users?.full_name ?? row.users?.email ?? "—",
    note: row.note,
  }));
}

export type FilterOptions = {
  fields: { id: string; name: string }[];
  plots: { id: string; name: string; fieldId: string }[];
  taskTypes: { id: string; name: string }[];
  users: { id: string; name: string }[];
};

export async function getFilterOptions(
  supabase: SupabaseClient<Database>,
): Promise<FilterOptions> {
  const [{ data: fields }, { data: plots }, { data: taskTypes }, { data: users }] =
    await Promise.all([
      supabase.from("fields").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("plots").select("id, name, field_id").is("deleted_at", null).order("name"),
      supabase.from("task_types").select("id, name").order("name"),
      supabase.from("users").select("id, full_name, email").is("deleted_at", null).order("full_name"),
    ]);

  return {
    fields: fields ?? [],
    plots: (plots ?? []).map((p) => ({ id: p.id, name: p.name, fieldId: p.field_id })),
    taskTypes: taskTypes ?? [],
    users: (users ?? []).map((u) => ({ id: u.id, name: u.full_name ?? u.email })),
  };
}
