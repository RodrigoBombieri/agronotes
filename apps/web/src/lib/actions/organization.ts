"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

// apps/web/src/lib/actions/organization.ts — Etapa 6 (2026-08-16).
//
// Segundo paso del alta de una organización nueva (el primero es el
// registro de la cuenta en `/signup`). Llama a la función de Postgres
// `create_organization_and_owner(org_name)` (migración
// 0004_signup_function.sql, ya existía de antes), que en una sola
// transacción: crea la fila en `organizations`, crea la fila del usuario
// que llama en `public.users` con rol "admin", y le da un período de
// prueba de 14 días en `subscriptions`. La función valida que quien llama
// esté autenticado y que todavía no tenga fila en `public.users` — si ya
// la tiene, tira una excepción (se traduce acá abajo).
export async function createOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orgName = String(formData.get("orgName") ?? "").trim();
  if (!orgName) {
    return { error: "Poné un nombre para tu organización.", ok: false };
  }
  if (orgName.length > 120) {
    return { error: "El nombre es demasiado largo.", ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión expiró, volvé a iniciar sesión.", ok: false };
  }

  const { error } = await supabase.rpc("create_organization_and_owner", {
    org_name: orgName,
  });

  if (error) {
    if (error.message.includes("ya pertenece")) {
      // Ya tiene organización (por ejemplo, volvió a esta página después de
      // haberla creado en otra pestaña) — no es un error real, la mandamos
      // directo al panel.
      redirect("/");
    }
    return {
      error: "No se pudo crear la organización, intentá de nuevo.",
      ok: false,
    };
  }

  redirect("/");
}
