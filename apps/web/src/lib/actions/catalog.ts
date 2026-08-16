"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { ActionState } from "@/lib/actions/types";

// apps/web/src/lib/actions/catalog.ts — Etapa 6 (2026-08-16).
//
// Server Actions del ABM de catálogo. Hasta esta ronda el panel web era
// 100% de solo lectura: no había una sola escritura en todo `apps/web`, así
// que un cliente no podía crear ni un campo ni un lote sin que alguien se
// los cargara a mano en la base. Esto es lo que cierra ese hueco.
//
// No hay chequeo de rol acá a propósito: la autorización real la hacen las
// policies de RLS (`is_admin()` + `current_org_can_write()`), que valen
// igual para el panel, para la app mobile y para cualquiera que llame a la
// API con un token. Lo único que hacemos con el error es traducirlo a algo
// legible en castellano.

// `ActionState` y `initialActionState` viven en actions/types.ts, no acá:
// un módulo `"use server"` solo puede exportar funciones async, cualquier
// otra cosa que exporte se convierte en una referencia de servidor en vez
// del valor real.
function fail(error: string): ActionState {
  return { error, ok: false };
}

const success: ActionState = { error: null, ok: true };

function translate(error: PostgrestError | null): string | null {
  if (!error) return null;
  // 42501 = violación de policy de RLS. Son los dos casos reales: no sos
  // admin, o la suscripción de la organización está vencida/cancelada
  // (modo solo lectura). No podemos distinguirlos desde acá sin otra
  // consulta, así que nombramos los dos.
  if (error.code === "42501") {
    return "No tenés permiso para esto. Tenés que ser admin de la organización, y la suscripción no puede estar vencida ni cancelada.";
  }
  if (error.code === "23505") return "Ya existe otro con ese nombre.";
  if (error.code === "23503") return "No se puede: hay datos que dependen de esto.";
  return error.message;
}

/**
 * Devuelve la organización del usuario logueado, o el motivo por el que no
 * se pudo determinar. Se devuelve `organizationId: string | null` y se
 * chequea contra null en el llamador (en vez de un union discriminado por
 * `error`): con un union, TypeScript no puede descartar la rama de error
 * con un `if (org.error)`, porque un string vacío también es falsy.
 */
async function currentOrganizationId(): Promise<{
  organizationId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { organizationId: null, error: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { organizationId: null, error: "No se encontró tu perfil de usuario." };
  }
  return { organizationId: profile.organization_id, error: null };
}

// ---------------------------------------------------------------- campos

export async function createField(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("Poné un nombre para el campo.");

  const org = await currentOrganizationId();
  if (!org.organizationId) return fail(org.error ?? "No se pudo determinar tu organización.");

  const supabase = await createClient();
  // `fields.organization_id` no tiene trigger que lo complete (a diferencia
  // de plots y tasks, que lo derivan del padre), así que va explícito. La
  // policy verifica igual que coincida con la organización del que llama.
  const { error } = await supabase
    .from("fields")
    .insert({ organization_id: org.organizationId, name });

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath("/campos");
  revalidatePath("/suscripcion");
  return success;
}

export async function renameField(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return fail("Falta el campo a renombrar.");
  if (!name) return fail("Poné un nombre para el campo.");

  const supabase = await createClient();
  const { error } = await supabase.from("fields").update({ name }).eq("id", id);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath("/campos");
  revalidatePath(`/campos/${id}`);
  return success;
}

/**
 * Baja lógica de un campo. Da de baja también sus lotes: si no, quedarían
 * "huérfanos" pero visibles, porque tanto el panel como la app mobile
 * filtran los lotes por su propio `deleted_at` y no miran el del campo.
 * Las tareas ya registradas no se tocan nunca — son historial.
 */
