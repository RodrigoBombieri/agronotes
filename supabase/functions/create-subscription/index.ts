// supabase/functions/create-subscription/index.ts
//
// Crea (o reintenta) el alta de una suscripción recurrente ("preapproval")
// en Mercado Pago para la organización del usuario que llama. Devuelve la
// URL de checkout (`init_point`) a la que el cliente debe redirigir al
// usuario para completar el pago — la confirmación real llega después, de
// forma asíncrona, vía el webhook `mercadopago-webhook`.
//
// Precio: ARS 15.000 por campo activo al mes (decisión de producto,
// 2026-08-16) — ver planificador.md Etapa 6. PRICE_PER_FIELD_ARS está
// duplicado acá, en update-subscription-amount/index.ts y en
// apps/web/src/lib/subscription-status.ts — si cambia el precio hay que
// actualizar los 3 lugares y volver a desplegar.
//
// Body esperado: { "backUrl": string } — a dónde vuelve el usuario después
// de pagar (o cancelar) en Mercado Pago. Lo arma el cliente con
// `window.location.origin`, porque todavía no hay un dominio fijo de
// producción. IMPORTANTE (encontrado 2026-08-16 probando en local):
// Mercado Pago EXIGE que back_url empiece con https:// — rechaza http
// (incluido http://localhost, que es lo que manda `npm run dev` en
// desarrollo) con "Invalid value for back_url, must be a valid URL".
// Para probar este flujo de punta a punta hace falta un dominio con HTTPS
// real (deploy en Vercel) o un túnel https a localhost (ngrok, etc.) — no
// hay forma de evitarlo, es una validación del lado de Mercado Pago.
//
// Header requerido: Authorization: Bearer <jwt del usuario admin>
//
// Deploy: supabase functions deploy create-subscription
// Variables de entorno (ya provistas automáticamente por Supabase en
// runtime, salvo MP_ACCESS_TOKEN que ya está cargado como secret):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, MP_ACCESS_TOKEN

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
  const caller = authData.user;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: callerProfile, error: callerProfileError } = await admin
    .from("users")
    .select("organization_id, role")
    .eq("id", caller.id)
    .single();

  if (callerProfileError || !callerProfile) {
    return errorResponse("FORBIDDEN", "El usuario no pertenece a ninguna organización");
  }
  if (callerProfile.role !== "admin") {
    return errorResponse("FORBIDDEN", "Solo un admin puede gestionar la suscripción");
  }

  let body: { backUrl?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Body inválido, se esperaba JSON");
  }

  const backUrl = body.backUrl?.trim();
  if (!backUrl || !/^https:\/\//.test(backUrl)) {
    return errorResponse(
      "VALIDATION_ERROR",
      "La URL de retorno tiene que empezar con https:// — Mercado Pago no acepta http (por ejemplo, http://localhost en desarrollo). Probá desde un dominio con HTTPS (deploy en Vercel) o un túnel https a tu servidor local.",
    );
  }

  const [{ data: organization }, { data: subscription }, { count: fieldsCount }] =
    await Promise.all([
      admin.from("organizations").select("name").eq("id", callerProfile.organization_id).single(),
      admin
        .from("subscriptions")
        .select("status")
        .eq("organization_id", callerProfile.organization_id)
        .maybeSingle(),
      admin
        .from("fields")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", callerProfile.organization_id)
        .is("deleted_at", null),
    ]);

  if (subscription?.status === "active") {
    return errorResponse("CONFLICT", "Ya tenés una suscripción activa");
  }

  const activeFields = fieldsCount ?? 0;
  if (activeFields === 0) {
    return errorResponse("VALIDATION_ERROR", "Cargá al menos un campo antes de suscribirte");
  }

  const amount = PRICE_PER_FIELD_ARS * activeFields;

  const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `Agronotes - Suscripción mensual (${organization?.name ?? "Agronotes"})`,
      external_reference: callerProfile.organization_id,
      payer_email: caller.email,
      back_url: backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "ARS",
      },
    }),
  });

  if (!mpResponse.ok) {
    const errorBody = await mpResponse.text();
    console.error("Mercado Pago rechazó la creación de la preapproval:", mpResponse.status, errorBody);
    let mpMessage: string | undefined;
    try {
      mpMessage = JSON.parse(errorBody)?.message;
    } catch {
      // errorBody no era JSON, seguimos con el mensaje genérico.
    }
    return errorResponse(
      "INTERNAL_ERROR",
      mpMessage
        ? `Mercado Pago rechazó la solicitud: ${mpMessage}`
        : "Mercado Pago no pudo crear la suscripción, intentá de nuevo",
    );
  }

  const preapproval = await mpResponse.json();
  const checkoutUrl: string | undefined = preapproval.init_point ?? preapproval.sandbox_init_point;

  if (!checkoutUrl) {
    console.error("Preapproval creada sin init_point:", JSON.stringify(preapproval));
    return errorResponse("INTERNAL_ERROR", "Mercado Pago no devolvió una URL de pago");
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({
      provider: "mercado_pago",
      provider_subscription_id: preapproval.id,
      contracted_fields_count: activeFields,
    })
    .eq("organization_id", callerProfile.organization_id);

  if (updateError) {
    console.error("No se pudo guardar provider_subscription_id (no bloqueante):", updateError.message);
  }

  return jsonResponse({ checkoutUrl, amount, fieldsCount: activeFields }, 200);
});
