// supabase/functions/mercadopago-webhook/index.ts
//
// Recibe las notificaciones de "preapproval" (suscripción recurrente) de
// Mercado Pago y actualiza public.subscriptions. Tiene que ser un Edge
// Function sí o sí: es un endpoint HTTP público que Mercado Pago llama
// directamente, no algo que el cliente de la app dispare.
//
// Configuración necesaria en Mercado Pago (Tus integraciones > Webhooks):
//   URL: https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook
//   Eventos: "Suscripciones" (preapproval)
// Ahí mismo Mercado Pago te da el "Secret" para validar x-signature.
//
// Variables de entorno a configurar (supabase secrets set):
//   MP_ACCESS_TOKEN   -> access token privado de la cuenta de Mercado Pago
//   MP_WEBHOOK_SECRET -> secret de firma del webhook (NO es el access token)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY -> ya provistas en runtime
//
// Validación de x-signature: implementada según la documentación oficial
// de Mercado Pago (manifest "id:{data.id};request-id:{x-request-id};ts:{ts};"
// firmado con HMAC-SHA256 usando el webhook secret). Válido a agosto 2026;
// si Mercado Pago cambia el formato, revisar
// https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
// antes de asumir que esto sigue funcionando igual.
//
// Requisito de negocio (Etapa 2/CLAUDE.md): esta tabla no tiene policies
// de insert/update para el cliente — solo la service role, que se usa
// acá, puede tocarla.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/responses.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// preapproval.status (Mercado Pago) -> subscriptions.status (nuestro)
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
    // Mercado Pago manda notificaciones de prueba sin data.id al validar
    // la URL — respondemos 200 para no romper esa verificación.
    return jsonResponse({ received: true, ignored: "no data.id" }, 200);
  }

  const validSignature = await isValidSignature(req, dataId);
  if (!validSignature) {
    return errorResponse("UNAUTHENTICATED", "Firma x-signature inválida");
  }

  if (type && type !== "preapproval" && type !== "subscription_preapproval") {
    // no es un evento de suscripción (puede ser un pago suelto u otro
    // tipo de notificación) — lo confirmamos y no hacemos nada más.
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

  return jsonResponse({ received: true, organizationId, status }, 200);
});
