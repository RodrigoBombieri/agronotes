// supabase/functions/update-subscription-amount/index.ts
//
// Recalcula el monto mensual contratado en Mercado Pago según la cantidad
// actual de campos activos de la organización (ARS 15.000 por campo) y le
// pide a la API de Mercado Pago que actualice el auto_recurring de la
// preapproval ya creada. Decisión de producto (2026-08-16): el recálculo
// es manual — el admin lo dispara desde el panel (/suscripcion) cuando la
// cantidad de campos contratada (subscriptions.contracted_fields_count) no
// coincide con la cantidad de campos activos actual. Ver planificador.md
// Etapa 6.
//
// PRICE_PER_FIELD_ARS duplicado acá, en create-subscription/index.ts y en
// apps/web/src/lib/subscription-status.ts — si cambia el precio hay que
// actualizar los 3 lugares y volver a desplegar.
//
// Header requerido: Authorization: Bearer <jwt del usuario admin>
//
// Deploy: supabase functions deploy update-subscription-amount

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "./_shared/responses.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

const PRICE_PER_FIELD_ARS = 15000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("VALIDATION_ERROR", "Método no soportado, usar POST");
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("UNAUTHENTICATED", "Falta el header Authorization");
  }

  const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await asUser.auth.getUser();
  if (authError || !authData?.user) {
    return errorResponse("UNAUTHENTICATED", "Token inválido o expirado");
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: callerProfile, error: callerProfileError } = await admin
    .from("users")
    .select("organization_id, role")
    .eq("id", authData.user.id)
    .single();

  if (callerProfileError || !callerProfile) {
    return errorResponse("FORBIDDEN", "El usuario no pertenece a ninguna organización");
  }
  if (callerProfile.role !== "admin") {
    return errorResponse("FORBIDDEN", "Solo un admin puede gestionar la suscripción");
  }

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("provider_subscription_id, contracted_fields_count")
    .eq("organization_id", callerProfile.organization_id)
    .single();

  if (subscriptionError || !subscription?.provider_subscription_id) {
    return errorResponse("NOT_FOUND", "Todavía no te suscribiste, no hay nada que actualizar");
  }

  const { count: fieldsCount } = await admin
    .from("fields")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", callerProfile.organization_id)
    .is("deleted_at", null);

  const activeFields = fieldsCount ?? 0;

  if (activeFields === 0) {
    return errorResponse(
      "VALIDATION_ERROR",
      "No podés quedarte sin campos activos con una suscripción en curso",
    );
  }

  if (activeFields === subscription.contracted_fields_count) {
    return jsonResponse(
      { updated: false, amount: PRICE_PER_FIELD_ARS * activeFields, fieldsCount: activeFields },
      200,
    );
  }

  const amount = PRICE_PER_FIELD_ARS * activeFields;

  const mpResponse = await fetch(
    `https://api.mercadopago.com/preapproval/${subscription.provider_subscription_id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auto_recurring: { transaction_amount: amount, currency_id: "ARS" },
      }),
    },
  );

  if (!mpResponse.ok) {
    const errorBody = await mpResponse.text();
    console.error("Mercado Pago rechazó la actualización del monto:", mpResponse.status, errorBody);
    return errorResponse("INTERNAL_ERROR", "Mercado Pago no pudo actualizar el monto, intentá de nuevo");
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({ contracted_fields_count: activeFields })
    .eq("organization_id", callerProfile.organization_id);

  if (updateError) {
    console.error("No se pudo guardar contracted_fields_count (no bloqueante):", updateError.message);
  }

  return jsonResponse({ updated: true, amount, fieldsCount: activeFields }, 200);
});
