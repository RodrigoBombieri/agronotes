"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

// apps/web/src/lib/actions/users.ts — Etapa 6 (2026-08-16).
//
// Alta y gestión de usuarios de la organización. La invitación pasa por la
// Edge Function `invite-user`, que existía desde la Etapa 3 pero hasta
// ahora no la llamaba nadie: no había pantalla desde donde invitar, así que
// el único modo de sumar un empleado era crear el usuario a mano en el
// panel de Supabase.

function fail(error: string): ActionState {
  return { error, ok: false };
}

const success: ActionState = { error: null, ok: true };

const ROLES = new Set(["admin", "operario"]);

export async function inviteUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "operario");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Poné un email válido.");
  }
  if (!ROLES.has(role)) return fail("El rol tiene que ser admin u operario.");

  const supabase = await createClient();
  const { error } = await supabase.functions.invoke("invite-user", {
    body: { email, fullName: fullName || undefined, role },
  });

  if (error) {
    // La Edge Function devuelve el motivo real en el body (por ejemplo
    // "Ese email ya pertenece a un usuario de esta organización"); sin
    // esto el usuario solo vería un "failed to send a request".
    let message = "No se pudo enviar la invitación. Probá de nuevo en un momento.";
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = (await context.json()) as { error?: { message?: string } };
        if (body?.error?.message) message = body.error.message;
      } catch {
        // Respuesta sin JSON válido, nos quedamos con el mensaje genérico.
      }
    }
    return fail(message);
  }

  revalidatePath("/usuarios");
  return success;
}

export async function updateUserRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!id) return fail("Falta el usuario a modificar.");
  if (!ROLES.has(role)) return fail("El rol tiene que ser admin u operario.");

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", id);

  if (error) {
    if (error.code === "42501") {
      return fail("Solo un admin de la organización puede cambiar roles.");
    }
    return fail(error.message);
  }

  revalidatePath("/usuarios");
  return success;
}

/**
 * Baja lógica de un usuario: deja de aparecer en el panel y no puede
 * seguir operando. No se borra el registro para no perder la autoría de
 * las tareas que ya cargó (`tasks.user_id` lo sigue referenciando).
 */
export async function deactivateUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Falta el usuario a dar de baja.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (error.code === "42501") {
      return fail("Solo un admin de la organización puede dar de baja usuarios.");
    }
    return fail(error.message);
  }

  revalidatePath("/usuarios");
  return success;
}
