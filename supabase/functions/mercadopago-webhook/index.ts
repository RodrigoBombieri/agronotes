// supabase/functions/mercadopago-webhook/index.ts
//
// Recibe las notificaciones de "preapproval" (suscripción recurrente) de
// Mercado Pago y actualiza public.subscriptions. verify_jwt=false porque
// Mercado Pago no manda un JWT de Supabase — la autenticación es propia,
// vía x-signature.
//
// Algoritmo de x-signature verificado contra los ejemplos oficiales del
// SDK de Mercado Pago (docs, agosto 2026): HMAC-SHA256 sobre el manifest
// "id:{data.id};request-id:{x-request-id};ts:{ts};" usando el webhook
// secret. Ver planificador.md Etapa 3 para el detalle de la verificación
// y una nota importante sobre el botón "Simular" de Mercado Pago.
//
// Configuración necesaria en Mercado Pago (Tus integraciones > Webhooks):
//   URL: https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook
//   Eventos: "Suscripciones" (preapproval)
//
// Variables de entorno (supabase secrets set):
//   MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY -> ya provistas en runtime
//
// Etapa 6 (2026-08-16): además de actualizar subscriptions, cada
// notificación válida se guarda tal cual (payload crudo de MP) en
// payment_events, para tener historial real de pagos en el panel
// superadmin — antes solo quedaba el estado actual, sin rastro de cómo se
// llegó ahí. Un fallo al guardar el evento se loguea pero NO hace fallar
// la respuesta al webhook (lo crítico es que subscriptions haya quedado
// bien actualizada; el historial es una mejora, no debe bloquear a MP).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "./_shared/responses.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const STATUS_MAP: Record<string, string> = {
  authorized: "active",
  paused: "past_due",
  cancelled: "canceled",
  pending: "trialing",
};

async function isValidSignature(req: Request, dataId: string): Promise<boolean> {
  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim()];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const computed = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === v1;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("VALIDATION_ERROR", "Método no soportado, usar POST");
  }

  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

  if (!dataId) {
    return jsonResponse({ received: true, ignored: "no data.id" }, 200);
  }

  const validSignature = await isValidSignature(req, dataId);
  if (!validSignature) {
    return errorResponse("UNAUTHENTICATED", "Firma x-signature inválida");
  }

  if (type && type !== "preapproval" && type !== "subscription_preapproval") {
    return jsonResponse({ received: true, ignored: `type=${type}` }, 200);
  }

  const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });

  if (!mpResponse.ok) {
    return errorResponse("INTERNAL_ERROR", `Mercado Pago API respondió ${mpResponse.status}`);
  }

  const preapproval = await mpResponse.json();
  const organizationId: string | undefined = preapproval.external_reference;
  const mpStatus: string | undefined = preapproval.status;

  if (!organizationId) {
    return errorResponse("VALIDATION_ERROR", "preapproval sin external_reference (organization_id)");
  }

  const status = STATUS_MAP[mpStatus ?? ""] ?? "past_due";

  const { error } = await admin
    .from("subscriptions")
    .update({
      status,
      provider_customer_id: preapproval.payer_id ? String(preapproval.payer_id) : null,
      provider_subscription_id: dataId,
      current_period_end: preapproval.next_payment_date ?? null,
    })
    .eq("organization_id", organizationId);

  if (error) {
    return errorResponse("INTERNAL_ERROR", `No se pudo actualizar subscriptions: ${error.message}`);
  }

  // Historial crudo para el panel superadmin — no bloquea la respuesta si falla.
  const { error: logError } = await admin.from("payment_events").insert({
    organization_id: organizationId,
    provider: "mercado_pago",
    provider_event_id: dataId,
    resulting_status: status,
    raw_payload: preapproval,
  });
  if (logError) {
    console.error("No se pudo guardar payment_events (no bloqueante):", logError.message);
  }

  return jsonResponse({ received: true, organizationId, status }, 200);
});
