import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// apps/web/src/lib/queries/catalog.ts — Etapa 6 (2026-08-16).
//
// Lecturas del ABM de catálogo (campos, lotes, tipos de tarea, usuarios).
// Se usa el cliente normal con RLS, no el de service role: las policies ya
// acotan todo a la organización del usuario logueado, así que no hace falta
// (ni conviene) saltearlas acá.
//
// Los conteos se resuelven en memoria a propósito: una organización tiene
// decenas de campos y lotes, no miles, y traerlos todos en una consulta es
// más simple y más barato que armar agregaciones por SQL o una vista.

export type Viewer = {
  userId: string;
  organizationId: string;
  isAdmin: boolean;
};

export async function getViewer(
  supabase: SupabaseClient<Database>,
): Promise<Viewer | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    isAdmin: profile.role === "admin",
  };
}

export type FieldRow = {
  id: string;
  name: string;
  plotsCount: number;
};

export async function getFields(
  supabase: SupabaseClient<Database>,
): Promise<FieldRow[]> {
  const [{ data: fields }, { data: plots }] = await Promise.all([
    supabase.from("fields").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("plots").select("id, field_id").is("deleted_at", null),
  ]);

  const plotsByField = new Map<string, number>();
  for (const plot of plots ?? []) {
    plotsByField.set(plot.field_id, (plotsByField.get(plot.field_id) ?? 0) + 1);
  }

  return (fields ?? []).map((field) => ({
    id: field.id,
    name: field.name,
    plotsCount: plotsByField.get(field.id) ?? 0,
  }));
}

export type PlotRow = {
  id: string;
  name: string;
  hectares: number | null;
  tasksCount: number;
};

export type FieldDetail = {
  id: string;
  name: string;
  plots: PlotRow[];
};

export async function getFieldDetail(
  supabase: SupabaseClient<Database>,
  fieldId: string,
): Promise<FieldDetail | null> {
  const { data: field } = await supabase
    .from("fields")
    .select("id, name")
    .eq("id", fieldId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!field) return null;

  const { data: plots } = await supabase
    .from("plots")
    .select("id, name, hectares")
    .eq("field_id", fieldId)
    .is("deleted_at", null)
    .order("name");

  const plotIds = (plots ?? []).map((plot) => plot.id);
  const tasksByPlot = new Map<string, number>();

  if (plotIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("plot_id")
      .in("plot_id", plotIds)
      .is("deleted_at", null);

    for (const task of tasks ?? []) {
      tasksByPlot.set(task.plot_id, (tasksByPlot.get(task.plot_id) ?? 0) + 1);
    }
  }

  return {
    id: field.id,
    name: field.name,
    plots: (plots ?? []).map((plot) => ({
      id: plot.id,
      name: plot.name,
      hectares: plot.hectares,
      tasksCount: tasksByPlot.get(plot.id) ?? 0,
    })),
  };
}

export type TaskTypeRow = {
  id: string;
  name: string;
  defaultUnit: string;
  isGlobal: boolean;
};

/**
 * Devuelve los tipos globales (que vienen con el producto y no se tocan) y
 * los propios de la organización, juntos y marcados. La policy de SELECT ya
 * deja ver ambos; lo único que hacemos acá es distinguirlos para la UI.
 */
export async function getTaskTypes(
  supabase: SupabaseClient<Database>,
): Promise<TaskTypeRow[]> {
  const { data } = await supabase
    .from("task_types")
    .select("id, name, default_unit, organization_id")
    .is("deleted_at", null)
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    defaultUnit: row.default_unit,
    isGlobal: row.organization_id === null,
  }));
}

export type OrgUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isSelf: boolean;
};

export async function getOrgUsers(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<OrgUserRow[]> {
  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .is("deleted_at", null)
    .order("email");

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isSelf: row.id === viewerId,
  }));
}
