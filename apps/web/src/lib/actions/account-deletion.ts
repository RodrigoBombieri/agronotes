"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/actions/types";

// apps/web/src/lib/actions/account-deletion.ts — Etapa 6 (2026-08-16).
//
// requestAccountDeletion: acción PÚBLICA, sin chequeo de sesión a
// propósito. Google Play exige que el pedido de baja funcione incluso sin
// poder iniciar sesión (contraseña olvidada, app desinstalada, etc.), así
// que esta acción se llama desde /legal/eliminar-cuenta con el cliente
// normal (anon key) — la policy de RLS de account_deletion_requests
// permite el insert a cualquiera, ver la migración. No hace falta más
// validación acá que un email con forma de email; el resto lo revisa
// Rodrigo a mano desde /admin.
export async function requestAccountDeletion(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresá un email válido.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("account_deletion_requests").insert({
    email,
    reason: reason || null,
  });

  if (error) {
    return {
      error: "No se pudo enviar el pedido, intentá de nuevo en unos minutos.",
      ok: false,
    };
  }

  return { error: null, ok: true };
}

// markDeletionRequestDone: esta sí requiere ser platform_admin — se llama
// solo desde /admin, que ya está gateado por AdminLayout, pero igual se
// revalida acá porque una Server Action es un endpoint HTTP más, alcanzable
// por cualquiera que arme el POST a mano.
export async function markDeletionRequestDone(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el id del pedido.", ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: isAdmin } = user
    ? await admin.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle()
    : { data: null };

  if (!isAdmin) {
    return { error: "No tenés permiso para esto.", ok: false };
  }

  const { error } = await admin
    .from("account_deletion_requests")
    .update({ status: "done", processed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "No se pudo marcar como resuelto.", ok: false };
  }

  revalidatePath("/admin");
  return { error: null, ok: true };
}