export async function archiveField(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Falta el campo a dar de baja.");

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: plotsError } = await supabase
    .from("plots")
    .update({ deleted_at: now })
    .eq("field_id", id)
    .is("deleted_at", null);

  const plotsMessage = translate(plotsError);
  if (plotsMessage) return fail(plotsMessage);

  const { error } = await supabase
    .from("fields")
    .update({ deleted_at: now })
    .eq("id", id);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath("/campos");
  revalidatePath("/suscripcion");
  return success;
}

// ----------------------------------------------------------------- lotes

function parseHectares(raw: FormDataEntryValue | null): number | null | "invalid" {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed) || parsed < 0) return "invalid";
  return parsed;
}

export async function createPlot(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fieldId = String(formData.get("fieldId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hectares = parseHectares(formData.get("hectares"));

  if (!fieldId) return fail("Falta el campo al que pertenece el lote.");
  if (!name) return fail("Poné un nombre para el lote.");
  if (hectares === "invalid") return fail("Las hectáreas tienen que ser un número mayor o igual a 0.");

  const supabase = await createClient();
  // `organization_id` no se manda: lo completa el trigger
  // `plots_set_organization` a partir del campo, para que el cliente no
  // pueda meter un lote en otra organización. Los tipos generados por
  // Supabase no saben de triggers y lo marcan obligatorio — de ahí el
  // `Omit` + cast puntual (mismo patrón que el upsert de tareas en mobile).
  type PlotInsert = Database["public"]["Tables"]["plots"]["Insert"];
  const payload: Omit<PlotInsert, "organization_id"> = { field_id: fieldId, name, hectares };
  const { error } = await supabase.from("plots").insert(payload as PlotInsert);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath(`/campos/${fieldId}`);
  return success;
}

export async function updatePlot(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const fieldId = String(formData.get("fieldId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hectares = parseHectares(formData.get("hectares"));

  if (!id) return fail("Falta el lote a editar.");
  if (!name) return fail("Poné un nombre para el lote.");
  if (hectares === "invalid") return fail("Las hectáreas tienen que ser un número mayor o igual a 0.");

  const supabase = await createClient();
  const { error } = await supabase.from("plots").update({ name, hectares }).eq("id", id);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath(`/campos/${fieldId}`);
  return success;
}

export async function archivePlot(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const fieldId = String(formData.get("fieldId") ?? "");
  if (!id) return fail("Falta el lote a dar de baja.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("plots")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath(`/campos/${fieldId}`);
  revalidatePath("/campos");
  return success;
}

// -------------------------------------------------------- tipos de tarea

export async function createTaskType(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const defaultUnit = String(formData.get("defaultUnit") ?? "").trim();

  if (!name) return fail("Poné un nombre para el tipo de tarea.");
  if (!defaultUnit) return fail("Poné una unidad por defecto (ej: litros, kg, hectáreas).");

  const org = await currentOrganizationId();
  if (!org.organizationId) return fail(org.error ?? "No se pudo determinar tu organización.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_types")
    .insert({ organization_id: org.organizationId, name, default_unit: defaultUnit });

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath("/tipos");
  return success;
}

export async function updateTaskType(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const defaultUnit = String(formData.get("defaultUnit") ?? "").trim();

  if (!id) return fail("Falta el tipo de tarea a editar.");
  if (!name) return fail("Poné un nombre para el tipo de tarea.");
  if (!defaultUnit) return fail("Poné una unidad por defecto.");

  const supabase = await createClient();
  // La policy de UPDATE exige `organization_id = current_org_id()`, así que
  // un intento de editar un tipo global (organization_id null) falla del
  // lado del servidor aunque alguien fuerce el id a mano.
  const { error } = await supabase
    .from("task_types")
    .update({ name, default_unit: defaultUnit })
    .eq("id", id);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath("/tipos");
  return success;
}

export async function archiveTaskType(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Falta el tipo de tarea a dar de baja.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_types")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  const message = translate(error);
  if (message) return fail(message);

  revalidatePath("/tipos");
  return success;
}
